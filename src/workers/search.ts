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
      const reqBody = await request.json();
      let query = reqBody.query;
      if (typeof query === "string") {
        query = query.trim();
      }
      const ai = new Ai(env.AI);
      const embedding = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });
      const queryVector = embedding.data[0];
      const matches = await env.VECTORIZE.query(queryVector, {
        topK: 3,
        returnValues: true,
        returnMetadata: "all",
      });
      return withCors(Response.json({ matches }));
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