import { Env, Lawyer, SearchFilters } from './types';

export async function searchDatabase(
  env: Env,
  filters: SearchFilters,
  limit: number,
  offset: number
): Promise<{ lawyers: Lawyer[]; total: number }> {
  let query = "SELECT * FROM lawyers WHERE 1=1";
  const params: any[] = [];

  if (filters.city) {
    query += " AND city LIKE ?";
    params.push(`%${filters.city}%`);
  }

  if (filters.state) {
    query += " AND UPPER(state) = UPPER(?)";
    params.push(filters.state);
  }

  if (filters.practiceArea) {
    query += " AND practice_area LIKE ?";
    params.push(`%${filters.practiceArea}%`);
  }

  // Add relevance-based ordering
  query += " ORDER BY ";
  if (filters.city || filters.practiceArea) {
    // Prioritize exact matches, then partial matches
    query += "CASE WHEN city = ? THEN 1 WHEN city LIKE ? THEN 2 ELSE 3 END, ";
    query += "CASE WHEN practice_area = ? THEN 1 WHEN practice_area LIKE ? THEN 2 ELSE 3 END, ";
    params.push(filters.city || "", `%${filters.city}%`, filters.practiceArea || "", `%${filters.practiceArea}%`);
  }
  query += "created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await env.DB.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM lawyers WHERE 1=1";
  const countParams: any[] = [];

  if (filters.city) {
    countQuery += " AND city LIKE ?";
    countParams.push(`%${filters.city}%`);
  }

  if (filters.state) {
    countQuery += " AND UPPER(state) = UPPER(?)";
    countParams.push(filters.state);
  }

  if (filters.practiceArea) {
    countQuery += " AND practice_area LIKE ?";
    countParams.push(`%${filters.practiceArea}%`);
  }

  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
  const total = countResult?.total as number || 0;

  return {
    lawyers: result.results as unknown as Lawyer[],
    total
  };
}

export async function insertLawyersIntoDatabase(
  env: Env,
  lawyers: Lawyer[],
  city?: string,
  state?: string,
  practiceArea?: string
): Promise<void> {
  for (const lawyer of lawyers) {
    try {
      const normalizedUrl = normalizeUrl(lawyer.url);

      // Insert with all fields - if URL exists, it will be ignored (we can backfill later)
      await env.DB.prepare(`
        INSERT OR IGNORE INTO lawyers (
          name, firm, url, snippet, city, state, practice_area,
          image_url, phone, email, address, description, website_title,
          years_experience, bar_admissions, languages_spoken, education,
          office_hours, service_areas, firm_size, founded_year, website_domain,
          awards_recognition, fee_structure, consultation_type, payment_methods,
          professional_memberships, certifications, peer_ratings, emergency_contact,
          virtual_consultation, response_time, subspecialties, client_types
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        lawyer.name,
        lawyer.firm || null,
        normalizedUrl,
        lawyer.snippet || null,
        city || lawyer.city,
        state || lawyer.state,
        practiceArea || lawyer.practice_area || null,
        lawyer.image_url || null,
        lawyer.phone || null,
        lawyer.email || null,
        lawyer.address || null,
        lawyer.description || null,
        lawyer.website_title || null,
        lawyer.years_experience || null,
        lawyer.bar_admissions || null,
        lawyer.languages_spoken || null,
        lawyer.education || null,
        lawyer.office_hours || null,
        lawyer.service_areas || null,
        lawyer.firm_size || null,
        lawyer.founded_year || null,
        lawyer.website_domain || null,
        lawyer.awards_recognition || null,
        lawyer.fee_structure || null,
        lawyer.consultation_type || null,
        lawyer.payment_methods || null,
        lawyer.professional_memberships || null,
        lawyer.certifications || null,
        lawyer.peer_ratings || null,
        lawyer.emergency_contact || null,
        lawyer.virtual_consultation || null,
        lawyer.response_time || null,
        lawyer.subspecialties || null,
        lawyer.client_types || null
      ).run();
    } catch (error) {
      console.error("Error inserting lawyer:", error);
    }
  }
}

export async function getDatabaseStats(env: Env): Promise<{
  total_lawyers: number;
  unique_cities: number;
  unique_states: number;
  unique_practice_areas: number;
  latest_crawl: string | null;
}> {
  const statsResult = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_lawyers,
      COUNT(DISTINCT city) as unique_cities,
      COUNT(DISTINCT state) as unique_states,
      COUNT(DISTINCT practice_area) as unique_practice_areas,
      MAX(created_at) as latest_crawl
    FROM lawyers
  `).first();

  return statsResult as any;
}

export async function getRecentActivity(env: Env): Promise<any[]> {
  const recentResult = await env.DB.prepare(`
    SELECT city, state, practice_area, COUNT(*) as count, MAX(created_at) as last_crawl
    FROM lawyers
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY city, state, practice_area
    ORDER BY last_crawl DESC
    LIMIT 5
  `).all();

  return recentResult.results as any[];
}

export async function getTopCities(env: Env): Promise<any[]> {
  const topCitiesResult = await env.DB.prepare(`
    SELECT city, state, COUNT(*) as count
    FROM lawyers
    GROUP BY city, state
    ORDER BY count DESC
    LIMIT 10
  `).all();

  return topCitiesResult.results as any[];
}

export async function getTodayLawyersCount(env: Env): Promise<number> {
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
  const todayLawyersResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM lawyers
    WHERE created_at >= ?
  `).bind(todayStart).first();

  return todayLawyersResult?.count as number || 0;
}

export async function updateLawyerWithEnhancedData(
  env: Env,
  url: string,
  lawyer: Lawyer
): Promise<void> {
  const normalizedUrl = normalizeUrl(url);
  
  // Update only non-null fields
  const updates: string[] = [];
  const values: any[] = [];
  
  if (lawyer.name) { updates.push('name = ?'); values.push(lawyer.name); }
  if (lawyer.firm) { updates.push('firm = ?'); values.push(lawyer.firm); }
  if (lawyer.snippet) { updates.push('snippet = ?'); values.push(lawyer.snippet); }
  if (lawyer.city) { updates.push('city = ?'); values.push(lawyer.city); }
  if (lawyer.state) { updates.push('state = ?'); values.push(lawyer.state); }
  if (lawyer.practice_area) { updates.push('practice_area = ?'); values.push(lawyer.practice_area); }
  if (lawyer.image_url) { updates.push('image_url = ?'); values.push(lawyer.image_url); }
  if (lawyer.phone) { updates.push('phone = ?'); values.push(lawyer.phone); }
  if (lawyer.email) { updates.push('email = ?'); values.push(lawyer.email); }
  if (lawyer.address) { updates.push('address = ?'); values.push(lawyer.address); }
  if (lawyer.description) { updates.push('description = ?'); values.push(lawyer.description); }
  if (lawyer.website_title) { updates.push('website_title = ?'); values.push(lawyer.website_title); }
  if (lawyer.years_experience) { updates.push('years_experience = ?'); values.push(lawyer.years_experience); }
  if (lawyer.bar_admissions) { updates.push('bar_admissions = ?'); values.push(lawyer.bar_admissions); }
  if (lawyer.languages_spoken) { updates.push('languages_spoken = ?'); values.push(lawyer.languages_spoken); }
  if (lawyer.education) { updates.push('education = ?'); values.push(lawyer.education); }
  if (lawyer.office_hours) { updates.push('office_hours = ?'); values.push(lawyer.office_hours); }
  if (lawyer.service_areas) { updates.push('service_areas = ?'); values.push(lawyer.service_areas); }
  if (lawyer.firm_size) { updates.push('firm_size = ?'); values.push(lawyer.firm_size); }
  if (lawyer.founded_year) { updates.push('founded_year = ?'); values.push(lawyer.founded_year); }
  if (lawyer.website_domain) { updates.push('website_domain = ?'); values.push(lawyer.website_domain); }
  if (lawyer.awards_recognition) { updates.push('awards_recognition = ?'); values.push(lawyer.awards_recognition); }
  if (lawyer.fee_structure) { updates.push('fee_structure = ?'); values.push(lawyer.fee_structure); }
  if (lawyer.consultation_type) { updates.push('consultation_type = ?'); values.push(lawyer.consultation_type); }
  if (lawyer.payment_methods) { updates.push('payment_methods = ?'); values.push(lawyer.payment_methods); }
  if (lawyer.professional_memberships) { updates.push('professional_memberships = ?'); values.push(lawyer.professional_memberships); }
  if (lawyer.certifications) { updates.push('certifications = ?'); values.push(lawyer.certifications); }
  if (lawyer.peer_ratings) { updates.push('peer_ratings = ?'); values.push(lawyer.peer_ratings); }
  if (lawyer.emergency_contact) { updates.push('emergency_contact = ?'); values.push(lawyer.emergency_contact); }
  if (lawyer.virtual_consultation) { updates.push('virtual_consultation = ?'); values.push(lawyer.virtual_consultation); }
  if (lawyer.response_time) { updates.push('response_time = ?'); values.push(lawyer.response_time); }
  if (lawyer.subspecialties) { updates.push('subspecialties = ?'); values.push(lawyer.subspecialties); }
  if (lawyer.client_types) { updates.push('client_types = ?'); values.push(lawyer.client_types); }
  
  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(normalizedUrl);
    
    await env.DB.prepare(`
      UPDATE lawyers 
      SET ${updates.join(', ')}
      WHERE url = ?
    `).bind(...values).run();
  }
}

export function isLawFirmUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // Exclude court/government sites
  const excludedPatterns = [
    /\.court\./,
    /\.gov/,
    /court\.org/,
    /bar\s*association/i,
    /state\s*bar/i,
    /superior\s*court/i,
    /county\s*court/i,
    /district\s*court/i,
    /supreme\s*court/i,
    /legal\s*aid/i,
    /selfhelp\.courts/i,
    /calbar\.ca\.gov/i,
    /lacourt/i,
  ];

  for (const pattern of excludedPatterns) {
    if (pattern.test(urlLower)) {
      return false;
    }
  }

  return !urlLower.includes('.gov') && !urlLower.includes('.court');
}

export async function getLawyersNeedingEnrichment(
  env: Env,
  limit: number = 50,
  prioritizeLawFirms: boolean = true
): Promise<Lawyer[]> {
  let query = `
    SELECT * FROM lawyers 
    WHERE (phone IS NULL OR email IS NULL OR address IS NULL)
      AND url IS NOT NULL
      AND url != ''
  `;

  if (prioritizeLawFirms) {
    // Prioritize law firms by excluding court/gov sites
    query += ` AND url NOT LIKE '%.gov%' AND url NOT LIKE '%court%'`;
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;

  const result = await env.DB.prepare(query).bind(limit).all();
  return result.results as unknown as Lawyer[];
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query parameters and fragments
    urlObj.search = '';
    urlObj.hash = '';
    // Remove trailing slash
    return urlObj.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}
