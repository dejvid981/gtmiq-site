# GTMiQ Site — Conversion & Analytics Optimization

## Context

The GTMiQ landing page (gtm-david.vercel.app) is live but lacks funnel analytics. We can't see where users drop off in the scorecard, which CTA placement drives bookings, or whether the email gate is a net positive or a bounce trigger. The scorecard is the highest-value conversion asset — this design maximizes its effectiveness.

**Goals:** Maximize both email capture (leads) and Cal.com bookings (meetings). Add full funnel visibility so David can see exactly where users drop off and make data-driven improvements.

---

## 1. PostHog Integration

Add PostHog JS snippet (free tier: 1M events/mo, session replay, funnels, retention).

### Events to Track

| Event | Trigger | Properties |
|---|---|---|
| `page_viewed` | DOMContentLoaded | `referrer`, `utm_source`, `utm_medium`, `utm_campaign` |
| `cta_clicked` | Any Cal.com link clicked | `placement` (nav / hero / scorecard-results / pricing-sprint / pricing-retainer / bottom-cta / footer) |
| `scorecard_started` | First question renders (initScorecard) | — |
| `scorecard_question_answered` | selectOption() fires | `question_number`, `question_name`, `answer_index`, `score` |
| `scorecard_abandoned` | beforeunload while quiz active | `last_question`, `questions_completed` |
| `email_gate_viewed` | showEmailGate() fires | `total_score`, `grade` |
| `email_submitted` | submitGate() with valid email | `email`, `company`, `score`, `grade` |
| `email_skipped` | User clicks "Skip" on gate | `score`, `grade` |
| `results_viewed` | Results section renders | `score`, `grade`, `critical_gaps` |
| `results_cta_clicked` | CTA inside results clicked | `score`, `grade` |

### Funnel Definition (PostHog)

`page_viewed → scorecard_started → Q1_answered → Q2_answered → ... → Q10_answered → email_gate_viewed → (email_submitted | email_skipped) → results_viewed → cta_clicked`

---

## 2. Soft Email Gate

### Current Behavior
Email required. Results completely hidden until submission. Users who don't want to give email bounce — lost entirely.

### New Behavior
After Q10, show results immediately:
- Score circle (number + grade) — ALWAYS visible
- Category bars — ALWAYS visible
- Action plan (critical/high items) — LOCKED behind email

### UI Flow

**Step 1: Score + bars shown, action plan blurred**
```
[Score Circle: 42 / F]
[Category Bars visible]

─── Want your personalized action plan? ───
[Email input] [Company input]
[Unlock Full Action Plan →]
[Skip — I just needed the score]
```

**Step 2a: Email entered → full results + action plan + Cal.com CTA**
**Step 2b: Skipped → score + bars only, subtle "Enter email for action plan" below bars, Cal.com CTA still visible**

### Why This Works
- Users see value immediately (reduces bounce)
- Action plan is the "premium content" worth an email
- Even skippers see their score, feel engaged, and see the Cal.com CTA
- PostHog tracks both paths so we can measure conversion lift

---

## 3. CTA Attribution

Add `data-cta-placement` to all 7 Cal.com links:

```html
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="nav" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="hero" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="scorecard-results" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="pricing-sprint" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="pricing-retainer" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="bottom-cta" ...>
<a href="https://cal.com/david-mustac/gtmiq" data-cta-placement="footer" ...>
```

Single event listener on document captures all clicks on `[data-cta-placement]`.

---

## 4. UTM Handling

On page load, parse `window.location.search` for `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`. Pass as PostHog `$set_once` properties so all events from that session carry attribution. Also include in FormSubmit payload.

---

## Files to Modify

| File | Changes |
|---|---|
| `index.html` | Add PostHog snippet, `data-cta-placement` attrs, soft gate HTML, tracking JS |

Single file — no new dependencies.

---

## Verification

1. Open site, check PostHog receives `page_viewed` event
2. Click each Cal.com CTA → verify `cta_clicked` with correct `placement`
3. Complete scorecard → verify all 10 `scorecard_question_answered` events
4. Verify soft gate: score + bars show without email, action plan shows after email
5. Skip email → verify `email_skipped` event, results still show (without action plan)
6. Submit email → verify `email_submitted` event + FormSubmit receives data
7. Check PostHog funnel visualization works end-to-end
8. Verify UTM params propagate in events
