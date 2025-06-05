import { Button } from "@/components/button";
import type React from "react";
import Link from "next/link";

export function CTASection({
  title,
  description,
  buttonText,
  buttonHref,
  className,
}: {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  className?: string;
}) {
  const isExternal = buttonHref.startsWith("http");
  return (
    <section
      className={
        "my-16 rounded-2xl border border-gray-200 dark:border-white/10 px-8 py-12 text-center bg-transparent " +
        (className || "")
      }
    >
      <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-4">{title}</h2>
      <p className="mb-8 text-lg body-text max-w-2xl mx-auto">{description}</p>
      {isExternal ? (
        <a href={buttonHref} target="_blank" rel="noopener noreferrer">
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            {buttonText}
          </Button>
        </a>
      ) : (
        <Link href={buttonHref}>
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            {buttonText}
          </Button>
        </Link>
      )}
    </section>
  );
} 