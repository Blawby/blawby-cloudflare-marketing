export interface Env {
  GOOGLE_API_KEY: string;
  QUOTA_KV: KVNamespace;
  DB: D1Database;
  CRAWL_SECRET?: string;
}

export interface Lawyer {
  id?: number;
  name: string;
  firm?: string;
  url: string;
  snippet?: string;
  city?: string;
  state?: string;
  practice_area?: string;
  // Enhanced fields
  image_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  website_title?: string;
  // Professional information
  years_experience?: number;
  bar_admissions?: string;
  languages_spoken?: string;
  education?: string;
  // Business details
  office_hours?: string;
  service_areas?: string;
  firm_size?: string;
  founded_year?: number;
  website_domain?: string;
  // Credibility
  awards_recognition?: string;
  // Financial information
  fee_structure?: string;
  consultation_type?: string;
  payment_methods?: string;
  // Professional credentials
  professional_memberships?: string;
  certifications?: string;
  peer_ratings?: string;
  // Accessibility & contact
  emergency_contact?: string;
  virtual_consultation?: string;
  response_time?: string;
  // Practice details
  subspecialties?: string;
  client_types?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_image?: Array<{ src: string }>;
    organization?: Array<{ name: string; url?: string }>;
    localbusiness?: Array<{
      name?: string;
      telephone?: string;
      address?: string;
      email?: string;
      image?: string;
    }>;
    metatags?: Array<{
      'og:image'?: string;
      'og:description'?: string;
      'twitter:image'?: string;
      'description'?: string;
    }>;
  };
}

export interface CrawlState {
  stateIndex: number;
  cityIndex: number;
  practiceAreaIndex: number;
  pageIndex: number;
  lastUpdated: string;
}

export interface CrawlProgress {
  currentCity: string;
  currentState: string;
  currentPracticeArea: string;
  currentPage: number;
  totalStates: number;
  totalCities: number;
  totalPracticeAreas: number;
  totalPages: number;
  progressPercentage: number;
}

export interface UnifiedSearchResponse {
  source: "database" | "google" | "mixed";
  query: {
    city?: string;
    state?: string;
    practice_area?: string;
  };
  lawyers: Lawyer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QuotaStatus {
  crawlUsed: number;
  crawlLimit: number;
  searchUsed: number;
  searchLimit: number;
  totalUsed: number;
  totalLimit: number;
}

export interface SearchFilters {
  city?: string;
  state?: string;
  practiceArea?: string;
}

export interface ApiKey {
  id?: number;
  key_hash: string;
  user_id: string;
  name: string;
  quota_per_day: number;
  created_at?: string;
  last_used_at?: string;
  is_active: boolean;
}

export interface UserQuota {
  user_id: string;
  date: string; // YYYY-MM-DD format
  used: number;
  quota_limit: number;
}

export interface ApiKeyResponse {
  id: number;
  name: string;
  key: string; // Only returned on creation
  quota_per_day: number;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

export interface ApiKeyListResponse {
  keys: Omit<ApiKeyResponse, 'key'>[];
  total: number;
}
