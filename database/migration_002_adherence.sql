-- Migration 002: Add Medication Adherence Tracking
-- Health Center Appointment & Medication Reminder System
-- Date: 2025-12-16

-- ============================================
-- Part 1: Add Adherence Fields to Reminders Table
-- ============================================

-- Add adherence confirmation fields
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS adherence_confirmed BOOLEAN DEFAULT NULL;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS confirmation_method VARCHAR(20); -- ussd, sms_reply, web

-- Add index for adherence queries
CREATE INDEX IF NOT EXISTS idx_reminders_adherence ON reminders(adherence_confirmed) WHERE adherence_confirmed IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_type_status ON reminders(type, status);

-- ============================================
-- Part 2: Create Essential Medicines Table
-- ============================================

-- Create essential medicines reference table
CREATE TABLE IF NOT EXISTS essential_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_name VARCHAR(255) NOT NULL,
    medicine_name_kinyarwanda VARCHAR(255),
    category VARCHAR(100), -- antibiotic, analgesic, antimalarial, antihypertensive, etc.
    standard_dosage VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for essential medicines
CREATE INDEX IF NOT EXISTS idx_essential_medicines_name ON essential_medicines(medicine_name);
CREATE INDEX IF NOT EXISTS idx_essential_medicines_category ON essential_medicines(category);
CREATE INDEX IF NOT EXISTS idx_essential_medicines_active ON essential_medicines(is_active) WHERE is_active = true;

-- Create trigger for updated_at on essential_medicines
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_essential_medicines_updated_at'
    ) THEN
        CREATE TRIGGER update_essential_medicines_updated_at 
            BEFORE UPDATE ON essential_medicines
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ============================================
-- Part 3: Seed Essential Medicines Data
-- ============================================

-- Insert common essential medicines for Rwanda
INSERT INTO essential_medicines (medicine_name, medicine_name_kinyarwanda, category, standard_dosage) VALUES
    ('Paracetamol', 'Paracetamol', 'analgesic', '500mg'),
    ('Ibuprofen', 'Ibuprofen', 'analgesic', '400mg'),
    ('Amoxicillin', 'Amoxicillin', 'antibiotic', '500mg'),
    ('Metronidazole', 'Metronidazole', 'antibiotic', '500mg'),
    ('Artemether-Lumefantrine (Coartem)', 'Coartem', 'antimalarial', '20mg/120mg'),
    ('Quinine', 'Quinine', 'antimalarial', '300mg'),
    ('Oral Rehydration Salts (ORS)', 'ORS', 'rehydration', '1 sachet'),
    ('Zinc Sulfate', 'Zinc', 'supplement', '20mg'),
    ('Vitamin A', 'Vitamin A', 'supplement', '200,000 IU'),
    ('Folic Acid', 'Folic Acid', 'supplement', '5mg'),
    ('Ferrous Sulfate', 'Ferrous Sulfate', 'supplement', '200mg'),
    ('Albendazole', 'Albendazole', 'antiparasitic', '400mg'),
    ('Mebendazole', 'Mebendazole', 'antiparasitic', '500mg'),
    ('Ciprofloxacin', 'Ciprofloxacin', 'antibiotic', '500mg'),
    ('Cotrimoxazole', 'Cotrimoxazole', 'antibiotic', '960mg'),
    ('Amlodipine', 'Amlodipine', 'antihypertensive', '5mg'),
    ('Enalapril', 'Enalapril', 'antihypertensive', '10mg'),
    ('Hydrochlorothiazide', 'Hydrochlorothiazide', 'antihypertensive', '25mg'),
    ('Metformin', 'Metformin', 'antidiabetic', '500mg'),
    ('Glibenclamide', 'Glibenclamide', 'antidiabetic', '5mg'),
    ('Salbutamol Inhaler', 'Salbutamol', 'bronchodilator', '100mcg'),
    ('Omeprazole', 'Omeprazole', 'antacid', '20mg'),
    ('Diazepam', 'Diazepam', 'anxiolytic', '5mg'),
    ('Phenytoin', 'Phenytoin', 'anticonvulsant', '100mg'),
    ('Carbamazepine', 'Carbamazepine', 'anticonvulsant', '200mg')
ON CONFLICT DO NOTHING;

-- ============================================
-- Part 4: Verification Queries
-- ============================================

-- Verify adherence columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reminders' AND column_name = 'adherence_confirmed'
    ) THEN
        RAISE NOTICE 'SUCCESS: adherence_confirmed column added to reminders table';
    ELSE
        RAISE EXCEPTION 'FAILED: adherence_confirmed column not found in reminders table';
    END IF;
END
$$;

-- Verify essential_medicines table was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'essential_medicines'
    ) THEN
        RAISE NOTICE 'SUCCESS: essential_medicines table created';
    ELSE
        RAISE EXCEPTION 'FAILED: essential_medicines table not found';
    END IF;
END
$$;

-- Display migration summary
SELECT 
    'Migration 002 Completed' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'adherence_confirmed') as adherence_column_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'essential_medicines') as medicines_table_exists,
    (SELECT COUNT(*) FROM essential_medicines) as medicines_count;
