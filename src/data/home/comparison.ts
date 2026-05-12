export type ComparisonRow = { label: string; us: boolean; them: boolean };

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "IOLTA-aware ledger", us: true, them: false },
  { label: "Trust → operating transfers", us: true, them: false },
  { label: "Engagement letter + signature in one link", us: true, them: false },
  { label: "Intake widget with conditional fees", us: true, them: false },
  { label: "Card + ACH processing", us: true, them: true },
  { label: "Generic e-commerce checkout flow", us: false, them: true },
  { label: "Built for solo & small-firm attorneys", us: true, them: false },
];
