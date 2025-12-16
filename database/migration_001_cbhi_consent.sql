-- Migration 001: Add CBHI and Patient Consent Tracking
-- Health Center Appointment & Medication Reminder System
-- Date: 2025-12-16

-- ============================================
-- Part 1: Add CBHI Number to Patients Table
-- ============================================

-- Add CBHI number column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cbhi_number VARCHAR(20);

-- Add index for CBHI lookups (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_patients_cbhi ON patients(cbhi_number) WHERE cbhi_number IS NOT NULL;

-- ============================================
-- Part 2: Create Patient Consent Table
-- ============================================

-- Create patient consent tracking table
CREATE TABLE IF NOT EXISTS patient_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- sms_notifications, data_sharing, treatment
    consent_given BOOLEAN NOT NULL,
    consent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consent_method VARCHAR(20), -- ussd, web, verbal, written
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for patient consent
CREATE INDEX IF NOT EXISTS idx_patient_consent_patient ON patient_consent(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consent_type ON patient_consent(consent_type);
CREATE INDEX IF NOT EXISTS idx_patient_consent_date ON patient_consent(consent_date);

-- Create trigger for updated_at on patient_consent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_consent_updated_at'
    ) THEN
        CREATE TRIGGER update_patient_consent_updated_at 
            BEFORE UPDATE ON patient_consent
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ============================================
-- Part 3: Verification Queries
-- ============================================

-- Verify CBHI column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'cbhi_number'
    ) THEN
        RAISE NOTICE 'SUCCESS: cbhi_number column added to patients table';
    ELSE
        RAISE EXCEPTION 'FAILED: cbhi_number column not found in patients table';
    END IF;
END
$$;

-- Verify patient_consent table was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'patient_consent'
    ) THEN
        RAISE NOTICE 'SUCCESS: patient_consent table created';
    ELSE
        RAISE EXCEPTION 'FAILED: patient_consent table not found';
    END IF;
END
$$;

-- Display migration summary
SELECT 
    'Migration 001 Completed' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'cbhi_number') as cbhi_column_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'patient_consent') as consent_table_exists;
