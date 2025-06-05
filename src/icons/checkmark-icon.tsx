import clsx from "clsx";
import type React from "react";

export function CheckmarkIcon({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={clsx(className, "h-4 shrink-0")}
      {...props}
    >
      <circle stroke="currentColor" fill="none" cx="8" cy="8" r="7.5" />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        d="M5.5 8.5l2 2 3-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
