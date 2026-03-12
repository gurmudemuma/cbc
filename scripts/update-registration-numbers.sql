-- Update existing exporter profiles to have proper registration numbers
-- Format: ECTA-YYYY-NNNNNN

DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
    year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    new_reg_num TEXT;
BEGIN
    -- Update all exporter profiles that have TIN as registration number
    FOR rec IN 
        SELECT user_id, tin, registration_number 
        FROM exporter_profiles 
        WHERE registration_number = tin OR registration_number ~ '^\d+$'
        ORDER BY created_at
    LOOP
        -- Generate new registration number
        new_reg_num := 'ECTA-' || year || '-' || LPAD(counter::TEXT, 6, '0');
        
        -- Update the record
        UPDATE exporter_profiles 
        SET registration_number = new_reg_num,
            updated_at = NOW()
        WHERE user_id = rec.user_id;
        
        RAISE NOTICE 'Updated % from % to %', rec.user_id, rec.registration_number, new_reg_num;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Updated % exporter profiles with new registration numbers', counter - 1;
END $$;

-- Verify the updates
SELECT user_id, business_name, tin, registration_number 
FROM exporter_profiles 
ORDER BY registration_number;
