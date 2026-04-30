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
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Button } from "./button";

// ─── Navigation registry ──────────────────────────────────────────────────────
// Single source of truth for all routable sections.
// The sidebar auto-populates from content based on the active segment.

export const NAV_SECTIONS = [
  // Products (lesson-based)
  { id: "guides",     label: "Get Started",  href: "/guides/get-started" },
  { id: "payments",   label: "Payments",     href: "/payments/accepting-payments" },
  { id: "ai-intake",  label: "AI Intake",    href: "/ai-intake/ai-powered-legal-intake-chatbot" },
  // Docs
  { id: "quick-start",     label: "Quick Start",     href: "/quick-start/create-practice-account" },
  { id: "features",        label: "Features",        href: "/features/set-up-client-intake" },
  { id: "reference",       label: "Reference",       href: "/reference/api-reference" },
  // Solutions
  { id: "ai-chat",             label: "AI Chat",             href: "/ai-chat/ai-chat-client-acquisition" },
  { id: "business-strategy",   label: "Business Strategy",   href: "/business-strategy/future-proof-revenue" },
  { id: "compliance",          label: "Compliance",          href: "/compliance/iolta-compliance" },
] as const;

// Dev-only duplicate ID check
if (process.env.NODE_ENV !== "production") {
  const ids = new Set();
  for (const section of NAV_SECTIONS) {
    if (ids.has(section.id)) {
      console.warn(`[Navbar] Duplicate NAV_SECTION ID detected: ${section.id}`);
    }
    ids.add(section.id);
  }
}

export const PRODUCT_SECTION_IDS = new Set(["guides", "payments", "ai-intake"]);
export const DOCS_SECTION_IDS    = new Set(["quick-start", "features", "reference"]);
export const SOLUTIONS_SECTION_IDS = new Set(["ai-chat", "business-strategy", "compliance"]);

export function useActiveSection() {
  const pathname = usePathname();
  return pathname.split("/")[1] ?? "";
}

// ─── Products dropdown items ───────────────────────────────────────────────────

const PRODUCT_LINKS = [
  {
    href: "/guides/get-started",
    label: "Get Started",
    desc: "Set up your Blawby account and configure your practice.",
  },
  {
    href: "/payments/accepting-payments",
    label: "Payments",
    desc: "IOLTA-compliant payment links, invoicing, and payouts.",
  },
  {
    href: "/ai-intake/ai-powered-legal-intake-chatbot",
    label: "AI Intake",
    desc: "24/7 client intake automation powered by AI.",
  },
];

// ─── Single-row navbar ────────────────────────────────────────────────────────

export function Navbar() {
  return (
    <div
      className={clsx(
        "sticky top-0 z-20 w-full",
        "bg-white/95 backdrop-blur-sm dark:bg-gray-950/95",
        "border-b border-gray-950/10 dark:border-white/10",
        "flex h-14 items-center gap-x-0 px-4 sm:px-6",
      )}
    >
      <Link href="/" className="flex shrink-0 items-center pr-6">
        <Logo className="h-7 dark:text-white" />
      </Link>

      {/* Center nav — hidden on mobile */}
      <PrimaryNav className="hidden h-full lg:flex" />

      <div className="flex-1" />

      {/* Right-side actions */}
      <SiteNavigation />
    </div>
  );
}

// ─── Center nav tabs ──────────────────────────────────────────────────────────

function PrimaryNav({ className }: { className?: string }) {
  const activeSection = useActiveSection();

  const isProductActive = PRODUCT_SECTION_IDS.has(activeSection as any) || activeSection === "products";
  const isDocsActive    = DOCS_SECTION_IDS.has(activeSection as any) || activeSection === "docs";
  const isSolutionsActive = activeSection === "solutions" || SOLUTIONS_SECTION_IDS.has(activeSection as any);
  const isPricingActive   = activeSection === "pricing";

  return (
    <nav
      aria-label="Primary navigation"
      className={clsx("flex items-stretch gap-x-0.5", className)}
    >
      {/* Products Dropdown */}
      <ProductsDropdown isActive={isProductActive} />

      {/* Docs */}
      <NavTab href="/docs" isActive={isDocsActive}>
        Docs
      </NavTab>

      {/* Solutions */}
      <NavTab href="/solutions" isActive={isSolutionsActive}>
        Solutions
      </NavTab>

      {/* Pricing */}
      <NavTab href="/pricing" isActive={isPricingActive}>
        Pricing
      </NavTab>
    </nav>
  );
}

function NavTab({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center border-b-2 px-2.5 text-sm font-medium whitespace-nowrap transition-colors xl:px-3",
        isActive
          ? "border-gray-950 text-gray-950 dark:border-white dark:text-white"
          : "border-transparent text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function ProductsDropdown({ isActive }: { isActive: boolean }) {
  return (
    <Menu as="div" className="relative flex items-stretch">
      <MenuButton
        className={clsx(
          "flex items-center gap-x-1 border-b-2 px-2.5 text-sm font-medium whitespace-nowrap transition-colors xl:px-3",
          isActive
            ? "border-gray-950 text-gray-950 dark:border-white dark:text-white"
            : "border-transparent text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
        )}
        aria-label="Products menu"
      >
        Products
        <svg
          className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </MenuButton>

      <MenuItems
        transition
        className={clsx(
          "absolute left-0 top-full z-30 mt-1 w-72 origin-top-left",
          "rounded-xl bg-white shadow-lg ring-1 ring-gray-950/10",
          "dark:bg-gray-900 dark:ring-white/10",
          "p-2 focus:outline-none",
          "transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75",
        )}
      >
        {PRODUCT_LINKS.map((link) => (
          <MenuItem key={link.href}>
            {({ focus }) => (
              <Link
                href={link.href}
                className={clsx(
                  "flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  focus
                    ? "bg-gray-50 dark:bg-white/5"
                    : "text-gray-700 dark:text-gray-300",
                )}
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {link.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {link.desc}
                </span>
              </Link>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
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
  const isProductActive = PRODUCT_SECTION_IDS.has(activeSection as any) || activeSection === "products";
  const isDocsActive    = DOCS_SECTION_IDS.has(activeSection as any) || activeSection === "docs";
  const isSolutionsActive = SOLUTIONS_SECTION_IDS.has(activeSection as any) || activeSection === "solutions" || activeSection === "articles";

  return (
    <Dialog open={open} onClose={onClose} className="lg:hidden">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
      <div className="fixed inset-0 flex justify-end pl-11">
        <DialogPanel className="w-full max-w-xs bg-white px-4 py-5 ring ring-gray-950/10 sm:px-6 dark:bg-gray-950 dark:ring-white/10">
          <div className="flex justify-end">
            <CloseButton as={IconButton} onClick={onClose} aria-label="Close menu">
              <CloseIcon className="stroke-gray-950 dark:stroke-white" />
            </CloseButton>
          </div>

          <div className="mt-4 flex flex-col gap-y-1">
            <CloseButton
              as={Link}
              href="/products"
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isProductActive
                  ? "bg-gray-950/5 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              Products
            </CloseButton>

            {/* Docs */}
            <p className="mt-4 px-3 py-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Resources
            </p>
            <CloseButton
              as={Link}
              href="/docs"
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isDocsActive
                  ? "bg-gray-950/5 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              Docs
            </CloseButton>
            <CloseButton
              as={Link}
              href="/solutions"
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isSolutionsActive
                  ? "bg-gray-950/5 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              Solutions
            </CloseButton>
            <CloseButton
              as={Link}
              href="/pricing"
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeSection === "pricing"
                  ? "bg-gray-950/5 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-950/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              Pricing
            </CloseButton>
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

// ─── Right-side: Search, Login, Register ──────────────────────────────────────

function SiteNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav aria-label="Site navigation" className="flex items-center gap-x-4 xl:gap-x-6">
      <CommandPalette />
      <div className="hidden items-center gap-x-3 text-sm font-medium lg:flex xl:gap-x-4">
        <Link
          href="https://app.blawby.com/login"
          className="text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
        >
          Login
        </Link>
        <Button
          href="https://app.blawby.com/register"
          className="w-auto px-3 py-1.5 text-sm font-semibold"
        >
          Register
        </Button>
      </div>
      <IconButton 
        className="lg:hidden" 
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open main menu"
      >
        <MenuIcon className="fill-gray-950 dark:fill-white" />
      </IconButton>
      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
