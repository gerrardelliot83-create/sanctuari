# HANDOFF DOCUMENTATION - Next Development Phase
**Date:** October 3, 2025
**Current Status:** Week 1 Complete (100%), Ready for Critical Path Features
**Context Memory:** Critical - Use this document as primary reference

---

## 🎯 IMMEDIATE PRIORITY - Critical Path Features

### Build These 2 Features BEFORE Week 2:

#### 1. **BID SUBMISSION PORTAL** (`/bid/[token]`) - HIGHEST PRIORITY
**Purpose:** Public portal where insurers/brokers submit quotes after receiving invitation email

**Why Critical:** Without this, the entire distribution system is incomplete. Insurers receive emails but have nowhere to submit bids.

#### 2. **BID REVIEW/COMPARISON PAGE** (`/rfq/[id]/review`)
**Purpose:** Where RFQ creators view and compare submitted bids

**Why Critical:** Users need to see the bids they receive after distribution.

---

## 📚 REQUIRED READING - BEFORE YOU START

**Location:** `/mnt/c/Users/DELL/Desktop/sanctuari/Resources/`

You MUST read these three Word documents to understand requirements:

1. **component-library-and-user-stories.docx**
   - Contains complete UI/UX specifications
   - User stories for Module 4: Bid Submission Portal
   - Design system components to use

2. **initial-prompt.docx**
   - Overall product vision
   - Integration requirements (Llama Parse for document extraction)
   - Resource usage instructions

3. **technical-specifications.docx**
   - Database schema details
   - API specifications
   - Technical implementation requirements

**How to Read:**
Use the Task tool with general-purpose agent to extract and summarize bid submission requirements from these documents.

---

## 📊 CURRENT PROJECT STATE

### ✅ What's Already Built (Week 1 Complete):

#### Database Schema (All Tables Exist):
- ✅ `users` - User accounts
- ✅ `companies` - Client companies
- ✅ `company_members` - Multi-company support
- ✅ `network_members` - Insurers/brokers (21 real partners seeded)
- ✅ `insurance_products` - 15 product types
- ✅ `rfq_questions` - Dynamic question templates
- ✅ `rfqs` - Request for quotations
- ✅ `rfq_responses` - User answers to RFQ questions
- ✅ `rfq_invitations` - Distribution tracking (with RLS policies ✅)
- ✅ `bids` - Quote submissions (EMPTY - needs bid portal)
- ✅ `bid_documents` - Uploaded quote files
- ✅ `messages` - Communication threads
- ✅ `email_logs` - Email delivery tracking
- ✅ `payments` - Razorpay integration
- ✅ `subscriptions` - User quotas

#### Working Features:
- ✅ Authentication (Supabase Auth)
- ✅ Onboarding flow
- ✅ RFQ creation wizard (multi-step form)
- ✅ PDF policy upload with Llama Parse extraction
- ✅ Distribution page (3 tabs: Direct Contacts, Network, Settings)
- ✅ Email invitations via Brevo (WORKING - API key configured)
- ✅ Token generation (nanoid, 32-char alphanumeric)
- ✅ Network members API with filters
- ✅ Basic tracking page (shows invitation stats)
- ✅ Bid Centre page (renamed from RFQs, consolidated navigation)

#### Utilities Created:
- ✅ `/packages/utils/generators.js` - Token generation
- ✅ `/packages/utils/email/brevo.js` - Email sending
- ✅ `/packages/utils/email/templates.js` - HTML email templates

#### Environment Variables (Already Set in Vercel):
```
BREVO_API_KEY=xkeysib-... (API key, NOT SMTP key) ✅
BREVO_SENDER_EMAIL=noreply@sanctuari.io ✅
BREVO_SENDER_NAME=Sanctuari ✅
NEXT_PUBLIC_PLATFORM_URL=https://platform.sanctuari.io ✅
NEXT_PUBLIC_SUPABASE_URL=... ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=... ✅
SUPABASE_SERVICE_ROLE_KEY=... ✅
```

### ⚠️ Important Technical Context:

#### Next.js 15 Async Params:
ALL dynamic routes must unwrap params:
```javascript
export default function Page({ params }) {
  const [id, setId] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(p => setId(p.id));
  }, [params]);

  if (!id) return <Loading />;
  return <PageClient id={id} />;
}
```

#### Authentication in API Routes:
Use server client, NOT auth.js getUser():
```javascript
import { createClient } from '@sanctuari/database/lib/server';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

#### RLS Policies:
All tables have RLS enabled. Users can only access their own data. The following policies exist:
- Users can view/create/update their own RFQs
- Users can create invitations for their own RFQs ✅ (fixed)
- Bids are viewable by RFQ owner
- Network members are publicly readable

#### Design System Rules:
- ❌ NO EMOJIS - Use SVG icons only
- ❌ NO Tailwind CSS - Vanilla CSS only
- ✅ Use CSS variables: `--iris`, `--ink`, `--fog`, `--rose`, `--sun`
- ✅ Geist fonts (already loaded globally)
- ✅ Mobile-first responsive design
- ✅ Clean, professional UI

---

## 🔨 FEATURE 1: BID SUBMISSION PORTAL

### Overview:
Public portal accessible via unique token link sent in invitation emails.

### URL Structure:
```
https://platform.sanctuari.io/bid/[token]
```

Where `[token]` is the 32-character unique token from `rfq_invitations.unique_link_token`

### File Structure to Create:
```
/apps/platform/src/app/bid/[token]/
  ├── page.js          (Main submission portal)
  ├── bid.css          (Styling)
  └── layout.js        (Optional - public layout without sidebar)
```

### User Journey:

1. **Insurer receives email** with link: `https://platform.sanctuari.io/bid/abc123...`
2. **Clicks link** → Lands on bid submission portal
3. **Views RFQ details** (product, requirements, deadline)
4. **Fills submission form** OR **uploads quote PDF**
5. **System extracts data** from PDF using Llama Parse (if uploaded)
6. **Reviews extracted data** and makes corrections
7. **Uploads policy wording** documents
8. **Submits bid** → Success confirmation
9. **Receives confirmation email** (optional)

### Token Validation Flow:

```javascript
// 1. Extract token from URL params
const token = params.token;

// 2. Query rfq_invitations table
const { data: invitation } = await supabase
  .from('rfq_invitations')
  .select(`
    *,
    rfqs (
      *,
      insurance_products (name),
      companies (name)
    )
  `)
  .eq('unique_link_token', token)
  .single();

// 3. Validate token
if (!invitation) {
  return <InvalidToken />;
}

// 4. Check expiry
if (new Date() > new Date(invitation.expires_at)) {
  return <ExpiredToken />;
}

// 5. Check if already submitted
if (invitation.status === 'submitted') {
  return <AlreadySubmitted />;
}

// 6. Show submission form
return <BidSubmissionForm rfq={invitation.rfqs} invitation={invitation} />;
```

### Required Form Fields:

Based on `bids` table schema:

```javascript
// Bidder Information
- bidder_company_name (TEXT, required)
- bidder_contact_person (TEXT, optional)
- bidder_email (TEXT, required)
- bidder_phone (TEXT, optional)

// Quote Details
- premium_amount (DECIMAL, required)
- coverage_amount (DECIMAL, required)
- deductible (DECIMAL, optional)
- policy_term_months (INTEGER, required)
- additional_terms (TEXT, optional)

// Documents
- Quote PDF (uploaded via UploadThing)
- Policy wording PDF (uploaded via UploadThing)
```

### Document Upload & Parsing:

**Integration with Llama Parse:**

```javascript
// After user uploads quote PDF via UploadThing
const response = await fetch('/api/parse-quote', {
  method: 'POST',
  body: JSON.stringify({
    fileUrl: uploadedPdfUrl,
    fileType: 'quote'
  })
});

const { extractedData } = await response.json();

// Pre-fill form with extracted data
setPremiumAmount(extractedData.premium);
setCoverageAmount(extractedData.coverage);
// etc.
```

**You need to create:**
`/apps/platform/src/app/api/parse-quote/route.js`

Reference existing: `/apps/platform/src/app/api/rfq/[id]/extract-policy/route.js` for Llama Parse integration pattern.

### API Endpoint to Create:

**File:** `/apps/platform/src/app/api/bid/submit/route.js`

**Method:** POST

**Body:**
```json
{
  "invitationId": "uuid",
  "token": "32-char-token",
  "bidData": {
    "bidder_company_name": "HDFC ERGO",
    "bidder_email": "corporate@hdfcergo.com",
    "bidder_contact_person": "Rajesh Kumar",
    "bidder_phone": "+91-22-1234-5678",
    "premium_amount": 150000,
    "coverage_amount": 10000000,
    "deductible": 25000,
    "policy_term_months": 12,
    "additional_terms": "Optional text"
  },
  "documents": [
    {
      "file_name": "quote.pdf",
      "file_url": "https://uploadthing.com/...",
      "file_type": "pdf",
      "file_size_bytes": 123456
    }
  ]
}
```

**Logic:**
```javascript
export async function POST(request) {
  const supabase = createClient();
  const { invitationId, token, bidData, documents } = await request.json();

  // 1. Verify token is valid and not expired
  const { data: invitation } = await supabase
    .from('rfq_invitations')
    .select('*')
    .eq('unique_link_token', token)
    .eq('id', invitationId)
    .single();

  if (!invitation || invitation.status === 'submitted') {
    return NextResponse.json({ error: 'Invalid or used token' }, { status: 400 });
  }

  if (new Date() > new Date(invitation.expires_at)) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 });
  }

  // 2. Create bid record
  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .insert({
      rfq_id: invitation.rfq_id,
      invitation_id: invitation.id,
      ...bidData,
      status: 'submitted'
    })
    .select()
    .single();

  if (bidError) {
    console.error('Bid creation failed:', bidError);
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
  }

  // 3. Create document records
  if (documents && documents.length > 0) {
    const documentRecords = documents.map(doc => ({
      bid_id: bid.id,
      ...doc
    }));

    await supabase.from('bid_documents').insert(documentRecords);
  }

  // 4. Update invitation status
  await supabase
    .from('rfq_invitations')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  // 5. TODO: Send confirmation email (optional)

  return NextResponse.json({
    success: true,
    bidId: bid.id
  });
}
```

### UI States:

1. **Loading** - Validating token
2. **Invalid Token** - Token not found
3. **Expired** - Token past expiry date
4. **Already Submitted** - Bid already submitted for this invitation
5. **Submission Form** - Main form (default state)
6. **Uploading** - Documents being uploaded
7. **Parsing** - Llama Parse extracting data
8. **Success** - Bid submitted successfully

### Design Considerations:

- **No authentication required** - Access via token only
- **No sidebar/navigation** - Standalone public page
- **Simple, clean form** - Focus on data entry
- **Progress indicator** - Show steps (1. Upload → 2. Review → 3. Submit)
- **Mobile-friendly** - Many users will access from mobile

### Success Screen:

```javascript
<div className="bid-success">
  <div className="success-icon">
    {/* SVG checkmark */}
  </div>
  <h1>Quote Submitted Successfully!</h1>
  <p>Your quote has been submitted to {rfq.companies.name}.</p>
  <p>Reference: {bid.id}</p>
  <p>You will be contacted if your quote is selected.</p>
</div>
```

---

## 🔨 FEATURE 2: BID REVIEW/COMPARISON PAGE

### Overview:
Internal page where RFQ creators view and compare all submitted bids for an RFQ.

### URL Structure:
```
https://platform.sanctuari.io/rfq/[id]/review
```

### File Structure to Create:
```
/apps/platform/src/app/rfq/[id]/review/
  ├── page.js          (Main review page)
  └── review.css       (Styling)
```

### User Journey:

1. User clicks "View Bids" on a completed RFQ from Bid Centre
2. Lands on review page showing all submitted bids
3. Views bids in table/card format
4. Compares bids side-by-side
5. Downloads bid documents
6. Marks preferred bid (optional)
7. Exports comparison to PDF/Excel (Week 2 feature)

### Data Loading:

```javascript
useEffect(() => {
  loadData();
}, [rfqId]);

const loadData = async () => {
  const { user } = await getUser();
  if (!user) {
    router.push('/login');
    return;
  }

  const supabase = createClient();

  // Load RFQ with product and company details
  const { data: rfqData } = await supabase
    .from('rfqs')
    .select(`
      *,
      insurance_products (name),
      companies (name)
    `)
    .eq('id', rfqId)
    .eq('user_id', user.id)
    .single();

  setRfq(rfqData);

  // Load all bids for this RFQ
  const { data: bidsData } = await supabase
    .from('bids')
    .select(`
      *,
      bid_documents (*)
    `)
    .eq('rfq_id', rfqId)
    .order('premium_amount', { ascending: true });

  setBids(bidsData || []);
  setLoading(false);
};
```

### UI Layout:

**Option 1: Table View** (Recommended for desktop)
```
| Company | Contact | Premium | Coverage | Deductible | Policy Term | Documents | Actions |
|---------|---------|---------|----------|------------|-------------|-----------|---------|
| HDFC    | Rajesh  | ₹1.5L   | ₹1Cr     | ₹25K       | 12 months   | 2 files   | View    |
| ICICI   | Priya   | ₹1.8L   | ₹1Cr     | ₹20K       | 12 months   | 3 files   | View    |
```

**Option 2: Card View** (Better for mobile)
```
┌─────────────────────────────────┐
│ HDFC ERGO General Insurance     │
│ Rajesh Kumar • rajesh@hdfc.com  │
│                                  │
│ Premium: ₹1,50,000              │
│ Coverage: ₹1,00,00,000          │
│ Deductible: ₹25,000             │
│ Policy Term: 12 months          │
│                                  │
│ 📄 quote.pdf  📄 policy.pdf     │
│                                  │
│ [View Details] [Download All]   │
└─────────────────────────────────┘
```

### Comparison Features:

**Side-by-Side Comparison:**
Allow selecting 2-3 bids and showing them in columns for easy comparison.

```javascript
const [selectedBids, setSelectedBids] = useState([]);

const handleSelectForComparison = (bid) => {
  if (selectedBids.find(b => b.id === bid.id)) {
    setSelectedBids(selectedBids.filter(b => b.id !== bid.id));
  } else if (selectedBids.length < 3) {
    setSelectedBids([...selectedBids, bid]);
  }
};
```

### Empty State:

If no bids submitted yet:
```javascript
<EmptyState
  icon={<InboxIcon />}
  title="No Bids Received Yet"
  description="Bids will appear here once insurers submit their quotes."
  action={
    <Button onClick={() => router.push(`/rfq/${rfqId}/distribute`)}>
      Send More Invitations
    </Button>
  }
/>
```

### Document Handling:

**Download Individual Document:**
```javascript
const handleDownloadDocument = (doc) => {
  window.open(doc.file_url, '_blank');
};
```

**Download All Documents for a Bid:**
```javascript
const handleDownloadAllDocuments = (bid) => {
  bid.bid_documents.forEach(doc => {
    window.open(doc.file_url, '_blank');
  });
};
```

### Stats Summary:

Show at top of page:
```javascript
<div className="bid-stats">
  <StatCard
    label="Total Bids Received"
    value={bids.length}
  />
  <StatCard
    label="Lowest Premium"
    value={`₹${Math.min(...bids.map(b => b.premium_amount)).toLocaleString()}`}
  />
  <StatCard
    label="Highest Coverage"
    value={`₹${Math.max(...bids.map(b => b.coverage_amount)).toLocaleString()}`}
  />
  <StatCard
    label="Average Premium"
    value={`₹${(bids.reduce((sum, b) => sum + b.premium_amount, 0) / bids.length).toLocaleString()}`}
  />
</div>
```

---

## 🗂️ DEVELOPMENT PLAN - FULL OVERVIEW

### ✅ PHASE 1: COMPLETED (Week 1)
- Days 1-2: Draft Management
- Days 3-5: Core Distribution
- Total: 100% Complete

### 🚀 PHASE 2: CRITICAL PATH (CURRENT - Do First)
**Estimated Time:** 3-4 days

#### Day 1-2: Bid Submission Portal
- [ ] Read reference documents (component-library-and-user-stories.docx)
- [ ] Create `/bid/[token]/page.js` with token validation
- [ ] Create bid submission form UI
- [ ] Integrate UploadThing for document uploads
- [ ] Create `/api/parse-quote/route.js` for Llama Parse
- [ ] Create `/api/bid/submit/route.js` for submission
- [ ] Handle all UI states (loading, invalid, expired, success)
- [ ] Test end-to-end flow

#### Day 3-4: Bid Review/Comparison Page
- [ ] Create `/rfq/[id]/review/page.js`
- [ ] Load and display all bids for RFQ
- [ ] Create table view layout
- [ ] Create card view layout (mobile)
- [ ] Add side-by-side comparison feature
- [ ] Add document download functionality
- [ ] Add stats summary
- [ ] Handle empty state
- [ ] Test with multiple bids

### 📦 PHASE 3: WEEK 2 FEATURES (After Critical Path)
**Estimated Time:** 5-7 days

#### Feature 1: CSV Import for Bulk Contacts (1-2 days)
- [ ] Add CSV upload button on distribute page (Direct Contacts tab)
- [ ] Create `/api/contacts/import-csv/route.js`
- [ ] Parse CSV (columns: email, company, contact_person)
- [ ] Validate all emails
- [ ] Show preview table before adding
- [ ] Handle duplicates
- [ ] Add all valid contacts to distribution list
- [ ] Show error report for invalid rows

**CSV Format:**
```csv
email,company,contact_person
corporate@hdfc.com,HDFC ERGO,Rajesh Kumar
contact@icici.com,ICICI Lombard,Priya Sharma
```

#### Feature 2: Enhanced Tracking Dashboard (2-3 days)
- [ ] Update tracking page with real-time data
- [ ] Integrate Brevo webhooks for email events
- [ ] Create `/api/webhooks/brevo/route.js` to receive events
- [ ] Track email delivered, opened, clicked events
- [ ] Update `rfq_invitations` status in real-time
- [ ] Add "Resend Invitation" button for specific recipients
- [ ] Create `/api/rfq/[id]/resend-invitation/route.js`
- [ ] Add visual charts (invitation funnel)
- [ ] Add export to CSV functionality
- [ ] Show link click tracking

**Brevo Webhook Events:**
- `delivered` - Email successfully delivered
- `opened` - Recipient opened email
- `clicked` - Recipient clicked link in email
- `bounced` - Email bounced
- `spam` - Marked as spam

#### Feature 3: Automated Reminder Emails (1 day)
- [ ] Add reminder configuration on distribute page
- [ ] Create database table `email_reminders` (or add to `email_automations`)
- [ ] Create cron job or background worker
- [ ] Create `/api/cron/send-reminders/route.js`
- [ ] Query invitations where:
  - Status = 'sent' or 'opened' (not 'submitted')
  - Deadline approaching (X days away)
  - No reminder sent yet
- [ ] Send reminder email using existing `sendReminderEmail()` from brevo.js
- [ ] Log reminder in `email_logs`
- [ ] Add manual "Send Reminder Now" button on tracking page

#### Feature 4: Bid Submission Tracking (1 day)
- [ ] Update tracking page to show bid submissions
- [ ] Join `rfq_invitations` with `bids` table
- [ ] Show "Bid Submitted" status with timestamp
- [ ] Add "View Bid" link from tracking page to review page
- [ ] Show conversion rate (invitations → bids)
- [ ] Highlight which invitations converted

### 🎨 PHASE 4: AI ANALYSIS & RECOMMENDATIONS (Week 3)
**Estimated Time:** 5-7 days

#### AI-Powered Bid Analysis
- [ ] Read technical-specifications.docx for AI agent architecture
- [ ] Set up Claude API integration
- [ ] Set up Langchain for agentic workflows
- [ ] Create Quote Analysis Agent (extract structured data)
- [ ] Create Coverage Gap Agent (identify missing coverages)
- [ ] Create Risk Assessment Agent (flag potential issues)
- [ ] Create Terms Analysis Agent (summarize T&C)
- [ ] Create Recommendation Agent (rank quotes)
- [ ] Add AI analysis results to bid review page
- [ ] Show confidence scores
- [ ] Generate plain language recommendations

### 💰 PHASE 5: PAYMENTS & SUBSCRIPTIONS (Week 4)
**Estimated Time:** 3-4 days

#### Razorpay Integration
- [ ] Set up Razorpay account
- [ ] Add Razorpay keys to environment variables
- [ ] Implement free first RFQ logic
- [ ] Create payment gateway page
- [ ] Create `/api/payments/create-order/route.js`
- [ ] Create `/api/payments/verify/route.js`
- [ ] Update subscription status after payment
- [ ] Show subscription status on dashboard
- [ ] Add "Upgrade" button when quota exceeded
- [ ] Generate invoices

### 👥 PHASE 6: PROFILE MANAGEMENT (Week 5)
**Estimated Time:** 2-3 days

#### Company Profile Pages
- [ ] Create `/network/[companyId]/page.js`
- [ ] Display company details from `network_members`
- [ ] Show ratings and reviews
- [ ] Show specializations
- [ ] Show past RFQs they've bid on (if any)
- [ ] Add AI-enhanced descriptions

### 🔧 PHASE 7: ADMIN PANEL (Week 6)
**Estimated Time:** 3-4 days

#### Admin Dashboard
- [ ] Create `/admin/dashboard/page.js`
- [ ] Show user activity metrics
- [ ] Show RFQ statistics
- [ ] Show email delivery rates
- [ ] Partner verification workflow
- [ ] System health monitoring

---

## 🛠️ TECHNICAL IMPLEMENTATION NOTES

### Database Queries You'll Need:

**Get RFQ with all bids:**
```sql
SELECT
  rfqs.*,
  insurance_products.name as product_name,
  companies.name as company_name,
  (
    SELECT json_agg(
      json_build_object(
        'id', bids.id,
        'bidder_company_name', bids.bidder_company_name,
        'premium_amount', bids.premium_amount,
        'coverage_amount', bids.coverage_amount,
        'created_at', bids.created_at,
        'documents', (
          SELECT json_agg(bid_documents.*)
          FROM bid_documents
          WHERE bid_documents.bid_id = bids.id
        )
      )
    )
    FROM bids
    WHERE bids.rfq_id = rfqs.id
  ) as bids
FROM rfqs
LEFT JOIN insurance_products ON rfqs.product_id = insurance_products.id
LEFT JOIN companies ON rfqs.company_id = companies.id
WHERE rfqs.id = $1 AND rfqs.user_id = $2;
```

**Using Supabase Client:**
```javascript
const { data } = await supabase
  .from('rfqs')
  .select(`
    *,
    insurance_products (name),
    companies (name),
    bids (
      *,
      bid_documents (*)
    )
  `)
  .eq('id', rfqId)
  .eq('user_id', user.id)
  .single();
```

### File Upload Pattern (UploadThing):

**Already Working In:**
- `/apps/platform/src/app/rfq/[id]/upload/page.js`

**Reference Implementation:**
```javascript
import { UploadDropzone } from '@/utils/uploadthing';

<UploadDropzone
  endpoint="pdfUploader"
  onClientUploadComplete={(res) => {
    console.log('Files: ', res);
    setUploadedFiles(res);
  }}
  onUploadError={(error) => {
    alert(`ERROR! ${error.message}`);
  }}
/>
```

**UploadThing Config:**
- Already set up: `/apps/platform/src/app/api/uploadthing/route.js`
- Endpoints: `pdfUploader`, `imageUploader`

### Llama Parse Pattern:

**Reference Existing Implementation:**
`/apps/platform/src/app/api/rfq/[id]/extract-policy/route.js`

```javascript
const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
  },
  body: formData
});

const result = await response.json();
// Process result.markdown or result.text
```

### Email Sending Pattern:

**Already Implemented:**
```javascript
import { sendInvitationEmail } from '@sanctuari/utils/email/brevo';

const result = await sendInvitationEmail({
  to: 'recipient@example.com',
  contactPerson: 'John Doe',
  rfq: rfqObject,
  token: 'abc123...',
  expiresAt: new Date(),
  deadline: new Date(),
  templateId: 'standard' // or 'urgent'
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

---

## 📁 KEY FILE LOCATIONS

### Database:
- Schema: `/packages/database/migrations/001_initial_schema.sql`
- RLS Policies: Migration 015 (invitation policies)
- Network Members Seed: Migration 014 (21 contacts)

### Utilities:
- Token Generation: `/packages/utils/generators.js`
- Email Sending: `/packages/utils/email/brevo.js`
- Email Templates: `/packages/utils/email/templates.js`

### Working Pages:
- Dashboard: `/apps/platform/src/app/dashboard/page.js`
- Bid Centre: `/apps/platform/src/app/(dashboard)/rfqs/page.js`
- Distribution: `/apps/platform/src/app/rfq/[id]/distribute/page.js`
- Tracking: `/apps/platform/src/app/rfq/[id]/tracking/page.js`
- RFQ Creation: `/apps/platform/src/app/rfq/[id]/create/page.js`
- Policy Upload: `/apps/platform/src/app/rfq/[id]/upload/page.js`

### APIs:
- Network Members: `/apps/platform/src/app/api/network/members/route.js`
- Distribute: `/apps/platform/src/app/api/rfq/[id]/distribute/route.js`
- Extract Policy: `/apps/platform/src/app/api/rfq/[id]/extract-policy/route.js`

### UI Components:
- All in: `/packages/ui/components/`
- Sidebar, TopBar, Card, Button, EmptyState available

---

## ⚠️ CRITICAL ISSUES TO AVOID

### 1. **NO EMOJIS**
NEVER use emoji characters in JSX. Always use SVG icons.
```javascript
// ❌ WRONG
<div>📄 Document</div>

// ✅ CORRECT
<div>
  <svg>...</svg>
  Document
</div>
```

### 2. **Async Params in Next.js 15**
ALL dynamic routes must unwrap params promise.
```javascript
// ❌ WRONG
export default function Page({ params }) {
  const id = params.id; // Will fail
}

// ✅ CORRECT
export default function Page({ params }) {
  const [id, setId] = useState(null);
  useEffect(() => {
    Promise.resolve(params).then(p => setId(p.id));
  }, [params]);
  if (!id) return <Loading />;
  return <PageClient id={id} />;
}
```

### 3. **Authentication in API Routes**
NEVER use `getUser()` from auth.js in API routes.
```javascript
// ❌ WRONG
import { getUser } from '@sanctuari/database/lib/auth';
const { user } = await getUser(); // Uses client-side client

// ✅ CORRECT
import { createClient } from '@sanctuari/database/lib/server';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### 4. **RLS Policies**
All tables have RLS enabled. Service role key bypasses RLS, but anon key enforces it.

In API routes, you're using the server client which uses cookies (anon key).
Users can only access their own RFQs via RLS policies.

For public endpoints (like bid submission), you may need to use service role:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// This bypasses RLS - use carefully!
```

### 5. **Environment Variables**
In Vercel, environment variables only apply to NEW deployments.
After adding/changing variables, you MUST redeploy.

---

## 🧪 TESTING CHECKLIST

### Before Marking Features Complete:

#### Bid Submission Portal:
- [ ] Token validation works (valid/invalid/expired)
- [ ] RFQ details display correctly
- [ ] Form validation works
- [ ] PDF upload works via UploadThing
- [ ] Llama Parse extraction works
- [ ] Form pre-fills with extracted data
- [ ] Manual edits possible after extraction
- [ ] Multiple documents uploadable
- [ ] Submission creates bid record in database
- [ ] Invitation status updates to 'submitted'
- [ ] Success screen shows
- [ ] Mobile responsive
- [ ] No emojis used

#### Bid Review Page:
- [ ] RFQ loads with all bids
- [ ] Table view displays correctly
- [ ] Card view works on mobile
- [ ] Stats summary calculates correctly
- [ ] Document downloads work
- [ ] Empty state shows when no bids
- [ ] Side-by-side comparison works
- [ ] Only RFQ owner can access (RLS enforced)
- [ ] Mobile responsive
- [ ] No emojis used

---

## 🚨 IF YOU GET STUCK

### Common Issues & Solutions:

**Issue:** RLS policy error
**Solution:** Check migration 015 was run. May need to add specific policy for the operation.

**Issue:** Environment variable not found
**Solution:** Check Vercel dashboard. Redeploy after adding variable.

**Issue:** Async params error
**Solution:** Use Promise.resolve pattern shown above.

**Issue:** Email not sending
**Solution:** Check BREVO_API_KEY starts with `xkeysib-` (NOT `xsmtpsib-`)

**Issue:** UploadThing upload fails
**Solution:** Check UPLOADTHING_SECRET is set. Check file size limits.

**Issue:** Llama Parse fails
**Solution:** Check LLAMA_CLOUD_API_KEY is set. Check file is valid PDF.

---

## 📞 HANDOFF COMPLETE

This document contains everything you need to build the critical path features.

**Priority Order:**
1. Read reference documents (component-library-and-user-stories.docx)
2. Build Bid Submission Portal (`/bid/[token]`)
3. Build Bid Review Page (`/rfq/[id]/review`)
4. Test end-to-end flow
5. Then proceed to Week 2 features

**Success Criteria:**
When an insurer receives an invitation email, clicks the link, submits a bid, and the RFQ creator can view and compare all bids - the critical path is complete.

Good luck! 🚀
