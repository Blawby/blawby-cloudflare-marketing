import { clsx } from "clsx";
import type React from "react";

type BaseButtonProps = {
  variant?: "solid" | "outline" | "icon";
  children?: React.ReactNode;
};

type ButtonAsButtonProps = BaseButtonProps & 
  Omit<React.ComponentProps<"button">, "type"> & {
    href?: never;
    type?: "button" | "submit" | "reset";
  };

type ButtonAsAnchorProps = BaseButtonProps & 
  React.ComponentProps<"a"> & {
    href: string;
    type?: never;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

export function Button({ 
  className, 
  href, 
  type = "button", 
  variant = "solid",
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = "cursor-pointer rounded-full border focus:outline-2 focus:outline-offset-2 focus:outline-teal-400 backdrop-blur-sm shadow-sm transition-colors";
  
  const variantClasses = {
    solid: "px-3.5 py-2 text-sm/6 font-semibold bg-white/75 border-gray-950/10 text-gray-950 dark:bg-gray-950/75 dark:border-white/10 dark:text-white hover:bg-gray-950/5 dark:hover:bg-white/5",
    outline: "px-3.5 py-2 text-sm/6 font-semibold bg-transparent border-gray-950/30 text-gray-950 dark:border-white/30 dark:text-white hover:bg-gray-950/5 dark:hover:bg-white/5",
    icon: clsx(
      "p-2 size-10 flex items-center justify-center",
      "bg-white/75 border-gray-950/10 text-gray-950 dark:bg-gray-950/75 dark:border-white/10 dark:text-white hover:bg-gray-950/5 dark:hover:bg-white/5"
    )
  };

  const classes = clsx(baseClasses, variantClasses[variant], className);

  if (href) {
    return (
      <a href={href} className={classes} {...(props as React.ComponentProps<"a">)}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...(props as Omit<React.ComponentProps<"button">, "type">)}>
      {children}
    </button>
  );
}
