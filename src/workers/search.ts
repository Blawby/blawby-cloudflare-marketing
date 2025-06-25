import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: any;
  SUPPORT_DB: any;
  RESEND_API_KEY: string;
}

// Utility functions
const withCors = (resp: Response) => {
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
};

const jsonResponse = (data: any, status = 200) => withCors(Response.json(data, { status }));
const errorResponse = (error: string, details?: any, status = 500) => 
  jsonResponse({ error, ...(details && { details }) }, status);

const getEmbedding = async (ai: Ai, text: string) => {
  const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text });
  return embedding.data[0];
};

const queryVectorDB = async (env: Env, queryVector: number[], topK = 5) => {
  const result = await env.VECTORIZE.query(queryVector, {
    topK, returnValues: true, returnMetadata: "all"
  });
  const matches = result.matches || result;
  if (!Array.isArray(matches)) {
    throw new Error("VECTORIZE.query did not return an array of matches");
  }
  return matches;
};

const enhanceMatches = (matches: any[], query: string) => {
  const queryWords = query.toLowerCase().split(/\s+/);
  matches.forEach(match => {
    const title = (match.metadata?.title || "").toLowerCase();
    const section = (match.metadata?.section || "").toLowerCase();
    if (queryWords.some(word => title.includes(word) || section.includes(word))) {
      match.score += 1.0;
    }
  });
  return matches.sort((a, b) => b.score - a.score);
};

// Email utilities
const sendEmail = async (apiKey: string, from: string, to: string[], subject: string, text: string, html: string) => {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html })
  });
  if (!resp.ok) throw new Error(`Email failed: ${await resp.text()}`);
};

const createEmailTemplate = (logoUrl: string, title: string, content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
    <div style="background: #18181b; padding: 24px 0; text-align: center;">
      <img src="${logoUrl}" alt="Blawby Logo" style="height:38px;" />
    </div>
    <div style="padding: 32px; background: #fff;">
      <h2 style="color: #18181b; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div style="background: #f4f4f5; color: #888; text-align: center; font-size: 12px; padding: 16px;">
      &copy; ${new Date().getFullYear()} Blawby. All rights reserved.
    </div>
  </div>
`;

// Route handlers
const handleQuery = async (request: Request, env: Env) => {
  const { query } = await request.json();
  const ai = new Ai(env.AI);
  const queryVector = await getEmbedding(ai, query.trim());
  const matches = await queryVectorDB(env, queryVector, 10);
  return jsonResponse({ matches: enhanceMatches(matches, query) });
};

const handleUpsert = async (request: Request, env: Env) => {
  const chunks = await request.json();
  if (!Array.isArray(chunks)) return errorResponse("Invalid input", null, 400);
  
  const ai = new Ai(env.AI);
  const vectors = await Promise.all(chunks.map(async chunk => ({
    id: chunk.id,
    values: await getEmbedding(ai, chunk.text),
    metadata: { ...chunk.metadata, description: chunk.text }
  })));
  
  const result = await env.VECTORIZE.upsert(vectors);
  return jsonResponse({ mutationId: result.mutationId, count: vectors.length });
};

const handleChat = async (request: Request, env: Env) => {
  const { query } = await request.json();
  const ai = new Ai(env.AI);
  const queryVector = await getEmbedding(ai, query.trim());
  const matches = await queryVectorDB(env, queryVector, 5);
  
  // Check for pricing queries
  const pricingKeywords = ["price", "pricing", "cost", "fee", "fees", "charge", "charges", "how much", "rate", "rates", "platform fee", "transaction fee", "monthly fee", "card fee", "bank fee", "ach fee", "chargeback"];
  const isPricingQuery = pricingKeywords.some(kw => query.toLowerCase().includes(kw));
  
  if (isPricingQuery) {
    const contextText = matches.map(m => m.metadata?.description || m.metadata?.text || m.text || "").join("\n");
    const feePatterns = [
      { pattern: /\$([0-9]+(?:\.[0-9]{2})?)\s*\/\s*month\s*\/\s*user/i, format: (m: RegExpMatchArray) => `**Monthly user license:** $${m[1]} per user per month` },
      { pattern: /([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*card/i, format: (m: RegExpMatchArray) => `**Card payments:** ${m[1]}% + ${m[2]} per card transaction` },
      { pattern: /([0-9]+(?:\.[0-9]+)?)%.*ACH.*\(\$([0-9]+) cap\)/i, format: (m: RegExpMatchArray) => `**ACH/bank payments:** ${m[1]}% per ACH (max $${m[2]})` },
      { pattern: /([0-9]+(?:\.[0-9]+)?)%.*platform fee/i, format: (m: RegExpMatchArray) => `**Platform fee:** ${m[1]}% platform fee (billed monthly)` },
      { pattern: /\$([0-9]+) fee for disputed payments.*chargebacks?/i, format: (m: RegExpMatchArray) => `**Chargeback fee:** $${m[1]} per chargeback` }
    ];
    
    const pricingLines = feePatterns.map(({ pattern, format }) => {
      const match = contextText.match(pattern);
      return match ? `- ${format(match)}` : null;
    }).filter(Boolean);
    
    if (/no setup fees?/i.test(contextText)) pricingLines.push("- No setup fees");
    if (/no hidden fees?/i.test(contextText)) pricingLines.push("- No hidden fees");
    
    const answer = `**Blawby Pricing Overview**\n\n${pricingLines.length ? pricingLines.join("\n") : "(Some fees could not be found in the current context.)"}\n\nFor full details and the latest updates, [see our pricing page](/pricing).`;
    return jsonResponse({ message: answer, messageFormat: "markdown", matches });
  }
  
  // Regular LLM response
  const context = matches.map((m, i) => `${i + 1}. ${m.metadata?.description || m.metadata?.text || m.text || ""}`).join("\n");
  const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).
\nIMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data.\n\n*Only provide code examples, implementation advice, or technical explanations if they are directly supported by the context below.  
Do **not** generate code or technical advice based on prior knowledge or assumptions.  
If the context does not contain relevant code or instructions, respond by saying you don't know and offer to create a support case.*\n\nUser's question: ${query}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
  
  const llmResponse = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
    prompt, max_tokens: 200, temperature: 0.3
  });
  
  const message = (llmResponse as any)?.response || "Sorry, I couldn't find an answer.";
  return jsonResponse({ message, messageFormat: "markdown", matches });
};

const handleSupportCase = async (request: Request, env: Env, action: string, caseId?: string): Promise<Response> => {
  const db = env.SUPPORT_DB;
  
  if (action === "create") {
    const { userId, chatHistory, otherContext } = await request.json();
    if (!userId || !Array.isArray(chatHistory)) {
      return errorResponse("Missing userId or chatHistory", null, 400);
    }
    
    const id = crypto.randomUUID();
    await db.prepare(`INSERT INTO support_cases (id, user_id, chat_history, other_context, created_at) VALUES (?, ?, ?, ?, datetime('now'))`)
      .bind(id, userId, JSON.stringify(chatHistory), otherContext ? JSON.stringify(otherContext) : null).run();
    
    return jsonResponse({ caseId: id, caseUrl: `/support/case/${id}`, prefilledFields: { userId, chatHistory, otherContext } });
  }
  
  if (action === "feedback") {
    const { caseId, rating, comments } = await request.json();
    if (!caseId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return errorResponse("Missing or invalid caseId or rating", null, 400);
    }
    
    await db.prepare(`INSERT INTO support_feedback (case_id, rating, comments, created_at) VALUES (?, ?, ?, datetime('now'))`)
      .bind(caseId, rating, comments || null).run();
    
    return jsonResponse({ ok: true });
  }
  
  if (action === "get" && caseId) {
    const result = await db.prepare(`SELECT id, user_id, chat_history, other_context, created_at FROM support_cases WHERE id = ?`)
      .bind(caseId).first();
    
    if (!result) return errorResponse("Case not found", null, 404);
    
    let chatHistory = [], otherContext = null;
    try { chatHistory = JSON.parse(result.chat_history); } catch {}
    try { otherContext = result.other_context ? JSON.parse(result.other_context) : null; } catch {}
    
    return jsonResponse({ caseId: result.id, userId: result.user_id, chatHistory, otherContext, createdAt: result.created_at });
  }
  
  return errorResponse("Invalid action", null, 400);
};

const handleHelpForm = async (request: Request, env: Env) => {
  const { name, email, message } = await request.json();
  if (!name || !email || !message) return errorResponse("Missing name, email, or message", null, 400);
  if (!env.RESEND_API_KEY) return errorResponse("Missing RESEND_API_KEY in environment");
  
  const logoUrl = "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public";
  
  // Send admin notification
  const adminContent = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><div style="background: #f4f4f5; padding: 16px; border-radius: 4px; color: #18181b; white-space: pre-line;">${message}</div>`;
  const adminHtml = createEmailTemplate(logoUrl, "New help form submission", adminContent);
  const adminText = `New help form submission:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`;
  
  await sendEmail(env.RESEND_API_KEY, "support@blawby.com", ["paulchrisluke@gmail.com"], `Help Form Submission from ${name}`, adminText, adminHtml);
  
  // Send user confirmation
  const userContent = `<p>Hi ${name},</p><p>Thank you for contacting Blawby support! We have received your message and will get back to you as soon as possible.</p><p><strong>Your message:</strong></p><div style="background: #f4f4f5; padding: 16px; border-radius: 4px; color: #18181b; white-space: pre-line;">${message}</div><p style="margin-top: 24px;">If you have any additional information, just reply to this email.</p><p style="margin-top: 24px;">Best,<br/>The Blawby Team</p>`;
  const userHtml = createEmailTemplate(logoUrl, "We've received your support request", userContent);
  const userText = `Hi ${name},\n\nThank you for contacting Blawby support! We have received your message and will get back to you as soon as possible.\n\nYour message:\n${message}\n\nIf you have any additional information, just reply to this email.\n\nBest,\nThe Blawby Team`;
  
  await sendEmail(env.RESEND_API_KEY, "support@blawby.com", [email], "We've received your support request", userText, userHtml);
  
  return jsonResponse({ ok: true });
};

// Main handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const { pathname } = new URL(request.url);
    
    if (pathname.startsWith("/favicon")) return withCors(new Response("", { status: 404 }));

    try {
      if (pathname.startsWith("/query")) return await handleQuery(request, env);
      if (pathname === "/upsert-mdx" && request.method === "POST") return await handleUpsert(request, env);
      if (pathname.startsWith("/chat")) return await handleChat(request, env);
      if (pathname === "/support-case/create" && request.method === "POST") return await handleSupportCase(request, env, "create");
      if (pathname === "/support-case/feedback" && request.method === "POST") return await handleSupportCase(request, env, "feedback");
      if (pathname.startsWith("/support-case/") && request.method === "GET") {
        const caseId = pathname.split("/").pop();
        return await handleSupportCase(request, env, "get", caseId);
      }
      if (pathname === "/api/help-form" && request.method === "POST") return await handleHelpForm(request, env);
      
      return jsonResponse({ text: "Not found" }, 404);
    } catch (err) {
      console.error(`${pathname} error:`, err);
      return errorResponse("Worker exception", err instanceof Error ? err.message : err);
    }
  }
};