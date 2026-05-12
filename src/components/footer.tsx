import { Logo } from "@/components/logo";
import { DiscordIcon } from "@/icons/discord-icon";
import { GitHubIcon } from "@/icons/github-icon";
import Link from "next/link";
import type React from "react";

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper py-8 text-base text-ink">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Blawby home">
            <Logo height={28} width={110} />
          </Link>
          <span className="hidden text-base text-dim sm:inline">
            &copy; {new Date().getFullYear()} Blawby
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 sm:justify-center">
          <Link href="/solutions" className="text-dim hover:text-ink">
            Solutions
          </Link>
          <Link href="/docs" className="text-dim hover:text-ink">
            Docs
          </Link>
          <Link href="/pricing" className="text-dim hover:text-ink">
            Pricing
          </Link>
          <Link href="/help" className="text-dim hover:text-ink">
            Help
          </Link>
          <Link href="/privacy" className="text-dim hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="text-dim hover:text-ink">
            Terms
          </Link>
          <a
            href="https://discord.gg/rPmzknKv"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-dim hover:text-[#5865F2]"
            aria-label="Discord"
          >
            <DiscordIcon />
          </a>
          <a
            href="https://github.com/Blawby"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-dim hover:text-accent"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
        </nav>
        <span className="text-base text-dim sm:hidden">
          &copy; {new Date().getFullYear()} Blawby
        </span>
      </div>
    </footer>
  );
}
