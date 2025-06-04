import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: any;
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
        const prompt = `\nYou are a helpful support assistant. Answer the user's question in a concise, direct way (2-3 sentences max), using Markdown for formatting (e.g., lists, links, bold). If you don't know, say so and offer to create a support case.\n\nUser's question: ${query}\n\nContext:\n${context}\n\nRespond in Markdown only. Do not use HTML tags.`;
        // Call Workers AI LLM (Llama 2 Chat)
        const llmResponse = await ai.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt,
          max_tokens: 80,
          temperature: 0.3,
        });
        return withCors(Response.json({
          message: llmResponse.response || "Sorry, I couldn't find an answer.",
          messageFormat: "markdown",
          matches,
        }));
      } catch (err) {
        console.error("/chat endpoint error:", err);
        return withCors(new Response(JSON.stringify({ error: "Worker exception in /chat", details: err instanceof Error ? err.message : err }), { status: 500 }));
      }
    }

    return withCors(Response.json({ text: "Not found" }, { status: 404 }));
  },
}; 