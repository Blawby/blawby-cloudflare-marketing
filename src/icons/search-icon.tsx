import clsx from "clsx";
import type React from "react";

export function SearchIcon({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={clsx(className, "h-4 shrink-0")}
      {...props}
    >
      <path
        d="M7 13.5C10.5899 13.5 13.5 10.5899 13.5 7C13.5 3.41015 10.5899 0.5 7 0.5C3.41015 0.5 0.5 3.41015 0.5 7C0.5 10.5899 3.41015 13.5 7 13.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 11.5L15.5 15.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
} 