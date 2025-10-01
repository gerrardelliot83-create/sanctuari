# Signup Error Fix Guide

**Date:** October 1, 2025
**Issues:** RLS Policy Error + OTP Expired Error
**Priority:** CRITICAL - Blocking all user signups

---

## 🔴 Problem Summary

You're experiencing two issues during signup:

### Issue 1: RLS Policy Violation
**Error:** `new row violates row-level security policy for table "users"`
**Code:** `42501`

**Root Cause:**
Migration 003 created both:
1. A trigger with `SECURITY DEFINER` to auto-create user profiles
2. An INSERT policy requiring `auth.uid()` (authenticated user)

**The Conflict:**
During signup, the trigger fires BEFORE the user is authenticated. The INSERT policy expects `auth.uid()` to exist, but it doesn't yet, causing RLS to reject the insertion.

### Issue 2: OTP Link Expiring Immediately
**Error:** `otp_expired` when clicking verification email link

**Root Cause:**
Likely one of these:
1. Supabase email confirmation token TTL is too short
2. Email template configuration issue
3. Redirect URL mismatch causing token invalidation

---

## ✅ Solution

### Step 1: Run Migration 004 in Supabase

I've created `packages/database/migrations/004_fix_user_rls_policies.sql` which:

1. **Removes the conflicting INSERT policy** from migration 003
2. **Adds service_role INSERT policy** so the trigger can bypass RLS
3. **Adds anon INSERT policy** for edge cases
4. **Makes the trigger idempotent** with `ON CONFLICT DO NOTHING`
5. **Grants necessary permissions** to service_role

**How to run:**

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `packages/database/migrations/004_fix_user_rls_policies.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors appear

---

### Step 2: Fix OTP Expiry Issue

Go to **Supabase Dashboard → Authentication → Email Templates**

#### A. Check Confirmation Email Settings

1. Navigate to **Authentication → Settings → Email**
2. Find **"Confirm email"** section
3. Check these settings:
   - **Enable email confirmations:** Should be `ON`
   - **Secure email change enabled:** Recommended `ON`
   - **Double confirm email changes:** Your choice

#### B. Verify Redirect URLs

1. Go to **Authentication → URL Configuration**
2. Ensure these URLs are in **Redirect URLs** list:
   ```
   https://platform.sanctuari.io/callback
   http://localhost:3000/callback
   ```
3. If missing, add them and click "Save"

#### C. Check Email Template

1. Go to **Authentication → Email Templates**
2. Select **"Confirm signup"** template
3. Verify the template contains:
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```
4. **DO NOT USE** old token variables like `{{ .Token }}` - this causes expiry

#### D. Check Token Expiry Settings

1. Go to **Authentication → Settings**
2. Find **JWT expiry** settings
3. Check **"Email confirmation token expiry"**
4. Should be at least **3600 seconds (1 hour)**
5. If it's too short (like 300 or 60 seconds), increase it to 3600

---

### Step 3: Clear Any Stuck Users (Optional)

If you have test users stuck in a bad state:

```sql
-- Run in Supabase SQL Editor
-- This deletes test users who haven't verified their email

-- First, check which users are unconfirmed
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL;

-- If you want to delete them (BE CAREFUL):
-- DELETE FROM auth.users WHERE email_confirmed_at IS NULL;
```

---

### Step 4: Test Signup Flow

1. **Clear browser cache and cookies** for platform.sanctuari.io
2. Go to https://platform.sanctuari.io/signup
3. Enter a **NEW test email** (not one used before)
4. Enter a password (8+ characters)
5. Click "Create account"

**Expected Flow:**
1. ✅ Form submits without errors
2. ✅ Redirected to `/verify-email` page
3. ✅ Email arrives within 1-2 minutes
4. ✅ Click confirmation link in email
5. ✅ Redirected to `/callback` → `/onboarding/company`
6. ✅ No "otp_expired" error

---

## 🔍 Verification Queries

After running migration 004, verify it worked:

### Check RLS Policies

```sql
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Expected policies:**
- `Service role can insert users` - FOR INSERT TO service_role
- `Allow anon insert during signup` - FOR INSERT TO anon
- `Users can view own data` - FOR SELECT TO authenticated
- `Users can update own data` - FOR UPDATE TO authenticated

### Check Trigger

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:**
- trigger_name: `on_auth_user_created`
- event_manipulation: `INSERT`
- action_statement: Should reference `handle_new_user()`

### Check Function

```sql
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

**Expected:**
- routine_name: `handle_new_user`
- security_type: `DEFINER`

---

## 🧪 Testing Checklist

After implementing fixes:

- [ ] Run migration 004 successfully
- [ ] Verify policies with SQL queries above
- [ ] Check Supabase email template uses `{{ .ConfirmationURL }}`
- [ ] Verify redirect URLs include your callback endpoint
- [ ] Check token expiry is at least 3600 seconds
- [ ] Clear browser cache
- [ ] Test signup with new email address
- [ ] Verify no RLS error in browser console
- [ ] Receive verification email within 2 minutes
- [ ] Click email link - should not show "otp_expired"
- [ ] Successfully land on `/onboarding/company` page

---

## 🐛 Debugging

### If RLS Error Still Occurs

1. **Check if migration 004 ran:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

2. **Check trigger is active:**
   ```sql
   SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
   - `O` = Enabled
   - `D` = Disabled

3. **Check service_role permissions:**
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name = 'users';
   ```

4. **Look at Supabase logs:**
   - Dashboard → Logs → Postgres Logs
   - Filter by "ERROR" or "SQLSTATE"
   - Check for any trigger errors

### If OTP Expired Still Occurs

1. **Check email template:**
   - Go to Auth → Email Templates → Confirm signup
   - Click "Revert to default" if custom
   - Save and test again

2. **Check for multiple confirmation attempts:**
   - Supabase only allows ONE confirmation per signup
   - If you clicked the link once, it's consumed
   - Try signing up again with a NEW email

3. **Check URL in email:**
   - Forward the confirmation email to yourself
   - Right-click the confirmation link → "Copy link address"
   - Check if URL contains:
     - Correct domain: `platform.sanctuari.io`
     - `token=` parameter
     - `type=signup` parameter
   - Paste URL in browser address bar manually

4. **Check Supabase Auth logs:**
   - Dashboard → Logs → Auth Logs
   - Look for "signup" events
   - Check if confirmation attempt shows errors

---

## 📞 If Still Broken

If after all this signup still fails:

1. **Export full error logs:**
   ```
   - Browser console error (full stack trace)
   - Supabase Postgres logs (any ERRORS)
   - Supabase Auth logs (signup/confirmation events)
   - Network tab (XHR requests and responses)
   ```

2. **Check Supabase service status:**
   - Go to https://status.supabase.com/
   - Verify no outages

3. **Try local development:**
   ```bash
   yarn dev
   ```
   - Test signup at http://localhost:3000/signup
   - Check if same error occurs locally

4. **Verify environment variables in Vercel:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Redeploy after any changes

---

## 🎯 Expected Outcome

After implementing all fixes:

1. ✅ User signs up at `/signup`
2. ✅ Profile automatically created in `public.users` table
3. ✅ Verification email sent by Supabase
4. ✅ Email contains valid confirmation link
5. ✅ User clicks link within 1 hour
6. ✅ Callback handler processes verification
7. ✅ User redirected to `/onboarding/company`
8. ✅ User creates company
9. ✅ User lands on `/dashboard`

---

## 📝 Notes

- **First time using Supabase Auth?** The email confirmation flow requires proper template configuration
- **Testing with temp-mail services?** Some services block confirmation emails
- **Using Gmail?** Check spam folder
- **Token consumed:** Each confirmation link can only be used ONCE. Sign up with a new email for each test.
- **Local vs Production:** Ensure both environments have correct redirect URLs configured

---

**Need help?** Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email
