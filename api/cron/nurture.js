// Vercel Serverless Function: /api/cron/nurture
//
// Daily cron (runs 07:00 UTC = 08:00 Zagreb summer / 08:00 CET winter).
// Drafts next nurture email/LinkedIn message for every lead due today.
// Writes drafts to Notion `Current Draft` field + sets `Draft ready = true`.
// David sends manually from Gmail, then clicks "Mark Sent" button in Notion.
//
// COLD track (C/D/F grades): uses NURTURE_LIBRARY templates — cheap, deterministic
// HOT track (A/B grades): calls Claude Sonnet for custom personalized drafts
//
// Env vars required:
//   CRON_SECRET               — protects endpoint from unauthorized calls
//   NOTION_TOKEN              — Notion integration secret
//   NOTION_SCORECARD_DB_ID    — 6a1c7edb-cd67-4f34-8e84-3bd36b40bef3
//   ANTHROPIC_API_KEY         — Claude API for Hot drafts

import {
  NURTURE_LIBRARY,
  touch4ExitEmail,
} from '../../content/nurture-library.js';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_SCORECARD_DB_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Day offset from submission for each touch
const COLD_SCHEDULE = { 1: 3, 2: 10, 3: 17, 4: 24 };
const HOT_SCHEDULE = { 1: 1, 2: 3, 3: 7, 4: 10, 5: 14 };
const HOT_CHANNELS = { 1: 'Email', 2: 'LinkedIn', 3: 'Email', 4: 'LinkedIn', 5: 'Email' };

// Category lookup — maps Q1-Q10 to category names (must match scorecard)
const QUESTION_TO_CATEGORY = {
  Q1: 'ICP Clarity',
  Q2: 'Prospecting',
  Q3: 'Lead Scoring',
  Q4: 'Personalization',
  Q5: 'Reply Rates',
  Q6: 'Founder Dependency',
  Q7: 'Follow-Up',
  Q8: 'CRM',
  Q9: 'Research Time',
  Q10: 'Pipeline Capacity',
};

export default async function handler(req, res) {
  // Vercel Cron passes Authorization: Bearer {CRON_SECRET}
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];
  const result = { processed: 0, cold: 0, hot: 0, errors: [] };

  try {
    // Query Notion for leads due today, Hot or Cold track, no draft ready yet
    const pages = await queryNotion({
      filter: {
        and: [
          { property: 'Next touch date', date: { equals: today } },
          {
            or: [
              { property: 'Track', select: { equals: 'Cold' } },
              { property: 'Track', select: { equals: 'Hot' } },
            ],
          },
          { property: 'Draft ready', checkbox: { equals: false } },
        ],
      },
    });

    for (const page of pages) {
      try {
        const track = page.properties.Track?.select?.name;
        if (track === 'Cold') {
          await processColdLead(page);
          result.cold++;
        } else if (track === 'Hot') {
          await processHotLead(page);
          result.hot++;
        }
        result.processed++;
      } catch (err) {
        console.error(`Error processing ${page.id}:`, err);
        result.errors.push({ pageId: page.id, error: err.message });
      }
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Cron handler fatal error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// --- COLD: template-based drafting ---

async function processColdLead(page) {
  const props = page.properties;
  const touchCount = props['Touch count']?.number || 0;
  const nextTouch = touchCount + 1;

  if (nextTouch > 4) {
    // Past Touch 4 — mark Dead (safety guard, shouldn't normally happen)
    return markDead(page.id);
  }

  const email = extractText(props.Email?.title);
  const company = extractText(props.Company?.rich_text) || '';
  const score = props.Score?.number || 0;
  const gradeTitle = extractText(props['Grade Title']?.rich_text) || '';
  const weakest = findWeakestCategory(props);

  const draft = composeColdDraft(nextTouch, {
    email,
    company,
    score,
    gradeTitle,
    weakestCategory: weakest,
  });

  await writeDraft(page.id, draft);
}

function composeColdDraft(touchNum, data) {
  const { email, company, score, gradeTitle, weakestCategory } = data;
  const lib = NURTURE_LIBRARY[weakestCategory] || NURTURE_LIBRARY['Personalization'];
  const firstNameGuess = email?.split('@')[0] || '';

  if (touchNum === 1) {
    return {
      subject: `${company || 'Your'} scorecard — your ${score}/100, unpacked`,
      body: `Hi,

You scored ${score}/100 on the scorecard. Grade ${gradeTitle}.

The signal that jumped out: ${weakestCategory} is your weakest category. That's the one that typically drags reply rate below 3% even when everything else is tight.

${lib.observation}

If you want to talk through what fixing this would look like: https://cal.com/david-mustac/gtmiq

No pitch, just a conversation about what I see in scores like yours.

David

--
David Mustac · GTMiQ
https://gtm-david.vercel.app
david@ascendia.ceo`,
    };
  }

  if (touchNum === 2) {
    return {
      subject: `${weakestCategory} — the pattern across founders at your stage`,
      body: `Following up on the scorecard. You scored low on ${weakestCategory}.

${lib.abTrait}

A Croatian HR-SaaS CEO — 23 employees, €5M raised, 15 years sales experience — replied to one cold message using the same methodology I'd recommend here. Not because the message was magic. Because research was real.

Happy to walk you through what that looks like for ${company || 'your team'} in 15 min: https://cal.com/david-mustac/gtmiq

David`,
    };
  }

  if (touchNum === 3) {
    return {
      subject: `A template for ${weakestCategory} (no ask)`,
      body: `Not going to pitch this one. Here's a template I use when working on ${weakestCategory} — works standalone, no tools required:

${lib.framework}

This is the core of what I'd build out in a Pilot. If you want the full version with the Claude agents + Notion workflow, reply and I'll send it.

Otherwise use it. It works.

David`,
    };
  }

  if (touchNum === 4) {
    return touch4ExitEmail(firstNameGuess, company);
  }

  throw new Error(`Invalid Cold touch number: ${touchNum}`);
}

// --- HOT: Claude-drafted personalized ---

async function processHotLead(page) {
  const props = page.properties;
  const touchCount = props['Touch count']?.number || 0;
  const nextTouch = touchCount + 1;

  if (nextTouch > 5) {
    return markDead(page.id);
  }

  const channel = HOT_CHANNELS[nextTouch];
  const leadData = {
    email: extractText(props.Email?.title),
    company: extractText(props.Company?.rich_text),
    score: props.Score?.number || 0,
    grade: extractText(props['Grade Title']?.rich_text),
    linkedinUrl: props['LinkedIn URL']?.url || '',
    answers: extractAllAnswers(props),
  };

  const draftText = await callClaude(leadData, nextTouch, channel);

  // Parse: first line with "Subject:" is subject, rest is body
  const parsed = parseDraftText(draftText, channel);

  await writeDraft(page.id, parsed, channel);
}

async function callClaude(leadData, touchNum, channel) {
  const systemPrompt = `You are David Mustač drafting outreach to a B2B SaaS founder who just submitted a scorecard on gtm-david.vercel.app.

HARD RULES (voice):
- No corporate buzzwords: leverage, utilize, synergy, touch base, circle back, excited to, thrilled
- No tricolons or adjective stacks
- Short sentences default, mix with medium
- Concrete examples, named tools, specific numbers
- No "I help companies like yours" or generic openers
- Use open questions only they can answer (Branimir pattern)

STRUCTURE (Branimir canonical pattern):
1. Research proof (reference specific thing from their scorecard)
2. Reframe upward (treat them as operator/peer, not target)
3. Strategic observation (something unusual about their score mix)
4. Open question only they can answer
5. Soft book-a-call CTA: https://cal.com/david-mustac/gtmiq (Email touches only; LinkedIn touches skip CTA)

FORBIDDEN: AI-speak, templates swappable for any name, pitch phrasing, "Just following up".`;

  const userPrompt = buildUserPrompt(leadData, touchNum, channel);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function buildUserPrompt(lead, touchNum, channel) {
  const answersList = Object.entries(lead.answers)
    .map(([q, a]) => `  ${q}: ${a}`)
    .join('\n');

  const weakest = findWeakestCategoryFromAnswers(lead.answers);

  const touchGuide = getTouchGuide(touchNum, channel);

  return `Lead data:
- Email: ${lead.email}
- Company: ${lead.company || 'not provided'}
- Score: ${lead.score}/100 (${lead.grade})
- Weakest category: ${weakest}
- LinkedIn: ${lead.linkedinUrl || 'not provided — do not reference LinkedIn content'}

Scorecard answers:
${answersList}

${touchGuide}

Draft the message now. Output format:
- For Email touches: first line "Subject: ..." then blank line then body
- For LinkedIn touches: output TWO blocks separated by a line "---DM---"
  - Block 1: Connection request note (max 300 chars)
  - Block 2: Follow-up DM (600-800 chars, full Branimir pattern)`;
}

function getTouchGuide(touchNum, channel) {
  if (touchNum === 1 && channel === 'Email') {
    return `Touch 1 — first custom email, Day 1 after scorecard submission.
GOAL: acknowledge their strongest category as reframe upward, call out weakest category with a specific observation, ask ONE specific question about how they currently handle the weak area.
LENGTH: 150-200 words.
INCLUDE CTA: yes, soft — "If you want to talk through what fixing this would look like: https://cal.com/david-mustac/gtmiq"`;
  }
  if (touchNum === 2 && channel === 'LinkedIn') {
    return `Touch 2 — LinkedIn connection request + follow-up DM, Day 3.
GOAL: connect and open conversation. NO pitch, NO CTA.
OUTPUT two blocks separated by "---DM---":
1. Connection note: max 300 chars. Brief. Reference something specific from their scorecard or company.
2. Follow-up DM: 600-800 chars. Branimir pattern — research proof + reframe + strategic observation + open question.`;
  }
  if (touchNum === 3 && channel === 'Email') {
    return `Touch 3 — email follow-up after no reply, Day 7.
GOAL: different angle from Touch 1. Reference an anonymized case study or an industry pattern. Ask a new question.
LENGTH: 130-180 words.
INCLUDE CTA: yes, soft.`;
  }
  if (touchNum === 4 && channel === 'LinkedIn') {
    return `Touch 4 — LinkedIn DM follow-up, Day 10.
GOAL: short, specific, one question referencing their scorecard answer. NO CTA.
LENGTH: 400-600 chars.
OUTPUT ONLY ONE block (no connection request needed — already connected from Touch 2).`;
  }
  if (touchNum === 5 && channel === 'Email') {
    return `Touch 5 — final polite exit email, Day 14.
GOAL: "last email from me" framing. Include the Branimir canonical DM inline as final gift. Warm exit, not pushy.
LENGTH: 200-250 words.
BRANIMIR CANONICAL TO INCLUDE INLINE (Croatian, verbatim):
---
bok Branimir,

Pročitao sam u Forbesu da Moontop raste 100%+ godišnje tri godine za redom. S klijentima kao United Group, Carwiz, Groupama, to više nije startup faza nego ozbiljna komercijalna mašina.

Ono što me zanima, kažeš da je fokus na jačanje prodaje i internacionalizaciju kroz franšizni model. Franšizni model za benefit platformu je neobičan izbor. Većina SaaS kompanija skalira direktno ili kroz partnere.

Kako ste došli do zaključka da je franšiza pravi put za internacionalizaciju i kako izgleda prodaja HR odjelima u novom tržištu gdje vas nitko ne poznaje?
---

Frame it as "cold message that got a Croatian HR-SaaS CEO (15 years sales experience, 23 employees, €5M raised) to reply 'Call me, let's meet.'" Then teach the 4-part pattern briefly.
NO CTA. End warmly.`;
  }
  return `Unknown touch/channel: ${touchNum}/${channel}`;
}

function parseDraftText(rawText, channel) {
  if (channel === 'LinkedIn') {
    // Output is raw LinkedIn text (possibly with ---DM--- separator)
    return { subject: `[LinkedIn - ${channel}]`, body: rawText.trim() };
  }

  // Email: first line should be "Subject: ..."
  const lines = rawText.split('\n');
  let subject = `GTMiQ follow-up`;
  let bodyStart = 0;

  const firstLine = lines[0]?.trim() || '';
  const subjectMatch = firstLine.match(/^Subject:\s*(.+)$/i);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    // Skip the subject line + any blank line after
    bodyStart = 1;
    while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
      bodyStart++;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  return { subject, body };
}

// --- Notion helpers ---

async function queryNotion(body) {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion query error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.results || [];
}

async function writeDraft(pageId, draft, channel) {
  // Store draft as "Subject: X\n\nBody..." for easy parsing by mark-sent
  const fullText = channel === 'LinkedIn'
    ? draft.body
    : `Subject: ${draft.subject}\n\n${draft.body}`;

  await patchNotionPage(pageId, {
    'Current Draft': {
      rich_text: [{ text: { content: fullText.slice(0, 2000) } }],
    },
    'Draft ready': { checkbox: true },
    'Last touch channel': { select: { name: channel || 'Email' } },
  });
}

async function markDead(pageId) {
  await patchNotionPage(pageId, {
    Track: { select: { name: 'Dead' } },
  });
}

async function patchNotionPage(pageId, properties) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion patch error ${res.status}: ${errText}`);
  }
  return res.json();
}

// --- Utilities ---

function extractText(rtArray) {
  if (!rtArray || !Array.isArray(rtArray) || rtArray.length === 0) return '';
  return rtArray[0]?.text?.content || rtArray[0]?.plain_text || '';
}

function extractAllAnswers(props) {
  const answers = {};
  for (let i = 1; i <= 10; i++) {
    const key = `Q${i}`;
    answers[key] = extractText(props[key]?.rich_text);
  }
  return answers;
}

function findWeakestCategory(props) {
  const answers = extractAllAnswers(props);
  return findWeakestCategoryFromAnswers(answers);
}

function findWeakestCategoryFromAnswers(answers) {
  let minScore = 11;
  let weakest = 'Personalization'; // default fallback

  for (const [q, category] of Object.entries(QUESTION_TO_CATEGORY)) {
    const answerText = answers[q] || '';
    const match = answerText.match(/\((\d+)\/10\)/);
    if (match) {
      const score = parseInt(match[1], 10);
      if (score < minScore) {
        minScore = score;
        weakest = category;
      }
    }
  }
  return weakest;
}
