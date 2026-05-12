export type WorkflowStep = {
  num: string;
  anchorId: string;
  kicker: string;
  cardDesc: string;
  detailTitle: string;
  detailBody: string;
  bullets: string[];
  shotCaption: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    num: "01",
    anchorId: "step-intake",
    kicker: "Intake",
    cardDesc: "Widget on your site captures a qualified lead.",
    detailTitle: "Intake that sounds like you wrote it.",
    detailBody:
      "Drop a widget on your site, ask the questions you actually need, and price-screen with conditional fees before anything hits your inbox.",
    bullets: [
      "Custom fields & conditions",
      "Conflict check on submit",
      "Auto-route by practice area",
    ],
    shotCaption: "Intake widget — composer view",
  },
  {
    num: "02",
    anchorId: "step-triage",
    kicker: "Triage",
    cardDesc: "Review, accept, or decline with AI assist.",
    detailTitle: "Decide in 30 seconds, not 30 minutes.",
    detailBody:
      "Every submission lands in a triage queue with an AI second opinion. Accept and convert to a matter, decline with a templated note, or ask AI to dig deeper.",
    bullets: [
      "Accept · Decline · Ask AI",
      "Conflict & jurisdiction flags",
      "One-click matter creation",
    ],
    shotCaption: "Triage queue — submission detail",
  },
  {
    num: "03",
    anchorId: "step-engage",
    kicker: "Engage",
    cardDesc: "Send scope, fees, and signature in one link.",
    detailTitle: "Scope, fees, and signature in one link.",
    detailBody:
      "Generate an engagement letter from a template, include the fee terms, and send a single signing link. The retainer is collected the moment they sign.",
    bullets: [
      "Reusable engagement templates",
      "Risk & acknowledgment clauses",
      "Retainer collected on signature",
    ],
    shotCaption: "Engagement letter — signer view",
  },
  {
    num: "04",
    anchorId: "step-matter",
    kicker: "Matter",
    cardDesc: "Track work, time, files, and client activity.",
    detailTitle: "Every matter has a single page of record.",
    detailBody:
      "Tabs for activity, files, time, billing, and the client portal. Whatever happens on the matter happens here — no second tab, no second tool.",
    bullets: [
      "Time entries on the matter",
      "Shared files & client chat",
      "Activity log of everything",
    ],
    shotCaption: "Matter detail — tabbed view",
  },
  {
    num: "05",
    anchorId: "step-collect",
    kicker: "Collect",
    cardDesc: "Invoice, accept card or ACH, route to trust.",
    detailTitle: "Invoice, get paid, sweep to trust — cleanly.",
    detailBody:
      "Generate the invoice from time entries, send a payment link that accepts card or ACH, and route earned funds from trust to operating in one signed step.",
    bullets: [
      "Card 2.9% + 30¢ · ACH 0.8%",
      "Trust-aware ledger",
      "Documented trust transfers",
    ],
    shotCaption: "Invoice & trust transfer",
  },
];
