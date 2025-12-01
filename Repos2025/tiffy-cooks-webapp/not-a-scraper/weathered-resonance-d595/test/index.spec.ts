import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
  } from "cloudflare:test";
  import { describe, it, expect, beforeEach, vi } from "vitest";
  import worker from "../src/index";

  const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

  // --- Mock KV + DB before each test ---
  beforeEach(() => {
	// Mock KV
	(env as any).QUOTA_KV = {
	  get: vi.fn(async (key: string) => {
		if (key.includes("quota")) return "0";
		return null;
	  }),
	  put: vi.fn(async () => {}),
	  delete: vi.fn(async () => {}),
	  list: vi.fn(async () => ({ keys: [] })),
	};

		// Mock DB
		(env as any).DB = {
		  prepare: vi.fn((query: string) => {
			return {
			  bind: vi.fn().mockReturnThis(),
			  all: vi.fn(async () => {
				if (query.includes("SELECT * FROM lawyers")) {
				  // Return 6 results to exceed the min_results threshold (5)
				  return {
					results: [
					  { id: 1, name: "Test Lawyer 1", city: "Atlanta", state: "GA" },
					  { id: 2, name: "Test Lawyer 2", city: "Atlanta", state: "GA" },
					  { id: 3, name: "Test Lawyer 3", city: "Atlanta", state: "GA" },
					  { id: 4, name: "Test Lawyer 4", city: "Atlanta", state: "GA" },
					  { id: 5, name: "Test Lawyer 5", city: "Atlanta", state: "GA" },
					  { id: 6, name: "Test Lawyer 6", city: "Atlanta", state: "GA" }
					]
				  };
				}
				if (query.includes("GROUP BY city, state")) {
				  return { results: [{ city: "Atlanta", state: "GA", count: 6 }] };
				}
				return { results: [] };
			  }),
		  first: vi.fn(async () => {
			if (query.includes("COUNT(*) as total")) {
			  return { total: 6 };
			}
			if (query.includes("COUNT(DISTINCT city)")) {
			  return { cities: 1 };
			}
			if (query.includes("COUNT(DISTINCT state)")) {
			  return { states: 1 };
			}
			if (query.includes("COUNT(DISTINCT practice_area)")) {
			  return { practice_areas: 1 };
			}
			if (query.includes("MAX(created_at)")) {
			  return { last_crawl: new Date().toISOString() };
			}
			if (query.includes("WHERE created_at >=")) {
			  return { count: 1 };
			}
			return null;
		  }),
		  run: vi.fn(async () => ({})),
		};
	  }),
	} as any;

	// Mock secrets
	(env as any).CRAWL_SECRET = "test-secret";
	(env as any).GOOGLE_API_KEY = "fake-key";
  });

  describe("Lawyer Crawler Worker", () => {
	it("health endpoint returns healthy status", async () => {
	  const request = new IncomingRequest("https://example.com/health");
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(200);
	  const data = await response.json() as any;
	  expect(data.status).toBe("healthy");
	  expect(data.timestamp).toBeDefined();
	});

	it("lawyers endpoint returns results from DB", async () => {
	  const request = new IncomingRequest(
		"https://example.com/lawyers?city=Atlanta&state=GA&limit=2"
	  );
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(200);
	  const data = await response.json() as any;
	  expect(data.source).toBe("database");
	  expect(Array.isArray(data.lawyers)).toBe(true);
	  expect(data.lawyers[0].name).toBe("Test Lawyer 1");
	});

	it("lawyers endpoint with practice area filter works", async () => {
	  const request = new IncomingRequest(
		"https://example.com/lawyers?city=Atlanta&state=GA&practice_area=family+lawyer&limit=1"
	  );
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(200);
	  const data = await response.json() as any;
	  expect(data.query.practice_area).toBe("family lawyer");
	});

	it("quota endpoint requires authentication", async () => {
	  const request = new IncomingRequest("https://example.com/quota");
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(401);
	  const data = await response.json() as any;
	  expect(data.error).toBe("Unauthorized");
	});

	it("quota endpoint returns quota with valid auth", async () => {
	  const request = new IncomingRequest("https://example.com/quota", {
		headers: { Authorization: "Bearer test-secret" },
	  });
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(200);
	  const data = await response.json() as any;
	  expect(data.total).toBeDefined();
	  expect(data.crawl).toBeDefined();
	  expect(data.search).toBeDefined();
	});

	it("stats endpoint requires authentication", async () => {
	  const request = new IncomingRequest("https://example.com/stats");
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(401);
	  const data = await response.json() as any;
	  expect(data.error).toBe("Unauthorized");
	});

	it("stats endpoint returns stats with valid auth", async () => {
	  const request = new IncomingRequest("https://example.com/stats", {
		headers: { Authorization: "Bearer test-secret" },
	  });
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(200);
	  const data = await response.json() as any;
	  expect(data.total_lawyers).toBe(6);
	  expect(data.distinct_cities).toBe(1);
	  expect(data.distinct_states).toBe(1);
	  expect(data.distinct_practice_areas).toBe(1);
	});

	it("removed search endpoint returns 404", async () => {
	  const request = new IncomingRequest("https://example.com/search?q=lawyer");
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(404);
	  const data = await response.json() as any;
	  expect(data.error).toBe("Not found");
	});

	it("unknown endpoint returns 404", async () => {
	  const request = new IncomingRequest("https://example.com/unknown");
	  const ctx = createExecutionContext();
	  const response = await worker.fetch(request, env as any);
	  await waitOnExecutionContext(ctx);

	  expect(response.status).toBe(404);
	  const data = await response.json() as any;
	  expect(data.error).toBe("Not found");
	});
  });
