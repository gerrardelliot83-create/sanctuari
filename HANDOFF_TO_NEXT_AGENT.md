# Handoff Document for Next Development Agent

**Date:** October 1, 2025
**Session:** Authentication System Implementation
**Status:** Partially Complete - Signup Issues Remain
**Priority:** Fix signup errors before proceeding

---

## 🚨 CURRENT ISSUE - REQUIRES IMMEDIATE ATTENTION

### **Problem: Signup Not Working**

**Status:** Users can access the signup page but cannot complete signup successfully.

**Last Known Error:**
- 401 Unauthorized error when creating user profile
- Error message: "Failed to create user profile"
- Console error: `Failed to load resource: the server responded with a status of 401`

**What We Tried:**
1. ✅ Created database trigger (`003_user_profile_trigger.sql`) to auto-create user profiles
2. ✅ Updated `auth.js` to remove manual profile insertion
3. ✅ Added RLS INSERT policy for users table
4. ⚠️ **BUT signup still may have issues - needs testing**

**What Needs to Be Done:**
1. Verify migration 003 ran successfully in Supabase
2. Test signup flow at https://platform.sanctuari.io/signup
3. Check Supabase logs for any trigger errors
4. If still failing, check:
   - Supabase email verification settings
   - Auth redirect URLs configuration
   - RLS policies on `users` table
   - Trigger execution logs

**Files Involved:**
- `packages/database/migrations/003_user_profile_trigger.sql`
- `packages/database/lib/auth.js` (signUp function)
- `apps/platform/src/app/signup/page.js`

---

## 📁 PROJECT STRUCTURE

### **Deployed URLs**
- **Platform:** https://platform.sanctuari.io
- **Admin:** https://admin.sanctuari.io
- **Marketing:** https://www.sanctuari.io (Webflow - not our concern)

### **Repository Structure**
```
sanctuari/
├── apps/
│   ├── platform/          # Main user app (platform.sanctuari.io)
│   └── admin/             # Admin panel (admin.sanctuari.io)
├── packages/
│   ├── ui/                # Shared UI components
│   ├── database/          # Supabase utilities and migrations
│   └── utils/             # Shared utilities
├── Resources/             # Reference documents and data
└── scripts/               # Data processing scripts
```

---

## ✅ WHAT'S BEEN COMPLETED

### **Infrastructure (100%)**
- ✅ Turborepo monorepo setup
- ✅ Both apps deployed to Vercel
- ✅ Custom domains configured (platform.sanctuari.io, admin.sanctuari.io)
- ✅ All third-party services configured
- ✅ Environment variables set up in Vercel

### **Database (100%)**
- ✅ Complete schema with 17 tables
- ✅ RLS policies active
- ✅ Multi-company architecture implemented
- ✅ 1,558 RFQ questions loaded into database
- ✅ 60 insurance products loaded
- ✅ Three migrations run:
  - 001_initial_schema.sql
  - 002_add_metadata_to_questions.sql
  - 003_user_profile_trigger.sql

### **UI Component Library (100%)**
**9 components built following exact design system specs:**
1. ✅ Button (primary, secondary, danger, ghost variants)
2. ✅ Input (with error states and validation)
3. ✅ Label (with required indicator)
4. ✅ ErrorMessage (Rose color)
5. ✅ FormField (wrapper component)
6. ✅ PasswordInput (with show/hide toggle)
7. ✅ LoadingSpinner (animated)
8. ✅ Card (with header, content, actions)
9. ✅ Container (page wrapper)

**Design System:**
- Colors: Fog, Iris (#6F4FFF), Rose, Sun, Ink
- Typography: Geist Sans, Geist Mono
- 100% Vanilla CSS (NO Tailwind as specified)
- Mobile-first responsive
- 8-12px border radius
- All following component-library-and-user-stories.docx

### **Authentication Pages (100% Built, But Not Working)**
**Routes (at root level, not /auth/*):**
1. ✅ `/signup` - User registration
2. ✅ `/login` - User authentication
3. ✅ `/forgot-password` - Password reset request
4. ✅ `/reset-password` - Set new password
5. ✅ `/verify-email` - Email verification page
6. ✅ `/callback` - OAuth/email callback handler
7. ✅ `/onboarding/company` - Company creation
8. ✅ `/dashboard` - Basic dashboard (protected)

**Auth System Components:**
- ✅ AuthLayout (split-screen: 60% form, 40% branding)
- ✅ Auth helper functions (`packages/database/lib/auth.js`)
- ✅ Protected routes middleware (`apps/platform/src/middleware.js`)
- ✅ Supabase client utilities (browser, server, middleware)

---

## 🔧 AUTHENTICATION FLOW (EXPECTED)

```
1. User lands at platform.sanctuari.io/signup
   ↓
2. Enters email + password
   ↓
3. Supabase creates auth.users record
   ↓
4. Database trigger creates public.users profile
   ↓
5. Verification email sent by Supabase
   ↓
6. User redirected to /verify-email
   ↓
7. User clicks link in email
   ↓
8. Callback handler at /callback processes verification
   ↓
9. User redirected to /onboarding/company
   ↓
10. User creates first company
    ↓
11. onboarding_completed = true
    ↓
12. Redirected to /dashboard
```

**Current Status:** Flow breaks at step 4 (profile creation)

---

## 📚 REFERENCE DOCUMENTS

**Location:** `C:\Users\DELL\Desktop\sanctuari\Resources\`

### **Critical Reference Files:**

1. **`component-library-and-user-stories.docx`**
   - Complete UI component specifications
   - Design system (colors, typography, spacing)
   - All user stories for each module
   - MUST follow these specs exactly

2. **`technical-specifications.docx`**
   - Complete architecture
   - Tech stack (NO Tailwind, Vanilla CSS only)
   - Module breakdown
   - API integration strategies
   - AI multi-agent system design

3. **`initial-prompt.docx`**
   - Project overview
   - Development approach
   - Phase breakdown
   - Security requirements

### **Key Design System Rules (From component-library-and-user-stories.docx):**
- **Colors:** Fog (#F5F4F5), Iris (#6F4FFF), Rose (#FD5478), Sun (#F6C754), Ink (#070921)
- **Typography:** Geist Sans (UI), Geist Mono (numbers/code)
- **NO Tailwind CSS** - 100% Vanilla CSS
- **NO Emojis** in production UI (only in commits/docs)
- **8px border radius** on buttons
- **12px border radius** on cards
- **Mobile-first** responsive design
- **Iris hover state:** #5A3FE5

---

## 🗄️ DATABASE SCHEMA OVERVIEW

### **Core Tables:**
- `users` - User profiles (extends auth.users)
- `companies` - Organization/company profiles
- `company_members` - Many-to-many users ↔ companies
- `company_invitations` - Invite system
- `network_members` - Insurers/brokers in Sanctuari network
- `insurance_products` - 60 insurance product types
- `rfq_questions` - 1,558 questions with AI enhancements
- `rfqs` - User-created RFQs
- `bids` - Quotes from insurers/brokers
- `payments` - Razorpay transactions
- `subscriptions` - User subscriptions (first RFQ free, ₹1,599 after)

### **Multi-Company Architecture:**
- Users can belong to multiple companies
- Roles per company: owner, admin, member, viewer
- All RFQs scoped to company_id
- First company created during onboarding

### **RFQ Question Enhancements (Already in DB):**
- Indian currency formatting (138 fields)
- Auto-fill from company profile (259 fields)
- Policy document extraction markers (176 fields)
- "Other" option handlers (18 fields)

---

## 🔐 ENVIRONMENT VARIABLES

### **Required in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_PLATFORM_URL=https://platform.sanctuari.io

UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

LLAMA_PARSE_API_KEY=

ANTHROPIC_API_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

BREVO_API_KEY=
```

### **Supabase Configuration Required:**
1. **Authentication → URL Configuration**
   - Add redirect URL: `https://platform.sanctuari.io/callback`
   - Add redirect URL: `http://localhost:3000/callback`

2. **Authentication → Email Templates**
   - Verify "Confirm signup" template is enabled
   - Verify "Reset password" template is enabled

---

## 🚨 KNOWN ISSUES

### **1. Signup Not Working (CRITICAL)**
- **Priority:** P0 - Blocks all user flows
- **Error:** 401 when creating user profile
- **Status:** Migration 003 created but may need verification
- **Next Steps:** See "Current Issue" section above

### **2. Email Verification (UNTESTED)**
- **Status:** Unknown - can't test until signup works
- **Potential Issues:**
  - Supabase email templates may need configuration
  - Redirect URLs may need adjustment

### **3. Onboarding Flow (UNTESTED)**
- **Status:** Code written but not tested
- **Depends On:** Signup working first

---

## 📋 WHAT TO BUILD NEXT (After Fixing Signup)

### **Priority 1: Complete & Test Authentication**
1. Fix signup (current blocker)
2. Test login flow
3. Test password reset
4. Test email verification
5. Test onboarding (company creation)
6. Test dashboard access

### **Priority 2: RFQ Creation Module (Weeks 1-2)**
The core feature of the platform.

**Components Needed:**
1. Multi-step form wizard
   - Progress indicator
   - Step navigation
   - Auto-save every 30 seconds

2. Dynamic question renderer
   - Load from `rfq_questions` table (1,558 questions ready)
   - Field type handling (text, number, select, file, date)
   - Indian currency formatting (₹XX,XX,XXX pattern)
   - Conditional field logic
   - "Other" option text inputs

3. Split-screen layout (like auth pages)
   - Left: Form (60%)
   - Right: Dynamic guidance panel (40%)
   - Guidance updates based on active field

4. Auto-fill system
   - 259 fields can auto-fill from company profile
   - Load company data and pre-populate

5. Policy document upload
   - UploadThing integration (NOT Supabase Storage)
   - Llama Parse extraction
   - Preview extracted data
   - 176 fields marked as extractable

6. RFQ submission
   - PDF generation
   - Summary preview
   - Save to database

**Reference:** User Stories US-001 through US-004 in component-library-and-user-stories.docx

### **Priority 3: Bid Distribution (Week 2)**
1. Email import/validation
2. Sanctuari network browser (insurers/brokers)
3. Partner selection interface
4. Unique link generation per bidder
5. Brevo email integration (bulk send)

**Reference:** User Stories US-002.1 through US-002.3

### **Priority 4: Bid Centre (Week 3)**
1. Dashboard with quote cards
2. Side-by-side comparison table
3. AI analysis (Claude multi-agent system)
4. Communication hub

**Reference:** User Stories US-005.1 through US-005.5

---

## 🛠️ DEVELOPMENT TOOLS & COMMANDS

### **Install Dependencies:**
```bash
yarn install
```

### **Run Locally:**
```bash
yarn dev
```

Platform will be at: http://localhost:3000

### **Build:**
```bash
yarn build
```

### **Database Migrations:**
All migrations in: `packages/database/migrations/`

To run: Copy SQL to Supabase Dashboard → SQL Editor → Run

### **Git Workflow:**
```bash
git add .
git commit -m "feat: description"
git push origin main
```

Vercel auto-deploys on push to main.

---

## 🔍 DEBUGGING TIPS

### **If Signup Fails:**
1. Check Supabase logs:
   - Dashboard → Logs → Auth Logs
   - Look for signup attempts and errors

2. Check if trigger fired:
```sql
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;
```
If user in auth.users but not in public.users, trigger didn't fire.

3. Check trigger exists:
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

4. Manually test trigger:
```sql
-- Check function
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

### **If Pages Don't Load:**
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables in Vercel
4. Check middleware.js - might be redirecting incorrectly

### **If Styles Look Wrong:**
1. Verify global CSS is imported in layout.js
2. Check component CSS files are imported
3. Verify CSS variable values match design system
4. Check browser inspector for CSS conflicts

---

## 📝 CODE STYLE & CONVENTIONS

### **File Naming:**
- Components: PascalCase (`Button.js`, `AuthLayout.js`)
- Utilities: camelCase (`auth.js`, `format-currency.js`)
- CSS: Same as component (`Button.css`)
- Pages: lowercase (`page.js`, `layout.js`)

### **Component Structure:**
```javascript
/**
 * Component: ComponentName
 * Purpose: Clear description
 * Props: prop1, prop2, prop3
 * Used in: Where component is used
 */

import './ComponentName.css';

export default function ComponentName({ prop1, prop2 }) {
  return (
    <div className="component-name">
      {/* content */}
    </div>
  );
}
```

### **CSS Class Naming:**
- BEM-like: `.component-name__element--modifier`
- Example: `.button`, `.button--primary`, `.form-input--error`

---

## ⚠️ CRITICAL REMINDERS

1. **NO TAILWIND** - User specifically requested vanilla CSS only
2. **NO EMOJIS** in production UI (only in commits/docs)
3. **Follow component-library-and-user-stories.docx exactly**
4. **Use UploadThing for file storage** (NOT Supabase Storage)
5. **First RFQ is free** - Payment logic required after first RFQ
6. **Multi-company support** - All features must support multiple companies per user
7. **Indian market focus** - Currency formatting, compliance, etc.

---

## 📞 SUPPORT RESOURCES

- **Supabase Docs:** https://supabase.com/docs
- **Next.js 14 Docs:** https://nextjs.org/docs
- **UploadThing Docs:** https://docs.uploadthing.com
- **Llama Parse Docs:** https://docs.llamaindex.ai/en/stable/llama_parse/
- **Claude API Docs:** https://docs.anthropic.com/

---

## 🎯 IMMEDIATE ACTION ITEMS

**For Next Agent (Priority Order):**

1. ⚠️ **CRITICAL:** Fix signup - verify migration 003, test signup flow
2. ⚠️ **CRITICAL:** Test complete auth flow end-to-end
3. Update this handoff doc with test results
4. Test login, password reset, email verification
5. Test onboarding (company creation)
6. Once auth working, start RFQ creation module

**Testing Checklist:**
- [ ] Signup creates user profile without errors
- [ ] Email verification link works
- [ ] Login works
- [ ] Password reset works
- [ ] Company onboarding works
- [ ] User lands on dashboard
- [ ] Protected routes work
- [ ] Sign out works

---

## 📈 PROJECT STATUS SUMMARY

| Phase | Status | Progress |
|-------|--------|----------|
| Infrastructure Setup | ✅ Complete | 100% |
| Database Schema | ✅ Complete | 100% |
| RFQ Questions Loading | ✅ Complete | 100% |
| UI Component Library | ✅ Complete | 100% |
| Authentication System | ⚠️ Blocked | 80% (signup broken) |
| Onboarding Flow | ⏳ Pending | 100% (untested) |
| Dashboard | ⏳ Pending | 30% (basic only) |
| RFQ Creation | ⏳ Pending | 0% |
| Bid Distribution | ⏳ Pending | 0% |
| Bid Centre | ⏳ Pending | 0% |
| Payment Integration | ⏳ Pending | 0% |
| AI Analysis | ⏳ Pending | 0% |

**Estimated Timeline to MVP:**
- Fix auth issues: 1 day
- RFQ Creation: 5-7 days
- Bid Distribution: 2-3 days
- Bid Centre: 3-4 days
- Polish & Testing: 2-3 days
- **Total: ~3 weeks** (assuming no major blockers)

---

## ✅ VERIFICATION CHECKLIST

Before marking authentication complete:

- [ ] User can sign up at platform.sanctuari.io/signup
- [ ] User profile created in both auth.users and public.users
- [ ] Verification email received
- [ ] Email link redirects to /callback successfully
- [ ] User redirected to /onboarding/company
- [ ] User can create company
- [ ] onboarding_completed set to true
- [ ] User lands on /dashboard
- [ ] User can sign out
- [ ] User can log back in
- [ ] Protected routes redirect unauthenticated users
- [ ] Middleware prevents accessing onboarding if already completed

---

**Good luck! The foundation is solid, just need to fix this signup issue and you're ready to build the core features.** 🚀

**Last Updated:** October 1, 2025, 8:45 PM IST
