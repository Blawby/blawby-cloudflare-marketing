"use client";

import { IconButton } from "@/components/icon-button";
import { NAV_SECTIONS, PRODUCT_SECTION_IDS } from "@/components/navbar";
import type { Module } from "@/data/lessons";
import { SidebarIcon } from "@/icons/sidebar-icon";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { createContext, useContext, useState } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

export const SidebarContext = createContext<{
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isMobileDialogOpen: boolean;
  setIsMobileDialogOpen: (v: boolean) => void;
}>({
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
  isMobileDialogOpen: false,
  setIsMobileDialogOpen: () => {},
});

// ─── Sidebar sections derivation ──────────────────────────────────────────────

import type { ContentItem } from "@/lib/content";

type SidebarSection = {
  sectionTitle: string;
  items: { href: string; label: string }[];
  id?: string;
};

function useSidebarSections(
  modules: Module[],
  allContent: ContentItem[],
): SidebarSection[] {
  const pathname = usePathname();

  // Home page — no sidebar
  if (pathname === "/") return [];

  const segment = pathname.split("/")[1] ?? "";
  if (PRODUCT_SECTION_IDS.has(segment.toLowerCase() as any) || segment === "products") {
    return modules.map((mod) => ({
      sectionTitle: mod.title,
      items: mod.lessons.map((lesson) => ({
        href: `/${lesson.category.toLowerCase()}/${lesson.slug}`,
        label: lesson.title || "",
      })),
    }));
  }

  if (segment === "solutions") {
    const sectionArticles = allContent.filter((a) => a.origin === "solutions");
    const categories = Array.from(new Set(sectionArticles.map((a) => a.category)));
    return categories.map((cat) => ({
      sectionTitle: cat.replace(/-/g, " "),
      items: sectionArticles
        .filter((a) => a.category.toLowerCase() === cat.toLowerCase())
        .map((a) => ({
          href: `/${a.category.toLowerCase()}/${a.slug}`,
          label: a.title || "",
        })),
    }));
  }

  if (segment === "docs") {
    const sectionDocs = allContent.filter((a) => a.origin === "docs");
    const categories = ["quick-start", "features", "reference"];
    return categories.map((cat) => {
      const categoryArticles = sectionDocs.filter(
        (a) => a.category.toLowerCase() === cat.toLowerCase()
      );
      return {
        sectionTitle: cat.replace(/-/g, " "),
        items: categoryArticles.map((a) => ({
          href: `/${a.category.toLowerCase()}/${a.slug}`,
          label: a.title || "",
        })),
      };
    }).filter(s => s.items.length > 0);
  }

  if (segment === "pricing") {
    return [
      {
        sectionTitle: "Pricing",
        items: [{ href: "/pricing", label: "Overview" }],
      },
    ];
  }

  if (segment === "privacy" || segment === "terms") {
    return [
      {
        sectionTitle: "Legal",
        items: [
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
        ],
      },
    ];
  }

  const section = NAV_SECTIONS.find((s) => s.id === segment.toLowerCase());
  if (!section) return [];

  // Match active article by full route to avoid slug collisions
  // Fallback to category + slug match if origin disambiguation is needed
  const activeArticle = allContent.find(
    (a) => `/${a.category.toLowerCase()}/${a.slug}` === pathname
  ) || allContent.find(
    (a) => 
      a.slug === pathname.split("/").pop() && 
      a.category.toLowerCase() === segment.toLowerCase()
  );
  
  const activeOrigin = activeArticle?.origin;

  const categoryArticles = allContent.filter(
    (a) =>
      a.category.toLowerCase() === segment.toLowerCase() &&
      a.origin === activeOrigin
  );
  if (!categoryArticles.length) return [];

  return [
    {
      sectionTitle: section.label,
      items: categoryArticles.map((a) => ({
        href: `/${a.category.toLowerCase()}/${a.slug}`,
        label: a.title || "",
      })),
    },
  ];
}

// ─── Sidebar nav list ─────────────────────────────────────────────────────────

function SidebarNav({
  sections,
  onNavigate,
  className,
}: {
  sections: SidebarSection[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  if (!sections.length) return null;

  return (
    <div className={clsx(className, "space-y-8")}>
      {sections.map((section) => (
        <div key={section.sectionTitle} className="mb-10 last:mb-0">
          <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            {section.sectionTitle}
          </h2>
          <ul className="mt-3 flex flex-col gap-0.5 border-l border-gray-950/10 dark:border-white/10">
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={clsx(
                      "-ml-px flex border-l py-1.5 pl-4 text-sm/6 transition-colors",
                      isActive
                        ? "border-gray-950 font-medium text-gray-950 dark:border-white dark:text-white"
                        : "border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-950 dark:text-gray-400 dark:hover:border-white/40 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile sidebar sheet ─────────────────────────────────────────────────────

function MobileSidebar({
  open,
  onClose,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  sections: SidebarSection[];
}) {
  return (
    <Dialog open={open} onClose={onClose} className="xl:hidden">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
      <DialogPanel className="fixed inset-y-0 left-0 w-72 overflow-y-auto bg-white px-4 py-6 pt-20 ring ring-gray-950/10 sm:px-6 dark:bg-gray-950 dark:ring-white/10">
        <SidebarNav sections={sections} onNavigate={onClose} />
      </DialogPanel>
    </Dialog>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export function SidebarLayout({
  modules,
  allContent = [],
  children,
}: {
  modules: Module[];
  allContent?: ContentItem[];
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const sections = useSidebarSections(modules, allContent);
  const hasSidebar = sections.length > 0;

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        isMobileDialogOpen,
        setIsMobileDialogOpen,
      }}
    >
      <div
        data-sidebar-collapsed={isSidebarOpen ? undefined : ""}
        className="group"
      >
        {/* Desktop sidebar — only when there are sections to show */}
        {hasSidebar && (
          <aside
            className={clsx(
              // Sits below the single-row navbar (h-14 = 56px)
              "fixed inset-y-0 top-14 left-0 w-64 overflow-y-auto",
              "border-r border-gray-950/10 dark:border-white/10",
              "group-data-[sidebar-collapsed]:hidden max-xl:hidden",
            )}
          >
            <nav aria-label="Sidebar navigation" className="px-5 py-6">
              <SidebarNav sections={sections} />
            </nav>
          </aside>
        )}

        {/* Page content — shift right when desktop sidebar is visible */}
        <div
          className={clsx(
            hasSidebar && "xl:ml-64 xl:group-data-[sidebar-collapsed]:ml-0",
          )}
        >
          {children}
        </div>
      </div>

      {/* Mobile sidebar */}
      {hasSidebar && (
        <MobileSidebar
          open={isMobileDialogOpen}
          onClose={() => setIsMobileDialogOpen(false)}
          sections={sections}
        />
      )}
    </SidebarContext.Provider>
  );
}

// ─── Page content wrapper ─────────────────────────────────────────────────────

export function SidebarLayoutContent({
  breadcrumbs,
  children,
}: {
  breadcrumbs?: React.ReactNode;
  children: React.ReactNode;
}) {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileDialogOpen,
    setIsMobileDialogOpen,
  } = useContext(SidebarContext);

  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>

      {/* Sub-header: breadcrumbs + sidebar toggles. Below sticky nav, inside content flow. */}
      {!isHome && (
        <div className="flex h-10 items-center gap-x-3 border-b border-gray-950/10 bg-white px-4 sm:px-6 dark:border-white/10 dark:bg-gray-950">
          {/* Mobile sidebar toggle */}
          <IconButton
            onClick={() => setIsMobileDialogOpen(!isMobileDialogOpen)}
            className="xl:hidden"
            aria-label={
              isMobileDialogOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={isMobileDialogOpen}
          >
            <SidebarIcon className="shrink-0 stroke-gray-950 dark:stroke-white" />
          </IconButton>
          {/* Desktop sidebar re-open toggle (only when collapsed) */}
          {!isSidebarOpen && (
            <IconButton
              onClick={() => setIsSidebarOpen(true)}
              className="max-xl:hidden"
              aria-label="Expand sidebar"
            >
              <SidebarIcon className="shrink-0 stroke-gray-950 dark:stroke-white" />
            </IconButton>
          )}
          {breadcrumbs && <div className="min-w-0 text-sm">{breadcrumbs}</div>}
        </div>
      )}

      <main className="px-4 sm:px-6">{children}</main>
    </>
  );
}
