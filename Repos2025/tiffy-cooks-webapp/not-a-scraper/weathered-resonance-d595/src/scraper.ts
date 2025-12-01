import { Lawyer } from './types';

export interface ScrapedData {
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  office_hours?: string;
  years_experience?: number;
  bar_admissions?: string;
  languages_spoken?: string;
  education?: string;
  firm_size?: string;
  founded_year?: number;
  awards_recognition?: string;
  fee_structure?: string;
  consultation_type?: string;
  payment_methods?: string;
  professional_memberships?: string;
  certifications?: string;
  virtual_consultation?: string;
  service_areas?: string;
}

export async function scrapeLawyerWebsite(url: string): Promise<ScrapedData> {
  const data: ScrapedData = {};

  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LawyerDirectoryBot/1.0; +https://blawby.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return data;
    }

    const html = await response.text();
    
    // Extract data from HTML
    extractContactInfo(html, data);
    extractProfessionalInfo(html, data);
    extractBusinessInfo(html, data);
    extractStructuredData(html, data);

  } catch (error) {
    console.error(`Error scraping ${url}:`, error instanceof Error ? error.message : String(error));
  }

  return data;
}

function extractContactInfo(html: string, data: ScrapedData): void {
  // Extract phone numbers
  const phonePatterns = [
    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
    /(\+\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
    /(tel:[\d\s\-\(\)]+)/gi,
  ];

  for (const pattern of phonePatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the phone number
      let phone = matches[0].replace(/tel:/gi, '').trim();
      phone = phone.replace(/\s+/g, ' ').trim();
      if (phone.length >= 10) {
        data.phone = phone;
        break;
      }
    }
  }

  // Extract email addresses
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emailMatches = html.match(emailPattern);
  if (emailMatches && emailMatches.length > 0) {
    // Filter out common non-contact emails and invalid patterns
    const filtered = emailMatches.filter(email => {
      const lowerEmail = email.toLowerCase();
      // Exclude common non-contact domains
      const excludedDomains = [
        'example.com', 'sentry.io', 'google', 'facebook', 'twitter',
        'linkedin', 'youtube', 'instagram', 'pinterest', 'tumblr',
        'github', 'stackoverflow', 'reddit', 'discord', 'slack'
      ];
      
      // Exclude image/file extensions that might be mistaken for emails
      const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip', '.webp'];
      
      // Check if email contains excluded domains
      const hasExcludedDomain = excludedDomains.some(domain => lowerEmail.includes(domain));
      
      // Check if email ends with file extension (likely not a real email)
      const hasFileExtension = invalidExtensions.some(ext => lowerEmail.endsWith(ext));
      
      // Must be a valid email format
      const isValidFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      
      return !hasExcludedDomain && !hasFileExtension && isValidFormat;
    });
    
    if (filtered.length > 0) {
      data.email = filtered[0];
    }
  }

  // Extract addresses (look for common address patterns)
  const addressPatterns = [
    /(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir)[\s,]+[A-Za-z\s,]+(?:CA|California|NY|New York|TX|Texas|FL|Florida|IL|Illinois)[\s,]*\d{5}(?:-\d{4})?)/gi,
    /([A-Za-z\s,]+(?:CA|California|NY|New York|TX|Texas|FL|Florida|IL|Illinois)[\s,]*\d{5})/gi,
  ];

  for (const pattern of addressPatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      data.address = matches[0].trim();
      break;
    }
  }
}

function extractProfessionalInfo(html: string, data: ScrapedData): void {
  const content = html.toLowerCase();

  // Extract years of experience
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
    /since\s*(\d{4})/i,
    /practicing\s*(?:for\s*)?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*year\s*(?:veteran|attorney)/i,
  ];

  for (const pattern of experiencePatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      if (pattern.source.includes('since')) {
        const currentYear = new Date().getFullYear();
        data.years_experience = currentYear - value;
        data.founded_year = value;
      } else {
        data.years_experience = value;
      }
      break;
    }
  }

  // Extract bar admissions
  const barPatterns = [
    /admitted\s*to\s*(?:the\s*)?bar\s*(?:in\s*)?([a-z\s,]+)/i,
    /licensed\s*(?:in\s*)?([a-z\s,]+)/i,
    /bar\s*(?:admission|member)\s*(?:in\s*)?([a-z\s,]+)/i,
  ];

  for (const pattern of barPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.bar_admissions = match[1].trim();
      break;
    }
  }

  // Extract languages spoken
  const languagePatterns = [
    /(?:bilingual|speaks?)\s*([a-z\s,]+)/i,
    /(?:fluent\s*in|conversant\s*in)\s*([a-z\s,]+)/i,
  ];

  for (const pattern of languagePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.languages_spoken = match[1].trim();
      break;
    }
  }

  // Extract education
  const educationPatterns = [
    /(?:graduated\s*from|attended|degree\s*from)\s*([a-z\s&.,'-]+(?:university|college|law\s*school|school\s*of\s*law))/i,
    /(?:jd|juris\s*doctor|llm|llb|bachelor|master|phd)\s*(?:from\s*)?([a-z\s&.,'-]+(?:university|college|law\s*school|school\s*of\s*law))/i,
  ];

  for (const pattern of educationPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.education = match[1].trim();
      break;
    }
  }

  // Extract certifications
  const certificationPatterns = [
    /(?:board\s*certified|specialist|certified\s*specialist)/i,
    /(?:civil\s*trial\s*advocate|criminal\s*trial\s*advocate)/i,
  ];

  for (const pattern of certificationPatterns) {
    if (content.match(pattern)) {
      data.certifications = pattern.source.replace(/[()]/g, '').trim();
      break;
    }
  }

  // Extract professional memberships
  const membershipPatterns = [
    /(?:state\s*bar\s*association|american\s*bar\s*association|aba)/i,
    /(?:trial\s*lawyers?|personal\s*injury\s*lawyers?)/i,
  ];

  for (const pattern of membershipPatterns) {
    if (content.match(pattern)) {
      data.professional_memberships = pattern.source.replace(/[()]/g, '').trim();
      break;
    }
  }
}

function extractBusinessInfo(html: string, data: ScrapedData): void {
  const content = html.toLowerCase();

  // Extract office hours
  const hoursPatterns = [
    /(?:hours?|open)\s*:?\s*([a-z0-9\s,-]+(?:am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
    /(?:mon|tue|wed|thu|fri|sat|sun)[\s-]*([0-9\s:-]+(?:am|pm))/i,
  ];

  for (const pattern of hoursPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.office_hours = match[1].trim();
      break;
    }
  }

  // Extract service areas
  const servicePatterns = [
    /(?:serving|serves?|practices?\s*in)\s*([a-z\s,.-]+(?:county|counties|area|areas|region|regions|state|states))/i,
    /(?:throughout|across)\s*([a-z\s,.-]+(?:county|counties|area|areas|region|regions|state|states))/i,
  ];

  for (const pattern of servicePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.service_areas = match[1].trim();
      break;
    }
  }

  // Extract firm size
  const firmSizePatterns = [
    /(?:solo\s*practitioner|solo\s*attorney|individual\s*practice)/i,
    /(?:small\s*firm|boutique\s*firm|local\s*firm)/i,
    /(?:large\s*firm|major\s*firm|national\s*firm|international\s*firm)/i,
  ];

  for (const pattern of firmSizePatterns) {
    if (content.match(pattern)) {
      if (pattern.source.includes('solo')) {
        data.firm_size = 'Solo Practitioner';
      } else if (pattern.source.includes('small') || pattern.source.includes('boutique') || pattern.source.includes('local')) {
        data.firm_size = 'Small Firm';
      } else if (pattern.source.includes('large') || pattern.source.includes('major') || pattern.source.includes('national') || pattern.source.includes('international')) {
        data.firm_size = 'Large Firm';
      }
      break;
    }
  }

  // Extract fee structure
  const feePatterns = [
    /(?:free\s*consultation|no\s*fee\s*unless\s*we\s*win|contingency\s*fee|no\s*win\s*no\s*fee)/i,
    /(?:hourly\s*rate|flat\s*fee|retainer|payment\s*plans?)/i,
  ];

  for (const pattern of feePatterns) {
    if (content.match(pattern)) {
      data.fee_structure = pattern.source.replace(/[()]/g, '').trim();
      break;
    }
  }

  // Extract consultation type
  const consultationPatterns = [
    /(?:virtual\s*consultation|video\s*consultation|online\s*consultation|telephone\s*consultation)/i,
    /(?:in-person\s*consultation|office\s*visit|face-to-face)/i,
  ];

  for (const pattern of consultationPatterns) {
    if (content.match(pattern)) {
      data.consultation_type = pattern.source.replace(/[()]/g, '').trim();
      break;
    }
  }

  // Extract virtual consultation availability
  if (content.match(/(?:virtual|video|online|remote|telephone|phone\s*consultation)/i)) {
    data.virtual_consultation = 'Yes';
  }
}

function extractStructuredData(html: string, data: ScrapedData): void {
  // Try to extract JSON-LD structured data
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const matches = html.matchAll(jsonLdPattern);

  for (const match of matches) {
    try {
      const jsonData = JSON.parse(match[1]);
      if (Array.isArray(jsonData)) {
        for (const item of jsonData) {
          extractFromStructuredItem(item, data);
        }
      } else {
        extractFromStructuredItem(jsonData, data);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Try to extract microdata
  // This is a simplified version - could be expanded
  if (html.includes('itemtype="http://schema.org/LegalService"') || 
      html.includes('itemtype="http://schema.org/Lawyer"')) {
    // Extract basic microdata
    const telephoneMatch = html.match(/<[^>]*itemprop=["']telephone["'][^>]*>([^<]+)</i);
    if (telephoneMatch && !data.phone) {
      data.phone = telephoneMatch[1].trim();
    }

    const emailMatch = html.match(/<[^>]*itemprop=["']email["'][^>]*>([^<]+)</i);
    if (emailMatch && !data.email) {
      data.email = emailMatch[1].trim();
    }
  }
}

function extractFromStructuredItem(item: any, data: ScrapedData): void {
  if (!item || typeof item !== 'object') return;

  // Extract from LegalService or Lawyer schema
  if (item['@type'] === 'LegalService' || item['@type'] === 'Lawyer' || item['@type'] === 'Attorney') {
    if (item.telephone && !data.phone) {
      data.phone = item.telephone;
    }
    if (item.email && !data.email) {
      data.email = item.email;
    }
    if (item.address) {
      const address = typeof item.address === 'string' 
        ? item.address 
        : item.address.streetAddress + ', ' + item.address.addressLocality + ', ' + item.address.addressRegion + ' ' + item.address.postalCode;
      if (!data.address) {
        data.address = address;
      }
    }
    if (item.description && !data.description) {
      data.description = item.description;
    }
  }
}

