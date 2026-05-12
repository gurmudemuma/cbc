-- ============================================================================
-- Insert Buyer Opportunities for Marketplace
-- Migration 033: Create active buyer opportunities from registered buyers
-- ============================================================================

-- Insert buyer opportunities from verified buyers
INSERT INTO buyer_opportunities (
    opportunity_id,
    buyer_id,
    title,
    description,
    coffee_type,
    origin_preferences,
    quality_grade_min,
    quantity_min,
    quantity_max,
    frequency,
    contract_duration_months,
    preferred_payment_terms,
    preferred_incoterms,
    target_price_min,
    target_price_max,
    currency,
    certifications_required,
    destination_country,
    destination_port,
    valid_until,
    status,
    visibility
) VALUES 
-- Starbucks - Premium Arabica
(
    gen_random_uuid(),
    'b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', -- Starbucks
    'Premium Ethiopian Arabica - Long-term Supply',
    'Starbucks is seeking high-quality Ethiopian Arabica coffee for our specialty reserve line. We value sustainable sourcing and direct relationships with exporters.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Sidamo', 'Guji'],
    'Grade 1',
    2000,
    5000,
    'MONTHLY',
    12,
    ARRAY['LC_AT_SIGHT', 'LC_DEFERRED_30'],
    ARRAY['FOB', 'CIF'],
    4.20,
    5.50,
    'USD',
    ARRAY['Fair Trade', 'Organic', 'Rainforest Alliance'],
    'USA',
    'Seattle Port',
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'OPEN',
    'PUBLIC'
),

-- UCC Ueshima - Specialty Grade
(
    gen_random_uuid(),
    'f5e6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', -- UCC Ueshima
    'Specialty Grade Ethiopian Coffee for Japanese Market',
    'Leading Japanese coffee company seeking consistent supply of specialty grade Ethiopian coffee. We prioritize quality and traceability.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Harrar', 'Limu'],
    'Grade 1',
    1500,
    3000,
    'MONTHLY',
    12,
    ARRAY['LC_AT_SIGHT'],
    ARRAY['CIF', 'CFR'],
    4.50,
    6.00,
    'USD',
    ARRAY['Organic', 'Single Origin'],
    'Japan',
    'Kobe Port',
    CURRENT_TIMESTAMP + INTERVAL '120 days',
    'OPEN',
    'PUBLIC'
),

-- Lavazza - High Volume
(
    gen_random_uuid(),
    'b7a8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', -- Lavazza
    'High Volume Ethiopian Arabica for European Market',
    'Lavazza seeks reliable Ethiopian coffee suppliers for our premium blends. Long-term partnership opportunity with one of Italy''s leading coffee brands.',
    'ARABICA',
    ARRAY['Sidamo', 'Yirgacheffe', 'Jimma'],
    'Grade 2',
    3000,
    8000,
    'MONTHLY',
    24,
    ARRAY['LC_DEFERRED_30', 'LC_DEFERRED_60'],
    ARRAY['FOB', 'CIF'],
    3.80,
    4.80,
    'USD',
    ARRAY['UTZ Certified', 'Rainforest Alliance'],
    'Italy',
    'Genoa Port',
    CURRENT_TIMESTAMP + INTERVAL '180 days',
    'OPEN',
    'PUBLIC'
),

-- Nespresso - Sustainable Premium
(
    gen_random_uuid(),
    'e0d1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', -- Nestlé Nespresso
    'Sustainable Premium Arabica for Nespresso Capsules',
    'Nespresso is committed to sourcing 100% sustainable coffee. We seek AAA Sustainable Quality™ certified Ethiopian coffee with full traceability.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Sidamo'],
    'Grade 1',
    1000,
    2500,
    'MONTHLY',
    18,
    ARRAY['LC_AT_SIGHT'],
    ARRAY['CIF'],
    5.00,
    7.00,
    'USD',
    ARRAY['AAA Sustainable Quality', 'Organic', 'Fair Trade'],
    'Switzerland',
    'Basel Port',
    CURRENT_TIMESTAMP + INTERVAL '150 days',
    'OPEN',
    'PUBLIC'
),

-- Tchibo - Consistent Supply
(
    gen_random_uuid(),
    'd3c4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', -- Tchibo
    'Consistent Ethiopian Coffee Supply for German Market',
    'Tchibo requires consistent monthly supply of quality Ethiopian coffee. We value reliability and competitive pricing for our retail operations.',
    'ARABICA',
    ARRAY['Sidamo', 'Limu', 'Jimma'],
    'Grade 2',
    2500,
    6000,
    'MONTHLY',
    12,
    ARRAY['LC_DEFERRED_30', 'LC_DEFERRED_60'],
    ARRAY['FOB', 'CIF'],
    3.50,
    4.50,
    'USD',
    ARRAY['Rainforest Alliance', 'UTZ Certified'],
    'Germany',
    'Hamburg Port',
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'OPEN',
    'PUBLIC',
    'd3c4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f'
),

-- Costa Coffee - UK Market
(
    gen_random_uuid(),
    'a6f7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', -- Costa Coffee
    'Ethiopian Single Origin for UK Coffee Shops',
    'Costa Coffee is expanding our single origin offerings. Seeking high-quality Ethiopian coffee with distinctive flavor profiles for our UK market.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Harrar'],
    'Grade 1',
    1200,
    3000,
    'MONTHLY',
    12,
    ARRAY['LC_AT_SIGHT', 'LC_DEFERRED_30'],
    ARRAY['CIF'],
    4.00,
    5.20,
    'USD',
    ARRAY['Organic', 'Fair Trade'],
    'United Kingdom',
    'London Gateway Port',
    CURRENT_TIMESTAMP + INTERVAL '120 days',
    'OPEN',
    'PUBLIC',
    'a6f7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c'
),

-- Illy - Ultra Premium
(
    gen_random_uuid(),
    'c8b9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', -- Illy Caffè
    'Ultra Premium Ethiopian Arabica for Espresso Blends',
    'Illy seeks the finest Ethiopian Arabica for our premium espresso blends. We require exceptional quality and are willing to pay premium prices.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Sidamo'],
    'Grade 1',
    800,
    2000,
    'MONTHLY',
    12,
    ARRAY['LC_AT_SIGHT'],
    ARRAY['CIF'],
    5.50,
    7.50,
    'USD',
    ARRAY['Organic', 'Single Origin', 'Direct Trade'],
    'Italy',
    'Trieste Port',
    CURRENT_TIMESTAMP + INTERVAL '180 days',
    'OPEN',
    'PUBLIC',
    'c8b9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e'
),

-- Peet's Coffee - Specialty Roaster
(
    gen_random_uuid(),
    'c2b3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', -- Peet's Coffee
    'Specialty Ethiopian Coffee for Craft Roasting',
    'Peet''s Coffee seeks unique Ethiopian lots for our craft roasting program. We value distinctive flavor profiles and sustainable practices.',
    'ARABICA',
    ARRAY['Yirgacheffe', 'Guji', 'Harrar'],
    'Grade 1',
    1000,
    2500,
    'MONTHLY',
    12,
    ARRAY['LC_AT_SIGHT'],
    ARRAY['FOB', 'CIF'],
    4.80,
    6.20,
    'USD',
    ARRAY['Organic', 'Fair Trade', 'Direct Trade'],
    'USA',
    'Oakland Port',
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'OPEN',
    'PUBLIC',
    'c2b3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e'
),

-- Tim Hortons - Canadian Market
(
    gen_random_uuid(),
    'f1e2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', -- Tim Hortons
    'Ethiopian Coffee for Canadian Coffee Chain',
    'Tim Hortons is diversifying our coffee sourcing. Seeking reliable Ethiopian coffee suppliers for our Canadian operations.',
    'ARABICA',
    ARRAY['Sidamo', 'Limu', 'Jimma'],
    'Grade 2',
    2000,
    5000,
    'MONTHLY',
    12,
    ARRAY['LC_DEFERRED_30', 'LC_DEFERRED_60'],
    ARRAY['FOB', 'CIF'],
    3.60,
    4.60,
    'USD',
    ARRAY['Rainforest Alliance'],
    'Canada',
    'Vancouver Port',
    CURRENT_TIMESTAMP + INTERVAL '120 days',
    'OPEN',
    'PUBLIC',
    'f1e2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b'
),

-- Douwe Egberts - European Distribution
(
    gen_random_uuid(),
    'd9c0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', -- Douwe Egberts
    'Ethiopian Coffee for European Retail Distribution',
    'Douwe Egberts seeks Ethiopian coffee for our European retail brands. We require consistent quality and competitive pricing.',
    'ARABICA',
    ARRAY['Sidamo', 'Yirgacheffe', 'Limu'],
    'Grade 2',
    3000,
    7000,
    'MONTHLY',
    18,
    ARRAY['LC_DEFERRED_30', 'LC_DEFERRED_60'],
    ARRAY['FOB', 'CIF'],
    3.40,
    4.40,
    'USD',
    ARRAY['UTZ Certified', 'Rainforest Alliance'],
    'Netherlands',
    'Rotterdam Port',
    CURRENT_TIMESTAMP + INTERVAL '150 days',
    'OPEN',
    'PUBLIC',
    'd9c0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f'
)
ON CONFLICT (opportunity_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE buyer_opportunities IS 'Active buyer opportunities for marketplace matching';
