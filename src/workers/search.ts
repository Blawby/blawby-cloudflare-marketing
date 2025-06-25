import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: any;
  SUPPORT_DB: any;
  RESEND_API_KEY: string;
}

function withCors(resp: Response) {
  const newHeaders = new Headers(resp.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    let path = new URL(request.url).pathname;
    if (path.startsWith("/favicon")) {
      return withCors(new Response("", { status: 404 }));
    }

    if (path.startsWith("/query")) {
      try {
        let reqBody;
        try {
          reqBody = await request.json();
        } catch (parseError) {
          return withCors(new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 }));
        }
        
        let query = reqBody?.query;
        if (typeof query === "string") {
          query = query.trim();
        }
        if (!query) {
          return withCors(new Response(JSON.stringify({ error: "Missing or empty query parameter" }), { status: 400 }));
        }
        
        const ai = new Ai(env.AI);
        const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });
        const queryVector = embedding.data[0];
        // No mock fallback: VECTORIZE must be available (use experimental_remote = true in wrangler.toml)
        const vectorizeResult = await env.VECTORIZE.query(queryVector, {
          topK: 10,
          returnValues: true,
          returnMetadata: "all",
        });
        let matches = vectorizeResult.matches || vectorizeResult;
        if (!Array.isArray(matches)) {
          // Log the unexpected response for debugging
          console.error("Unexpected VECTORIZE.query response:", JSON.stringify(vectorizeResult));
          return withCors(new Response(JSON.stringify({ error: "VECTORIZE.query did not return an array of matches", details: vectorizeResult }), { status: 500 }));
        }
        // Hybrid re-ranking: boost score for keyword matches in title or section
        const queryWords = query.toLowerCase().split(/\s+/);
        matches.forEach((match: any) => {
          const title = (match.metadata?.title || "").toLowerCase();
          const section = (match.metadata?.section || "").toLowerCase();
          if (
            queryWords.some((word: string) => title.includes(word)) ||
            queryWords.some((word: string) => section.includes(word))
          ) {
            match.score += 1.0; // Boost for keyword match
          }
        });
        matches.sort((a: any, b: any) => b.score - a.score);
        return withCors(Response.json({ matches }));
      } catch (err) {
        // Log the error for debugging
        console.error("/query endpoint error:", err);
        return withCors(new Response(JSON.stringify({ error: "Worker exception in /query", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    // Bulk upsert endpoint for MDX lesson chunks
    if (path === "/upsert-mdx" && request.method === "POST") {
      try {
        const chunks = await request.json(); // [{ id, text, metadata }]
        if (!Array.isArray(chunks)) {
          return withCors(new Response("Invalid input", { status: 400 }));
        }
        // Embed and upsert each chunk
        const ai = new Ai(env.AI);
        const vectors = [];
        for (const chunk of chunks) {
          const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: chunk.text });
          const vector = embedding.data[0];
          vectors.push({
            id: chunk.id,
            values: vector,
            metadata: {
              ...chunk.metadata,
              description: chunk.text,
            },
          });
        }
        const result = await env.VECTORIZE.upsert(vectors);
        return withCors(Response.json({ mutationId: result.mutationId, count: vectors.length }));
      } catch (err) {
        return withCors(new Response(JSON.stringify({ error: "Upsert failed", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    if (path.startsWith("/chat")) {
      try {
        let reqBody;
        try {
          reqBody = await request.json();
        } catch (parseError) {
          return withCors(new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 }));
        }
        
        let query = reqBody?.query;
        if (typeof query === "string") {
          query = query.trim();
        }
        if (!query) {
          return withCors(new Response(JSON.stringify({ error: "Missing or empty query parameter" }), { status: 400 }));
        }
        
        const ai = new Ai(env.AI);
        const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });
        const queryVector = embedding.data[0];
        const vectorizeResult = await env.VECTORIZE.query(queryVector, {
          topK: 5, // Increase to get more pricing context
          returnValues: true,
          returnMetadata: "all",
        });
        let matches = vectorizeResult.matches || vectorizeResult;
        if (!Array.isArray(matches)) {
          console.error("Unexpected VECTORIZE.query response:", JSON.stringify(vectorizeResult));
          return withCors(new Response(JSON.stringify({ error: "VECTORIZE.query did not return an array of matches", details: vectorizeResult }), { status: 500 }));
        }
        // --- Pricing Query Detection ---
        const pricingKeywords = [
          "price", "pricing", "cost", "fee", "fees", "charge", "charges", "how much", "rate", "rates", "platform fee", "transaction fee", "monthly fee", "card fee", "bank fee", "ach fee", "chargeback"
        ];
        const isPricingQuery = pricingKeywords.some(kw => query.toLowerCase().includes(kw));
        if (isPricingQuery) {
          // Aggregate pricing info from context
          let monthlyFee, cardFee, achFee, platformFee, chargebackFee, setupFee, hiddenFee;
          let foundAny = false;
          let contextText = matches.map(m => m.metadata?.description || m.metadata?.text || m.text || "").join("\n");
          // Use regex to extract fees
          // Monthly/user fee
          const monthlyMatch = contextText.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*\/\s*month\s*\/\s*user/i);
          if (monthlyMatch) { monthlyFee = `$${monthlyMatch[1]} per user per month`; foundAny = true; }
          // Card fee
          const cardMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%\s*\+\s*([0-9]+¢|\$[0-9]+(?:\.[0-9]{2})?)\s*per.*card/i);
          if (cardMatch) { cardFee = `${cardMatch[1]}% + ${cardMatch[2]} per card transaction`; foundAny = true; }
          // ACH/bank fee
          const achMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*ACH.*\(\$([0-9]+) cap\)/i);
          if (achMatch) { achFee = `${achMatch[1]}% per ACH (max $${achMatch[2]})`; foundAny = true; }
          // Platform fee
          const platformMatch = contextText.match(/([0-9]+(?:\.[0-9]+)?)%.*platform fee/i) || contextText.match(/additional\s*([0-9]+(?:\.[0-9]+)?)%\s*fee/i);
          if (platformMatch) { platformFee = `${platformMatch[1]}% platform fee (billed monthly)`; foundAny = true; }
          // Chargeback fee
          const chargebackMatch = contextText.match(/\$([0-9]+) fee for disputed payments.*chargebacks?/i);
          if (chargebackMatch) { chargebackFee = `$${chargebackMatch[1]} per chargeback`; foundAny = true; }
          // Setup/hidden fees
          if (/no setup fees?/i.test(contextText)) { setupFee = "No setup fees"; foundAny = true; }
          if (/no hidden fees?/i.test(contextText)) { hiddenFee = "No hidden fees"; foundAny = true; }
          // Compose answer
          let pricingLines = [];
          if (monthlyFee) pricingLines.push(`- **Monthly user license:** ${monthlyFee}`);
          if (cardFee) pricingLines.push(`- **Card payments:** ${cardFee}`);
          if (achFee) pricingLines.push(`- **ACH/bank payments:** ${achFee}`);
          if (platformFee) pricingLines.push(`- **Platform fee:** ${platformFee}`);
          if (chargebackFee) pricingLines.push(`- **Chargeback fee:** ${chargebackFee}`);
          if (setupFee) pricingLines.push(`- ${setupFee}`);
          if (hiddenFee) pricingLines.push(`- ${hiddenFee}`);
          let answer = `**Blawby Pricing Overview**\n\n` + (pricingLines.length ? pricingLines.join("\n") : "(Some fees could not be found in the current context.)");
          answer += `\n\nFor full details and the latest updates, [see our pricing page](/pricing).`;
          return withCors(Response.json({
            message: answer,
            messageFormat: "markdown",
            matches,
          }));
        }
        // --- Fallback: normal LLM prompt ---
        // Build context for LLM
        const context = matches.map((m, i) =>
          `${i + 1}. ${m.metadata?.description || m.metadata?.text || m.text || ""}`
        ).join("\n");
        // Create prompt for LLM
        const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).
\nIMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data.\n\n*Only provide code examples, implementation advice, or technical explanations if they are directly supported by the context below.  
Do **not** generate code or technical advice based on prior knowledge or assumptions.  
If the context does not contain relevant code or instructions, respond by saying you don't know and offer to create a support case.*\n\nUser's question: ${query}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
        // Call Workers AI LLM (Llama 2 Chat)
        const llmResponse = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt,
          max_tokens: 200,
          temperature: 0.3,
        });
        let message: string;
        if (
          llmResponse &&
          typeof llmResponse === "object" &&
          "response" in llmResponse &&
          typeof (llmResponse as any).response === "string"
        ) {
          message = (llmResponse as any).response;
        } else {
          message = "Sorry, I couldn't find an answer.";
        }
        return withCors(Response.json({
          message,
          messageFormat: "markdown",
          matches,
        }));
      } catch (err) {
        console.error("/chat endpoint error:", err);
        return withCors(new Response(JSON.stringify({ error: "Worker exception in /chat", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    // --- Support Case Creation Endpoint ---
    if (path === "/support-case/create" && request.method === "POST") {
      try {
        const db = env.SUPPORT_DB;
        const reqBody = await request.json();
        const { userId, chatHistory, otherContext } = reqBody;
        if (!userId || !Array.isArray(chatHistory)) {
          return withCors(new Response(JSON.stringify({ error: "Missing userId or chatHistory" }), { status: 400 }));
        }
        // Insert support case into D1
        const caseId = crypto.randomUUID();
        const chatHistoryStr = JSON.stringify(chatHistory);
        const otherContextStr = otherContext ? JSON.stringify(otherContext) : null;
        await db.prepare(
          `INSERT INTO support_cases (id, user_id, chat_history, other_context, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
        ).bind(caseId, userId, chatHistoryStr, otherContextStr).run();
        // Return case URL and ID
        const caseUrl = `/support/case/${caseId}`;
        return withCors(Response.json({ caseId, caseUrl, prefilledFields: { userId, chatHistory, otherContext } }));
      } catch (err) {
        console.error("/support-case/create error:", err);
        return withCors(new Response(JSON.stringify({ error: "Failed to create support case", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    // --- Support Case Feedback Endpoint ---
    if (path === "/support-case/feedback" && request.method === "POST") {
      try {
        const db = env.SUPPORT_DB;
        const reqBody = await request.json();
        const { caseId, rating, comments } = reqBody;
        if (!caseId || typeof rating !== "number" || rating < 1 || rating > 5) {
          return withCors(new Response(JSON.stringify({ error: "Missing or invalid caseId or rating" }), { status: 400 }));
        }
        await db.prepare(
          `INSERT INTO support_feedback (case_id, rating, comments, created_at) VALUES (?, ?, ?, datetime('now'))`
        ).bind(caseId, rating, comments || null).run();
        return withCors(Response.json({ ok: true }));
      } catch (err) {
        console.error("/support-case/feedback error:", err);
        return withCors(new Response(JSON.stringify({ error: "Failed to submit feedback", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    // --- Support Case Prefill Endpoint ---
    if (path.startsWith("/support-case/") && request.method === "GET") {
      const match = path.match(/^\/support-case\/(.+)$/);
      if (match) {
        const caseId = match[1];
        try {
          const db = env.SUPPORT_DB;
          const result = await db.prepare(
            `SELECT id, user_id, chat_history, other_context, created_at FROM support_cases WHERE id = ?`
          ).bind(caseId).first();
          if (!result) {
            return withCors(new Response(JSON.stringify({ error: "Case not found" }), { status: 404 }));
          }
          // Parse JSON fields
          let chatHistory = [];
          let otherContext = null;
          try { chatHistory = JSON.parse(result.chat_history); } catch {}
          try { otherContext = result.other_context ? JSON.parse(result.other_context) : null; } catch {}
          return withCors(Response.json({
            caseId: result.id,
            userId: result.user_id,
            chatHistory,
            otherContext,
            createdAt: result.created_at,
          }));
        } catch (err) {
          console.error("/support-case/:id GET error:", err);
          return withCors(new Response(JSON.stringify({ error: "Failed to fetch support case", details: err instanceof Error ? err.message : err }), { status: 500 }));
        }
      }
    }

    // --- Help Form Email Endpoint ---
    if (path === "/api/help-form" && request.method === "POST") {
      try {
        const { name, email, message } = await request.json();
        if (!name || !email || !message) {
          return withCors(new Response(JSON.stringify({ error: "Missing name, email, or message" }), { status: 400 }));
        }
        // Compose plain text email
        const emailBody = `New help form submission:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`;
        const resendApiKey = env.RESEND_API_KEY;
        if (!resendApiKey) {
          return withCors(new Response(JSON.stringify({ error: "Missing RESEND_API_KEY in environment" }), { status: 500 }));
        }
        // HTML email for admin
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background: #18181b; padding: 24px 0; text-align: center;">
              <img src=\"https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public\" alt=\"Blawby Logo\" style=\"height:38px;\" />
            </div>
            <div style="padding: 32px; background: #fff;">
              <h2 style="color: #18181b; margin-top: 0;">New help form submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #f4f4f5; padding: 16px; border-radius: 4px; color: #18181b; white-space: pre-line;">${message}</div>
            </div>
            <div style="background: #f4f4f5; color: #888; text-align: center; font-size: 12px; padding: 16px;">
              &copy; ${new Date().getFullYear()} Blawby. All rights reserved.
            </div>
          </div>
        `;
        // Send notification to site owner
        const sendResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "support@blawby.com",
            to: ["paulchrisluke@gmail.com"],
            subject: `Help Form Submission from ${name}`,
            text: emailBody,
            html: adminHtml,
          }),
        });
        if (!sendResp.ok) {
          const errText = await sendResp.text();
          return withCors(new Response(JSON.stringify({ error: "Failed to send email", details: errText }), { status: 500 }));
        }
        // HTML email for user
        const userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background: #18181b; padding: 24px 0; text-align: center;">
              <img src=\"https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public\" alt=\"Blawby Logo\" style=\"height:38px;\" />
            </div>
            <div style="padding: 32px; background: #fff;">
              <h2 style="color: #18181b; margin-top: 0;">We've received your support request</h2>
              <p>Hi ${name},</p>
              <p>Thank you for contacting Blawby support! We have received your message and will get back to you as soon as possible.</p>
              <p><strong>Your message:</strong></p>
              <div style="background: #f4f4f5; padding: 16px; border-radius: 4px; color: #18181b; white-space: pre-line;">${message}</div>
              <p style="margin-top: 24px;">If you have any additional information, just reply to this email.</p>
              <p style="margin-top: 24px;">Best,<br/>The Blawby Team</p>
            </div>
            <div style="background: #f4f4f5; color: #888; text-align: center; font-size: 12px; padding: 16px;">
              &copy; ${new Date().getFullYear()} Blawby. All rights reserved.
            </div>
          </div>
        `;
        // Send confirmation to user
        const confirmBody = `Hi ${name},\n\nThank you for contacting Blawby support! We have received your message and will get back to you as soon as possible.\n\nYour message:\n${message}\n\nIf you have any additional information, just reply to this email.\n\nBest,\nThe Blawby Team`;
        const confirmResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "support@blawby.com",
            to: [email],
            subject: "We've received your support request",
            text: confirmBody,
            html: userHtml,
          }),
        });
        if (!confirmResp.ok) {
          const errText = await confirmResp.text();
          return withCors(new Response(JSON.stringify({ error: "Failed to send confirmation email", details: errText }), { status: 500 }));
        }
        return withCors(Response.json({ ok: true }));
      } catch (err) {
        return withCors(new Response(JSON.stringify({ error: "Exception in /api/help-form", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    return withCors(Response.json({ text: "Not found" }, { status: 404 }));
  },
}; 