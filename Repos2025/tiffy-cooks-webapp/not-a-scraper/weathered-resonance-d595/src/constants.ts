// Practice areas to rotate through for comprehensive coverage
export const PRACTICE_AREAS = [
  "family lawyer",
  "criminal defense lawyer",
  "immigration lawyer",
  "personal injury lawyer",
  "divorce lawyer",
  "business lawyer",
  "real estate lawyer",
  "employment lawyer",
  "bankruptcy lawyer",
  "estate planning lawyer",
  "tax lawyer",
  "medical malpractice lawyer",
  "workers compensation lawyer",
  "dui lawyer",
  "traffic lawyer",
  "patent lawyer",
  "intellectual property lawyer",
  "corporate lawyer",
  "contract lawyer",
  "litigation lawyer"
];

export const GOOGLE_SEARCH_ENGINE_ID = "22797213f16f94826";
export const DAILY_QUOTA_LIMIT = 100;
export const MAX_PAGES_PER_QUERY = 10; // Google CSE max is 100 results (10 pages of 10)
export const QUERIES_PER_DAY = 100; // Use full daily quota to get ~10,000 results
export const CRAWL_STATE_KEY = "crawl_state";

// Quota split: 80% for crawling, 20% for user searches
export const CRAWL_QUOTA_PERCENTAGE = 0.8;
export const SEARCH_QUOTA_PERCENTAGE = 0.2;
export const CRAWL_QUOTA_PER_DAY = Math.floor(QUERIES_PER_DAY * CRAWL_QUOTA_PERCENTAGE);
export const SEARCH_QUOTA_PER_DAY = Math.floor(QUERIES_PER_DAY * SEARCH_QUOTA_PERCENTAGE);

// Global quota management
export const MAX_TOTAL_USER_QUOTA = SEARCH_QUOTA_PER_DAY; // 20 requests/day total for all users
export const DEFAULT_USER_QUOTA = 3; // Default quota per user (free tier)
export const MAX_USER_QUOTA = 50; // Maximum quota any single user can have
export const OWNER_QUOTA = 100; // Special quota for blawby owner
