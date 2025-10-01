# Database Migrations Log

This folder contains all SQL migrations for the Sanctuari platform.

## Migration Status

| Migration | Status | Date Run | Description |
|-----------|--------|----------|-------------|
| `001_initial_schema.sql` | ✅ Completed | Oct 1, 2025 | Initial database schema with all core tables and RLS policies |
| `002_add_metadata_to_questions.sql` | ✅ Completed | Oct 1, 2025 | Added metadata JSONB column to rfq_questions table |
| `003_user_profile_trigger.sql` | ✅ Completed | Oct 1, 2025 | Auto-create user profile on signup (fixes 401 error) |

---

## How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire migration file
5. Click **Run** or press `Ctrl+Enter`
6. Verify success (check for green checkmark)
7. Update this README with ✅ status and date

### Method 2: Supabase CLI
```bash
supabase db push
```

---

## Current Issue Requiring Migration 003

**Problem:** Users get 401 error when signing up
**Error Message:** "Failed to create user profile"
**Root Cause:** No RLS INSERT policy allows users to create their own profile during signup

**Solution:** Migration 003 creates a database trigger that automatically creates the user profile when someone signs up. This is the standard Supabase pattern.

---

## Migration 003 Details

**File:** `003_user_profile_trigger.sql`

**What it does:**
1. Creates a `handle_new_user()` function that inserts into `public.users`
2. Creates a trigger `on_auth_user_created` that fires after signup
3. Adds an INSERT RLS policy as a fallback
4. Uses `SECURITY DEFINER` to bypass RLS restrictions

**Why it's needed:**
- During signup, the user is authenticated but can't insert their own profile due to RLS
- The trigger runs with elevated privileges and can create the profile
- This is the recommended approach in Supabase documentation

**How to verify it worked:**
```sql
-- Check function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policy
SELECT policyname FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Users can insert own profile during signup';
```

---

## After Running Migration 003

1. Mark it as ✅ Completed in the table above
2. Add today's date
3. Test signup at https://platform.sanctuari.io/signup
4. User profile should be created automatically without 401 error
5. Push updated code (already done - trigger handles it now)

---

## Future Migrations

Add new migrations with incremental numbers:
- `004_description.sql`
- `005_description.sql`
- etc.

Always update this README when adding or running migrations.

---

## Rollback Instructions

If you need to rollback migration 003:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the RLS policy
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON public.users;
```

**Note:** Only rollback if absolutely necessary. The trigger is essential for user signups to work properly.
