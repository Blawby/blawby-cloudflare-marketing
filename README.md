# Blawby Marketing

Live site: https://blawby-cloudflare-marketing.pages.dev/

# Blawby

Blawby is a [Tailwind Plus](https://tailwindcss.com/plus) site template built using [Tailwind CSS](https://tailwindcss.com) and [Next.js](https://nextjs.org).

## Features

- Built with Next.js and Tailwind CSS
- Comprehensive SEO optimization
  - Open Graph tags for social sharing
  - Twitter Cards support
  - JSON-LD structured data
  - Dynamic metadata generation
  - Educational content markup
  - Video content optimization
- Cloudflare Pages deployment ready
- MDX support for content
- Responsive design
- Dark mode support
- Video player integration
- Interactive transcripts
- Chapter navigation
- Content organization with lessons, articles, and standalone pages
- Vector search indexing for all content types

## Getting started

To get started with this template, first install the npm dependencies:

```bash
npm install
```

Next, run the development server:

```bash
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Content Structure

The site organizes content into three main types:

### 1. Lessons (`/lessons/[slug]`)

- **Location**: `src/data/lessons/` directory
- **Configuration**: `src/data/lessons.ts`
- **URL Structure**: `/lessons/get-started`, `/lessons/payments`, etc.
- **Purpose**: Educational content for product features and guides

### 2. Articles & Guides (`/[category]/[slug]`)

- **Location**: `src/data/articles/[category]/` directories
- **Configuration**: `src/data/articles.ts`
- **URL Structure**: `/compliance/iolta-compliance`, `/business-strategy/future-proof-revenue`
- **Purpose**: In-depth articles organized by category

### 3. Pages (`/[slug]`)

- **Location**: `src/data/pages/` directory
- **Configuration**: `src/data/pages.ts`
- **URL Structure**: `/pricing`, `/help`
- **Purpose**: Standalone pages like pricing, help, etc.

## Feature Flags

### Hiding Interviews with SHOW_INTERVIEWS

The interviews feature is protected by a feature flag. By default, interviews pages and content are hidden from the site and return a 404 unless the environment variable `SHOW_INTERVIEWS` is set to `true`.

#### How to enable/disable interviews:

- **Local development:**
  - Add to your `.env.local` file:
    ```env
    SHOW_INTERVIEWS=false
    ```
    (Set to `true` to enable interviews locally.)

- **Cloudflare Pages:**
  - Add `SHOW_INTERVIEWS` as a plaintext environment variable in the Pages project's build variables. This is a feature flag, not a secret.

- **GitHub Actions/CI:**
  - Add `SHOW_INTERVIEWS` as a repository variable if your build/deploy workflow needs it.

**Default:** Interviews are hidden unless you explicitly set `SHOW_INTERVIEWS=true` in your environment.

## Secrets and Environment Variables

Do not put API keys, auth tokens, or passwords in `wrangler.toml`. Use:

- `.env.local` for Next.js local/build-time values such as `SHOW_INTERVIEWS`.
- `.env` for local Wrangler CLI/system values such as `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.
- `.dev.vars` for local Worker runtime secrets used by `wrangler dev`, such as `RESEND_API_KEY`.
- `pnpm wrangler secret put RESEND_API_KEY` for the deployed Worker.
- Cloudflare Pages project variables/secrets for Pages build/runtime values.

Copy `.env.example` and `.dev.vars.example` locally, then fill in real values. These local files are ignored by git.

When the project upgrades to a Wrangler version that supports the `secrets` configuration property without warnings, declare required Worker secrets in `wrangler.toml`.

## Deployment

This project is configured for deployment to Cloudflare Pages. To deploy:

1. Install Wrangler CLI globally:

```bash
npm install -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Build and deploy:

```bash
npm run build
wrangler pages deploy out
```

## SEO Configuration

The project includes comprehensive SEO support. Key files:

- `src/app/layout.tsx` - Root metadata configuration
- `src/app/(centered)/interviews/[slug]/page.tsx` - Video content metadata
- `src/app/(sidebar)/[category]/[slug]/page.tsx` - Educational content metadata

To complete SEO setup:

1. Update `metadataBase` in `src/app/layout.tsx` with your domain
2. Add Open Graph images:
   - `/public/og-image.jpg` (1200x630)
   - `/public/twitter-image.jpg` (1200x600)
3. Add Google Search Console verification code
4. Update `site.webmanifest` for PWA support
5. Add proper favicon and apple-touch-icon files

## AI Search Indexing

The site uses Cloudflare AI Search for semantic search and support chat. MDX files remain the source of truth in this repo, then CI uploads them to an R2 bucket for AI Search to index.

### Content Indexing

- **Script**: `scripts/upload-content-to-r2.mjs`
- **Source**: `src/data/**/*.mdx`
- **Destination**: R2 bucket configured by the `R2_CONTENT_BUCKET` environment variable
- **Object keys**: Match public routes where possible, for example `lessons/payments.mdx`, `pricing.mdx`, and `compliance/iolta-compliance.mdx`

### Search Worker

- **Location**: `src/workers/search.ts`
- **Features**:
  - Cloudflare AI Search retrieval from R2-indexed content
  - LLM intent classification
  - Special pricing query detection
  - Chat interface with LLM responses

### Indexing Process

```bash
# Upload MDX content to the AI Search R2 data source
R2_CONTENT_BUCKET=your-content-bucket pnpm run r2:upload-content

# Deploy search worker
npx wrangler deploy src/workers/search.ts
```

## Structured Data & Schema Utilities

To support SEO and rich results, the codebase includes several utilities for generating and injecting structured data (JSON-LD) into your pages:

### 1. Breadcrumb Schema Utility

- **File:** `src/utils/breadcrumb-schema.ts`
- **Function:** `getBreadcrumbSchema(items)`
- **Purpose:** Generates a [BreadcrumbList](https://schema.org/BreadcrumbList) JSON-LD object from an array of breadcrumb items (`{ name, url }`).
- **Usage:**
  - Import and use in any page where breadcrumbs are rendered.
  - Example:
    ```ts
    import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
    const breadcrumbItems = [
      { name: "Home", url: "https://blawby.com" },
      { name: "Overview", url: "https://blawby.com/" },
    ];
    const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);
    ```
  - Inject as a `<script type="application/ld+json">` in your page component.

### 2. HowTo Schema Utilities

- **File:** `src/utils/howto-schema.ts`
- **Functions:**
  - `parseHowToStepsFromMarkdown(md: string)`
    - Parses a Markdown string for ordered list steps and returns an array of step objects (`{ name, text }`).
  - `getHowToSchema({ name, description, steps })`
    - Generates a [HowTo](https://schema.org/HowTo) JSON-LD object from a title, description, and array of steps.
- **Usage:**
  - Use in lesson page components to auto-generate HowTo schema from MDX content.
  - Example:
    ```ts
    import {
      parseHowToStepsFromMarkdown,
      getHowToSchema,
    } from "@/utils/howto-schema";
    const steps = parseHowToStepsFromMarkdown(mdxContent);
    const howToSchema = getHowToSchema({
      name: lesson.title,
      description: lesson.description,
      steps,
    });
    ```
  - Inject as a `<script type="application/ld+json">` in your page component if steps are found.

### 3. Validation Script

- **File:** `scripts/validate-howto-schema.ts`
- **Purpose:** Scans all lesson MDX files, parses for HowTo steps, and prints a validation report. Ensures your content is eligible for HowTo rich results.
- **Usage:**
  - Run locally or in CI: `npx tsx scripts/validate-howto-schema.ts`

**Best Practices:**

- Only use HowTo schema for lessons with true step-by-step instructional content.
- Keep your MDX steps as true ordered lists for best schema extraction.
- Always match the visible UI breadcrumbs to the schema for consistency.

## Sitemap Generation

This project uses [next-sitemap](https://github.com/iamvishnusankar/next-sitemap) to automatically generate `sitemap.xml` and `robots.txt` after each build.

- The config file is `next-sitemap.config.js` and uses ES module syntax (`export default`).
- The sitemap is generated automatically in the deployment workflow.
- To generate the sitemap locally, run:

```bash
npx next-sitemap
```

This will use the default config file and output the sitemap and robots.txt in the appropriate directory.

## Customizing

You can start editing this template by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

### Content Management

#### Adding New Lessons

1. Create MDX file in `src/data/lessons/`
2. Add lesson entry to `src/data/lessons.ts`
3. Update sidebar automatically

#### Adding New Articles

1. Create MDX file in `src/data/articles/[category]/`
2. Add article entry to `src/data/articles.ts`
3. Update sidebar automatically

#### Adding New Pages

1. Create MDX file in `src/data/pages/`
2. Add page entry to `src/data/pages.ts`
3. Update sidebar automatically

#### Updating AI Search Content

After adding new content, upload the MDX source files to the R2 bucket connected to AI Search:

```bash
R2_CONTENT_BUCKET=your-content-bucket pnpm run r2:upload-content
```

## Images

This template uses the Next.js `<Image>` component to render images.

If your images are hosted remotely, update the `images.remotePatterns` setting in `next.config.ts` to match the correct URL. If you're serving images locally, you can remove the `images` key entirely.

When adding images to lesson markdown files, be sure to include the image size after the alt text, as the Next.js `<Image>` component requires this:

```md
![My alt tag|1000x500](my-image.png)
```

To support both light and dark mode images, insert `.{scheme}` before the file extension:

```md
![My alt tag|1000x500](my-image.light.png)
![My alt tag|1000x500](my-image.dark.png)
```

## License

This site template is a commercial product and is licensed under the [Tailwind Plus license](https://tailwindcss.com/plus/license).

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
- [MDX](https://mdxjs.com/) - the official MDX documentation
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) - Cloudflare Pages documentation

## Support Case & Feedback Storage (Cloudflare D1)

This project uses [Cloudflare D1](https://developers.cloudflare.com/d1/) as a production-grade relational database for support case and feedback storage. The API Worker exposes endpoints for support case creation and feedback collection, both backed by D1:

- **POST `/support-case/create`**: Stores a new support case with user ID, chat history, and context.
- **POST `/support-case/feedback`**: Stores user feedback (rating, comments) for a support case.

**D1 Schema:** See `scripts/d1-support-schema.sql` for the schema. Tables:

- `support_cases`: Stores case ID, user ID, chat history, context, and timestamps.
- `support_feedback`: Stores feedback for each case (case ID, rating, comments, timestamp).

**How it works:**

- The frontend (Preact) calls the Worker API to create a support case and submit feedback.
- All data is stored in D1 for strong consistency, analytics, and future admin/reporting needs.
- See `src/workers/search.ts` for endpoint implementation.

**To update the schema:**

```bash
npx wrangler d1 execute support --file=./scripts/d1-support-schema.sql --remote
```

## Automated AI Search Content Upload

After any lesson or page change, the following steps are run automatically in CI/CD (see .github/workflows/deploy.yml):

1. Build the static Next.js site.
2. Upload `src/data/**/*.mdx` to the configured R2 bucket.
3. Let Cloudflare AI Search index that R2 data source automatically.

Set the GitHub Actions repository variable `R2_CONTENT_BUCKET` to the R2 bucket connected to your AI Search instance.

## Local Development: AI Search & Workers AI

Blawby uses Cloudflare AI Search and Workers AI for search and chat endpoints. Configure:

- `AI_SEARCH_NAME` in `wrangler.toml` or `.dev.vars`
- `R2_CONTENT_BUCKET` when uploading local MDX content to R2

```bash
R2_CONTENT_BUCKET=your-content-bucket pnpm run r2:upload-content
pnpm exec wrangler dev
```

AI Search indexes the R2 bucket asynchronously, so fresh uploads may not be searchable immediately.
