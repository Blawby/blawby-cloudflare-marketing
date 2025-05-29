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
  icon: (props: React.ComponentProps<'svg'>) => JSX.Element;
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
        className="group flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm text-gray-500 shadow-sm ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:bg-gray-800/90 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20 lg:flex"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto hidden text-2xs text-gray-400 dark:text-gray-500 lg:block">
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
        <DialogBackdrop
          className="fixed inset-0 bg-gray-500/25 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel
            className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:divide-gray-800 dark:bg-gray-900 dark:ring-white/10"
          >
            <Combobox
              onChange={(item: SearchResult | Action) => {
                setOpen(false);
                window.location.href = item.url;
              }}
            >
              <div className="grid grid-cols-1">
                <ComboboxInput
                  autoFocus
                  className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white dark:placeholder:text-gray-500"
                  placeholder="Search documentation..."
                  onChange={(event) => setQuery(event.target.value)}
                />
                <SearchIcon
                  className="pointer-events-none col-start-1 row-start-1 ml-4 h-5 w-5 self-center text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
              </div>

              <div className="max-h-96 scroll-py-2 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {(query === '' || results.length > 0) && (
                  <div className="p-2">
                    {query === '' && (
                      <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Quick actions
                      </h2>
                    )}
                    <ul className="text-sm text-gray-700 dark:text-gray-200">
                      {(query === '' ? quickActions : results).map((item) => (
                        <ComboboxOption
                          as="li"
                          key={item.url}
                          value={item}
                          className="group flex cursor-default select-none items-center rounded-md px-3 py-2 data-[focus]:bg-blue-600 data-[focus]:text-white dark:data-[focus]:bg-blue-500"
                        >
                          {'icon' in item ? (
                            <item.icon
                              className="h-6 w-6 flex-none text-gray-400 group-data-[focus]:text-white dark:text-gray-500"
                              aria-hidden="true"
                            />
                          ) : item.type === 'lesson' ? (
                            <ArticleIcon
                              className="h-6 w-6 flex-none text-gray-400 group-data-[focus]:text-white dark:text-gray-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <CirclePlayIcon
                              className="h-6 w-6 flex-none text-gray-400 group-data-[focus]:text-white dark:text-gray-500"
                              aria-hidden="true"
                            />
                          )}
                          <div className="ml-3 flex-auto">
                            <div className="font-semibold">
                              {'name' in item ? item.name : item.title}
                            </div>
                            {'module' in item && (
                              <div className="text-xs text-gray-500 group-data-[focus]:text-blue-200 dark:text-gray-400">
                                {item.module}
                              </div>
                            )}
                            {'description' in item && (
                              <div className="text-xs text-gray-500 group-data-[focus]:text-blue-200 dark:text-gray-400">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {'shortcut' in item && (
                            <span className="ml-3 flex-none text-xs font-semibold text-gray-400 group-data-[focus]:text-blue-200 dark:text-gray-500">
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
                    <ArticleIcon className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-sm text-gray-900 dark:text-white">
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
