import { Env, Lawyer, GoogleSearchResult, SearchFilters } from './types';
import { GOOGLE_SEARCH_ENGINE_ID } from './constants';
import { checkQuota, incrementQuota, getQuotaStatus } from './quota';

export async function performGoogleSearchWithPagination(
  query: string,
  startIndex: number,
  env: Env,
  quotaType: "crawl" | "search" = "crawl"
): Promise<GoogleSearchResult[]> {
  // Track API calls to stay within free tier (100 calls/day)
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `api_calls:${today}`;
  const currentCalls = parseInt(await env.QUOTA_KV.get(quotaKey) || "0");

  // Temporarily disabled for testing
  // if (currentCalls >= 100) {
  //   throw new Error(`Daily API quota reached (${currentCalls}/100). Staying within free tier.`);
  // }

  // Perform the search with pagination and retry logic
  const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_SEARCH_ENGINE_ID}&key=${env.GOOGLE_API_KEY}&start=${startIndex}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json() as any;

        // Increment API call counter to track free tier usage
        await env.QUOTA_KV.put(quotaKey, (currentCalls + 1).toString(), { expirationTtl: 86400 });

        return (data.items || []).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          pagemap: item.pagemap || undefined
        }));
      } else if (response.status === 429 || response.status === 403) {
        // Rate limit or quota exceeded - don't retry
        const errorText = await response.text();
        console.log(`Google API error ${response.status}: ${errorText}`);
        throw new Error(`Google API quota/rate limit exceeded: ${response.status} - ${errorText}`);
      } else if (response.status >= 500 || response.status === 400) {
        // Server error or bad request - retry with backoff
        lastError = new Error(`Google API error: ${response.status}`);

        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
          console.log(`Retrying Google API call in ${delay}ms (attempt ${attempt + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        throw new Error(`Google API error: ${response.status}`);
      }
    } catch (error) {
      lastError = error as Error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (attempt < 3 && !errorMessage.includes('quota') && !errorMessage.includes('rate limit')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying Google API call in ${delay}ms (attempt ${attempt + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Google API request failed after 3 attempts');
}

export async function performGoogleSearch(query: string, env: Env): Promise<GoogleSearchResult[]> {
  // Legacy function for backward compatibility
  return performGoogleSearchWithPagination(query, 1, env);
}

export async function performGoogleFallbackSearch(
  env: Env,
  filters: SearchFilters
): Promise<Lawyer[]> {
  // Build search query
  let query = "";
  if (filters.practiceArea) {
    query += filters.practiceArea;
  } else {
    query += "lawyer";
  }

  if (filters.city) {
    query += ` ${filters.city}`;
  }

  if (filters.state) {
    query += ` ${filters.state}`;
  }

  console.log(`Performing Google fallback search: "${query}"`);

  const searchResults = await performGoogleSearchWithPagination(query, 1, env, "crawl");
  const lawyers: Lawyer[] = [];

  for (const result of searchResults) {
    const lawyer = parseLawyerFromResult(result, filters.city || "", filters.state || "");
    if (lawyer) {
      lawyers.push(lawyer);
    }
  }

  return lawyers;
}

export function parseLawyerFromResult(result: GoogleSearchResult, city: string, state: string): Lawyer | null {
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
