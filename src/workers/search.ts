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
        // Hybrid re-ranking: boost score for keyword matches and preferred doc types
        const queryWords = query.toLowerCase().split(/\s+/);
        // Extract key concepts (filter out common words)
        const commonWords = ['what', 'is', 'about', 'how', 'do', 'i', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
        const keyConcepts = queryWords.filter(word => 
          word.length > 2 && !commonWords.includes(word)
        );
        
        matches.forEach((match: any) => {
          const title = (match.metadata?.title || "").toLowerCase();
          const section = (match.metadata?.section || "").toLowerCase();
          const content = (match.metadata?.description || match.metadata?.text || match.text || "").toLowerCase();
          const docType = match.metadata?.docType || "";
          
          // Boost for key concept matches with different weights
          keyConcepts.forEach(concept => {
            // Highest boost for exact title match
            if (title === concept) {
              match.score += 3.0;
            }
            // High boost for title containing the concept
            else if (title.includes(concept)) {
              match.score += 2.5;
            }
            // Medium boost for section containing the concept
            else if (section.includes(concept)) {
              match.score += 1.5;
            }
            // Lower boost for content containing the concept
            else if (content.includes(concept)) {
              match.score += 0.5;
            }
          });
          
          // Boost for preferred document types (lessons, articles, pages)
          if (docType === "lesson") {
            match.score += 2.0; // Highest priority for lessons
          } else if (docType === "article") {
            match.score += 1.5; // Medium priority for articles
          } else if (docType === "page") {
            match.score += 1.0; // Lower priority for pages
          }
          // Other doc types (like business-strategy) get no boost
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
          topK: 10, // Match /query endpoint
          returnValues: true,
          returnMetadata: "all",
        });
        let matches = vectorizeResult.matches || vectorizeResult;
        if (!Array.isArray(matches)) {
          console.error("Unexpected VECTORIZE.query response:", JSON.stringify(vectorizeResult));
          return withCors(new Response(JSON.stringify({ error: "VECTORIZE.query did not return an array of matches", details: vectorizeResult }), { status: 500 }));
        }
        
        // --- Apply improved re-ranking logic (same as /query) ---
        const queryWords = query.toLowerCase().split(/\s+/);
        const commonWords = ['what', 'is', 'about', 'how', 'do', 'i', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
        const keyConcepts = queryWords.filter(word => word.length > 2 && !commonWords.includes(word));
        matches.forEach((match: any) => {
          const title = (match.metadata?.title || "").toLowerCase();
          const section = (match.metadata?.section || "").toLowerCase();
          const content = (match.metadata?.description || match.metadata?.text || match.text || "").toLowerCase();
          const docType = match.metadata?.docType || "";
          keyConcepts.forEach(concept => {
            if (title === concept) {
              match.score += 3.0;
            } else if (title.includes(concept)) {
              match.score += 2.5;
            } else if (section.includes(concept)) {
              match.score += 1.5;
            } else if (content.includes(concept)) {
              match.score += 0.5;
            }
          });
          if (docType === "lesson") {
            match.score += 2.0;
          } else if (docType === "article") {
            match.score += 1.5;
          } else if (docType === "page") {
            match.score += 1.0;
          }
        });
        matches.sort((a: any, b: any) => b.score - a.score);
        
        // --- Pricing Query Detection ---
        const pricingKeywords = [
          "price", "pricing", "cost", "fee", "fees", "charge", "charges", "how much", "rate", "rates", "platform fee", "transaction fee", "monthly fee", "card fee", "bank fee", "ach fee", "chargeback"
        ];
        const isPricingQuery = pricingKeywords.some(kw => query.toLowerCase().includes(kw)) && 
          !query.toLowerCase().includes("integrate") && 
          !query.toLowerCase().includes("setup") &&
          !query.toLowerCase().includes("configure");
        
        // --- Human Request Detection ---
        const humanRequestKeywords = [
          "speak to human", "talk to human", "human support", "real person", "speak to someone", "talk to someone", "human agent", "live agent", "customer service", "support team", "speak to a human", "talk to a human"
        ];
        const isHumanRequest = humanRequestKeywords.some(kw => query.toLowerCase().includes(kw)) || 
          (query.toLowerCase().includes("speak") && query.toLowerCase().includes("human")) ||
          (query.toLowerCase().includes("talk") && query.toLowerCase().includes("human"));
        
        // --- Technical/Integration Query Detection ---
        const technicalKeywords = [
          "integrate", "integration", "setup", "configure", "api", "webhook", "sdk", "implementation", "technical", "developer", "code", "programming", "how do i", "how to"
        ];
        const isTechnicalQuery = technicalKeywords.some(kw => query.toLowerCase().includes(kw)) ||
          (query.toLowerCase().includes("how") && query.toLowerCase().includes("integrate")) ||
          (query.toLowerCase().includes("how") && query.toLowerCase().includes("setup"));
        
        // --- Frustrated User Detection ---
        const frustratedKeywords = [
          "not working", "broken", "issue", "problem", "error", "frustrated", "angry", "upset", "help me", "stuck", "can't", "won't", "doesn't work"
        ];
        const isFrustratedUser = frustratedKeywords.some(kw => query.toLowerCase().includes(kw));
        
        // --- Support Request Detection ---
        const supportKeywords = [
          "help", "support", "assist", "account", "issue", "problem", "trouble", "need help", "need support"
        ];
        const isSupportRequest = supportKeywords.some(kw => query.toLowerCase().includes(kw)) &&
          !isFrustratedUser && !isHumanRequest && !isTechnicalQuery &&
          !query.toLowerCase().includes("compliance") && !query.toLowerCase().includes("trust") &&
          !query.toLowerCase().includes("recurring") && !query.toLowerCase().includes("feature") &&
          !query.toLowerCase().includes("what is") && !query.toLowerCase().includes("does blawby");
        
        // Debug logging
        console.log(`Query: "${query}"`);
        console.log(`isPricingQuery: ${isPricingQuery}`);
        console.log(`isHumanRequest: ${isHumanRequest}`);
        console.log(`isTechnicalQuery: ${isTechnicalQuery}`);
        console.log(`isFrustratedUser: ${isFrustratedUser}`);
        
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
        
        // --- Human Request Handler ---
        if (isHumanRequest) {
          const answer = `You can request human help by clicking the **Create Support Case** button below.
Our team will get back to you as soon as possible.

For real-time help, you can also [join our Discord](https://discord.com/invite/rPmzknKv).`;
          return withCors(Response.json({
            message: answer,
            messageFormat: "markdown",
            matches: [],
          }));
        }
        
        // --- Technical Query Handler ---
        if (isTechnicalQuery) {
          const answer = `For technical integration and setup questions, I recommend checking our documentation or creating a support case for personalized assistance.

**Next steps:**
1. **Review our documentation** for integration guides and API references
2. **Create a support case** for specific technical questions at our **[support form](/help)**
3. **Contact our technical team** for complex integration needs

Our team can provide detailed technical guidance and help with your specific implementation.`;
          
          return withCors(Response.json({
            message: answer,
            messageFormat: "markdown",
            matches: [],
          }));
        }
        
        // --- Frustrated User Handler ---
        // Detect strong profanity/abusive language
        const abusiveKeywords = ["fuck", "shit", "bitch", "asshole", "cunt", "bastard", "dick", "suck", "faggot", "retard", "idiot", "moron", "stupid"]; // extend as needed
        const isAbusive = abusiveKeywords.some(kw => query.toLowerCase().includes(kw));
        if (isFrustratedUser) {
          let answer;
          if (isAbusive) {
            answer = `I'm here to help. Let's keep things respectful—how can I assist you today?`;
          } else {
            answer = `I'm here to help. Can you tell me more about the issue?`;
          }
          return withCors(Response.json({
            message: answer,
            messageFormat: "markdown",
            matches: [],
          }));
        }
        
        // --- Support Request Handler ---
        if (isSupportRequest) {
          const answer = `If you need help, you can get support right now by clicking the **Create Support Case** button below.
Our team will get back to you as soon as possible.

For real-time help, you can also [join our Discord](https://discord.com/invite/rPmzknKv).`;
          return withCors(Response.json({
            message: answer,
            messageFormat: "markdown",
            matches: [],
          }));
        }
        
        // --- Fallback: normal LLM prompt ---
        // Build context for LLM
        const context = matches.map((m, i) => {
          const title = m.metadata?.title || "";
          const url = m.metadata?.url || m.metadata?.slug || "";
          const description = m.metadata?.description || m.metadata?.text || m.text || "";
          let link = "";
          if (url) {
            link = url.startsWith("http") ? url : (url.startsWith("/") ? url : `/${url}`);
          }
          // Make doc link prominent
          return `${i + 1}. ${title ? `**${title}**\n` : ""}${description}${link ? `\n\nDocumentation: ${link}` : ""}`;
        }).join("\n\n");
        // Create prompt for LLM
        const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).
\nIMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data.\n\n*Only provide code examples, implementation advice, or technical explanations if they are directly supported by the context below.  \nDo **not** generate code or technical advice based on prior knowledge or assumptions.  \nIf the context does not contain relevant code or instructions, respond by saying you don't know and offer to create a support case.*\n\n**CRITICAL**: If the context includes documentation links (marked as Documentation: url), you MUST include at least one relevant link in your response when answering questions about features, products, or how-to topics.\n\nUser's question: ${query}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
        // Call Workers AI LLM (Llama 2 Chat)
        const llmResponse = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt,
          max_tokens: 200,
          temperature: 0.3,
        });
        
        let message: string = "";
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
        // --- Post-processing: ensure doc link is present for feature/product queries ---
        // Only for queries that are not pricing, human, technical, frustrated, or support
        const isFeatureOrProductQuery = !isPricingQuery && !isHumanRequest && !isTechnicalQuery && !isFrustratedUser && !isSupportRequest;
        if (isFeatureOrProductQuery) {
          // Get the top match with a URL
          const top = matches.find(m => (m.metadata?.url || m.metadata?.slug));
          const topUrl = top ? (top.metadata?.url || top.metadata?.slug) : null;
          if (topUrl) {
            const topLink = topUrl.startsWith("http") ? topUrl : (topUrl.startsWith("/") ? topUrl : `/${topUrl}`);
            // Always replace any [Read more](...) link with the top match's link
            message = message.replace(/\[Read more\]\(\/[^)]+\)/g, `[Read more](${topLink})`);
            // If no [Read more](...) link exists, append it
            if (!/\[Read more\]\(/.test(message)) {
              message += `\n\n[Read more](${topLink})`;
            }
          }
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