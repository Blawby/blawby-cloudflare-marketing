# Implementing Search with Cloudflare

## Current Project Structure

The project is a Next.js application with MDX content, structured as follows:

### Content Organization
- `/src/data/lessons.ts` - Main lesson data and content loading
- `/src/data/lessons/*.mdx` - Individual lesson content files
- `/src/data/interviews.ts` - Interview data
- `/src/data/interviews/*.vtt` - Interview transcripts

### Key Files
```typescript
// src/data/lessons.ts - Current content loading
export async function getLessonContent(slug: string) {
  return (await import(`@/data/lessons/${slug}.mdx`)).default;
}

// src/app/(sidebar)/[slug]/page.tsx - Page rendering
export async function generateStaticParams() {
  const modules = getModules();
  const validSlugs = modules.flatMap(module => 
    module.lessons.map(lesson => ({
      slug: lesson.id,
    }))
  );
}
```

## Search Implementation Plan

### 1. Preserve Existing MDX Setup
We'll keep the current MDX setup intact:
- Continue using `@next/mdx` for processing
- Maintain existing file structure in `/src/data/lessons/`
- Keep current content loading mechanism

### 2. Add Search Infrastructure

#### A. Create Search Worker
Create `/workers/search/index.ts`:
```typescript
interface Env {
  SEARCH_INDEX: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    // Handle CORS for local development
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');

    if (!searchTerm) {
      return new Response('Search term required', { status: 400 });
    }

    const results = await searchDocuments(searchTerm, env);
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
```

#### B. Add Command Palette Search Component
Create `/src/components/command-palette.tsx`:
```typescript
'use client';

import { Dialog, Combobox } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const debouncedSearch = useDebounce(query, 300);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm text-gray-500 shadow-sm ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:bg-gray-800/90 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20 lg:flex"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto hidden text-2xs text-gray-400 dark:text-gray-500 lg:block">
          <kbd className="font-sans">⌘</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>

      <Dialog open={isOpen} onClose={setIsOpen} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-gray-950/25 backdrop-blur-sm" />

        <Dialog.Panel className="fixed inset-x-4 top-8 mx-auto max-w-2xl rounded-xl bg-white shadow-2xl ring-1 ring-gray-950/10 dark:bg-gray-900 dark:ring-white/10 sm:top-12">
          <Combobox
            onChange={(value) => {
              setIsOpen(false);
              router.push(value.path);
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-gray-950/10 px-4 dark:border-white/10">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              <Combobox.Input
                className="h-12 w-full border-0 bg-transparent text-sm text-gray-950 placeholder:text-gray-500 focus:outline-none focus:ring-0 dark:text-white"
                placeholder="Search documentation..."
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {/* Search results */}
            <div className="max-h-96 overflow-y-auto px-2 py-4">
              <Combobox.Options static className="space-y-1">
                {/* Results rendered here */}
              </Combobox.Options>
            </div>
          </Combobox>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
```

### 3. Update Navigation
Modify `/src/components/navbar.tsx` to include the search:
```typescript
import { CommandPalette } from '@/components/command-palette';

function SiteNavigation() {
  let [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center gap-6">
      <CommandPalette /> {/* Add search here */}
      <IconButton className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
        <MenuIcon className="fill-gray-950 dark:fill-white" />
      </IconButton>
      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex gap-x-6 text-sm/6 text-gray-950 max-lg:hidden dark:text-white">
        <Link href="/">Course</Link>
        <Link href="/interviews">Interviews</Link>
        <Link href="https://blawby.com/login">Login</Link>
        <Link href="https://blawby.com/register">Register</Link>
      </div>
    </nav>
  );
}
```

### 4. Index Generation Process

We'll create a build-time script that:
1. Reads all MDX files
2. Extracts searchable content
3. Maintains existing MDX imports

Create `/scripts/build-search-index.ts`:
```typescript
import { getModules } from '../src/data/lessons';
import { promises as fs } from 'fs';
import path from 'path';

async function buildSearchIndex() {
  const modules = getModules();
  const searchIndex = {};

  for (const module of modules) {
    for (const lesson of module.lessons) {
      const filePath = path.join(
        process.cwd(),
        'src/data/lessons',
        `${lesson.id}.mdx`
      );
      
      const content = await fs.readFile(filePath, 'utf8');
      searchIndex[lesson.id] = {
        title: lesson.title,
        description: lesson.description,
        content: content,
        path: `/${lesson.id}`,
        module: module.title
      };
    }
  }

  return searchIndex;
}
```

### 5. Integration with Existing UI

The Command Palette will be integrated into the top navigation, providing:
- Keyboard shortcut (⌘K / Ctrl+K) for quick access
- Modern floating search interface
- Real-time search results
- Keyboard navigation
- Mobile-responsive design

### 6. Deployment Configuration

Update `wrangler.toml`:
```toml
name = "blawby-search"
main = "workers/search/index.ts"
compatibility_date = "2024-03-20"

kv_namespaces = [
  { binding = "SEARCH_INDEX", id = "your-kv-namespace-id" }
]

[env.production]
routes = [
  { pattern = "api/search", zone_id = "your-zone-id" }
]
```

Add to `next.config.mjs`:
```javascript
const nextConfig = {
  // ... existing config
  async rewrites() {
    return [
      // ... existing rewrites
      {
        source: '/api/search',
        destination: 'https://your-worker.workers.dev/search'
      }
    ]
  }
};
```

### 6. Build Process Integration

Update `package.json`:
```json
{
  "scripts": {
    "build": "npm run build:search && next build",
    "build:search": "tsx scripts/build-search-index.ts"
  }
}
```

## Implementation Steps

1. **Setup (No Changes to Existing Code)**
   ```bash
   # Create worker
   mkdir -p workers/search
   touch workers/search/index.ts
   
   # Create search component
   touch src/components/command-palette.tsx
   
   # Create build script
   touch scripts/build-search-index.ts
   ```

2. **Deploy Search Worker**
   ```bash
   wrangler kv:namespace create "SEARCH_INDEX"
   wrangler deploy
   ```

3. **Test Integration**
   ```bash
   # Local development
   npm run dev
   
   # Production build
   npm run build
   ```

## Benefits of This Approach

1. **Modern User Experience**
   - Command palette interface familiar to developers
   - Keyboard-first navigation
   - Fast, responsive search
   - Beautiful UI that matches existing design

2. **Performance**
   - Search index built at build time
   - Cloudflare Workers provide edge computing
   - KV storage for fast lookups

3. **Maintainability**
   - Separate search concerns from main application
   - Easy to update search index
   - Clear separation of concerns

## Next Steps

1. Implement the search worker
2. Create the command palette component
3. Set up the build process
4. Deploy and test
5. Monitor and optimize performance

## Resources
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Headless UI Command Palette](https://headlessui.com/react/combobox)
- [Heroicons](https://heroicons.com/)

## Routing API Requests to Cloudflare Workers on Cloudflare Pages

When using **Cloudflare Pages** for static hosting, but needing dynamic API endpoints (like `/api/search` for live search), you must route those API requests to a Cloudflare Worker. Here's how to do it, and what each config file/option is for:

### 1. What is `wrangler.toml` for?
- **Deploying Workers:** Use `wrangler.toml` to configure and deploy your Worker code (e.g., your search API) using the Wrangler CLI.
- **Building Pages:** The `[build]` section in `wrangler.toml` tells Cloudflare how to build your static site for Pages.
- **NOT for routing:** `wrangler.toml` does **not** control how requests are routed between your static site and your Worker.

### 2. How do you route `/api/search` to your Worker?

#### Option A: Use a `_redirects` file (Recommended for most static sites)
- Create a file named `_redirects` in your `public/` or output directory (`out/`).
- Add a line like:
  ```
  /api/search  https://your-worker.your-account.workers.dev/search  200
  ```
- This tells Cloudflare Pages to proxy `/api/search` requests to your Worker.
- [Cloudflare Pages Redirects Docs](https://developers.cloudflare.com/pages/platform/redirects/)

#### Option B: Use the Cloudflare Dashboard
- Go to the Cloudflare dashboard for your domain.
- Set up a route (e.g., `yourdomain.com/api/search*`) to point to your Worker.
- This is required if you want more advanced routing or if you don't want to use a `_redirects` file.

### 3. Can you use Wrangler CLI to set up these redirects?
- **No.** The Wrangler CLI (`wrangler.toml`) is for deploying Workers and configuring their environment, but it does **not** set up routing for Cloudflare Pages static sites.
- Routing for static sites must be done with a `_redirects` file or in the Cloudflare dashboard.

### 4. Summary Table

| Purpose                        | Use `wrangler.toml`? | Use `_redirects`? | Use Dashboard? |
|---------------------------------|:-------------------:|:-----------------:|:--------------:|
| Deploy Worker                   |         ✅          |         ❌        |      ❌        |
| Build static site (Pages)       |         ✅          |         ❌        |      ❌        |
| Proxy `/api/search` to Worker   |         ❌          |         ✅        |      ✅        |

### 5. Example Workflow
1. **Deploy your Worker** using Wrangler CLI (`wrangler publish`).
2. **Deploy your static site** to Cloudflare Pages (using your build output directory).
3. **Add a `_redirects` file** to your static site output with the line above to route `/api/search` to your Worker.
4. **(Optional)** Set up routing in the Cloudflare dashboard for more advanced scenarios.

---

**In summary:**
- Use `wrangler.toml` for Worker config and Pages build.
- Use `_redirects` (or dashboard) for routing API requests from your static site to your Worker.
- You cannot use the Wrangler CLI to set up these redirects for Pages; it must be done with a `_redirects` file or in the dashboard.
