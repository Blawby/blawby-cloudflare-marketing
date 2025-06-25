import { clsx } from "clsx";
import type React from "react";

type ButtonProps = React.ComponentProps<"button"> &
  React.ComponentProps<"a"> & {
    href?: string;
  };

export function Button({ className, href, type = "button", ...props }: ButtonProps) {
  const classes = clsx(
    className,
    "cursor-pointer rounded-full bg-gradient-to-r from-[#11FFBD] to-[#AAFFA9] px-3.5 py-2 text-sm/6 font-semibold text-gray-900 focus:outline-2 focus:outline-offset-2 focus:outline-teal-400 dark:bg-gradient-to-r dark:from-[#11998e] dark:to-[#38ef7d] dark:text-gray-900"
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