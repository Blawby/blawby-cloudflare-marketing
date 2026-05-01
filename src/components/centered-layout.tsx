import type React from "react";
import { Navbar } from "./navbar";

export function CenteredPageLayout({
  breadcrumbs,
  children,
}: {
  breadcrumbs: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-30">
      <Navbar />
      {breadcrumbs && (
        <div className="flex h-10 items-center border-b border-gray-950/10 bg-white px-4 sm:px-6 dark:border-white/10 dark:bg-gray-950">
          <div className="min-w-0 text-sm">{breadcrumbs}</div>
        </div>
      )}
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
