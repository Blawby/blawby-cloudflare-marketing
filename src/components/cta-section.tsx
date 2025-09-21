import { Button } from "@/components/button";
import Link from "next/link";
import type React from "react";

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
        "my-16 rounded-2xl border border-gray-200 bg-transparent px-8 py-12 text-center dark:border-white/10 " +
        (className || "")
      }
    >
      <h2 className="mb-4 text-2xl font-bold text-gray-950 dark:text-white">
        {title}
      </h2>
      <p className="body-text mx-auto mb-8 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
        {description}
      </p>
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
