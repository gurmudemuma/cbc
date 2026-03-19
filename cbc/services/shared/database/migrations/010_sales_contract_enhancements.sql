-- ============================================================================
-- SALES CONTRACT ENHANCEMENTS - Phase 1: Buyer Registry & Verification
-- ============================================================================

-- Buyer Registry with Verification and Reputation
CREATE TABLE IF NOT EXISTS buyer_registry (
    buyer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500) NOT NULL,
    country VARCHAR(100) NOT NULL,
    registration_number VARCHAR(200),
    tax_id VARCHAR(200),
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Verification Status
    verification_status VARCHAR(50) DEFAULT 'UNVERIFIED' CHECK (
        verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')
    ),
    verification_date TIMESTAMP,
    verified_by VARCHAR(255),
    verification_notes TEXT,
    
    -- Credit Information
    credit_score INTEGER CHECK (credit_score BETWEEN 0 AND 100),
    credit_rating VARCHAR(10),
    credit_limit_usd DECIMAL(15,2),
    payment_history_score INTEGER CHECK (payment_history_score BETWEEN 0 AND 100),
    
    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'UNKNOWN' CHECK (
        risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN')
    ),
    risk_score DECIMAL(5,2) CHECK (risk_score BETWEEN 0 AND 100),
    sanctions_check_status VARCHAR(50),
    sanctions_check_date TIMESTAMP,
    sanctions_list_matches TEXT[],
    
    -- Trade History
    total_contracts INTEGER DEFAULT 0,
    successful_contracts INTEGER DEFAULT 0,
    failed_contracts INTEGER DEFAULT 0,
    disputed_contracts INTEGER DEFAULT 0,
    average_payment_days DECIMAL(5,2),
    last_contract_date DATE,
    
    -- Reputation
    reputation_score DECIMAL(3,2) CHECK (reputation_score BETWEEN 0 AND 5),
    total_reviews INTEGER DEFAULT 0,
    
    -- Documents (IPFS CIDs)
    business_license_cid TEXT,
    tax_certificate_cid TEXT,
    bank_reference_cid TEXT,
    trade_references_cid TEXT[],
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT unique_buyer_registration UNIQUE (registration_number, country)
);

CREATE INDEX idx_buyer_registry_country ON buyer_registry(country);
CREATE INDEX idx_buyer_registry_verification_status ON buyer_registry(verification_status);
CREATE INDEX idx_buyer_registry_risk_level ON buyer_registry(risk_level);
CREATE INDEX idx_buyer_registry_company_name ON buyer_registry(company_name);

-- Buyer Verification Records (Audit Trail)
CREATE TABLE IF NOT EXISTS buyer_verification_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyer_registry(buyer_id) ON DELETE CASCADE,
    
    verification_type VARCHAR(50) NOT NULL CHECK (
        verification_type IN ('CREDIT_CHECK', 'SANCTIONS_SCREENING', 'COMPANY_REGISTRY', 
                              'BANK_REFERENCE', 'TRADE_REFERENCE', 'MANUAL_REVIEW')
    ),
    
    provider VARCHAR(100), -- e.g., 'Dun & Bradstreet', 'Creditsafe', 'OFAC'
    
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('PENDING', 'PASSED', 'FAILED', 'ERROR', 'EXPIRED')
    ),
    
    score DECIMAL(5,2),
    details JSONB,
    raw_response JSONB,
    
    verified_by UUID,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    valid_until TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_verification_buyer_id ON buyer_verification_records(buyer_id);
CREATE INDEX idx_buyer_verification_type ON buyer_verification_records(verification_type);
CREATE INDEX idx_buyer_verification_status ON buyer_verification_records(status);

-- Buyer Reviews and Ratings
CREATE TABLE IF NOT EXISTS buyer_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyer_registry(buyer_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    contract_id UUID, -- reference to completed contract
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    payment_punctuality INTEGER CHECK (payment_punctuality BETWEEN 1 AND 5),
    communication_quality INTEGER CHECK (communication_quality BETWEEN 1 AND 5),
    dispute_resolution INTEGER CHECK (dispute_resolution BETWEEN 1 AND 5),
    professionalism INTEGER CHECK (professionalism BETWEEN 1 AND 5),
    
    -- Feedback
    comments TEXT,
    would_trade_again BOOLEAN,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_review_per_contract UNIQUE (exporter_id, contract_id)
);

CREATE INDEX idx_buyer_reviews_buyer_id ON buyer_reviews(buyer_id);
CREATE INDEX idx_buyer_reviews_exporter_id ON buyer_reviews(exporter_id);
CREATE INDEX idx_buyer_reviews_rating ON buyer_reviews(overall_rating);

-- ============================================================================
-- Phase 2: Contract Negotiation & Drafts
-- ============================================================================

-- Contract Drafts with Versioning
CREATE TABLE IF NOT EXISTS contract_drafts (
    draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(100),
    version INTEGER DEFAULT 1,
    
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'OFFERED', 'COUNTERED', 'ACCEPTED', 'REJECTED', 
                   'EXPIRED', 'WITHDRAWN', 'FINALIZED')
    ),
    
    -- Parties
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    buyer_id UUID NOT NULL REFERENCES buyer_registry(buyer_id),
    
    -- Basic Contract Terms
    coffee_type VARCHAR(100) NOT NULL,
    origin_region VARCHAR(100),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    total_value DECIMAL(15,2) NOT NULL,
    
    -- Payment & Delivery Terms
    payment_terms VARCHAR(255),
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('LC', 'CAD', 'TT', 'DP', 'DA', 'OA')
    ),
    payment_due_days INTEGER,
    incoterms VARCHAR(50) CHECK (
        incoterms IN ('EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 
                      'FAS', 'FOB', 'CFR', 'CIF')
    ),
    delivery_date DATE,
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    
    -- Legal Framework
    governing_law VARCHAR(100) DEFAULT 'CISG',
    governing_law_details TEXT,
    arbitration_location VARCHAR(100),
    arbitration_rules VARCHAR(100),
    contract_language VARCHAR(50) DEFAULT 'English',
    
    -- Force Majeure
    force_majeure_clause TEXT,
    force_majeure_notification_days INTEGER DEFAULT 7,
    
    -- Quality Specifications
    quality_grade VARCHAR(50),
    moisture_content_max DECIMAL(4,2),
    defect_count_max INTEGER,
    cup_score_min DECIMAL(4,2),
    quality_standards TEXT,
    
    -- Packaging Requirements
    bag_type VARCHAR(100),
    bag_weight_kg DECIMAL(6,2) DEFAULT 60,
    marking_requirements TEXT,
    packaging_standards TEXT,
    
    -- Inspection & Sampling
    inspection_rights TEXT,
    sampling_procedure TEXT,
    quality_dispute_resolution TEXT,
    
    -- Special Terms
    special_conditions TEXT,
    certifications_required TEXT[],
    insurance_requirements TEXT,
    
    -- Negotiation Tracking
    proposed_by VARCHAR(255) NOT NULL,
    proposed_by_type VARCHAR(50) CHECK (proposed_by_type IN ('EXPORTER', 'BUYER')),
    proposed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    responded_by VARCHAR(255),
    responded_by_type VARCHAR(50) CHECK (responded_by_type IN ('EXPORTER', 'BUYER')),
    responded_at TIMESTAMP,
    response_type VARCHAR(50) CHECK (
        response_type IN ('ACCEPT', 'COUNTER', 'REJECT', 'REQUEST_CHANGES')
    ),
    response_notes TEXT,
    
    -- Offer Validity
    offer_valid_until TIMESTAMP,
    
    -- Version Control
    parent_draft_id UUID REFERENCES contract_drafts(draft_id),
    finalized_contract_id UUID, -- reference to blockchain contract
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_drafts_exporter ON contract_drafts(exporter_id);
CREATE INDEX idx_contract_drafts_buyer ON contract_drafts(buyer_id);
CREATE INDEX idx_contract_drafts_status ON contract_drafts(status);
CREATE INDEX idx_contract_drafts_contract_number ON contract_drafts(contract_number);
CREATE INDEX idx_contract_drafts_parent ON contract_drafts(parent_draft_id);

-- Contract Negotiation History
CREATE TABLE IF NOT EXISTS contract_negotiations (
    negotiation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
    
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('EXPORTER', 'BUYER', 'SYSTEM')),
    actor_name VARCHAR(255),
    
    action_type VARCHAR(50) NOT NULL CHECK (
        action_type IN ('CREATE', 'PROPOSE', 'COUNTER', 'ACCEPT', 'REJECT', 
                        'COMMENT', 'MODIFY', 'WITHDRAW', 'EXPIRE')
    ),
    
    changes_made JSONB, -- field-level change tracking
    previous_values JSONB,
    new_values JSONB,
    
    message TEXT,
    attachments TEXT[], -- CIDs
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_negotiations_draft ON contract_negotiations(draft_id);
CREATE INDEX idx_contract_negotiations_actor ON contract_negotiations(actor_id);
CREATE INDEX idx_contract_negotiations_action ON contract_negotiations(action_type);
CREATE INDEX idx_contract_negotiations_created ON contract_negotiations(created_at);

-- ============================================================================
-- Phase 3: Buyer Marketplace & Discovery
-- ============================================================================

-- Buyer Opportunities (Buyer Posts Requirements)
CREATE TABLE IF NOT EXISTS buyer_opportunities (
    opportunity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyer_registry(buyer_id),
    
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Coffee Requirements
    coffee_type VARCHAR(100) NOT NULL,
    origin_preferences TEXT[],
    quality_grade_min VARCHAR(50),
    quantity_min DECIMAL(15,2) NOT NULL,
    quantity_max DECIMAL(15,2),
    
    -- Frequency
    frequency VARCHAR(50) CHECK (
        frequency IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')
    ),
    contract_duration_months INTEGER,
    
    -- Terms Preferences
    preferred_payment_terms TEXT[],
    preferred_incoterms TEXT[],
    target_price_min DECIMAL(10,2),
    target_price_max DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Certifications & Standards
    certifications_required TEXT[],
    quality_standards_required TEXT[],
    
    -- Delivery
    preferred_delivery_months TEXT[],
    destination_port VARCHAR(255),
    destination_country VARCHAR(100),
    
    -- Status & Visibility
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('DRAFT', 'OPEN', 'IN_NEGOTIATION', 'CLOSED', 'EXPIRED', 'CANCELLED')
    ),
    visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC' CHECK (
        visibility IN ('PUBLIC', 'VERIFIED_ONLY', 'INVITED_ONLY', 'PRIVATE')
    ),
    
    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    
    -- Engagement
    views_count INTEGER DEFAULT 0,
    expressions_of_interest INTEGER DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_opportunities_buyer ON buyer_opportunities(buyer_id);
CREATE INDEX idx_buyer_opportunities_status ON buyer_opportunities(status);
CREATE INDEX idx_buyer_opportunities_coffee_type ON buyer_opportunities(coffee_type);
CREATE INDEX idx_buyer_opportunities_valid_until ON buyer_opportunities(valid_until);

-- Exporter-Buyer Matches (AI/Algorithm Generated)
CREATE TABLE IF NOT EXISTS exporter_buyer_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES buyer_opportunities(opportunity_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    match_score DECIMAL(3,2) CHECK (match_score BETWEEN 0 AND 1),
    match_reasons TEXT[],
    match_details JSONB,
    
    status VARCHAR(50) NOT NULL DEFAULT 'SUGGESTED' CHECK (
        status IN ('SUGGESTED', 'VIEWED', 'INTERESTED', 'CONTACTED', 
                   'NEGOTIATING', 'CONTRACTED', 'DECLINED', 'EXPIRED')
    ),
    
    exporter_notes TEXT,
    
    contacted_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_match UNIQUE (opportunity_id, exporter_id)
);

CREATE INDEX idx_matches_opportunity ON exporter_buyer_matches(opportunity_id);
CREATE INDEX idx_matches_exporter ON exporter_buyer_matches(exporter_id);
CREATE INDEX idx_matches_status ON exporter_buyer_matches(status);
CREATE INDEX idx_matches_score ON exporter_buyer_matches(match_score DESC);

-- Trade Events (Fairs, Conferences, Webinars)
CREATE TABLE IF NOT EXISTS trade_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(500) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN ('TRADE_FAIR', 'CONFERENCE', 'WEBINAR', 'NETWORKING', 
                       'WORKSHOP', 'EXHIBITION', 'B2B_MEETING')
    ),
    
    organizer VARCHAR(255),
    organizer_website VARCHAR(255),
    
    location VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    venue VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    focus_areas TEXT[],
    target_audience TEXT[],
    expected_attendees INTEGER,
    
    registration_url TEXT,
    website_url TEXT,
    
    registration_deadline DATE,
    registration_fee_usd DECIMAL(10,2),
    
    description TEXT,
    
    status VARCHAR(50) DEFAULT 'UPCOMING' CHECK (
        status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')
    ),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_events_type ON trade_events(event_type);
CREATE INDEX idx_trade_events_country ON trade_events(country);
CREATE INDEX idx_trade_events_start_date ON trade_events(start_date);
CREATE INDEX idx_trade_events_status ON trade_events(status);

-- Exporter Event Participation
CREATE TABLE IF NOT EXISTS exporter_event_participation (
    participation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES trade_events(event_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    participation_type VARCHAR(50) CHECK (
        participation_type IN ('EXHIBITOR', 'ATTENDEE', 'SPEAKER', 'SPONSOR', 'ORGANIZER')
    ),
    
    booth_number VARCHAR(50),
    booth_location VARCHAR(255),
    
    leads_generated INTEGER DEFAULT 0,
    meetings_scheduled INTEGER DEFAULT 0,
    contracts_resulted INTEGER DEFAULT 0,
    
    investment_usd DECIMAL(10,2),
    roi_assessment VARCHAR(50) CHECK (
        roi_assessment IN ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'TOO_EARLY')
    ),
    
    notes TEXT,
    follow_up_actions TEXT[],
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_participation UNIQUE (event_id, exporter_id)
);

CREATE INDEX idx_participation_event ON exporter_event_participation(event_id);
CREATE INDEX idx_participation_exporter ON exporter_event_participation(exporter_id);

-- ============================================================================
-- Phase 4: Legal Framework & Compliance
-- ============================================================================

-- Legal Frameworks (CISG, National Laws, etc.)
CREATE TABLE IF NOT EXISTS legal_frameworks (
    framework_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_code VARCHAR(50) UNIQUE NOT NULL,
    framework_name VARCHAR(255) NOT NULL,
    framework_type VARCHAR(50) CHECK (
        framework_type IN ('INTERNATIONAL_CONVENTION', 'NATIONAL_LAW', 
                           'TRADE_AGREEMENT', 'INDUSTRY_STANDARD')
    ),
    
    jurisdiction VARCHAR(100),
    applicable_countries TEXT[],
    
    description TEXT,
    key_provisions TEXT,
    applicability_notes TEXT,
    
    official_url TEXT,
    reference_documents TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legal_frameworks_code ON legal_frameworks(framework_code);
CREATE INDEX idx_legal_frameworks_type ON legal_frameworks(framework_type);

-- Insert Default Legal Frameworks
INSERT INTO legal_frameworks (framework_code, framework_name, framework_type, description) VALUES
('CISG', 'UN Convention on Contracts for the International Sale of Goods', 'INTERNATIONAL_CONVENTION', 
 'International treaty governing international sales of goods between parties from different countries'),
('ETHIOPIAN_LAW', 'Ethiopian Commercial Code', 'NATIONAL_LAW', 
 'Ethiopian national law governing commercial transactions'),
('ICC_RULES', 'ICC Rules for Arbitration', 'INDUSTRY_STANDARD', 
 'International Chamber of Commerce arbitration rules'),
('UNCITRAL', 'UNCITRAL Arbitration Rules', 'INTERNATIONAL_CONVENTION', 
 'United Nations Commission on International Trade Law arbitration rules')
ON CONFLICT (framework_code) DO NOTHING;

-- Contract Clauses Library
CREATE TABLE IF NOT EXISTS contract_clauses (
    clause_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_code VARCHAR(100) UNIQUE NOT NULL,
    clause_type VARCHAR(100) NOT NULL CHECK (
        clause_type IN ('FORCE_MAJEURE', 'ARBITRATION', 'WARRANTY', 'INSPECTION', 
                        'PAYMENT', 'DELIVERY', 'QUALITY', 'DISPUTE_RESOLUTION', 
                        'CONFIDENTIALITY', 'TERMINATION', 'LIABILITY', 'INSURANCE')
    ),
    clause_name VARCHAR(255) NOT NULL,
    
    template_text TEXT NOT NULL,
    variables JSONB, -- {placeholder: description} for customization
    
    legal_framework_id UUID REFERENCES legal_frameworks(framework_id),
    
    recommended_for TEXT[], -- scenarios or contract types
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    
    lawyer_reviewed BOOLEAN DEFAULT FALSE,
    last_reviewed_date DATE,
    reviewed_by VARCHAR(255),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_clauses_type ON contract_clauses(clause_type);
CREATE INDEX idx_contract_clauses_framework ON contract_clauses(legal_framework_id);

-- Contract Templates
CREATE TABLE IF NOT EXISTS contract_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) CHECK (
        template_type IN ('STANDARD', 'PREMIUM', 'ORGANIC', 'SPECIALTY', 
                          'BULK', 'SPOT', 'LONG_TERM')
    ),
    
    description TEXT,
    
    -- Included Clauses
    clause_ids UUID[],
    
    -- Default Terms
    default_governing_law VARCHAR(100),
    default_arbitration_location VARCHAR(100),
    default_arbitration_rules VARCHAR(100),
    default_language VARCHAR(50) DEFAULT 'English',
    
    recommended_for TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_templates_type ON contract_templates(template_type);

-- ============================================================================
-- Phase 5: Dispute Resolution
-- ============================================================================

-- Contract Disputes
CREATE TABLE IF NOT EXISTS contract_disputes (
    dispute_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL, -- reference to finalized contract (blockchain or sales_contracts)
    contract_number VARCHAR(100),
    
    -- Parties
    raised_by VARCHAR(255) NOT NULL,
    raised_by_type VARCHAR(50) CHECK (raised_by_type IN ('EXPORTER', 'BUYER')),
    raised_against VARCHAR(255) NOT NULL,
    
    -- Dispute Details
    dispute_type VARCHAR(100) NOT NULL CHECK (
        dispute_type IN ('QUALITY', 'PAYMENT', 'DELIVERY', 'QUANTITY', 
                         'DOCUMENTATION', 'BREACH_OF_CONTRACT', 'OTHER')
    ),
    severity VARCHAR(50) NOT NULL CHECK (
        severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    evidence_documents TEXT[], -- CIDs
    
    -- Financial Impact
    claimed_amount DECIMAL(15,2),
    currency VARCHAR(10),
    
    -- Resolution Process
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('OPEN', 'UNDER_REVIEW', 'MEDIATION', 'ARBITRATION', 
                   'LEGAL_ACTION', 'RESOLVED', 'CLOSED', 'WITHDRAWN')
    ),
    resolution_method VARCHAR(50) CHECK (
        resolution_method IN ('DIRECT_NEGOTIATION', 'MEDIATION', 'ARBITRATION', 
                              'LEGAL_PROCEEDINGS', 'SETTLEMENT')
    ),
    
    mediator_id VARCHAR(255),
    mediator_name VARCHAR(255),
    arbitrator_id VARCHAR(255),
    arbitrator_name VARCHAR(255),
    
    resolution_notes TEXT,
    resolution_date TIMESTAMP,
    resolution_documents TEXT[], -- CIDs
    
    awarded_amount DECIMAL(15,2),
    awarded_to VARCHAR(255),
    
    -- Timeline
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_disputes_contract ON contract_disputes(contract_id);
CREATE INDEX idx_disputes_raised_by ON contract_disputes(raised_by);
CREATE INDEX idx_disputes_status ON contract_disputes(status);
CREATE INDEX idx_disputes_type ON contract_disputes(dispute_type);
CREATE INDEX idx_disputes_severity ON contract_disputes(severity);

-- Dispute Activity Log
CREATE TABLE IF NOT EXISTS dispute_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES contract_disputes(dispute_id) ON DELETE CASCADE,
    
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(50),
    actor_name VARCHAR(255),
    
    activity_type VARCHAR(100) CHECK (
        activity_type IN ('CREATED', 'COMMENT', 'EVIDENCE_ADDED', 'STATUS_CHANGED', 
                          'MEDIATOR_ASSIGNED', 'OFFER_MADE', 'OFFER_ACCEPTED', 
                          'OFFER_REJECTED', 'RESOLVED', 'CLOSED')
    ),
    
    description TEXT,
    details JSONB,
    attachments TEXT[], -- CIDs
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dispute_activities_dispute ON dispute_activities(dispute_id);
CREATE INDEX idx_dispute_activities_created ON dispute_activities(created_at);

-- ============================================================================
-- Update Existing sales_contracts Table
-- ============================================================================

-- Add new columns to existing sales_contracts table
ALTER TABLE sales_contracts 
ADD COLUMN IF NOT EXISTS governing_law VARCHAR(100),
ADD COLUMN IF NOT EXISTS arbitration_location VARCHAR(100),
ADD COLUMN IF NOT EXISTS arbitration_rules VARCHAR(100),
ADD COLUMN IF NOT EXISTS force_majeure_clause TEXT,
ADD COLUMN IF NOT EXISTS contract_language VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyer_registry(buyer_id),
ADD COLUMN IF NOT EXISTS draft_id UUID REFERENCES contract_drafts(draft_id);

-- ============================================================================
-- Triggers for Updated Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buyer_registry_updated_at BEFORE UPDATE ON buyer_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_drafts_updated_at BEFORE UPDATE ON contract_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_opportunities_updated_at BEFORE UPDATE ON buyer_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_disputes_updated_at BEFORE UPDATE ON contract_disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Active Buyer Opportunities with Buyer Details
CREATE OR REPLACE VIEW v_active_opportunities AS
SELECT 
    o.*,
    b.company_name as buyer_company_name,
    b.country as buyer_country,
    b.verification_status,
    b.risk_level,
    b.reputation_score
FROM buyer_opportunities o
JOIN buyer_registry b ON o.buyer_id = b.buyer_id
WHERE o.status = 'OPEN' 
  AND o.valid_until >= CURRENT_DATE;

-- Verified Buyers with Good Reputation
CREATE OR REPLACE VIEW v_verified_buyers AS
SELECT 
    buyer_id,
    company_name,
    country,
    verification_status,
    credit_score,
    risk_level,
    reputation_score,
    total_contracts,
    successful_contracts,
    average_payment_days
FROM buyer_registry
WHERE verification_status = 'VERIFIED'
  AND risk_level IN ('LOW', 'MEDIUM')
  AND (reputation_score IS NULL OR reputation_score >= 3.5);

-- Contract Negotiation Summary
CREATE OR REPLACE VIEW v_negotiation_summary AS
SELECT 
    d.draft_id,
    d.contract_number,
    d.version,
    d.status,
    d.exporter_id,
    d.buyer_id,
    b.company_name as buyer_name,
    d.coffee_type,
    d.quantity,
    d.total_value,
    d.currency,
    d.proposed_at,
    d.responded_at,
    COUNT(n.negotiation_id) as negotiation_count,
    MAX(n.created_at) as last_activity
FROM contract_drafts d
LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id
LEFT JOIN contract_negotiations n ON d.draft_id = n.draft_id
GROUP BY d.draft_id, d.contract_number, d.version, d.status, d.exporter_id, 
         d.buyer_id, b.company_name, d.coffee_type, d.quantity, d.total_value, 
         d.currency, d.proposed_at, d.responded_at;

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert sample legal clauses
INSERT INTO contract_clauses (clause_code, clause_type, clause_name, template_text, variables) VALUES
('FM_STANDARD', 'FORCE_MAJEURE', 'Standard Force Majeure Clause', 
 'Neither party shall be liable for any failure or delay in performing their obligations under this Contract where such failure or delay results from any cause beyond the reasonable control of that party, including but not limited to acts of God, war, civil unrest, government restrictions, natural disasters, or pandemics. The affected party shall notify the other party within {{notification_days}} days of the force majeure event.',
 '{"notification_days": "Number of days for notification (default: 7)"}'::jsonb),
 
('ARB_ICC', 'ARBITRATION', 'ICC Arbitration Clause',
 'Any dispute arising out of or in connection with this contract shall be finally settled under the Rules of Arbitration of the International Chamber of Commerce by one or more arbitrators appointed in accordance with the said Rules. The place of arbitration shall be {{arbitration_location}}. The language of arbitration shall be {{language}}.',
 '{"arbitration_location": "City and country", "language": "Language of proceedings"}'::jsonb)
ON CONFLICT (clause_code) DO NOTHING;

COMMENT ON TABLE buyer_registry IS 'Central registry of verified international coffee buyers';
COMMENT ON TABLE contract_drafts IS 'Contract negotiation drafts with version control';
COMMENT ON TABLE buyer_opportunities IS 'Buyer requirements posted for exporter matching';
COMMENT ON TABLE contract_disputes IS 'Dispute resolution tracking system';
