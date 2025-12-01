import { Env, CrawlState, CrawlProgress, Lawyer } from './types';
import { PRACTICE_AREAS, MAX_PAGES_PER_QUERY, CRAWL_STATE_KEY } from './constants';
import { checkQuota, getQuotaStatus } from './quota';
import { performGoogleSearchWithPagination, performGoogleSearch } from './google';
import { insertLawyersIntoDatabase, getLawyersNeedingEnrichment } from './database';
import { enrichLawyersBatch } from './enrichment';
import citiesJson from './cities-nested.json';

// Helper function to flatten the nested cities JSON into a simple list
function getCityList(citiesJson: any): { name: string; state: string }[] {
  const cityList: { name: string; state: string }[] = [];

  for (const [stateAbbr, cities] of Object.entries(citiesJson)) {
    for (const [cityName, cityData] of Object.entries(cities as any)) {
      cityList.push({
        name: cityName,
        state: stateAbbr
      });
    }
  }

  return cityList;
}

// Get the flattened city list
const CITY_LIST = getCityList(citiesJson);

// Filter out military states (APO, FPO, DPO) as they don't have real lawyers
const MILITARY_STATES = ['AE', 'AP', 'AA']; // Armed Forces Europe, Pacific, Americas
const STATE_LIST = Object.keys(citiesJson)
  .filter(state => !MILITARY_STATES.includes(state))
  .sort(); // Sort for deterministic order

// Helper function to get cities for a specific state
function getCitiesForState(stateAbbr: string): string[] {
  const stateCities = citiesJson[stateAbbr as keyof typeof citiesJson];
  if (!stateCities) return [];

  return Object.keys(stateCities).sort(); // Sort for deterministic order
}

export async function scheduledCrawl(env: Env): Promise<void> {
  console.log("Cron job triggered at:", new Date().toISOString());

  try {
    // Process multiple combinations per day within free Google API quota
    const maxCrawlsPerDay = 100; // Stay within free tier (100 calls/day)
    let crawlCount = 0;
    let totalLawyersFound = 0;

    while (crawlCount < maxCrawlsPerDay) {
      try {
        // Get current crawl state
        const crawlState = await getCrawlState(env);
        const stateAbbr = STATE_LIST[crawlState.stateIndex];

        // Skip military states (shouldn't happen with filtered STATE_LIST, but safety check)
        if (MILITARY_STATES.includes(stateAbbr)) {
          console.log(`Skipping military state: ${stateAbbr}`);
          await updateCrawlState(env, crawlState);
          crawlCount++;
          continue;
        }

        const citiesInState = getCitiesForState(stateAbbr);
        const cityName = citiesInState[crawlState.cityIndex];
        const practiceArea = PRACTICE_AREAS[crawlState.practiceAreaIndex];

        console.log(`Crawling: ${cityName}, ${stateAbbr} - ${practiceArea} (page ${crawlState.pageIndex + 1}) - Crawl ${crawlCount + 1}/${maxCrawlsPerDay}`);

        // Perform the crawl with pagination
        const results = await crawlCityWithPagination(cityName, stateAbbr, practiceArea, crawlState.pageIndex, env);

        console.log(`Successfully crawled ${cityName}, ${stateAbbr} - ${practiceArea}. Found ${results.length} lawyers.`);
        totalLawyersFound += results.length;

        // Update crawl state for next iteration
        await updateCrawlState(env, crawlState);
        crawlCount++;

        // Add a small delay between requests to be respectful to Google API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error during crawl ${crawlCount + 1}:`, error);

        // If we hit Google API rate limits, stop for today
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          console.log("Google API rate limit hit - stopping crawls for today");
          break;
        }

        // For other errors, continue with next crawl
        crawlCount++;
      }
    }

    console.log(`Daily crawl completed. Processed ${crawlCount} combinations, found ${totalLawyersFound} total lawyers.`);

    // After crawling, enrich some lawyers with missing data
    await scheduledEnrichment(env);

  } catch (error) {
    console.error("Cron job error:", error);
    console.log("Unexpected error during crawl - will retry tomorrow");
  }
}

export async function scheduledEnrichment(env: Env): Promise<void> {
  console.log("Starting scheduled enrichment at:", new Date().toISOString());

  try {
    // Enrich 100 lawyers per day (prioritizing law firms)
    // This will catch up in ~167 days (5.5 months) or reach 40% coverage in ~67 days (2 months)
    const lawyersToEnrich = await getLawyersNeedingEnrichment(env, 100, true);

    if (lawyersToEnrich.length === 0) {
      console.log("No lawyers need enrichment");
      return;
    }

    console.log(`Enriching ${lawyersToEnrich.length} lawyers...`);

    // Enrich with 200ms delay between requests
    const results = await enrichLawyersBatch(env, lawyersToEnrich, 200);

    const successCount = results.filter(r => r.success).length;
    const totalFieldsAdded = results.reduce((sum, r) => sum + r.fieldsAdded, 0);

    console.log(`Enrichment completed: ${successCount}/${results.length} successful, ${totalFieldsAdded} total fields added`);

  } catch (error) {
    console.error("Scheduled enrichment error:", error);
    // Don't throw - enrichment failures shouldn't break the cron job
  }
}

export async function getCrawlState(env: Env): Promise<CrawlState> {
  const stateData = await env.QUOTA_KV.get(CRAWL_STATE_KEY);

  if (stateData) {
    return JSON.parse(stateData);
  }

  // Initialize with first state, first city, first practice area, first page
  return {
    stateIndex: 0,
    cityIndex: 0,
    practiceAreaIndex: 0,
    pageIndex: 0,
    lastUpdated: new Date().toISOString()
  };
}

export async function updateCrawlState(env: Env, currentState: CrawlState): Promise<void> {
  let newState = { ...currentState };

  // Move to next page
  newState.pageIndex++;

  // If we've completed all pages for this practice area, move to next practice area
  if (newState.pageIndex >= MAX_PAGES_PER_QUERY) {
    newState.pageIndex = 0;
    newState.practiceAreaIndex++;

    // If we've completed all practice areas for this city, move to next city
    if (newState.practiceAreaIndex >= PRACTICE_AREAS.length) {
      newState.practiceAreaIndex = 0;
      newState.cityIndex++;

      // Get cities for current state to check if we've completed all cities in this state
      const currentStateAbbr = STATE_LIST[newState.stateIndex];
      const citiesInState = getCitiesForState(currentStateAbbr);

      // If we've completed all cities in this state, move to next state
      if (newState.cityIndex >= citiesInState.length) {
        newState.cityIndex = 0;
        newState.stateIndex++;

        // If we've completed all states, start over
        if (newState.stateIndex >= STATE_LIST.length) {
          newState.stateIndex = 0;
          console.log("Completed full cycle of all states, cities, and practice areas. Starting over.");
        }
      }
    }
  }

  newState.lastUpdated = new Date().toISOString();

  await env.QUOTA_KV.put(CRAWL_STATE_KEY, JSON.stringify(newState));
}

export async function getCrawlProgress(env: Env): Promise<CrawlProgress> {
  const crawlState = await getCrawlState(env);
  const stateAbbr = STATE_LIST[crawlState.stateIndex];
  const citiesInState = getCitiesForState(stateAbbr);
  const cityName = citiesInState[crawlState.cityIndex];
  const practiceArea = PRACTICE_AREAS[crawlState.practiceAreaIndex];

  // Calculate total combinations: sum of all cities across all states * practice areas * pages
  let totalCombinations = 0;
  for (let i = 0; i < STATE_LIST.length; i++) {
    const stateCities = getCitiesForState(STATE_LIST[i]);
    totalCombinations += stateCities.length * PRACTICE_AREAS.length * MAX_PAGES_PER_QUERY;
  }

  // Calculate current position
  let currentPosition = 0;

  // Add completed states
  for (let i = 0; i < crawlState.stateIndex; i++) {
    const stateCities = getCitiesForState(STATE_LIST[i]);
    currentPosition += stateCities.length * PRACTICE_AREAS.length * MAX_PAGES_PER_QUERY;
  }

  // Add completed cities in current state
  for (let i = 0; i < crawlState.cityIndex; i++) {
    currentPosition += PRACTICE_AREAS.length * MAX_PAGES_PER_QUERY;
  }

  // Add completed practice areas in current city
  currentPosition += crawlState.practiceAreaIndex * MAX_PAGES_PER_QUERY;

  // Add completed pages in current practice area
  currentPosition += crawlState.pageIndex;

  return {
    currentCity: cityName,
    currentState: stateAbbr,
    currentPracticeArea: practiceArea,
    currentPage: crawlState.pageIndex + 1,
    totalStates: STATE_LIST.length,
    totalCities: CITY_LIST.length,
    totalPracticeAreas: PRACTICE_AREAS.length,
    totalPages: MAX_PAGES_PER_QUERY,
    progressPercentage: Math.round((currentPosition / totalCombinations) * 100)
  };
}

export async function crawlCityWithPagination(
  city: string,
  state: string,
  practiceArea: string,
  pageIndex: number,
  env: Env
): Promise<Lawyer[]> {
  const query = `${practiceArea} ${city}`;
  const startIndex = pageIndex * 10 + 1; // Google CSE uses 1-based indexing

  console.log(`Searching: "${query}" starting at result ${startIndex}`);

  const searchResults = await performGoogleSearchWithPagination(query, startIndex, env);
  const lawyers: Lawyer[] = [];

  for (const result of searchResults) {
    const lawyer = parseLawyerFromResult(result, city, state);
    if (lawyer) {
      try {
        // Normalize URL for better deduplication
        const normalizedUrl = normalizeUrl(lawyer.url);

        // Insert or ignore duplicate URLs and firm+city combinations
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
          lawyer.city,
          lawyer.state,
          practiceArea,
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

        lawyers.push(lawyer);
      } catch (error) {
        console.error("Error inserting lawyer:", error);
      }
    }
  }

  return lawyers;
}

export async function crawlCity(city: string, state: string, env: Env): Promise<{lawyers: Lawyer[], detailedLogs: any[]}> {
  const query = `"${city} ${state}" lawyer attorney law firm`;
  const searchResults = await performGoogleSearch(query, env);

  const lawyers: Lawyer[] = [];
  const detailedLogs: any[] = [];

  for (const result of searchResults) {
    const lawyer = parseLawyerFromResult(result, city, state);
    if (lawyer) {
      // Prepare the bind values array for logging
      const bindValues = [
        lawyer.name,
        lawyer.firm || null,
        lawyer.url,
        lawyer.snippet || null,
        lawyer.city,
        lawyer.state,
        null, // practice_area not set in legacy function
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
      ];

      try {
        console.log(`Attempting to insert lawyer: ${lawyer.name} from ${lawyer.url}`);
        console.log(`Binding ${bindValues.length} values to database`);
        console.log(`Values:`, JSON.stringify(bindValues, null, 2));

        // Log the raw Google search result that was parsed
        const rawResultLog = {
          timestamp: new Date().toISOString(),
          operation: "raw_google_result",
          original_result: result,
          parsed_lawyer: lawyer,
          bind_values_count: bindValues.length
        };
        detailedLogs.push(rawResultLog);

        // Insert or ignore duplicate URLs
        const dbResult = await env.DB.prepare(`
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
        `).bind(...bindValues).run();

        console.log(`Database insert result:`, JSON.stringify(dbResult, null, 2));

        // Log successful database insertion
        const dbLogData = {
          timestamp: new Date().toISOString(),
          operation: "database_insert",
          lawyer_name: lawyer.name,
          lawyer_url: lawyer.url,
          bind_values_count: bindValues.length,
          bind_values: bindValues,
          result: dbResult,
          success: true
        };
        console.log(`DB operation log:`, JSON.stringify(dbLogData, null, 2));
        detailedLogs.push(dbLogData);

        lawyers.push(lawyer);
      } catch (error) {
        console.error("Error inserting lawyer:", error);

        // Log database error
        const dbErrorLogData = {
          timestamp: new Date().toISOString(),
          operation: "database_insert_error",
          lawyer_name: lawyer.name,
          lawyer_url: lawyer.url,
          bind_values_count: bindValues ? bindValues.length : 0,
          bind_values: bindValues || [],
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          success: false
        };
        console.error(`DB error log:`, JSON.stringify(dbErrorLogData, null, 2));
        detailedLogs.push(dbErrorLogData);
      }
    } else {
      // Log when lawyer parsing failed
      const parseErrorLog = {
        timestamp: new Date().toISOString(),
        operation: "lawyer_parse_failed",
        original_result: result,
        reason: "parseLawyerFromResult returned null"
      };
      detailedLogs.push(parseErrorLog);
    }
  }

  return { lawyers, detailedLogs };
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

function parseLawyerFromResult(result: any, city: string, state: string): Lawyer | null {
  try {
    const title = result.title;
    const snippet = result.snippet;
    const url = result.link;

    // Filter out directory/listing sites and irrelevant content
    if (isDirectoryOrIrrelevant(title, snippet, url)) {
      return null;
    }

    // Skip military postal codes (APO, FPO, DPO) as they don't have real lawyers
    if (isMilitaryPostalCode(city, state)) {
      return null;
    }

    let name = title;
    let firm = "";

    // Enhanced patterns for better name/firm separation
    const firmPatterns = [
      // "John Smith - Smith & Associates Law Firm"
      /^(.+?)\s*[-–]\s*(.+?)\s+(?:Law Firm|Attorneys?|Legal|Lawyers?|LLC|LLP|P\.?C\.?|P\.?A\.?)/i,
      // "Smith & Associates - John Smith Attorney"
      /^(.+?)\s*[-–]\s*(.+?)\s+(?:Attorney|Lawyer)/i,
      // "John Smith | Smith & Associates"
      /^(.+?)\s*\|\s*(.+)/i,
      // "Smith & Associates Law Firm"
      /^(.+?)\s+(?:Law Firm|Attorneys?|Legal|Lawyers?|LLC|LLP|P\.?C\.?|P\.?A\.?)/i,
      // "John Smith, Attorney at Law"
      /^(.+?),\s*(?:Attorney|Lawyer)\s+(?:at\s+)?Law/i,
      // "John Smith & Associates"
      /^(.+?)\s+&\s+(.+)/i,
      // "Smith Law Group"
      /^(.+?)\s+Law\s+(?:Group|Firm|Office)/i,
      // "Smith & Associates: John Smith"
      /^(.+?)\s*:\s*(.+)/i
    ];

    for (const pattern of firmPatterns) {
      const match = title.match(pattern);
      if (match) {
        if (match[2]) {
          // Pattern with two groups - first is name, second is firm
          name = match[1].trim();
          firm = match[2].trim();
        } else {
          // Pattern with one group - extract firm name
          const fullMatch = match[0];
          const firmName = match[1].trim();
          if (fullMatch.toLowerCase().includes('law firm') ||
              fullMatch.toLowerCase().includes('attorneys') ||
              fullMatch.toLowerCase().includes('legal')) {
            firm = firmName;
            name = title.replace(fullMatch, '').trim();
          }
        }
        break;
      }
    }

    // If no firm pattern found, try to extract from snippet
    if (!firm && snippet) {
      const snippetPatterns = [
        /(.+?)\s+(?:Law Firm|Attorneys?|Legal|Lawyers?|LLC|LLP)/i,
        /(?:Attorney|Lawyer)\s+(?:at\s+)?(.+?)\s+(?:Law|Legal)/i,
        /(.+?)\s+&\s+(.+?)\s+(?:Law|Legal)/i
      ];

      for (const pattern of snippetPatterns) {
        const match = snippet.match(pattern);
        if (match) {
          firm = match[1] ? match[1].trim() : (match[2] ? match[2].trim() : "");
          break;
        }
      }
    }

    // Clean up the name - remove common suffixes and improve formatting
    if (name) {
      name = name.replace(/\s*[-–]\s*$/, '').trim();
      name = name.replace(/\s*,\s*(?:Attorney|Lawyer).*$/i, '').trim();
      name = name.replace(/\s*:\s*.*$/i, '').trim(); // Remove everything after colon
      name = name.replace(/\s*-\s*.*$/i, '').trim(); // Remove everything after dash
    }

    // Ensure we have a valid name (not just firm name)
    if (!name || name.length < 2) {
      name = title;
    }

    // Use the provided city, or try to extract from title/snippet if missing
    let finalCity = city;
    if (!finalCity || finalCity.trim() === '') {
      finalCity = extractCityFromContent(title, snippet) || 'Unknown';
    }

    // Extract additional information from pagemap
    const additionalInfo = extractAdditionalInfo(result);

          return {
            name: name || title,
            firm: firm || undefined,
            url: result.link,
            snippet: snippet || undefined,
            city: finalCity,
            state,
            // Enhanced fields
            image_url: additionalInfo.image_url,
            phone: additionalInfo.phone,
            email: additionalInfo.email,
            address: additionalInfo.address,
            description: additionalInfo.description,
            website_title: title,
            // Professional information
            years_experience: additionalInfo.years_experience,
            bar_admissions: additionalInfo.bar_admissions,
            languages_spoken: additionalInfo.languages_spoken,
            education: additionalInfo.education,
            // Business details
            office_hours: additionalInfo.office_hours,
            service_areas: additionalInfo.service_areas,
            firm_size: additionalInfo.firm_size,
            founded_year: additionalInfo.founded_year,
            website_domain: additionalInfo.website_domain,
            // Credibility
            awards_recognition: additionalInfo.awards_recognition,
            // Financial information
            fee_structure: additionalInfo.fee_structure,
            consultation_type: additionalInfo.consultation_type,
            payment_methods: additionalInfo.payment_methods,
            // Professional credentials
            professional_memberships: additionalInfo.professional_memberships,
            certifications: additionalInfo.certifications,
            peer_ratings: additionalInfo.peer_ratings,
            // Accessibility & contact
            emergency_contact: additionalInfo.emergency_contact,
            virtual_consultation: additionalInfo.virtual_consultation,
            response_time: additionalInfo.response_time,
            // Practice details
            subspecialties: additionalInfo.subspecialties,
            client_types: additionalInfo.client_types
          };
  } catch (error) {
    console.error("Error parsing lawyer from result:", error);
    return null;
  }
}

// Helper function to filter out directory/listing sites
function isDirectoryOrIrrelevant(title: string, snippet: string, url: string): boolean {
  const titleLower = title.toLowerCase();
  const snippetLower = snippet?.toLowerCase() || '';
  const urlLower = url.toLowerCase();

  // Directory/listing indicators
  const directoryKeywords = [
    'directory', 'list', 'listing', 'find', 'search', 'top picks', 'best of',
    'lawyer legion', 'avvo', 'justia', 'martindale', 'super lawyers',
    'about apo', 'alpha phi omega', 'engineering fraternity'
  ];

  // Check title and snippet for directory indicators
  for (const keyword of directoryKeywords) {
    if (titleLower.includes(keyword) || snippetLower.includes(keyword)) {
      return true;
    }
  }

  // Check URL for directory sites
  const directoryDomains = [
    'lawyerlegion.com', 'avvo.com', 'justia.com', 'martindale.com',
    'superlawyers.com', 'findlaw.com', 'lawyers.com'
  ];

  for (const domain of directoryDomains) {
    if (urlLower.includes(domain)) {
      return true;
    }
  }

  return false;
}

// Helper function to identify military postal codes
function isMilitaryPostalCode(city: string, state: string): boolean {
  const militaryStates = ['AE', 'AP', 'AA']; // Armed Forces Europe, Pacific, Americas
  const militaryCities = ['apo', 'fpo', 'dpo'];

  return militaryStates.includes(state.toUpperCase()) ||
         militaryCities.includes(city.toLowerCase());
}

// Helper function to extract city from content when missing
function extractCityFromContent(title: string, snippet: string): string | null {
  const content = `${title} ${snippet || ''}`.toLowerCase();

  // Common city patterns in legal content
  const cityPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+law\s+firm/gi
  ];

  for (const pattern of cityPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Extract the city name from the match
      const cityMatch = matches[0].match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (cityMatch && cityMatch[1]) {
        return cityMatch[1];
      }
    }
  }

  return null;
}

// Helper function to extract additional information from pagemap
function extractAdditionalInfo(result: any): {
  image_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  years_experience?: number;
  bar_admissions?: string;
  languages_spoken?: string;
  education?: string;
  office_hours?: string;
  service_areas?: string;
  firm_size?: string;
  founded_year?: number;
  website_domain?: string;
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
} {
  const pagemap = result.pagemap;
  if (!pagemap) {
    return {};
  }

  const info: any = {};

  // Extract image URL
  if (pagemap.cse_image && pagemap.cse_image.length > 0) {
    info.image_url = pagemap.cse_image[0].src;
  } else if (pagemap.metatags && pagemap.metatags.length > 0) {
    const meta = pagemap.metatags[0];
    info.image_url = meta['og:image'] || meta['twitter:image'];
  }

  // Extract contact information from localbusiness
  if (pagemap.localbusiness && pagemap.localbusiness.length > 0) {
    const business = pagemap.localbusiness[0];
    info.phone = business.telephone;
    info.email = business.email;
    info.address = business.address;
    if (business.image && !info.image_url) {
      info.image_url = business.image;
    }
  }

  // Extract description
  if (pagemap.metatags && pagemap.metatags.length > 0) {
    const meta = pagemap.metatags[0];
    info.description = meta['og:description'] || meta['description'];
  }

  // Extract phone and email from snippet if not found in pagemap
  if (!info.phone) {
    const phoneMatch = result.snippet?.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      info.phone = phoneMatch[1];
    }
  }

  if (!info.email) {
    const emailMatch = result.snippet?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      info.email = emailMatch[1];
    }
  }

  // Extract website domain
  try {
    const url = new URL(result.link);
    info.website_domain = url.hostname.replace('www.', '');
  } catch {
    // Invalid URL, skip domain extraction
  }

  // Extract additional information from title and snippet
  const content = `${result.title} ${result.snippet || ''}`.toLowerCase();

  // Extract years of experience
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
    /since\s*(\d{4})/i,
    /practicing\s*(?:for\s*)?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*year\s*(?:veteran|attorney)/i
  ];

  for (const pattern of experiencePatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      if (pattern.source.includes('since')) {
        // Calculate years since founding year
        const currentYear = new Date().getFullYear();
        info.years_experience = currentYear - value;
        info.founded_year = value;
      } else {
        info.years_experience = value;
      }
      break;
    }
  }

  // Extract bar admissions
  const barPatterns = [
    /admitted\s*to\s*(?:the\s*)?bar\s*(?:in\s*)?([a-z\s,]+)/i,
    /licensed\s*(?:in\s*)?([a-z\s,]+)/i,
    /bar\s*(?:admission|member)\s*(?:in\s*)?([a-z\s,]+)/i
  ];

  for (const pattern of barPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.bar_admissions = match[1].trim();
      break;
    }
  }

  // Extract languages spoken
  const languagePatterns = [
    /(?:bilingual|speaks?)\s*([a-z\s,]+)/i,
    /(?:fluent\s*in|conversant\s*in)\s*([a-z\s,]+)/i,
    /(?:spanish|french|chinese|korean|vietnamese|arabic|portuguese|italian|german|russian|japanese|hindi|tagalog|polish|greek|hebrew|dutch|swedish|norwegian|danish|finnish|turkish|persian|urdu|bengali|tamil|telugu|marathi|gujarati|punjabi|malayalam|kannada|odia|assamese|bhojpuri|rajasthani|haryanvi|chhattisgarhi|magahi|maithili|santali|kashmiri|konkani|manipuri|nepali|sindhi|dogri|bodo|sanskrit|tulu|garo|khasi|mizo|naga|meitei|kuki|paite|thadou|vaiphei|simte|kom|gangte|hmar|lushai|pawi|lakher|mara|chakma|hajong|karbi|dimasa|tiwa|rabha|bodo|garo|khasi|jaintia|mikir|kuki|naga|mizo|paite|thadou|vaiphei|simte|kom|gangte|hmar|lushai|pawi|lakher|mara|chakma|hajong|karbi|dimasa|tiwa|rabha)\s*(?:speaking|speaker)/i
  ];

  for (const pattern of languagePatterns) {
    const match = content.match(pattern);
    if (match) {
      info.languages_spoken = match[1].trim();
      break;
    }
  }

  // Extract education
  const educationPatterns = [
    /(?:graduated\s*from|attended|degree\s*from)\s*([a-z\s&.,'-]+(?:university|college|law\s*school|school\s*of\s*law))/i,
    /(?:jd|juris\s*doctor|llm|llb|bachelor|master|phd)\s*(?:from\s*)?([a-z\s&.,'-]+(?:university|college|law\s*school|school\s*of\s*law))/i
  ];

  for (const pattern of educationPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.education = match[1].trim();
      break;
    }
  }

  // Extract office hours
  const hoursPatterns = [
    /(?:hours?|open)\s*:?\s*([a-z0-9\s,-]+(?:am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
    /(?:mon|tue|wed|thu|fri|sat|sun)[\s-]*([0-9\s:-]+(?:am|pm))/i
  ];

  for (const pattern of hoursPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.office_hours = match[1].trim();
      break;
    }
  }

  // Extract service areas
  const servicePatterns = [
    /(?:serving|serves?|practices?\s*in)\s*([a-z\s,.-]+(?:county|counties|area|areas|region|regions|state|states))/i,
    /(?:throughout|across)\s*([a-z\s,.-]+(?:county|counties|area|areas|region|regions|state|states))/i
  ];

  for (const pattern of servicePatterns) {
    const match = content.match(pattern);
    if (match) {
      info.service_areas = match[1].trim();
      break;
    }
  }

  // Extract firm size indicators
  const firmSizePatterns = [
    /(?:solo\s*practitioner|solo\s*attorney|individual\s*practice)/i,
    /(?:small\s*firm|boutique\s*firm|local\s*firm)/i,
    /(?:large\s*firm|major\s*firm|national\s*firm|international\s*firm)/i,
    /(?:partnership|associates?|partners?)/i
  ];

  for (const pattern of firmSizePatterns) {
    if (content.match(pattern)) {
      if (pattern.source.includes('solo')) {
        info.firm_size = 'Solo Practitioner';
      } else if (pattern.source.includes('small') || pattern.source.includes('boutique') || pattern.source.includes('local')) {
        info.firm_size = 'Small Firm';
      } else if (pattern.source.includes('large') || pattern.source.includes('major') || pattern.source.includes('national') || pattern.source.includes('international')) {
        info.firm_size = 'Large Firm';
      } else {
        info.firm_size = 'Multi-Attorney Firm';
      }
      break;
    }
  }

  // Extract awards and recognition
  const awardPatterns = [
    /(?:super\s*lawyers?|best\s*lawyers?|martindale-hubbell|avvo\s*rating|peer\s*reviewed|top\s*rated|award\s*winning)/i,
    /(?:recognized\s*by|featured\s*in|listed\s*in|selected\s*for)\s*([a-z\s&.,'-]+)/i
  ];

  for (const pattern of awardPatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1]) {
        info.awards_recognition = match[1].trim();
      } else {
        info.awards_recognition = match[0].trim();
      }
      break;
    }
  }

  // Extract fee structure
  const feePatterns = [
    /(?:free\s*consultation|no\s*fee\s*unless\s*we\s*win|contingency\s*fee|no\s*win\s*no\s*fee)/i,
    /(?:hourly\s*rate|flat\s*fee|retainer|payment\s*plans?)/i,
    /(?:sliding\s*scale|pro\s*bono|low\s*cost|affordable)/i
  ];

  for (const pattern of feePatterns) {
    const match = content.match(pattern);
    if (match) {
      info.fee_structure = match[0].trim();
      break;
    }
  }

  // Extract consultation type
  const consultationPatterns = [
    /(?:virtual\s*consultation|video\s*consultation|online\s*consultation|telephone\s*consultation)/i,
    /(?:in-person\s*consultation|office\s*visit|face-to-face)/i,
    /(?:free\s*consultation|initial\s*consultation|case\s*evaluation)/i
  ];

  for (const pattern of consultationPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.consultation_type = match[0].trim();
      break;
    }
  }

  // Extract payment methods
  const paymentPatterns = [
    /(?:credit\s*cards?|visa|mastercard|american\s*express|discover)/i,
    /(?:payment\s*plans?|installments?|financing|insurance\s*accepted)/i,
    /(?:cash|check|bank\s*transfer|paypal|venmo)/i
  ];

  for (const pattern of paymentPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.payment_methods = match[0].trim();
      break;
    }
  }

  // Extract professional memberships
  const membershipPatterns = [
    /(?:state\s*bar\s*association|american\s*bar\s*association|aba|local\s*bar)/i,
    /(?:trial\s*lawyers?|personal\s*injury\s*lawyers?|criminal\s*defense\s*lawyers?)/i,
    /(?:american\s*association\s*for\s*justice|aaj|national\s*association\s*of\s*criminal\s*defense)/i,
    /(?:international\s*association\s*of\s*defense\s*counsel|iadc)/i
  ];

  for (const pattern of membershipPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.professional_memberships = match[0].trim();
      break;
    }
  }

  // Extract certifications
  const certificationPatterns = [
    /(?:board\s*certified|specialist|certified\s*specialist)/i,
    /(?:civil\s*trial\s*advocate|criminal\s*trial\s*advocate)/i,
    /(?:personal\s*injury\s*specialist|workers?\s*compensation\s*specialist)/i,
    /(?:family\s*law\s*specialist|estate\s*planning\s*specialist)/i
  ];

  for (const pattern of certificationPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.certifications = match[0].trim();
      break;
    }
  }

  // Extract peer ratings
  const ratingPatterns = [
    /(?:martindale-hubbell\s*(?:av|bv|cv)|av\s*rated|bv\s*rated)/i,
    /(?:peer\s*reviewed|peer\s*rated|distinguished|preeminent)/i,
    /(?:avvo\s*(?:rating|score)|super\s*lawyers|best\s*lawyers)/i
  ];

  for (const pattern of ratingPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.peer_ratings = match[0].trim();
      break;
    }
  }

  // Extract emergency contact availability
  const emergencyPatterns = [
    /(?:24\/7|24\s*hour|emergency|urgent|after\s*hours)/i,
    /(?:weekend\s*availability|holiday\s*availability)/i,
    /(?:same\s*day|immediate|asap|rush)/i
  ];

  for (const pattern of emergencyPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.emergency_contact = match[0].trim();
      break;
    }
  }

  // Extract virtual consultation availability
  const virtualPatterns = [
    /(?:virtual|video|online|remote|telephone|phone\s*consultation)/i,
    /(?:zoom|skype|facetime|webex|teams)/i,
    /(?:telemedicine|telehealth|digital\s*consultation)/i
  ];

  for (const pattern of virtualPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.virtual_consultation = match[0].trim();
      break;
    }
  }

  // Extract response time
  const responsePatterns = [
    /(?:same\s*day|within\s*24\s*hours|within\s*48\s*hours)/i,
    /(?:immediate|prompt|quick\s*response|fast\s*response)/i,
    /(?:within\s*(\d+)\s*(?:hours?|days?))/i
  ];

  for (const pattern of responsePatterns) {
    const match = content.match(pattern);
    if (match) {
      info.response_time = match[0].trim();
      break;
    }
  }

  // Extract subspecialties
  const subspecialtyPatterns = [
    /(?:motor\s*vehicle|car\s*accident|truck\s*accident|motorcycle\s*accident)/i,
    /(?:medical\s*malpractice|birth\s*injury|cerebral\s*palsy)/i,
    /(?:product\s*liability|defective\s*products|recall)/i,
    /(?:premises\s*liability|slip\s*and\s*fall|dog\s*bite)/i,
    /(?:workers?\s*compensation|ssdi|ssi|disability)/i
  ];

  for (const pattern of subspecialtyPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.subspecialties = match[0].trim();
      break;
    }
  }

  // Extract client types
  const clientPatterns = [
    /(?:individuals?|personal|private\s*clients?)/i,
    /(?:businesses?|corporations?|companies?|enterprises?)/i,
    /(?:government|municipal|federal|state)/i,
    /(?:non-profit|charitable|foundation)/i
  ];

  for (const pattern of clientPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.client_types = match[0].trim();
      break;
    }
  }

  return info;
}
