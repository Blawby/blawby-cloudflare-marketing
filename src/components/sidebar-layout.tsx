"use client";

import { IconButton } from "@/components/icon-button";
import { NAV_SECTIONS, PRODUCT_SECTION_IDS } from "@/components/navbar";
import type { Module } from "@/data/lessons";
import { ChevronDownIcon } from "@/icons/chevron-down-icon";
import { SidebarIcon } from "@/icons/sidebar-icon";
import { formatSectionLabel } from "@/utils/section-label";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { createContext, useContext, useId, useState } from "react";

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

type SidebarLeaf = { kind: "leaf"; href: string; label: string };
type SidebarGroup = { kind: "group"; label: string; items: SidebarLeaf[] };
type SidebarItem = SidebarLeaf | SidebarGroup;

type SidebarSection = {
  sectionTitle: string;
  items: SidebarItem[];
  id?: string;
};

/**
 * Build the sidebar tree for one category: items with no `group` frontmatter
 * become top-level leaves; items sharing a `group` collapse under a single
 * group node, sorted by `groupOrder` then `order`.
 */
function buildSidebarItemsForCategory(
  categoryArticles: ContentItem[],
): SidebarItem[] {
  const groups = new Map<
    string,
    { groupOrder: number; minOrder: number; articles: ContentItem[] }
  >();
  const ungrouped: ContentItem[] = [];

  for (const a of categoryArticles) {
    if (a.group) {
      const slot = groups.get(a.group);
      if (slot) {
        slot.articles.push(a);
        slot.minOrder = Math.min(slot.minOrder, a.order ?? 999);
      } else {
        groups.set(a.group, {
          groupOrder: a.groupOrder ?? 999,
          minOrder: a.order ?? 999,
          articles: [a],
        });
      }
    } else {
      ungrouped.push(a);
    }
  }

  type Entry = { sortKey: number; item: SidebarItem };
  const entries: Entry[] = [];

  for (const a of ungrouped) {
    entries.push({
      sortKey: a.order ?? 999,
      item: {
        kind: "leaf",
        href: `/${a.category.toLowerCase()}/${a.slug}`,
        label: a.title || "",
      },
    });
  }

  for (const [label, slot] of groups) {
    const items = slot.articles
      .slice()
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map<SidebarLeaf>((a) => ({
        kind: "leaf",
        href: `/${a.category.toLowerCase()}/${a.slug}`,
        label: a.title || "",
      }));
    entries.push({
      sortKey: slot.groupOrder !== 999 ? slot.groupOrder : slot.minOrder,
      item: { kind: "group", label, items },
    });
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.map((e) => e.item);
}

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
      items: mod.lessons.map<SidebarLeaf>((lesson) => ({
        kind: "leaf",
        href: `/${lesson.category.toLowerCase()}/${lesson.slug}`,
        label: lesson.title || "",
      })),
    }));
  }

  if (segment === "solutions") {
    const sectionArticles = allContent.filter((a) => a.origin === "solutions");
    const categories = Array.from(new Set(sectionArticles.map((a) => a.category)));
    return categories.map((cat) => ({
      sectionTitle: cat,
      items: buildSidebarItemsForCategory(
        sectionArticles.filter(
          (a) => a.category.toLowerCase() === cat.toLowerCase(),
        ),
      ),
    }));
  }

  if (segment === "docs") {
    const sectionDocs = allContent.filter((a) => a.origin === "docs");
    const categories = ["quick-start", "features", "reference"];
    return categories
      .map((cat) => {
        const categoryArticles = sectionDocs.filter(
          (a) => a.category.toLowerCase() === cat.toLowerCase(),
        );
        return {
          sectionTitle: cat,
          items: buildSidebarItemsForCategory(categoryArticles),
        };
      })
      .filter((s) => s.items.length > 0);
  }

  if (segment === "pricing") {
    return [
      {
        sectionTitle: "Pricing",
        items: [{ kind: "leaf", href: "/pricing", label: "Overview" }],
      },
    ];
  }

  if (segment === "privacy" || segment === "terms") {
    return [
      {
        sectionTitle: "Legal",
        items: [
          { kind: "leaf", href: "/privacy", label: "Privacy Policy" },
          { kind: "leaf", href: "/terms", label: "Terms of Service" },
        ],
      },
    ];
  }

  const section = NAV_SECTIONS.find((s) => s.id === segment.toLowerCase());
  if (!section) return [];

  // Match active article by full route to avoid slug collisions
  // Fallback to category + slug match if origin disambiguation is needed
  const activeArticle = allContent.find(
    (a) => `/${a.category.toLowerCase()}/${a.slug}` === pathname,
  ) || allContent.find(
    (a) =>
      a.slug === pathname.split("/").pop() &&
      a.category.toLowerCase() === segment.toLowerCase(),
  );

  const activeOrigin = activeArticle?.origin;

  const categoryArticles = allContent.filter(
    (a) =>
      a.category.toLowerCase() === segment.toLowerCase() &&
      a.origin === activeOrigin,
  );
  if (!categoryArticles.length) return [];

  return [
    {
      sectionTitle: section.label,
      items: buildSidebarItemsForCategory(categoryArticles),
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

  // Track explicit user toggles for any expandable node (section or sub-group).
  // Keys are unique paths like "Section" or "Section/Group".
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  if (!sections.length) return null;

  const containsActive = (items: SidebarItem[]): boolean =>
    items.some((item) =>
      item.kind === "leaf"
        ? pathname === item.href
        : containsActive(item.items),
    );

  const isExpanded = (key: string, items: SidebarItem[]) =>
    overrides[key] ?? containsActive(items);

  const toggle = (key: string, items: SidebarItem[]) => {
    setOverrides((prev) => ({
      ...prev,
      [key]: !isExpanded(key, items),
    }));
  };

  return (
    <ul className={clsx(className, "relative m-0 list-none p-0")}>
      {sections.map((section) => (
        <SidebarSectionGroup
          key={section.sectionTitle}
          section={section}
          path={section.sectionTitle}
          isExpanded={isExpanded(section.sectionTitle, section.items)}
          onToggle={() => toggle(section.sectionTitle, section.items)}
          onNavigate={onNavigate}
          pathname={pathname}
          isExpandedFn={isExpanded}
          toggleFn={toggle}
        />
      ))}
    </ul>
  );
}

function SidebarSectionGroup({
  section,
  path,
  isExpanded,
  onToggle,
  onNavigate,
  pathname,
  isExpandedFn,
  toggleFn,
}: {
  section: SidebarSection;
  path: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  pathname: string;
  isExpandedFn: (key: string, items: SidebarItem[]) => boolean;
  toggleFn: (key: string, items: SidebarItem[]) => void;
}) {
  const listId = useId();
  const sectionLabel = formatSectionLabel(section.sectionTitle);

  return (
    <li className="relative flex w-full select-none flex-col first:mt-2 last:mb-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={listId}
        className={clsx(
          "group flex w-full items-center justify-between gap-x-2 py-[6.5px]",
          "text-sm font-normal leading-[21px]",
          "text-gray-700 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
          "transition-colors",
        )}
      >
        <span className="truncate">{sectionLabel}</span>
        <ChevronDownIcon
          className={clsx(
            "h-1.5 w-2 stroke-current transition-transform duration-150",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>

      <ul
        id={listId}
        hidden={!isExpanded}
        className={clsx(
          "relative m-0 flex w-full list-none flex-col p-0 pl-3",
          "before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px",
          "before:bg-gray-950/10 dark:before:bg-white/10 before:content-['']",
        )}
      >
        {section.items.map((item) =>
          item.kind === "leaf" ? (
            <SidebarLeafRow
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <SidebarSubGroup
              key={item.label}
              group={item}
              path={`${path}/${item.label}`}
              isExpanded={isExpandedFn(`${path}/${item.label}`, item.items)}
              onToggle={() =>
                toggleFn(`${path}/${item.label}`, item.items)
              }
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ),
        )}
      </ul>
    </li>
  );
}

function SidebarSubGroup({
  group,
  isExpanded,
  onToggle,
  onNavigate,
  pathname,
}: {
  group: SidebarGroup;
  path: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  pathname: string;
}) {
  const listId = useId();

  return (
    <li className="flex w-full flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={listId}
        className={clsx(
          "flex w-full items-center justify-between gap-x-2 py-[6.5px]",
          "text-sm font-normal leading-[21px]",
          "text-gray-700 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
          "transition-colors",
        )}
      >
        <span className="truncate">{group.label}</span>
        <ChevronDownIcon
          className={clsx(
            "h-1.5 w-2 stroke-current transition-transform duration-150",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <ul
        id={listId}
        hidden={!isExpanded}
        className={clsx(
          "relative m-0 flex w-full list-none flex-col p-0 pl-3",
          "before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px",
          "before:bg-gray-950/10 dark:before:bg-white/10 before:content-['']",
        )}
      >
        {group.items.map((item) => (
          <SidebarLeafRow
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </li>
  );
}

function SidebarLeafRow({
  item,
  pathname,
  onNavigate,
}: {
  item: SidebarLeaf;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname === item.href;
  return (
    <li className="flex w-full">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "flex w-full py-[6.5px] text-sm font-normal leading-[21px] transition-colors",
          isActive
            ? "text-gray-950 dark:text-white"
            : "text-gray-700 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
        )}
      >
        {item.label}
      </Link>
    </li>
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
    <Dialog open={open} onClose={onClose} className="lg:hidden">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
      <DialogPanel className="fixed inset-y-0 left-0 w-72 overflow-y-auto bg-white px-4 py-6 pt-20 ring ring-gray-950/10 sm:px-6 dark:bg-black dark:ring-white/10">
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
        className="group mx-auto flex w-full max-w-[1400px]"
      >
        {/* Desktop sidebar — sticky in normal flow, lives inside the centered
            max-width container so on wide viewports it shifts toward center
            with the content (Vercel pattern). */}
        {hasSidebar && (
          <aside
            className={clsx(
              "sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[300px] shrink-0 overflow-y-auto lg:block",
              "group-data-[sidebar-collapsed]:hidden",
            )}
          >
            <nav aria-label="Sidebar navigation" className="px-8 py-3">
              <SidebarNav sections={sections} />
            </nav>
          </aside>
        )}

        {/* Page content fills the rest of the centered container. */}
        <div className="min-w-0 flex-1">{children}</div>
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
    <main className="px-4 sm:px-6">
      {/* Inline breadcrumb row — Vercel pattern: sidebar toggle + crumbs in the
          article gutter, scrolling with content. No background, no border. */}
      {!isHome && (breadcrumbs || hasSidebar(pathname)) && (
        <div className="mx-auto flex max-w-2xl items-center gap-x-3 pt-6 sm:pt-8 lg:max-w-5xl">
          {/* Mobile sidebar toggle */}
          <IconButton
            onClick={() => setIsMobileDialogOpen(!isMobileDialogOpen)}
            className="lg:hidden"
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
              className="max-lg:hidden"
              aria-label="Expand sidebar"
            >
              <SidebarIcon className="shrink-0 stroke-gray-950 dark:stroke-white" />
            </IconButton>
          )}
          {breadcrumbs && (
            <div className="min-w-0 text-sm text-gray-700 dark:text-gray-400">
              {breadcrumbs}
            </div>
          )}
        </div>
      )}

      {children}
    </main>
  );
}

function hasSidebar(pathname: string): boolean {
  // Inline-breadcrumb row also surfaces the sidebar toggle, so render it on
  // any non-home route. Home has no sidebar so we hide the row entirely there.
  return pathname !== "/";
}
