// content/nurture-library.js
//
// Personalized nurture content for cold drip (Touch 1-3).
// Keyed by category name — must match exactly the categories in scorecard.
//
// - observation: Touch 1, Day 3 (~60 words, specific example)
// - abTrait: Touch 2, Day 10 (~60 words, named tools/workflow)
// - framework: Touch 3, Day 17 (~100 words, inline template)

export const NURTURE_LIBRARY = {
  'ICP Clarity': {
    observation: `Most teams describe ICP as "B2B SaaS, 50-200 employees, Series A+." That's a search filter, not an ICP. Real ICP sounds like: "VP Sales at Series A horizontal SaaS, 80-150 employees, raised in last 9 months, hired 3+ AEs in last 60 days, no documented sales playbook in their hiring posts." That second one is scoreable. The first one returns 40,000 companies in Apollo. Big difference.`,
    abTrait: `A/B scorers run a weekly "lost deal post-mortem" and feed the patterns into a scoring sheet. Concretely: pull last 20 closed-won and 20 closed-lost from HubSpot, code each on 8 attributes (team size, funding stage, tech stack, hiring velocity, current tooling, decision-maker title, sales cycle, deal size), find the 3 attributes that separate won from lost. Those 3 become hard cutoffs in Apollo filters. Iterate monthly.`,
    framework: `Write your ICP using this 5-line structure. No paragraphs.

1. WHO buys (exact title + seniority): "VP Sales or Head of Revenue, hired in last 12 months"
2. COMPANY shape (size + stage + signal): "Series A or B SaaS, 50-200 FTE, raised in last 9 months"
3. TRIGGER (why now): "Hired 3+ AEs in last 60 days OR posted SDR role in last 30 days"
4. DISQUALIFIERS (hard no): "No outbound team yet / Founder still doing all sales / Under €1M ARR"
5. PROOF (won-deal example): "Like [Customer X] — same stage, same signal, closed in 21 days"

If you can't write line 5 with a real customer name, your ICP isn't validated yet. Keep selling, then write it.`,
  },

  'Prospecting': {
    observation: `Manual prospecting looks like: open Apollo Monday morning, set 4 filters, export 200 leads, hand to SDRs. Everyone's doing the same search. Your "prospects" are also on 14 other lists this week. Signal-based looks different: a Series B funding announcement on Tuesday triggers an n8n workflow that pulls the company, finds the VP Sales hired in last 90 days, drafts a research dossier — message goes out Wednesday morning. You're first, not 15th.`,
    abTrait: `A/B scorers wire signals into their pipeline instead of searching. Concretely: a Clay table watches Crunchbase funding rounds + LinkedIn job posts + G2 review velocity, filters by ICP cutoffs, enriches with Apollo, drops qualified accounts into HubSpot with a "fresh signal" tag. SDRs only work tagged accounts. Cold list goes from 2,000 stale companies to 40 freshly-triggered ones. Reply rates 3-5x higher because timing isn't accidental.`,
    framework: `Build your first signal stack this week. Pick 3 from this list:

- Funding announced (Crunchbase RSS, last 30 days)
- Senior sales hire posted (LinkedIn job posts, "VP Sales" OR "Head of Revenue")
- Tech stack change (BuiltWith alerts on competitor removal)
- G2 review surge (3+ negative reviews in 60 days = pain signal)
- Expansion to new market (LinkedIn posts mentioning "DACH" / "US launch")
- Headcount jump (LinkedIn shows +15% in 90 days)

Wire each into a Google Sheet via n8n or Clay. Run weekly. Anything matching 2+ signals = top priority for outreach. Anything matching 1 signal = research queue. Zero signals = ignore. This is the difference between hunting and farming.`,
  },

  'Lead Scoring': {
    observation: `Most teams score leads with vibes. "This one feels good." A real score sounds like: ICP fit (0-30), buying signal recency (0-25), seniority match (0-20), company momentum (0-15), tech stack overlap (0-10) = 100. A lead at 78 gets a hand-written message today. A lead at 42 gets dropped or queued. A lead at 12 gets deleted. Without numbers, your best SDR spends 2 hours on a 12.`,
    abTrait: `A/B scorers automate scoring before a human reads the lead. Concretely: an Apollo enrichment hits a Claude agent that reads the company website + last 5 LinkedIn posts from the buyer, returns a 0-100 score with 3-line justification, writes back to HubSpot. Anything under 60 auto-archives. Anything 60-80 goes to research queue. Anything 80+ skips the queue and lands in a slack channel for immediate human attention.`,
    framework: `Build a lead score in a spreadsheet today. 5 columns, weights below:

| Signal | Max | How to score |
|---|---|---|
| ICP title match | 30 | Exact match = 30, adjacent = 15, off = 0 |
| Company size in band | 20 | In = 20, ±25% = 10, off = 0 |
| Funding signal (last 9mo) | 20 | Yes = 20, No = 0 |
| Hiring signal (last 60d) | 15 | 3+ roles = 15, 1-2 = 8, none = 0 |
| Tech stack fit | 15 | Direct = 15, adjacent = 8, none = 0 |

Run last week's outbound list through it. The leads your team prioritized vs. what the score says — that gap is where you're burning time. Cut anything under 50 from next week's list. Reply rate goes up because you stopped messaging the wrong people.`,
  },

  'Personalization': {
    observation: `Most founders add \`{{first_name}}\` and think they've personalized. Real personalization references something that took >2 minutes to find — like 'I saw in your Series A announcement you mentioned scaling into DACH via partnerships, which is unusual for a \`{{team_size}}\`-person team.' That sentence can't be templated. If your message can, they pattern-match to 'sales DM' in 3 seconds and never reply.`,
    abTrait: `A/B scorers separate research from writing. A Claude agent reads the company's last funding announcement, scans the CEO's last 10 LinkedIn posts, and pulls one specific strategic detail — outputs a 4-line dossier. Human reads dossier, writes message in 3 minutes referencing the unusual detail. Tools in the loop: Apollo for enrichment, Clay for triggers, Claude API for synthesis, HubSpot for tracking. Zero generic openers ship.`,
    framework: `Use this 4-line message skeleton. Every line earns its place.

Line 1 — Specific proof you researched (source + metric + reframe):
"Read in [publication] you grew [metric] over [timeframe]. With customers like [X, Y, Z], that's not [old frame] anymore — it's [new frame]."

Line 2 — Strategic observation about an unusual choice:
"You mentioned [specific strategy]. That's an unusual call for a company at [stage] — most go [alternative path]."

Line 3 — A question only the founder/CEO could answer:
"How did you land on [specific choice], and what's the hardest part of [executing it]?"

Line 4 — Sign-off. No Calendly. No "happy to chat." Just your name.

If line 1 sources a press release, use a quote. If line 2 picks a generic detail, your research wasn't deep enough. Restart.`,
  },

  'Reply Rates': {
    observation: `Industry "good" reply rate is 3-5%. Teams celebrate hitting 8%. The math: at 8%, 50 messages = 4 replies = maybe 1 meeting. To hit 20 meetings/month you send 1,000 messages. That's a spam machine. A focused team sends 80 messages with 18% reply (14 replies) and books 6 meetings. Same pipeline outcome, 12x less volume, 12x less domain reputation damage. Volume isn't the lever. Quality of the first sentence is.`,
    abTrait: `A/B scorers track reply rate by message variant, not by channel. Concretely: Smartlead or Lemlist tags each sequence with the opener pattern (proof-led, question-led, observation-led, contrarian), reply rates aggregate weekly by pattern. Pattern below 6% reply = killed. Top pattern gets doubled down on. They also track reply *quality* — "interested" vs. "not now" vs. "unsubscribe" — because a 15% reply rate of all "unsubscribe" is worse than 4% of "tell me more."`,
    framework: `Run this 7-day reply-rate audit. Pull last 30 days of outbound from your sequencing tool.

1. Open spreadsheet. Columns: opener pattern, send count, open rate, reply rate, positive reply rate.
2. Code each sequence's opening into one bucket: proof, question, observation, compliment, pain, contrarian.
3. Sort by positive reply rate descending.
4. Anything below 4% positive = pause this week.
5. Top 2 patterns: write 5 new variants, A/B test next week.
6. Cross-reference reply rate with day-of-week sent. Tuesday 9-11am usually wins. Friday afternoon usually loses.
7. If your top pattern is below 8%, the issue isn't messaging — it's targeting. Go back to ICP.

Numbers diagnose. Don't redesign the email until you've seen the numbers.`,
  },

  'Founder Dependency': {
    observation: `If you stopped sending messages tomorrow, what percent of next month's pipeline disappears? If the answer is "most of it," you don't have a sales system, you have a founder doing sales. Common pattern: founder generates 80% of qualified meetings via personal LinkedIn and warm intros, two SDRs handle the other 20% with a sequence that nobody updates. The day the founder takes a vacation, pipeline drops 70%. That's not scaling — that's a single point of failure.`,
    abTrait: `A/B scorers document the founder's playbook before hiring SDRs. Concretely: the founder records 5 of their best Loom-walkthroughs of "how I found this lead and what I wrote and why," transcribes them with Whisper, feeds the transcripts into a Claude prompt that extracts the patterns. Output: a written playbook the SDR follows. Tools: Loom + Whisper + Claude + Notion. The SDR isn't replacing the founder's intuition — they're executing the founder's documented intuition.`,
    framework: `Copy this template. For 1 week, each salesperson logs every task at 15-min intervals:

09:00–09:15 — Opened Apollo, pulled 20 leads
09:15–09:30 — Researched lead #1 (Crunchbase)
09:30–09:45 — Researched lead #1 (LinkedIn)
09:45–10:00 — Drafted cold email, sent

Patterns emerge within 3 days. Tasks every rep repeats → your first workflows to encode. Tasks each rep does differently → where your best rep's process should become everyone's process. Don't skip — 90% of founders try to shortcut and fail.`,
  },

  'Follow-Up': {
    observation: `Industry data: 80% of sales need 5+ touches, 44% of reps quit after touch 1. The math is ugly. A team sending 100 cold emails with no follow-up gets ~3 replies. Same 100 with 6 well-spaced follow-ups gets 12-15 replies. Same effort upfront, 4x the result. The reason teams skip follow-ups is operational, not strategic — they don't have the system to track who got touch 3 on which day. So they default to touch 1 and pray.`,
    abTrait: `A/B scorers run a 6-touch sequence in Smartlead or Lemlist with hard rules: each touch must add new information, never just "bumping this" or "any thoughts?" Concretely: touch 2 = a relevant case study, touch 3 = a new market data point, touch 4 = a question reframe, touch 5 = a soft break-up, touch 6 = the actual breakup with an asset (a checklist, a teardown, a calculator). Each touch gets its own reply-rate metric. Worst-performing touch gets rewritten monthly.`,
    framework: `Build this 6-touch follow-up template today. Each touch separated by 4-5 business days.

Touch 1 (Day 0) — The research opener. Specific proof + question. No ask.
Touch 2 (Day 4) — Drop a relevant case study. "Saw this — reminded me of your [situation]." 1 paragraph max.
Touch 3 (Day 9) — A new data point or industry observation. Frame: "this might matter for you because…"
Touch 4 (Day 14) — Reframe the original question. "Maybe I asked the wrong thing — what's actually keeping [problem] alive at [Company]?"
Touch 5 (Day 20) — Soft break-up. "I'll stop after one more — should I?"
Touch 6 (Day 25) — Hard break-up with a gift. Send a checklist, a teardown, a tool — no ask. Often pulls the highest reply rate of the whole sequence.

Track reply rate per touch. The patterns will tell you where to invest more time.`,
  },

  'CRM': {
    observation: `Walk into most B2B teams: HubSpot has 14,000 contacts, half have no last-activity date past 2023, deal stages are inconsistent across reps, nobody trusts the pipeline number in the Monday meeting. A CRM nobody updates is worse than no CRM — it gives leadership false confidence. The real cost isn't the software fee, it's the wrong forecasting decisions made on dirty data. Teams hire 2 SDRs because the CRM showed pipeline that wasn't really there.`,
    abTrait: `A/B scorers automate CRM hygiene instead of asking reps to update fields. Concretely: a Smartlead → HubSpot Zapier flow logs every send, open, reply, and click as an activity automatically. A weekly n8n script flags any deal in stage >30 days with no activity and either auto-moves it to "stalled" or pings the rep. Notion + HubSpot sync handles call notes — rep speaks into Granola, structured fields land in HubSpot. Reps update zero fields manually. Data stays clean.`,
    framework: `Run this CRM cleanup in one afternoon.

1. Filter contacts with no activity in last 180 days. Tag "cold archive." Don't delete — reactivation lists matter.
2. Filter deals in current pipeline with no activity in last 30 days. Either: rep adds a next step today, or it moves to "stalled" stage.
3. Standardize 5 deal stages. Write 1-sentence definitions everyone agrees on. Pin in Slack.
4. Build 1 dashboard with 4 numbers: new deals this week, deals advanced this week, deals stalled this week, won/lost this week. Nothing else. Review every Monday.
5. Set 1 automation rule: any deal closed-won = auto-create renewal task at month 10.

Anything more is overengineering. Keep it boring. Keep it consistent.`,
  },

  'Research Time': {
    observation: `Watch a typical SDR research a lead: open LinkedIn (4 min), open the company site (3 min), check Crunchbase (5 min), copy bits into a doc (4 min), draft message (8 min). 24 minutes. Ten leads = a full day, no messages sent yet. The reason teams default to templated openers isn't laziness — it's that real research at this speed kills throughput. The fix isn't researching less. It's separating the research from the writing entirely.`,
    abTrait: `A/B scorers have agents doing the research BEFORE humans touch the message. Concretely: a Claude agent pulls the company's last funding round from Crunchbase, scans the CEO's last 10 LinkedIn posts, identifies one unusual strategic choice, and outputs a 5-line research dossier. Human reads the dossier + writes the message in 3 minutes. Total per-lead time: under 5. Not magic — just workflow.`,
    framework: `Build your first research agent this week. You don't need to code — n8n + Claude API or Clay + Claude can do it.

Inputs (per lead): LinkedIn URL, company URL, Crunchbase URL.
Agent task (Claude prompt):
"Read these 3 sources. Output exactly:
1. One sentence on company stage + last funding event
2. One sentence on a recent strategic move (acquisition, market expansion, product launch)
3. One sentence on something unusual or contrarian about their approach
4. One question only the CEO could answer about #3
5. One disqualifier (if any) — reason this might not be a fit"

Run on a batch of 50 leads overnight. Next morning, your team reads dossiers + writes messages. Per-lead time drops from 25 minutes to 5. Quality goes up because researchers (the agent) don't get tired.`,
  },

  'Pipeline Capacity': {
    observation: `Ask a founder "can you produce 50 qualified prospects by Friday?" The answer separates pipelines from luck. A real pipeline says: "yes — I'll pull from the funding-signal feed (12 fresh this week), the hiring-signal feed (18), the warm-intro list (8), and net-new ICP search (12). Done." A lucky pipeline says: "maybe — depends what's in Apollo this week." The first one knows where leads come from at any volume. The second one is hoping the universe sends some.`,
    abTrait: `A/B scorers maintain 3-5 separate lead sources running in parallel, each producing a known weekly volume. Concretely: source 1 = signal feed (Clay, ~30/week), source 2 = ICP search (Apollo, ~50/week), source 3 = warm intros (LinkedIn Sales Navigator + referral asks, ~10/week), source 4 = inbound from content (LinkedIn posts driving DMs, ~15/week). Each source tracked by source-attributed reply rate in HubSpot. When one dries up, the others carry. No single point of failure.`,
    framework: `Map your current pipeline sources today. One sheet, this format:

| Source | Weekly volume | Reply % | Cost per lead | Owner |
|---|---|---|---|---|
| Apollo ICP search | 50 | 4% | €0.40 | SDR 1 |
| Clay signal feed | 30 | 12% | €1.80 | Founder |
| Warm intros | 8 | 38% | €0 | Founder |
| LinkedIn inbound | 15 | 22% | €0 | Founder |

Two diagnostics:
1. If one source produces >60% of qualified meetings, that's a single point of failure. Build a second source this month.
2. If any source has reply rate under 4%, kill it or rework targeting. It's stealing time from the sources that work.

Goal: 4 sources, none doing more than 40% of pipeline, each producing predictable weekly volume. That's a system. Anything else is luck dressed up as strategy.`,
  },
};

// Branimir canonical DM — used in Touch 4 (Day 24 exit) for ALL cold leads
// regardless of category. Universal proof artifact.
export const BRANIMIR_CANONICAL = `bok Branimir,

Pročitao sam u Forbesu da Moontop raste 100%+ godišnje tri godine za redom. S klijentima kao United Group, Carwiz, Groupama, to više nije startup faza nego ozbiljna komercijalna mašina.

Ono što me zanima, kažeš da je fokus na jačanje prodaje i internacionalizaciju kroz franšizni model. Franšizni model za benefit platformu je neobičan izbor. Većina SaaS kompanija skalira direktno ili kroz partnere.

Kako ste došli do zaključka da je franšiza pravi put za internacionalizaciju i kako izgleda prodaja HR odjelima u novom tržištu gdje vas nitko ne poznaje?`;

// Touch 4 exit email template
export function touch4ExitEmail(firstName, company) {
  return {
    subject: `Last one from me — and a cold message that worked`,
    body: `Hi${firstName ? ' ' + firstName : ''},

I'll stop after this one. 24 days is enough time to know whether something's useful.

If the scorecard + my emails haven't clicked, fine — timing is the biggest factor in everything. Keep my email for when it does.

One last thing. This is the message that got a Croatian HR-SaaS CEO (15 years sales experience, 23 employees, €5M raised) to reply "Call me, let's meet." No hooks, no Calendly link, just a question:

---
${BRANIMIR_CANONICAL}
---

Notice what's in it: real research proof (source + metric + 3 customers), a reframe (not "startup" but "commercial machine"), a strategic observation about an unusual choice, and a question only the CEO could answer. No pitch.

Steal this pattern. It works.

David`,
  };
}
