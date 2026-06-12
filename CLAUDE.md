# GTMiQ — Project Context

## What This Is
GTMiQ is **David Mustač's Fractional GTM Engineer** service. He builds AI-powered outbound engines for Web3 and AI startups (Seed to Series A) as fixed-scope, 4-week sprints.

**Live site:** https://gtm-david.vercel.app
**Deployed on:** Vercel (static single-file site)

## Project Structure
```
gtmiq-site/
├── index.html    ← The entire site (HTML + CSS + JS, single file, ~1800 lines)
├── CLAUDE.md     ← This file
└── og-image.png  ← TODO: needs to be created for social sharing
```

No framework, no build step, no dependencies. Pure vanilla HTML/CSS/JS.

## Tech Stack & Integrations
- **Fonts:** DM Sans (body), JetBrains Mono (code/stats), Instrument Serif (headings)
- **Analytics:** Plausible (GDPR-friendly, no cookies) + Vercel insights — both 404 on local serve, fine in prod
- **Booking:** Calendly — calendly.com/davidm98/meet-with-david (switched from Cal.com, commit bdd8a36)
- **Lead capture:** FormSubmit.co AJAX POST to dejvid814@gmail.com
- **Animations:** IntersectionObserver for `.fade-up` scroll reveals

## Site Sections (in order)
Nav → Hero → Social Proof (logos) → Problem → Results → How It Works → Who This Is For → Scorecard (interactive quiz) → Pricing → FAQ → Bottom CTA → Footer

## Design System — "Ascendia Paper" (since June 2026)
Full spec + master prompt: `GTMiQ-Cowork/docs/brand/GTMiQ-Premium-Brand-Prompt.md`
```css
--bg: #F5EFE6          /* Paper — warm off-white page background */
--bg-card: #FFFFFF      /* White cards lifted off Paper */
--accent: #0F3CC8       /* Cobalt — THE brand color (CTAs, numbers, links) */
--brass: #B8935E        /* Brass — hairlines, kickers, step numbers only */
--text: #0A1929         /* Ink — primary text */
--text-dim: #3F4D5C     /* Secondary text */
--text-muted: #555E6A   /* Tertiary text (WCAG AA on Paper) */
--shadow-s / --shadow-m /* Warm ink-tinted elevation — use on all cards */
```
Signature elements: brass-dash section kickers (`.section-label`), paper grain overlay (`body::after`), serif headline with one italic cobalt word, mono for all numbers. The old dark/green identity (`#0a0a0b` + `#4ade80`) is retired — never reintroduce it.

## Key JS Functions
- `toggleMobileMenu()` — hamburger nav with aria-expanded
- `selectOption(idx)` — scorecard answer selection + 400ms auto-advance
- `nextQuestion()` / `prevQuestion()` — scorecard navigation
- `submitGate()` — email validation → score calculation → FormSubmit POST → results render
- `toggleFaq(btn)` — accordion with aria-expanded

## Accessibility
Fully WCAG 2.1 AA compliant:
- Skip navigation link
- Semantic landmarks (main, nav, footer)
- All interactive elements are proper buttons with type="button"
- Focus-visible outlines on all focusable elements
- aria-expanded on FAQ and mobile menu toggles
- Screen-reader-only labels on form inputs
- All target="_blank" links have rel="noopener noreferrer"
- Color contrast ratios ≥ 4.5:1 for all text

## Pricing Tiers (current, EUR)
1. **Build & Handoff** — from €1,500 one-time (system + docs, team runs it)
2. **Build & Run** — from €3,500/mo, 3-month minimum (core offer, marked "Recommended")
3. **Monthly Retainer** — from €1,500/mo, cancel anytime (optional, only after Build & Run)

## David's Positioning & Voice
- **Tagline:** "Templates Don't Convert. Real Signals Do."
- **Tone:** Direct, no-BS, operator-first. Speaks from experience, not theory.
- **Background:** Growth operator at MasterBlox (Web3 growth agency). Built outbound systems for Seedify, Bitget, Hacken, and others.
- **Unique angle:** Uses Claude Code + n8n + AI scoring to build outbound. Not a consultant who hands off a doc — he builds the actual system.
- **Stats:** 8-15% cold reply rates (industry avg: 1-5%), 4-week delivery, 40+ projects

## Scorecard (Lead Qualification Quiz)
5 questions assessing the prospect's outbound readiness:
1. Current outbound status
2. ICP definition clarity
3. Messaging testing
4. CRM/tooling setup
5. Content/visibility

Scores map to 4 categories: Critical (0-5), Needs Work (6-10), Almost There (11-15), Dialed In (16-20). Each category shows relevant action items.

## Outstanding TODOs
- [x] Create `og-image.png` (1200x630) — regenerate anytime via `node .firecrawl/og-render.mjs` against a local server (source: `og.html`)
- [x] Pattern-library fragments in #results are REAL — translated + anonymized from the Moontop POC batch that earned warm replies (energy infra = Dalekovod, pharma = JGL, FMCG = Atlantic; sources in ln-sales-sequence skill references). If sectors shift, pull new fragments from real sent messages only.
- [ ] Swap About monogram for a real portrait photo (`<img class="about-portrait-img">` inside `.about-portrait-frame`)
- [ ] Write 4-touch outreach sequences for 50 AI startup target list
- [ ] Draft first 4 LinkedIn posts (Weeks 1-2 content calendar)
- [ ] Set up Vercel deployment (push to GitHub → auto-deploy)

## Commands / Workflows
- **LinkedIn content:** Use the `david-linkedin-voice` skill — it has David's exact tone and structure
- **Outreach/leads:** Use the `b2b-sales-workflow` skill for lead research and Telegram/X DM drafting
- **Site changes:** Edit index.html directly, test with `npx playwright` or a local server
