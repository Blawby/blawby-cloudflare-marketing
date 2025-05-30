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
