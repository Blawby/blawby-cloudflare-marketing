# Blawby Marketing Site Rules

## Core Features
- Built with Next.js and Tailwind CSS
- Comprehensive SEO optimization required for all pages
- Cloudflare Pages deployment ready
- MDX support for content
- Responsive design
- Dark mode support

## React Component Rules
- **Key Management:** Always use unique, stable identifiers (like UUIDs or database IDs) for `key` props when mapping over arrays. Never use array index as a key.

## MDX Content Rules
- **Heading Structure:** Ensure unique heading text within each section and use descriptive slugs. Maintain proper hierarchical structure without skipping levels.

## Development Rules

1. **New Pages Must Include:**
   - Proper metadata (Dynamic generation)
   - Open Graph tags
   - Twitter Cards
   - JSON-LD structured data

2. **Content Management:**
   - All course content must be in `/src/data/lessons.ts` and `/src/data/lessons` folder
   - All interview content must be in `/src/data/interviews.ts` and `/src/data/interviews` folder
   - Follow existing MDX patterns for consistency

3. **Image Requirements:**
   - Use Next.js `<Image>` component for all images
   - Include image dimensions after alt text: `![Alt text|1000x500](/path/to/image.png)`
   - For dark/light mode support use: `![Alt text|1000x500](/path/to/image.{scheme}.png)`
   - Provide both versions: `image.light.png` and `image.dark.png`

4. **SEO Configuration:**
   - Update `metadataBase` in `src/app/layout.tsx` with proper domain
   - Maintain required Open Graph images: `/public/og-image.jpg` (1200x630) and `/public/twitter-image.jpg` (1200x600)
   - Keep Google Search Console verification current
   - Maintain up-to-date `site.webmanifest`, favicon, and apple-touch-icon files

5. **Deployment:**
   - Test builds locally before deployment
   - Use Wrangler for Cloudflare Pages deployment

## Content Guidelines
- Keep content focused on legal payment processing
- Maintain professional tone
- Ensure all claims are accurate and verifiable
- Include clear calls-to-action
- Maintain consistent branding
- Focus on benefits and solutions

## Technical Requirements
- Keep files under 500 lines of code
- Split larger files into organized folders
- Maintain proper TypeScript types
- Follow Next.js best practices
- Ensure proper error handling
- Maintain clean code structure

## General Requirements
- **Testing:** Test major functionality, responsive design, dark mode, and SEO elements.
- **Performance:** Optimize images, minimize bundle size, ensure fast page loads, and monitor Core Web Vitals.
- **Security:** Protect sensitive data, follow security best practices, and implement proper access controls.
- **Accessibility:** WCAG 2.1 compliance, proper ARIA labels, keyboard navigation, screen reader support, and color contrast compliance.
