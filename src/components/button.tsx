import { clsx } from "clsx";
import type React from "react";

type ButtonProps = React.ComponentProps<"button"> &
  React.ComponentProps<"a"> & {
    href?: string;
  };

export function Button({
  className,
  href,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = clsx(
    "cursor-pointer rounded-full bg-[var(--color-accent-400)] px-3.5 py-2 text-sm/6 font-semibold text-gray-900 no-underline hover:bg-[var(--color-accent-500)] hover:no-underline focus:no-underline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent-800)] dark:bg-[var(--color-accent-500)] dark:text-gray-900 dark:hover:bg-[var(--color-accent-600)]",
    className,
  );

  if (href) {
    return <a href={href} className={classes} {...props} />;
  }

  return <button type={type} className={classes} {...props} />;
}
