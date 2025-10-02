# Phase 6: Draft Management & Distribution Improvements
**Implementation Plan for Sanctuari Platform**

**Date:** October 2, 2025
**Status:** Ready for Implementation
**Prerequisites:** Phase 5 (Policy Upload) ✅ Complete

---

## EXECUTIVE SUMMARY

Based on comprehensive codebase analysis and the component-library-and-user-stories document, this plan addresses:

1. **Draft Management** (60% complete → 100%)
2. **Bid Distribution System** (5% complete → 100%)
3. **Advanced Field Types** (included in distribution forms)

### Current State Assessment

#### Draft Management: 60% Complete
**What Works:**
- ✅ Auto-save every 30 seconds with visual indicators
- ✅ Manual "Save Draft" button
- ✅ Draft RFQs displayed on dashboard with status badges
- ✅ Database schema fully supports drafts
- ✅ Response persistence and reload on wizard mount

**What's Missing:**
- ❌ **Cannot click draft RFQs to resume editing** (Critical UX blocker)
- ❌ No `/rfqs` list page (sidebar link goes to 404)
- ❌ No `/bids` page implementation (placeholder only)
- ❌ No draft filtering or management actions
- ❌ No exit confirmation for unsaved changes

#### Distribution System: 5% Complete
**What Exists:**
- ✅ Database schema complete (rfq_invitations, email_logs, network_members)
- ✅ Brevo email service configured
- ✅ Placeholder distribution page UI

**What's Missing:**
- ❌ All distribution functionality (CSV import, network selection, email sending)
- ❌ Unique link generation and validation
- ❌ Distribution tracking dashboard
- ❌ Bidder portal (`/bid/[token]` page)
- ❌ Email templates and automation

---

## PART 1: DRAFT MANAGEMENT IMPROVEMENTS

### User Stories (from component-library-and-user-stories.docx)

**Module 1: RFQ Creation - Draft & Resume**
> "As a client, I want to save my RFQ progress as a draft, so I can return later and complete it without losing my work."
>
> **Acceptance Criteria:**
> - Auto-save triggers every 30 seconds ✅
> - "Save Draft" button manually saves progress ✅
> - Draft RFQs appear on dashboard with "Draft" badge ✅
> - User can click draft to resume editing ❌ (MISSING)
> - Exit confirmation if unsaved changes exist ❌ (MISSING)

### Implementation Tasks

#### Task 1.1: Enable Draft Resume from Dashboard
**Priority:** CRITICAL
**Effort:** 2 hours
**File:** `/apps/platform/src/app/dashboard/page.js`

**Changes:**
```javascript
// Add click handler function (after line 136)
const handleResumeRFQ = (rfq) => {
  // Check if user needs to upload policy or go to wizard
  if (rfq.status === 'draft') {
    // Check if responses exist
    const hasResponses = /* check if responses exist for this RFQ */;

    if (!hasResponses) {
      // No responses yet, start with upload page
      router.push(`/rfq/${rfq.id}/upload`);
    } else {
      // Has responses, go directly to wizard
      router.push(`/rfq/${rfq.id}/create`);
    }
  } else {
    // Published RFQs go to review/tracking
    router.push(`/rfq/${rfq.id}/review`);
  }
};

// Update RFQ card (line 195)
<Card
  key={rfq.id}
  className="dashboard-rfq-card"
  onClick={() => handleResumeRFQ(rfq)}
  style={{ cursor: 'pointer' }}
>
```

**CSS Updates:** `/apps/platform/src/app/dashboard/dashboard.css`
```css
.dashboard-rfq-card {
  /* existing styles */
  cursor: pointer;
  transition: all 0.2s ease;
}

.dashboard-rfq-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(7, 9, 33, 0.1);
  border-color: var(--iris);
}
```

#### Task 1.2: Create /rfqs List Page
**Priority:** HIGH
**Effort:** 6 hours
**File:** `/apps/platform/src/app/rfqs/page.js` (NEW)

**Features:**
- Tab navigation: All | Drafts | Published | Completed
- Search by RFQ number or product name
- Filter by status and date range
- Actions: Continue Editing, Delete (drafts only), View Details
- Pagination (10 per page)

**UI Layout:**
```
RFQ Management

[Search RFQs...] [Filter: All Status ▼] [Date: Last 30 days ▼]

Tabs: [All (15)] [Drafts (3)] [Published (8)] [Completed (4)]

┌─────────────────────────────────────────────────────────┐
│ RFQ-2025-0005 [Draft]                                   │
│ Group Health Insurance                                  │
│ Created: Oct 2, 2025 | Last edited: 2 hours ago        │
│ Progress: 60% complete (12/20 fields)                   │
│ [Continue Editing] [Delete Draft]                       │
├─────────────────────────────────────────────────────────┤
│ RFQ-2025-0004 [Published]                               │
│ Marine Cargo Insurance                                  │
│ Published: Oct 1, 2025 | Deadline: Oct 15, 2025        │
│ Bids: 3 received, 7 pending                             │
│ [View Bids] [Track Distribution]                        │
└─────────────────────────────────────────────────────────┘

[< Previous] [Page 1 of 2] [Next >]
```

**API Endpoint:** `/apps/platform/src/app/api/rfqs/route.js` (NEW)
```javascript
GET /api/rfqs?status=draft&page=1&limit=10
// Returns paginated list with filters
```

#### Task 1.3: Implement /bids Page
**Priority:** HIGH
**Effort:** 4 hours
**File:** `/apps/platform/src/app/(dashboard)/bids/page.js` (UPDATE)

**Features:**
- Show RFQs with bid activity
- Draft RFQs with "Continue Editing" button
- Published RFQs with bid counts and latest activity
- Quick actions: View Bids, Send Reminder, Close Bidding

**UI Layout:**
```
Bid Management

Active RFQs with Bidding
┌─────────────────────────────────────────────────────────┐
│ RFQ-2025-0004 - Marine Cargo Insurance                  │
│ Published: Oct 1, 2025 | Deadline: Oct 15, 2025        │
│                                                          │
│ Bids: 3/10 submitted | Last activity: 1 hour ago       │
│ [ABC Insurance] [XYZ Brokers] [DEF Insurance]          │
│                                                          │
│ [View All Bids] [Send Reminder to Pending]             │
└─────────────────────────────────────────────────────────┘

Draft RFQs (Not Yet Distributed)
┌─────────────────────────────────────────────────────────┐
│ RFQ-2025-0005 - Group Health Insurance [Draft]          │
│ Created: Oct 2, 2025 | 60% complete                     │
│ [Continue Editing] [Delete]                              │
└─────────────────────────────────────────────────────────┘
```

#### Task 1.4: Exit Confirmation for Unsaved Changes
**Priority:** MEDIUM
**Effort:** 2 hours
**File:** `/apps/platform/src/app/rfq/[id]/create/page.js`

**Implementation:**
```javascript
// Add to useEffect (after line 152)
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [hasUnsavedChanges]);
```

#### Task 1.5: Enhanced Auto-Save Indicators
**Priority:** LOW
**Effort:** 2 hours
**File:** `/apps/platform/src/app/rfq/[id]/create/page.js`

**Improvements:**
- Add timestamp: "Last saved at 2:45 PM"
- Section-wide save status (not just active question)
- Error handling with retry button
- Reduce timer to 15 seconds (from 30)

---

## PART 2: BID DISTRIBUTION SYSTEM

### User Stories (from component-library-and-user-stories.docx)

**Module 2: Bid Distribution**

**Story 2.1: Add Direct Contacts**
> "As a client, I want to manually add insurer/broker email addresses, so I can invite specific partners I already work with."
>
> **Acceptance Criteria:**
> - Email validation (format check) ✅ Real-time validation
> - Duplicate detection within list ✅
> - CSV import for bulk upload ✅
> - Preview list before sending ✅

**Story 2.2: Select from Sanctuari Network**
> "As a client, I want to browse and select from Sanctuari's verified network, so I can discover new insurance partners."
>
> **Acceptance Criteria:**
> - Filter by type (insurer/broker), category (general/health/life)
> - Search by company name
> - View partner profiles (ratings, specializations, past performance)
> - Multi-select with visual indicators
> - Show partner trust badges (verified, top-rated)

**Story 2.3: Generate Unique Bidder Links**
> "As a client, I want to generate unique submission links for each bidder, so I can track who accessed the RFQ and submitted quotes."
>
> **Acceptance Criteria:**
> - Unique token per invitation ✅ Cryptographically secure
> - Expiry date configuration (7/14/30 days)
> - Copy link functionality
> - Shareable via email or messaging

**Story 2.4: Email Notifications**
> "As a client, I want to automatically send email invitations to selected bidders, so they are notified immediately."
>
> **Acceptance Criteria:**
> - Email sent from bids@sanctuari.io ✅
> - Professional template with RFQ details
> - Unique link embedded in email
> - Delivery confirmation tracking
> - Resend functionality for failed deliveries

**Story 2.5: Distribution Tracking**
> "As a client, I want to see who opened the RFQ and who submitted quotes, so I can follow up with non-responsive bidders."
>
> **Acceptance Criteria:**
> - Dashboard showing invitation status (sent/opened/submitted)
> - Timestamp tracking (sent, opened, submitted)
> - Send reminder to pending bidders
> - Revoke access if needed
> - Export distribution report

### Implementation Phases

---

### PHASE 2A: CORE DISTRIBUTION (WEEK 1)

#### Task 2A.1: Distribution Page UI
**Priority:** CRITICAL
**Effort:** 8 hours
**File:** `/apps/platform/src/app/rfq/[id]/distribute/page.js` (UPDATE)

**Replace placeholder with functional form:**

**Tab 1: Direct Contacts**
```jsx
<div className="distribution-tab">
  <h3>Add Direct Contacts</h3>

  {/* Manual Email Entry */}
  <div className="email-input-section">
    <input
      type="email"
      placeholder="Enter email address"
      onBlur={validateEmail}
    />
    <input
      type="text"
      placeholder="Company name (optional)"
    />
    <button onClick={addContact}>Add</button>
  </div>

  {/* Contact List */}
  <div className="contact-list">
    {contacts.map(contact => (
      <ContactCard
        email={contact.email}
        company={contact.company}
        onRemove={() => removeContact(contact.id)}
      />
    ))}
  </div>

  {/* CSV Upload */}
  <div className="csv-upload-section">
    <p>Or upload CSV with multiple contacts</p>
    <CSVUploader
      onUpload={handleCSVUpload}
      template={downloadCSVTemplate}
    />
  </div>
</div>
```

**Tab 2: Sanctuari Network**
```jsx
<div className="network-tab">
  <div className="network-filters">
    <input type="search" placeholder="Search insurers/brokers..." />
    <select name="type">
      <option>All Types</option>
      <option>Insurers</option>
      <option>Brokers</option>
    </select>
    <select name="category">
      <option>All Categories</option>
      <option>General Insurance</option>
      <option>Health Insurance</option>
      <option>Life Insurance</option>
    </select>
  </div>

  <div className="network-grid">
    {networkMembers.map(member => (
      <NetworkMemberCard
        member={member}
        selected={selectedMembers.includes(member.id)}
        onSelect={toggleMemberSelection}
      />
    ))}
  </div>

  <div className="selection-summary">
    {selectedMembers.length} partners selected
    <button onClick={addSelectedToContacts}>Add to Distribution List</button>
  </div>
</div>
```

**Tab 3: Link Settings**
```jsx
<div className="link-settings-tab">
  <h3>Distribution Settings</h3>

  <div className="setting-row">
    <label>Link Expiry</label>
    <select value={expiryDays} onChange={setExpiryDays}>
      <option value="7">7 days</option>
      <option value="14">14 days (recommended)</option>
      <option value="30">30 days</option>
      <option value="custom">Custom date</option>
    </select>
  </div>

  <div className="setting-row">
    <label>Submission Deadline</label>
    <input
      type="datetime-local"
      value={deadline}
      onChange={setDeadline}
    />
  </div>

  <div className="setting-row">
    <label>Email Template</label>
    <select value={emailTemplate}>
      <option>Standard Invitation</option>
      <option>Urgent Request</option>
      <option>Custom</option>
    </select>
  </div>
</div>
```

**Final Review & Send**
```jsx
<div className="distribution-summary">
  <h3>Ready to Send</h3>

  <div className="summary-stats">
    <StatCard label="Total Recipients" value={totalRecipients} />
    <StatCard label="Direct Contacts" value={directContacts.length} />
    <StatCard label="Network Partners" value={networkContacts.length} />
    <StatCard label="Expires In" value={`${expiryDays} days`} />
  </div>

  <div className="recipient-preview">
    <h4>Recipients ({totalRecipients})</h4>
    {allContacts.map(contact => (
      <div className="recipient-row">
        <span>{contact.email}</span>
        <span>{contact.company}</span>
        <button onClick={() => removeRecipient(contact)}>Remove</button>
      </div>
    ))}
  </div>

  <div className="send-actions">
    <button className="btn-secondary" onClick={saveDraft}>
      Save Distribution List
    </button>
    <button className="btn-primary" onClick={sendInvitations}>
      Send {totalRecipients} Invitations
    </button>
  </div>
</div>
```

#### Task 2A.2: API Endpoints - Distribution
**Priority:** CRITICAL
**Effort:** 6 hours

**File:** `/apps/platform/src/app/api/rfq/[id]/distribute/route.js` (NEW)

```javascript
import { createClient } from '@sanctuari/database/lib/supabase/server';
import { generateUniqueToken } from '@/utils/generators';
import { sendInvitationEmail } from '@/utils/email/brevo';

export async function POST(request, { params }) {
  const supabase = createClient();
  const { recipients, expiryDays, deadline, templateId } = await request.json();
  const rfqId = params.id;

  // 1. Validate RFQ exists and user owns it
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .single();

  if (!rfq) {
    return Response.json({ error: 'RFQ not found' }, { status: 404 });
  }

  // 2. Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

  // 3. Create invitations
  const invitations = [];

  for (const recipient of recipients) {
    const token = generateUniqueToken(); // 32-char secure random string

    const { data: invitation } = await supabase
      .from('rfq_invitations')
      .insert({
        rfq_id: rfqId,
        network_member_id: recipient.networkMemberId || null,
        external_email: recipient.email,
        unique_link_token: token,
        status: 'sent',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    invitations.push(invitation);

    // 4. Send email
    const emailResult = await sendInvitationEmail({
      to: recipient.email,
      rfq,
      token,
      expiresAt,
      deadline,
      templateId
    });

    // 5. Log email
    await supabase.from('email_logs').insert({
      rfq_id: rfqId,
      invitation_id: invitation.id,
      recipient_email: recipient.email,
      subject: `Invitation to bid on ${rfq.rfq_number}`,
      template_name: templateId,
      status: emailResult.success ? 'sent' : 'failed',
      brevo_message_id: emailResult.messageId,
      error_message: emailResult.error || null
    });
  }

  // 6. Update RFQ status to 'published' if still draft
  if (rfq.status === 'draft') {
    await supabase
      .from('rfqs')
      .update({
        status: 'bidding',
        published_at: new Date().toISOString(),
        deadline: deadline
      })
      .eq('id', rfqId);
  }

  return Response.json({
    success: true,
    invitationCount: invitations.length,
    invitations
  });
}
```

#### Task 2A.3: Token Generation Utility
**Priority:** CRITICAL
**Effort:** 1 hour
**File:** `/packages/utils/generators.js` (NEW)

```javascript
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 32);

export function generateUniqueToken() {
  return nanoid(); // Returns 32-character secure random string
}

export function generateRFQNumber(year, sequence) {
  return `RFQ-${year}-${String(sequence).padStart(4, '0')}`;
}
```

**Install dependency:**
```bash
npm install nanoid
```

#### Task 2A.4: Email Service Integration
**Priority:** CRITICAL
**Effort:** 4 hours
**File:** `/packages/utils/email/brevo.js` (NEW)

```javascript
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME;

export async function sendInvitationEmail({ to, rfq, token, expiresAt, deadline, templateId }) {
  const bidUrl = `${process.env.NEXT_PUBLIC_PLATFORM_URL}/bid/${token}`;

  const emailBody = {
    sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
    to: [{ email: to }],
    subject: `Invitation to bid on ${rfq.rfq_number} - ${rfq.title}`,
    htmlContent: renderTemplate(templateId, {
      rfq_number: rfq.rfq_number,
      product_name: rfq.title,
      bid_url: bidUrl,
      deadline: new Date(deadline).toLocaleDateString('en-IN'),
      expiry_date: expiresAt.toLocaleDateString('en-IN')
    })
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    const data = await response.json();

    return {
      success: response.ok,
      messageId: data.messageId,
      error: response.ok ? null : data.message
    };
  } catch (error) {
    return {
      success: false,
      messageId: null,
      error: error.message
    };
  }
}
```

**File:** `/packages/utils/email/templates.js` (NEW)

```javascript
export const emailTemplates = {
  standard: {
    subject: 'Invitation to bid on {rfq_number} - {product_name}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Geist', sans-serif; color: #070921; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6F4FFF; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #F5F4F5; }
          .button { background: #6F4FFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited to Submit a Quote</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been invited to submit a quote for the following insurance requirement:</p>

            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td><strong>RFQ Number:</strong></td>
                <td>{rfq_number}</td>
              </tr>
              <tr>
                <td><strong>Product:</strong></td>
                <td>{product_name}</td>
              </tr>
              <tr>
                <td><strong>Submission Deadline:</strong></td>
                <td>{deadline}</td>
              </tr>
            </table>

            <p style="text-align: center;">
              <a href="{bid_url}" class="button">Submit Your Quote</a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              This link is valid until {expiry_date}. Please submit your quote before the deadline.
            </p>
          </div>
          <div class="footer">
            <p>Sent from Sanctuari Platform | bids@sanctuari.io</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

export function renderTemplate(templateId, variables) {
  let template = emailTemplates[templateId] || emailTemplates.standard;
  let html = template.html;

  // Replace all variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    html = html.replace(regex, variables[key]);
  });

  return html;
}
```

---

### PHASE 2B: CSV IMPORT & TRACKING (WEEK 2)

#### Task 2B.1: CSV Parser Utility
**Priority:** HIGH
**Effort:** 4 hours
**File:** `/packages/utils/csv.js` (NEW)

```javascript
import Papa from 'papaparse';

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate format
        const requiredFields = ['email'];
        const hasRequiredFields = requiredFields.every(field =>
          results.meta.fields.includes(field)
        );

        if (!hasRequiredFields) {
          reject(new Error('CSV must have at least an "email" column'));
          return;
        }

        // Validate and clean data
        const contacts = results.data
          .filter(row => row.email && validateEmail(row.email))
          .map(row => ({
            email: row.email.toLowerCase().trim(),
            company: row.company_name || row.company || '',
            contactPerson: row.contact_person || row.name || ''
          }));

        // Check for duplicates
        const uniqueContacts = [];
        const seen = new Set();

        contacts.forEach(contact => {
          if (!seen.has(contact.email)) {
            seen.add(contact.email);
            uniqueContacts.push(contact);
          }
        });

        resolve({
          contacts: uniqueContacts,
          duplicates: contacts.length - uniqueContacts.length,
          total: contacts.length
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function exportToCSV(data, filename) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Install dependency:**
```bash
npm install papaparse
```

#### Task 2B.2: CSVUploader Component
**Priority:** HIGH
**Effort:** 4 hours
**File:** `/packages/ui/components/CSVUploader/CSVUploader.js` (NEW)

```javascript
'use client';

import { useState, useRef } from 'react';
import { parseCSV } from '@sanctuari/utils/csv';
import './CSVUploader.css';

export function CSVUploader({ onUpload, onError }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      onError?.('Please upload a CSV file');
      return;
    }

    setParsing(true);

    try {
      const result = await parseCSV(file);
      onUpload?.(result);
    } catch (error) {
      onError?.(error.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`csv-uploader ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {parsing ? (
        <div className="csv-uploader__loading">
          <div className="spinner"></div>
          <p>Parsing CSV file...</p>
        </div>
      ) : (
        <div className="csv-uploader__content">
          <svg className="csv-uploader__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <h3>Upload CSV File</h3>
          <p>Drag and drop or click to browse</p>
          <small>Required column: email | Optional: company_name, contact_person</small>
        </div>
      )}
    </div>
  );
}
```

**File:** `/packages/ui/components/CSVUploader/CSVUploader.css` (NEW)

```css
.csv-uploader {
  border: 2px dashed var(--ink-20);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--white);
}

.csv-uploader:hover,
.csv-uploader.dragging {
  border-color: var(--iris);
  background: var(--fog);
}

.csv-uploader__icon {
  width: 48px;
  height: 48px;
  color: var(--iris);
  margin: 0 auto 16px;
}

.csv-uploader__content h3 {
  font-size: 18px;
  color: var(--ink);
  margin-bottom: 8px;
}

.csv-uploader__content p {
  color: var(--ink-60);
  margin-bottom: 8px;
}

.csv-uploader__content small {
  color: var(--ink-40);
  font-size: 13px;
}

.csv-uploader__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
```

#### Task 2B.3: Distribution Tracking Dashboard
**Priority:** HIGH
**Effort:** 8 hours
**File:** `/apps/platform/src/app/rfq/[id]/tracking/page.js` (NEW)

**Features:**
- Real-time status updates
- Filter by status (All, Sent, Opened, Submitted, Expired)
- Search by email or company
- Actions: Send Reminder, Extend Deadline, Revoke, Resend
- Export distribution report

**API Endpoint:** `/apps/platform/src/app/api/rfq/[id]/invitations/route.js` (NEW)

```javascript
export async function GET(request, { params }) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('rfq_invitations')
    .select(`
      *,
      network_member:network_members(company_name, type, logo_url)
    `)
    .eq('rfq_id', params.id)
    .order('sent_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get email logs for each invitation
  const invitationsWithLogs = await Promise.all(
    data.map(async (invitation) => {
      const { data: emailLog } = await supabase
        .from('email_logs')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      return { ...invitation, emailLog };
    })
  );

  return Response.json({ invitations: invitationsWithLogs });
}
```

---

### PHASE 2C: BIDDER PORTAL & ADVANCED FEATURES (WEEK 3)

#### Task 2C.1: Public Bid Submission Page
**Priority:** CRITICAL
**Effort:** 12 hours
**File:** `/apps/platform/src/app/bid/[token]/page.js` (NEW)

**Public page (no auth required)** where bidders submit quotes.

**Features:**
- Validate token on load (check expiry, submission status)
- Display RFQ details (product, requirements, deadline)
- Upload quote document (PDF/Excel)
- Fill quote details form (premium, coverage, terms)
- Submit quote (creates entry in `bids` table)

**Validation Logic:**
```javascript
async function validateToken(token) {
  const { data: invitation } = await supabase
    .from('rfq_invitations')
    .select(`
      *,
      rfq:rfqs(*)
    `)
    .eq('unique_link_token', token)
    .single();

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation link' };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'This link has expired' };
  }

  if (invitation.status === 'submitted') {
    return { valid: false, error: 'Quote already submitted for this invitation' };
  }

  // Mark as opened if first time
  if (!invitation.opened_at) {
    await supabase
      .from('rfq_invitations')
      .update({
        opened_at: new Date().toISOString(),
        status: 'opened'
      })
      .eq('id', invitation.id);
  }

  return { valid: true, invitation };
}
```

#### Task 2C.2: Reminder System
**Priority:** MEDIUM
**Effort:** 6 hours

**Manual Reminder Trigger:**
**File:** `/apps/platform/src/app/api/rfq/[id]/invitations/[invitationId]/reminder/route.js` (NEW)

```javascript
export async function POST(request, { params }) {
  const { invitationId } = params;

  // Fetch invitation
  const { data: invitation } = await supabase
    .from('rfq_invitations')
    .select('*, rfq:rfqs(*)')
    .eq('id', invitationId)
    .single();

  // Send reminder email
  await sendReminderEmail({
    to: invitation.external_email,
    rfq: invitation.rfq,
    token: invitation.unique_link_token,
    deadline: invitation.rfq.deadline
  });

  return Response.json({ success: true });
}
```

**Automated Reminders (Future Enhancement):**
- Vercel Cron Job to check pending invitations
- Send reminder 3 days before deadline
- Send final reminder 1 day before deadline

#### Task 2C.3: Network Members Management
**Priority:** MEDIUM
**Effort:** 6 hours
**File:** `/apps/platform/src/app/api/network/members/route.js` (NEW)

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // insurer, broker
  const category = searchParams.get('category'); // general, health, life
  const search = searchParams.get('search');

  let query = supabase
    .from('network_members')
    .select('*')
    .eq('is_active', true);

  if (type) query = query.eq('type', type);
  if (category) query = query.eq('category', category);
  if (search) {
    query = query.ilike('company_name', `%${search}%`);
  }

  const { data, error } = await query;

  return Response.json({ members: data });
}
```

**Seed network members data (for testing):**
```sql
INSERT INTO network_members (type, category, company_name, email, specializations, rating) VALUES
('insurer', 'general', 'ABC Insurance Ltd', 'contact@abcinsurance.com', ARRAY['Fire', 'Marine', 'Property'], 4.5),
('insurer', 'health', 'XYZ Health Insurance', 'info@xyzhealth.com', ARRAY['Group Health', 'Individual Health'], 4.8),
('broker', 'general', 'DEF Insurance Brokers', 'hello@defbrokers.com', ARRAY['All Products'], 4.2);
```

---

## PART 3: ADVANCED FIELD TYPES

### Enhanced Form Fields for Distribution & Bidding

Already covered in distribution forms above:
- ✅ Email validation with real-time feedback
- ✅ CSV file upload with drag-drop
- ✅ Date picker for deadline/expiry
- ✅ Multi-select for network members
- ✅ Rich text editor for custom email templates (future)

---

## IMPLEMENTATION TIMELINE

### Week 1: Draft Management + Core Distribution
**Days 1-2: Draft Management**
- Task 1.1: Enable draft resume from dashboard ✅
- Task 1.2: Create /rfqs list page ✅
- Task 1.3: Implement /bids page ✅

**Days 3-5: Core Distribution**
- Task 2A.1: Distribution page UI ✅
- Task 2A.2: API endpoints ✅
- Task 2A.3: Token generation ✅
- Task 2A.4: Email integration ✅

### Week 2: CSV Import + Tracking
**Days 1-2: CSV Import**
- Task 2B.1: CSV parser utility ✅
- Task 2B.2: CSVUploader component ✅

**Days 3-5: Tracking Dashboard**
- Task 2B.3: Distribution tracking page ✅
- Email webhook handler ✅
- Status APIs ✅

### Week 3: Bidder Portal + Polish
**Days 1-3: Bidder Portal**
- Task 2C.1: Public bid submission page ✅
- Token validation logic ✅
- Quote upload and submission ✅

**Days 4-5: Advanced Features**
- Task 2C.2: Reminder system ✅
- Task 2C.3: Network management ✅
- Task 1.4 & 1.5: Draft enhancements ✅

---

## DEPENDENCIES & PACKAGES

**New packages to install:**
```bash
npm install nanoid papaparse
```

**Environment variables (already configured):**
- BREVO_API_KEY ✅
- BREVO_SENDER_EMAIL ✅
- BREVO_SENDER_NAME ✅
- NEXT_PUBLIC_PLATFORM_URL ✅

---

## SUCCESS CRITERIA

### Draft Management Complete When:
- ✅ Users can click draft RFQs from dashboard to resume
- ✅ /rfqs page shows filterable list of all RFQs
- ✅ /bids page shows bid activity and draft management
- ✅ Exit confirmation prevents accidental data loss
- ✅ Auto-save improved with better UX

### Distribution System Complete When:
- ✅ Users can add contacts via manual entry or CSV import
- ✅ Users can browse and select from Sanctuari network
- ✅ System generates unique, secure bidder links with expiry
- ✅ Emails are sent automatically via Brevo with professional templates
- ✅ Distribution tracking dashboard shows real-time status
- ✅ Bidders can submit quotes via public portal
- ✅ Reminders can be sent manually or automatically

---

## TESTING CHECKLIST

### Draft Management Tests:
- [ ] Click draft RFQ from dashboard → Opens wizard at correct step
- [ ] Navigate to /rfqs → Shows all RFQs with filters working
- [ ] Filter drafts → Shows only draft RFQs
- [ ] Delete draft → Removes from database and UI
- [ ] Exit wizard with unsaved changes → Shows confirmation
- [ ] Auto-save triggers after 15 seconds → Response saved to DB

### Distribution Tests:
- [ ] Add email manually → Validates format, prevents duplicates
- [ ] Upload CSV with 10 contacts → All parsed correctly
- [ ] Upload invalid CSV → Shows error with helpful message
- [ ] Select 5 network members → Adds to distribution list
- [ ] Send invitations → Emails delivered to all recipients
- [ ] Click unique link → Loads bid submission page
- [ ] Expired link → Shows expiry message
- [ ] Submit quote via link → Creates bid in database
- [ ] View tracking dashboard → Shows accurate status
- [ ] Send reminder → Email delivered successfully

---

## ROLLBACK PLAN

If issues arise:

1. **Database rollback:** All new features use existing schema (no migrations needed)
2. **Feature flags:** Add environment variable to disable distribution system
3. **Graceful degradation:** If email fails, show manual link copy option

---

## FINAL DELIVERABLES

### Files Created (35 new files):
1. `/apps/platform/src/app/rfqs/page.js`
2. `/apps/platform/src/app/rfq/[id]/tracking/page.js`
3. `/apps/platform/src/app/bid/[token]/page.js`
4. `/apps/platform/src/app/api/rfqs/route.js`
5. `/apps/platform/src/app/api/rfq/[id]/distribute/route.js`
6. `/apps/platform/src/app/api/rfq/[id]/invitations/route.js`
7. `/apps/platform/src/app/api/rfq/[id]/invitations/[invitationId]/reminder/route.js`
8. `/apps/platform/src/app/api/network/members/route.js`
9. `/packages/utils/csv.js`
10. `/packages/utils/generators.js`
11. `/packages/utils/email/brevo.js`
12. `/packages/utils/email/templates.js`
13. `/packages/ui/components/CSVUploader/CSVUploader.js`
14. `/packages/ui/components/CSVUploader/CSVUploader.css`
15. `/packages/ui/components/NetworkMemberCard/NetworkMemberCard.js`
... + 20 more component and utility files

### Files Modified (5 files):
1. `/apps/platform/src/app/dashboard/page.js` - Add click handlers
2. `/apps/platform/src/app/dashboard/dashboard.css` - Add hover styles
3. `/apps/platform/src/app/(dashboard)/bids/page.js` - Replace placeholder
4. `/apps/platform/src/app/rfq/[id]/distribute/page.js` - Replace placeholder
5. `/apps/platform/src/app/rfq/[id]/create/page.js` - Add exit confirmation

---

**Total Effort:** 15-20 developer days (3 weeks with 1 developer)
**Risk Level:** Low (database ready, services configured)
**Impact:** High (completes core platform functionality)

---

*This plan is ready for implementation. Approve to begin work.*
