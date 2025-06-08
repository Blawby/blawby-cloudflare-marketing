import { marked } from "marked";

// Step duration annotation: `{duration=PT2M}` (ISO 8601)
// Example: 1. **Sign Up.** `{duration=PT2M}` Visit blawby.com and click Sign Up...

// Extracts duration from plain English in parentheses, e.g., (2 minutes), (1 min), at start or end of step
function parseDurationFromText(text: string): { text: string; duration?: string } {
  // Regex: match (2 minutes), (1 min), (5 Minutes), case-insensitive, at start or end
  const regex = /^\s*\((\d+)\s*(min|minute|minutes)\)\s*|\s*\((\d+)\s*(min|minute|minutes)\)\s*$/i;
  let match = text.match(regex);
  if (match) {
    const num = parseInt(match[1] || match[3], 10);
    const cleanText = text.replace(regex, '').trim();
    return { text: cleanText, duration: `PT${num}M` };
  }
  // Also check for duration at the end
  const endRegex = /^(.*?)(\s*\((\d+)\s*(min|minute|minutes)\)\s*)$/i;
  match = text.match(endRegex);
  if (match) {
    const num = parseInt(match[3], 10);
    const cleanText = match[1].trim();
    return { text: cleanText, duration: `PT${num}M` };
  }
  return { text, duration: undefined };
}

export function parseHowToStepsFromMarkdown(md: string): { name: string; text: string; duration?: string }[] {
  // Parse the markdown and extract ordered list steps robustly
  const tokens = marked.lexer(md);
  const steps: { name: string; text: string; duration?: string }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "list" && token.ordered) {
      for (const item of token.items) {
        // Extract duration annotation if present
        const { text: cleanText, duration } = parseDurationFromText(item.text);
        // Use the first sentence as the name, rest as text
        const [first, ...rest] = cleanText.split(/\.( |$)/);
        steps.push({
          name: first.trim() + '.',
          text: rest.join('. ').trim(),
          ...(duration ? { duration } : {}),
        });
      }
    }
  }
  return steps;
}

// Helper to sum ISO 8601 durations (PT2M, PT1H30M, etc.)
function sumDurations(durations: string[]): string | undefined {
  let totalMinutes = 0;
  for (const d of durations) {
    const match = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      totalMinutes += hours * 60 + minutes;
    }
  }
  if (totalMinutes > 0) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `PT${h > 0 ? h + 'H' : ''}${m > 0 ? m + 'M' : ''}`;
  }
  return undefined;
}

export function getHowToSchema({ name, description, steps }: { name: string; description: string; steps: { name: string; text: string; duration?: string }[] }) {
  // Calculate totalTime from step durations if present
  const durations = steps.map(s => s.duration).filter(Boolean) as string[];
  const totalTime = durations.length > 0 ? sumDurations(durations) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s) => ({
      "@type": "HowToStep",
      name: s.name,
      text: s.text,
      ...(s.duration ? { performTime: s.duration } : {}),
    })),
  };
}

// Usage: Add (2 minutes) or (1 min) to any step in your MDX ordered list to specify step time. If omitted, duration is not included in schema. totalTime is calculated as the sum of step durations if present. 