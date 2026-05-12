import type React from "react";

export function SectionLabel({
  children,
  num,
}: {
  children: React.ReactNode;
  num?: string;
}) {
  return (
    <div className="section-label">
      {num && <span className="mono">{num}</span>}
      <span className="mono small-caps">{children}</span>
      <span className="rule" />
    </div>
  );
}
