# Compass

Compass is a [Tailwind Plus](https://tailwindcss.com/plus) site template built using [Tailwind CSS](https://tailwindcss.com) and [Next.js](https://nextjs.org).

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
- `src/app/(sidebar)/[slug]/page.tsx` - Educational content metadata

To complete SEO setup:

1. Update `metadataBase` in `src/app/layout.tsx` with your domain
2. Add Open Graph images:
   - `/public/og-image.jpg` (1200x630)
   - `/public/twitter-image.jpg` (1200x600)
3. Add Google Search Console verification code
4. Update `site.webmanifest` for PWA support
5. Add proper favicon and apple-touch-icon files

## Customizing

You can start editing this template by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

### Content Management

All course content is located in the `/src/data/lessons.ts` file and the `/src/data/lessons` folder.

All interview content is located in the `/src/data/interviews.ts` file and the `/src/data/interviews` folder.

## Images

This template uses the Next.js `<Image>` component to render images.

If your images are hosted remotely, update the `images.remotePatterns` setting in `next.config.ts` to match the correct URL. If you're serving images locally, you can remove the `images` key entirely.

When adding images to lesson markdown files, be sure to include the image size after the alt text, as the Next.js `<Image>` component requires this:

```md
![My alt tag|1000x500](my-image.png)
```

To support both light and dark mode images, insert `.{scheme}` before the file extension:

```md
![My alt tag|1000x500](my-image.{scheme}.png)
```

Then provide two versions of the image:

- `my-image.light.png` for light mode
- `my-image.dark.png` for dark mode

## License

This site template is a commercial product and is licensed under the [Tailwind Plus license](https://tailwindcss.com/plus/license).

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
- [MDX](https://mdxjs.com/) - the official MDX documentation
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) - Cloudflare Pages documentation

## ⚡️ Cloudflare Bleeding Edge Integration Notes

This project uses the latest Cloudflare Workers AI and Vectorize features. If you encounter issues with the Vectorize binding (e.g., valid vectors being rejected), see `cloudflare.md` for a full debugging log and workaround. 

**Current best practice:**
- Use the Vectorize v2 REST API from Workers (not the binding) for all vector search operations.
- See the end of `cloudflare.md` for details and code examples.

## 🔄 Automated Cloudflare Vectorize Indexing & Pruning

- All MDX content is indexed and pruned automatically via a TypeScript script and GitHub Actions workflow.
- The script reads all MDX, chunks by heading, embeds with Workers AI, and upserts to Vectorize via REST API.
- Pruning is manifest-based: `scripts/vector-manifest.json` tracks all upserted vector IDs. On each run, any vectors not present in the current content are deleted.
- The workflow runs on push to `master` and nightly. If you see '0 workflow runs', check that your workflow triggers on the correct branch (e.g., `master` not `main`).
- Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets.
- See `cloudflare.md` for full details, troubleshooting, and the Vectorize binding bug/workaround.

## Chunking MDX Lessons for Vector Search

To generate vector-ready chunks from your lessons for semantic search:

```bash
npm run chunk:lessons
```

This will output `lesson-chunks.json` in the project root.

To upsert the chunks to your Vectorize index, run:

```bash
curl -X POST https://compass-ts.paulchrisluke.workers.dev/upsert-mdx \
  -H "Content-Type: application/json" \
  --data-binary @lesson-chunks.json
```

This will embed and upsert all lesson chunks to your Cloudflare Vectorize index via your Worker.

## 🔍 Hybrid Semantic + Keyword Search (Cloudflare Vectorize)

This project uses a hybrid search approach for best-in-class relevance:

- **Semantic search:** All content is embedded and indexed in Cloudflare Vectorize using Workers AI.
- **Metadata upsert:** Each vector is upserted with rich metadata (e.g., `title`, `section`, `url`, etc.).
- **Hybrid re-ranking:**
  - At query time, the Worker embeds the query and runs a vector search (topK=10).
  - Results are post-processed in the Worker: if any query word matches the `title` or `section` in metadata, that result's score is boosted.
  - Results are sorted by the new score, so exact or partial keyword matches (like "Pricing") appear at the top, even if the semantic score is similar.
- **No extra infra:** This is fully Cloudflare-supported, scalable, and requires no separate keyword index or third-party service.

**Why this approach?**
- Combines the recall of semantic search with the precision of keyword search.
- Ensures exact matches (e.g., a page literally titled "Pricing") always rank highest for relevant queries.
- Easy to tune and maintain.

See `src/workers/search.ts` for the implementation details
