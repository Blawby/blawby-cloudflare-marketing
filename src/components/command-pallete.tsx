'use client';

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogBackdrop,
} from '@headlessui/react';
import { SearchIcon } from '@/icons/search-icon';
import { ArticleIcon } from '@/icons/article-icon';
import { CirclePlayIcon } from '@/icons/circle-play-icon';
import { CheckmarkIcon } from '@/icons/checkmark-icon';
import { useEffect, useState } from 'react';
import { getModules, type Module, type Lesson } from '@/data/lessons';
import type { Interview } from '@/data/interviews';
import type React from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'interview';
  module?: string;
  url: string;
}

interface Action {
  name: string;
  icon: (props: React.ComponentProps<'svg'>) => React.ReactElement;
  shortcut: string;
  url: string;
}

const quickActions: Action[] = [
  { name: 'Go to Course', icon: ArticleIcon, shortcut: 'G', url: '/' },
  { name: 'View Interviews', icon: CirclePlayIcon, shortcut: 'V', url: '/interviews' },
  { name: 'Login', icon: CheckmarkIcon, shortcut: 'L', url: 'https://blawby.com/login' },
];

export default function CommandPalette() {
  const [query, setQuery] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const modules = getModules();

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Search through lessons and interviews
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search through lessons
    modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        if (
          lesson.title.toLowerCase().includes(searchTerm) ||
          lesson.description.toLowerCase().includes(searchTerm)
        ) {
          searchResults.push({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            type: 'lesson',
            module: module.title,
            url: `/${lesson.id}`,
          });
        }
      });
    });

    setResults(searchResults);
  }, [query, modules]);

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
          setOpen(false);
          setQuery('');
        }}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-950/25" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel
            className="mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-white/75 shadow-sm outline outline-gray-950/5 backdrop-blur-sm transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:bg-gray-950/75 dark:outline-white/10"
          >
            <Combobox
              onChange={(item: SearchResult | Action | null) => {
                setOpen(false);
                if (item?.url) {
                  window.location.href = item.url;
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
                <SearchIcon
                  className="pointer-events-none col-start-1 row-start-1 ml-4 h-5 w-5 self-center stroke-gray-950 dark:stroke-white"
                  aria-hidden="true"
                />
              </div>

              <div className="max-h-96 scroll-py-2 divide-y divide-gray-950/5 overflow-y-auto dark:divide-white/10">
                {(query === '' || results.length > 0) && (
                  <div className="p-2">
                    {query === '' && (
                      <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-gray-500">
                        Quick actions
                      </h2>
                    )}
                    <ul className="text-sm text-gray-950 dark:text-white">
                      {(query === '' ? quickActions : results).map((item) => (
                        <ComboboxOption
                          as="li"
                          key={item.url}
                          value={item}
                          className="group flex cursor-default select-none items-center rounded-md px-3 py-2 hover:bg-gray-950/5 dark:hover:bg-white/5"
                        >
                          {'icon' in item ? (
                            <item.icon
                              className="h-6 w-6 flex-none fill-gray-950 stroke-gray-950/40 dark:fill-white dark:stroke-white/40"
                              aria-hidden="true"
                            />
                          ) : item.type === 'lesson' ? (
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
                            <div className="font-semibold">
                              {'name' in item ? item.name : item.title}
                            </div>
                            {'module' in item && (
                              <div className="text-xs text-gray-500">
                                {item.module}
                              </div>
                            )}
                            {'description' in item && (
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {'shortcut' in item && (
                            <span className="ml-3 flex-none text-xs font-semibold text-gray-500">
                              <kbd className="font-sans">⌘</kbd>
                              <kbd className="font-sans">{item.shortcut}</kbd>
                            </span>
                          )}
                        </ComboboxOption>
                      ))}
                    </ul>
                  </div>
                )}

                {query !== '' && results.length === 0 && (
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
  );
}
