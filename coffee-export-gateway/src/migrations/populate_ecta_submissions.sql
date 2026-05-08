-- Populate ECTA submissions table with existing finalized contracts
-- This migration adds all existing finalized contracts to the submissions tracking table

INSERT INTO ecta_contract_submissions (
  draft_id,
  ecta_reference_number,
  exporter_id,
  buyer_id,
  submission_status,
  submitted_at,
  registered_at,
  registered_by,
  contract_data
)
SELECT 
  cd.draft_id,
  cd.ecta_reference_number,
  cd.exporter_id,
  cd.buyer_id,
  CASE 
    WHEN cd.registered_at IS NOT NULL THEN 'REGISTERED'
    ELSE 'PENDING_REGISTRATION'
  END as submission_status,
  cd.updated_at as submitted_at,
  cd.registered_at,
  CAST(cd.registered_by AS VARCHAR(255)),
  jsonb_build_object(
    'coffeeType', cd.coffee_type,
    'quantity', cd.quantity,
    'totalValue', cd.total_value,
    'exporterName', ep.business_name,
    'buyerName', br.company_name,
    'buyerCountry', br.country
  ) as contract_data
FROM contract_drafts cd
JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
WHERE cd.status = 'FINALIZED'
  AND cd.ecta_reference_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ecta_contract_submissions ecs 
    WHERE ecs.draft_id = cd.draft_id
  );

-- Display results
SELECT 
  COUNT(*) as total_inserted,
  COUNT(*) FILTER (WHERE submission_status = 'PENDING_REGISTRATION') as pending,
  COUNT(*) FILTER (WHERE submission_status = 'REGISTERED') as registered
FROM ecta_contract_submissions;
