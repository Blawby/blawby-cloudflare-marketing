// ---------------------------------------------------------------------------
// HTML escaping utility
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
/**
 * Blawby Search & Support Worker
 *
 * Modernized April 2026:
 * - AI Search (formerly AutoRAG) replaces the old manual embedding pipeline
 *   for /query and /chat endpoints
 * - @cf/meta/llama-3.3-70b-instruct-fp8-fast replaces Llama 2
 * - Messages API format for LLM calls (better instruction following)
 * - LLM-based intent classification replaces brittle regex patterns
 * - Origin-scoped CORS on mutation endpoints
 * - Cleaner route table with typed handlers
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AiBinding = {
  run(
    model: string,
    inputs: {
      messages?: AiMessage[];
      text?: string;
      max_tokens?: number;
      temperature?: number;
    },
  ): Promise<unknown>;
  autorag(name: string): {
    search(input: {
      query: string;
      rewrite_query?: boolean;
      max_num_results?: number;
      ranking_options?: { score_threshold?: number };
      reranking?: { enabled?: boolean; model?: string };
    }): Promise<unknown>;
  };
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  first<T = unknown>(): Promise<T | null>;
};

type D1DatabaseBinding = {
  prepare(query: string): D1PreparedStatement;
};

export interface Env {
  AI: AiBinding;
  SUPPORT_DB: D1DatabaseBinding;
  RESEND_API_KEY: string;
  /** Name of your AI Search instance, set in wrangler.toml as a var */
  AI_SEARCH_NAME: string;
  /** Support email address for help form submissions */
  SUPPORT_EMAIL: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = ["https://blawby.com", "https://www.blawby.com"];

const GENERATION_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT = `You are a helpful, friendly support assistant for Blawby — a legal practice management platform.

Rules you must follow:
- Answer naturally and conversationally, as a human support agent would.
- Use Markdown for formatting (bold, lists, links). Never use raw HTML.
- Only use facts from the provided context. Do not rely on prior knowledge.
- Do not mention "context", "documentation", "according to", or any AI processing terms.
- Always use blawby.com (not chat.blawby.com) for any URLs.
- Be precise about pricing and discounts — only state what is explicitly in the context.
- If the context includes a relevant URL, include at least one link in your answer.
- If you cannot answer from the context, say so naturally and offer to open a support case.
- Do not generate code or technical advice unless it is explicitly in the context.`;

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

function getCorsHeaders(request: Request, mutation = false): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  // For read-only search endpoints, allow any origin.
  // For mutation endpoints, restrict to known origins.
  const allowedOrigin =
    !mutation || ALLOWED_ORIGINS.includes(origin) ? origin || "*" : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(
  data: unknown,
  status = 200,
  headers: HeadersInit = {},
): Response {
  return Response.json(data, { status, headers });
}

function corsJson(
  data: unknown,
  request: Request,
  status = 200,
  mutation = false,
): Response {
  return json(data, status, getCorsHeaders(request, mutation));
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

async function parseBody<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : e}`);
  }
}

function requireFields(
  body: Record<string, unknown>,
  fields: string[],
): string | null {
  for (const f of fields) {
    if (!body[f]) return f;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Intent classification (LLM-based, replaces regex)
// ---------------------------------------------------------------------------

type Intent = "nonprofit" | "pricing" | "support" | "abusive" | "general";

const INTENT_SYSTEM = `Classify the following support query into exactly one of these categories:
nonprofit, pricing, support, abusive, general

Respond with only the category name — no punctuation, no explanation.`;

async function classifyIntent(query: string, env: Env): Promise<Intent> {
  try {
    const result = (await env.AI.run(GENERATION_MODEL, {
      messages: [
        { role: "system", content: INTENT_SYSTEM },
        { role: "user", content: query },
      ],
      max_tokens: 10,
      temperature: 0,
    })) as { response?: string };

    const label = result.response?.trim().toLowerCase() ?? "general";
    const valid: Intent[] = [
      "nonprofit",
      "pricing",
      "support",
      "abusive",
      "general",
    ];
    return valid.includes(label as Intent) ? (label as Intent) : "general";
  } catch {
    return "general";
  }
}

// ---------------------------------------------------------------------------
// Intent response builders
// ---------------------------------------------------------------------------

function buildIntentResponse(
  intent: Intent,
  matches: AiSearchResult[],
): string | null {
  switch (intent) {
    case "nonprofit":
      return (
        `Blawby offers qualified nonprofits **50% off on user fees**. ` +
        `You can apply by submitting a form at [blawby.com/nonprofit-commitment](https://blawby.com/nonprofit-commitment).`
      );

    case "pricing": {
      const contextText = matches
        .flatMap((m) => m.content.map((c) => c.text))
        .join("\n");
      return buildPricingResponse(contextText);
    }

    case "support":
      return (
        `If you need help, click the **Create Support Case** button below and our team will get back to you as soon as possible.\n\n` +
        `For real-time help, you can also [join our Discord](https://discord.com/invite/rPmzknKv).`
      );

    case "abusive":
      return `I'm here to help — let's keep things respectful. How can I assist you today?`;

    default:
      return null;
  }
}

function buildPricingResponse(contextText: string): string {
  const lines: string[] = [];

  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [
      /\$([0-9]+(?:\.[0-9]{2})?)\s*\/\s*month\s*\/\s*user|\$([0-9]+(?:\.[0-9]{2})?)\s*per\s*month\s*per\s*user/i,
      (m) => `- **Monthly user license:** $${m[1] ?? m[2]} per user per month`,
    ],
    [
      /([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*(?:card|transaction)/i,
      (m) => `- **Card payments:** ${m[1]}% + ${m[2]} per transaction`,
    ],
    [
      /([0-9]+(?:\.[0-9]+)?)%.*ACH.*\(\$([0-9]+)\s*cap\)/i,
      (m) => `- **ACH/bank payments:** ${m[1]}% (max $${m[2]})`,
    ],
    [
      /([0-9]+(?:\.[0-9]+)?)%\s*(?:additional\s*)?platform fee/i,
      (m) => `- **Platform fee:** ${m[1]}% (billed monthly)`,
    ],
    [
      /([0-9]+(?:\.[0-9]+)?)%\s*per\s*paid\s*invoice/i,
      (m) => `- **Invoice fee:** ${m[1]}% per paid invoice`,
    ],
    [
      /\$([0-9]+)\s*(?:fee\s*for\s*disputed\s*payments|.*chargeback)/i,
      (m) => `- **Chargeback fee:** $${m[1]} per chargeback`,
    ],
  ];

  for (const [regex, formatter] of patterns) {
    const match = contextText.match(regex);
    if (match) lines.push(formatter(match));
  }

  if (/no setup fees?/i.test(contextText)) lines.push("- No setup fees");
  if (/no hidden fees?/i.test(contextText)) lines.push("- No hidden fees");

  const body =
    lines.length > 0
      ? lines.join("\n")
      : "_Some fees could not be found in the current context._";

  return (
    `**Blawby Pricing Overview**\n\n${body}\n\n` +
    `For full details and the latest updates, [see our pricing page](https://blawby.com/pricing).`
  );
}

// ---------------------------------------------------------------------------
// AI Search result type (simplified)
// ---------------------------------------------------------------------------

interface AiSearchContent {
  id: string;
  type: string;
  text: string;
}

interface AiSearchResult {
  file_id: string;
  filename: string;
  score: number;
  attributes?: Record<string, unknown>;
  content: AiSearchContent[];
}

interface AiSearchResponse {
  search_query?: string;
  response?: string;
  data: AiSearchResult[];
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function filenameToTitle(filename: string): string {
  return (
    stripExtension(filename)
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? filename
  );
}

function filenameToUrl(filename: string, attributes?: Record<string, any>): string {
  // Prefer indexed canonical href/url metadata if available
  if (attributes?.href && typeof attributes.href === "string") return attributes.href.startsWith("/") ? attributes.href : `/${attributes.href}`;
  if (attributes?.url && typeof attributes.url === "string") return attributes.url.startsWith("/") ? attributes.url : `/${attributes.url}`;

  let key = stripExtension(filename).replace(/\\/g, "/").replace(/^\/+/, "");

  // Remove src/data/ prefix if present
  if (key.startsWith("src/data/")) {
    key = key.replace(/^src\/data\//, "");
  }

  // Preserve category segments from metadata/fallback path, only remove bucket prefixes if constructing manually
  // But wait, the instruction said "remove the hard-coded removal of category folders"
  // So we just return the key.
  return `/${key}`;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTitleMatchBoost(
  query: string,
  match: { title: string; url: string },
) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(match.title);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const titleTerms = normalizedTitle.split(/\s+/).filter(Boolean);

  if (!normalizedQuery || titleTerms.length === 0) return 0;
  if (normalizedTitle === normalizedQuery) return 3;
  if (normalizedTitle.includes(normalizedQuery)) return 2;

  const hasTitleTermMatch = queryTerms.some((queryTerm) =>
    titleTerms.some(
      (titleTerm) =>
        titleTerm === queryTerm ||
        titleTerm.startsWith(queryTerm) ||
        queryTerm.startsWith(titleTerm),
    ),
  );

  if (hasTitleTermMatch) return 1;

  return 0;
}

function rerankSearchMatches<
  T extends { title: string; url: string; score: number },
>(query: string, matches: T[]): T[] {
  return [...matches].sort((a, b) => {
    const boostDifference =
      getTitleMatchBoost(query, b) - getTitleMatchBoost(query, a);

    if (boostDifference !== 0) return boostDifference;

    return b.score - a.score;
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * /query — returns raw AI Search results (used by command palette)
 * Replaces: manual embedding and hand-managed retrieval
 */
async function handleQuery(request: Request, env: Env): Promise<Response> {
  const body = await parseBody<{ query?: string }>(request);
  const query = body.query?.trim();

  if (!query) {
    return corsJson({ error: "Missing or empty query" }, request, 400);
  }

  const result = (await env.AI.autorag(env.AI_SEARCH_NAME).search({
    query,
    rewrite_query: true,
    max_num_results: 10,
    ranking_options: { score_threshold: 0.3 },
    reranking: { enabled: true, model: "@cf/baai/bge-reranker-base" },
  })) as AiSearchResponse;

  // Shape the response to match what the command palette expects
  const matches = (result.data ?? []).map((item) => ({
    id: item.file_id,
    title: filenameToTitle(item.filename),
    description: item.content[0]?.text ?? "",
    type: "lesson" as const,
    url: filenameToUrl(item.filename, item.attributes),
    score: item.score,
    section: item.attributes?.folder as string | undefined,
  }));

  return corsJson({ matches: rerankSearchMatches(query, matches) }, request);
}

/**
 * /chat — AI-powered support chat with intent classification
 * Replaces: regex intent + Llama 2 single-prompt approach
 */
async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await parseBody<{ query?: string }>(request);
  const query = body.query?.trim();

  if (!query) {
    return corsJson({ error: "Missing or empty query" }, request, 400);
  }

  // Run intent classification and search in parallel
  const [intent, searchResult] = await Promise.all([
    classifyIntent(query, env),
    env.AI.autorag(env.AI_SEARCH_NAME).search({
      query,
      rewrite_query: true,
      max_num_results: 10,
      ranking_options: { score_threshold: 0.3 },
      reranking: { enabled: true, model: "@cf/baai/bge-reranker-base" },
    }) as Promise<AiSearchResponse>,
  ]);

  const matches = searchResult.data ?? [];

  // For known intents, return a hand-crafted response
  const intentMessage = buildIntentResponse(intent, matches);
  if (intentMessage) {
    return corsJson(
      { message: intentMessage, messageFormat: "markdown", matches },
      request,
    );
  }

  // General: build context and let the LLM answer
  const context = matches
    .map((item, i) => {
      const url = filenameToUrl(item.filename, item.attributes);
      const text = item.content.map((c) => c.text).join(" ");
      return `${i + 1}. **${item.filename}**\n${text}\n\nDocumentation: https://blawby.com${url}`;
    })
    .join("\n\n");

  const llmResult = (await env.AI.run(GENERATION_MODEL, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Question: ${query}\n\nContext:\n${context}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.3,
  })) as { response?: string };

  const message =
    llmResult.response?.trim() ||
    "I couldn't find a specific answer. Would you like to open a support case?";

  return corsJson({ message, messageFormat: "markdown", matches }, request);
}

/**
 * /api/help-form — contact form submission
 */
async function handleHelpForm(request: Request, env: Env): Promise<Response> {
  const body = await parseBody<{
    name?: string;
    email?: string;
    message?: string;
  }>(request);
  const missing = requireFields(body as Record<string, unknown>, [
    "name",
    "email",
    "message",
  ]);
  if (missing) {
    return corsJson({ error: `Missing ${missing}` }, request, 400, true);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email!)) {
    return corsJson({ error: "Invalid email format" }, request, 400, true);
  }

  if (!env.SUPPORT_EMAIL) {
    return corsJson(
      {
        error:
          "Support email is not configured. Please set SUPPORT_EMAIL in your environment.",
      },
      request,
      500,
      true,
    );
  }

  const emailSvc = new EmailService(env.RESEND_API_KEY);

  await emailSvc.send({
    from: "noreply@blawby.com",
    to: env.SUPPORT_EMAIL,
    subject: "New Help Form Submission",
    text: `Name: ${body.name}\nEmail: ${body.email}\nMessage:\n${body.message}`,
  });

  try {
    await emailSvc.send({
      from: "noreply@blawby.com",
      to: body.email!,
      subject: "We received your message",
      text: `Thank you for contacting us. We'll get back to you soon.\n\nYour message:\n${body.message}`,
    });
  } catch (err) {
    console.error("Failed to send user confirmation email", err);
  }

  return corsJson({ success: true }, request, 200, true);
}

/**
 * /support-case/create
 */
async function handleSupportCaseCreate(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await parseBody<{
    userId?: string;
    chatHistory?: unknown[];
    otherContext?: unknown;
  }>(request);

  if (!body.userId || !Array.isArray(body.chatHistory)) {
    return corsJson(
      { error: "Missing userId or chatHistory" },
      request,
      400,
      true,
    );
  }

  const caseId = crypto.randomUUID();
  await env.SUPPORT_DB.prepare(
    `INSERT INTO support_cases (id, user_id, chat_history, other_context, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      caseId,
      body.userId,
      JSON.stringify(body.chatHistory),
      body.otherContext ? JSON.stringify(body.otherContext) : null,
    )
    .run();

  return corsJson(
    {
      caseId,
      caseUrl: `/support/case/${caseId}`,
      prefilledFields: {
        userId: body.userId,
        chatHistory: body.chatHistory,
        otherContext: body.otherContext,
      },
    },
    request,
    200,
    true,
  );
}

/**
 * /support-case/feedback
 */
async function handleSupportCaseFeedback(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await parseBody<{
    caseId?: string;
    rating?: number;
    comments?: string;
  }>(request);

  if (
    !body.caseId ||
    typeof body.rating !== "number" ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return corsJson(
      { error: "Missing or invalid caseId or rating (1–5)" },
      request,
      400,
      true,
    );
  }

  await env.SUPPORT_DB.prepare(
    `INSERT INTO support_feedback (case_id, rating, comments, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(body.caseId, body.rating, body.comments ?? null)
    .run();

  return corsJson({ ok: true }, request, 200, true);
}

/**
 * /support-case/:id — GET
 */
async function handleSupportCaseGet(
  request: Request,
  env: Env,
  caseId: string,
): Promise<Response> {
  const result = await env.SUPPORT_DB.prepare(
    `SELECT id, user_id, chat_history, other_context, created_at
     FROM support_cases WHERE id = ?`,
  )
    .bind(caseId)
    .first<{
      id: string;
      user_id: string;
      chat_history: string;
      other_context: string | null;
      created_at: string;
    }>();

  if (!result) {
    return corsJson({ error: "Case not found" }, request, 404, true);
  }

  const safeJson = (s: string | null) => {
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  return corsJson(
    {
      caseId: result.id,
      userId: result.user_id,
      chatHistory: safeJson(result.chat_history) ?? [],
      otherContext: safeJson(result.other_context),
      createdAt: result.created_at,
    },
    request,
    200,
    true,
  );
}

// ---------------------------------------------------------------------------
// EmailService
// ---------------------------------------------------------------------------

class EmailService {
  constructor(private readonly apiKey: string) {}

  async send({
    from,
    to,
    subject,
    text,
  }: {
    from: string;
    to: string | string[];
    subject: string;
    text: string;
  }): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: this.buildHtml(subject, text),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Resend error: ${err}`);
    }
  }

  private buildHtml(subject: string, text: string): string {
    const year = new Date().getFullYear();
    const safeSubject = escapeHtml(subject);
    const safeText = escapeHtml(text);
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#18181b">${safeSubject}</h2>
      <div style="white-space:pre-line">${safeText}</div>
      <hr style="margin:20px 0;border:none;border-top:1px solid #eee">
      <p style="color:#888;font-size:12px">© ${year} Blawby. All rights reserved.</p>
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

type RouteHandler = (
  request: Request,
  env: Env,
  params?: Record<string, string>,
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  mutation?: boolean;
}

const ROUTES: Route[] = [
  {
    method: "POST",
    pattern: /^\/query$/,
    handler: handleQuery,
  },
  {
    method: "POST",
    pattern: /^\/chat$/,
    handler: handleChat,
  },
  {
    method: "POST",
    pattern: /^\/api\/help-form$/,
    handler: handleHelpForm,
    mutation: true,
  },
  {
    method: "POST",
    pattern: /^\/support-case\/create$/,
    handler: handleSupportCaseCreate,
    mutation: true,
  },
  {
    method: "POST",
    pattern: /^\/support-case\/feedback$/,
    handler: handleSupportCaseFeedback,
    mutation: true,
  },
  {
    method: "GET",
    pattern: /^\/support-case\/([^/]+)$/,
    handler: (req, env, params) =>
      handleSupportCaseGet(req, env, params?.caseId ?? ""),
    mutation: true,
  },
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      const isMutation = ROUTES.some((r) => r.mutation && r.pattern.test(path));
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, isMutation),
      });
    }

    // Ignore favicon
    if (path.startsWith("/favicon")) {
      return new Response(null, { status: 404 });
    }

    const route = ROUTES.find(
      (r) =>
        r.method === request.method &&
        path.match(r.pattern),
    );

    if (!route) {
      return new Response("Not Found", {
        status: 404,
        headers: getCorsHeaders(request),
      });
    }

    if (route.mutation) {
      const origin = request.headers.get("Origin");
      if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        return json(
          { error: "Forbidden" },
          403,
          getCorsHeaders(request, true),
        );
      }
    }

    const match = path.match(route.pattern);
    const params: Record<string, string> = {};
    if (match && route.pattern.toString().includes("(")) {
      // Very simple param extraction for /support-case/:id
      params.caseId = match[1];
    }

    try {
      return await route.handler(request, env, params);
    } catch (e) {
      console.error("Worker error:", e);
      return json(
        { error: "Internal Server Error" },
        500,
        getCorsHeaders(request, route.mutation),
      );
    }
  },
};
