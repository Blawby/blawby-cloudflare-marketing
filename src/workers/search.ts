import { Ai } from '@cloudflare/ai';

export interface Env {
  VECTORIZE: any;
  AI: any;
}

function randomVector(dim: number) {
  return Array.from({ length: dim }, () => Math.random());
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

// Use a fixed query vector for deterministic results
const fixedQueryVector = Array.from({ length: 384 }, (_, i) => (i % 2 === 0 ? 0.5 : 0.25));

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

    // Temporary endpoint to delete demo vectors
    if (path.startsWith("/delete-demo-vectors")) {
      const deleted = await env.VECTORIZE.deleteByIds(["1", "2", "3"]);
      return withCors(Response.json({ deleted }));
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

    if (path === "/") {
      // Use a fixed query vector for deterministic results
      const matches = await env.VECTORIZE.query(fixedQueryVector, {
        topK: 3,
        returnValues: true,
        returnMetadata: "all",
      });
      return withCors(Response.json({ matches }));
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

    return withCors(Response.json({ text: "nothing to do... yet" }, { status: 404 }));
  },
}; 