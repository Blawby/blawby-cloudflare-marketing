import { Env } from './types';
import { validateApiKey, checkUserQuota, incrementUserQuota } from './api-keys';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  quotaPerDay?: number;
  error?: string;
}

// Authenticate API key and check quota
export async function authenticateApiKey(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <your-api-key>'
    };
  }

  const apiKey = authHeader.substring(7);

  // Validate the API key
  const validation = await validateApiKey(env, apiKey);
  if (!validation.valid) {
    return {
      authenticated: false,
      error: 'Invalid API key'
    };
  }

  const { userId, quotaPerDay } = validation;

  // Quota checking removed for single-user system

  return {
    authenticated: true,
    userId,
    quotaPerDay
  };
}

// Middleware to require API key authentication
export async function requireApiKey(request: Request, env: Env): Promise<Response | null> {
  const auth = await authenticateApiKey(request, env);

  if (!auth.authenticated) {
    return new Response(JSON.stringify({
      error: auth.error || 'Authentication required',
      code: 'AUTH_REQUIRED'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null; // Authentication successful, continue processing
}

// Check if request has valid admin authentication (CRAWL_SECRET)
export function checkAdminAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return !!(env.CRAWL_SECRET && token === env.CRAWL_SECRET);
}

// Require admin authentication
export function requireAdminAuth(request: Request, env: Env): Response | null {
  if (!checkAdminAuth(request, env)) {
    return new Response(JSON.stringify({
      error: 'Admin authentication required',
      code: 'ADMIN_AUTH_REQUIRED'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null; // Authentication successful
}
