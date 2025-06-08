import { marked } from "marked";

// Parse FAQ from Markdown: only after '## Frequently asked Questions', treat ### as questions, until next ## or end
export function parseFAQFromMarkdown(md: string): { question: string; answer: string }[] {
  const tokens = marked.lexer(md);
  const faqs: { question: string; answer: string }[] = [];
  let inFAQ = false;
  let currentQ: string | null = null;
  let currentA: string[] = [];
  for (const token of tokens) {
    if (token.type === "heading" && token.depth === 2 && /Frequently asked Questions?/i.test(token.text)) {
      inFAQ = true;
      currentQ = null;
      currentA = [];
      continue;
    }
    if (inFAQ) {
      if (token.type === "heading" && token.depth === 2) {
        // End FAQ section at next ##
        if (currentQ && currentA.length) {
          faqs.push({ question: currentQ, answer: currentA.join(" ").trim() });
        }
        break;
      }
      if (token.type === "heading" && token.depth === 3) {
        if (currentQ && currentA.length) {
          faqs.push({ question: currentQ, answer: currentA.join(" ").trim() });
        }
        currentQ = token.text.trim();
        currentA = [];
      } else if (currentQ && (token.type === "paragraph" || token.type === "text")) {
        currentA.push(token.text.trim());
      } else if (currentQ && token.type === "list") {
        currentA.push(token.items.map(i => i.text.trim()).join(" "));
      }
    }
  }
  if (inFAQ && currentQ && currentA.length) {
    faqs.push({ question: currentQ, answer: currentA.join(" ").trim() });
  }
  return faqs;
}

// Generate FAQPage schema.org JSON-LD
export function getFAQSchema({ faqs, name, description }: { faqs: { question: string; answer: string }[]; name?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
} 