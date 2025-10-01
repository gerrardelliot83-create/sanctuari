# Sanctuari - Next Steps for Deployment

## ✅ What's Been Completed

1. **Project Structure**
   - Turborepo monorepo with apps/platform and apps/admin
   - Shared packages (ui, database, utils, config)
   - Next.js 14 with App Router
   - TypeScript configuration

2. **Deployment Fixes**
   - Added `packageManager: "yarn@1.22.19"` to package.json (fixes Vercel error)
   - Geist fonts dependency added
   - Vercel configuration file created

3. **Security**
   - Removed API keys from .env.example
   - Created .env.local files for both apps with actual keys
   - Updated .gitignore to prevent committing secrets

4. **Documentation**
   - Complete setup guide for all third-party services
   - Comprehensive Vercel deployment guide
   - Deployment checklist
   - Development strategy document

---

## 🚀 Immediate Action Required: Deploy to Vercel

### Step 1: Commit and Push Changes

Run these commands in your terminal:

```bash
cd /mnt/c/Users/Dell/desktop/sanctuari

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "fix: configure monorepo for Vercel deployment

- Add packageManager field to fix Turbo build
- Add geist fonts dependency
- Secure API keys in .env.local files
- Remove credentials from .env.example
- Add comprehensive deployment documentation"

# Push to GitHub
git push origin main
```

### Step 2: Deploy Platform App to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Select your `sanctuari` repository
4. Configure as follows:
   - **Project Name**: `sanctuari-platform`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" → Select `apps/platform`
   - **Build Command**: Leave empty (auto-detected)
   - **Output Directory**: `.next`
   - **Install Command**: Leave empty (auto-detected)

5. **Add Environment Variables** - Copy ALL from `apps/platform/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_KEY
   UPLOADTHING_TOKEN
   LLAMA_PARSE_API_KEY
   ANTHROPIC_API_KEY
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET
   RAZORPAY_WEBHOOK_SECRET
   BREVO_API_KEY
   BREVO_SENDER_EMAIL
   BREVO_SENDER_NAME
   NEXT_PUBLIC_PLATFORM_URL (set to https://platform.sanctuari.io)
   NEXT_PUBLIC_ADMIN_URL (set to https://admin.sanctuari.io)
   NEXT_PUBLIC_MARKETING_URL
   NEXTAUTH_SECRET (generate new: openssl rand -base64 32)
   NEXTAUTH_URL (set to https://platform.sanctuari.io)
   ```

6. Click **Deploy**
7. Wait for build (2-3 minutes)
8. Verify it works at the Vercel URL

### Step 3: Deploy Admin App to Vercel

1. In Vercel Dashboard, click **Add New...** → **Project**
2. Select your `sanctuari` repository again
3. Configure as follows:
   - **Project Name**: `sanctuari-admin`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" → Select `apps/admin`
   - **Build Command**: Leave empty (auto-detected)
   - **Output Directory**: `.next`
   - **Install Command**: Leave empty (auto-detected)

4. **Add Environment Variables** - Copy from `apps/admin/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_KEY
   UPLOADTHING_TOKEN
   BREVO_API_KEY
   BREVO_SENDER_EMAIL
   BREVO_SENDER_NAME
   NEXT_PUBLIC_PLATFORM_URL (set to https://platform.sanctuari.io)
   NEXT_PUBLIC_ADMIN_URL (set to https://admin.sanctuari.io)
   NEXT_PUBLIC_MARKETING_URL
   NEXTAUTH_SECRET (generate different: openssl rand -base64 32)
   NEXTAUTH_URL (set to https://admin.sanctuari.io)
   ```

5. Click **Deploy**
6. Wait for build
7. Verify it works

### Step 4: Configure Custom Domains

**For Platform:**
1. Go to sanctuari-platform project in Vercel
2. Settings → Domains
3. Add `platform.sanctuari.io`
4. Follow DNS instructions (add CNAME to your domain registrar)

**For Admin:**
1. Go to sanctuari-admin project in Vercel
2. Settings → Domains
3. Add `admin.sanctuari.io`
4. Follow DNS instructions

### Step 5: Update Third-Party Services

**Supabase:**
- Go to Authentication → URL Configuration
- Add redirect URLs:
  - `https://platform.sanctuari.io/auth/callback`
  - `https://admin.sanctuari.io/auth/callback`

**UploadThing:**
- Go to Settings → Security
- Add allowed origins:
  - `https://platform.sanctuari.io`
  - `https://admin.sanctuari.io`

**Razorpay:**
- Go to Settings → Webhooks
- Update webhook URL: `https://platform.sanctuari.io/api/webhooks/razorpay`

---

## ⚠️ Important Notes

### Security Reminders
- ✅ `.env.local` files are in `.gitignore` and will NOT be committed
- ✅ `.env.example` now has placeholder values only
- ⚠️ NEVER commit actual API keys to GitHub
- ⚠️ Generate different NEXTAUTH_SECRET for production vs development

### If Deployment Fails

**Common Issues:**

1. **"Missing packageManager" error**
   - ✅ Fixed: We added this to package.json

2. **"Cannot find module" errors**
   - Check that all workspace packages are linked correctly
   - Try deleting node_modules and yarn.lock, then reinstall

3. **Build succeeds but app crashes**
   - Check environment variables are all set
   - View Function Logs in Vercel dashboard

4. **Fonts not loading**
   - ✅ Fixed: We added geist dependency

---

## 📋 Deployment Checklist

Use this quick checklist:

- [ ] Code committed and pushed to GitHub
- [ ] Platform app deployed to Vercel
- [ ] Admin app deployed to Vercel
- [ ] Environment variables added to both projects
- [ ] Custom domains configured (if ready)
- [ ] DNS records updated
- [ ] Supabase redirect URLs added
- [ ] UploadThing origins updated
- [ ] Razorpay webhook updated
- [ ] Both apps accessible and loading

---

## 🎯 After Successful Deployment

Once both apps are deployed and working:

### Option A: Begin Development Immediately
Start Phase 2 - Core Infrastructure:
1. Database schema creation
2. Authentication system
3. Component library

### Option B: Plan and Review
Review the development strategy document and:
1. Confirm timeline (11-12 weeks)
2. Approve feature priorities
3. Discuss any changes needed

---

## 📚 Reference Documents

All created in the `docs/` folder:

1. **SETUP_GUIDE.md** - Third-party service configuration
2. **VERCEL_DEPLOYMENT.md** - Detailed deployment instructions
3. **DEVELOPMENT_STRATEGY.md** - Complete development roadmap
4. **DEPLOYMENT_CHECKLIST.md** - Comprehensive deployment checklist

---

## 🆘 Need Help?

If you encounter issues:

1. **Check build logs** in Vercel dashboard
2. **Review error messages** carefully
3. **Consult VERCEL_DEPLOYMENT.md** troubleshooting section
4. **Verify environment variables** are correctly set

Common error solutions are documented in the troubleshooting sections.

---

## Summary

**You are now ready to deploy!**

The main error you encountered ("Missing packageManager") has been fixed. All configuration is complete. Follow the steps above to deploy both apps to Vercel.

Once deployed, we can immediately begin building the platform features, starting with the database schema and authentication system.

**Current Status**: ✅ Ready for Deployment
**Next Milestone**: Deploy to Vercel → Begin Phase 2 Development
