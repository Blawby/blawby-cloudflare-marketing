import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: any;
  SUPPORT_DB: any;
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
        const reqBody = await request.json();
        let query = reqBody.query;
        if (typeof query === "string") {
          query = query.trim();
        }
        const ai = new Ai(env.AI);
        const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });
        const queryVector = embedding.data[0];
        // Increase topK for more candidates
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
        const reqBody = await request.json();
        let query = reqBody.query;
        if (typeof query === "string") {
          query = query.trim();
        }
        const ai = new Ai(env.AI);
        const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });
        const queryVector = embedding.data[0];
        const vectorizeResult = await env.VECTORIZE.query(queryVector, {
          topK: 3,
          returnValues: true,
          returnMetadata: "all",
        });
        let matches = vectorizeResult.matches || vectorizeResult;
        if (!Array.isArray(matches)) {
          console.error("Unexpected VECTORIZE.query response:", JSON.stringify(vectorizeResult));
          return withCors(new Response(JSON.stringify({ error: "VECTORIZE.query did not return an array of matches", details: vectorizeResult }), { status: 500 }));
        }
        // Build context for LLM
        const context = matches.map((m, i) =>
          `${i + 1}. ${m.metadata?.description || m.metadata?.text || m.text || ""}`
        ).join("\n");
        // Create prompt for LLM
        const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold).\n\nIMPORTANT: Only use the information provided in the context below. Do NOT use any prior knowledge or training data. If the answer is not in the context, say you don't know and offer to create a support case.\n\nUser's question: ${query}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
        // Call Workers AI LLM (Llama 2 Chat)
        const llmResponse = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt,
          max_tokens: 80,
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

    return withCors(Response.json({ text: "Not found" }, { status: 404 }));
  },
}; 