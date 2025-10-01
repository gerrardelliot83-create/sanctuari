# Sanctuari Deployment Checklist

Use this checklist to ensure successful deployment to Vercel.

## Pre-Deployment Checklist

- [ ] All code is committed to GitHub
- [ ] `.env.local` files are NOT committed (check .gitignore)
- [ ] All third-party services are configured and tested
- [ ] API keys are available and valid
- [ ] Local development server runs without errors
- [ ] Local build completes successfully (`npm run build`)

## Deployment Steps for Platform (platform.sanctuari.io)

### Vercel Configuration
- [ ] Created new Vercel project: `sanctuari-platform`
- [ ] Set root directory to: `apps/platform`
- [ ] Framework preset: Next.js
- [ ] Build command: Auto-detected (Turbo)

### Environment Variables (Platform)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_KEY
- [ ] UPLOADTHING_TOKEN
- [ ] LLAMA_PARSE_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET
- [ ] RAZORPAY_WEBHOOK_SECRET
- [ ] BREVO_API_KEY
- [ ] BREVO_SENDER_EMAIL
- [ ] BREVO_SENDER_NAME
- [ ] NEXT_PUBLIC_PLATFORM_URL
- [ ] NEXT_PUBLIC_ADMIN_URL
- [ ] NEXT_PUBLIC_MARKETING_URL
- [ ] NEXTAUTH_SECRET (production value)
- [ ] NEXTAUTH_URL

### Deployment
- [ ] Clicked "Deploy" button
- [ ] Build succeeded
- [ ] Can access deployment at Vercel URL
- [ ] Custom domain added: platform.sanctuari.io
- [ ] DNS configured correctly
- [ ] SSL certificate is active

## Deployment Steps for Admin (admin.sanctuari.io)

### Vercel Configuration
- [ ] Created new Vercel project: `sanctuari-admin`
- [ ] Set root directory to: `apps/admin`
- [ ] Framework preset: Next.js
- [ ] Build command: Auto-detected (Turbo)

### Environment Variables (Admin)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_KEY
- [ ] UPLOADTHING_TOKEN
- [ ] BREVO_API_KEY
- [ ] BREVO_SENDER_EMAIL
- [ ] BREVO_SENDER_NAME
- [ ] NEXT_PUBLIC_PLATFORM_URL
- [ ] NEXT_PUBLIC_ADMIN_URL
- [ ] NEXT_PUBLIC_MARKETING_URL
- [ ] NEXTAUTH_SECRET (different from platform)
- [ ] NEXTAUTH_URL

### Deployment
- [ ] Clicked "Deploy" button
- [ ] Build succeeded
- [ ] Can access deployment at Vercel URL
- [ ] Custom domain added: admin.sanctuari.io
- [ ] DNS configured correctly
- [ ] SSL certificate is active

## Post-Deployment Configuration

### Supabase
- [ ] Added redirect URLs in Authentication settings
- [ ] Tested authentication flow from production URLs
- [ ] Verified database connection from deployed apps

### UploadThing
- [ ] Added production URLs to allowed origins
- [ ] Tested file upload from production

### Razorpay
- [ ] Updated webhook URL to production endpoint
- [ ] Tested payment flow (use test mode initially)

### Brevo
- [ ] Verified sender domain
- [ ] Tested email sending from production
- [ ] Confirmed email templates are working

### DNS
- [ ] platform.sanctuari.io resolves correctly
- [ ] admin.sanctuari.io resolves correctly
- [ ] SSL certificates are valid
- [ ] No mixed content warnings

## Testing Checklist

### Platform App Testing
- [ ] Homepage loads correctly
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create RFQ (once implemented)
- [ ] File uploads work
- [ ] Emails are sent
- [ ] Payment flow works (test mode)

### Admin App Testing
- [ ] Admin homepage loads
- [ ] Admin can log in
- [ ] Admin can access all features
- [ ] Data displays correctly

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Monitoring Setup

- [ ] Error tracking configured (Sentry or similar)
- [ ] Analytics setup (if required)
- [ ] Vercel deployment notifications enabled
- [ ] Uptime monitoring configured

## Security Checklist

- [ ] All API keys are in Vercel environment variables (not in code)
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is active
- [ ] SQL injection protection via Supabase RLS
- [ ] XSS protection enabled

## Performance Checklist

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] Images are optimized
- [ ] Fonts are loading correctly

## Rollback Plan

If deployment fails:
1. Go to Vercel Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. Investigate issues locally
5. Fix and redeploy

## Common Issues and Solutions

### Build fails with "Missing packageManager"
✅ Fixed: Added `"packageManager": "yarn@1.22.19"` to package.json

### Environment variables not working
- Double-check variable names
- Redeploy after adding variables
- Check correct environment selected

### Custom domain not resolving
- Wait for DNS propagation (up to 48 hours)
- Verify CNAME records
- Clear browser cache

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Turbo Docs: https://turbo.build/repo/docs
- GitHub Repository: [Your repo URL]

---

**Date Completed**: _____________

**Deployed By**: _____________

**Notes**: _____________
