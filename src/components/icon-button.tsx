import { Button } from "@headlessui/react";
import { clsx } from "clsx";
import type React from "react";

export function IconButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
      type="button"
      className={clsx(
        "relative *:relative",
        "bg-gradient-to-r from-[#11FFBD] to-[#AAFFA9] dark:bg-gradient-to-r dark:from-[#11998e] dark:to-[#38ef7d]",
        "before:absolute before:top-1/2 before:left-1/2 before:size-8 before:-translate-1/2 before:rounded-md",
        "before:bg-white/75 before:backdrop-blur-sm dark:before:bg-gray-950/75",
        "data-hover:before:bg-gray-950/5 dark:data-hover:before:bg-white/5",
        "focus:outline-hidden data-focus:before:outline-2 data-focus:before:outline-teal-400 data-focus:before:outline-solid",
        className
      )}
      {...props}
    />
  );
}
