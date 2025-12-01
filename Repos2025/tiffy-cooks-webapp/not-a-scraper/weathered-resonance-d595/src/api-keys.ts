import { Env, ApiKey, UserQuota, ApiKeyResponse, ApiKeyListResponse } from './types';
import { MAX_TOTAL_USER_QUOTA, DEFAULT_USER_QUOTA, MAX_USER_QUOTA, OWNER_QUOTA } from './constants';

// Generate a secure random API key
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Hash an API key for storage
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create a new API key with quota validation
export async function createApiKey(
  env: Env,
  userId: string,
  name: string,
  quotaPerDay: number = DEFAULT_USER_QUOTA
): Promise<ApiKeyResponse> {
  // Special handling for blawby owner
  const isOwner = userId === 'ai.blawby.com' || userId === 'blawby.com' || userId === 'owner';

  // Validate quota limits
  if (!isOwner && quotaPerDay > MAX_USER_QUOTA) {
    throw new Error(`User quota cannot exceed ${MAX_USER_QUOTA} requests per day`);
  }

  if (isOwner && quotaPerDay > OWNER_QUOTA) {
    throw new Error(`Owner quota cannot exceed ${OWNER_QUOTA} requests per day`);
  }

  // Check total quota allocation (owner gets special treatment)
  if (!isOwner) {
    const totalAllocated = await getTotalAllocatedQuota(env);
    if (totalAllocated + quotaPerDay > MAX_TOTAL_USER_QUOTA) {
      throw new Error(`Cannot allocate ${quotaPerDay} requests. Total user quota limit is ${MAX_TOTAL_USER_QUOTA} requests/day. Currently allocated: ${totalAllocated}`);
    }
  }

  const key = generateApiKey();
  const keyHash = await hashApiKey(key);

  const result = await env.DB.prepare(`
    INSERT INTO api_keys (key_hash, user_id, name, quota_per_day)
    VALUES (?, ?, ?, ?)
  `).bind(keyHash, userId, name, quotaPerDay).run();

  return {
    id: result.meta.last_row_id as number,
    name,
    key, // Only returned on creation
    quota_per_day: quotaPerDay,
    created_at: new Date().toISOString(),
    is_active: true
  };
}

// Get total allocated quota across all active API keys (excluding owner)
export async function getTotalAllocatedQuota(env: Env): Promise<number> {
  const result = await env.DB.prepare(`
    SELECT SUM(quota_per_day) as total
    FROM api_keys
    WHERE is_active = TRUE
    AND user_id NOT IN ('ai.blawby.com', 'blawby.com', 'owner')
  `).first();

  return result?.total as number || 0;
}

// Validate an API key and return user info
export async function validateApiKey(env: Env, key: string): Promise<{ valid: boolean; userId?: string; quotaPerDay?: number }> {
  const keyHash = await hashApiKey(key);

  const result = await env.DB.prepare(`
    SELECT user_id, quota_per_day, is_active
    FROM api_keys
    WHERE key_hash = ? AND is_active = TRUE
  `).bind(keyHash).first();

  if (!result) {
    return { valid: false };
  }

  // Update last used timestamp
  await env.DB.prepare(`
    UPDATE api_keys
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE key_hash = ?
  `).bind(keyHash).run();

  return {
    valid: true,
    userId: result.user_id as string,
    quotaPerDay: result.quota_per_day as number
  };
}

// Get user's API keys
export async function getUserApiKeys(env: Env, userId: string): Promise<ApiKeyListResponse> {
  const result = await env.DB.prepare(`
    SELECT id, name, quota_per_day, created_at, last_used_at, is_active
    FROM api_keys
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all();

  return {
    keys: result.results as Omit<ApiKeyResponse, 'key'>[],
    total: result.results.length
  };
}

// Deactivate an API key
export async function deactivateApiKey(env: Env, userId: string, keyId: number): Promise<boolean> {
  const result = await env.DB.prepare(`
    UPDATE api_keys
    SET is_active = FALSE
    WHERE id = ? AND user_id = ?
  `).bind(keyId, userId).run();

  return result.meta.changes > 0;
}

// Check user's daily quota
export async function checkUserQuota(env: Env, userId: string, quotaPerDay: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const result = await env.DB.prepare(`
    SELECT used, quota_limit
    FROM user_quota
    WHERE user_id = ? AND date = ?
  `).bind(userId, today).first();

  if (!result) {
    // No quota record for today, create one
    await env.DB.prepare(`
      INSERT INTO user_quota (user_id, date, used, quota_limit)
      VALUES (?, ?, 0, ?)
    `).bind(userId, today, quotaPerDay).run();
    return true;
  }

  // Use the quota_limit from the database record, not the parameter
  return (result.used as number) < (result.quota_limit as number);
}

// Increment user's daily quota usage
export async function incrementUserQuota(env: Env, userId: string, quotaPerDay: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // First, ensure we have a quota record for today with the correct limit
  await env.DB.prepare(`
    INSERT OR REPLACE INTO user_quota (user_id, date, used, quota_limit)
    VALUES (?, ?,
      COALESCE((SELECT used FROM user_quota WHERE user_id = ? AND date = ?), 0),
      ?
    )
  `).bind(userId, today, userId, today, quotaPerDay).run();

  // Now increment the usage
  await env.DB.prepare(`
    UPDATE user_quota
    SET used = used + 1
    WHERE user_id = ? AND date = ?
  `).bind(userId, today).run();
}

// Get user's quota status
export async function getUserQuotaStatus(env: Env, userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  // Get the user's quota limit from their active API key
  const apiKeyResult = await env.DB.prepare(`
    SELECT quota_per_day
    FROM api_keys
    WHERE user_id = ? AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId).first();

  if (!apiKeyResult) {
    return {
      used: 0,
      limit: 0,
      remaining: 0,
      percentage: 0
    };
  }

  const quotaLimit = apiKeyResult.quota_per_day as number;

  // Get today's usage
  const usageResult = await env.DB.prepare(`
    SELECT used
    FROM user_quota
    WHERE user_id = ? AND date = ?
  `).bind(userId, today).first();

  const used = usageResult?.used as number || 0;
  const remaining = Math.max(0, quotaLimit - used);
  const percentage = Math.round((used / quotaLimit) * 100);

  return { used, limit: quotaLimit, remaining, percentage };
}

// Get global quota status for admin
export async function getGlobalQuotaStatus(env: Env): Promise<{
  userQuota: {
    totalAllocated: number;
    maxTotalQuota: number;
    remainingQuota: number;
    activeUsers: number;
    quotaUtilization: number;
  };
  ownerQuota: {
    totalAllocated: number;
    maxTotalQuota: number;
    activeUsers: number;
  };
}> {
  // Regular user quota (excluding owner)
  const userTotalAllocated = await getTotalAllocatedQuota(env);
  const userRemainingQuota = Math.max(0, MAX_TOTAL_USER_QUOTA - userTotalAllocated);
  const userQuotaUtilization = Math.round((userTotalAllocated / MAX_TOTAL_USER_QUOTA) * 100);

  // Get count of active regular users
  const activeUsersResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM api_keys
    WHERE is_active = TRUE
    AND user_id NOT IN ('ai.blawby.com', 'blawby.com', 'owner')
  `).first();
  const activeUsers = activeUsersResult?.count as number || 0;

  // Owner quota
  const ownerQuotaResult = await env.DB.prepare(`
    SELECT SUM(quota_per_day) as total, COUNT(*) as count
    FROM api_keys
    WHERE is_active = TRUE
    AND user_id IN ('ai.blawby.com', 'blawby.com', 'owner')
  `).first();
  const ownerTotalAllocated = ownerQuotaResult?.total as number || 0;
  const ownerActiveUsers = ownerQuotaResult?.count as number || 0;

  return {
    userQuota: {
      totalAllocated: userTotalAllocated,
      maxTotalQuota: MAX_TOTAL_USER_QUOTA,
      remainingQuota: userRemainingQuota,
      activeUsers,
      quotaUtilization: userQuotaUtilization
    },
    ownerQuota: {
      totalAllocated: ownerTotalAllocated,
      maxTotalQuota: OWNER_QUOTA,
      activeUsers: ownerActiveUsers
    }
  };
}
