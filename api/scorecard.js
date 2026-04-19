// Vercel Serverless Function: /api/scorecard
//
// Receives scorecard submissions from gtm-david.vercel.app
// and writes them as rows into the "Scorecard Submissions" Notion database.
//
// On submission:
//   1. Writes lead to Notion with Track = Hot (A/B) or Cold (C/D/F)
//   2. Sets Next touch date = tomorrow (Day 1)
//   3. Fires Apollo enrichment (non-blocking) to find LinkedIn URL by email
//
// Required environment variables:
//   NOTION_TOKEN              — Notion integration secret (ntn_... or secret_...)
//   NOTION_SCORECARD_DB_ID    — 6a1c7edb-cd67-4f34-8e84-3bd36b40bef3
//   APOLLO_API_KEY            — Apollo free-tier key (optional, graceful failure)
//
// The Notion integration must be shared with the Scorecard Submissions database.

export default async function handler(req, res) {
  // CORS — allow same-origin + explicit production domain
  res.setHeader('Access-Control-Allow-Origin', 'https://gtm-david.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = process.env.NOTION_SCORECARD_DB_ID;
  const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    console.error('Missing env vars:', {
      hasToken: !!NOTION_TOKEN,
      hasDbId: !!NOTION_DB_ID,
    });
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const data =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Parse "C - Patchwork Pipeline" → letter "C", title "Patchwork Pipeline"
    const gradeRaw = (data.grade || 'F - Unknown').toString();
    const gradeParts = gradeRaw.split(' - ');
    const gradeLetterRaw = gradeParts[0].trim().charAt(0).toUpperCase();
    const gradeLetter = ['A', 'B', 'C', 'D', 'F'].includes(gradeLetterRaw)
      ? gradeLetterRaw
      : 'F';
    const gradeTitle =
      gradeParts.length > 1 ? gradeParts.slice(1).join(' - ').trim() : '';

    // Track assignment: A/B = Hot, C/D/F = Cold
    const track = (gradeLetter === 'A' || gradeLetter === 'B') ? 'Hot' : 'Cold';

    // Next touch date = tomorrow (Day 1 of sequence)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextTouchDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Helper: truncate to 2000 chars (Notion rich_text limit) and wrap
    const rt = (content) => ({
      rich_text: [
        {
          text: {
            content: (content == null ? '' : String(content)).slice(0, 2000),
          },
        },
      ],
    });

    const payload = {
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Email: {
          title: [
            {
              text: {
                content: (data.email || 'unknown@unknown.com')
                  .toString()
                  .slice(0, 200),
              },
            },
          ],
        },
        Company: rt(data.company),
        Phone: rt(data.phone),
        Score: { number: Number(data.score) || 0 },
        Grade: { select: { name: gradeLetter } },
        'Grade Title': rt(gradeTitle),
        Submitted: {
          date: { start: data.timestamp || new Date().toISOString() },
        },
        Status: { select: { name: 'New' } },
        'Critical Gaps': { number: Number(data.criticalGaps) || 0 },
        // Nurture pipeline fields
        Track: { select: { name: track } },
        'Next touch date': { date: { start: nextTouchDate } },
        'Touch count': { number: 0 },
        // Q&A
        Q1: rt(data.q1),
        Q2: rt(data.q2),
        Q3: rt(data.q3),
        Q4: rt(data.q4),
        Q5: rt(data.q5),
        Q6: rt(data.q6),
        Q7: rt(data.q7),
        Q8: rt(data.q8),
        Q9: rt(data.q9),
        Q10: rt(data.q10),
        'UTM Source': rt(data.utm_source),
        'UTM Medium': rt(data.utm_medium),
        'UTM Campaign': rt(data.utm_campaign),
        Referrer: rt(data.referrer),
      },
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!notionRes.ok) {
      const errText = await notionRes.text();
      console.error('Notion API error:', notionRes.status, errText);
      return res
        .status(500)
        .json({ error: 'Notion API error', status: notionRes.status });
    }

    const notionPage = await notionRes.json();
    const pageId = notionPage.id;

    // Apollo enrichment (fire-and-forget, non-blocking)
    // Only for Hot leads to conserve free-tier credits
    if (APOLLO_API_KEY && data.email && track === 'Hot') {
      enrichWithApollo(data.email, pageId, NOTION_TOKEN).catch((err) => {
        console.warn('Apollo enrichment failed:', err.message);
      });
    }

    return res.status(200).json({ success: true, track });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}

// Apollo enrichment: email → LinkedIn URL, writes back to Notion
async function enrichWithApollo(email, pageId, notionToken) {
  const apolloRes = await fetch('https://api.apollo.io/v1/people/match', {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.APOLLO_API_KEY,
    },
    body: JSON.stringify({ email }),
  });

  if (!apolloRes.ok) {
    console.warn('Apollo API error:', apolloRes.status);
    return;
  }

  const apolloData = await apolloRes.json();
  const linkedinUrl = apolloData?.person?.linkedin_url;

  if (!linkedinUrl) {
    console.log('Apollo: no LinkedIn URL found for', email);
    return;
  }

  // Patch Notion page with LinkedIn URL
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        'LinkedIn URL': { url: linkedinUrl },
      },
    }),
  });

  console.log('Apollo: enriched', email, 'with', linkedinUrl);
}
