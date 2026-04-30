"use client";

import CommandPalette from "@/components/command-pallete";
import { IconButton } from "@/components/icon-button";
import { Logo } from "@/components/logo";
import { CloseIcon } from "@/icons/close-icon";
import { MenuIcon } from "@/icons/menu-icon";
import {
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useState } from "react";

// Top-level nav sections — add new categories here.
// The sidebar auto-populates from articles.ts based on the active category.
export const NAV_SECTIONS = [
  { id: "lessons", label: "Get started", href: "/lessons/get-started" },
  {
    id: "compliance",
    label: "Compliance",
    href: "/compliance/iolta-compliance",
  },
  {
    id: "ai-chat",
    label: "AI Chat",
    href: "/ai-chat/ai-chat-client-acquisition",
  },
  {
    id: "business-strategy",
    label: "Business Strategy",
    href: "/business-strategy/future-proof-revenue",
  },
] as const;

export function useActiveSection() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  if (segment === "lessons") return "lessons";
  return segment;
}

// ─── Single-row navbar (Stripe-style) ─────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const isSidebarPage =
    pathname.startsWith("/lessons") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/ai-chat") ||
    pathname.startsWith("/business-strategy");
  return (
    <div
      className={clsx(
        "sticky top-0 z-20",
        "border-b border-gray-950/10 bg-white/95 backdrop-blur-sm dark:border-white/10 dark:bg-gray-950/95",
        "flex h-14 items-center gap-x-0 px-4 sm:px-6",
        "mx-auto w-full max-w-screen-xl",
      )}
    >
      {/* Logo: only show on non-sidebar pages */}
      {!isSidebarPage && (
        <Link href="/" className="flex shrink-0 items-center pr-6">
          <Logo className="h-7 dark:text-white" />
        </Link>
      )}

      {/* Category tabs — hidden on mobile */}
      <CategoryTabs className="hidden h-full lg:flex" />

      <div className="flex-1" />

      {/* Right-side actions */}
      <SiteNavigation />
    </div>
  );
}

function CategoryTabs({ className }: { className?: string }) {
  const activeSection = useActiveSection();

  return (
    <nav
      aria-label="Documentation sections"
      className={clsx("flex items-stretch gap-x-1", className)}
    >
      {NAV_SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={clsx(
              "flex items-center border-b-2 px-3 text-sm font-medium transition-colors",
              isActive
                ? "border-gray-950 text-gray-950 dark:border-white dark:text-white"
                : "border-transparent text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Mobile navigation drawer ─────────────────────────────────────────────────

function MobileNavigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeSection = useActiveSection();

  return (
    <Dialog open={open} onClose={onClose} className="lg:hidden">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
      <div className="fixed inset-0 flex justify-end pl-11">
        <DialogPanel className="w-full max-w-xs bg-white px-4 py-5 ring ring-gray-950/10 sm:px-6 dark:bg-gray-950 dark:ring-white/10">
          <div className="flex justify-end">
            <CloseButton as={IconButton} onClick={onClose}>
              <CloseIcon className="stroke-gray-950 dark:stroke-white" />
            </CloseButton>
          </div>

          <div className="mt-4 flex flex-col gap-y-1">
            <p className="px-3 py-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Documentation
            </p>
            {NAV_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <CloseButton
                  as={Link}
                  key={section.id}
                  href={section.href}
                  className={clsx(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-950/5 text-gray-950 dark:bg-white/10 dark:text-white"
                      : "text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
                  )}
                >
                  {section.label}
                </CloseButton>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-y-1 border-t border-gray-950/10 pt-6 dark:border-white/10">
            <p className="px-3 py-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Account
            </p>
            {[
              ["Login", "https://app.blawby.com/login"],
              ["Register", "https://app.blawby.com/register"],
            ].map(([title, href]) => (
              <CloseButton
                as={Link}
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {title}
              </CloseButton>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function SiteNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center gap-x-3">
      <CommandPalette />
      <div className="hidden items-center gap-x-4 text-sm font-medium text-gray-700 lg:flex dark:text-gray-300">
        <Link
          href="https://app.blawby.com/login"
          className="hover:text-gray-950 dark:hover:text-white"
        >
          Login
        </Link>
        <Link
          href="https://app.blawby.com/register"
          className="rounded-md bg-gray-950 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
        >
          Register
        </Link>
      </div>
      <IconButton className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
        <MenuIcon className="fill-gray-950 dark:fill-white" />
      </IconButton>
      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
