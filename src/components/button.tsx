import { clsx } from "clsx";
import Link from "next/link";
import type React from "react";

type ButtonProps = React.ComponentProps<"button"> &
  React.ComponentProps<"a"> & {
    href?: string;
    variant?: "primary" | "ghost";
    size?: "md" | "lg";
  };

export function Button({
  className,
  href,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-ink text-paper border-ink hover:bg-accent hover:border-accent",
    ghost: "bg-transparent text-ink border-rule hover:border-ink",
  };

  const sizes = {
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-[15px]",
  };

  const classes = clsx(
    "btn inline-flex cursor-pointer items-center justify-center gap-2",
    "rounded-[2px] border font-sans font-medium transition-all duration-200 no-underline",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
    variants[variant],
    sizes[size],
    className,
  );

  // Omit button-specific props when rendering
  const { type: _type, ...restProps } = props as any;

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} {...restProps}>
          {props.children}
        </Link>
      );
    }
    return <a href={href} className={classes} {...restProps} />;
  }

  return <button type={(props as any).type || "button"} className={classes} {...restProps} />;
}
