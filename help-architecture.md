# Support/Search Architecture Overview

## Existing Implementation

### 1. Vectorized Content Search (Cloudflare Workers)
- The project already includes a Cloudflare Worker (`src/workers/search.ts`) that provides a semantic and hybrid keyword search over all indexed content (MDX lessons, interviews, etc.).
- Content is chunked and embedded using Workers AI, then indexed in Cloudflare Vectorize.
- The Worker exposes a `/query` endpoint:
  - Accepts a user query, embeds it, and performs a vector search (topK=10) against the index.
  - Results are re-ranked: if any query word matches the `title` or `section` in metadata, that result's score is boosted (hybrid search).
  - Returns the top matches with metadata and scores.
- There is also an `/upsert-mdx` endpoint for bulk upserting new or updated content chunks into the vector index.
- CORS is enabled for all endpoints, allowing frontend integration.

### 2. Content Chunking & Indexing
- Scripts exist to chunk MDX content and generate `lesson-chunks.json`.
- Chunks are embedded and upserted to Vectorize via the Worker.

### 3. Usage
- The Worker can be called from the frontend or via `curl` for semantic/hybrid search:

```bash
curl -X POST https://<your-worker-domain>/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I deploy to Cloudflare Pages?"}'
```

- The response includes the most relevant content chunks and their metadata.

## Next Steps for Support Page
- The current setup provides the backend for a support chatbot and RAG system.
- To build a support page like Vercel's:
  - Add a frontend chat UI that calls the `/query` endpoint.
  - Add a conversational RAG step (AI-generated answers from top chunks).
  - Provide a fallback support form if the user's concern isn't resolved.

---

This architecture enables hybrid semantic and keyword search over all indexed content, and is ready for integration into a support/help page with minimal additional backend work.

# Support Chat & Form: Implementation Plan

## Goal
- Build a support/help page at **/help** (mirroring Vercel's approach) using a **custom chat UI** fully integrated with the Cloudflare Workers AI/RAG backend.
- The custom chat UI will follow the existing color palette, typography, and style patterns of the site for a seamless, branded experience.

## Approach
- **Build a custom chat UI** at `/help` using the site's existing design system (colors, buttons, inputs, layout, etc.).
- Configure the chat UI to use your Cloudflare Worker endpoints for chat, completions, and search.
- The chat UI will handle all conversational support.
- **At the bottom of the chat UI, always display an option for the user to create a support case ("Create Case") and a note such as:**
  - _"Generated with AI. Consider checking for important information. Need help? Create Case"_ (just like Vercel).
- The support form is always available as an option, not only if the AI is unable to resolve the issue.

## Advanced Support Flow (Vercel-style, Static Site Adapted)
1. **User interacts with the custom chat UI at `/help`**.
2. **The chat UI collects structured information through conditional forms and prompts:**
   - Product selection (dropdown, if multiple products)
   - Area/problem type (dropdown)
   - Severity level (dropdown)
   - Subject
   - Description (rich textarea)
   - Email (required, since there is no account system)
   - Name (optional)
   - File upload (optional)
3. **At any time, the user can choose to open the full support form via the "Create Case" option at the bottom of the chat.**
4. **The support form is pre-filled with information already collected in the chat.**
5. **User reviews and submits the case.**
6. **Form data is sent via POST** to a Next.js API endpoint (e.g., `/api/help-form`).
   - **Payload example:**
     ```json
     {
       "product": "Your Product",
       "area": "Deployment",
       "severity": "High",
       "subject": "Deployment failing",
       "description": "Full details of the issue...",
       "email": "user@example.com",
       "name": "User Name",
       "chatContext": "Chat history or additional info",
       "fileUrl": "https://..." // if file uploaded
     }
     ```
7. **API endpoint receives the POST request.**
   - Validate and sanitize the input (required fields, valid email, etc).
   - **Send a support case notification email via [Resend](https://resend.com/) to the support team at blawby.com.**
   - (The Resend API key and domain are already configured for blawby.com.)
8. **After submission, the chat UI provides a feedback prompt about the AI support experience (e.g., satisfaction rating, comments).**

## What We Have (src/components)
- **Button** (`button.tsx`): For actions like sending messages or submitting forms.
- **Input/TextInput** (`input.tsx`): For user input fields.
- **Dropdown** (`dropdown.tsx`): For product/account selection if needed.
- **Dialog/Modal**: Available via Headless UI, used in several components.
- **Layout Components**: For page structure (CenteredPageLayout, SidebarLayout, etc.).

## What We Need to Build/Integrate
- **Custom Chat UI** at `/help` (not HuggingFace Chat UI), following the site's color and style patterns.
- **Configure backend endpoints** to connect the chat UI to your Cloudflare Worker for RAG/search and completions.
- **SupportForm**: Multi-step, conditional form for case creation (fields as above), pre-filled from chat context if possible.
- **Next.js API endpoint** (`/api/help-form`) to receive POST requests from the support form, with input validation and Resend email delivery.
- **Feedback prompt** in the chat UI after case submission.

## Cloudflare Chat UI Integration
- Cloudflare provides the backend (AI/RAG, vector search, etc.) but does NOT provide a frontend chat UI.
- We will build our own custom chat UI, styled to match the rest of the site, and connect it to the Cloudflare Worker endpoints for answers.

## Summary Table
| Component           | Exists? | File/Notes                |
|---------------------|---------|---------------------------|
| Button              | Yes     | button.tsx                |
| Input/TextInput     | Yes     | input.tsx                 |
| Dropdown            | Yes     | dropdown.tsx              |
| Custom Chat UI      | No      | To build at /help         |
| SupportForm         | No      | To build/integrate        |
| API endpoint        | No      | To build: /api/help-form  |
| Feedback prompt     | No      | To build/integrate        |

## Next Steps
- Build and style the custom chat UI at `/help`, pointing it to your Cloudflare Worker backend for AI-powered support.
- Use existing Button, Input, and Dropdown components for any custom form or UI needs.
- Build the `/api/help-form` endpoint to receive POST requests from the support form, with input validation and Resend email delivery.
- Add a feedback prompt to the chat UI after case submission.

# Layout Consistency Requirement

## Navigation, Footer, and Sidebar Patterns
- **All pages (including static pages like /privacy, /terms, /help) must use the existing SidebarLayout, Navbar, and Footer components.**
- The sidebar should always be present, even if some sections are empty or minimal for certain pages.
- This ensures a unified navigation experience and consistent structure across the entire site.
- **How to apply:**
  - For all new pages, wrap content in SidebarLayout so the sidebar, navbar, and footer are always present and aligned.
  - If a page does not have sidebar content, pass an empty or minimal modules array, but SidebarLayout should still render for layout consistency.
- This guarantees all pages are visually and functionally consistent, responsive, and easy to navigate.
