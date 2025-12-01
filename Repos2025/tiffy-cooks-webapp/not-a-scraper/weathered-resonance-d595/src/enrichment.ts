import { Env, Lawyer } from './types';
import { scrapeLawyerWebsite, ScrapedData } from './scraper';
import { cleanAndValidateData } from './validation';
import { updateLawyerWithEnhancedData } from './database';

export interface EnrichmentResult {
  lawyerId: number;
  url: string;
  success: boolean;
  fieldsAdded: number;
  error?: string;
}

export async function enrichLawyer(
  env: Env,
  lawyer: Lawyer
): Promise<EnrichmentResult> {
  if (!lawyer.url || !lawyer.id) {
    return {
      lawyerId: lawyer.id || 0,
      url: lawyer.url || '',
      success: false,
      fieldsAdded: 0,
      error: 'Missing URL or ID',
    };
  }

  try {
    // Scrape the website
    const scrapedData = await scrapeLawyerWebsite(lawyer.url);
    
    // Validate and clean the data
    const validated = cleanAndValidateData({
      phone: scrapedData.phone,
      email: scrapedData.email,
      address: scrapedData.address,
    });

    // Combine scraped data with validated contact info
    const enrichedLawyer: Partial<Lawyer> = {
      phone: validated.phone || scrapedData.phone || undefined,
      email: validated.email || scrapedData.email || undefined,
      address: validated.address || scrapedData.address || undefined,
      description: scrapedData.description || undefined,
      office_hours: scrapedData.office_hours || undefined,
      years_experience: scrapedData.years_experience || undefined,
      bar_admissions: scrapedData.bar_admissions || undefined,
      languages_spoken: scrapedData.languages_spoken || undefined,
      education: scrapedData.education || undefined,
      firm_size: scrapedData.firm_size || undefined,
      founded_year: scrapedData.founded_year || undefined,
      awards_recognition: scrapedData.awards_recognition || undefined,
      fee_structure: scrapedData.fee_structure || undefined,
      consultation_type: scrapedData.consultation_type || undefined,
      payment_methods: scrapedData.payment_methods || undefined,
      professional_memberships: scrapedData.professional_memberships || undefined,
      certifications: scrapedData.certifications || undefined,
      virtual_consultation: scrapedData.virtual_consultation || undefined,
      service_areas: scrapedData.service_areas || undefined,
    };

    // Count how many fields were added
    const fieldsAdded = Object.values(enrichedLawyer).filter(
      value => value !== null && value !== undefined
    ).length;

    // Update the database
    await updateLawyerWithEnhancedData(env, lawyer.url, enrichedLawyer as Lawyer);

    return {
      lawyerId: lawyer.id,
      url: lawyer.url,
      success: true,
      fieldsAdded,
    };
  } catch (error) {
    return {
      lawyerId: lawyer.id || 0,
      url: lawyer.url,
      success: false,
      fieldsAdded: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function enrichLawyersBatch(
  env: Env,
  lawyers: Lawyer[],
  delayMs: number = 200
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  for (const lawyer of lawyers) {
    const result = await enrichLawyer(env, lawyer);
    results.push(result);

    // Add delay between requests to be respectful
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export function isLawFirm(url: string, name: string, snippet?: string): boolean {
  const urlLower = url.toLowerCase();
  const nameLower = name.toLowerCase();
  const snippetLower = (snippet || '').toLowerCase();

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
    if (pattern.test(urlLower) || pattern.test(nameLower) || pattern.test(snippetLower)) {
      return false;
    }
  }

  // Include law firm indicators
  const firmIndicators = [
    /law\s*firm/i,
    /attorney/i,
    /lawyer/i,
    /legal\s*services/i,
    /law\s*group/i,
    /law\s*office/i,
    /attorneys?\s*at\s*law/i,
  ];

  for (const indicator of firmIndicators) {
    if (indicator.test(nameLower) || indicator.test(snippetLower)) {
      return true;
    }
  }

  // If it has a professional domain and doesn't match excluded patterns, assume it's a law firm
  return !urlLower.includes('.gov') && !urlLower.includes('.court');
}

export function calculateDataQualityScore(lawyer: Lawyer): number {
  let score = 0;
  const maxScore = 100;

  // Contact info (40 points)
  if (lawyer.phone) score += 15;
  if (lawyer.email) score += 15;
  if (lawyer.address) score += 10;

  // Professional info (30 points)
  if (lawyer.years_experience) score += 5;
  if (lawyer.bar_admissions) score += 5;
  if (lawyer.education) score += 5;
  if (lawyer.languages_spoken) score += 5;
  if (lawyer.certifications) score += 5;
  if (lawyer.professional_memberships) score += 5;

  // Business info (20 points)
  if (lawyer.office_hours) score += 5;
  if (lawyer.service_areas) score += 5;
  if (lawyer.firm_size) score += 5;
  if (lawyer.fee_structure) score += 5;

  // Additional info (10 points)
  if (lawyer.description) score += 5;
  if (lawyer.website_domain) score += 5;

  return Math.min(score, maxScore);
}

