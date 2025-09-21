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
      <p className="text-base mx-auto mb-8 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
        {description}
      </p>
      {isExternal ? (
        <a href={buttonHref} target="_blank" rel="noopener noreferrer">
          <Button>
            {buttonText}
          </Button>
        </a>
      ) : (
        <Link href={buttonHref}>
          <Button>
            {buttonText}
          </Button>
        </Link>
      )}
    </section>
  );
}
