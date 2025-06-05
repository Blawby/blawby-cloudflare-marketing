import { clsx } from "clsx";
import type React from "react";

type ButtonProps = React.ComponentProps<"button"> &
  React.ComponentProps<"a"> & {
    href?: string;
  };

export function Button({ className, href, type = "button", ...props }: ButtonProps) {
  const classes = clsx(
    className,
    "cursor-pointer rounded-full bg-gray-950 px-3.5 py-2 text-sm/6 font-semibold text-white hover:bg-gray-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600"
  );

  if (href) {
    return (
      <a href={href} className={classes} {...props} />
    );
  }

  return (
    <button type={type} className={classes} {...props} />
  );
}
