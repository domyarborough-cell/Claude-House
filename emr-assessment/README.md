# Careficient EMR Intelligence Assessment

A public web app where home health and hospice agencies answer questions about their current EMR and instantly get a scored gap analysis: where the EMR falls short, and how Careficient fills each gap. Content comes from *Evaluation_Checklist_2026.pdf*.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · react-three-fiber · Recharts · Anthropic API (server only) · @react-pdf/renderer · Vitest.

## Local setup

```bash
cd emr-assessment
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
npm test                     # scoring + encoding unit tests
npm run lint
npm run build && npm start   # production build
```

The app works with no environment variables. Without an API key the report uses template text, leads are logged but not sent to HubSpot, and "Email me this report" opens the visitor's mail app.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI text | Server-only. Used by `/api/report`, the report page and the PDF. Never sent to the browser. |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-opus-5-5`. `claude-haiku-5-5` is far cheaper per report. |
| `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_ID` | For CRM | Lead form submits to the HubSpot Forms API (see below). |
| `DEMO_URL` | Recommended | "Book a personalized demo" link. Score and top gaps are appended as a query parameter. |
| `DEMO_NOTES_PARAM` | No | Name of that query parameter (default `notes`), e.g. to match a HubSpot Meetings or Calendly field. |
| `GA4_ID` | No | GA4 measurement ID (`G-…`). Events: `assessment_start`, `profile_complete`, `section_complete`, `lead_submitted`, `demo_click`, `pdf_download`, `report_emailed`, `report_shared`. |
| `SITE_URL` | Production | Public URL for share links, Open Graph images and the PDF QR code. On Vercel it falls back to the production domain. |
| `RESEND_API_KEY`, `EMAIL_FROM` | No | Sends "Email me this report" through Resend. Without them the button falls back to `mailto:`. |

### HubSpot hidden fields

Create these contact properties and add them to the form as hidden fields so sales sees them in the CRM: `emr_assessment_score`, `emr_assessment_band`, `emr_assessment_top_gaps`, `emr_assessment_high_risk_gaps`, `emr_assessment_report_url`, `emr_assessment_programs`, `emr_assessment_locations`, `emr_assessment_states`, `emr_assessment_current_emr`. Standard fields used: `firstname`, `lastname`, `email`, `company`, `jobtitle`, `phone`. No patient information is collected anywhere.

## Editing content

All copy lives in **`content/evaluation.json`**:

- `sections[].items[]`: the 89 checklist items. `critical: true` items count 2x and are listed as high-risk gaps when missing. Each item has an `impact` (fallback impact text) and a `careficient` statement.
- `categories[]`: the 10 scored categories and which sections roll into each one.
- `scoreBands`, `ratingScale`, `frustrations`, `emrOptions`, `roles`, `caseStudy`, `company`, `templates`.

**Marketing review:** every Careficient statement is a draft with `"status": "TODO-REVIEW"`. `evidence` records where in the PDF it comes from. `checklist-only` means the PDF lists the capability but doesn't otherwise describe it, so confirm those with product. Change approved statements to `"approved"`. Set `settings.onlyApprovedStatements` to `true` to give the AI only approved statements.

**Open content questions (from the PDF):**
1. Score bands follow the brief (40–50 / 30–39 / 10–29), not the PDF's 31–50 / 23–31 / below 23.
2. The page-13 before/after chart has no data labels; its values were read from bar heights.
3. The "Regulatory Compliance 24%" description in the PDF talks about payments, not compliance.

If you add, remove or reorder checklist items, previously shared report links will decode differently, because answers are encoded in item order.

## How it works

- **Scoring** (`src/lib/scoring.ts`, pure and unit-tested): Yes = 1, Partially = 0.5, No = 0. "Not sure" is excluded and listed as "verify with your vendor". Critical items weigh 2x. Category coverage ≥90% scores 5, 75–89% 4, 50–74% 3, 25–49% 2, and below 25% 1. The total is the sum of the 10 category ratings (10–50). HOPE counts only for hospice programs. Scores are always computed in code, never by the AI.
- **Report links** (`src/lib/encode.ts`): the profile and answers are packed into the URL, so reports need no database and are reproducible. Contact details are never in the link.
- **AI narrative** (`src/lib/ai.server.ts`): the model receives the computed scores, the gaps, and only the Careficient statements from the content file. It returns zod-validated JSON (executive summary, per-gap impact, top-3 fit). Output that names a vendor or introduces a number not in the input is discarded field by field. Any failure, timeout or refusal falls back to template text, so the report always renders.
- **Rate limits** (`src/lib/ratelimit.ts`): per-IP, in memory, per serverless instance. Use a shared store such as Upstash if you need a global limit.
- **PDF** (`/api/pdf/[id]`): multi-page, vector charts, QR code to the demo link.
- **Open Graph** images for the site and for each report (score ring and band).

## Deploying to Vercel

1. Import the repository in Vercel and set **Root Directory** to `emr-assessment`.
2. Add the environment variables above (Production and Preview).
3. Deploy. The framework preset (Next.js), install command and build command are detected automatically.
