// Vercel Serverless Function: /api/mark-sent
//
// Can be triggered two ways:
//
// 1. GET  /api/mark-sent?pageId=xxx&secret=yyy
//    Returns an HTML success page. Used by Notion formula column (free plan-friendly).
//
// 2. POST /api/mark-sent { pageId, secret }
//    Returns JSON. Used by Notion button webhook (requires paid Notion plan).
//
// Both paths update Notion: increment Touch count, clear Current Draft,
// schedule Next touch date. If last touch in sequence, marks Track as Dead.
//
// Env vars:
//   CRON_SECRET               — shared secret
//   NOTION_TOKEN              — Notion integration secret

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

// Absolute-day schedule from submission — used to compute Next touch date
const COLD_SCHEDULE = { 1: 3, 2: 10, 3: 17, 4: 24 };
const HOT_SCHEDULE = { 1: 1, 2: 3, 3: 7, 4: 10, 5: 14 };

// When last touch is sent, grace + kill schedule (days from last touch)
const COLD_KILL_GRACE = 1; // Touch 4 sent Day 24 → Dead Day 25
const HOT_KILL_GRACE = 2;  // Touch 5 sent Day 14 → Dead Day 16

function htmlResponse(res, status, bodyHtml) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(status).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Mark Sent</title>
<style>
body{font-family:system-ui,sans-serif;background:#0a0a0b;color:#e4e4e7;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px;line-height:1.6}
.card{background:#111113;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center}
.ok{color:#4ade80;font-size:48px;margin-bottom:12px}
.err{color:#f87171;font-size:48px;margin-bottom:12px}
h1{font-size:22px;margin:0 0 12px 0;color:#fff;font-weight:600}
p{color:#a1a1aa;margin:0 0 8px 0;font-size:14px}
.small{color:#8a8a93;font-size:12px;margin-top:16px}
</style></head><body><div class="card">${bodyHtml}</div></body></html>`);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const isGet = req.method === 'GET';
  const isPost = req.method === 'POST';

  if (!isGet && !isPost) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let pageId, secret;

    if (isGet) {
      pageId = req.query.pageId;
      secret = req.query.secret;
    } else {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      pageId = body.pageId;
      secret = body.secret;
    }

    if (secret !== CRON_SECRET) {
      if (isGet) {
        return htmlResponse(res, 401, `<div class="err">❌</div><h1>Unauthorized</h1><p>Secret mismatch. Check the Notion formula column.</p>`);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!pageId) {
      if (isGet) {
        return htmlResponse(res, 400, `<div class="err">❌</div><h1>Missing pageId</h1>`);
      }
      return res.status(400).json({ error: 'Missing pageId' });
    }

    // Fetch lead data from Notion
    const leadRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!leadRes.ok) {
      const err = await leadRes.text();
      if (isGet) return htmlResponse(res, 500, `<div class="err">❌</div><h1>Notion fetch error</h1><p class="small">${err.slice(0, 200)}</p>`);
      return res.status(500).json({ error: `Notion fetch error: ${err}` });
    }

    const lead = await leadRes.json();
    const props = lead.properties;

    const track = props.Track?.select?.name;
    const touchCount = props['Touch count']?.number || 0;
    const email = props.Email?.title?.[0]?.text?.content || '';

    if (track !== 'Cold' && track !== 'Hot') {
      if (isGet) return htmlResponse(res, 400, `<div class="err">⚠️</div><h1>Cannot mark sent</h1><p>Track is "<strong>${track}</strong>" (expected Cold or Hot).</p><p class="small">Either this lead is already Dead/Promoted, or not a nurture prospect.</p>`);
      return res.status(400).json({
        error: `Cannot mark-sent: Track is "${track}" (expected Cold or Hot)`,
      });
    }

    const nextTouchCount = touchCount + 1;
    const schedule = track === 'Cold' ? COLD_SCHEDULE : HOT_SCHEDULE;
    const maxTouch = track === 'Cold' ? 4 : 5;
    const killGrace = track === 'Cold' ? COLD_KILL_GRACE : HOT_KILL_GRACE;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute next touch date (or grace date if this was the last touch)
    let nextTouchDate;
    let newTrack = track; // usually unchanged
    let isLastTouch = false;

    if (nextTouchCount >= maxTouch) {
      // This was the last scheduled touch. Grace period, then Dead.
      const graceDate = new Date();
      graceDate.setDate(today.getDate() + killGrace);
      nextTouchDate = graceDate.toISOString().split('T')[0];
      isLastTouch = true;
      // Don't mark Dead yet — wait for next cron cycle to see Next touch date expired and kill
      // Actually: simpler to mark Dead immediately. No more drafts to generate.
      newTrack = 'Dead';
    } else {
      // Schedule next touch based on absolute day from submit
      // Touch count is incrementing; look up the NEXT touch number's day offset
      const daysToAdd =
        schedule[nextTouchCount + 1] - schedule[nextTouchCount];
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + daysToAdd);
      nextTouchDate = nextDate.toISOString().split('T')[0];
    }

    // Update Notion
    const updateProps = {
      'Touch count': { number: nextTouchCount },
      'Last touch date': { date: { start: todayStr } },
      'Next touch date': { date: { start: nextTouchDate } },
      'Current Draft': { rich_text: [{ text: { content: '' } }] },
      'Draft ready': { checkbox: false },
      Status: { select: { name: nextTouchCount >= 1 ? 'Contacted' : 'New' } },
    };

    if (newTrack !== track) {
      updateProps.Track = { select: { name: newTrack } };
    }

    const patchRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: updateProps }),
    });

    if (!patchRes.ok) {
      const err = await patchRes.text();
      if (isGet) return htmlResponse(res, 500, `<div class="err">❌</div><h1>Notion update failed</h1><p class="small">${err.slice(0, 200)}</p>`);
      return res.status(500).json({ error: `Notion patch error: ${err}` });
    }

    if (isGet) {
      const deadBanner = isLastTouch
        ? `<p style="color:#fbbf24;margin-top:16px">This was the final touch. Lead marked <strong>Dead</strong>.</p>`
        : `<p>Next touch scheduled for <strong>${nextTouchDate}</strong>.</p>`;
      return htmlResponse(res, 200, `<div class="ok">✓</div><h1>Sent logged</h1>
        <p>${email || 'Lead'} · Touch ${nextTouchCount}/${newTrack === 'Dead' && isLastTouch ? nextTouchCount : (track === 'Cold' ? 4 : 5)}</p>
        ${deadBanner}
        <p class="small">You can close this tab. Notion row updated.</p>`);
    }

    return res.status(200).json({
      success: true,
      track: newTrack,
      touchCount: nextTouchCount,
      nextTouchDate,
      isLastTouch,
    });
  } catch (err) {
    console.error('mark-sent error:', err);
    if (req.method === 'GET') {
      return htmlResponse(res, 500, `<div class="err">❌</div><h1>Error</h1><p class="small">${err.message || 'Unknown error'}</p>`);
    }
    return res.status(500).json({ error: err.message });
  }
}
