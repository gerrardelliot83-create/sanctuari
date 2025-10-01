# Sanctuari User Flow

## Minimal Signup & Onboarding

### 1. Signup (Minimal Information)
**Required:**
- Email address
- Password

**Optional (can be added later):**
- Full name
- Phone number
- Profile picture

**What happens:**
- User account created in `auth.users` (Supabase Auth)
- Profile created in `public.users` with `onboarding_completed = false`
- User redirected to onboarding

### 2. Post-Signup Onboarding
**Step 1: Create First Company**
- Prompt: "Let's set up your first organization"
- Required: Company name
- Optional: Industry, size, GST/PAN
- Creates record in `public.companies`
- Creates `company_members` record with role = 'owner'
- Sets `onboarding_completed = true`

**Step 2: Dashboard**
- User lands on dashboard
- Can immediately create RFQs

### 3. Managing Multiple Companies

**Adding New Company:**
- User clicks "Add Company" in settings
- Same flow as onboarding
- User becomes 'owner' of new company
- User can switch between companies

**Switching Companies:**
- Company selector dropdown in header
- Changes context for all RFQs and data
- Each company has separate RFQs, bids, etc.

### 4. Inviting Collaborators

**From Company Settings:**
1. Click "Team Members"
2. Click "Invite Member"
3. Enter email and select role:
   - **Owner**: Full access, can delete company
   - **Admin**: Can manage members, create RFQs
   - **Member**: Can create and manage RFQs
   - **Viewer**: Read-only access

**Invitation Process:**
- Creates record in `company_invitations`
- Generates unique invitation token
- Sends email via Brevo with invitation link
- Link: `platform.sanctuari.io/invite/[token]`
- Expires in 7 days

**Accepting Invitation:**
- Recipient clicks link
- If not signed up: Sign up → Accept invitation
- If signed up: Log in → Accept invitation
- Creates `company_members` record
- User now has access to company

### 5. User Sessions & Company Context

**How it works:**
- User logs in once
- Can access all companies they're a member of
- Active company stored in session/local storage
- All queries filtered by active company

**Permissions:**
- Owner/Admin: Full access
- Member: Create/edit own RFQs, view company RFQs
- Viewer: Read-only, no creation

## Database Structure

### User → Company Relationship

```
User (email, password)
  ↓
company_members (links users to companies)
  ↓
Company (name, details)
  ↓
RFQs, Bids, etc. (all scoped to company)
```

### One User, Multiple Companies Example:

```
User: john@example.com
  ├── Company A (Owner)
  │     ├── RFQ-2025-0001
  │     └── RFQ-2025-0002
  ├── Company B (Admin - invited by someone)
  │     ├── RFQ-2025-0003
  │     └── RFQ-2025-0004
  └── Company C (Member - invited by someone)
        └── RFQ-2025-0005 (can only see own RFQs)
```

## Benefits of This Approach

1. **Fast Signup**: Only email/password needed
2. **Flexible**: Add company details when ready
3. **Scalable**: Manage multiple organizations
4. **Collaborative**: Easy team invitations
5. **Secure**: Proper role-based access control

## Implementation Phases

### Phase 1: Basic Auth
- Email/password signup
- Email verification
- Password reset

### Phase 2: Onboarding
- Post-signup company creation flow
- Profile completion

### Phase 3: Multi-Company
- Company switcher
- Company settings page

### Phase 4: Team Management
- Invitation system
- Member management
- Role-based permissions
