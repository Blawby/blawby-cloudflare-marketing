import { Logo } from "@/components/logo";
import Link from "next/link";
import type React from "react";
import { DiscordIcon } from "@/icons/discord-icon";
import { GitHubIcon } from "@/icons/github-icon";

export function Footer() {
  return (
    <footer className="border-t border-gray-950/10 bg-white dark:bg-gray-950 py-8 text-sm text-gray-950 dark:text-white body-text dark:border-white/10">
      <div className="mx-auto flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 xl:ml-[var(--container-2xs)] xl:max-w-none xl:px-12">
        <div className="flex items-center gap-3">
          <Logo height={28} width={110} />
          <span className="hidden sm:inline body-text text-gray-700 dark:text-gray-400">&copy; {new Date().getFullYear()} Blawby</span>
        </div>
        <nav className="flex flex-wrap justify-start gap-x-6 gap-y-2 sm:justify-center items-center">
          <Link href="/lessons/get-started" className="hover:text-gray-950 dark:hover:text-white">Docs</Link>
          <Link href="https://app.blawby.com/login" className="hover:text-gray-950 dark:hover:text-white">Login</Link>
          <Link href="https://app.blawby.com/register" className="hover:text-gray-950 dark:hover:text-white">Register</Link>
          <Link href="/help" className="hover:text-gray-950 dark:hover:text-white">Help</Link>
          <Link href="/privacy" className="hover:text-gray-950 dark:hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-950 dark:hover:text-white">Terms</Link>
          <a href="https://discord.gg/rPmzknKv" target="_blank" rel="noopener noreferrer" className="ml-2 hover:text-[#5865F2] dark:hover:text-[#5865F2]" aria-label="Discord">
            <DiscordIcon />
          </a>
          <a href="https://github.com/Blawby" target="_blank" rel="noopener noreferrer" className="ml-2 hover:text-gray-900 dark:hover:text-white" aria-label="GitHub">
            <GitHubIcon />
          </a>
        </nav>
        <span className="sm:hidden body-text text-gray-700 dark:text-gray-400">&copy; {new Date().getFullYear()} Blawby</span>
      </div>
    </footer>
  );
} 