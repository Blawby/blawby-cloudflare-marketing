export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove common formatting
  let cleaned = phone.replace(/[^\d+()\-.\s]/g, '');
  
  // Remove tel: prefix if present
  cleaned = cleaned.replace(/^tel:/i, '');
  
  // Remove whitespace
  cleaned = cleaned.replace(/\s+/g, '');
  
  // Check if it's a valid phone number (at least 10 digits)
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 10) return null;
  
  // Format: (XXX) XXX-XXXX or XXX-XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Keep original if it has country code
  if (digits.length > 10) {
    return cleaned;
  }
  
  return cleaned;
}

export function validateEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Filter out common non-contact emails
  const excludedDomains = [
    'example.com',
    'sentry.io',
    'google.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'youtube.com',
    'instagram.com',
    'pinterest.com',
    'tumblr.com',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && excludedDomains.some(excluded => domain.includes(excluded))) {
    return null;
  }
  
  if (emailRegex.test(email)) {
    return email.toLowerCase().trim();
  }
  
  return null;
}

export function validateAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  
  // Basic validation - check for common address components
  const hasStreet = /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir)/i.test(address);
  const hasCity = /[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5}/i.test(address);
  const hasZip = /\d{5}(?:-\d{4})?/.test(address);
  
  if (hasStreet || (hasCity && hasZip)) {
    return address.trim();
  }
  
  return null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +1 (US), remove it
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

export function cleanAndValidateData(data: {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): {
  phone: string | null;
  email: string | null;
  address: string | null;
} {
  return {
    phone: validatePhone(data.phone),
    email: validateEmail(data.email),
    address: validateAddress(data.address),
  };
}

