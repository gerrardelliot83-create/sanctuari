# Sanctuari Platform - Development Handover Instructions

**Date:** October 1, 2025
**Current Phase:** Authentication System Development
**Progress:** Foundation complete, starting core features

---

## Project Overview

**Sanctuari** is an AI-powered insurance procurement platform for B2B businesses in India. Users create RFQs (Request for Quotations), distribute to insurers/brokers, receive bids, and compare quotes with AI analysis.

**Tech Stack (STRICT - No Substitutions):**
- Frontend: Next.js 14 App Router, JavaScript/TypeScript, **Vanilla CSS only (NO Tailwind, NO CSS libraries)**
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- File Storage: UploadThing (NOT Supabase Storage)
- Document Parsing: Llama Parse
- AI: Claude Opus 4.1 (orchestrator), Claude Sonnet 4 (sub-agents), Langchain
- Payments: Razorpay
- Email: Brevo
- Deployment: Vercel

**Deployed URLs:**
- Platform: https://platform.sanctuari.io
- Admin: https://admin.sanctuari.io

---

## What's Been Completed ✅

### 1. Infrastructure
- ✅ Turborepo monorepo structure (`apps/platform`, `apps/admin`, shared `packages/`)
- ✅ Both apps deployed to Vercel with environment variables
- ✅ Custom domains configured with SSL
- ✅ All third-party services configured (Supabase, UploadThing, Llama Parse, Claude API, Razorpay, Brevo)

### 2. Database
- ✅ Complete schema with 17 tables (users, companies, company_members, rfqs, bids, etc.)
- ✅ Row Level Security (RLS) policies active
- ✅ Multi-company support (users can belong to multiple companies)
- ✅ Company invitations system designed
- ✅ All migrations executed in Supabase

### 3. RFQ Questions
- ✅ 47 insurance product CSV files processed
- ✅ 1,558 questions enhanced with AI guidance
- ✅ Features added:
  - Indian currency formatting (138 fields)
  - Auto-fill from company profile (259 fields)
  - Policy document extraction markers (176 fields)
  - "Other" options with text inputs (18 fields)
- ✅ All questions loaded into Supabase `rfq_questions` table
- ✅ 60 insurance products in database

### 4. Initial Components
- ✅ Button component with variants (primary, secondary, outline, ghost, danger)
- ✅ Supabase client utilities (browser, server, middleware)

---

## Design System (CRITICAL - MUST FOLLOW)

### Color Palette
```css
/* Fog - Neutral */
--fog-50: #f8f9fa;
--fog-100: #f1f3f5;
--fog-200: #e9ecef;
--fog-300: #dee2e6;
--fog-400: #ced4da;
--fog-500: #adb5bd;
--fog-600: #868e96;

/* Iris - Primary */
--iris-50: #f0f0ff;
--iris-100: #e5e5ff;
--iris-200: #c7c7ff;
--iris-300: #a8a8ff;
--iris-400: #7676ff;
--iris-500: #4d4dff;
--iris-600: #3636cc;

/* Rose - Error/Danger */
--rose-50: #fff0f5;
--rose-100: #ffe0eb;
--rose-200: #ffc2d6;
--rose-300: #ffa3c2;
--rose-400: #ff7099;
--rose-500: #ff3d70;
--rose-600: #cc3159;

/* Sun - Success/Warning */
--sun-50: #fffef0;
--sun-100: #fffce0;
--sun-200: #fff9c2;
--sun-300: #fff6a3;
--sun-400: #fff066;
--sun-500: #ffea29;
--sun-600: #ccbb21;

/* Ink - Text */
--ink-50: #f6f6f7;
--ink-100: #e8e9eb;
--ink-200: #d1d3d7;
--ink-300: #b9bdc3;
--ink-400: #8a919b;
--ink-500: #5b6573;
--ink-600: #49515c;
--ink-700: #373d46;
--ink-800: #252930;
--ink-900: #13151a;
```

### Typography
- **Body/UI**: Geist Sans (`var(--font-sans)`)
- **Code/Numbers**: Geist Mono (`var(--font-mono)`)

### Spacing
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### CRITICAL RULES
- ❌ **NO Tailwind CSS**
- ❌ **NO CSS frameworks or libraries**
- ✅ **Vanilla CSS only**
- ✅ **CSS Variables for theming**
- ✅ **Mobile-first responsive design**

---

## Current Task: Build Authentication System

### User Flow (Minimal Signup)

**Step 1: Signup**
- Required: Email + Password only
- Optional: Full name (can add later)
- Creates user in `auth.users` (Supabase)
- Creates profile in `public.users` with `onboarding_completed = false`

**Step 2: Email Verification**
- Supabase sends verification email
- User clicks link to verify

**Step 3: Post-Signup Onboarding**
- User creates first company (name required, other details optional)
- Creates record in `public.companies`
- Creates `company_members` record with role = 'owner'
- Sets `onboarding_completed = true`

**Step 4: Dashboard**
- User lands on dashboard
- Can create RFQs immediately

### Authentication Pages Needed

```
apps/platform/src/app/
├── auth/
│   ├── signup/
│   │   └── page.js           # Signup form
│   ├── login/
│   │   └── page.js           # Login form
│   ├── forgot-password/
│   │   └── page.js           # Request reset link
│   ├── reset-password/
│   │   └── page.js           # Set new password
│   ├── verify-email/
│   │   └── page.js           # Email verification status
│   └── callback/
│       └── route.js          # OAuth callback handler
├── onboarding/
│   ├── company/
│   │   └── page.js           # Create first company
│   └── complete/
│       └── page.js           # Onboarding success
└── dashboard/
    └── page.js               # Main dashboard (protected)
```

### Components to Build

**1. Form Components** (`packages/ui/components/`)
```
Input/
├── Input.js
└── Input.css

Label/
├── Label.js
└── Label.css

FormField/
├── FormField.js        # Wrapper: Label + Input + Error
└── FormField.css

PasswordInput/
├── PasswordInput.js    # Input with show/hide toggle
└── PasswordInput.css

ErrorMessage/
├── ErrorMessage.js
└── ErrorMessage.css

LoadingSpinner/
├── LoadingSpinner.js
└── LoadingSpinner.css
```

**2. Layout Components**
```
AuthLayout/
├── AuthLayout.js       # Split-screen: Left = form, Right = branding
└── AuthLayout.css

Card/
├── Card.js
└── Card.css

Container/
├── Container.js
└── Container.css
```

**3. Auth-Specific Components**
```
SignupForm/
├── SignupForm.js
└── SignupForm.css

LoginForm/
├── LoginForm.js
└── LoginForm.css

ForgotPasswordForm/
├── ForgotPasswordForm.js
└── ForgotPasswordForm.css

CompanyCreationForm/
├── CompanyCreationForm.js
└── CompanyCreationForm.css
```

### Implementation Guide

#### Example: Input Component
```javascript
// packages/ui/components/Input/Input.js
export default function Input({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = false,
  className = '',
}) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`input ${error ? 'input--error' : ''} ${className}`}
      aria-invalid={error}
    />
  );
}
```

```css
/* packages/ui/components/Input/Input.css */
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--ink-900);
  background-color: white;
  border: 1px solid var(--fog-300);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.input:hover:not(:disabled) {
  border-color: var(--iris-300);
}

.input:focus {
  outline: none;
  border-color: var(--iris-500);
  box-shadow: 0 0 0 3px var(--iris-100);
}

.input--error {
  border-color: var(--rose-500);
}

.input--error:focus {
  box-shadow: 0 0 0 3px var(--rose-100);
}

.input:disabled {
  background-color: var(--fog-100);
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--ink-400);
}
```

#### Example: Signup Page
```javascript
// apps/platform/src/app/auth/signup/page.js
'use client';

import { useState } from 'react';
import { createClient } from '@sanctuari/database/lib/client';
import Button from '@sanctuari/ui/components/Button/Button';
import Input from '@sanctuari/ui/components/Input/Input';
import AuthLayout from '@/components/layouts/AuthLayout';
import './signup.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          onboarding_completed: false,
        });

      if (profileError) {
        setError('Failed to create profile. Please contact support.');
        setLoading(false);
        return;
      }
    }

    // Redirect to email verification page
    window.location.href = '/auth/verify-email';
  }

  return (
    <AuthLayout>
      <div className="signup-form">
        <h1>Create your account</h1>
        <p>Start simplifying your insurance procurement today</p>

        <form onSubmit={handleSignup}>
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <Input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="signup-button"
          >
            Sign up
          </Button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/auth/login">Log in</a>
        </p>
      </div>
    </AuthLayout>
  );
}
```

### Supabase Auth Functions

Create helper functions in `packages/database/lib/auth.js`:

```javascript
import { createClient } from './client';

export async function signUp(email, password) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/auth/callback`,
    },
  });
}

export async function signIn(email, password) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

export async function resetPassword(email) {
  const supabase = createClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/auth/reset-password`,
  });
}

export async function updatePassword(newPassword) {
  const supabase = createClient();
  return await supabase.auth.updateUser({
    password: newPassword,
  });
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
```

### Protected Routes Middleware

Create `apps/platform/src/middleware.js`:

```javascript
import { createClient } from '@sanctuari/database/lib/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { supabase, response } = createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/dashboard', '/rfq', '/bids', '/settings'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Check if user completed onboarding
  if (session && isProtectedPath) {
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (user && !user.onboarding_completed) {
      return NextResponse.redirect(
        new URL('/onboarding/company', request.url)
      );
    }
  }

  // Redirect to login if not authenticated
  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rfq/:path*',
    '/bids/:path*',
    '/settings/:path*',
    '/auth/:path*',
    '/onboarding/:path*',
  ],
};
```

---

## Key Files & Locations

### Environment Variables
- Platform: `apps/platform/.env.local`
- Admin: `apps/admin/.env.local`
- Both have Supabase, UploadThing, Llama Parse, Claude API, Razorpay, Brevo keys

### Database Clients
- Browser: `packages/database/lib/client.js`
- Server: `packages/database/lib/server.js`
- Middleware: `packages/database/lib/middleware.js`

### Migrations
- `packages/database/migrations/001_initial_schema.sql` ✅ Executed
- `packages/database/migrations/002_add_metadata_to_questions.sql` ✅ Executed

### Resources (Raw Data)
- RFQ Questions (processed): `/Resources/processed-rfq-questions/` (45 JSON files)
- Market Player Profiles: `/Resources/Market Player Profiles/` (⏳ Not yet imported)
- CEO Photos & Logos: `/Resources/CEO Photos & Company logos/` (⏳ Not yet imported)

---

## Important Concepts

### Multi-Company Architecture
- Users can belong to multiple companies via `company_members` table
- Each user has a role per company: owner, admin, member, viewer
- Active company stored in session/local storage
- All RFQs, bids scoped to company_id

### RFQ Question Enhancements
Questions have metadata:
```json
{
  "format": "indian_currency",           // Enable ₹ formatting
  "auto_fill_source": "company_profile", // Pre-fill from company
  "policy_extractable": true,            // Extract from uploaded policy
  "has_other_option": true               // Show text input if "Other"
}
```

### File Storage (UploadThing)
- **NOT** using Supabase Storage
- All files (RFQ PDFs, bid documents, logos, photos) go to UploadThing
- Store URLs in database

---

## Next Steps (Priority Order)

### Immediate (This Sprint)
1. ✅ Complete Input component
2. ✅ Complete FormField component
3. ✅ Complete AuthLayout (split-screen design)
4. ✅ Build signup flow (/auth/signup)
5. ✅ Build login flow (/auth/login)
6. ✅ Build forgot password flow
7. ✅ Build email verification handling
8. ✅ Build onboarding flow (/onboarding/company)
9. ✅ Protected routes middleware
10. ✅ Test complete auth flow

### Week 2
11. Dashboard page (empty state)
12. Company selector dropdown
13. Company settings page
14. User profile page
15. Import network members (insurers/brokers)

### Week 3-4
16. RFQ creation module (dynamic forms)
17. Auto-fill from company profile
18. Policy document upload & extraction
19. Indian currency formatting

---

## Testing Checklist

After building auth:
- [ ] User can sign up with email/password
- [ ] Email verification works
- [ ] User can log in
- [ ] User can reset password
- [ ] User completes onboarding
- [ ] User lands on dashboard
- [ ] Protected routes redirect to login
- [ ] Authenticated users can't access auth pages
- [ ] Session persists on page reload
- [ ] Logout works correctly

---

## Reference Documents

**Location:** `/mnt/c/Users/DELL/Desktop/sanctuari/Resources/`

1. `component-library-and-user-stories.docx` - UI components, design system, user requirements
2. `technical-specifications.docx` - Complete architecture, modules, implementation details
3. `initial-prompt.docx` - Project overview and instructions

**Note:** These are .docx files. You received all key information in the initial prompt.

---

## Progress Tracking

- **DEVELOPMENT_PROGRESS.md** - Comprehensive progress tracker (update after each feature)
- **HANDOVER_INSTRUCTIONS.md** - This file
- **Todo list** - Internal tracking (use TodoWrite tool)

---

## Code Style Guidelines

### File Naming
- Components: PascalCase (`Button.js`, `AuthLayout.js`)
- Utilities: camelCase (`auth.js`, `format-currency.js`)
- CSS: Same as component (`Button.css`)
- Pages: lowercase (`page.js`, `layout.js`)

### Comments
```javascript
/**
 * Component: ComponentName
 * Purpose: Clear description
 * Props: List all props
 * Used in: Where this is used
 */
```

### Error Handling
- Always show user-friendly error messages
- Log detailed errors to console
- Provide recovery suggestions
- Never expose sensitive info

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Focus states
- Color contrast (WCAG 2.1 AA)
- Screen reader support

---

## Common Issues & Solutions

### Supabase Auth
- Always use `createClient()` from appropriate location (client/server/middleware)
- RLS policies require proper auth context
- Email verification must be enabled in Supabase dashboard

### CSS
- Import CSS in component file
- Use CSS variables for colors/spacing
- Mobile-first media queries
- Test in Chrome, Firefox, Safari

### Deployment
- Commit before testing on Vercel
- Check environment variables in Vercel dashboard
- View deployment logs for errors
- Redeploy if env vars change

---

## Support & Documentation

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- UploadThing Docs: https://docs.uploadthing.com

---

## Final Notes

**REMEMBER:**
- ❌ NO Tailwind CSS
- ❌ NO CSS libraries
- ✅ Vanilla CSS only
- ✅ Follow Sanctuari color palette exactly
- ✅ Geist fonts
- ✅ Mobile-first
- ✅ Clean, commented code
- ✅ Test as you build

**FOCUS:**
Build authentication system completely before moving to other features. Users must be able to sign up, verify email, log in, create their first company, and reach the dashboard.

**Good luck! 🚀**
