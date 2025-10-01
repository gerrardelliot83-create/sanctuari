# Sanctuari Platform Setup Guide

This guide will walk you through setting up all third-party services needed for the Sanctuari platform.

## Table of Contents
1. [GitHub Repository Setup](#1-github-repository-setup)
2. [Vercel Deployment Setup](#2-vercel-deployment-setup)
3. [Supabase Database Setup](#3-supabase-database-setup)
4. [UploadThing File Storage](#4-uploadthing-file-storage)
5. [Llama Parse Document Processing](#5-llama-parse-document-processing)
6. [Claude API (Anthropic)](#6-claude-api-anthropic)
7. [Razorpay Payment Gateway](#7-razorpay-payment-gateway)
8. [Brevo Email Service](#8-brevo-email-service)
9. [Environment Variables Configuration](#9-environment-variables-configuration)

---

## 1. GitHub Repository Setup

### Steps:
1. Go to [GitHub](https://github.com)
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `sanctuari-platform`
   - **Description**: "AI-powered insurance procurement platform"
   - **Visibility**: Private (recommended)
5. Click **Create repository**

### Initialize Git and Push Code:
```bash
cd /mnt/c/Users/Dell/desktop/sanctuari
git init
git add .
git commit -m "Initial commit: Sanctuari platform structure"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sanctuari-platform.git
git push -u origin main
```

---

## 2. Vercel Deployment Setup

### Steps:
1. Go to [Vercel](https://vercel.com)
2. Click **Sign Up** and choose "Continue with GitHub"
3. After logging in, click **Add New** → **Project**
4. Select **Import Git Repository**
5. Find and select your `sanctuari-platform` repository
6. Click **Import**

### Configure Platform App (platform.sanctuari.io):
1. **Framework Preset**: Next.js
2. **Root Directory**: `apps/platform`
3. **Build Command**: `cd ../.. && npm run build --filter=@sanctuari/platform`
4. **Output Directory**: `.next`
5. Click **Deploy**

### Configure Admin App (admin.sanctuari.io):
1. Repeat the import process for the same repository
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/admin`
4. **Build Command**: `cd ../.. && npm run build --filter=@sanctuari/admin`
5. **Output Directory**: `.next`
6. Click **Deploy**

### Add Custom Domains:
1. Go to project **Settings** → **Domains**
2. For platform app: Add `platform.sanctuari.io`
3. For admin app: Add `admin.sanctuari.io`
4. Follow DNS configuration instructions provided by Vercel

---

## 3. Supabase Database Setup

### Create Project:
1. Go to [Supabase](https://supabase.com)
2. Click **New Project**
3. Fill in:
   - **Name**: Sanctuari Production
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose closest to your users (e.g., Mumbai for India)
4. Click **Create new project** (takes ~2 minutes)

### Get API Keys:
1. Once created, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal" to see) → Use as `SUPABASE_SERVICE_KEY` (⚠️ Keep this secret!)

### Enable Email Authentication:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates under **Email Templates** section
4. Customize:
   - Confirmation email
   - Password recovery email
   - Magic link email

### Configure Storage:
1. Go to **Storage** → **New bucket**
2. Create buckets:
   - `rfq-documents` (Private)
   - `bid-submissions` (Private)
   - `profile-images` (Public)

---

## 4. UploadThing File Storage

### Steps:
1. Go to [UploadThing](https://uploadthing.com)
2. Click **Sign in** (use GitHub account)
3. Create a **New App**
4. **App Name**: Sanctuari Platform
5. Once created, go to **API Keys**
6. Copy:
   - **Secret Key** → Use as `UPLOADTHING_SECRET`
   - **App ID** → Use as `UPLOADTHING_APP_ID`

### Configure File Upload Limits:
1. Go to **Settings** → **File Restrictions**
2. Set:
   - **Max file size**: 10MB
   - **Allowed file types**: PDF, XLSX, CSV, PNG, JPG
   - **Max files per upload**: 5

---

## 5. Llama Parse Document Processing

### Steps:
1. Go to [LlamaIndex Cloud](https://cloud.llamaindex.ai)
2. Sign up for an account
3. Go to **API Keys** section
4. Click **Create API Key**
5. Name: "Sanctuari Platform"
6. Copy the generated key → Use as `LLAMA_PARSE_API_KEY`

---

## 6. Claude API (Anthropic)

### Steps:
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Name: "Sanctuari Platform"
5. Copy the key → Use as `ANTHROPIC_API_KEY`

### Set Usage Limits:
1. Go to **Settings** → **Billing**
2. Set monthly usage limit (recommended: $500 for testing, adjust for production)
3. Add payment method

### Important Notes:
- **Claude Opus 4.1** is used for main orchestration (more expensive but higher quality)
- **Claude Sonnet 4** is used for sub-agents (cost-effective)
- Monitor usage in the console dashboard

---

## 7. Razorpay Payment Gateway

### Steps:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. **Sign Up** (requires business details for Indian companies)
3. Complete KYC verification process
4. Once approved, go to **Settings** → **API Keys**
5. Copy:
   - **Key ID** → Use as `RAZORPAY_KEY_ID`
   - **Key Secret** (click "Generate") → Use as `RAZORPAY_KEY_SECRET`

### Configure Webhook:
1. Go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. **Webhook URL**: `https://platform.sanctuari.io/api/webhooks/razorpay`
4. Select these events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`
5. Click **Create Webhook**
6. Copy **Webhook Secret** → Use as `RAZORPAY_WEBHOOK_SECRET`

### Test Mode:
- Razorpay provides test mode keys for development
- Switch to live mode only after full testing

---

## 8. Brevo Email Service

### Steps:
1. Go to [Brevo](https://app.brevo.com)
2. **Sign up** for free account (300 emails/day free)
3. Verify your email address
4. Go to **SMTP & API** → **API Keys**
5. Click **Generate a new API Key**
6. Name: "Sanctuari Platform"
7. Copy key → Use as `BREVO_API_KEY`

### Verify Sender Email:
1. Go to **Senders** → **Add a new sender**
2. Add: `noreply@sanctuari.io`
3. Verify through DNS records (add TXT records to your domain)

### Create Email Templates:
1. Go to **Campaigns** → **Templates**
2. Create templates for:
   - RFQ created confirmation
   - Bid invitation
   - Quote received notification
   - Quote comparison ready
   - Payment confirmation

### Configure SMTP (optional):
- **Host**: smtp-relay.brevo.com
- **Port**: 587
- **Username**: Your Brevo account email
- **Password**: SMTP key (different from API key)

---

## 9. Environment Variables Configuration

### For Platform App (`apps/platform/.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# UploadThing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your_app_id

# Llama Parse
LLAMA_PARSE_API_KEY=llx_...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@sanctuari.io
BREVO_SENDER_NAME=Sanctuari

# URLs
NEXT_PUBLIC_PLATFORM_URL=https://platform.sanctuari.io
NEXT_PUBLIC_ADMIN_URL=https://admin.sanctuari.io
NEXT_PUBLIC_MARKETING_URL=https://www.sanctuari.io
```

### For Admin App (`apps/admin/.env.local`):
Same as platform, but some keys may not be needed (e.g., Razorpay, Claude API)

### Add to Vercel:
1. Go to each project in Vercel
2. **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: Variable name
   - **Value**: Variable value
   - **Environments**: Production, Preview, Development
4. Click **Save**

---

## Testing Configuration

After setting up all services, test each integration:

### 1. Test Supabase Connection:
```javascript
// Create a test file: scripts/test-supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Supabase client created successfully!');
```

### 2. Test UploadThing:
- Visit: https://uploadthing.com/dashboard/your-app-id/files
- Try uploading a test file

### 3. Test Llama Parse:
```bash
curl -X POST https://api.cloud.llamaindex.ai/api/parsing/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@test.pdf"
```

### 4. Test Claude API:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-sonnet-4-20250514", "max_tokens": 100, "messages": [{"role": "user", "content": "Hello"}]}'
```

### 5. Test Razorpay:
- Use test credentials
- Go to: https://dashboard.razorpay.com/app/payments

### 6. Test Brevo:
```bash
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sender":{"email":"noreply@sanctuari.io"},"to":[{"email":"test@example.com"}],"subject":"Test","htmlContent":"<h1>Test</h1>"}'
```

---

## Security Checklist

- [ ] All API keys are stored in `.env.local` files (not committed to Git)
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] Razorpay is in test mode initially
- [ ] Webhook secrets are configured
- [ ] CORS is properly configured for all services
- [ ] Rate limiting is enabled on API routes
- [ ] Two-factor authentication is enabled on all service accounts

---

## Next Steps

After completing this setup:
1. Run database migrations (see `docs/DATABASE_SCHEMA.md`)
2. Import RFQ templates and market profiles
3. Test the full user flow
4. Switch services from test to production mode

## Support

If you encounter issues:
- Check service status pages
- Review error logs in Vercel
- Consult individual service documentation
- Contact support for specific services
