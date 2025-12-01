import { Env, QuotaStatus } from './types';
import { CRAWL_QUOTA_PER_DAY, SEARCH_QUOTA_PER_DAY, QUERIES_PER_DAY } from './constants';

export async function getQuotaStatus(env: Env): Promise<QuotaStatus> {
  const today = new Date().toISOString().split('T')[0];
  const apiCallsKey = `api_calls:${today}`;

  const totalUsed = parseInt(await env.QUOTA_KV.get(apiCallsKey) || "0");

  return {
    crawlUsed: totalUsed, // All calls are tracked together now
    crawlLimit: 100, // Free tier limit
    searchUsed: 0, // Not separately tracked
    searchLimit: 0, // Not separately tracked
    totalUsed,
    totalLimit: 100 // Google API free tier limit
  };
}

export async function checkQuota(env: Env, type: "crawl" | "search"): Promise<boolean> {
  const quotaStatus = await getQuotaStatus(env);

  if (type === "crawl") {
    return quotaStatus.crawlUsed < quotaStatus.crawlLimit;
  } else {
    return quotaStatus.searchUsed < quotaStatus.searchLimit;
  }
}

export async function incrementQuota(env: Env, type: "crawl" | "search"): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `${type}_quota:${today}`;

  const current = parseInt(await env.QUOTA_KV.get(quotaKey) || "0");
  await env.QUOTA_KV.put(quotaKey, (current + 1).toString(), { expirationTtl: 86400 });
}
