import { Env } from './types';
import {
  handleDashboard,
  handleGetLawyers,
  handleGetAllLawyers,
  handleCrawl,
  handleDebugGoogle,
  handleGetQuota,
  handleGetStats,
  handleCreateApiKey,
  handleGetApiKeys,
  handleDeactivateApiKey,
  handleGetUserQuota,
  handleGetGlobalQuota,
  handleBackfillLawyers
} from './handlers';
import { scheduledCrawl } from './crawl';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Handle different routes
      if (path === "/" && method === "GET") {
        return await handleDashboard(request, env);
      } else if (path === "/lawyers/all" && method === "GET") {
        return await handleGetAllLawyers(request, env);
      } else if (path === "/lawyers" && method === "GET") {
        return await handleGetLawyers(request, env);
      } else if (path === "/crawl" && method === "POST") {
        return await handleCrawl(request, env);
      } else if (path === "/debug-google" && method === "GET") {
        return await handleDebugGoogle(request, env);
      } else if (path === "/quota" && method === "GET") {
        return await handleGetQuota(request, env);
      } else if (path === "/stats" && method === "GET") {
        return await handleGetStats(request, env);
      } else if (path === "/health" && method === "GET") {
        return new Response(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }), {
          headers: { "Content-Type": "application/json" }
        });
      } else if (path === "/api-keys" && method === "POST") {
        return await handleCreateApiKey(request, env);
      } else if (path === "/api-keys" && method === "GET") {
        return await handleGetApiKeys(request, env);
      } else if (path === "/api-keys/deactivate" && method === "POST") {
        return await handleDeactivateApiKey(request, env);
      } else if (path === "/user-quota" && method === "GET") {
        return await handleGetUserQuota(request, env);
      } else if (path === "/global-quota" && method === "GET") {
        return await handleGetGlobalQuota(request, env);
      } else if (path === "/backfill" && method === "POST") {
        return await handleBackfillLawyers(request, env);
      } else {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    return scheduledCrawl(env);
  }
};
