const postgresService = require('../services/postgres');

/**
 * Seed sample international coffee buyers
 */
async function seedBuyers() {
  console.log('========================================');
  console.log('  SEEDING BUYER REGISTRY');
  console.log('========================================\n');

  const buyers = [
    {
      company_name: 'Starbucks Coffee Company',
      country: 'United States',
      address: '2401 Utah Avenue South, Seattle, WA 98134, United States',
      contact_person: 'John Smith',
      email: 'procurement@starbucks.com',
      phone: '+1-206-447-1575',
      tax_id: 'US-TAX-91-1325671',
      registration_number: 'WA-BUS-123456',
      verification_status: 'VERIFIED',
      risk_score: 95,
      credit_rating: 'AAA'
    },
    {
      company_name: 'Lavazza S.p.A.',
      country: 'Italy',
      address: 'Via Bologna 32, 10152 Turin, Italy',
      contact_person: 'Marco Rossi',
      email: 'sourcing@lavazza.com',
      phone: '+39-011-2398-111',
      tax_id: 'IT-VAT-00470550013',
      registration_number: 'IT-BUS-789012',
      verification_status: 'VERIFIED',
      risk_score: 92,
      credit_rating: 'AA+'
    },
    {
      company_name: 'Nestlé Nespresso SA',
      country: 'Switzerland',
      address: 'Avenue Nestlé 55, 1800 Vevey, Switzerland',
      contact_person: 'Pierre Dubois',
      email: 'coffee.sourcing@nespresso.com',
      phone: '+41-21-924-2111',
      tax_id: 'CH-VAT-CHE-116.281.710',
      registration_number: 'CH-BUS-345678',
      verification_status: 'VERIFIED',
      risk_score: 98,
      credit_rating: 'AAA'
    },
    {
      company_name: 'JDE Peet\'s',
      country: 'Netherlands',
      address: 'Oosterdoksstraat 80, 1011 DK Amsterdam, Netherlands',
      contact_person: 'Hans van der Berg',
      email: 'procurement@jdepeets.com',
      phone: '+31-20-558-5555',
      tax_id: 'NL-VAT-860458101B01',
      registration_number: 'NL-BUS-901234',
      verification_status: 'VERIFIED',
      risk_score: 90,
      credit_rating: 'AA'
    },
    {
      company_name: 'Tchibo GmbH',
      country: 'Germany',
      address: 'Überseering 18, 22297 Hamburg, Germany',
      contact_person: 'Klaus Mueller',
      email: 'coffee.buying@tchibo.de',
      phone: '+49-40-6387-0',
      tax_id: 'DE-VAT-118511071',
      registration_number: 'DE-BUS-567890',
      verification_status: 'VERIFIED',
      risk_score: 88,
      credit_rating: 'AA'
    }
  ];

  try {
    for (const buyer of buyers) {
      // Check if buyer already exists
      const existingBuyer = await postgresService.query(
        'SELECT buyer_id FROM buyer_registry WHERE company_name = $1',
        [buyer.company_name]
      );

      if (existingBuyer.rows.length > 0) {
        console.log(`✓ Buyer already exists: ${buyer.company_name}`);
        continue;
      }

      // Insert buyer
      const result = await postgresService.query(
        `INSERT INTO buyer_registry (
          company_name, country, address, email, phone,
          tax_id, registration_number, verification_status, risk_score, credit_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING buyer_id, company_name`,
        [
          buyer.company_name, buyer.country, buyer.address,
          buyer.email, buyer.phone, buyer.tax_id,
          buyer.registration_number, buyer.verification_status, buyer.risk_score,
          buyer.credit_rating
        ]
      );

      console.log(`✓ Created buyer: ${result.rows[0].company_name} (${result.rows[0].buyer_id})`);
    }

    console.log('\n✓ Buyer seeding completed successfully\n');
  } catch (error) {
    console.error('Error seeding buyers:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedBuyers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedBuyers };
