# Sanctuari Platform - Nomenclature Guide

**Date:** October 8, 2025
**Purpose:** Standardize terminology across the platform for clarity and consistency

---

## User-Facing Terminology (What Users See)

### Primary Terms:

| Term | Definition | Usage Example |
|------|------------|---------------|
| **BID** | A request for insurance quotes created by the client | "Create New Bid", "My Bids", "BID-2025-001" |
| **QUOTE** | A proposal submitted by an insurer/broker in response to a bid | "3 Quotes Received", "Compare Quotes", "View Quote" |
| **BID CENTRE** | Dashboard showing all bids created by the user | "Bid Centre" (main navigation) |
| **PARTNER** | An insurer or broker who can submit quotes | "Send to Partners", "Select Partners" |
| **INVITATION** | Email sent to partners to submit quotes | "25 Invitations Sent" |

### Secondary Terms:

| Term | Definition | Usage Example |
|------|------------|---------------|
| **BID NUMBER** | Unique identifier for each bid | "BID-2025-001", "BID-2025-042" |
| **BID DETAILS** | Summary information about a bid | "View Bid Details", "Edit Bid" |
| **QUOTE SUBMISSION** | When a partner submits their proposal | "Quote Submitted Successfully" |
| **QUOTE COMPARISON** | Comparing multiple quotes side-by-side | "Compare Up to 3 Quotes" |

---

## Technical Terminology (Database & Code)

### Database Tables (DO NOT RENAME):

| Table Name | Represents | User-Facing Term |
|------------|------------|------------------|
| `rfqs` | User's bids (requests for quotes) | "Bid" |
| `bids` | Partner quotes (responses to bids) | "Quote" |
| `rfq_invitations` | Invitations to partners | "Invitation" |
| `bid_documents` | Quote documents uploaded by partners | "Quote Documents" |
| `rfq_responses` | User's answers to bid questions | "Bid Responses" |
| `rfq_questions` | Question templates for bids | "Bid Questions" |

### Code Variables (Keep for Consistency):

```javascript
// Variable names stay the same (database field names)
const rfqId = params.id;              // Keep
const rfqNumber = data.rfq_number;    // Keep
const rfqs = await supabase.from('rfqs'); // Keep

// But UI labels change:
<span>Bid Number: {rfqNumber}</span>  // Display as "Bid Number"
<h1>Create New Bid</h1>               // Not "Create New RFQ"
```

---

## Find & Replace Mapping

### User-Facing Text (UI Labels):

**Replace these exact strings in JSX/UI text:**

```
"Create RFQ" → "Create Bid"
"Create New RFQ" → "Create New Bid"
"My RFQs" → "My Bids"
"RFQ Details" → "Bid Details"
"RFQ Number" → "Bid Number"
"RFQ-2025" → "BID-2025"
"Edit RFQ" → "Edit Bid"
"Delete RFQ" → "Delete Bid"
"Publish RFQ" → "Publish Bid"
"RFQ created" → "Bid created"
"RFQ updated" → "Bid updated"
"RFQ Dashboard" → "Bid Centre"

"View Bids" → "View Quotes" (when referring to partner submissions)
"Submitted Bids" → "Submitted Quotes"
"Bid Submission" → "Quote Submission" (partner action)
"Bid Review" → "Quote Comparison"
"Compare Bids" → "Compare Quotes"
"Download Bid" → "Download Quote"
"Bidder" → "Partner"
"Bidder Email" → "Partner Email"
"Bidder Company" → "Partner Company"

"Distribute RFQ" → "Send Bid to Partners"
"RFQ Tracking" → "Track Partner Responses"
"RFQ Invitations" → "Bid Invitations"
```

### Comments (Update for Clarity):

```javascript
// BEFORE:
// Load all RFQs for the company
// Create RFQ with draft status
// Show all RFQs with filtering and bid management

// AFTER:
// Load all bids for the company
// Create bid with draft status
// Show all bids with filtering and quote management
```

---

## File-by-File Update Plan

### 1. Bid Centre Page
**File:** `/apps/platform/src/app/(dashboard)/rfqs/page.js`

**Changes:**
- Page heading: "Bid Centre"
- Search placeholder: "Search by bid number, product, or title..."
- Empty state: "Create your first bid to get started"
- Button: "Create New Bid"
- Card label: "Bid #BID-2025-001"
- Comments: Update to reference "bids" not "RFQs"

### 2. Bid Creation Flow
**Files:**
- `/apps/platform/src/app/rfq/create/page.js`
- `/apps/platform/src/app/rfq/[id]/create/page.js`

**Changes:**
- Wizard heading: "Create New Bid"
- Progress steps: "Bid Details", "Policy Information", etc.
- Success message: "Bid created successfully!"
- Review page: "Review Bid Before Publishing"

### 3. Distribution Page
**File:** `/apps/platform/src/app/rfq/[id]/distribute/page.js`

**Changes:**
- Heading: "Send Bid to Partners"
- Tabs: Keep as-is (Contacts, Network, Settings)
- Button: "Send Invitations to Partners"
- Success: "Bid sent to 15 partners successfully!"

### 4. Tracking Page
**File:** `/apps/platform/src/app/rfq/[id]/tracking/page.js`

**Changes:**
- Heading: "Track Partner Responses"
- Stats: "Invitations Sent", "Opened by Partners", "Quotes Received"
- Table: "Partner Email", "Partner Company", "Status"
- Empty state: "No partner responses yet"

### 5. Quote Comparison Page
**File:** `/apps/platform/src/app/rfq/[id]/review/page.js`

**Changes:**
- Heading: "Quote Comparison"
- Stats: "Total Quotes Received", "Lowest Premium", "Best Coverage"
- Table headers: "Partner", "Quote Details", "Premium", "Coverage"
- Button: "Compare Quotes", "Download Quote Document"
- Empty state: "No quotes submitted yet. Check tracking to see partner status."

### 6. Quote Submission Portal (Partner-Facing)
**File:** `/apps/platform/src/app/bid/[token]/page.js`

**Changes:**
- Heading: "Submit Your Quote"
- Form labels: "Quote Details", "Upload Quote Document"
- Success: "Quote submitted successfully!"
- Description: "Review the bid details below and submit your quote"

---

## Bid Number Format

### Database Function Update:

**Current:** Generates `RFQ-2025-0001`
**New:** Generate `BID-2025-0001`

**File to Update:** Database migration or function

```sql
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  bid_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  -- Look for BID- prefix instead of RFQ-
  SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'BID-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.rfqs
  WHERE rfq_number LIKE 'BID-' || year || '-%';

  bid_num := 'BID-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN bid_num;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Checklist

After making changes, verify:

- [ ] Bid Centre displays "My Bids" or "Bid Centre"
- [ ] Create button says "Create New Bid"
- [ ] Search placeholder mentions "bid number"
- [ ] Bid cards show "Bid #BID-2025-001"
- [ ] Distribution page says "Send Bid to Partners"
- [ ] Tracking shows "Partner Responses" and "Quotes Received"
- [ ] Review page says "Quote Comparison" not "Bid Review"
- [ ] Partner portal says "Submit Your Quote"
- [ ] All generated bid numbers use BID- prefix
- [ ] No user-facing text says "RFQ" (except in code/variables)
- [ ] Database tables remain unchanged (rfqs, bids)

---

## Exception Cases (Keep "RFQ")

**These should KEEP "RFQ" terminology:**

1. **Code variables and function names** (for code consistency)
   ```javascript
   const rfqId = params.id;  // Keep
   const loadRFQData = async () => {}  // Keep
   ```

2. **Database table names and fields** (breaking changes)
   ```sql
   SELECT * FROM rfqs;  -- Keep
   WHERE rfq_number = 'BID-2025-001';  -- Field name stays
   ```

3. **API endpoints** (breaking changes for any integrations)
   ```
   /api/rfq/create  -- Keep
   /api/rfq/[id]/distribute  -- Keep
   ```

4. **File/folder paths** (risky to rename in Next.js app router)
   ```
   /app/rfq/[id]/  -- Keep
   ```

5. **Internal comments that reference technical architecture**
   ```javascript
   // Technical: rfqs table stores bid requests
   // Keep this kind of comment for developer clarity
   ```

---

## Summary

**Simple Rule:**
- **User sees it?** → Use "Bid" (for requests) and "Quote" (for responses)
- **Code/Database?** → Keep existing names (rfq, bid tables)

**User Mental Model:**
```
I create a BID → I send it to PARTNERS → They submit QUOTES → I compare QUOTES
```

**Technical Reality:**
```
rfqs table (user's bid) → rfq_invitations → bids table (partner quotes)
```

---

**Last Updated:** October 8, 2025
**Status:** Active Guide - Use for all platform development
