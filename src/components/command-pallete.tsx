"use client"

import { Combobox, ComboboxInput, ComboboxOption, Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react"
import { SearchIcon } from "@/icons/search-icon"
import { ArticleIcon } from "@/icons/article-icon"
import { CirclePlayIcon } from "@/icons/circle-play-icon"
import { useEffect, useState } from "react"
import { getModules } from "@/data/lessons"
import type React from "react"
import { useDebouncedCallback } from "use-debounce"

interface SearchResult {
  id: string
  title: string
  description: string
  type: "lesson" | "interview"
  module?: string
  url: string
  score?: number
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text

  // Split query into individual words for better matching
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  if (queryWords.length === 0) return text

  let highlightedText = text

  // Highlight each query word that appears in the text
  queryWords.forEach((word) => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    highlightedText = highlightedText.replace(regex, "**$1**")
  })

  // Convert markdown-style bold to JSX
  const parts = highlightedText.split(/\*\*(.*?)\*\*/g)

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="bg-yellow-200 dark:bg-yellow-800">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

export default function CommandPalette() {
  const [query, setQuery] = useState<string>("")
  const [open, setOpen] = useState<boolean>(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const modules = getModules()

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  // Debounced vector search function
  const searchVectors = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setError(null)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch("https://compass-ts.paulchrisluke.workers.dev/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Search failed")
      }

      const vectorResults = await response.json()
      const matches = vectorResults.matches?.matches || vectorResults.matches || []
      // Transform vector results to match our SearchResult interface
      const transformedResults: SearchResult[] = matches.map((result: any) => ({
        id: result.id,
        title: result.metadata?.title,
        description: result.metadata?.content,
        type: result.metadata?.type || "lesson",
        url: result.metadata?.url,
        score: result.score,
        module: result.metadata?.section,
      }))

      setResults(transformedResults)
    } catch (err) {
      console.error("Search error:", err)
      setError("Failed to perform search. Please try again.")
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, 300) // 300ms debounce

  // Update search effect to use vector search
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    searchVectors(query)
  }, [query, searchVectors])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm text-gray-950 shadow-sm outline outline-gray-950/5 backdrop-blur-sm hover:bg-gray-950/5 dark:bg-gray-950/75 dark:text-white dark:outline-white/10 dark:hover:bg-white/5"
      >
        <SearchIcon className="stroke-gray-950 dark:stroke-white" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-auto hidden text-2xs text-gray-500 dark:text-gray-500 lg:block">
          <kbd className="font-sans">⌘</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setQuery("")
          setError(null)
        }}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel className="mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-white/75 shadow-sm outline outline-gray-950/5 backdrop-blur-sm transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:bg-gray-950/75 dark:outline-white/10">
            <Combobox
              onChange={(item: SearchResult | null) => {
                setOpen(false)
                if (item?.url) {
                  let url = item.url
                  if (url && url.startsWith("/lessons/")) {
                    url = "/" + url.replace(/^\/lessons\//, "")
                  }
                  window.location.href = url
                }
              }}
            >
              <div className="grid grid-cols-1">
                <ComboboxInput
                  autoFocus
                  className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-gray-950 outline-none placeholder:text-gray-500 focus:ring-0 dark:text-white dark:placeholder:text-gray-500"
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
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}

                {!error && results.length > 0 && (
                  <div className="p-2">
                    <ul className="text-sm text-gray-950 dark:text-white">
                      {results.map((item) => (
                        <ComboboxOption
                          as="li"
                          key={item.id}
                          value={item}
                          className="group flex cursor-default select-none items-center rounded-md px-3 py-2 hover:bg-gray-950/5 dark:hover:bg-white/5"
                        >
                          {item.type === "lesson" ? (
                            <ArticleIcon
                              className="h-6 w-6 flex-none fill-gray-950 stroke-gray-950/40 dark:fill-white dark:stroke-white/40"
                              aria-hidden="true"
                            />
                          ) : (
                            <CirclePlayIcon
                              className="h-6 w-6 flex-none fill-gray-950 stroke-gray-950/40 dark:fill-white dark:stroke-white/40"
                              aria-hidden="true"
                            />
                          )}
                          <div className="ml-3 flex-auto">
                            <div className="font-semibold">{highlightQuery(item.title, query)}</div>
                            {item.module && (
                              <div className="text-xs text-gray-500">{highlightQuery(item.module, query)}</div>
                            )}
                            {item.description && (
                              <div className="text-xs text-gray-500 line-clamp-2">
                                {highlightQuery(
                                  item.description.length > 120
                                    ? item.description.substring(0, 120) + "..."
                                    : item.description,
                                  query,
                                )}
                              </div>
                            )}
                          </div>
                        </ComboboxOption>
                      ))}
                    </ul>
                  </div>
                )}

                {!error && query !== "" && results.length === 0 && !isSearching && (
                  <div className="px-6 py-14 text-center">
                    <ArticleIcon className="mx-auto h-6 w-6 fill-gray-950 stroke-gray-950/40 dark:fill-white dark:stroke-white/40" />
                    <p className="mt-4 text-sm text-gray-950 dark:text-white">
                      We couldn't find any matches for "{query}". Please try a different search term.
                    </p>
                  </div>
                )}
              </div>
            </Combobox>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
