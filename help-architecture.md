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
- The current setup provides the backend for a support chatbot or RAG system.
- To build a support page like Vercel's:
  - Add a frontend chat UI that calls the `/query` endpoint.
  - Optionally, add a conversational RAG step (AI-generated answers from top chunks).
  - Provide a fallback support form if the user's concern isn't resolved.

---

This architecture enables hybrid semantic and keyword search over all indexed content, and is ready for integration into a support/help page with minimal additional backend work.

# Support Chat & Form: Implementation Plan

## Goal
- Build a support/help page at **/help** (mirroring Vercel's approach) using the **HuggingFace Chat UI** as the frontend, fully integrated with the Cloudflare Workers AI/RAG backend.

## Approach
- Deploy the open-source [HuggingFace Chat UI](https://github.com/huggingface/chat-ui) at `/help`.
- Configure HuggingFace Chat UI to use your Cloudflare Worker endpoints for chat, completions, and search ([Cloudflare integration guide](https://developers.cloudflare.com/workers-ai/configuration/hugging-face-chat-ui/)).
- The chat UI will handle all conversational support.
- **At the bottom of the chat UI, always display an option for the user to create a support case ("Create Case") and a note such as:**
  - _"Generated with AI. Consider checking for important information. Need help? Create Case"_ (just like Vercel).
- The support form is always available as an option, not only if the AI is unable to resolve the issue.

## Advanced Support Flow (Vercel-style, Static Site Adapted)
1. **User interacts with HuggingFace Chat UI at `/help`**.
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
   - (Notification/delivery logic will be handled in a later step.)
8. **After submission, the chat UI provides a feedback prompt about the AI support experience (e.g., satisfaction rating, comments).**

## What We Have (src/components)
- **Button** (`button.tsx`): For actions like sending messages or submitting forms.
- **Input/TextInput** (`input.tsx`): For user input fields.
- **Dropdown** (`dropdown.tsx`): For product/account selection if needed.
- **Dialog/Modal**: Available via Headless UI, used in several components.
- **Layout Components**: For page structure (CenteredPageLayout, SidebarLayout, etc.).

## What We Need to Build/Integrate
- **Integrate HuggingFace Chat UI** at `/help`.
- **Configure backend endpoints** to connect HuggingFace Chat UI to your Cloudflare Worker for RAG/search and completions.
- **SupportForm**: Multi-step, conditional form for case creation (fields as above), pre-filled from chat context if possible.
- **Next.js API endpoint** (`/api/help-form`) to receive POST requests from the form, with input validation.
- **Feedback prompt** in the chat UI after case submission.

## Cloudflare Chat UI Integration
- Cloudflare provides the backend (AI/RAG, vector search, etc.) but does NOT provide a frontend chat UI.
- HuggingFace Chat UI will be used as the frontend, configured to call your Worker endpoints for answers.

## Summary Table
| Component           | Exists? | File/Notes                |
|---------------------|---------|---------------------------|
| Button              | Yes     | button.tsx                |
| Input/TextInput     | Yes     | input.tsx                 |
| Dropdown            | Yes     | dropdown.tsx              |
| HuggingFace Chat UI | No      | To integrate at /help     |
| SupportForm         | No      | To build/integrate        |
| API endpoint        | No      | To build: /api/help-form|
| Feedback prompt     | No      | To build/integrate        |

## Next Steps
- Deploy and configure HuggingFace Chat UI at `/help`, pointing it to your Cloudflare Worker backend for AI-powered support.
- Use existing Button, Input, and Dropdown components for any custom form or UI needs.
- Build the `/api/help-form` endpoint to receive POST requests from the support form, with input validation.
- Add a feedback prompt to the chat UI after case submission.
- (Handle notification/delivery logic in a later step.)
