-- Migration 013: Seed Network Members
-- Date: October 2, 2025
-- Purpose: Add sample insurers and brokers to network_members table

-- Clear existing network members (for clean seed)
DELETE FROM network_members;

-- =====================================================
-- GENERAL INSURERS
-- =====================================================

INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'HDFC ERGO General Insurance',
  'Rajesh Kumar',
  'corporate@hdfcergo.com',
  '+91-22-6234-5678',
  ARRAY['Fire Insurance', 'Marine Cargo', 'Business Interruption'],
  4.5,
  'Leading general insurance provider with comprehensive coverage for business risks including fire, marine, and property insurance.',
  true
),
(
  'insurer', 'general',
  'ICICI Lombard General Insurance',
  'Priya Sharma',
  'corporate@icicilombard.com',
  '+91-22-6765-4321',
  ARRAY['Fire Insurance', 'Contractors All Risk', 'Machinery Breakdown'],
  4.7,
  'Comprehensive general insurance solutions with strong expertise in construction and industrial risks.',
  true
),
(
  'insurer', 'general',
  'Bajaj Allianz General Insurance',
  'Amit Patel',
  'corporate@bajajallianz.com',
  '+91-20-3056-7890',
  ARRAY['Fire Insurance', 'Marine Transit', 'Product Liability'],
  4.3,
  'Trusted insurer offering tailored solutions for manufacturing and trading businesses across India.',
  true
),
(
  'insurer', 'general',
  'Tata AIG General Insurance',
  'Sunita Reddy',
  'corporate@tataaig.com',
  '+91-22-6693-8000',
  ARRAY['Fire Insurance', 'Business Interruption', 'Commercial General Liability'],
  4.6,
  'Part of Tata Group, offering reliable general insurance with focus on business continuity and liability coverage.',
  true
);

-- =====================================================
-- HEALTH INSURERS
-- =====================================================

INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'health',
  'Star Health and Allied Insurance',
  'Dr. Meera Iyer',
  'corporate@starhealth.in',
  '+91-44-2858-5858',
  ARRAY['Group Health Insurance', 'Group Personal Accident'],
  4.4,
  'India''s first standalone health insurance company specializing in employee health benefits and wellness programs.',
  true
),
(
  'insurer', 'health',
  'Niva Bupa Health Insurance',
  'Vikram Singh',
  'corporate@nivabupa.com',
  '+91-124-461-2000',
  ARRAY['Group Health Insurance', 'Critical Illness Cover'],
  4.5,
  'Comprehensive health insurance solutions with cashless network of 10,000+ hospitals across India.',
  true
),
(
  'insurer', 'health',
  'Care Health Insurance',
  'Anjali Desai',
  'corporate@careinsurance.com',
  '+91-22-6234-9876',
  ARRAY['Group Health Insurance', 'Group Personal Accident', 'Maternity Coverage'],
  4.2,
  'Affordable group health insurance with focus on preventive care and wellness initiatives for employees.',
  true
);

-- =====================================================
-- LIFE INSURERS
-- =====================================================

INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'life',
  'HDFC Life Insurance',
  'Ramesh Nair',
  'corporate@hdfclife.com',
  '+91-22-6171-8000',
  ARRAY['Group Term Life Insurance', 'Keyman Insurance'],
  4.8,
  'Leading life insurer offering comprehensive group term life and employee benefit solutions for corporates.',
  true
),
(
  'insurer', 'life',
  'ICICI Prudential Life Insurance',
  'Kavita Menon',
  'corporate@iciciprulife.com',
  '+91-22-5039-1600',
  ARRAY['Group Term Life Insurance', 'Employee Benefits'],
  4.6,
  'Trusted life insurance partner with flexible group term life policies and competitive premiums.',
  true
);

-- =====================================================
-- COMMERCIAL LIABILITY INSURERS
-- =====================================================

INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'insurer', 'general',
  'Reliance General Insurance',
  'Karan Kapoor',
  'corporate@reliancegeneral.co.in',
  '+91-22-4890-3000',
  ARRAY['Directors & Officers Liability', 'Professional Indemnity', 'Cyber Liability'],
  4.4,
  'Specialized D&O and professional indemnity coverage for startups and established businesses.',
  true
),
(
  'insurer', 'general',
  'SBI General Insurance',
  'Neha Agarwal',
  'corporate@sbigeneral.in',
  '+91-22-2652-2424',
  ARRAY['Professional Indemnity', 'Workmen''s Compensation', 'Product Liability'],
  4.3,
  'Comprehensive commercial liability insurance backed by State Bank of India''s trusted legacy.',
  true
);

-- =====================================================
-- INSURANCE BROKERS
-- =====================================================

INSERT INTO network_members (
  type, category, company_name, contact_person, email, phone,
  specializations, rating, description, is_active
) VALUES
(
  'broker', NULL,
  'Marsh India Insurance Brokers',
  'Rohan Malhotra',
  'corporate@marsh.com',
  '+91-22-6124-3000',
  ARRAY['Risk Advisory', 'Employee Benefits', 'Liability Insurance'],
  4.9,
  'Global insurance broker with deep expertise in complex risk management and comprehensive insurance solutions.',
  true
),
(
  'broker', NULL,
  'Aon India Insurance Brokers',
  'Shalini Verma',
  'corporate@aon.in',
  '+91-22-2659-2000',
  ARRAY['Risk Consulting', 'Group Insurance', 'Claims Management'],
  4.8,
  'Leading global broker offering data-driven insurance advisory and customized employee benefit programs.',
  true
),
(
  'broker', NULL,
  'JB Boda Insurance & Reinsurance Brokers',
  'Arjun Bhat',
  'corporate@jbboda.com',
  '+91-22-6631-4949',
  ARRAY['Marine Insurance', 'Fire Insurance', 'Engineering Insurance'],
  4.6,
  'India''s oldest and largest insurance broker with 100+ years of experience in commercial insurance.',
  true
),
(
  'broker', NULL,
  'Lockton India Insurance Brokers',
  'Deepa Krishnan',
  'corporate@lockton.com',
  '+91-124-471-5000',
  ARRAY['Employee Benefits', 'Cyber Insurance', 'Directors & Officers Liability'],
  4.5,
  'Independent global broker specializing in innovative insurance solutions and risk management strategies.',
  true
),
(
  'broker', NULL,
  'Willis Towers Watson India',
  'Sanjay Mehta',
  'corporate@wtwco.com',
  '+91-22-6628-8000',
  ARRAY['Health & Benefits', 'Risk Advisory', 'Claims Advocacy'],
  4.7,
  'Global advisory firm providing integrated employee benefits, risk management, and insurance brokerage.',
  true
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
  total_insurers INTEGER;
  total_brokers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_insurers FROM network_members WHERE type = 'insurer';
  SELECT COUNT(*) INTO total_brokers FROM network_members WHERE type = 'broker';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 013 Complete!';
  RAISE NOTICE 'Network members seeded successfully:';
  RAISE NOTICE '  - Insurers: %', total_insurers;
  RAISE NOTICE '  - Brokers: %', total_brokers;
  RAISE NOTICE '  - Total: %', total_insurers + total_brokers;
  RAISE NOTICE '========================================';
END $$;
