import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: Ai;
  SUPPORT_DB: any;
  RESEND_API_KEY: string;
}

// --- Config: Intent Patterns ---
const INTENT_PATTERNS = [
  { name: 'pricing', pattern: /\b(price|pricing|cost|fee|fees|charge|charges|how much|rate|rates|platform fee|transaction fee|monthly fee|card fee|bank fee|ach fee|chargeback)\b/, exclude: /integrate|setup|configure/ },
  { name: 'support', pattern: /\b(speak to human|talk to human|human support|real person|speak to someone|talk to someone|human agent|live agent|customer service|support team|not working|broken|issue|problem|error|frustrated|angry|upset|help me|stuck|can't|won't|doesn't work|need help|need support|i need help|get help)\b|\bspeak\b.*\bhuman\b|\btalk\b.*\bhuman\b/, exclude: /does.*support|what.*support|feature.*support|recurring.*support|blawby.*support/ },
  { name: 'abusive', pattern: /\b(fuck|shit|bitch|asshole|cunt|bastard|dick|suck|faggot|retard|idiot|moron|stupid)\b/ }
];

// --- CORS Helper ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// --- Request Validation Helper ---
async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON");
  }
}

// --- AIService ---
class AIService {
  constructor(private ai: Ai, private env: Env) {}
  
  async getEmbedding(text: string) {
    const embedding = await this.ai.run("@cf/baai/bge-small-en-v1.5", { text });
    return embedding.data[0];
  }
  
  async queryVectorDB(queryVector: number[], topK: number = 10) {
    const vectorizeResult = await this.env.VECTORIZE.query(queryVector, {
      topK,
      returnValues: true,
      returnMetadata: "all",
    });
    return vectorizeResult.matches || vectorizeResult;
  }
  
  private enhanceMatches(matches: any[], query: string) {
    const docTypeBoost: Record<string, number> = { lesson: 2, article: 1.5, page: 1.2 };
    return matches
      .map(m => ({ ...m, score: (m.score || 1) * (docTypeBoost[m.metadata?.docType as string] || 1) }))
      .sort((a, b) => b.score - a.score);
  }
  
  async getEnhancedMatches(query: string, topK: number = 10) {
    const queryVector = await this.getEmbedding(query);
    const matches = await this.queryVectorDB(queryVector, topK);
    return this.enhanceMatches(matches, query);
  }
  
  async runLLM(prompt: string) {
    return this.ai.run("@cf/meta/llama-2-7b-chat-int8", {
      prompt,
      max_tokens: 200,
      temperature: 0.3,
    });
  }
}

// --- EmailService ---
class EmailService {
  constructor(private resendApiKey: string) {}
  
  async send({ from, to, subject, text }: { from: string; to: string | string[]; subject: string; text: string; }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: this.buildHtml(subject, text)
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }
    
    return response;
  }
  
  buildHtml(subject: string, text: string) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #18181b;">${subject}</h2>
      <div style="white-space: pre-line;">${text}</div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} Blawby. All rights reserved.</p>
    </div>`;
  }
}

// --- IntentHandler ---
class IntentHandler {
  static detect(query: string) {
    const q = query.toLowerCase();
    for (const intent of INTENT_PATTERNS) {
      if (intent.pattern.test(q) && (!intent.exclude || !intent.exclude.test(q))) {
        return intent.name;
      }
    }
    return 'general';
  }
  
  static buildResponse(intent: string, data: any) {
    switch (intent) {
      case 'pricing': {
        const { matches } = data;
        const contextText = matches.map((m: any) => m.metadata?.description || m.metadata?.text || m.text || "").join("\n");
        const pricing = extractPricingInfo(contextText);
        let pricingLines = [];
        if (pricing.monthlyFee) pricingLines.push(`- **Monthly user license:** ${pricing.monthlyFee}`);
        if (pricing.cardFee) pricingLines.push(`- **Card payments:** ${pricing.cardFee}`);
        if (pricing.achFee) pricingLines.push(`- **ACH/bank payments:** ${pricing.achFee}`);
        if (pricing.platformFee) pricingLines.push(`- **Platform fee:** ${pricing.platformFee}`);
        if (pricing.invoiceFee) pricingLines.push(`- **Invoice fee:** ${pricing.invoiceFee}`);
        if (pricing.chargebackFee) pricingLines.push(`- **Chargeback fee:** ${pricing.chargebackFee}`);
        if (pricing.setupFee) pricingLines.push(`- ${pricing.setupFee}`);
        if (pricing.hiddenFee) pricingLines.push(`- ${pricing.hiddenFee}`);
        let answer = `**Blawby Pricing Overview**\n\n` + (pricingLines.length ? pricingLines.join("\n") : "(Some fees could not be found in the current context.)");
        answer += `\n\nFor full details and the latest updates, [see our pricing page](/pricing).`;
        return Response.json({ message: answer, messageFormat: "markdown", matches }, { headers: corsHeaders });
      }
      case 'support': {
        let answer = `If you need help, you can get support right now by clicking the **Create Support Case** button below.\nOur team will get back to you as soon as possible.\n\nFor real-time help, you can also [join our Discord](https://discord.com/invite/rPmzknKv).`;
        return Response.json({ message: answer, messageFormat: "markdown", matches: [] }, { headers: corsHeaders });
      }
      case 'abusive': {
        const answer = `I'm here to help. Let's keep things respectful—how can I assist you today?`;
        return Response.json({ message: answer, messageFormat: "markdown", matches: [] }, { headers: corsHeaders });
      }
      default:
        return null;
    }
  }
}

// --- Pricing Extraction Utility ---
function extractPricingInfo(contextText: string) {
  let monthlyFee, cardFee, achFee, platformFee, chargebackFee, setupFee, hiddenFee, invoiceFee;
  
  // Monthly/user fee - multiple patterns
  const monthlyMatch = contextText.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*\/\s*month\s*\/\s*user/i) || 
                      contextText.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*per\s*month\s*per\s*user/i) ||
                      contextText.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*per\s*month.*user/i);
  if (monthlyMatch) monthlyFee = `$${monthlyMatch[1]} per user per month`;
  
  // Card fee - multiple patterns
  const cardMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*card/i) ||
                   contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*transaction/i) ||
                   contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)/i);
  if (cardMatch) cardFee = `${cardMatch[1]}% + ${cardMatch[2]} per card transaction`;
  
  // ACH/bank fee - multiple patterns
  const achMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*ACH.*\(\$([0-9]+) cap\)/i) || 
                  contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*ACH\s*Direct\s*Debit\s*\(\$([0-9]+)\s*cap\)/i) ||
                  contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*ACH.*\(\$([0-9]+)\)/i);
  if (achMatch) achFee = `${achMatch[1]}% per ACH (max $${achMatch[2]})`;
  
  // Platform fee - multiple patterns
  const platformMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*platform fee/i) || 
                       contextText.match(/additional\s*([0-9]+(?:\.[0-9]+)?)%\s*fee/i) ||
                       contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*platform/i);
  if (platformMatch) platformFee = `${platformMatch[1]}% platform fee (billed monthly)`;
  
  // Invoice fee - multiple patterns
  const invoiceMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*per\s*paid\s*invoice/i) ||
                      contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*per.*invoice/i);
  if (invoiceMatch) invoiceFee = `${invoiceMatch[1]}% per paid invoice`;
  
  // Chargeback fee - multiple patterns
  const chargebackMatch = contextText.match(/\$([0-9]+) fee for disputed payments.*chargebacks?/i) || 
                         contextText.match(/\$([0-9]+)\s*fee.*chargeback/i) ||
                         contextText.match(/\$([0-9]+).*chargeback/i);
  if (chargebackMatch) chargebackFee = `$${chargebackMatch[1]} per chargeback`;
  
  // Setup/hidden fees
  if (/no setup fees?/i.test(contextText)) setupFee = "No setup fees";
  if (/no hidden fees?/i.test(contextText)) hiddenFee = "No hidden fees";
  
  return { monthlyFee, cardFee, achFee, platformFee, chargebackFee, setupFee, hiddenFee, invoiceFee };
}

// --- Route Handlers ---
async function handleQuery(request: Request, env: Env) {
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

async function handleChat(request: Request, env: Env) {
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
  
  // Fallback: LLM
  const context = matches.map((m: any, i: number) => {
    const title = m.metadata?.title || "";
    const url = m.metadata?.url || m.metadata?.slug || "";
    const description = m.metadata?.description || m.metadata?.text || m.text || "";
    let link = "";
    if (url) {
      link = url.startsWith("http") ? url : (url.startsWith("/") ? url : `/${url}`);
    }
    return `${i + 1}. ${title ? `**${title}**\n` : ""}${description}${link ? `\n\nDocumentation: ${link}` : ""}`;
  }).join("\n\n");
  
  const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).\nIMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data.\n\n*Only provide code examples, implementation advice, or technical explanations if they are directly supported by the context below.  \nDo **not** generate code or technical advice based on prior knowledge or assumptions.  \nIf the context does not contain relevant code or instructions, respond by saying you don't know and offer to create a support case.*\n\n**CRITICAL**: If the context includes documentation links (marked as Documentation: url), you MUST include at least one relevant link in your response when answering questions about features, products, or how-to topics.\n\nUser's question: ${query.trim()}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
  
  const llmResponse = await ai.runLLM(prompt);
  let message = (llmResponse && typeof llmResponse === "object" && "response" in llmResponse && typeof (llmResponse as any).response === "string") ? (llmResponse as any).response : "Sorry, I couldn't find an answer.";
  
  // Ensure doc link for feature/product queries
  if (intent === 'general') {
    let paymentsMatch = matches.find((m: any) => m.metadata?.url === "/lessons/payments");
    let top = paymentsMatch || matches.find((m: any) => (m.metadata?.url || m.metadata?.slug));
    const topUrl = top ? (top.metadata?.url || top.metadata?.slug) : null;
    if (topUrl) {
      const topLink = topUrl.startsWith("http") ? topUrl : (topUrl.startsWith("/") ? topUrl : `/${topUrl}`);
      message = message.replace(/\[Read more\]\(\/[^)]+\)/g, `[Read more](${topLink})`);
      if (!/\[Read more\]\(/.test(message)) {
        message += `\n\n[Read more](${topLink})`;
      }
      if (!message.includes(topLink)) {
        message += `\n\nDocumentation: ${topLink}`;
      }
    }
  }
  
  return Response.json({ message, messageFormat: "markdown", matches }, { headers: corsHeaders });
}

async function handleUpsertMDX(request: Request, env: Env) {
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

async function handleHelpForm(request: Request, env: Env) {
  let reqBody;
  try {
    reqBody = await parseJsonBody(request);
  } catch (err) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }
  
  const { name, email, message } = reqBody;
  if (!name || !email || !message) {
    return Response.json({ error: `Missing ${!name ? 'name' : !email ? 'email' : 'message'}` }, { status: 400, headers: corsHeaders });
  }
  
  const emailSvc = new EmailService(env.RESEND_API_KEY);
  const emailBody = `New help form submission:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`;
  await emailSvc.send({ from: "noreply@blawby.com", to: "support@blawby.com", subject: "New Help Form Submission", text: emailBody });
  await emailSvc.send({ from: "noreply@blawby.com", to: email, subject: "We received your message", text: `Thank you for contacting us. We'll get back to you soon.\n\nYour message:\n${message}` });
  
  return Response.json({ success: true }, { headers: corsHeaders });
}

async function handleSupportCaseCreate(request: Request, env: Env) {
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

async function handleSupportCaseFeedback(request: Request, env: Env) {
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

async function handleSupportCaseGet(request: Request, env: Env, caseId: string) {
  const db = env.SUPPORT_DB;
  const result = await db.prepare(
    `SELECT id, user_id, chat_history, other_context, created_at FROM support_cases WHERE id = ?`
  ).bind(caseId).first();
  
  if (!result) {
    return Response.json({ error: "Case not found" }, { status: 404, headers: corsHeaders });
  }
  
  let chatHistory = [];
  let otherContext = null;
  try { chatHistory = JSON.parse(result.chat_history); } catch {}
  try { otherContext = result.other_context ? JSON.parse(result.other_context) : null; } catch {}
  
  return Response.json({
    caseId: result.id,
    userId: result.user_id,
    chatHistory,
    otherContext,
    createdAt: result.created_at,
  }, { headers: corsHeaders });
}

// --- Main Fetch Handler ---
const routes = {
  "/query": { handler: handleQuery, methods: ["POST"] },
  "/chat": { handler: handleChat, methods: ["POST"] },
  "/upsert-mdx": { handler: handleUpsertMDX, methods: ["POST"] },
  "/api/help-form": { handler: handleHelpForm, methods: ["POST"] },
  "/support-case/create": { handler: handleSupportCaseCreate, methods: ["POST"] },
  "/support-case/feedback": { handler: handleSupportCaseFeedback, methods: ["POST"] },
  "/support-case/": { handler: (req: Request, env: Env, path: string) => {
    const match = path.match(/^\/support-case\/(.+)$/);
    if (req.method === "GET" && match) {
      return handleSupportCaseGet(req, env, match[1]);
    }
    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  }, methods: ["GET"] }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
  },
}; 