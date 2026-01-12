-- Seed Test Data for exporter1
-- This creates a complete exporter profile with all applications

-- Get the user_id for exporter1
DO $$
DECLARE
    v_user_id TEXT;
    v_exporter_id TEXT;
    v_lab_id TEXT;
    v_taster_id TEXT;
    v_competence_id TEXT;
    v_license_id TEXT;
BEGIN
    -- Get user_id
    SELECT id INTO v_user_id FROM users WHERE username = 'exporter1';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User exporter1 not found. Please create the user first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user_id: %', v_user_id;
    
    -- Check if profile already exists
    SELECT exporter_id INTO v_exporter_id FROM exporter_profiles WHERE user_id = v_user_id;
    
    IF v_exporter_id IS NOT NULL THEN
        RAISE NOTICE 'Exporter profile already exists with ID: %', v_exporter_id;
    ELSE
        -- Create exporter profile
        v_exporter_id := 'EXP-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO exporter_profiles (
            exporter_id,
            user_id,
            business_name,
            tin,
            registration_number,
            business_type,
            minimum_capital,
            capital_verified,
            office_address,
            city,
            region,
            contact_person,
            email,
            phone,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_exporter_id,
            v_user_id,
            'Test Coffee Exporter Ltd',
            'TIN-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10),
            'ECTA-PVT-2024-' || FLOOR(RANDOM() * 9000 + 1000)::TEXT,
            'PRIVATE',
            15000000,
            true,
            'Bole Road, Addis Ababa',
            'Addis Ababa',
            'Addis Ababa',
            'John Doe',
            'exporter1@example.com',
            '+251911234567',
            'PENDING_APPROVAL',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created exporter profile: %', v_exporter_id;
    END IF;
    
    -- Create laboratory if doesn't exist
    SELECT laboratory_id INTO v_lab_id FROM coffee_laboratories WHERE exporter_id = v_exporter_id;
    
    IF v_lab_id IS NULL THEN
        v_lab_id := 'LAB-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO coffee_laboratories (
            laboratory_id,
            exporter_id,
            laboratory_name,
            address,
            city,
            region,
            equipment,
            has_roasting_facility,
            has_cupping_room,
            has_sample_storage,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_lab_id,
            v_exporter_id,
            'Test Coffee Laboratory',
            'Industrial Area, Addis Ababa',
            'Addis Ababa',
            'Addis Ababa',
            ARRAY['Roaster', 'Cupping Table', 'Moisture Meter', 'Sample Storage'],
            true,
            true,
            true,
            'PENDING',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created laboratory: %', v_lab_id;
    END IF;
    
    -- Create taster if doesn't exist
    SELECT taster_id INTO v_taster_id FROM coffee_tasters WHERE exporter_id = v_exporter_id;
    
    IF v_taster_id IS NULL THEN
        v_taster_id := 'TASTER-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO coffee_tasters (
            taster_id,
            exporter_id,
            full_name,
            date_of_birth,
            national_id,
            qualification_level,
            proficiency_certificate_number,
            certificate_issue_date,
            certificate_expiry_date,
            employment_start_date,
            is_exclusive_employee,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_taster_id,
            v_exporter_id,
            'Jane Smith',
            '1985-05-15',
            'ID-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10),
            'Q Grader',
            'QG-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10),
            NOW() - INTERVAL '1 year',
            NOW() + INTERVAL '2 years',
            NOW() - INTERVAL '6 months',
            true,
            'PENDING',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created taster: %', v_taster_id;
    END IF;
    
    -- Create competence certificate if doesn't exist
    SELECT certificate_id INTO v_competence_id FROM competence_certificates WHERE exporter_id = v_exporter_id;
    
    IF v_competence_id IS NULL THEN
        v_competence_id := 'COMP-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO competence_certificates (
            certificate_id,
            exporter_id,
            laboratory_id,
            taster_id,
            application_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_competence_id,
            v_exporter_id,
            v_lab_id,
            v_taster_id,
            NOW(),
            'PENDING',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created competence certificate: %', v_competence_id;
    END IF;
    
    -- Create export license if doesn't exist
    SELECT license_id INTO v_license_id FROM export_licenses WHERE exporter_id = v_exporter_id;
    
    IF v_license_id IS NULL THEN
        v_license_id := 'LIC-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO export_licenses (
            license_id,
            exporter_id,
            competence_certificate_id,
            eic_registration_number,
            requested_coffee_types,
            requested_origins,
            application_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_license_id,
            v_exporter_id,
            v_competence_id,
            'EIC-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10),
            ARRAY['ARABICA', 'ROBUSTA'],
            ARRAY['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
            NOW(),
            'PENDING_REVIEW',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created export license: %', v_license_id;
    END IF;
    
    RAISE NOTICE '=== Data seeding complete ===';
    RAISE NOTICE 'Exporter ID: %', v_exporter_id;
    RAISE NOTICE 'Laboratory ID: %', v_lab_id;
    RAISE NOTICE 'Taster ID: %', v_taster_id;
    RAISE NOTICE 'Competence ID: %', v_competence_id;
    RAISE NOTICE 'License ID: %', v_license_id;
END $$;
