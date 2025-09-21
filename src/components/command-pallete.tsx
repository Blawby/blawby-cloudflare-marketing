"use client";

import { getModules } from "@/data/lessons";
import { ArticleIcon } from "@/icons/article-icon";
import { SearchIcon } from "@/icons/search-icon";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import clsx from "clsx";
import type React from "react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "lesson" | "interview";
  module?: string;
  url: string;
  score?: number;
  section?: string;
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;

  // Create a case-insensitive regex for the full query and individual words
  const fullQueryRegex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1);

  let result = text;

  // First try to highlight the full query
  if (fullQueryRegex.test(text)) {
    result = text.replace(
      fullQueryRegex,
      "|||HIGHLIGHT_START|||$1|||HIGHLIGHT_END|||",
    );
  } else {
    // If full query doesn't match, try individual words
    words.forEach((word) => {
      const wordRegex = new RegExp(
        `(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      result = result.replace(
        wordRegex,
        "|||HIGHLIGHT_START|||$1|||HIGHLIGHT_END|||",
      );
    });
  }

  // Convert to JSX
  const parts = result.split(
    /\|\|\|HIGHLIGHT_START\|\|\|(.*?)\|\|\|HIGHLIGHT_END\|\|\|/g,
  );

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="font-semibold text-gray-950 dark:text-white">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Update capitalizeTitle to also replace dashes with spaces
function capitalizeTitle(title: string): string {
  return title
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Utility to group results by url - now only keeping the best match per URL
function groupResultsByUrl(results: SearchResult[]) {
  const urlMap: Record<string, SearchResult> = {};

  // Group by URL and keep the result with highest score or most relevant content
  for (const item of results) {
    const existing = urlMap[item.url];
    const existingScore = existing?.score;
    if (
      !existing ||
      (typeof item.score === "number" &&
        typeof existingScore === "number" &&
        item.score > existingScore)
    ) {
      urlMap[item.url] = item;
    }
  }

  return Object.values(urlMap);
}

export default function CommandPalette() {
  const [query, setQuery] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const modules = getModules();

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Debounced vector search function
  const searchVectors = useDebouncedCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        "https://compass-ts.paulchrisluke.workers.dev/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: trimmedQuery }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const vectorResults = await response.json();
      const matches =
        vectorResults.matches?.matches || vectorResults.matches || [];
      // Transform vector results to match our SearchResult interface
      const transformedResults: SearchResult[] = matches.map((result: any) => {
        return {
          id: result.id,
          title: result.metadata?.title || result.metadata?.name || "Untitled",
          description:
            result.metadata?.content ||
            result.metadata?.description ||
            result.metadata?.text ||
            result.metadata?.body,
          type: result.metadata?.type || "lesson",
          url: result.metadata?.url,
          score: result.score,
          module: result.metadata?.section || result.metadata?.module,
          section: result.metadata?.section,
        };
      });

      setResults(transformedResults);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to perform search. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300); // 300ms debounce

  // Update search effect to use vector search
  useEffect(() => {
    if (!query) {
      setResults([]);
      // Do NOT close the palette when query is cleared
      return;
    }
    searchVectors(query);
  }, [query, searchVectors]);

  // Navigate to URL function
  const navigateToUrl = (url: string) => {
    if (url && url.startsWith("/lessons/")) {
      url = "/" + url.replace(/^\/lessons\//, "");
    }
    window.location.href = url;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm text-gray-950 shadow-sm outline outline-gray-950/5 backdrop-blur-sm hover:bg-gray-950/5 dark:bg-gray-950/75 dark:text-white dark:outline-white/10 dark:hover:bg-white/5"
      >
        <SearchIcon className="stroke-gray-950 dark:stroke-white" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="text-2xs ml-auto hidden text-gray-500 lg:block dark:text-gray-500">
          <kbd className="font-sans">⌘</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
          setError(null);
        }}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-950/25 dark:bg-black/60" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel className="mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-white/75 shadow-sm outline outline-gray-950/5 backdrop-blur-sm transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in dark:bg-gray-950/75 dark:outline-white/10">
            <Combobox
              onChange={(item: unknown) => {
                const searchResult = item as SearchResult | null;
                setOpen(false);
                if (searchResult?.url) {
                  navigateToUrl(searchResult.url);
                }
                setSelectedResultId(searchResult?.id || null);
              }}
            >
              <div className="grid grid-cols-1">
                <ComboboxInput
                  autoFocus
                  className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pr-4 pl-11 text-[16px] text-gray-950 outline-none placeholder:text-gray-500 focus:ring-0 dark:text-white dark:placeholder:text-gray-400"
                  placeholder="Search documentation..."
                  onChange={(event) => setQuery(event.target.value)}
                />
                {isSearching ? (
                  <div className="pointer-events-none col-start-1 row-start-1 ml-4 h-5 w-5 self-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-950/20 border-t-gray-950 dark:border-white/20 dark:border-t-white" />
                  </div>
                ) : (
                  <SearchIcon
                    className="pointer-events-none col-start-1 row-start-1 ml-4 h-5 w-5 self-center stroke-gray-950 dark:stroke-white"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="max-h-96 scroll-py-2 divide-y divide-gray-950/5 overflow-y-auto dark:divide-white/10">
                {error && (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm text-red-500 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {!error && results.length > 0 && (
                  <div className="p-2">
                    <ul className="text-sm text-gray-950 dark:text-white">
                      {groupResultsByUrl(results).map((item) => {
                        const isActive = selectedResultId === item.id;
                        return (
                          <ComboboxOption
                            as="li"
                            key={item.id}
                            value={item}
                            aria-current={isActive ? "page" : undefined}
                            className={clsx(
                              "mb-4 cursor-pointer rounded-lg px-4 py-3",
                              "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                              isActive && "bg-gray-100 dark:bg-gray-800/50",
                            )}
                          >
                            {/* Clickable page title */}
                            <button
                              onClick={() => navigateToUrl(item.url)}
                              className="w-full cursor-pointer text-left"
                            >
                              <h3 className="mb-1 text-lg font-semibold text-gray-950 hover:underline dark:text-white">
                                {highlightQuery(
                                  capitalizeTitle(item.title),
                                  query,
                                )}
                              </h3>

                              {/* Module/section info if available - avoid duplicates */}
                              {(item.module || item.section) && (
                                <div className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  {/* Only show one if they're the same, otherwise show both with separator */}
                                  {item.module &&
                                  item.section &&
                                  item.module !== item.section ? (
                                    <>
                                      {highlightQuery(item.module, query)} ›{" "}
                                      {highlightQuery(item.section, query)}
                                    </>
                                  ) : (
                                    highlightQuery(
                                      item.module || item.section || "",
                                      query,
                                    )
                                  )}
                                </div>
                              )}

                              {/* Description snippet */}
                              {item.description && (
                                <div className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                  {highlightQuery(
                                    item.description.length > 160
                                      ? item.description.substring(0, 160) +
                                          "..."
                                      : item.description,
                                    query,
                                  )}
                                </div>
                              )}

                              {/* URL display */}
                              <div className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                                {item.url}
                              </div>
                            </button>
                          </ComboboxOption>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {!error &&
                  query !== "" &&
                  results.length === 0 &&
                  !isSearching && (
                    <div className="px-6 py-14 text-center">
                      <ArticleIcon className="mx-auto h-6 w-6 fill-gray-950 stroke-gray-950/40 dark:fill-white dark:stroke-white/40" />
                      <p className="text-base mt-4 text-sm text-gray-700 dark:text-gray-300">
                        We couldn't find any matches for "{query}". Please try a
                        different search term.
                      </p>
                    </div>
                  )}
              </div>
            </Combobox>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
