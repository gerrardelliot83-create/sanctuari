-- Migration 014: Seed Real Network Members (Insurance Companies & Brokers)
-- Date: October 2, 2025
-- Purpose: Add actual partner insurance companies and brokers to network_members table

-- Clear existing network members for fresh seed
DELETE FROM network_members;

-- =====================================================
-- INSURANCE COMPANIES
-- =====================================================

-- Zurich Kotak General Insurance (3 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Zurich Kotak General Insurance',
  'Dhananjai Bisht',
  'Dhananjai.bisht@zurichkotak.com',
  '+91-22-6648-7800',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Liability Insurance', 'Engineering Insurance'],
  4.6,
  'Joint venture between Zurich Insurance Group and Kotak Mahindra Bank, offering comprehensive general insurance solutions for businesses.',
  true
);

-- Add secondary contacts for Zurich Kotak
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Zurich Kotak General Insurance',
  'Sagar Gala',
  'sagar.gala@zurichkotak.com',
  '+91-22-6648-7800',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Liability Insurance', 'Engineering Insurance'],
  4.6,
  'Joint venture between Zurich Insurance Group and Kotak Mahindra Bank, offering comprehensive general insurance solutions for businesses.',
  true
),
(
  'insurer', 'general',
  'Zurich Kotak General Insurance',
  'Pravin Nadkarni',
  'pravin.nadkarni@zurichkotak.com',
  '+91-22-6648-7800',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Liability Insurance', 'Engineering Insurance'],
  4.6,
  'Joint venture between Zurich Insurance Group and Kotak Mahindra Bank, offering comprehensive general insurance solutions for businesses.',
  true
);

-- Liberty General Insurance (2 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Liberty General Insurance',
  'Chirag Gupta',
  'Chirag.Gupta@libertyinsurance.in',
  '+91-80-6718-8000',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Commercial General Liability', 'Motor Fleet'],
  4.4,
  'Part of Liberty Mutual Group, providing innovative general insurance solutions with focus on risk management.',
  true
),
(
  'insurer', 'general',
  'Liberty General Insurance',
  'Girish Tiwari',
  'Girish.tiwari@libertyinsurance.in',
  '+91-80-6718-8000',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Commercial General Liability', 'Motor Fleet'],
  4.4,
  'Part of Liberty Mutual Group, providing innovative general insurance solutions with focus on risk management.',
  true
);

-- Care Health Insurance (2 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'health',
  'Care Health Insurance',
  'Yadnika Dabholkar',
  'yadnika.dhabolkar@careinsurance.com',
  '+91-22-6234-9876',
  ARRAY['Group Health Insurance', 'Group Personal Accident', 'Maternity Coverage', 'Critical Illness'],
  4.3,
  'Standalone health insurance specialist offering comprehensive employee health benefits and wellness programs.',
  true
),
(
  'insurer', 'health',
  'Care Health Insurance',
  'Pritish Govindpurkar',
  'pritish.govindpurkar@careinsurance.com',
  '+91-22-6234-9876',
  ARRAY['Group Health Insurance', 'Group Personal Accident', 'Maternity Coverage', 'Critical Illness'],
  4.3,
  'Standalone health insurance specialist offering comprehensive employee health benefits and wellness programs.',
  true
);

-- Bajaj Allianz General Insurance
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Bajaj Allianz General Insurance',
  'Amrut Gawde',
  'Amrut.Gawde@bajajallianz.co.in',
  '+91-20-3056-7890',
  ARRAY['Fire Insurance', 'Marine Transit', 'Product Liability', 'Cyber Insurance'],
  4.5,
  'Leading general insurer offering comprehensive business insurance solutions with strong claim settlement record.',
  true
);

-- Universal Sompo General Insurance
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Universal Sompo General Insurance',
  'Aditya Singh',
  'aditya.singh@universalsompo.com',
  '+91-22-6784-5000',
  ARRAY['Fire Insurance', 'Engineering Insurance', 'Marine Cargo', 'Liability Insurance'],
  4.2,
  'Joint venture with Sompo Japan, specializing in engineering and industrial risk coverage.',
  true
);

-- Magma HDI General Insurance (3 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Magma HDI General Insurance',
  'Santosh Singh',
  'santosh.singh4@magmainsurance.com',
  '+91-22-6123-4500',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Engineering Insurance', 'Liability Insurance'],
  4.1,
  'Partnership with Talanx International AG (HDI), offering customized insurance solutions for SMEs and corporates.',
  true
),
(
  'insurer', 'general',
  'Magma HDI General Insurance',
  'Jagannath Venkatraman',
  'v.jagannath@magmainsurance.com',
  '+91-22-6123-4500',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Engineering Insurance', 'Liability Insurance'],
  4.1,
  'Partnership with Talanx International AG (HDI), offering customized insurance solutions for SMEs and corporates.',
  true
),
(
  'insurer', 'general',
  'Magma HDI General Insurance',
  'Rahul Salodkar',
  'rahul.salodkar@magmainsurance.com',
  '+91-22-6123-4500',
  ARRAY['Fire Insurance', 'Marine Insurance', 'Engineering Insurance', 'Liability Insurance'],
  4.1,
  'Partnership with Talanx International AG (HDI), offering customized insurance solutions for SMEs and corporates.',
  true
);

-- IFFCO Tokio General Insurance (2 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'IFFCO Tokio General Insurance',
  'Ashish Purwat',
  'ashish.purwat@iffcotokio.co.in',
  '+91-22-6700-2000',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Contractors All Risk', 'Workmen Compensation'],
  4.3,
  'Joint venture with Tokio Marine Group, specializing in agricultural and industrial insurance.',
  true
),
(
  'insurer', 'general',
  'IFFCO Tokio General Insurance',
  'Viraj Jadhav',
  'Viraj.Jadhav@iffcotokio.co.in',
  '+91-22-6700-2000',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Contractors All Risk', 'Workmen Compensation'],
  4.3,
  'Joint venture with Tokio Marine Group, specializing in agricultural and industrial insurance.',
  true
);

-- Shriram General Insurance
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Shriram General Insurance',
  'Chirag Nihalani',
  'chirag.nihalani@shriramgi.com',
  '+91-44-4040-4000',
  ARRAY['Fire Insurance', 'Marine Transit', 'Motor Fleet', 'Engineering Insurance'],
  4.2,
  'Part of Shriram Group, offering affordable general insurance solutions for businesses across India.',
  true
);

-- ICICI Lombard General Insurance (2 contacts)
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'ICICI Lombard General Insurance',
  'Priyanka Ahuja',
  'priyanka.ahuja@icicilombard.com',
  '+91-22-6765-4321',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Cyber Insurance', 'Directors & Officers Liability'],
  4.7,
  'India''s leading private general insurer with comprehensive coverage for all business risks.',
  true
),
(
  'insurer', 'general',
  'ICICI Lombard General Insurance',
  'Nidhi Singh',
  'singh.nidhi@icicilombard.com',
  '+91-22-6765-4321',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Cyber Insurance', 'Directors & Officers Liability'],
  4.7,
  'India''s leading private general insurer with comprehensive coverage for all business risks.',
  true
);

-- Aditya Birla Health Insurance
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'health',
  'Aditya Birla Health Insurance',
  'Dnyaneshwaree Khanvilkar',
  'dnyaneshwaree.khanvilkar@adityabirlacapital.com',
  '+91-22-4356-8000',
  ARRAY['Group Health Insurance', 'Group Personal Accident', 'Critical Illness', 'Wellness Programs'],
  4.4,
  'Part of Aditya Birla Group, offering innovative health insurance with focus on preventive care and wellness.',
  true
);

-- =====================================================
-- INSURANCE BROKERS
-- =====================================================

-- Navnit Insurance Brokers Pvt. Ltd.
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'broker', NULL,
  'Navnit Insurance Brokers Pvt. Ltd.',
  'Mohammad Kantawala',
  'mohammad.kantawala@navnitinsurance.com',
  '+91-22-6234-5678',
  ARRAY['Employee Benefits', 'Fire Insurance', 'Marine Insurance', 'Risk Consulting'],
  4.3,
  'Established insurance broker providing comprehensive risk management and employee benefit solutions.',
  true
);

-- Livlong Insurance Brokers Pvt. Ltd.
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'broker', NULL,
  'Livlong Insurance Brokers Pvt. Ltd.',
  'Gaurav Bagsare',
  'gaurav.bagsare@livlong.com',
  '+91-80-4567-8900',
  ARRAY['Group Health Insurance', 'Wellness Programs', 'Employee Benefits', 'Claims Support'],
  4.4,
  'Specialized health and wellness insurance broker with digital-first approach and employee engagement focus.',
  true
);

-- Mitigata Insurance Brokers Pvt. Ltd.
INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'broker', NULL,
  'Mitigata Insurance Brokers Pvt. Ltd.',
  'Archit Vyas',
  'archit.v@mitigata.com',
  '+91-22-4890-1234',
  ARRAY['Cyber Insurance', 'Directors & Officers Liability', 'Professional Indemnity', 'Risk Advisory'],
  4.5,
  'Modern insurance broker specializing in emerging risks including cyber security and technology liability.',
  true
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
  total_insurers INTEGER;
  total_brokers INTEGER;
  total_contacts INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_insurers FROM network_members WHERE type = 'insurer';
  SELECT COUNT(*) INTO total_brokers FROM network_members WHERE type = 'broker';
  SELECT COUNT(*) INTO total_contacts FROM network_members;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 014 Complete!';
  RAISE NOTICE 'Real partner network members seeded:';
  RAISE NOTICE '  - Insurance Companies: % contacts', total_insurers;
  RAISE NOTICE '  - Insurance Brokers: % contacts', total_brokers;
  RAISE NOTICE '  - Total Contacts: %', total_contacts;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Breakdown by company:';
  RAISE NOTICE '  - Zurich Kotak: 3 contacts';
  RAISE NOTICE '  - Liberty General: 2 contacts';
  RAISE NOTICE '  - Care Health: 2 contacts';
  RAISE NOTICE '  - Bajaj Allianz: 1 contact';
  RAISE NOTICE '  - Universal Sompo: 1 contact';
  RAISE NOTICE '  - Magma HDI: 3 contacts';
  RAISE NOTICE '  - IFFCO Tokio: 2 contacts';
  RAISE NOTICE '  - Shriram General: 1 contact';
  RAISE NOTICE '  - ICICI Lombard: 2 contacts';
  RAISE NOTICE '  - Aditya Birla Health: 1 contact';
  RAISE NOTICE '  - Navnit Insurance Brokers: 1 contact';
  RAISE NOTICE '  - Livlong Insurance Brokers: 1 contact';
  RAISE NOTICE '  - Mitigata Insurance Brokers: 1 contact';
  RAISE NOTICE '========================================';
END $$;
