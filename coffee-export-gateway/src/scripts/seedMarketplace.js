const postgresService = require('../services/postgres');

/**
 * Seed sample marketplace opportunities using existing buyers
 */
async function seedMarketplace() {
  console.log('========================================');
  console.log('  SEEDING MARKETPLACE OPPORTUNITIES');
  console.log('========================================\n');

  try {
    // First, get existing buyer IDs
    const buyersResult = await postgresService.query(
      'SELECT buyer_id, company_name FROM buyer_registry WHERE verification_status = $1 LIMIT 5',
      ['VERIFIED']
    );

    if (buyersResult.rows.length === 0) {
      console.log('No verified buyers found. Please run seedBuyers.js first.');
      return;
    }

    console.log(`Found ${buyersResult.rows.length} verified buyers to create opportunities for:`);
    buyersResult.rows.forEach(buyer => {
      console.log(`  - ${buyer.company_name} (${buyer.buyer_id})`);
    });
    console.log('');

    const opportunities = [
      {
        buyer_id: buyersResult.rows[0]?.buyer_id, // Starbucks
        title: 'Premium Ethiopian Arabica - Long Term Contract',
        description: 'Seeking high-quality Ethiopian Arabica coffee for our specialty blends. Looking for consistent supply with excellent cup quality and sustainable sourcing practices.',
        coffee_type: 'ARABICA',
        origin_preferences: ['Ethiopia', 'Sidamo', 'Yirgacheffe'],
        quality_grade_min: 'Grade 1',
        quantity_min: 500,
        quantity_max: 1000,
        frequency: 'MONTHLY',
        contract_duration_months: 12,
        preferred_payment_terms: ['LC_AT_SIGHT', 'LC_DEFERRED'],
        preferred_incoterms: ['FOB', 'CIF'],
        target_price_min: 4.50,
        target_price_max: 6.00,
        currency: 'USD',
        certifications_required: ['ORGANIC', 'FAIR_TRADE', 'RAINFOREST_ALLIANCE'],
        destination_country: 'United States',
        destination_port: 'Seattle Port',
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      },
      {
        buyer_id: buyersResult.rows[1]?.buyer_id, // Lavazza
        title: 'Single Origin Ethiopian Coffee - Specialty Grade',
        description: 'Italian coffee roaster seeking exceptional single-origin Ethiopian coffee for our premium line. Focus on unique flavor profiles and traceability.',
        coffee_type: 'SPECIALTY',
        origin_preferences: ['Ethiopia', 'Harrar', 'Limu'],
        quality_grade_min: 'Grade 1',
        quantity_min: 200,
        quantity_max: 500,
        frequency: 'QUARTERLY',
        contract_duration_months: 24,
        preferred_payment_terms: ['LC_AT_SIGHT', 'CASH_AGAINST_DOCUMENTS'],
        preferred_incoterms: ['CIF', 'CFR'],
        target_price_min: 5.00,
        target_price_max: 7.50,
        currency: 'EUR',
        certifications_required: ['ORGANIC', 'UTZ'],
        destination_country: 'Italy',
        destination_port: 'Genoa Port',
        valid_until: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days
      },
      {
        buyer_id: buyersResult.rows[2]?.buyer_id, // Nespresso
        title: 'AAA Sustainable Quality Program - Ethiopian Coffee',
        description: 'Nespresso AAA Program seeking Ethiopian coffee farmers for sustainable quality program. Premium pricing for exceptional quality and sustainability practices.',
        coffee_type: 'ARABICA',
        origin_preferences: ['Ethiopia', 'Sidamo', 'Gedeo'],
        quality_grade_min: 'Grade 1',
        quantity_min: 300,
        quantity_max: 800,
        frequency: 'QUARTERLY',
        contract_duration_months: 18,
        preferred_payment_terms: ['LC_AT_SIGHT', 'ADVANCE_PAYMENT'],
        preferred_incoterms: ['FOB', 'EXW'],
        target_price_min: 6.00,
        target_price_max: 9.00,
        currency: 'USD',
        certifications_required: ['RAINFOREST_ALLIANCE', 'ORGANIC', 'FAIR_TRADE'],
        destination_country: 'Switzerland',
        destination_port: 'Basel Port',
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      {
        buyer_id: buyersResult.rows[3]?.buyer_id, // JDE Peet's
        title: 'Bulk Ethiopian Arabica for Blending',
        description: 'Large volume requirement for Ethiopian Arabica coffee for our European blending operations. Consistent quality and competitive pricing required.',
        coffee_type: 'ARABICA',
        origin_preferences: ['Ethiopia', 'Jimma', 'Kaffa'],
        quality_grade_min: 'Grade 2',
        quantity_min: 1000,
        quantity_max: 2500,
        frequency: 'MONTHLY',
        contract_duration_months: 12,
        preferred_payment_terms: ['LC_DEFERRED', 'OPEN_ACCOUNT'],
        preferred_incoterms: ['CIF', 'CFR'],
        target_price_min: 3.50,
        target_price_max: 4.50,
        currency: 'EUR',
        certifications_required: ['UTZ', 'RAINFOREST_ALLIANCE'],
        destination_country: 'Netherlands',
        destination_port: 'Rotterdam Port',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        buyer_id: buyersResult.rows[4]?.buyer_id, // Tchibo
        title: 'Direct Trade Ethiopian Coffee - Small Batch',
        description: 'German coffee company seeking direct trade relationships with Ethiopian coffee producers. Focus on quality, sustainability, and farmer partnerships.',
        coffee_type: 'SPECIALTY',
        origin_preferences: ['Ethiopia', 'Yirgacheffe', 'Guji'],
        quality_grade_min: 'Grade 1',
        quantity_min: 100,
        quantity_max: 300,
        frequency: 'QUARTERLY',
        contract_duration_months: 36,
        preferred_payment_terms: ['ADVANCE_PAYMENT', 'LC_AT_SIGHT'],
        preferred_incoterms: ['FOB', 'EXW'],
        target_price_min: 5.50,
        target_price_max: 8.00,
        currency: 'EUR',
        certifications_required: ['ORGANIC', 'FAIR_TRADE', 'DIRECT_TRADE'],
        destination_country: 'Germany',
        destination_port: 'Hamburg Port',
        valid_until: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) // 75 days
      }
    ];

    // Insert opportunities
    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i];
      
      if (!opp.buyer_id) {
        console.log(`⚠ Skipping opportunity ${i + 1} - no buyer ID available`);
        continue;
      }

      // Check if opportunity already exists for this buyer
      const existingOpp = await postgresService.query(
        'SELECT opportunity_id FROM buyer_opportunities WHERE buyer_id = $1 AND title = $2',
        [opp.buyer_id, opp.title]
      );

      if (existingOpp.rows.length > 0) {
        console.log(`✓ Opportunity already exists: ${opp.title}`);
        continue;
      }

      const query = `
        INSERT INTO buyer_opportunities (
          buyer_id, title, description, coffee_type, origin_preferences,
          quality_grade_min, quantity_min, quantity_max, frequency,
          contract_duration_months, preferred_payment_terms, preferred_incoterms,
          target_price_min, target_price_max, currency, certifications_required,
          destination_country, destination_port, valid_until, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, 'OPEN'
        ) RETURNING opportunity_id, title
      `;

      const result = await postgresService.query(query, [
        opp.buyer_id, opp.title, opp.description, opp.coffee_type, opp.origin_preferences,
        opp.quality_grade_min, opp.quantity_min, opp.quantity_max, opp.frequency,
        opp.contract_duration_months, opp.preferred_payment_terms, opp.preferred_incoterms,
        opp.target_price_min, opp.target_price_max, opp.currency, opp.certifications_required,
        opp.destination_country, opp.destination_port, opp.valid_until
      ]);

      console.log(`✓ Created opportunity: ${result.rows[0].title} (${result.rows[0].opportunity_id})`);
    }

    console.log('\n✓ Marketplace seeding completed successfully\n');
  } catch (error) {
    console.error('Error seeding marketplace:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMarketplace()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMarketplace };