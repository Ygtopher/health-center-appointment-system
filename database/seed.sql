-- Seed data for development and testing
-- Health Centers
INSERT INTO health_centers (name, name_kinyarwanda, code, district, sector, phone, capacity, operating_hours) VALUES
('Kigali Health Center', 'Ihuriro ry''Ubuzima kwa Kigali', 'KGL-HC-001', 'Kigali', 'Nyarugenge', '+250788123456', 100, '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": {"open": "closed", "close": "closed"}}'),
('Butare Health Center', 'Ihuriro ry''Ubuzima kwa Butare', 'BTR-HC-001', 'Huye', 'Butare', '+250788234567', 80, '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": {"open": "closed", "close": "closed"}}'),
('Musanze Health Center', 'Ihuriro ry''Ubuzima kwa Musanze', 'MSZ-HC-001', 'Musanze', 'Musanze', '+250788345678', 60, '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": {"open": "closed", "close": "closed"}}');

-- Sample Patients
INSERT INTO patients (national_id, first_name, last_name, phone_number, date_of_birth, gender, district, preferred_language) VALUES
('1199912345678901', 'Jean', 'Mukamana', '+250788111111', '1985-05-15', 'M', 'Kigali', 'rw'),
('1199912345678902', 'Marie', 'Uwimana', '+250788222222', '1990-08-20', 'F', 'Huye', 'rw'),
('1199912345678903', 'Paul', 'Nkurunziza', '+250788333333', '1988-12-10', 'M', 'Musanze', 'en');

-- Admin User (password will be hashed by seed.js script)
-- Note: Run npm run seed after migration to hash passwords
INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone_number) VALUES
('admin', 'admin@healthcenter.rw', 'temp_hash_will_be_replaced', 'System', 'Administrator', 'admin', '+250788000000');

-- Health Staff Users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, health_center_id, phone_number) VALUES
('doctor.kigali', 'doctor.kigali@healthcenter.rw', 'temp_hash_will_be_replaced', 'Dr. Jean', 'Baptiste', 'health_staff', (SELECT id FROM health_centers WHERE code = 'KGL-HC-001'), '+250788100001'),
('nurse.butare', 'nurse.butare@healthcenter.rw', 'temp_hash_will_be_replaced', 'Nurse', 'Mukamana', 'health_staff', (SELECT id FROM health_centers WHERE code = 'BTR-HC-001'), '+250788200001');

