# 🧠 LLM Blog Post Writing Ruleset

A structured guide for large language models to follow when generating blog posts within our editorial system. These rules define tone, structure, formatting, research expectations, SEO compliance, and more.

---

## 📌 Purpose

This blog is a content marketing arm of a product offering — a **payment solution for law firms and solo attorneys**.

- Blog posts are designed to build authority, educate legal professionals, answer search-driven questions, and **subtly guide readers toward adopting the product**.
- Content focuses **exclusively on law firm business management**, not legal theory or counsel.
- We serve attorneys and staff who are ready to scale and optimize — not by working more, but by using smarter tools.
- Every post must be **problem-solving in nature**: help the reader fix something, grow something, or streamline something.
- While doing so, **drip in product relevance**: the tool should feel like a natural part of the solution — not a plug.

---

## 🧠 Content Focus

Content must speak to one or more of these five legal personas:

### 👩‍⚖️ 1. Ambitious, Efficiency-Seeking Solo or Small Firm Attorneys
- Want to grow but are bogged down by operations  
- Open to tech, but not if it's bloated or complicated  
**Message:** "Don't let technology slow down your business. Use smarter tools to take care of less — and do more of what you're great at."

### 🧑‍💼 2. Highly Experienced but Tech-Outdated Attorneys
- Decades of skill, but still rely on manual tools or legacy processes  
**Message:** "You've mastered your craft — now let the tools around you catch up."

### 🧑‍🎓 3. New or Early-Career Attorneys Starting Their Firm
- Juggling every task themselves  
**Message:** "Don't let running the business get in the way of growing the business."

### 👩‍💻 4. Tech-Savvy Attorneys Seeking Automation
- Experienced with technology, wants to leverage AI and modern tools  
- Looking for competitive advantages through automation  
**Message:** "You understand technology can transform your practice—here's how to apply it where it matters most."

### 👩‍💼 5. Paralegals, Office Managers, Legal Assistants in Mid-to-Large Firms
- Often the first to advocate for process updates  
- Manage intake, communications, and administrative workflows  
**Message:** "If you're the one keeping everything running, you deserve tools that make your job easier."

---

## 🔁 Shared Product Relevance

All personas benefit from:
- Faster collections, fewer follow-ups  
- Streamlined payments and admin  
- Low-friction, professional operations  
- AI-powered client communication and intake automation
- Real-time messaging that improves client satisfaction
- Automated workflows that reduce administrative burden
- A system that works *for* them — not the other way around

---

## ✍️ Tone & Voice

- Tone must be: clear, confident, intelligent, respectful of time  
- Always focus on **solving problems, removing friction, or enabling growth**  
- No jargon unless defined  
- Use first or second person. Speak directly to the reader's actual experience.

### Sample tones by persona:
- **New lawyer:** "You're doing everything yourself. Let's fix the part that takes the longest."  
- **Legal assistant:** "If you're still chasing payments manually, this is going to change your life."  
- **Veteran attorney:** "You don't need to overhaul your system — just upgrade the part that's costing you hours."
- **Tech-savvy attorney:** "You know automation can transform your practice—here's how to apply AI chat where it matters most."

---

## 🚫 Competitor Mentions

When writing, do not explicitly mention or compare us to competitors like LawPay or Clio. The content should stand on its own authority and should not be reactionary or comparative.

---

## 🧱 Formatting & Components

### 1. Frontmatter Requirements

Every post MUST include a YAML frontmatter block. The filesystem is the source of truth; do not add entries to `articles.ts` or `lessons.ts` manually.

```yaml
---
title: "Descriptive Title"
metaTitle: "SEO Optimized Title | Blawby"
desc: "Meta description for SEO (replaces 'description' if present)"
author: "Team Blawby"
authorImage: ""
category: "compliance"     # Must match folder name in src/data/articles/
contentType: "article"    # article | guide | reference | lesson
order: 10                 # Controls sidebar sorting (lower = higher)
difficulty: "Beginner"    # For lessons: Beginner | Intermediate | Advanced
createdAt: "MM/DD/YYYY"    # Automatically normalized to ISO 8601
updatedAt: "MM/DD/YYYY"
tags:
  - invoicing
  - compliance
faq:
  - question: "Your Question?"
    answer: "Your Answer."
---
```

**Key Rules:**
- **Date Normalization**: Always use `MM/DD/YYYY` for human readability; the build system normalizes this to ISO.
- **Precedence**: `desc` in frontmatter wins over any other description field.
- **FAQ**: Use the `faq` array for structured data; it is more reliable than markdown-based parsing.
- **Templates**: Ignore files starting with an underscore (e.g., `_template.mdx`).

### 2. SEO Articles (Blog Content)
- Generate output using valid `.mdx` syntax, compatible with JSX-aware static site generators. 
- Content should be clean, readable, and copy-ready.
- **Do not use custom React components in MDX (including CTA, Callout, FAQ) unless explicitly allowed.**
- Respect component usage limits: max 1 Callout block unless otherwise allowed.
- Include SEO-optimized headings and structure.
- Use engaging, benefit-driven language.
- Target 800-1500 words for optimal SEO.

### User Journey Documentation
- Generate output using valid `.mdx` syntax, compatible with JSX-aware static site generators.
- Focus on clarity and step-by-step instructions.
- Use code blocks, numbered lists, and clear headings.
- Include practical examples and screenshots where helpful.
- Target 500-1000 words for implementation guides.
- Use direct, instructional language.

---

## 📣 Call to Action (CTA)


### SEO Articles (Blog Content)
Every blog must end with a CTA that feels like a **natural resolution** to the problem addressed.

- Soft pitch only — always tied to the pain discussed  
- Varies by persona (solo vs. admin vs. senior)

**Example:**

> ## Ready to Launch?
> Start your firm on the right foot. Let Blawby handle payments and compliance—so you can focus on building your practice. [Register for Blawby](https://ai.blawby.com/register)

### User Journey Documentation
Documentation should end with clear **next steps** rather than marketing CTAs.

- Direct users to the next logical step in their journey
- Include links to related documentation
- Provide practical follow-up actions

**Example:**

> ## Next Steps
> Your payment system is now configured and ready. Here's what to do next:
> 1. Send real invoices to clients
> 2. Monitor payment analytics in your dashboard
> 3. Set up automated client workflows
> 
> [Continue to Set Up Client Intake](/docs/core-features/set-up-client-intake)

---

## 🔍 SEO & Discoverability

### SEO Articles (Blog Content)
- Use **real long-tail search phrases** relevant to legal ops.
- Optimize for featured snippets (Zero-Click SEO) where applicable by using direct answers, bold definitions, or bulleted lists.
- Decode Complex Terms: If a keyword is unfamiliar or technical, define it early, briefly, then move on.
- Include internal linking to related articles and documentation.
- Use descriptive, benefit-focused titles and meta descriptions.

### User Journey Documentation
- Focus on clear, searchable titles that match user intent
- Use consistent terminology and naming conventions
- Include proper heading structure for easy navigation
- Optimize for on-page search and findability
- Link to related documentation and reference materials
