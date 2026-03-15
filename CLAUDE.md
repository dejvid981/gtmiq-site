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
- **Analytics:** Plausible (GDPR-friendly, no cookies)
- **Booking:** Cal.com — cal.com/david-mustac/gtmiq (7 links throughout the site)
- **Lead capture:** FormSubmit.co AJAX POST to dejvid814@gmail.com
- **Animations:** IntersectionObserver for `.fade-up` scroll reveals

## Site Sections (in order)
Nav → Hero → Social Proof (logos) → Problem → Results → How It Works → Who This Is For → Scorecard (interactive quiz) → Pricing → FAQ → Bottom CTA → Footer

## Design System (CSS Variables)
```css
--bg: #0a0a0b          /* Page background */
--bg-card: #111113      /* Card background */
--accent: #4ade80       /* Green accent */
--text: #e4e4e7         /* Primary text */
--text-dim: #a1a1aa     /* Secondary text */
--text-muted: #8a8a93   /* Tertiary text (WCAG AA compliant) */
```

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

## Pricing Tiers
1. **Outbound Audit** — $500 (lead magnet / entry point)
2. **Full Engine Build** — $4,000 (core offer, marked "Recommended")
3. **Engine + Operator** — $6,500/mo (done-for-you retainer)

## David's Positioning & Voice
- **Tagline:** "Your Product Works. Your Pipeline Doesn't."
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
- [ ] Create `og-image.png` (1200x630) for social sharing previews
- [ ] Write 4-touch outreach sequences for 50 AI startup target list
- [ ] Draft first 4 LinkedIn posts (Weeks 1-2 content calendar)
- [ ] Set up Vercel deployment (push to GitHub → auto-deploy)

## Commands / Workflows
- **LinkedIn content:** Use the `david-linkedin-voice` skill — it has David's exact tone and structure
- **Outreach/leads:** Use the `b2b-sales-workflow` skill for lead research and Telegram/X DM drafting
- **Site changes:** Edit index.html directly, test with `npx playwright` or a local server
