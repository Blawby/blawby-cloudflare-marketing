import { Logo } from "@/components/logo";
import Link from "next/link";
import type React from "react";

export function Footer() {
  return (
    <footer className="border-t border-gray-950/10 bg-white/90 py-8 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-950/90 dark:text-gray-400">
      <div className="mx-auto flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 xl:ml-[var(--container-2xs)] xl:max-w-none xl:px-12">
        <div className="flex items-center gap-3">
          <Logo height={28} width={110} />
          <span className="hidden sm:inline text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Blawby</span>
        </div>
        <nav className="flex flex-wrap justify-start gap-x-6 gap-y-2 sm:justify-center">
          <Link href="/get-started" className="hover:text-gray-950 dark:hover:text-white">Docs</Link>
          <Link href="https://blawby.com/login" className="hover:text-gray-950 dark:hover:text-white">Login</Link>
          <Link href="https://blawby.com/register" className="hover:text-gray-950 dark:hover:text-white">Register</Link>
          <Link href="/help" className="hover:text-gray-950 dark:hover:text-white">Help</Link>
          <Link href="/privacy" className="hover:text-gray-950 dark:hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-950 dark:hover:text-white">Terms</Link>
        </nav>
        <span className="sm:hidden text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Blawby</span>
      </div>
    </footer>
  );
} 