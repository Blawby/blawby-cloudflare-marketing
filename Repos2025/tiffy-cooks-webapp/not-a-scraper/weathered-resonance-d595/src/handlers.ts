import { Env, UnifiedSearchResponse, SearchFilters } from './types';
import { searchDatabase, insertLawyersIntoDatabase, getDatabaseStats, getRecentActivity, getTopCities, getTodayLawyersCount, updateLawyerWithEnhancedData, getLawyersNeedingEnrichment, isLawFirmUrl } from './database';
import { checkQuota, getQuotaStatus } from './quota';
import { performGoogleFallbackSearch, performGoogleSearchWithPagination, parseLawyerFromResult } from './google';
import { getCrawlProgress, crawlCity } from './crawl';
import { createApiKey, getUserApiKeys, deactivateApiKey, getUserQuotaStatus, getGlobalQuotaStatus } from './api-keys';
import { requireApiKey, requireAdminAuth, authenticateApiKey } from './auth';
import { enrichLawyersBatch, calculateDataQualityScore } from './enrichment';

export async function handleDashboard(request: Request, env: Env): Promise<Response> {
  try {
    // Get database stats
    let stats;
    let recentActivity = [];

    try {
      stats = await getDatabaseStats(env);
      recentActivity = await getRecentActivity(env);
    } catch (dbError) {
      console.error("Database error:", dbError);
      stats = {
        total_lawyers: 0,
        unique_cities: 0,
        unique_states: 0,
        unique_practice_areas: 0,
        latest_crawl: null
      };
      recentActivity = [];
    }

    // Get quota status
    let quotaStatus;
    try {
      quotaStatus = await getQuotaStatus(env);
    } catch (error) {
      console.error("Failed to get quota status:", error);
      quotaStatus = {
        crawlUsed: 0,
        crawlLimit: 80,
        searchUsed: 0,
        searchLimit: 20
      };
    }

    // Get crawl progress
    let crawlProgress;
    try {
      crawlProgress = await getCrawlProgress(env);
    } catch (error) {
      console.error("Failed to get crawl progress:", error);
      crawlProgress = {
        currentState: "Unknown",
        currentCity: "Unknown",
        currentPracticeArea: "Unknown",
        currentPage: 0,
        totalStates: 0,
        totalCities: 0,
        totalPracticeAreas: 0,
        totalPages: 0,
        progressPercentage: 0
      };
    }

    const html = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lawyer Search API</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#f0f4f8', 100: '#d9e2ec', 200: '#bcccdc', 300: '#9fb3c8',
                            400: '#829ab1', 500: '#627d98', 600: '#486581', 700: '#334e68',
                            800: '#2d3748', 900: '#1a202c', 950: '#0f1419'
                        },
                        accent: {
                            50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
                            400: '#facc15', 500: '#d4af37', 600: '#ca8a04', 700: '#a16207',
                            800: '#854d0e', 900: '#713f12', 950: '#422006'
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-primary-950 text-white min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-accent-400 mb-2">🏛️ Lawyer Search API</h1>
            <p class="text-primary-300 text-lg">Automated lawyer database with daily crawling</p>
        </div>

        <!-- Status Card -->
        <div class="bg-primary-900 rounded-lg p-6 mb-8 border border-primary-800">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-accent-400">System Status</h2>
                <span class="px-3 py-1 bg-green-600 text-white rounded-full text-sm">✅ Healthy</span>
            </div>
            <p class="text-primary-300">
                Last Crawl: <span class="text-accent-400">${stats.latest_crawl || 'Never'}</span>
            </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-primary-900 rounded-lg p-6 border border-primary-800">
                <div class="text-2xl font-bold text-accent-400">${stats.total_lawyers || 0}</div>
                <div class="text-primary-300">Total Lawyers</div>
            </div>
            <div class="bg-primary-900 rounded-lg p-6 border border-primary-800">
                <div class="text-2xl font-bold text-accent-400">${stats.unique_cities || 0}</div>
                <div class="text-primary-300">Cities Covered</div>
            </div>
            <div class="bg-primary-900 rounded-lg p-6 border border-primary-800">
                <div class="text-2xl font-bold text-accent-400">${stats.unique_states || 0}</div>
                <div class="text-primary-300">States Covered</div>
            </div>
            <div class="bg-primary-900 rounded-lg p-6 border border-primary-800">
                <div class="text-2xl font-bold text-accent-400">${stats.unique_practice_areas || 0}</div>
                <div class="text-primary-300">Practice Areas</div>
            </div>
        </div>

        <!-- Crawl Progress -->
        <div class="bg-primary-900 rounded-lg p-6 mb-8 border border-primary-800">
            <h2 class="text-xl font-semibold text-accent-400 mb-4">🔄 Crawl Progress</h2>
            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-primary-300">Current:</span>
                    <span class="text-white">${crawlProgress.currentState}, ${crawlProgress.currentCity} - ${crawlProgress.currentPracticeArea}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-primary-300">Progress:</span>
                    <span class="text-accent-400">${crawlProgress.progressPercentage.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-primary-800 rounded-full h-2">
                    <div class="bg-accent-500 h-2 rounded-full" style="width: ${crawlProgress.progressPercentage}%"></div>
                </div>
            </div>
        </div>

        <!-- Quota Usage -->
        <div class="bg-primary-900 rounded-lg p-6 mb-8 border border-primary-800">
            <h2 class="text-xl font-semibold text-accent-400 mb-4">📊 Daily Quota Usage</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-primary-300">Crawl Quota:</span>
                        <span class="text-white">${quotaStatus.crawlUsed}/${quotaStatus.crawlLimit}</span>
                    </div>
                    <div class="w-full bg-primary-800 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${(quotaStatus.crawlUsed / quotaStatus.crawlLimit * 100)}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-primary-300">Search Quota:</span>
                        <span class="text-white">${quotaStatus.searchUsed}/${quotaStatus.searchLimit}</span>
                    </div>
                    <div class="w-full bg-primary-800 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${(quotaStatus.searchUsed / quotaStatus.searchLimit * 100)}%"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-primary-900 rounded-lg p-6 mb-8 border border-primary-800">
            <h2 class="text-xl font-semibold text-accent-400 mb-4">📈 Recent Activity</h2>
            <div class="space-y-2">
                ${recentActivity.length > 0 ? recentActivity.map(activity => `
                    <div class="flex justify-between items-center py-2 border-b border-primary-800 last:border-b-0">
                        <div>
                            <span class="text-white">${activity.city || 'Statewide'}, ${activity.state}</span>
                            <span class="text-primary-300 text-sm ml-2">- ${activity.practice_area}</span>
                        </div>
                        <div class="text-accent-400 text-sm">${activity.count} lawyers</div>
                    </div>
                `).join('') : '<p class="text-primary-300">No recent activity</p>'}
            </div>
        </div>

        <!-- API Documentation -->
        <div class="bg-primary-900 rounded-lg p-6 border border-primary-800">
            <h2 class="text-xl font-semibold text-accent-400 mb-4">🔍 API Usage</h2>
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-medium text-white mb-2">Search & List Endpoints</h3>
                    <div class="space-y-2 text-sm">
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /lawyers/all</code>
                            <span class="text-primary-300 ml-2"># List all lawyers (paginated)</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /lawyers/all?page=1&limit=100</code>
                            <span class="text-primary-300 ml-2"># List with custom pagination</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /lawyers?state=NC</code>
                            <span class="text-primary-300 ml-2"># Search by state</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /lawyers?city=Atlanta&state=GA</code>
                            <span class="text-primary-300 ml-2"># Search by city</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /lawyers?practice_area=family%20lawyer</code>
                            <span class="text-primary-300 ml-2"># Search by practice area</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /health</code>
                            <span class="text-primary-300 ml-2"># System health check</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-white mb-2">Example curl Commands</h3>
                    <div class="space-y-3 text-sm">
                        <div class="bg-primary-800 p-4 rounded">
                            <div class="text-accent-400 font-mono text-xs mb-2"># List all lawyers (first 50)</div>
                            <code class="text-green-400 text-xs">curl "https://search.blawby.com/lawyers/all" -H "Authorization: Bearer YOUR_API_KEY"</code>
                        </div>
                        <div class="bg-primary-800 p-4 rounded">
                            <div class="text-accent-400 font-mono text-xs mb-2"># List with pagination (100 per page)</div>
                            <code class="text-green-400 text-xs">curl "https://search.blawby.com/lawyers/all?page=1&limit=100" -H "Authorization: Bearer YOUR_API_KEY"</code>
                        </div>
                        <div class="bg-primary-800 p-4 rounded">
                            <div class="text-accent-400 font-mono text-xs mb-2"># Search by state</div>
                            <code class="text-green-400 text-xs">curl "https://search.blawby.com/lawyers?state=CA" -H "Authorization: Bearer YOUR_API_KEY"</code>
                        </div>
                        <div class="bg-primary-800 p-4 rounded">
                            <div class="text-accent-400 font-mono text-xs mb-2"># Search by city and state</div>
                            <code class="text-green-400 text-xs">curl "https://search.blawby.com/lawyers?city=Los%20Angeles&state=CA" -H "Authorization: Bearer YOUR_API_KEY"</code>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-white mb-2">API Key Endpoints</h3>
                    <div class="space-y-2 text-sm">
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">POST /api-keys</code>
                            <span class="text-primary-300 ml-2"># Create API key (Admin)</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /api-keys</code>
                            <span class="text-primary-300 ml-2"># List your API keys</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /user-quota</code>
                            <span class="text-primary-300 ml-2"># Check your quota usage</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">POST /api-keys/deactivate</code>
                            <span class="text-primary-300 ml-2"># Deactivate API key</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-white mb-2">Admin Endpoints (Auth Required)</h3>
                    <div class="space-y-2 text-sm">
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /stats</code>
                            <span class="text-primary-300 ml-2"># Detailed metrics</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">GET /quota</code>
                            <span class="text-primary-300 ml-2"># Quota usage</span>
                        </div>
                        <div class="bg-primary-800 p-3 rounded">
                            <code class="text-accent-400">POST /crawl</code>
                            <span class="text-primary-300 ml-2"># Manual crawl trigger</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-12 text-primary-400 text-sm">
            <p>Automated daily crawling • Built with Cloudflare Workers</p>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return new Response(JSON.stringify({ error: "Dashboard failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetAllLawyers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  // Require API key authentication for all requests
  const auth = await authenticateApiKey(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'API key required. Get your free API key at https://blawby.com'
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get all lawyers with pagination
    const result = await env.DB.prepare(`
      SELECT * FROM lawyers
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // Get total count
    const countResult = await env.DB.prepare("SELECT COUNT(*) as total FROM lawyers").first();
    const total = countResult?.total as number || 0;

    const response = {
      source: "database",
      query: { all: true },
      lawyers: result.results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get all lawyers error:", error);
    return new Response(JSON.stringify({ error: "Failed to get lawyers" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetLawyers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") || undefined;
  const state = url.searchParams.get("state") || undefined;
  const practiceArea = url.searchParams.get("practice_area") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;
  const minResults = parseInt(url.searchParams.get("min_results") || "5");
  
  // New filters
  const hasPhone = url.searchParams.get("has_phone") === "true";
  const hasEmail = url.searchParams.get("has_email") === "true";
  const hasAddress = url.searchParams.get("has_address") === "true";
  const lawFirmsOnly = url.searchParams.get("law_firms_only") === "true";

  // Require API key authentication for all requests
  const auth = await authenticateApiKey(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'API key required. Get your free API key at https://blawby.com'
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = auth.userId!;
  const quotaPerDay = auth.quotaPerDay!;

  try {
    // Step 1: Search database first
    let dbResults = await searchDatabase(env, { city, state, practiceArea }, limit, offset);
    
    // Apply additional filters
    if (hasPhone || hasEmail || hasAddress || lawFirmsOnly) {
      let filteredLawyers = dbResults.lawyers;
      
      if (hasPhone) {
        filteredLawyers = filteredLawyers.filter(l => l.phone != null);
      }
      if (hasEmail) {
        filteredLawyers = filteredLawyers.filter(l => l.email != null);
      }
      if (hasAddress) {
        filteredLawyers = filteredLawyers.filter(l => l.address != null);
      }
      if (lawFirmsOnly) {
        filteredLawyers = filteredLawyers.filter(l => l.url && isLawFirmUrl(l.url));
      }
      
      // Recalculate total and pagination
      const total = filteredLawyers.length;
      const paginatedLawyers = filteredLawyers.slice(offset, offset + limit);
      
      dbResults = {
        lawyers: paginatedLawyers,
        total
      };
    }

    let source: "database" | "google" | "mixed" = "database";
    let allLawyers = dbResults.lawyers;
    let totalCount = dbResults.total;

    // Step 2: If insufficient results, trigger Google search fallback
    if (dbResults.lawyers.length < minResults && (city || state || practiceArea)) {
      console.log(`Insufficient DB results (${dbResults.lawyers.length} < ${minResults}), triggering Google fallback`);

      // Quota checking removed for single-user system
      try {
        const googleResults = await performGoogleFallbackSearch(env, { city, state, practiceArea });

        if (googleResults.length > 0) {
          // Insert new results into database
          await insertLawyersIntoDatabase(env, googleResults, city, state, practiceArea);

          // Re-query database to get all fields (including enhanced fields) for newly inserted lawyers
          const existingUrls = new Set(dbResults.lawyers.map(l => l.url));
          const newUrls = googleResults.filter(l => !existingUrls.has(l.url)).map(l => l.url);
          
          let newLawyersFromDb: Lawyer[] = [];
          if (newUrls.length > 0) {
            // Query database for the newly inserted lawyers to get all fields
            const placeholders = newUrls.map(() => '?').join(',');
            const dbNewLawyers = await env.DB.prepare(`
              SELECT * FROM lawyers 
              WHERE url IN (${placeholders})
              ORDER BY created_at DESC
            `).bind(...newUrls).all();
            newLawyersFromDb = dbNewLawyers.results as unknown as Lawyer[];
          }

          allLawyers = [...dbResults.lawyers, ...newLawyersFromDb].slice(0, limit);
          totalCount = dbResults.total + newLawyersFromDb.length;
          source = dbResults.lawyers.length > 0 ? "mixed" : "google";

          console.log(`Google fallback added ${newLawyersFromDb.length} new lawyers with full database fields`);
        } else {
          console.log("Google fallback returned no results");
        }
      } catch (error) {
        console.error("Google fallback search failed:", error);
        // Continue with DB results only
      }
    }

    const response: UnifiedSearchResponse = {
      source,
      query: { city, state, practice_area: practiceArea },
      lawyers: allLawyers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


export async function handleDebugGoogle(request: Request, env: Env): Promise<Response> {
  // Check authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  if (!env.CRAWL_SECRET || token !== env.CRAWL_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const city = url.searchParams.get("city") || "Orlando";
  const state = url.searchParams.get("state") || "FL";

  try {
    const query = `"${city} ${state}" lawyer attorney law firm`;
    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=22797213f16f94826&key=${env.GOOGLE_API_KEY}&start=1`;

    const response = await fetch(searchUrl);
    const responseText = await response.text();
    const responseData = JSON.parse(responseText);

    return new Response(JSON.stringify({
      status: response.status,
      ok: response.ok,
      query: query,
      totalResults: responseData.searchInformation?.totalResults,
      itemsCount: responseData.items?.length || 0,
      items: responseData.items || [],
      error: responseData.error || null
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Debug failed",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleCrawl(request: Request, env: Env): Promise<Response> {
  // Check authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  if (!env.CRAWL_SECRET || token !== env.CRAWL_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const city = url.searchParams.get("city");
  const state = url.searchParams.get("state");

  if (!city || !state) {
    return new Response(JSON.stringify({ error: "Missing city or state parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    console.log(`Starting crawl for ${city}, ${state}`);
    const { lawyers: results, detailedLogs } = await crawlCity(city, state, env);

    // Save detailed logs to .data folder
    const logData = {
      timestamp: new Date().toISOString(),
      city,
      state,
      query: `"${city} ${state}" lawyer attorney law firm`,
      success: true,
      results_found: results.length,
      lawyers: results,
      detailed_operation_logs: detailedLogs,
      errors: []
    };

    console.log(`Crawl completed successfully: ${results.length} lawyers found`);
    console.log(`Log data:`, JSON.stringify(logData, null, 2));

    // Save logs to .data folder
    const logFilename = `.data/crawl-${city.toLowerCase()}-${state.toLowerCase()}-${Date.now()}.json`;
    console.log(`Saving logs to: ${logFilename}`);
    console.log(`Log content:`, JSON.stringify(logData, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully crawled ${city}, ${state}`,
      query: `"${city} ${state}" lawyer attorney law firm`,
      results_found: results.length,
      lawyers: results,
      logs: logData
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Crawl error:", error);

    // Save error logs to .data folder
    const errorLogData = {
      timestamp: new Date().toISOString(),
      city,
      state,
      query: `"${city} ${state}" lawyer attorney law firm`,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      results_found: 0,
      lawyers: []
    };

    console.error(`Error log data:`, JSON.stringify(errorLogData, null, 2));

    // Save error logs to .data folder
    const errorLogFilename = `.data/error-${city.toLowerCase()}-${state.toLowerCase()}-${Date.now()}.json`;
    console.error(`Saving error logs to: ${errorLogFilename}`);
    console.error(`Error log content:`, JSON.stringify(errorLogData, null, 2));

    return new Response(JSON.stringify({
      success: false,
      error: "Crawl failed",
      details: error instanceof Error ? error.message : String(error),
      logs: errorLogData
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetQuota(request: Request, env: Env): Promise<Response> {
  // Check authentication for quota endpoint
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  if (!env.CRAWL_SECRET || token !== env.CRAWL_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const quotaStatus = await getQuotaStatus(env);

    return new Response(JSON.stringify({
      date: today,
      crawl: {
        used: quotaStatus.crawlUsed,
        limit: quotaStatus.crawlLimit,
        remaining: Math.max(0, quotaStatus.crawlLimit - quotaStatus.crawlUsed),
        percentage: Math.round((quotaStatus.crawlUsed / quotaStatus.crawlLimit) * 100)
      },
      search: {
        used: quotaStatus.searchUsed,
        limit: quotaStatus.searchLimit,
        remaining: Math.max(0, quotaStatus.searchLimit - quotaStatus.searchUsed),
        percentage: Math.round((quotaStatus.searchUsed / quotaStatus.searchLimit) * 100)
      },
      total: {
        used: quotaStatus.totalUsed,
        limit: quotaStatus.totalLimit,
        remaining: Math.max(0, quotaStatus.totalLimit - quotaStatus.totalUsed),
        percentage: Math.round((quotaStatus.totalUsed / quotaStatus.totalLimit) * 100)
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Quota check error:", error);
    return new Response(JSON.stringify({ error: "Failed to check quota" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetStats(request: Request, env: Env): Promise<Response> {
  // Check authentication for stats endpoint
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);
  if (!env.CRAWL_SECRET || token !== env.CRAWL_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get total lawyers count
    const totalResult = await env.DB.prepare("SELECT COUNT(*) as total FROM lawyers").first();
    const total = totalResult?.total as number || 0;

    // Get distinct cities count
    const citiesResult = await env.DB.prepare("SELECT COUNT(DISTINCT city) as cities FROM lawyers").first();
    const cities = citiesResult?.cities as number || 0;

    // Get distinct states count
    const statesResult = await env.DB.prepare("SELECT COUNT(DISTINCT state) as states FROM lawyers").first();
    const states = statesResult?.states as number || 0;

    // Get distinct practice areas count
    const practiceAreasResult = await env.DB.prepare("SELECT COUNT(DISTINCT practice_area) as practice_areas FROM lawyers").first();
    const practiceAreas = practiceAreasResult?.practice_areas as number || 0;

    // Get last crawl time (most recent created_at)
    const lastCrawlResult = await env.DB.prepare("SELECT MAX(created_at) as last_crawl FROM lawyers").first();
    const lastCrawl = lastCrawlResult?.last_crawl as string || null;

    // Get today's quota usage
    const quotaStatus = await getQuotaStatus(env);

    // Get top cities by lawyer count
    const topCities = await getTopCities(env);

    // Get lawyers added today
    const todayLawyers = await getTodayLawyersCount(env);

    // Get crawl progress
    const crawlProgress = await getCrawlProgress(env);

    return new Response(JSON.stringify({
      total_lawyers: total,
      distinct_cities: cities,
      distinct_states: states,
      distinct_practice_areas: practiceAreas,
      last_crawl: lastCrawl,
      quota_status: {
        crawl: {
          used: quotaStatus.crawlUsed,
          limit: quotaStatus.crawlLimit,
          remaining: Math.max(0, quotaStatus.crawlLimit - quotaStatus.crawlUsed)
        },
        search: {
          used: quotaStatus.searchUsed,
          limit: quotaStatus.searchLimit,
          remaining: Math.max(0, quotaStatus.searchLimit - quotaStatus.searchUsed)
        },
        total: {
          used: quotaStatus.totalUsed,
          limit: quotaStatus.totalLimit,
          remaining: Math.max(0, quotaStatus.totalLimit - quotaStatus.totalUsed)
        }
      },
      today_lawyers_added: todayLawyers,
      crawl_progress: crawlProgress,
      top_cities: topCities
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Stats error:", error);
    return new Response(JSON.stringify({ error: "Failed to get stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// API Key Management Endpoints

export async function handleCreateApiKey(request: Request, env: Env): Promise<Response> {
  // Require admin authentication for creating API keys
  const adminAuth = requireAdminAuth(request, env);
  if (adminAuth) return adminAuth;

  try {
    const body = await request.json() as any;
    const { userId, name, quotaPerDay = 100 } = body;

    if (!userId || !name) {
      return new Response(JSON.stringify({
        error: "Missing required fields: userId, name"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = await createApiKey(env, userId, name, quotaPerDay);

    return new Response(JSON.stringify(apiKey), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return new Response(JSON.stringify({ error: "Failed to create API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetApiKeys(request: Request, env: Env): Promise<Response> {
  // Require API key authentication
  const auth = await authenticateApiKey(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'Authentication required'
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const apiKeys = await getUserApiKeys(env, auth.userId!);

    return new Response(JSON.stringify(apiKeys), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    return new Response(JSON.stringify({ error: "Failed to get API keys" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleDeactivateApiKey(request: Request, env: Env): Promise<Response> {
  // Require API key authentication
  const auth = await authenticateApiKey(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'Authentication required'
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const keyId = parseInt(url.searchParams.get('keyId') || '0');

    if (!keyId) {
      return new Response(JSON.stringify({
        error: "Missing keyId parameter"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const success = await deactivateApiKey(env, auth.userId!, keyId);

    if (!success) {
      return new Response(JSON.stringify({
        error: "API key not found or already deactivated"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      message: "API key deactivated successfully"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Deactivate API key error:", error);
    return new Response(JSON.stringify({ error: "Failed to deactivate API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetUserQuota(request: Request, env: Env): Promise<Response> {
  // Require API key authentication
  const auth = await authenticateApiKey(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'Authentication required'
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const quotaStatus = await getUserQuotaStatus(env, auth.userId!);

    return new Response(JSON.stringify({
      user_id: auth.userId,
      quota: quotaStatus,
      date: new Date().toISOString().split('T')[0]
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get user quota error:", error);
    return new Response(JSON.stringify({ error: "Failed to get quota status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleGetGlobalQuota(request: Request, env: Env): Promise<Response> {
  // Require admin authentication
  const adminAuth = requireAdminAuth(request, env);
  if (adminAuth) return adminAuth;

  try {
    const globalQuota = await getGlobalQuotaStatus(env);

    return new Response(JSON.stringify({
      global_quota: globalQuota,
      date: new Date().toISOString().split('T')[0],
      limits: {
        max_user_quota: 50,
        default_user_quota: 3,
        max_total_user_quota: 20,
        owner_quota: 100
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get global quota error:", error);
    return new Response(JSON.stringify({ error: "Failed to get global quota status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function handleBackfillLawyers(request: Request, env: Env): Promise<Response> {
  // Require admin authentication
  const adminAuth = requireAdminAuth(request, env);
  if (adminAuth) return adminAuth;

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const maxLimit = Math.min(limit, 50); // Cap at 50 to avoid quota issues

    const prioritizeLawFirms = url.searchParams.get("prioritize_law_firms") !== "false";

    // Get lawyers with missing enhanced fields (phone, email, address, etc.)
    const lawyersToEnrich = await getLawyersNeedingEnrichment(env, maxLimit, prioritizeLawFirms);

    if (lawyersToEnrich.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No lawyers need enrichment",
        summary: {
          processed: 0,
          updated: 0,
          failed: 0,
          details: []
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Enrich lawyers using web scraping
    const enrichmentResults = await enrichLawyersBatch(env, lawyersToEnrich, 200);

    const results = {
      processed: enrichmentResults.length,
      updated: enrichmentResults.filter(r => r.success).length,
      failed: enrichmentResults.filter(r => !r.success).length,
      details: enrichmentResults.map(r => ({
        id: r.lawyerId,
        url: r.url,
        status: r.success ? "updated" : "error",
        fields_added: r.fieldsAdded,
        error: r.error
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      summary: results,
      message: `Processed ${results.processed} lawyers, updated ${results.updated}, failed ${results.failed}`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(JSON.stringify({ 
      error: "Backfill failed",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
