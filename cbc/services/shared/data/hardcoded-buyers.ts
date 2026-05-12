/**
 * Hardcoded Buyer List
 * Test buyers for exporter-buyer matching
 * In production, this would be replaced with a real buyer database
 */

export interface HardcodedBuyer {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  phone: string;
  preferredCoffeeTypes: string[];
  paymentTerms: string[];
  minimumOrderBags: number;
  description: string;
  established: number;
  certifications: string[];
}

export const HARDCODED_BUYERS: HardcodedBuyer[] = [
  {
    id: 'BUYER-001',
    name: 'Global Coffee Importers Ltd',
    email: 'buyer1@globalcoffee.com',
    country: 'Germany',
    city: 'Hamburg',
    phone: '+49-40-123-4567',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Organic'],
    paymentTerms: ['Letter of Credit', 'Advance Payment'],
    minimumOrderBags: 100,
    description: 'Leading European coffee importer specializing in premium Ethiopian Arabica. We work with specialty roasters across Germany, France, and the Netherlands.',
    established: 1995,
    certifications: ['Fair Trade', 'Organic', 'Rainforest Alliance'],
  },
  {
    id: 'BUYER-002',
    name: 'American Coffee Traders Inc',
    email: 'buyer2@americancoffee.com',
    country: 'United States',
    city: 'New York',
    phone: '+1-212-555-1234',
    preferredCoffeeTypes: ['Arabica', 'Robusta', 'Specialty'],
    paymentTerms: ['Letter of Credit', 'Net 30', 'Net 60'],
    minimumOrderBags: 200,
    description: 'Major US coffee importer serving commercial roasters and specialty coffee shops. We import over 10,000 tons annually from Ethiopia.',
    established: 1988,
    certifications: ['Fair Trade', 'Organic', 'UTZ'],
  },
  {
    id: 'BUYER-003',
    name: 'European Coffee Consortium',
    email: 'buyer3@eurocoffee.eu',
    country: 'Netherlands',
    city: 'Amsterdam',
    phone: '+31-20-123-4567',
    preferredCoffeeTypes: ['Specialty', 'Organic', 'Single Origin'],
    paymentTerms: ['Advance Payment', 'Letter of Credit'],
    minimumOrderBags: 50,
    description: 'Specialty coffee consortium representing 50+ independent roasters across Europe. We focus on direct trade and sustainable sourcing.',
    established: 2005,
    certifications: ['Organic', 'Fair Trade', 'B Corp'],
  },
  {
    id: 'BUYER-004',
    name: 'Asian Coffee Trading Co',
    email: 'buyer4@asiancoffee.com',
    country: 'Japan',
    city: 'Tokyo',
    phone: '+81-3-1234-5678',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Washed'],
    paymentTerms: ['Letter of Credit', 'Advance Payment'],
    minimumOrderBags: 150,
    description: 'Premium coffee importer for the Japanese market. We specialize in high-quality Ethiopian coffee for specialty cafes and department stores.',
    established: 2000,
    certifications: ['Organic', 'JAS', 'Fair Trade'],
  },
  {
    id: 'BUYER-005',
    name: 'Middle East Coffee Importers',
    email: 'buyer5@mecoffee.ae',
    country: 'United Arab Emirates',
    city: 'Dubai',
    phone: '+971-4-123-4567',
    preferredCoffeeTypes: ['Arabica', 'Traditional', 'Medium Roast'],
    paymentTerms: ['Letter of Credit', 'Cash on Delivery'],
    minimumOrderBags: 300,
    description: 'Leading coffee distributor in the Middle East. We supply hotels, restaurants, and retail chains across the GCC region.',
    established: 2010,
    certifications: ['Halal', 'ISO 22000'],
  },
  {
    id: 'BUYER-006',
    name: 'Scandinavian Coffee Partners',
    email: 'buyer6@scandcoffee.se',
    country: 'Sweden',
    city: 'Stockholm',
    phone: '+46-8-123-4567',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Light Roast'],
    paymentTerms: ['Advance Payment', 'Net 30'],
    minimumOrderBags: 80,
    description: 'Specialty coffee importer for Nordic countries. We focus on sustainable sourcing and long-term partnerships with Ethiopian exporters.',
    established: 2012,
    certifications: ['Organic', 'Fair Trade', 'Nordic Swan'],
  },
  {
    id: 'BUYER-007',
    name: 'Australian Coffee Merchants',
    email: 'buyer7@aussiecoffee.com.au',
    country: 'Australia',
    city: 'Melbourne',
    phone: '+61-3-9123-4567',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Natural Process'],
    paymentTerms: ['Letter of Credit', 'Net 60'],
    minimumOrderBags: 120,
    description: 'Premium coffee importer for the Australian and New Zealand markets. We work with award-winning roasters and specialty cafes.',
    established: 2008,
    certifications: ['Organic', 'Fair Trade', 'Rainforest Alliance'],
  },
  {
    id: 'BUYER-008',
    name: 'UK Coffee Importers Ltd',
    email: 'buyer8@ukcoffee.co.uk',
    country: 'United Kingdom',
    city: 'London',
    phone: '+44-20-7123-4567',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Washed'],
    paymentTerms: ['Letter of Credit', 'Advance Payment', 'Net 30'],
    minimumOrderBags: 100,
    description: 'Established UK coffee importer serving specialty roasters and commercial clients. We have been importing Ethiopian coffee for over 20 years.',
    established: 2001,
    certifications: ['Organic', 'Fair Trade', 'Rainforest Alliance'],
  },
  {
    id: 'BUYER-009',
    name: 'Canadian Coffee Collective',
    email: 'buyer9@canadacoffee.ca',
    country: 'Canada',
    city: 'Toronto',
    phone: '+1-416-555-7890',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Organic'],
    paymentTerms: ['Letter of Credit', 'Net 30'],
    minimumOrderBags: 90,
    description: 'Cooperative of Canadian specialty coffee roasters. We focus on direct trade and transparent pricing with Ethiopian exporters.',
    established: 2015,
    certifications: ['Organic', 'Fair Trade', 'B Corp'],
  },
  {
    id: 'BUYER-010',
    name: 'South Korean Coffee Trading',
    email: 'buyer10@koreacoffee.kr',
    country: 'South Korea',
    city: 'Seoul',
    phone: '+82-2-1234-5678',
    preferredCoffeeTypes: ['Arabica', 'Specialty', 'Single Origin'],
    paymentTerms: ['Letter of Credit', 'Advance Payment'],
    minimumOrderBags: 150,
    description: 'Premium coffee importer for the rapidly growing Korean specialty coffee market. We supply high-end cafes and roasters.',
    established: 2013,
    certifications: ['Organic', 'Fair Trade', 'KFDA'],
  },
];

/**
 * Get buyer by ID
 */
export function getBuyerById(buyerId: string): HardcodedBuyer | undefined {
  return HARDCODED_BUYERS.find(buyer => buyer.id === buyerId);
}

/**
 * Get buyer by email
 */
export function getBuyerByEmail(email: string): HardcodedBuyer | undefined {
  return HARDCODED_BUYERS.find(buyer => buyer.email.toLowerCase() === email.toLowerCase());
}

/**
 * Search buyers by criteria
 */
export function searchBuyers(criteria: {
  country?: string;
  coffeeType?: string;
  paymentTerm?: string;
  minOrderBags?: number;
}): HardcodedBuyer[] {
  return HARDCODED_BUYERS.filter(buyer => {
    if (criteria.country && buyer.country !== criteria.country) return false;
    if (criteria.coffeeType && !buyer.preferredCoffeeTypes.includes(criteria.coffeeType)) return false;
    if (criteria.paymentTerm && !buyer.paymentTerms.includes(criteria.paymentTerm)) return false;
    if (criteria.minOrderBags && buyer.minimumOrderBags > criteria.minOrderBags) return false;
    return true;
  });
}

/**
 * Get all unique countries
 */
export function getAllCountries(): string[] {
  return Array.from(new Set(HARDCODED_BUYERS.map(buyer => buyer.country))).sort();
}

/**
 * Get all unique coffee types
 */
export function getAllCoffeeTypes(): string[] {
  const types = new Set<string>();
  HARDCODED_BUYERS.forEach(buyer => {
    buyer.preferredCoffeeTypes.forEach(type => types.add(type));
  });
  return Array.from(types).sort();
}

/**
 * Get all unique payment terms
 */
export function getAllPaymentTerms(): string[] {
  const terms = new Set<string>();
  HARDCODED_BUYERS.forEach(buyer => {
    buyer.paymentTerms.forEach(term => terms.add(term));
  });
  return Array.from(terms).sort();
}
