# Doc media library

Captured product screenshots used by docs/solutions/lessons MDX. Each asset replaces a `<DocPlaceholder>` in the source MDX. See `PLACEHOLDER-CHECKLIST.md` for the master list and per-asset status.

## How to refresh

1. Start the Blawby AI chatbot:
   ```bash
   cd ../../../../blawby-ai-chatbot   # adjust to your local path
   npm run dev:full
   ```
   This boots Vite + Wrangler + the local.blawby.com tunnel.
2. Confirm `https://local.blawby.com` resolves and the chatbot serves traffic.
3. Sign in with `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD` from the chatbot's `.env`. The staging practice slug lives in `E2E_PRACTICE_SLUG`.
   Use dedicated demo credentials only. Do not use personal email addresses in screenshot environments.
4. Navigate to each surface listed below and re-capture at 1280×720.
5. Save the file at the listed path, then run `pnpm run build` from the marketing repo to verify Next.js accepts the asset.

The chatbot is a Cloudflare Worker that proxies to a remote backend; practices live on the remote API, not in the local D1. Slugs that 404 in the worker are usually missing from the backend, not the worker — check there first.

## Capture environment notes

- Browser: Playwright MCP, viewport 1280×720, light theme by default.
- Staging practice: use the slug configured in `E2E_PRACTICE_SLUG`.
- If any screenshot includes personal email, phone, or name data, re-capture before merge.
- Annotated assets use injected DOM badges (`①②③…`) rendered before capture. Cleanup runs on the next navigation; nothing persists in the chatbot.
- Test-account client names in some captures use seeded placeholders (`Sidebar Count Test Matter`, `Default` intake form, `Lead E2E …@test-blawby.com`). These are obvious test data but ugly — flagged below where they appear.

## Captured assets

### `onboarding/dashboard-after-setup.png`

- **Source:** `/practice/{practiceSlug}` (owner workspace home).
- **Used by:** `src/data/docs/quick-start/create-practice-account.mdx`.
- **Seeded data:** existing practice with matters, intakes, payments — the partially-complete "Get started" card naturally reflects a real account state.
- **Note:** plan called for "intake queue + summary cards + quick-action row + bell." Live dashboard shows Get-started progress, Cashflow, and Recent Intakes — the bell isn't surfaced in this layout; quick actions are the New Invoice / Add Client buttons.

### `payments/stripe-checkpoints.png` and `payments/stripe-connect.png`

- **Source:** `/practice/{practiceSlug}/settings/practice/payouts`.
- **Used by:** `src/data/docs/quick-start/accept-first-payment.mdx`.
- **Seeded data:** the staging practice has Stripe in Linked + Charges enabled + Payouts enabled state, so both checkpoints render as a single "Stripe connected and ready" confirmation card.
- **`stripe-connect.png` is a duplicate of `stripe-checkpoints.png`** — used as the still-frame proxy for the eventual video. Replace when a real walkthrough video is recorded.
- **PII flag:** if Business email is visible, verify it is a demo mailbox.

### `payments/first-invoice.png`

- **Source:** `/practice/{practiceSlug}/invoices/{any}/edit` (clicked the first INV-… draft from the Invoices list).
- **Used by:** `src/data/docs/quick-start/accept-first-payment.mdx`.
- **Seeded data:** 5 draft invoices exist on the staging practice.
- **Note:** the plan asked for "Send button highlighted." The edit view doesn't expose a Send button — Send sits on the parent view. The captured screen still shows the line-item list and PDF preview, which is the load-bearing content.

### `intake/queue.png`

- **Source:** `/practice/{practiceSlug}/intakes/responses`.
- **Used by:** `src/data/docs/features/review-and-triage-intake.mdx`.
- **Seeded data:** 99+ intake submissions seeded by E2E runs (visible as `lead-e2e+...@test-blawby.com`).

### `intake/detail-page-annotated.png`

- **Source:** First intake row (Lead E2E 9443d6f2) → detail page. Annotated via injected `①②③④` badges.
- **Used by:** `src/data/docs/features/review-and-triage-intake.mdx`.
- **Annotations:** ① case summary heading, ② Pending Review status pill, ③ Form Details section, ④ Accept button.
- **Seeded data:** real intake with "$75.00 consultation" line and a phone number `+1 5555551212`.

### `intake/template-list.png`

- **Source:** `/practice/{practiceSlug}/settings/intake-forms`.
- **Used by:** `src/data/docs/features/set-up-client-intake.mdx`.
- **Seeded data:** "Default" template with 100 responses + a test template "afsdafsdsdfadsf" (gibberish name).
- **Note:** the ugly second template card is visible. Consider deleting that seeded template before re-capturing.

### `intake/four-stage-flow.png`

- **Source:** `/public/{practiceSlug}/intake/default` (public widget).
- **Used by:** `src/data/solutions/ai-chat/modern-intake-flow.mdx`.
- **Note:** the captured frame shows the widget's welcome state (`Hi there 👋 How can we help?`), not the four-stage flow itself. Capturing the full four-stage flow would require scripting an intake conversation through engagement → trust → qualification → auth+fee. Deferred.
- **PII flag:** the widget's "Recent Message" card surfaces the most recent visitor thread server-side. At capture time that thread contained offensive content (visible to any anonymous visitor), so the card is hidden via DOM injection before the screenshot. **The chatbot should redact recent-message previews from this anonymous surface, or seeded data should be cleaned up.**

### `chat/conversation-walkthrough.png` and `chat/paralegal-analysis-stream.png`

- **Source:** `/practice/{practiceSlug}/conversations/{lead-e2e-thread}`.
- **Used by:** `src/data/docs/features/join-client-conversation.mdx`.
- **`paralegal-analysis-stream.png` is a duplicate of `conversation-walkthrough.png`** — the captured conversation is a regular intake exchange; no paralegal-AI streaming was triggered. Replace once a file upload + paralegal analysis can be reliably driven in the capture environment.
- **Seeded data:** the thread references a fictitious "Wife Ashley Luke" / Durham NC — obviously test-scenario content.

### `matters/walkthrough.png`

- **Source:** `/practice/{practiceSlug}/matters/{first matter with Engagement draft}` (matter detail Overview tab).
- **Used by:** `src/data/docs/features/matters-overview.mdx`.
- **Note:** the matter is "Sidebar Count Test Matter" (client `sfdadf`) — ugly seeded names. Engagement features show "Engagement unavailable. Retry" because the engagements API rejects slug-as-practice_id; see the engagements section below.

### `matters/tabs-annotated.png`

- **Source:** same matter detail; annotated with `①②③④⑤⑥⑦` over the tab strip.
- **Used by:** `src/data/docs/features/matters-overview.mdx`.
- **Annotations:** Overview, Work, Notes, Billing, Files, Activity, Settings (7 tabs in that order).

### `matters/billing-unbilled-summary.png` and `billing/generate-invoice.png`

- **Source:** Billing tab → Unbilled sub-tab on the same matter.
- **Used by:** `src/data/docs/features/matters-overview.mdx` and `src/data/lessons/invoicing.mdx`.
- **`billing/generate-invoice.png` is a duplicate of `matters/billing-unbilled-summary.png`** — both lessons need a "billing tab" hero. Re-capture separately if you want different framing.
- **Note:** the staging matter has zero unbilled time, so the Create Invoice CTA renders disabled. Plan asked for the CTA "highlighted" — log a few time entries on this matter before re-capturing if you want an enabled state.

### `matters/time-entry-form.png`

- **Source:** Billing → Time sub-tab → Add time entry modal.
- **Used by:** `src/data/docs/features/manage-matters.mdx`.
- **Note:** the modal shows Date / Timezone / Start Time / End Time / Description / Billable. The plan referenced a "rate auto-applied from user role" field — the captured modal does not expose a rate field in this view.

### `engagements/walkthrough.png`

- **Source:** `/practice/{practiceSlug}/engagements` → "+ New Engagement" dialog.
- **Used by:** `src/data/docs/features/engagements-overview.mdx`.
- **Note:** this is the **create** dialog, not the **draft editor**. The draft editor was unreachable this session because the engagements API rejects slug-as-practice_id. See deferred list below.

## Deferred — `<DocPlaceholder>` retained in MDX

These were not captured this session. The MDX still renders the dashed placeholder.

| Asset                                    | MDX file                                           | Why deferred                                                                                                                                                                                                                                |
| ---------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onboarding/conversational-setup.png`    | `quick-start/create-practice-account.mdx`          | Practice already onboarded; `/onboarding` redirects to `/client/dashboard`. Capturing the chat-style setup requires a fresh sign-up.                                                                                                        |
| `intake/template-walkthrough.png`        | `features/intake-templates.mdx`                    | Template detail view crashes with `ReferenceError: isPublishing is not defined` in `IntakePreviewDialog.tsx:100`. **Bug in chatbot; fix needed before capture.**                                                                            |
| `intake/field-editor-annotated.png`      | `features/intake-templates.mdx`                    | Same crash as above.                                                                                                                                                                                                                        |
| `intake/payment-card-in-chat.png`        | `features/intake-templates.mdx`                    | Requires driving the public intake all the way to the Stripe Elements step (engagement → trust → qualification → contact form → fee). Multi-step automation; defer.                                                                         |
| `engagements/draft-editor.png`           | `features/send-engagement-and-collect-payment.mdx` | Engagements list endpoint returns 400 (`practice_id Invalid UUID`) when the slug is `paul-yahoo`. The frontend only navigates to draft-editor _from_ a list item; no items exist, no link to click. **Backend validation bug; fix needed.** |
| `engagements/representation-section.png` | `features/engagements-overview.mdx`                | Same — requires reaching a draft editor.                                                                                                                                                                                                    |
| `engagements/client-acceptance.png`      | `features/send-engagement-and-collect-payment.mdx` | Same — requires an existing engagement.                                                                                                                                                                                                     |
| `engagements/client-review-page.png`     | `features/engagements-overview.mdx`                | Same — requires an existing engagement signable by a client.                                                                                                                                                                                |
| `ai-chat/intent-routing.svg`             | `solutions/ai-chat/ai-chat-client-acquisition.mdx` | Designer asset (see `PLACEHOLDER-CHECKLIST.md`).                                                                                                                                                                                            |
| `reference/api-surface-diagram.svg`      | `docs/reference/api-reference.mdx`                 | Designer asset.                                                                                                                                                                                                                             |

## Issues to file against the chatbot

- `IntakePreviewDialog.tsx:100` — `ReferenceError: isPublishing is not defined`. Blocks template detail / field editor capture.
- Engagements list endpoint sends practice slug where backend expects UUID. Validation error: `field=practice_id, code=invalid_format`.
- Anonymous public-widget surface (`/public/{slug}/intake/{template}`) shows a "Recent Message" card with the most recent visitor thread server-side. That thread can contain PII or offensive content. Either redact at the API or seed-data hygiene needs work.
- **`/practice/{slug}/conversations` renders app 404 for a fresh practice.** The `PracticeAppRoute` with `workspaceView="list"` shows the app's 404 component instead of the empty conversations list when the worker D1 has no conversations seeded for the practice. Likely a practice-context initialization failure in the worker before the conversations list renders. Repro: fresh local org with no prior conversation threads.
- **`/practice/{slug}/intakes/{uuid}` navigates to the queue list instead of the intake detail.** Navigating directly to an intake by UUID (e.g. a seeded record with no `conversation_id`) lands on the "All Responses" list view rather than the single-intake detail panel. The intake record must have a linked `conversation_id` or the frontend falls back to the list. Repro: insert an intake row without a conversation and deep-link to its UUID.
