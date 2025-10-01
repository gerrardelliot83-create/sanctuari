-- Sanctuari Platform - Initial Database Schema
-- This migration creates all core tables for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

-- Users table (extends Supabase auth.users)
-- Minimal signup: Only email is required at signup
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT, -- Can be added later
  phone TEXT, -- Optional
  avatar_url TEXT, -- Optional profile picture
  onboarding_completed BOOLEAN DEFAULT false, -- Track if user completed onboarding
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies/Organizations table
-- Users create companies AFTER signup
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  gst_number TEXT,
  pan_number TEXT,
  registered_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  website TEXT,
  logo_url TEXT, -- Company logo from UploadThing
  created_by UUID NOT NULL REFERENCES public.users(id), -- Who created this company
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company members (users can belong to multiple companies)
-- This allows users to manage multiple organizations and invite collaborators
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id) -- A user can only be a member once per company
);

-- Company invitations (for inviting collaborators)
CREATE TABLE public.company_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- SANCTUARI NETWORK (INSURERS & BROKERS)
-- =====================================================

CREATE TABLE public.network_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('insurer', 'broker')),
  category TEXT CHECK (category IN ('general', 'health', 'life')),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  ceo_photo_url TEXT,
  specializations TEXT[], -- Array of insurance product specializations
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  certifications TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RFQ TEMPLATES AND QUESTIONS
-- =====================================================

-- Insurance product types
CREATE TABLE public.insurance_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('general', 'health', 'life', 'marine', 'cyber', 'commercial')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ question templates (from CSV files)
CREATE TABLE public.rfq_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.insurance_products(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'textarea', 'file', 'checkbox', 'radio')),
  field_name TEXT NOT NULL, -- Internal field identifier
  options JSONB, -- For select/multiselect options
  validation_rules JSONB, -- {required: true, min: 0, max: 100, pattern: "regex"}
  guidance_text TEXT, -- AI-generated helpful guidance
  placeholder TEXT,
  conditional_logic JSONB, -- {show_if: {field: "field_name", value: "value"}}
  section TEXT, -- Group questions into sections
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RFQs (REQUEST FOR QUOTATIONS)
-- =====================================================

CREATE TABLE public.rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_number TEXT UNIQUE NOT NULL, -- e.g., RFQ-2025-001
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.insurance_products(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'bidding', 'reviewing', 'completed', 'cancelled')),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT, -- Generated PDF stored in UploadThing
  is_first_rfq BOOLEAN DEFAULT false, -- For free first RFQ logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RFQ responses (user's answers to questions)
CREATE TABLE public.rfq_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.rfq_questions(id) ON DELETE CASCADE,
  response_value TEXT, -- Store as text, parse based on field_type
  response_file_url TEXT, -- If file upload via UploadThing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rfq_id, question_id)
);

-- =====================================================
-- BID DISTRIBUTION
-- =====================================================

-- RFQ invitations (who was invited to bid)
CREATE TABLE public.rfq_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  network_member_id UUID REFERENCES public.network_members(id) ON DELETE SET NULL, -- If from Sanctuari network
  external_email TEXT, -- If external partner
  unique_link_token TEXT UNIQUE NOT NULL, -- Secure token for bid submission link
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'submitted', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- BIDS (SUBMITTED QUOTES)
-- =====================================================

CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES public.rfq_invitations(id) ON DELETE CASCADE,
  bidder_company_name TEXT NOT NULL,
  bidder_contact_person TEXT,
  bidder_email TEXT NOT NULL,
  bidder_phone TEXT,

  -- Quote details (extracted from documents)
  premium_amount DECIMAL(15,2),
  coverage_amount DECIMAL(15,2),
  deductible DECIMAL(15,2),
  policy_term_months INTEGER,
  additional_terms TEXT,

  -- AI analysis results
  ai_analysis JSONB, -- Store AI-generated insights
  ai_rating DECIMAL(2,1) CHECK (ai_rating >= 0 AND ai_rating <= 5),
  red_flags TEXT[], -- Array of identified issues

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bid documents (uploaded files via UploadThing)
CREATE TABLE public.bid_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- UploadThing URL
  file_type TEXT, -- pdf, xlsx, etc.
  file_size_bytes BIGINT,
  parsed_data JSONB, -- Data extracted via Llama Parse
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MESSAGING AND COMMUNICATION
-- =====================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'bidder', 'admin')),
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  message_text TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs from UploadThing
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS AND SUBSCRIPTIONS
-- =====================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_for TEXT NOT NULL CHECK (payment_for IN ('rfq_submission', 'subscription', 'additional_bid')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  rfq_quota INTEGER DEFAULT 1, -- How many RFQs per month
  current_rfq_count INTEGER DEFAULT 0, -- Used this month
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMAIL LOGS
-- =====================================================

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES public.rfq_invitations(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
  brevo_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- 'rfq', 'bid', 'user', etc.
  entity_id UUID,
  changes JSONB, -- What changed
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_onboarding ON public.users(onboarding_completed);

-- Companies
CREATE INDEX idx_companies_created_by ON public.companies(created_by);

-- Company members
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_status ON public.company_members(status);

-- Company invitations
CREATE INDEX idx_company_invitations_company ON public.company_invitations(company_id);
CREATE INDEX idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX idx_company_invitations_token ON public.company_invitations(invitation_token);
CREATE INDEX idx_company_invitations_status ON public.company_invitations(status);

-- Network members
CREATE INDEX idx_network_type ON public.network_members(type);
CREATE INDEX idx_network_category ON public.network_members(category);
CREATE INDEX idx_network_active ON public.network_members(is_active);

-- RFQs
CREATE INDEX idx_rfqs_user ON public.rfqs(user_id);
CREATE INDEX idx_rfqs_company ON public.rfqs(company_id);
CREATE INDEX idx_rfqs_status ON public.rfqs(status);
CREATE INDEX idx_rfqs_product ON public.rfqs(product_id);
CREATE INDEX idx_rfqs_created ON public.rfqs(created_at DESC);

-- RFQ Questions
CREATE INDEX idx_questions_product ON public.rfq_questions(product_id);
CREATE INDEX idx_questions_order ON public.rfq_questions(order_index);

-- Bids
CREATE INDEX idx_bids_rfq ON public.bids(rfq_id);
CREATE INDEX idx_bids_invitation ON public.bids(invitation_id);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_bids_created ON public.bids(created_at DESC);

-- Invitations
CREATE INDEX idx_invitations_rfq ON public.rfq_invitations(rfq_id);
CREATE INDEX idx_invitations_token ON public.rfq_invitations(unique_link_token);
CREATE INDEX idx_invitations_status ON public.rfq_invitations(status);

-- Payments
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_razorpay_order ON public.payments(razorpay_order_id);

-- Email logs
CREATE INDEX idx_email_logs_rfq ON public.email_logs(rfq_id);
CREATE INDEX idx_email_logs_sent ON public.email_logs(sent_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: Can view and update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Companies: Users can view companies they're members of
CREATE POLICY "Users can view member companies" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Company owners and admins can update" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Company members: Users can view members of their companies
CREATE POLICY "Users can view company members" ON public.company_members
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Company owners can manage members" ON public.company_members
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Company invitations: Owners and admins can manage invitations
CREATE POLICY "Company owners can view invitations" ON public.company_invitations
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Company owners can create invitations" ON public.company_invitations
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
    AND invited_by = auth.uid()
  );

-- Network members: Public read access (for partner selection)
CREATE POLICY "Network members public read" ON public.network_members
  FOR SELECT USING (is_active = true);

-- Insurance products: Public read access
CREATE POLICY "Insurance products public read" ON public.insurance_products
  FOR SELECT USING (is_active = true);

-- RFQ questions: Public read access (needed for form rendering)
CREATE POLICY "RFQ questions public read" ON public.rfq_questions
  FOR SELECT USING (true);

-- RFQs: Users can view and manage their own RFQs
CREATE POLICY "Users can view own RFQs" ON public.rfqs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create RFQs" ON public.rfqs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own RFQs" ON public.rfqs
  FOR UPDATE USING (user_id = auth.uid());

-- RFQ responses: Users can manage responses for their RFQs
CREATE POLICY "Users can manage own RFQ responses" ON public.rfq_responses
  FOR ALL USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- Bids: Users can view bids for their RFQs
CREATE POLICY "Users can view bids for their RFQs" ON public.bids
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Admin policies (super_admin and admin roles)
CREATE POLICY "Admins can view all data" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_network_members_updated_at BEFORE UPDATE ON public.network_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rfq_questions_updated_at BEFORE UPDATE ON public.rfq_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rfq_responses_updated_at BEFORE UPDATE ON public.rfq_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNCTION: Generate RFQ Number
-- =====================================================

CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  rfq_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.rfqs
  WHERE rfq_number LIKE 'RFQ-' || year || '-%';

  rfq_num := 'RFQ-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN rfq_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Check if this is user's first RFQ
-- =====================================================

CREATE OR REPLACE FUNCTION check_first_rfq(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rfq_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rfq_count
  FROM public.rfqs
  WHERE user_id = user_uuid AND status NOT IN ('draft', 'cancelled');

  RETURN (rfq_count = 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA: Insurance Products
-- =====================================================

INSERT INTO public.insurance_products (name, category, description) VALUES
('Fire and Special Perils Insurance', 'general', 'Covers loss or damage to property due to fire and allied perils'),
('Marine Cargo Insurance', 'marine', 'Covers goods in transit via sea, air, or land'),
('Marine Transit Insurance', 'marine', 'Covers domestic movement of goods'),
('Group Health Insurance', 'health', 'Medical insurance for employees'),
('Group Personal Accident Insurance', 'health', 'Coverage against accidental death and disability'),
('Group Term Life Insurance', 'life', 'Life insurance coverage for employees'),
('Cyber Liability Insurance', 'cyber', 'Protection against cyber attacks and data breaches'),
('Directors & Officers Liability Insurance', 'commercial', 'Personal liability protection for company directors and officers'),
('Professional Indemnity Insurance', 'commercial', 'Coverage for professional negligence claims'),
('Commercial General Liability', 'commercial', 'Third-party liability coverage'),
('Product Liability Insurance', 'commercial', 'Coverage for product-related claims'),
('Workmen''s Compensation Insurance', 'commercial', 'Statutory coverage for employee work-related injuries'),
('Business Interruption Insurance', 'general', 'Covers loss of income due to business disruption'),
('Contractors All Risk', 'general', 'Comprehensive coverage for construction projects'),
('Machinery Breakdown Insurance', 'general', 'Covers sudden and unforeseen breakdown of machinery');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'User accounts extending Supabase auth.users - minimal signup (email only)';
COMMENT ON TABLE public.companies IS 'Client companies/organizations - created after signup';
COMMENT ON TABLE public.company_members IS 'Users belonging to companies - supports multiple companies per user';
COMMENT ON TABLE public.company_invitations IS 'Pending invitations to join companies';
COMMENT ON TABLE public.network_members IS 'Insurers and brokers in Sanctuari network';
COMMENT ON TABLE public.insurance_products IS 'Types of insurance products available';
COMMENT ON TABLE public.rfq_questions IS 'Dynamic question templates for each product type';
COMMENT ON TABLE public.rfqs IS 'Request for Quotations created by clients';
COMMENT ON TABLE public.rfq_responses IS 'Client answers to RFQ questions';
COMMENT ON TABLE public.rfq_invitations IS 'Invitations sent to insurers/brokers to bid';
COMMENT ON TABLE public.bids IS 'Submitted quotes from insurers/brokers';
COMMENT ON TABLE public.bid_documents IS 'Documents uploaded with bids (stored in UploadThing)';
COMMENT ON TABLE public.messages IS 'Communication between clients and bidders';
COMMENT ON TABLE public.payments IS 'Payment records via Razorpay';
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and quotas';
COMMENT ON TABLE public.email_logs IS 'Email delivery tracking via Brevo';
COMMENT ON TABLE public.audit_logs IS 'Audit trail of all system actions';
