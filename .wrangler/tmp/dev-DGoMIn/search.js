var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-36fVLu/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/workers/search.ts
var INTENT_PATTERNS = [
  { name: "pricing", pattern: /\b(price|pricing|cost|fee|fees|charge|charges|how much|rate|rates|platform fee|transaction fee|monthly fee|card fee|bank fee|ach fee|chargeback)\b/, exclude: /integrate|setup|configure/ },
  { name: "support", pattern: /\b(speak to human|talk to human|human support|real person|speak to someone|talk to someone|human agent|live agent|customer service|support team|not working|broken|issue|problem|error|frustrated|angry|upset|help me|stuck|can't|won't|doesn't work|need help|need support|i need help|get help)\b|\bspeak\b.*\bhuman\b|\btalk\b.*\bhuman\b/, exclude: /does.*support|what.*support|feature.*support|recurring.*support|blawby.*support/ },
  { name: "abusive", pattern: /\b(fuck|shit|bitch|asshole|cunt|bastard|dick|suck|faggot|retard|idiot|moron|stupid)\b/ }
];
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON");
  }
}
__name(parseJsonBody, "parseJsonBody");
var AIService = class {
  constructor(ai, env) {
    this.ai = ai;
    this.env = env;
  }
  static {
    __name(this, "AIService");
  }
  async getEmbedding(text) {
    const embedding = await this.ai.run("@cf/baai/bge-small-en-v1.5", { text });
    return embedding.data[0];
  }
  async queryVectorDB(queryVector, topK = 10) {
    const vectorizeResult = await this.env.VECTORIZE.query(queryVector, {
      topK,
      returnValues: true,
      returnMetadata: "all"
    });
    return vectorizeResult.matches || vectorizeResult;
  }
  enhanceMatches(matches, query) {
    const docTypeBoost = { lesson: 2, article: 1.5, page: 1.2 };
    return matches.map((m) => ({ ...m, score: (m.score || 1) * (docTypeBoost[m.metadata?.docType] || 1) })).sort((a, b) => b.score - a.score);
  }
  async getEnhancedMatches(query, topK = 10) {
    const queryVector = await this.getEmbedding(query);
    const matches = await this.queryVectorDB(queryVector, topK);
    return this.enhanceMatches(matches, query);
  }
  async runLLM(prompt) {
    return this.ai.run("@cf/meta/llama-2-7b-chat-int8", {
      prompt,
      max_tokens: 200,
      temperature: 0.3
    });
  }
};
var EmailService = class {
  constructor(resendApiKey) {
    this.resendApiKey = resendApiKey;
  }
  static {
    __name(this, "EmailService");
  }
  async send({ from, to, subject, text }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: this.buildHtml(subject, text)
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }
    return response;
  }
  buildHtml(subject, text) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #18181b;">${subject}</h2>
      <div style="white-space: pre-line;">${text}</div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Blawby. All rights reserved.</p>
    </div>`;
  }
};
var IntentHandler = class {
  static {
    __name(this, "IntentHandler");
  }
  static detect(query) {
    const q = query.toLowerCase();
    for (const intent of INTENT_PATTERNS) {
      if (intent.pattern.test(q) && (!intent.exclude || !intent.exclude.test(q))) {
        return intent.name;
      }
    }
    return "general";
  }
  static buildResponse(intent, data) {
    switch (intent) {
      case "pricing": {
        const { matches } = data;
        const contextText = matches.map((m) => m.metadata?.description || m.metadata?.text || m.text || "").join("\n");
        const pricing = extractPricingInfo(contextText);
        let pricingLines = [];
        if (pricing.monthlyFee) pricingLines.push(`- **Monthly user license:** ${pricing.monthlyFee}`);
        if (pricing.cardFee) pricingLines.push(`- **Card payments:** ${pricing.cardFee}`);
        if (pricing.achFee) pricingLines.push(`- **ACH/bank payments:** ${pricing.achFee}`);
        if (pricing.platformFee) pricingLines.push(`- **Platform fee:** ${pricing.platformFee}`);
        if (pricing.chargebackFee) pricingLines.push(`- **Chargeback fee:** ${pricing.chargebackFee}`);
        if (pricing.setupFee) pricingLines.push(`- ${pricing.setupFee}`);
        if (pricing.hiddenFee) pricingLines.push(`- ${pricing.hiddenFee}`);
        let answer = `**Blawby Pricing Overview**

` + (pricingLines.length ? pricingLines.join("\n") : "(Some fees could not be found in the current context.)");
        answer += `

For full details and the latest updates, [see our pricing page](/pricing).`;
        return Response.json({ message: answer, messageFormat: "markdown", matches }, { headers: corsHeaders });
      }
      case "support": {
        let answer = `If you need help, you can get support right now by clicking the **Create Support Case** button below.
Our team will get back to you as soon as possible.

For real-time help, you can also [join our Discord](https://discord.com/invite/rPmzknKv).`;
        return Response.json({ message: answer, messageFormat: "markdown", matches: [] }, { headers: corsHeaders });
      }
      case "abusive": {
        const answer = `I'm here to help. Let's keep things respectful\u2014how can I assist you today?`;
        return Response.json({ message: answer, messageFormat: "markdown", matches: [] }, { headers: corsHeaders });
      }
      default:
        return null;
    }
  }
};
function extractPricingInfo(contextText) {
  let monthlyFee, cardFee, achFee, platformFee, chargebackFee, setupFee, hiddenFee;
  const monthlyMatch = contextText.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*\/\s*month\s*\/\s*user/i);
  if (monthlyMatch) monthlyFee = `$${monthlyMatch[1]} per user per month`;
  const cardMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*card/i);
  if (cardMatch) cardFee = `${cardMatch[1]}% + ${cardMatch[2]} per card transaction`;
  const achMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*ACH.*\(\$([0-9]+) cap\)/i);
  if (achMatch) achFee = `${achMatch[1]}% per ACH (max $${achMatch[2]})`;
  const platformMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*platform fee/i) || contextText.match(/additional\s*([0-9]+(?:\.[0-9]+)?)%\s*fee/i);
  if (platformMatch) platformFee = `${platformMatch[1]}% platform fee (billed monthly)`;
  const chargebackMatch = contextText.match(/\$([0-9]+) fee for disputed payments.*chargebacks?/i);
  if (chargebackMatch) chargebackFee = `$${chargebackMatch[1]} per chargeback`;
  if (/no setup fees?/i.test(contextText)) setupFee = "No setup fees";
  if (/no hidden fees?/i.test(contextText)) hiddenFee = "No hidden fees";
  return { monthlyFee, cardFee, achFee, platformFee, chargebackFee, setupFee, hiddenFee };
}
__name(extractPricingInfo, "extractPricingInfo");
async function handleQuery(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { query } = reqBody;
  if (!query || typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "Missing or empty query parameter" }, { status: 400, headers: corsHeaders });
  }
  const ai = new AIService(env.AI, env);
  const matches = await ai.getEnhancedMatches(query.trim(), 10);
  return Response.json({ matches }, { headers: corsHeaders });
}
__name(handleQuery, "handleQuery");
async function handleChat(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { query } = reqBody;
  if (!query || typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "Missing or empty query parameter" }, { status: 400, headers: corsHeaders });
  }
  const ai = new AIService(env.AI, env);
  const matches = await ai.getEnhancedMatches(query.trim(), 10);
  const intent = IntentHandler.detect(query.trim());
  const intentResponse = IntentHandler.buildResponse(intent, { matches });
  if (intentResponse) return intentResponse;
  const context = matches.map((m, i) => {
    const title = m.metadata?.title || "";
    const url = m.metadata?.url || m.metadata?.slug || "";
    const description = m.metadata?.description || m.metadata?.text || m.text || "";
    let link = "";
    if (url) {
      link = url.startsWith("http") ? url : url.startsWith("/") ? url : `/${url}`;
    }
    return `${i + 1}. ${title ? `**${title}**
` : ""}${description}${link ? `

Documentation: ${link}` : ""}`;
  }).join("\n\n");
  const prompt = `
You are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).
IMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data.

*Only provide code examples, implementation advice, or technical explanations if they are directly supported by the context below.  
Do **not** generate code or technical advice based on prior knowledge or assumptions.  
If the context does not contain relevant code or instructions, respond by saying you don't know and offer to create a support case.*

**CRITICAL**: If the context includes documentation links (marked as Documentation: url), you MUST include at least one relevant link in your response when answering questions about features, products, or how-to topics.

User's question: ${query.trim()}

Context:
${context}

Respond in Markdown only. Do not use HTML tags.`;
  const llmResponse = await ai.runLLM(prompt);
  let message = llmResponse && typeof llmResponse === "object" && "response" in llmResponse && typeof llmResponse.response === "string" ? llmResponse.response : "Sorry, I couldn't find an answer.";
  if (intent === "general") {
    let paymentsMatch = matches.find((m) => m.metadata?.url === "/lessons/payments");
    let top = paymentsMatch || matches.find((m) => m.metadata?.url || m.metadata?.slug);
    const topUrl = top ? top.metadata?.url || top.metadata?.slug : null;
    if (topUrl) {
      const topLink = topUrl.startsWith("http") ? topUrl : topUrl.startsWith("/") ? topUrl : `/${topUrl}`;
      message = message.replace(/\[Read more\]\(\/[^)]+\)/g, `[Read more](${topLink})`);
      if (!/\[Read more\]\(/.test(message)) {
        message += `

[Read more](${topLink})`;
      }
      if (!message.includes(topLink)) {
        message += `

Documentation: ${topLink}`;
      }
    }
  }
  return Response.json({ message, messageFormat: "markdown", matches }, { headers: corsHeaders });
}
__name(handleChat, "handleChat");
async function handleUpsertMDX(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { content, metadata } = reqBody;
  if (!content || !metadata) {
    return Response.json({ error: "Missing content or metadata" }, { status: 400, headers: corsHeaders });
  }
  const ai = new AIService(env.AI, env);
  const embedding = await ai.getEmbedding(content);
  await env.VECTORIZE.insert([
    { id: metadata.id, values: embedding, metadata: { text: content, ...metadata } }
  ]);
  return Response.json({ success: true, id: metadata.id }, { headers: corsHeaders });
}
__name(handleUpsertMDX, "handleUpsertMDX");
async function handleHelpForm(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { name, email, message } = reqBody;
  if (!name || !email || !message) {
    return Response.json({ error: `Missing ${!name ? "name" : !email ? "email" : "message"}` }, { status: 400, headers: corsHeaders });
  }
  const emailSvc = new EmailService(env.RESEND_API_KEY);
  const emailBody = `New help form submission:

Name: ${name}
Email: ${email}
Message:
${message}`;
  await emailSvc.send({ from: "noreply@blawby.com", to: "support@blawby.com", subject: "New Help Form Submission", text: emailBody });
  await emailSvc.send({ from: "noreply@blawby.com", to: email, subject: "We received your message", text: `Thank you for contacting us. We'll get back to you soon.

Your message:
${message}` });
  return Response.json({ success: true }, { headers: corsHeaders });
}
__name(handleHelpForm, "handleHelpForm");
async function handleSupportCaseCreate(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { userId, chatHistory, otherContext } = reqBody;
  if (!userId || !Array.isArray(chatHistory)) {
    return Response.json({ error: "Missing userId or chatHistory" }, { status: 400, headers: corsHeaders });
  }
  const db = env.SUPPORT_DB;
  const caseId = crypto.randomUUID();
  const chatHistoryStr = JSON.stringify(chatHistory);
  const otherContextStr = otherContext ? JSON.stringify(otherContext) : null;
  await db.prepare(
    `INSERT INTO support_cases (id, user_id, chat_history, other_context, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(caseId, userId, chatHistoryStr, otherContextStr).run();
  const caseUrl = `/support/case/${caseId}`;
  return Response.json({ caseId, caseUrl, prefilledFields: { userId, chatHistory, otherContext } }, { headers: corsHeaders });
}
__name(handleSupportCaseCreate, "handleSupportCaseCreate");
async function handleSupportCaseFeedback(request, env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  const { caseId, rating, comments } = reqBody;
  if (!caseId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return Response.json({ error: "Missing or invalid caseId or rating" }, { status: 400, headers: corsHeaders });
  }
  const db = env.SUPPORT_DB;
  await db.prepare(
    `INSERT INTO support_feedback (case_id, rating, comments, created_at) VALUES (?, ?, ?, datetime('now'))`
  ).bind(caseId, rating, comments || null).run();
  return Response.json({ ok: true }, { headers: corsHeaders });
}
__name(handleSupportCaseFeedback, "handleSupportCaseFeedback");
async function handleSupportCaseGet(request, env, caseId) {
  const db = env.SUPPORT_DB;
  const result = await db.prepare(
    `SELECT id, user_id, chat_history, other_context, created_at FROM support_cases WHERE id = ?`
  ).bind(caseId).first();
  if (!result) {
    return Response.json({ error: "Case not found" }, { status: 404, headers: corsHeaders });
  }
  let chatHistory = [];
  let otherContext = null;
  try {
    chatHistory = JSON.parse(result.chat_history);
  } catch {
  }
  try {
    otherContext = result.other_context ? JSON.parse(result.other_context) : null;
  } catch {
  }
  return Response.json({
    caseId: result.id,
    userId: result.user_id,
    chatHistory,
    otherContext,
    createdAt: result.created_at
  }, { headers: corsHeaders });
}
__name(handleSupportCaseGet, "handleSupportCaseGet");
var routes = {
  "/query": { handler: handleQuery, methods: ["POST"] },
  "/chat": { handler: handleChat, methods: ["POST"] },
  "/upsert-mdx": { handler: handleUpsertMDX, methods: ["POST"] },
  "/api/help-form": { handler: handleHelpForm, methods: ["POST"] },
  "/support-case/create": { handler: handleSupportCaseCreate, methods: ["POST"] },
  "/support-case/feedback": { handler: handleSupportCaseFeedback, methods: ["POST"] },
  "/support-case/": { handler: /* @__PURE__ */ __name((req, env, path) => {
    const match = path.match(/^\/support-case\/(.+)$/);
    if (req.method === "GET" && match) {
      return handleSupportCaseGet(req, env, match[1]);
    }
    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  }, "handler"), methods: ["GET"] }
};
var search_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith("/favicon")) {
      return Response.json({ text: "Not found" }, { status: 404, headers: corsHeaders });
    }
    for (const [routePath, route] of Object.entries(routes)) {
      if (path === routePath && route.methods.includes(request.method)) {
        return await route.handler(request, env, path);
      }
      if (routePath === "/support-case/" && path.startsWith(routePath) && route.methods.includes(request.method)) {
        return await route.handler(request, env, path);
      }
    }
    return Response.json({ text: "Not found" }, { status: 404, headers: corsHeaders });
  }
};

// ../../.nvm/versions/node/v20.19.2/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../.nvm/versions/node/v20.19.2/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-36fVLu/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = search_default;

// ../../.nvm/versions/node/v20.19.2/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-36fVLu/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=search.js.map
