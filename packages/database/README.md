# Sanctuari Database Package

This package contains database schemas, migrations, and utilities for Supabase.

## Running the Initial Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Migration

1. Open the file `migrations/001_initial_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for completion (should take 5-10 seconds)

### Step 3: Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see all these tables:
   - users
   - companies
   - network_members
   - insurance_products (with 15 products already inserted)
   - rfq_questions
   - rfqs
   - rfq_responses
   - rfq_invitations
   - bids
   - bid_documents
   - messages
   - payments
   - subscriptions
   - email_logs
   - audit_logs

### Step 4: Verify Row Level Security (RLS)

1. Click on any table
2. Click the **RLS** toggle - it should show as enabled
3. Click **View Policies** to see the security policies

## Database Structure Overview

### Core Tables

**Users & Companies**
- `users` - User accounts (extends Supabase Auth)
- `companies` - Client company information

**Network**
- `network_members` - Insurers and brokers
- `insurance_products` - Available insurance types

**RFQ System**
- `rfqs` - Request for Quotations
- `rfq_questions` - Dynamic form questions (from CSV templates)
- `rfq_responses` - User answers
- `rfq_invitations` - Who was invited to bid

**Bidding**
- `bids` - Submitted quotes
- `bid_documents` - Uploaded files (URLs from UploadThing)

**Communication & Payments**
- `messages` - In-app messaging
- `payments` - Razorpay transactions
- `subscriptions` - User plans and quotas

**Tracking**
- `email_logs` - Email delivery tracking
- `audit_logs` - System audit trail

## Important Features

### 1. File Storage via UploadThing
- All files are stored in UploadThing, not Supabase Storage
- We only store file URLs in the database
- Tables with file URLs: `bid_documents`, `rfqs` (pdf_url), `network_members` (logo_url, ceo_photo_url)

### 2. Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admins have full access
- Network members and products are publicly readable

### 3. Automatic Timestamps
- All tables with `updated_at` fields have triggers to auto-update
- Audit trail is maintained automatically

### 4. Helper Functions
- `generate_rfq_number()` - Auto-generates RFQ numbers (e.g., RFQ-2025-0001)
- `check_first_rfq(user_uuid)` - Checks if this is user's first RFQ (for free tier)

## Next Steps

After running the migration:

1. **Import RFQ Questions** - Load questions from CSV files
2. **Import Network Members** - Load insurer/broker profiles
3. **Upload Images** - Upload CEO photos and logos to UploadThing
4. **Test Database** - Create test user and verify permissions

## Troubleshooting

### "Permission denied" errors
- Make sure you're using the service role key for admin operations
- Check RLS policies are configured correctly

### Migration fails partway through
- Clear the database and run again
- Or run only the failed sections

### Need to reset database
```sql
-- WARNING: This deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run the migration again.
