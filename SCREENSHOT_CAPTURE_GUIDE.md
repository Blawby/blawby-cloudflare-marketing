# Capturing Product Screenshots for Marketing Docs

This guide explains how to capture real product screenshots from the Blawby AI chatbot app and integrate them into marketing documentation.

## Prerequisites

### 1. Chatbot Repository

- Location: set `$BLAWBY_CHATBOT_REPO` to your local clone of `blawby-ai-chatbot`
  (e.g. `export BLAWBY_CHATBOT_REPO=~/repos/blawby-ai-chatbot`)
- Status: Must be configured with `.env` and `worker/.dev.vars` containing API keys and test credentials

### 2. Required Credentials (in `.env`)

Use a dedicated demo account for screenshots. Configure these values in the chatbot repo's `.env` file:

- `E2E_PRACTICE_SLUG=https://local.blawby.com/public/demo-owner-local`
- `E2E_OWNER_EMAIL=demo.owner.local@blawby.test`
- `E2E_OWNER_PASSWORD=...`
- `E2E_CLIENT_EMAIL=demo.client.local@blawby.test`
- `E2E_CLIENT_PASSWORD=...`

Do not use personal emails in screenshot environments. Check the `.env` file directly for current credentials and do not hardcode secrets in documentation.

## Starting the Dev Environment

### 1. Start the full dev stack

```bash
cd $BLAWBY_CHATBOT_REPO  # or your local path to blawby-ai-chatbot
npm run dev:full
```

This runs three processes concurrently:

- **Frontend** (Vite): `http://localhost:5137/`
- **Worker** (Wrangler): `http://localhost:8787`
- **Tunnel** (cloudflared): Maps `https://local.blawby.com` → localhost:5137

### 2. Wait for startup

Output should show:

```text
[0] ➜  Local:   http://localhost:5137/
[1] [wrangler:info] Ready on http://localhost:8787
[2] INF Registered tunnel connection
```

## Accessing the App

### Production-like environment

Use the tunnel URL (not localhost):

```text
https://local.blawby.com
```

**Why:** The app is configured to route to `https://staging-api.blawby.com` for auth/backend, and the tunnel bridges local dev with the staging API.

### Login to the Practice Dashboard

1. Navigate to `https://local.blawby.com`
2. You'll be redirected to `/auth` (login page)
3. Use the demo owner credentials from the chatbot repo's `.env` file (`E2E_OWNER_EMAIL` and `E2E_OWNER_PASSWORD`)
4. You'll be logged in to the practice dashboard

## Capturing Screenshots

### Key Routes to Screenshot

#### **Dashboard & Onboarding**

- **Route**: `/practice/{practiceSlug}` (home dashboard)
- **What to capture**: Dashboard header, get-started cards, cashflow summary, recent intakes
- **Size**: 1920×1080 or 1280×720 (16:9)
- **File**: Save as `public/media/docs/onboarding/dashboard-after-setup.png`

#### **Intake Queue**

- **Route**: `/practice/{practiceSlug}/intakes` (intake list view)
- **What to capture**: Queue of submissions with filters, urgency badges, client summaries
- **File**: `public/media/docs/intake/queue.png`

#### **Intake Detail**

- **Route**: `/practice/{practiceSlug}/intakes/{id}` (single intake)
- **What to capture**: Annotated detail page with case summary, urgency badge, custom fields
- **Annotations**: Mark ①②③ on key sections
- **File**: `public/media/docs/intake/detail-page-annotated.png`

#### **Intake Templates**

- **Route**: `/practice/{practiceSlug}/intake-templates` (template editor)
- **What to capture**:
  - Template list view
  - Field editor with required/enrichment toggles and conditional logic
- **Annotations**: Mark required toggle ①, enrichment toggle ②, dependsOn selector ③
- **Files**:
  - `public/media/docs/intake/template-list.png`
  - `public/media/docs/intake/field-editor-annotated.png`

#### **Matters**

- **Route**: `/practice/{practiceSlug}/matters/{id}` (matter detail)
- **What to capture**:
  - Matter detail panel with tabs (Overview, Work, Billing, Files, Notes, Activity, Settings)
  - Billing tab with unbilled summary
  - Time entry form
  - Generate invoice CTA
- **Files**:
  - `public/media/docs/matters/tabs-annotated.png`
  - `public/media/docs/matters/billing-unbilled-summary.png`
  - `public/media/docs/matters/time-entry-form.png`

#### **Chat/Conversations**

- **Route**: `/practice/{practiceSlug}/matters/{id}/chat` or conversation thread
- **What to capture**: Message thread, file attachment, paralegal analysis streaming, quick-reply suggestions
- **File**: `public/media/docs/chat/conversation-walkthrough.png`

#### **Engagements**

- **Route**: `/practice/{practiceSlug}/engagements` (list) or engagement detail
- **What to capture**:
  - Create engagement dialog
  - Representation section with included/excluded services
  - Draft editor with four sections (representation, fees, risk review, acknowledgments)
- **Files**:
  - `public/media/docs/engagements/walkthrough.png`
  - `public/media/docs/engagements/representation-section.png` (if available)
  - `public/media/docs/engagements/draft-editor.png` (if available)

#### **Settings & Payments**

- **Route**: `/practice/{practiceSlug}/settings/payments`
- **What to capture**: Stripe Connect checkpoint cards, account linking status
- **File**: `public/media/docs/payments/stripe-checkpoints.png`

### Taking the Screenshot

#### Using Playwright (programmatic)

```typescript
// In scripts or tests
// Replace {practiceSlug} with the slug from E2E_PRACTICE_SLUG
await page.goto("https://local.blawby.com/practice/demo-law-firm/intakes");
await page.screenshot({
  path: "public/media/docs/intake/queue.png",
  fullPage: false,
});
```

#### Using Browser DevTools (manual)

1. In VS Code's integrated browser, open the page
2. Press F12 or use browser DevTools
3. Use "Capture screenshot" or use Playwright recorder
4. Save to appropriate `public/media/docs/` subdirectory

### Screenshot Conventions

- **Format**: PNG
- **Dimensions**: 1920×1080 or 1280×720 (16:9 aspect ratio)
- **Theme**: Light theme by default
- **Test data**: Use realistic but obviously-fake names (e.g., "Acme Demo Client", "Test Matter")
- **PII**: Strip any sensitive information before committing
- **Annotations**: Use numbered callouts (①②③) with a legend below

## Updating Marketing Docs

### 1. Replace DocPlaceholder with Image

**Before:**

```mdx
<DocPlaceholder
  kind="screenshot"
  src="/media/docs/intake/queue.png"
  description="IntakesPage queue with several submissions, urgency badges, and the New filter active."
/>
```

**After:**

```mdx
<Image
  src="/media/docs/intake/queue.png"
  alt="Intake queue showing multiple client submissions with urgency badges and date filters"
  width={1920}
  height={1080}
/>
```

### 2. Add Alt Text

Always include descriptive alt text:

- Describe what the user sees
- Mention key UI elements or features
- Keep it concise but informative

### 3. Update PLACEHOLDER-CHECKLIST.md

Mark completed items with `[x]`:

```markdown
- [x] `public/media/docs/intake/queue.png` — IntakesPage queue with submissions
```

## Common Issues & Solutions

### App won't start

```bash
# Make sure you're in the right directory
cd $BLAWBY_CHATBOT_REPO  # or your local path to blawby-ai-chatbot

# Verify .env and worker/.dev.vars exist with all keys
npm run dev:full
```

### Tunnel error: "Cannot determine default origin certificate path"

- This is a warning, not a blocker. Tunnel continues and connects successfully.
- Ignore unless connection fails.

### Login fails with network error

- Verify you're using `https://local.blawby.com` (not `http://localhost:5137`)
- Check that `BACKEND_API_URL=https://staging-api.blawby.com` in `.env`
- Ensure worker/dev.vars is configured

### Can't find a specific feature/page

1. Check `src/features/` in chatbot repo for page structure
2. Navigate via the UI from dashboard
3. Consult [PLACEHOLDER-CHECKLIST.md](./public/media/docs/PLACEHOLDER-CHECKLIST.md) for what routes exist

## Automation with Playwright

For batch screenshots or multi-step flows (e.g., full intake submission → chat), use the chatbot repo's test infrastructure:

```bash
# From chatbot repo
npm run test:conversation  # Runs core AI conversation tests
npm test                   # All unit/integration tests
npm run test:watch        # Watch mode for development
```

Test files in `tests/` show patterns for login, navigation, and screenshot capture.

## Integration Checklist

- [ ] Screenshot captured and saved to correct path
- [ ] Alt text written and accurate
- [ ] DocPlaceholder replaced with Image component
- [ ] No PII in screenshot
- [ ] Dimensions are 16:9 (1920×1080 or 1280×720)
- [ ] Annotations use numbered callouts (①②③) if present
- [ ] PLACEHOLDER-CHECKLIST.md updated
- [ ] Marketing site builds without errors (`npm run build`)

## Reference Files

- **Chatbot routes**: `/src/features/*/pages/*.tsx`
- **Placeholder checklist**: [`public/media/docs/PLACEHOLDER-CHECKLIST.md`](./public/media/docs/PLACEHOLDER-CHECKLIST.md)
- **Marketing style guide**: [`AGENTS.md`](./AGENTS.md)
- **Existing screenshots**: `public/media/docs/`
