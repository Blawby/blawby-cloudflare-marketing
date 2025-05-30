import { Ai } from '@cloudflare/ai';

interface Env {
  AI: any;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
}

interface SearchRequest {
  query: string;
}

interface SearchError {
  error: string;
  details?: string;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: {
    title: string;
    url: string;
    section?: string;
    type?: string;
    content: string;
  };
}

const ALLOWED_ORIGIN = 'https://compass-ts.pages.dev'; // Update this with your actual domain
const VECTORIZE_INDEX = 'docs';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    try {
      const { query } = (await request.json()) as SearchRequest;

      if (!query || typeof query !== 'string') {
        throw new Error('Invalid query parameter');
      }

      // Generate embedding for the search query
      const ai = new Ai(env.AI);
      const embedding = await ai.run('@cf/baai/bge-small-en-v1.5', { text: query });
      const vector = JSON.parse(JSON.stringify(embedding.data[0])); // ensure plain number[]

      if (!vector || vector.length !== 384) {
        return new Response('Invalid embedding output', { status: 400 });
      }

      // Use the Vectorize v2 REST API
      const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${VECTORIZE_INDEX}/query`;
      const body = {
        vector,
        topK: 5,
        namespace: 'docs',
        return_metadata: true,
      };
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await apiRes.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      return new Response(JSON.stringify({
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }
  },
}; 