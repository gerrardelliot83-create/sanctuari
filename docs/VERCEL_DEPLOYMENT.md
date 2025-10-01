# Vercel Deployment Guide for Sanctuari

This guide provides step-by-step instructions for deploying both the platform and admin apps to Vercel.

## Prerequisites

- GitHub repository is created and code is pushed
- Vercel account is set up
- All third-party services are configured

## Important: Turbo Monorepo Configuration

This project uses Turborepo for managing the monorepo. Vercel has special handling for Turbo projects.

## Deployment Strategy

We will create **TWO separate Vercel projects**:
1. `sanctuari-platform` → platform.sanctuari.io
2. `sanctuari-admin` → admin.sanctuari.io

---

## Step 1: Deploy Platform App (platform.sanctuari.io)

### 1.1 Create New Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Select your GitHub repository: `sanctuari`
4. Click **Import**

### 1.2 Configure Platform Project

**Project Settings:**
- **Project Name**: `sanctuari-platform`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/platform` (click "Edit" to change)

**Build & Development Settings:**
- **Build Command**: Leave empty (Turbo auto-detected)
- **Output Directory**: Leave as `.next`
- **Install Command**: Leave empty (Turbo auto-detected)
- **Development Command**: `next dev`

### 1.3 Add Environment Variables

Click **Environment Variables** and add ALL variables from `apps/platform/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://trjutifvugvnfsxbelns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzg3MTFjYzlmYjVmMzI...
LLAMA_PARSE_API_KEY=llx-0Nw1voj64x58tfONR6FngpoioDQAg1yIqPfWbZ7qnO224QWg
ANTHROPIC_API_KEY=sk-ant-api03-4mgzoEoW5oIkx8GClsnJzMlOIvFSOvtrzh728...
RAZORPAY_KEY_ID=rzp_test_RLr5aK6BeXa8DB
RAZORPAY_KEY_SECRET=cRGNHAkbNYgyCnNYlwt8qXyM
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
BREVO_API_KEY=xsmtpsib-638bddf90c85722e4e9ba53c7894bb9e97f1f88aa6d6318617b1e12cfc9d9e50...
BREVO_SENDER_EMAIL=noreply@sanctuari.io
BREVO_SENDER_NAME=Sanctuari
NEXT_PUBLIC_PLATFORM_URL=https://platform.sanctuari.io
NEXT_PUBLIC_ADMIN_URL=https://admin.sanctuari.io
NEXT_PUBLIC_MARKETING_URL=https://www.sanctuari.io
NEXTAUTH_SECRET=generate_strong_random_secret_for_production
NEXTAUTH_URL=https://platform.sanctuari.io
```

**Important Notes:**
- Select **Production**, **Preview**, and **Development** for all variables
- Generate a new strong random secret for `NEXTAUTH_SECRET` in production
- Update URLs to production domains

### 1.4 Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Once deployed, you'll get a URL like: `sanctuari-platform.vercel.app`

### 1.5 Add Custom Domain

1. Go to **Settings** → **Domains**
2. Add domain: `platform.sanctuari.io`
3. Follow DNS configuration instructions:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
   - Or add A records if using root domain
4. Wait for DNS propagation (can take up to 48 hours, usually within minutes)

---

## Step 2: Deploy Admin App (admin.sanctuari.io)

### 2.1 Create Second Project

1. Go back to Vercel Dashboard
2. Click **Add New...** → **Project**
3. Select the **same** GitHub repository: `sanctuari`
4. Click **Import**

### 2.2 Configure Admin Project

**Project Settings:**
- **Project Name**: `sanctuari-admin`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/admin` (click "Edit" to change)

**Build & Development Settings:**
- **Build Command**: Leave empty (Turbo auto-detected)
- **Output Directory**: Leave as `.next`
- **Install Command**: Leave empty (Turbo auto-detected)
- **Development Command**: `next dev --port 3001`

### 2.3 Add Environment Variables

Add these variables (admin needs fewer than platform):

```env
NEXT_PUBLIC_SUPABASE_URL=https://trjutifvugvnfsxbelns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzg3MTFjYzlmYjVmMzI...
BREVO_API_KEY=xsmtpsib-638bddf90c85722e4e9ba53c7894bb9e97f1f88aa6d6318617b1e12cfc9d9e50...
BREVO_SENDER_EMAIL=noreply@sanctuari.io
BREVO_SENDER_NAME=Sanctuari
NEXT_PUBLIC_PLATFORM_URL=https://platform.sanctuari.io
NEXT_PUBLIC_ADMIN_URL=https://admin.sanctuari.io
NEXT_PUBLIC_MARKETING_URL=https://www.sanctuari.io
NEXTAUTH_SECRET=generate_different_secret_for_admin
NEXTAUTH_URL=https://admin.sanctuari.io
```

### 2.4 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Once deployed, you'll get: `sanctuari-admin.vercel.app`

### 2.5 Add Custom Domain

1. Go to **Settings** → **Domains**
2. Add domain: `admin.sanctuari.io`
3. Follow DNS configuration (same as platform)

---

## Step 3: Configure DNS (If Not Done Already)

### For Domains Purchased Through Your Registrar:

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS settings for `sanctuari.io`
3. Add these records:

```
Type    Name        Value                       TTL
CNAME   platform    cname.vercel-dns.com        3600
CNAME   admin       cname.vercel-dns.com        3600
CNAME   www         [your-webflow-url]          3600
```

### Verify DNS Propagation:

```bash
# Check platform subdomain
dig platform.sanctuari.io

# Check admin subdomain
dig admin.sanctuari.io
```

---

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase Redirect URLs

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs**:
   - `https://platform.sanctuari.io/auth/callback`
   - `https://admin.sanctuari.io/auth/callback`

### 4.2 Update UploadThing Allowed Origins

1. Go to UploadThing Dashboard
2. Navigate to **Settings** → **Security**
3. Add allowed origins:
   - `https://platform.sanctuari.io`
   - `https://admin.sanctuari.io`

### 4.3 Update Razorpay Webhooks

1. Go to Razorpay Dashboard
2. Navigate to **Settings** → **Webhooks**
3. Update webhook URL to: `https://platform.sanctuari.io/api/webhooks/razorpay`

### 4.4 Verify Brevo Sender Domain

1. Go to Brevo Dashboard
2. Navigate to **Senders & IPs** → **Domains**
3. Verify `sanctuari.io` domain by adding DNS records

---

## Step 5: Testing Deployments

### Test Platform App:

1. Visit: https://platform.sanctuari.io
2. Check that the homepage loads
3. Test authentication flow
4. Verify environment variables are working

### Test Admin App:

1. Visit: https://admin.sanctuari.io
2. Check that admin panel loads
3. Test authentication

---

## Troubleshooting Common Issues

### Build Fails with "Missing packageManager"

**Solution**: Ensure `package.json` has:
```json
"packageManager": "yarn@1.22.19"
```

### Build Fails with "Cannot find module"

**Solution**: Check that all workspace packages are properly linked in turbo.json

### Environment Variables Not Working

**Solution**:
1. Double-check variable names match exactly
2. Restart deployment after adding variables
3. Check that variables are added to correct environment (Production/Preview/Development)

### Custom Domain Not Working

**Solution**:
1. Wait for DNS propagation (up to 48 hours)
2. Verify CNAME records are correct
3. Check Vercel domain status in project settings
4. Try clearing browser cache

### App Builds Locally But Not on Vercel

**Solution**:
1. Check Node version matches (18.0.0+)
2. Delete `node_modules` and `yarn.lock` locally, reinstall
3. Push changes and redeploy
4. Check build logs in Vercel for specific errors

---

## Continuous Deployment

Once configured, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Show deployment status in GitHub

### To Manually Redeploy:

1. Go to project in Vercel Dashboard
2. Click **Deployments**
3. Click **...** on latest deployment
4. Click **Redeploy**

---

## Monitoring and Logs

### View Deployment Logs:

1. Go to project in Vercel
2. Click **Deployments**
3. Click on specific deployment
4. View **Build Logs** and **Function Logs**

### Set Up Alerts:

1. Go to **Settings** → **Notifications**
2. Enable:
   - Deployment notifications
   - Error notifications
   - Performance notifications

---

## Security Best Practices

1. **Never commit .env.local files** - Already in .gitignore
2. **Rotate secrets regularly** - Update API keys quarterly
3. **Use different secrets** for platform vs admin
4. **Enable Vercel Authentication** for preview deployments
5. **Set up IP whitelisting** for admin panel (Vercel Pro feature)

---

## Rollback Procedure

If a deployment fails:

1. Go to **Deployments** in Vercel
2. Find the last working deployment
3. Click **...** → **Promote to Production**
4. Instant rollback complete

---

## Next Steps After Deployment

1. Set up monitoring and error tracking (Sentry)
2. Configure analytics
3. Set up backup systems
4. Create production database backups
5. Test all features in production environment

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Turbo Docs**: https://turbo.build/repo/docs
- **Next.js Docs**: https://nextjs.org/docs

For project-specific issues, check build logs and GitHub commits.
