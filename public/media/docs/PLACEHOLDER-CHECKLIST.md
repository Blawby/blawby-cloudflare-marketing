# Doc Placeholder Media Checklist

This is the master list of screenshots, videos, and diagrams referenced via
`<DocPlaceholder>` in the docs MDX. Each entry shows the eventual path under
`public/`, the MDX page that uses it, and what the asset should contain.

When an asset is captured, drop it at the listed path and replace the
`<DocPlaceholder>` in the MDX with a normal `<Image>`, `<Video>`, or `<img>` tag
that points at the same path. The placeholder rendering goes away automatically.

## Conventions

- **Screenshots**: PNG, 16:9 (e.g. 1280×720 or 1920×1080), light theme by default.
  For UI surfaces that have meaningful dark theming, add a `-dark` variant at
  the same path with the suffix.
- **Videos**: MP4, H.264, 1280×720 or 1920×1080, with audio muted. Aim for
  30–60 seconds. Ship a `-poster.png` at the same path stem.
- **Diagrams**: SVG preferred, otherwise PNG at 1280×720+.
- **Annotations**: when "annotated" appears in the description, overlay numbered
  callouts (①, ②, ③) and pair with a short on-page legend or alt text.

## Capture environment

- Use a clean staging practice in the live product (not production).
- Use realistic but obviously-test client names (e.g. "Acme Demo Client",
  "Test Matter").
- Strip any PII before the file is committed.

## Asset list

### Onboarding / get-started

- [ ] `public/media/docs/onboarding/conversational-setup.mp4` — used by
  `src/data/docs/quick-start/create-practice-account.mdx`. 60-second walkthrough
  of `PracticeOnboardingPage` — the AI asks for the firm name, slug, accent
  color, contact info, services, and team. (deferred — staging practice already
  onboarded; see README)
- [x] `public/media/docs/onboarding/dashboard-after-setup.png` — used by
  `src/data/docs/quick-start/create-practice-account.mdx`. Dashboard after
  first-time onboarding — intake queue, summary cards, quick-action buttons,
  notification bell.

### Payments

- [x] `public/media/docs/payments/stripe-connect.png` — used by
  `src/data/docs/quick-start/accept-first-payment.mdx`. 60-second walkthrough
  of the two Stripe Connect checkpoints — link bank, enable charges — followed
  by sending the first invoice. (poster only — video TBD)
- [x] `public/media/docs/payments/stripe-checkpoints.png` — used by
  `src/data/docs/quick-start/accept-first-payment.mdx`. Stripe checkpoint card
  in Settings → Payments — checkpoint 1 (Linked), checkpoint 2 (Charges
  enabled).
- [x] `public/media/docs/payments/first-invoice.png` — used by
  `src/data/docs/quick-start/accept-first-payment.mdx`. A draft invoice
  generated from unbilled time, with line items pulled from time entries and
  the Send button highlighted.

### Intake

- [ ] `public/media/docs/intake/template-walkthrough.mp4` — used by
  `src/data/docs/features/intake-templates.mdx`. 30-second walkthrough of
  `IntakeTemplatesPage` — creating a template, adding a required field, adding
  an enrichment field, toggling consultation fee. (deferred — chatbot bug
  `isPublishing is not defined` in `IntakePreviewDialog.tsx:100`; see README)
- [ ] `public/media/docs/intake/field-editor-annotated.png` — used by
  `src/data/docs/features/intake-templates.mdx`. Annotated `IntakeTemplatesPage`
  field editor with ① required toggle, ② enrichment toggle, ③ conditional
  `dependsOn` selector. (deferred — same chatbot bug as above)
- [ ] `public/media/docs/intake/payment-card-in-chat.png` — used by
  `src/data/docs/features/intake-templates.mdx`. Stripe Elements payment card
  in the chat thread, between contact collection and submission confirmation.
  (deferred — requires scripting the full intake flow)
- [x] `public/media/docs/intake/template-list.png` — used by
  `src/data/docs/features/set-up-client-intake.mdx`. `IntakeTemplatesPage` list
  view, with one default template and the New template CTA visible.
- [x] `public/media/docs/intake/queue.png` — used by
  `src/data/docs/features/review-and-triage-intake.mdx`. `IntakesPage` queue
  with several submissions, urgency badges, and the New filter active.
- [x] `public/media/docs/intake/detail-page-annotated.png` — used by
  `src/data/docs/features/review-and-triage-intake.mdx`. `IntakeDetailPage`
  with the case summary, urgency badge, custom fields, and decision buttons
  annotated.
- [x] `public/media/docs/intake/four-stage-flow.png` — used by
  `src/data/solutions/ai-chat/modern-intake-flow.mdx`. Annotated chat
  screenshot showing all four stages — engagement, trust building,
  qualification, authentication + fee — in one continuous thread. (captured as
  widget welcome surface; full four-stage flow capture deferred — see README)

### Chat / conversations

- [x] `public/media/docs/chat/conversation-walkthrough.png` — used by
  `src/data/docs/features/join-client-conversation.mdx`. 60-second walkthrough
  of an active conversation — sending a message, attaching a file, the AI
  surfacing a quick-reply suggestion, and paralegal analysis streaming in.
  (poster only — video TBD)
- [x] `public/media/docs/chat/paralegal-analysis-stream.png` — used by
  `src/data/docs/features/join-client-conversation.mdx`. Paralegal AI streaming
  analysis in the conversation thread — file uploaded, status messages,
  extracted facts inline. (duplicate of conversation-walkthrough — no paralegal
  stream triggered this session; replace when reproducible — see README)

### Matters

- [x] `public/media/docs/matters/walkthrough.png` — used by
  `src/data/docs/features/matters-overview.mdx`. 45-second walkthrough of the
  matter detail panel — opening a matter, adding a time entry, generating an
  invoice from unbilled time. (poster only — video TBD)
- [x] `public/media/docs/matters/tabs-annotated.png` — used by
  `src/data/docs/features/matters-overview.mdx`. Annotated `MatterDetailPanel`
  showing the seven tabs (Overview, Work, Billing, Files, Notes, Activity,
  Settings).
- [x] `public/media/docs/matters/billing-unbilled-summary.png` — used by
  `src/data/docs/features/matters-overview.mdx`. Billing tab with the unbilled
  summary card highlighted and the "Generate invoice" CTA visible.
- [x] `public/media/docs/matters/time-entry-form.png` — used by
  `src/data/docs/features/manage-matters.mdx`. Time entry form on the Work tab
  — start/end pickers, description, billable toggle, rate auto-applied from
  user role.

### Engagements

- [x] `public/media/docs/engagements/walkthrough.png` — used by
  `src/data/docs/features/engagements-overview.mdx`. 60-second walkthrough of
  creating an engagement from a matter — Blawby pre-fills the four sections,
  attorney edits, sends, client signs. (poster only — captured as the Create
  Engagement dialog because the draft-editor view was unreachable; see README)
- [ ] `public/media/docs/engagements/representation-section.png` — used by
  `src/data/docs/features/engagements-overview.mdx`. Representation section
  with included and excluded services rendered side-by-side. (deferred —
  engagements list API returns 400 `practice_id Invalid UUID`; see README)
- [ ] `public/media/docs/engagements/client-review-page.png` — used by
  `src/data/docs/features/engagements-overview.mdx`. `ClientEngagementReviewPage`
  with sections collapsed and the sign button at the bottom. (deferred — no
  engagement exists to review; same backend bug)
- [ ] `public/media/docs/engagements/draft-editor.png` — used by
  `src/data/docs/features/send-engagement-and-collect-payment.mdx`. Engagement
  draft editor with the four sections expanded — representation, fees, risk
  review, acknowledgments. (deferred — same backend bug)
- [ ] `public/media/docs/engagements/client-acceptance.mp4` — used by
  `src/data/docs/features/send-engagement-and-collect-payment.mdx`. Client
  opens the engagement, reviews the four sections, signs, and is redirected to
  Stripe for retainer payment. (deferred — same backend bug)

### Billing

- [x] `public/media/docs/billing/generate-invoice.png` — used by
  `src/data/lessons/invoicing.mdx`. Billing tab on a matter — unbilled summary
  expanded, Generate invoice CTA highlighted, draft preview to the right.
  (duplicate of `matters/billing-unbilled-summary.png` — re-capture separately
  if different framing is wanted)

### AI chat strategy / diagrams

- [ ] `public/media/docs/ai-chat/intent-routing.svg` — used by
  `src/data/solutions/ai-chat/ai-chat-client-acquisition.mdx`. Diagram of the
  intent classifier — first message routes to `REQUEST_CONSULTATION`,
  `ASK_QUESTION`, or `CONVERSATION` based on signal. **Designer asset — see
  README** — best shipped as SVG, not a screenshot.

### Reference / API

- [ ] `public/media/docs/reference/api-surface-diagram.svg` — used by
  `src/data/docs/reference/api-reference.mdx`. Future API surface — embeddable
  widget on the left, public REST API in the middle, your service on the
  right. **Designer asset — see README.**

## Workflow

1. Pick an asset from the list above.
2. Capture it in the staging environment.
3. Drop the file at the listed path under `public/media/docs/`.
4. Open the MDX file that references it.
5. Replace the `<DocPlaceholder ... />` block with a real tag — for screenshots:

   ```mdx
   ![Description of screenshot|1280x720](/media/docs/intake/queue.png)
   ```

   For videos:

   ```mdx
   <Video
     src="/media/docs/intake/template-walkthrough.mp4"
     poster="/media/docs/intake/template-walkthrough-poster.png"
   />
   ```

6. Check the box above.
7. Commit with a message like `docs: add real screenshot for intake queue`.
