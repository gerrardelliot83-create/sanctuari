# Company Onboarding Fix Guide

**Date:** October 1, 2025
**Issue:** 500 Error when creating company during onboarding
**Status:** FIXED - Ready to deploy

---

## 🔴 Problem Summary

After successful signup and email verification, users reach the company onboarding page but encounter a **500 Internal Server Error** when trying to create their first company.

### Root Causes Identified:

1. **Missing `created_by` field**: The company INSERT was missing the required `created_by` field (NOT NULL constraint)

2. **Incomplete company_members INSERT**: Missing required fields like `joined_at` and `status`

3. **RLS Policy Chicken-and-Egg Problem**:
   - The existing RLS policy required users to be owners/admins to add members
   - But during onboarding, the company_members table is empty
   - So users couldn't add themselves as the first owner!

---

## ✅ Fixes Applied

### Fix 1: Updated Company Onboarding Page

**File:** `apps/platform/src/app/onboarding/company/page.js`

**Changes:**
1. Added `created_by: userId` to company INSERT
2. Added complete fields to company_members INSERT:
   - `invited_by: userId`
   - `joined_at: new Date().toISOString()`
   - `status: 'active'`

### Fix 2: New Migration 005

**File:** `packages/database/migrations/005_fix_company_members_rls.sql`

**Changes:**
1. **Dropped overly restrictive policy** that blocked all operations
2. **Added special INSERT policy** for company creators to add themselves as owner
3. **Added separate INSERT policy** for existing owners to add other members
4. **Added granular policies** for SELECT, UPDATE, DELETE operations
5. **Added safeguard** preventing last owner from removing themselves

---

## 🚀 Deployment Steps

### Step 1: Run Migration 005

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy the contents of `packages/database/migrations/005_fix_company_members_rls.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Verify no errors appear

### Step 2: Deploy Code Changes

The changes to `apps/platform/src/app/onboarding/company/page.js` need to be deployed:

```bash
# From project root
git add .
git commit -m "fix: resolve company onboarding 500 error

- Add created_by field to company INSERT
- Add complete fields to company_members INSERT
- See migration 005 for RLS policy fixes"
git push origin main
```

**Vercel will auto-deploy** within 1-2 minutes.

---

## 🧪 Testing

### Test the Complete Flow

1. **Clear browser cache** for platform.sanctuari.io

2. **Sign up with a NEW email**:
   - Go to https://platform.sanctuari.io/signup
   - Enter email + password
   - Submit form

3. **Verify email**:
   - Check email inbox
   - Click confirmation link
   - Should redirect to `/callback` → `/onboarding/company`

4. **Create company**:
   - Enter company name (required)
   - Enter industry (optional)
   - Click "Continue"

5. **Expected outcome**:
   - ✅ No 500 error
   - ✅ No console errors
   - ✅ Redirected to `/dashboard`
   - ✅ Company created in database
   - ✅ User added as owner in company_members
   - ✅ onboarding_completed = true

---

## 🔍 Verification Queries

After running migration 005, verify the policies:

### Check Company Members Policies

```sql
SELECT
  policyname,
  cmd,
  roles,
  with_check IS NOT NULL AS has_check,
  qual IS NOT NULL AS has_using
FROM pg_policies
WHERE tablename = 'company_members'
ORDER BY cmd, policyname;
```

**Expected output:**

| policyname | cmd | roles | has_check | has_using |
|------------|-----|-------|-----------|-----------|
| Company owners can add members | INSERT | {authenticated} | true | false |
| Users can add self as owner of own company | INSERT | {authenticated} | true | false |
| Company owners can delete members | DELETE | {authenticated} | false | true |
| Users can view company members | SELECT | {authenticated} | false | true |
| Company owners can update members | UPDATE | {authenticated} | false | true |

### Test Company Creation Manually

```sql
-- Check if a test user can create a company
-- Replace YOUR_USER_ID with actual user ID from auth.users

-- 1. Verify user exists
SELECT id, email FROM auth.users WHERE id = 'YOUR_USER_ID';

-- 2. Try to view what companies they can see (should be empty for new users)
SET request.jwt.claim.sub = 'YOUR_USER_ID';
SELECT * FROM companies;

-- 3. Check if they can add themselves as owner
SELECT * FROM company_members WHERE user_id = 'YOUR_USER_ID';
```

---

## 🐛 Debugging

### If 500 Error Still Occurs

1. **Check Supabase Postgres Logs**:
   - Dashboard → Logs → Postgres Logs
   - Filter by "ERROR"
   - Look for INSERT failures or RLS violations

2. **Check if migration 005 ran successfully**:
   ```sql
   SELECT policyname FROM pg_policies
   WHERE tablename = 'company_members'
     AND policyname = 'Users can add self as owner of own company';
   ```
   - Should return 1 row
   - If empty, migration didn't run

3. **Check for schema conflicts**:
   ```sql
   -- Verify created_by column exists and is NOT NULL
   SELECT column_name, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'companies'
     AND column_name = 'created_by';
   ```

4. **Check Vercel deployment logs**:
   - Vercel Dashboard → Deployments → Latest
   - Check for build errors
   - Ensure environment variables are set

### If Code Isn't Deploying

1. **Check git status**:
   ```bash
   git status
   ```

2. **Verify commit was pushed**:
   ```bash
   git log --oneline -5
   ```

3. **Check Vercel is connected**:
   - Vercel Dashboard → Project Settings → Git
   - Ensure GitHub repo is connected
   - Check deployment branch is `main`

---

## 📊 Database State After Onboarding

After a successful onboarding, you should see:

### auth.users
```sql
SELECT id, email, email_confirmed_at FROM auth.users;
```
- User exists
- `email_confirmed_at` is NOT NULL

### public.users
```sql
SELECT id, email, onboarding_completed FROM public.users;
```
- User profile exists
- `onboarding_completed` = `true`

### public.companies
```sql
SELECT id, name, created_by FROM public.companies;
```
- Company exists
- `created_by` matches user ID

### public.company_members
```sql
SELECT company_id, user_id, role, status FROM public.company_members;
```
- Membership exists
- `role` = `'owner'`
- `status` = `'active'`

---

## 🎯 Success Criteria

✅ User signs up successfully
✅ Email verification works
✅ User redirected to company onboarding
✅ Company creation succeeds (no 500 error)
✅ User added as owner in company_members
✅ onboarding_completed set to true
✅ User redirected to dashboard
✅ No errors in browser console
✅ No errors in Supabase logs

---

## 🔄 What Happens Next

Once onboarding is complete, the user should:

1. **Land on `/dashboard`** - Basic dashboard page
2. **See navigation** - Access to create RFQs, view bids, etc.
3. **Be able to sign out** - And sign back in
4. **Not see onboarding again** - Middleware redirects to dashboard

---

## 📝 Notes

- **Why the 403 error during signup?** That's expected - it's just your code trying to verify the profile was created, but RLS blocks it. The trigger handles profile creation, so that verification is unnecessary. We can remove it in a future cleanup.

- **Why did login work but onboarding didn't?** Because login just authenticates, but onboarding tries to INSERT data, which was blocked by RLS.

- **Why was the RLS policy wrong?** The original policy from migration 001 used `FOR ALL`, which is too restrictive. We needed separate INSERT policies for different scenarios.

- **Can users belong to multiple companies?** Yes! After onboarding, users can create more companies or be invited to join existing ones. The RLS policies support this.

---

## 🚦 Next Steps After This Works

Once onboarding is functional:

1. **Test the full auth flow**:
   - Signup → Verify → Onboard → Dashboard
   - Logout → Login → Dashboard
   - Password reset flow

2. **Build the dashboard**:
   - Currently just a placeholder
   - Needs company selector (if user has multiple)
   - Show recent RFQs, bids, etc.

3. **Start RFQ creation module**:
   - This is the core feature
   - Multi-step form with 1,558 questions
   - See HANDOFF_TO_NEXT_AGENT.md for details

---

**Good luck! This should resolve the 500 error.** 🚀
