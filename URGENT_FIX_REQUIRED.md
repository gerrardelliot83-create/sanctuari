# 🚨 URGENT: Missing Environment Variable in Vercel

**Date:** October 3, 2025
**Issue:** Bid submission failing with `supabaseKey is required` error
**Status:** ⚠️ CRITICAL - Production deployment blocked

---

## 🔴 The Problem

The bid submission is failing in production with this error:

```
Error: supabaseKey is required.
at new tD (/var/task/apps/platform/.next/server/chunks/1337.js:34:36471)
```

**Root Cause:** The `SUPABASE_SERVICE_ROLE_KEY` environment variable is **NOT SET** in Vercel production environment.

---

## ✅ The Fix

You need to add the missing environment variable in Vercel:

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Scroll to **Project API keys**
4. Copy the **`service_role` key** (⚠️ Keep this secret!)

### Step 2: Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Set the following:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** [Paste your service_role key from Supabase]
   - **Environments:** Check **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 3: Redeploy

After adding the environment variable, you **MUST redeploy**:

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Select **Use existing Build Cache** → Click **Redeploy**

---

## 📋 Complete Environment Variables Checklist

Make sure ALL of these are set in Vercel:

### Required for Bid Submission:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **MISSING - ADD THIS!**

### Required for Document Parsing:
- ✅ `LLAMA_PARSE_API_KEY` - Llama Parse API key
- ✅ `ANTHROPIC_API_KEY` - Claude AI API key

### Required for File Uploads:
- ✅ `UPLOADTHING_TOKEN` - UploadThing token

### Required for Email:
- ✅ `BREVO_API_KEY` - Brevo email API key
- ✅ `BREVO_SENDER_EMAIL` - Sender email (noreply@sanctuari.io)
- ✅ `BREVO_SENDER_NAME` - Sender name (Sanctuari)

### Required for Platform URL:
- ✅ `NEXT_PUBLIC_PLATFORM_URL` - Set to `https://platform.sanctuari.io`

---

## 🧪 How to Verify It's Fixed

After redeploying with the environment variable:

1. Go to the bid submission portal via an invitation link
2. Fill in the form and upload documents
3. Click "Submit Quote"
4. Check Vercel logs for:
   - ✅ Should see: `[Bid Submission] Bid created successfully: [bid-id]`
   - ❌ Should NOT see: `Error: supabaseKey is required`

---

## 🐛 Additional Fixes Applied

I've also fixed the following issues in the code:

### 1. Document Upload State Preservation
**Problem:** Policy wording documents were getting deleted after upload in some cases.

**Fix:** Updated `handlePolicyUploadComplete` and `handleQuoteUploadComplete` to preserve all existing quote data using spread operator:

```javascript
onUpdate({
  ...quote,  // Preserve all existing data
  policyDocumentUrl: fileUrl,
  policyDocumentFileName: fileName,
  policyDocumentSize: fileSize,
  policyDocumentUploading: false,
});
```

### 2. Parsing Data Preservation
**Problem:** After parsing, some field data was being lost.

**Fix:** Updated parsing `onUpdate` to preserve all quote data:

```javascript
onUpdate({
  ...quote,  // Preserve all existing data including uploaded files
  // ... extracted data
  parsed: true,
});
```

---

## 📊 Why Service Role Key Is Needed

The bid submission endpoint (`/api/bid/submit`) is a **public endpoint** that doesn't require user authentication (accessed via token link).

However, it needs to:
- Create bid records in the database
- Update invitation status
- Create document records

Since the database has Row Level Security (RLS) enabled, we need the **service role key** to bypass RLS for these public operations. The regular anon key won't work because there's no authenticated user.

**Security Note:** The service role key is only used server-side in API routes and is never exposed to the client.

---

## ⚠️ Important Security Notes

1. **Never commit** the service role key to git
2. **Never expose** it on the client side
3. Only use it in **server-side API routes**
4. The key bypasses all RLS policies - use carefully
5. Keep it in Vercel environment variables only

---

## 🚀 After Fix Checklist

Once you've added the environment variable and redeployed:

- [ ] Bid submission works without errors
- [ ] Bids are created in Supabase `bids` table
- [ ] Documents are linked to bids in `bid_documents` table
- [ ] Invitation status updates to 'submitted'
- [ ] Success screen shows correctly
- [ ] No "supabaseKey is required" errors in Vercel logs

---

## 📞 If Still Not Working

If you still see errors after adding the environment variable:

1. **Double-check the variable name:** Must be exactly `SUPABASE_SERVICE_ROLE_KEY`
2. **Verify the key value:** Should start with `eyJ...` and be very long (~300+ chars)
3. **Confirm environments:** Should be enabled for Production
4. **Check deployment:** Make sure you redeployed AFTER adding the variable
5. **Look at Vercel logs:** Check for new error messages

---

## 🎯 Current Status

- ✅ Code fixes applied and tested locally
- ✅ Build passing successfully
- ✅ Document upload preservation fixed
- ⚠️ **BLOCKED:** Waiting for `SUPABASE_SERVICE_ROLE_KEY` to be added to Vercel
- ⏳ Ready to test once environment variable is set

---

**NEXT ACTION REQUIRED:** Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables and redeploy.
