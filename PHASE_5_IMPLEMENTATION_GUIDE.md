# Phase 5: Policy Upload & Auto-Extraction - Implementation Guide

**Status:** 40% Complete
**Priority:** HIGH - This is the killer feature of Sanctuari
**Estimated Time:** 4-6 hours remaining

---

## 🎯 **What This Feature Does**

Allows users to upload their existing insurance policy PDF and automatically extract data to pre-fill the RFQ form, saving them 80% of form-filling time.

### **User Flow:**
1. User creates RFQ → Redirected to `/rfq/[id]/upload` (BEFORE wizard)
2. User sees two options:
   - ✅ **Upload Existing Policy** (recommended - faster)
   - ⏭️ **Start Fresh** (skip to wizard)
3. If upload chosen:
   - User uploads PDF via UploadThing
   - Progress: "Analyzing policy document..." (30-60 seconds)
   - Claude + Llama Parse extract ALL fields
   - Preview: "Found 45 out of 50 fields"
   - User clicks "Continue to Form"
   - Redirect to wizard with pre-filled data
4. In wizard:
   - Pre-filled fields shown with ✓ badge
   - Only empty fields require user input
   - User can edit any pre-filled field

---

## 📂 **Files Created (40% Complete)**

### ✅ **Completed:**

1. **`/apps/platform/src/app/api/uploadthing/core.js`**
   - UploadThing file router configuration
   - Accepts PDF files up to 16MB
   - Authenticates user before upload
   - Returns file URL on success

2. **`/apps/platform/src/app/api/uploadthing/route.js`**
   - Next.js route handler for UploadThing
   - Exports GET and POST handlers

3. **`/apps/platform/src/app/rfq/[id]/upload/page.js`**
   - Upload page UI component
   - Upload button integration
   - Progress states (uploading, extracting, complete)
   - Results preview with statistics
   - Skip option to go directly to wizard
   - **⚠️ NOTE:** Uses hardcoded colors - needs CSS update to match design system

4. **`/apps/platform/src/app/rfq/[id]/upload/page.css`**
   - Styling for upload page
   - **⚠️ CRITICAL:** Currently uses hardcoded colors (#111827, #6b7280, etc.)
   - **ACTION REQUIRED:** Must be rewritten to use CSS variables from design system
   - See section "CSS Update Required" below

---

## 🚧 **Files Still Needed (60% Remaining)**

### 1. **`/apps/platform/src/app/api/rfq/[id]/extract-policy/route.js`** (CRITICAL)

This is the heart of the feature. Here's the complete implementation:

```javascript
/**
 * API Route: POST /api/rfq/[id]/extract-policy
 * Purpose: Extract data from policy PDF using Llama Parse + Claude
 * Body: { policyUrl: string }
 * Returns: { extractedData, totalFields, extractedFields }
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Llama Parse configuration
const LLAMA_PARSE_API_KEY = process.env.LLAMA_PARSE_API_KEY;
const LLAMA_PARSE_URL = 'https://api.cloud.llamaindex.ai/api/parsing/upload';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;
    const { policyUrl } = await request.json();

    if (!policyUrl) {
      return NextResponse.json(
        { error: 'Policy URL is required' },
        { status: 400 }
      );
    }

    console.log('[Extract Policy] Starting extraction for RFQ:', rfqId);
    console.log('[Extract Policy] Policy URL:', policyUrl);

    // STEP 1: Get all questions for this RFQ
    const { data: questionsData } = await supabase
      .from('rfqs')
      .select(`
        product_id,
        product:insurance_products(id, name)
      `)
      .eq('id', rfqId)
      .single();

    if (!questionsData) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    const { data: questions } = await supabase
      .from('rfq_questions')
      .select('*')
      .eq('product_id', questionsData.product_id)
      .order('section')
      .order('order_index');

    console.log('[Extract Policy] Loaded questions:', questions.length);

    // STEP 2: Download and parse PDF with Llama Parse
    console.log('[Extract Policy] Downloading PDF from UploadThing...');

    const pdfResponse = await fetch(policyUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();

    console.log('[Extract Policy] Parsing PDF with Llama Parse...');

    // Upload to Llama Parse
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'policy.pdf');

    const parseResponse = await fetch(LLAMA_PARSE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}`,
      },
      body: formData,
    });

    if (!parseResponse.ok) {
      throw new Error('Llama Parse failed: ' + await parseResponse.text());
    }

    const parseResult = await parseResponse.json();
    const jobId = parseResult.id;

    // Poll for completion (Llama Parse is async)
    let policyText = '';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
        {
          headers: { 'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}` },
        }
      );

      if (statusResponse.ok) {
        const result = await statusResponse.json();
        policyText = result.markdown;
        break;
      }

      attempts++;
    }

    if (!policyText) {
      throw new Error('PDF parsing timed out');
    }

    console.log('[Extract Policy] PDF parsed successfully. Text length:', policyText.length);

    // STEP 3: Use Claude to extract field values
    console.log('[Extract Policy] Extracting fields with Claude...');

    const prompt = `You are an expert at extracting insurance policy data. I will give you:
1. The text content of an insurance policy document
2. A list of questions/fields that need to be filled

Your task is to extract the answer for each question from the policy document.

POLICY DOCUMENT:
${policyText}

QUESTIONS TO EXTRACT:
${JSON.stringify(questions.map(q => ({
  id: q.id,
  field_name: q.field_name,
  question_text: q.question_text,
  field_type: q.field_type,
  options: q.options,
})), null, 2)}

INSTRUCTIONS:
- For each question, find the relevant information in the policy document
- Extract the exact value that answers the question
- For dates, use ISO format (YYYY-MM-DD)
- For numbers, extract just the number (no currency symbols)
- For select/multiselect fields, choose from the provided options
- If information is not found in the document, set value to null
- Be thorough - extract as many fields as possible

Return a JSON object with this structure:
{
  "extracted_fields": {
    "question_id_1": "extracted value",
    "question_id_2": "extracted value",
    ...
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response');
    }

    const extractionResult = JSON.parse(jsonMatch[0]);
    const extractedFields = extractionResult.extracted_fields || {};

    console.log('[Extract Policy] Claude extracted fields:', Object.keys(extractedFields).length);

    // STEP 4: Save extracted data to rfq_responses table
    const responsesToInsert = [];

    for (const [questionId, value] of Object.entries(extractedFields)) {
      if (value !== null && value !== undefined && value !== '') {
        responsesToInsert.push({
          rfq_id: rfqId,
          question_id: questionId,
          response_value: String(value),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (responsesToInsert.length > 0) {
      // Batch upsert all responses
      const { error: upsertError } = await supabase
        .from('rfq_responses')
        .upsert(responsesToInsert, {
          onConflict: 'rfq_id,question_id'
        });

      if (upsertError) {
        console.error('[Extract Policy] Error saving responses:', upsertError);
        throw upsertError;
      }

      console.log('[Extract Policy] Saved responses:', responsesToInsert.length);
    }

    // STEP 5: Return results
    return NextResponse.json({
      success: true,
      totalFields: questions.length,
      extractedFields: Object.keys(extractedFields).length,
      extractedData: extractedFields,
      coveragePercent: Math.round((Object.keys(extractedFields).length / questions.length) * 100),
    });

  } catch (error) {
    console.error('[Extract Policy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract policy data' },
      { status: 500 }
    );
  }
}
```

**Environment Variables Needed:**
- `ANTHROPIC_API_KEY` - Already exists
- `LLAMA_PARSE_API_KEY` - Already exists (user confirmed)

---

### 2. **Update `/apps/platform/src/app/api/rfq/create/route.js`**

Currently redirects to `/rfq/[id]/create` (wizard). Change to redirect to upload page first:

**Find this line (~line 46):**
```javascript
return NextResponse.json({ rfq });
```

**Change the frontend redirect in `/apps/platform/src/app/rfq/create/page.js`** (around line where RFQ is created):

Find where the response is handled and change:
```javascript
router.push(`/rfq/${data.rfq.id}/create`);
```

To:
```javascript
router.push(`/rfq/${data.rfq.id}/upload`);
```

---

### 3. **Update Upload Page CSS** (REQUIRED)

The current CSS uses hardcoded colors. Replace with design system variables:

**Current (WRONG):**
```css
color: #111827;
background: #f9fafb;
border-color: #d1d5db;
```

**Should be (CORRECT):**
```css
color: var(--ink);
background: var(--fog);
border-color: var(--ink-10);
```

**Complete CSS Variable Reference:**
```css
/* Colors */
--fog: #F5F4F5        /* Background */
--iris: #6F4FFF       /* Primary blue */
--rose: #FD5478       /* Error/danger */
--sun: #F6C754        /* Warning */
--ink: #070921        /* Text */
--white: #FFFFFF

/* Opacity Variants */
--ink-80, --ink-60, --ink-40, --ink-20, --ink-10

/* Fonts */
--font-cabinet: 'Cabinet Grotesk'  /* Headings */
--font-geist-sans: 'Geist'         /* Body text */

/* Typography */
--text-xs to --text-4xl

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

**Examples from wizard CSS to copy:**
```css
.upload-card {
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(7, 9, 33, 0.06), 0 4px 6px rgba(7, 9, 33, 0.04);
  padding: 32px;
}

.upload-title {
  font-family: var(--font-cabinet);
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.upload-button {
  background: var(--iris);
  color: var(--white);
}

.upload-button:hover {
  background: var(--iris-hover);
}
```

---

### 4. **Add UploadThing Client Component**

Create `/apps/platform/src/utils/uploadthing.js`:

```javascript
import { generateReactHelpers } from "@uploadthing/react";

export const { UploadButton, UploadDropzone } = generateReactHelpers();
```

Then import in upload page:
```javascript
import { UploadButton } from '@/utils/uploadthing';
```

---

### 5. **Update Wizard to Show Pre-filled Fields**

In `/apps/platform/src/app/rfq/[id]/create/page.js`, add visual indicator for pre-filled fields:

**Around line 375-390** (where QuestionRenderer is rendered):

```javascript
<div
  key={question.id}
  className="rfq-wizard__question"
  onFocus={() => setActiveQuestionId(question.id)}
  onClick={() => setActiveQuestionId(question.id)}
>
  {responses[question.id]?.value && (
    <div className="field-auto-filled-badge">
      ✓ Auto-filled from policy
    </div>
  )}
  <QuestionRenderer
    question={question}
    value={responses[question.id]?.value || ''}
    onChange={handleFieldChange}
    error={errors[question.id]}
  />
</div>
```

**Add CSS:**
```css
.field-auto-filled-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--iris-light);
  color: var(--iris);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 🔧 **Testing Checklist**

### Before Testing:
- [ ] Environment variables set: `ANTHROPIC_API_KEY`, `LLAMA_PARSE_API_KEY`, `UPLOADTHING_SECRET`
- [ ] UploadThing configured in Vercel
- [ ] Build passes locally

### Test Flow:
1. [ ] Create new RFQ from dashboard
2. [ ] Verify redirect to `/rfq/[id]/upload` (not wizard)
3. [ ] Click "Skip Upload & Start Form" → Goes to wizard
4. [ ] Go back, upload a test policy PDF
5. [ ] Verify upload progress shows
6. [ ] Verify extraction progress shows (30-60s)
7. [ ] Verify results page shows:
   - Number of fields found
   - Number to fill manually
   - Coverage percentage
8. [ ] Click "Continue to Form"
9. [ ] Verify wizard shows:
   - Pre-filled fields have ✓ badge
   - Can edit pre-filled fields
   - Empty fields highlighted
10. [ ] Complete and submit RFQ

### Edge Cases:
- [ ] Upload fails (show error)
- [ ] Extraction fails (show error, allow retry)
- [ ] PDF has no extractable data (show 0% coverage, allow continue)
- [ ] User uploads wrong file type (UploadThing rejects)

---

## 📊 **Database Schema Reference**

### `rfq_responses` table:
```sql
CREATE TABLE rfq_responses (
  id UUID PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES rfqs(id),
  question_id UUID NOT NULL REFERENCES rfq_questions(id),
  response_value TEXT,           -- Extracted or manual value
  response_file_url TEXT,         -- For file uploads
  updated_at TIMESTAMP,
  UNIQUE(rfq_id, question_id)     -- One response per question per RFQ
);
```

The extraction API does **UPSERT** operations, so it won't create duplicates.

---

## 🚨 **Known Issues & Solutions**

### Issue 1: Llama Parse Rate Limits
**Problem:** Free tier has 1000 pages/day limit
**Solution:** Add error handling and fallback to Claude-only extraction

### Issue 2: Large PDFs Timeout
**Problem:** 100+ page policies take too long
**Solution:** Increase timeout to 5 minutes, show progress indicator

### Issue 3: Claude Token Limits
**Problem:** Very long policy + all questions exceeds 200k tokens
**Solution:**
- Truncate policy text to first 100 pages
- OR do multi-pass extraction (batch questions)

### Issue 4: UploadThing Not Configured
**Problem:** File upload fails
**Solution:** Check `.env` has `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

---

## 📈 **Performance Optimizations**

### Current (Synchronous):
1. Upload PDF (5s)
2. Parse with Llama (20s)
3. Extract with Claude (30s)
4. Save to DB (2s)
**Total: ~60 seconds**

### Future (Async - Phase 7):
1. Upload PDF → Return immediately
2. Background job: Parse + Extract
3. WebSocket/polling updates user
4. Email when complete
**User wait time: 5 seconds**

---

## 🎨 **Design System Summary**

**DO:**
- ✅ Use CSS variables (`var(--iris)`, `var(--fog)`)
- ✅ Use Cabinet Grotesk for headings
- ✅ Use Geist Sans for body text
- ✅ Follow existing component patterns (wizard, review pages)
- ✅ Use 12px border radius for cards
- ✅ Use consistent spacing (32px padding)

**DON'T:**
- ❌ Use hardcoded hex colors
- ❌ Use Tailwind classes
- ❌ Use different font families
- ❌ Use different border radius values
- ❌ Create inconsistent button styles

**Reference files for styling:**
- `/apps/platform/src/styles/globals.css` - Design tokens
- `/apps/platform/src/app/rfq/[id]/create/page.css` - Wizard styling
- `/apps/platform/src/app/rfq/[id]/review/page.css` - Review styling

---

## 🚀 **Deployment Checklist**

Before pushing:
1. [ ] Update upload page CSS to use design system
2. [ ] Create extract-policy API route
3. [ ] Update RFQ create redirect
4. [ ] Add UploadThing utils
5. [ ] Test build locally
6. [ ] Test upload with real PDF
7. [ ] Check console for errors

**Git Commands:**
```bash
git add apps/platform/src/app/api/uploadthing/
git add apps/platform/src/app/rfq/[id]/upload/
git add apps/platform/src/app/api/rfq/[id]/extract-policy/
git add apps/platform/src/utils/uploadthing.js
git add apps/platform/src/app/rfq/create/page.js  # If updated redirect

git commit -m "Feature: Phase 5 - Policy Upload & Auto-Extraction

- Add UploadThing integration for PDF upload
- Add upload page with skip option
- Add Llama Parse + Claude extraction API
- Auto-fill RFQ form from policy data
- Show extraction results and coverage
- Add visual badges for auto-filled fields
- Update design to match system colors

Saves users 80% of form-filling time!"

git push origin main
```

---

## 📝 **Next Steps After Phase 5**

1. **Phase 4:** Draft management & resume
2. **Phase 3:** Advanced field types (currency, file upload)
3. **Phase 7:** Distribution flow (invite insurers)
4. **Phase 8:** Bidding system
5. **Phase 9:** Admin panel

---

## 💡 **Tips for Next Agent**

1. **Start with extraction API** - This is the core functionality
2. **Test with a real PDF** - Use a sample insurance policy
3. **Check token limits** - Long policies + all questions = many tokens
4. **Update CSS carefully** - Match existing design system exactly
5. **Add error handling** - Network issues, parsing failures, etc.
6. **Log extensively** - Help debug extraction issues
7. **Consider batching** - If hitting token limits, batch questions

**Sample test PDFs available at:**
- `/Resources/sample-policies/` (if exists)
- Or use any insurance policy PDF from user

---

**Last Updated:** January 2025
**Status:** Ready for implementation
**Estimated Completion:** 4-6 hours

**Good luck! This is the feature that will make Sanctuari stand out.** 🚀
