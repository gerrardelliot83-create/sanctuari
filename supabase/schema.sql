-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('business', 'broker', 'insurer', 'admin');
CREATE TYPE bid_status AS ENUM ('draft', 'active', 'closed', 'awarded', 'cancelled');
CREATE TYPE quote_status AS ENUM ('pending', 'submitted', 'under_review', 'accepted', 'rejected');
CREATE TYPE product_type AS ENUM (
    'fire_special_perils', 'business_interruption', 'burglary', 'marine_cargo',
    'contractors_all_risk', 'erection_all_risk', 'public_liability', 'product_liability',
    'professional_indemnity', 'directors_officers', 'cyber_liability', 'group_health',
    'group_personal_accident', 'group_term_life', 'workmen_compensation', 'other'
);
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'business',
    company_name VARCHAR(255),
    company_registration VARCHAR(100),
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    industry_type VARCHAR(100),
    annual_turnover DECIMAL(15,2),
    employee_count INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insurers table
CREATE TABLE public.insurers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    registration_number VARCHAR(100),
    irda_license VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    supported_products product_type[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Brokers table
CREATE TABLE public.brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    broker_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    irda_registration VARCHAR(100),
    commission_rate DECIMAL(5,2),
    is_partner BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RFQ Templates table
CREATE TABLE public.rfq_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_type product_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL,
    guidance_content JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RFQs table
CREATE TABLE public.rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rfq_number VARCHAR(50) UNIQUE NOT NULL,
    product_type product_type NOT NULL,
    template_id UUID REFERENCES public.rfq_templates(id),
    form_data JSONB NOT NULL,
    status bid_status DEFAULT 'draft',
    submission_deadline TIMESTAMP WITH TIME ZONE,
    decision_deadline TIMESTAMP WITH TIME ZONE,
    bid_rules JSONB,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Bid Invitations table
CREATE TABLE public.bid_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    email VARCHAR(255),
    broker_id UUID REFERENCES public.brokers(id),
    insurer_id UUID REFERENCES public.insurers(id),
    unique_link VARCHAR(255) UNIQUE NOT NULL,
    link_expiry TIMESTAMP WITH TIME ZONE,
    is_accepted BOOLEAN DEFAULT FALSE,
    accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Quotes table
CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    invitation_id UUID REFERENCES public.bid_invitations(id),
    broker_id UUID REFERENCES public.brokers(id),
    insurer_id UUID REFERENCES public.insurers(id),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    premium_amount DECIMAL(12,2) NOT NULL,
    sum_insured DECIMAL(15,2),
    policy_period_start DATE,
    policy_period_end DATE,
    coverage_details JSONB,
    exclusions JSONB,
    terms_conditions JSONB,
    document_urls TEXT[],
    parsed_data JSONB,
    status quote_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Quote Analysis table
CREATE TABLE public.quote_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    score DECIMAL(5,2),
    strengths JSONB,
    weaknesses JSONB,
    recommendations JSONB,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Communications table
CREATE TABLE public.communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    invitation_id UUID REFERENCES public.bid_invitations(id),
    sender_id UUID REFERENCES public.users(id),
    recipient_email VARCHAR(255),
    message_type VARCHAR(50),
    subject VARCHAR(500),
    content TEXT,
    is_broadcast BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Workflow Automation table
CREATE TABLE public.workflow_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50),
    trigger_date TIMESTAMP WITH TIME ZONE,
    action_type VARCHAR(50),
    email_template JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rfq_id UUID REFERENCES public.rfqs(id),
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Admin Settings table
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_company ON public.users(company_name);
CREATE INDEX idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX idx_rfqs_status ON public.rfqs(status);
CREATE INDEX idx_rfqs_product_type ON public.rfqs(product_type);
CREATE INDEX idx_quotes_rfq_id ON public.quotes(rfq_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_bid_invitations_rfq_id ON public.bid_invitations(rfq_id);
CREATE INDEX idx_bid_invitations_unique_link ON public.bid_invitations(unique_link);
CREATE INDEX idx_communications_rfq_id ON public.communications(rfq_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for RFQs
CREATE POLICY "Users can view own RFQs" ON public.rfqs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create RFQs" ON public.rfqs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RFQs" ON public.rfqs
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Quotes
CREATE POLICY "Users can view quotes for their RFQs" ON public.quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rfqs
            WHERE rfqs.id = quotes.rfq_id
            AND rfqs.user_id = auth.uid()
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'RFQ-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_unique_link()
RETURNS TEXT AS $$
DECLARE
    new_link TEXT;
BEGIN
    new_link := encode(gen_random_bytes(32), 'hex');
    RETURN new_link;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON public.rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_insurers_updated_at BEFORE UPDATE ON public.insurers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();