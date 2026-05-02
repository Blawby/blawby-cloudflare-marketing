# AI Agent Instructions

---

title: "Descriptive Title"
desc: "Meta description for SEO"
---

Blawby's primary audience is lawyers and legal staff who are not technical. Write like Stripe docs — clear, confident, assumes the reader is smart but not a developer. If you're explaining a feature, explain WHY it matters to a law firm first, then HOW to use it. Never lead with technical details.

## What Blawby is

A legal payment and practice management platform. IOLTA-compliant payments, client intake automation, invoicing, and AI chat. Lawyers use it to get paid faster and spend less time on admin.

## Tone

Clear, respectful, direct. Never condescending. Lawyers are intelligent professionals — treat them as such. Avoid legal jargon and tech jargon equally.

---

## 🎯 Personas

### 👩‍⚖️ 1. Ambitious Solo/Small Firm Attorneys

Bogged down by operations, open to tech but needs it simple.
**Message:** Smarter tools let you do more of what you're great at.

### 🧑‍💼 2. Tech-Outdated Veterans

Decades of skill, legacy processes.
**Message:** Your tools should catch up to your expertise.

### 🧑‍🎓 3. Early-Career Firm Builders

Juggling everything alone.
**Message:** Build the business, don't just run it.

### 👩‍💻 4. Automation Seekers

Tech-savvy, looking for AI advantages.
**Message:** Transform your practice with high-leverage automation.

### 👩‍💼 5. Paralegals & Office Managers

The ones keeping the firm running.
**Message:** You deserve tools that make your job easier.

---

## 🏷️ Content Buckets

### Legal Tech for Professionals

Normalize modern tools as necessary infrastructure.

- _Ideas:_ Tech that pays for itself; Software is about what you stop doing.

### Delegation & Staff Empowerment

Process-driven solutions to build trust and share workload.

- _Ideas:_ Improving handoffs; Setting ownership without micromanaging.

### AI Chat & Intake Automation

Transforming client acquisition.

- _Ideas:_ 24/7 communication without burnout; Pre-qualifying leads with AI.

### Product Education

Problem-led feature highlights.

- _Ideas:_ Collecting payments without asking twice; Turning intake into an "easy yes".

### Practice Management & Billing

Optimizing workflows from time-tracking to getting paid.

- _Ideas:_ Automating the invoice lifecycle; Stop chasing clients for payments.

---

## 🔗 Internal Linking & CTAs

### Linking Rules

- Use absolute internal paths (e.g., `/blog/how-to-delegate`)
- Link only to deeply relevant content
- Use descriptive anchor text
- Include at least two internal links in each post

### CTA Guidelines

Every article must end with a CTA that feels like a natural resolution.

- **Blog Posts:** Soft pitch tied to the pain discussed.
  - _Example:_ "Let Blawby handle payments—so you can focus on building your practice. [Register for Blawby](https://ai.blawby.com/register)"
- **Guides/Lessons:** Clear next steps.
  - _Example:_ "Next step: [Send your first invoice](/features/send-invoice)"

---

## 🧱 Technical & MDX Rules

### Content Management

- Drop an MDX file in `src/data/solutions/{category}/` or `src/data/lessons/`
- No manual registration needed
- Required frontmatter: see `src/data/_template.mdx`
- Valid categories: `guides`, `payments`, `ai-intake`, `compliance`, `ai-chat`, `business-strategy`

### Frontmatter Schema

```yaml
---
title: "Descriptive Title"
metaTitle: "SEO Optimized Title | Blawby"
desc: "Meta description for SEO"
author: "Paul Chris Luke"
category: "compliance" # Must match folder name
contentType: "article" # article | lesson
order: 10 # Controls sidebar sorting (lower = higher)
createdAt: "MM/DD/YYYY"
updatedAt: "MM/DD/YYYY"
tags:
  - payments
  - iolta
keywords:
  - law firm payment processing
faq:
  - question: "Question?"
    answer: "Answer."
noindex: false
---
```

### Image Requirements

- Use Next.js `<Image>` component
- Always include width and height
- Example: `![Alt text|1000x500](/path/to/image.png)`

### Accuracy

- Never invent pricing, feature capabilities, or compliance claims
- If unsure whether a feature exists, describe the problem it solves without claiming Blawby does it
- IOLTA compliance claims must be accurate — this is a legal requirement, not marketing copy

### 🚫 Do Not

- Add entries to `articles.ts` or `lessons.ts` manually
- Mention or compare us to competitors like LawPay or Clio
- Use custom React components in MDX (including CTA, Callout, FAQ) unless explicitly allowed

## Lighthouse CI

Lighthouse runs against Cloudflare Pages preview URLs which automatically inject `x-robots-tag: noindex`. The `is-crawlable` audit is disabled in `.lighthouserc.json` for this reason — it would always fail on preview deploys. Production deployments at blawby.com are indexable and not affected by this.
