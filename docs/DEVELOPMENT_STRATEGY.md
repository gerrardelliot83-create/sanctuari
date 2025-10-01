# Sanctuari Platform - Development Strategy

## Executive Summary

This document outlines the complete development strategy for building the Sanctuari AI-powered insurance procurement platform. The strategy is organized into phases, with clear deliverables, timelines, and dependencies.

## Project Status

✅ **Phase 1 Completed**: Project structure, environment configuration, deployment setup
🔄 **Current Phase**: Ready to begin Phase 2 - Core Infrastructure

---

## Development Phases Overview

```
Phase 1: Foundation Setup (✅ COMPLETED)
├── Monorepo structure
├── Environment configuration
└── Deployment pipeline

Phase 2: Core Infrastructure (NEXT - 2 weeks)
├── Database schema
├── Authentication system
└── Component library

Phase 3: Platform Features (4 weeks)
├── RFQ creation module
├── Bid distribution
├── Bid submission portal
├── Bid Centre
└── Payment integration

Phase 4: Admin Panel (2 weeks)
├── Configuration interfaces
├── Network management
├── Email templates
└── Analytics dashboard

Phase 5: AI Integration (2 weeks)
├── Claude API multi-agent system
├── Document processing
└── Quote analysis

Phase 6: Testing & Launch (1 week)
├── End-to-end testing
├── Performance optimization
└── Production deployment
```

**Total Estimated Timeline**: 11-12 weeks

---

## Phase 2: Core Infrastructure (NEXT)

**Duration**: 2 weeks
**Priority**: Critical
**Dependencies**: Phase 1 complete

### Week 1: Database & Authentication

#### Day 1-2: Supabase Database Schema

**Deliverables**:
- Complete database schema with all tables
- Row Level Security (RLS) policies
- Database triggers and functions
- Type generation for TypeScript

**Tables to Create**:
1. `users` - User accounts and profiles
2. `companies` - Client company information
3. `rfqs` - Request for Quotations
4. `rfq_questions` - Dynamic form questions
5. `rfq_responses` - User responses to RFQ forms
6. `insurers` - Insurance company profiles
7. `brokers` - Broker profiles
8. `bids` - Submitted quotes/bids
9. `bid_documents` - Uploaded bid documents
10. `payments` - Payment records
11. `subscriptions` - Subscription management
12. `email_logs` - Email tracking
13. `audit_logs` - System audit trail
14. `network_members` - Sanctuari network (insurers/brokers)

**Implementation Steps**:
```sql
-- Example structure (will be fully implemented)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

#### Day 3-4: Authentication System

**Deliverables**:
- Complete authentication flow (signup, login, logout)
- Password reset functionality
- Email verification
- Protected routes middleware
- Session management
- Role-based access control (RBAC)

**Files to Create**:
```
packages/database/
├── lib/
│   ├── client.js          # Supabase client
│   ├── admin.js           # Admin client
│   └── auth.js            # Auth helpers
└── middleware/
    └── auth-middleware.js  # Route protection

apps/platform/src/
├── app/
│   ├── auth/
│   │   ├── login/page.js
│   │   ├── signup/page.js
│   │   ├── reset-password/page.js
│   │   └── callback/route.js
│   └── (protected)/       # Protected routes
│       └── dashboard/page.js
└── lib/
    └── supabase.js        # Client utilities
```

#### Day 5: Testing & Documentation

**Deliverables**:
- Test authentication flows
- Document database schema
- Create migration scripts
- Setup database backups

---

### Week 2: Component Library

#### Day 1-3: Core UI Components

**Deliverables**:
Implement all components from the design system:

1. **Form Components**:
   - Button (primary, secondary, outline variants)
   - Input (text, email, password, number)
   - TextArea
   - Select dropdown
   - Checkbox
   - Radio buttons
   - File upload with drag-drop

2. **Layout Components**:
   - Card
   - Modal
   - Sidebar
   - Navigation
   - Footer
   - Container/Grid

3. **Feedback Components**:
   - Alert (success, error, warning, info)
   - Toast notifications
   - Loading spinner
   - Progress bar
   - Skeleton loaders

4. **Data Display**:
   - Table (sortable, filterable)
   - Badge
   - Avatar
   - Tabs
   - Accordion

**Component Structure**:
```javascript
// Example: Button component
/**
 * Component: Button
 * Purpose: Reusable button with multiple variants
 * Props: variant, size, disabled, loading, onClick, children
 * Used in: Throughout the platform
 */

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children
}) {
  // Implementation with vanilla CSS
  return (
    <button
      className={`button button--${variant} button--${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

#### Day 4-5: Testing & Storybook

**Deliverables**:
- Component unit tests
- Visual regression tests
- Component documentation
- Accessibility testing (WCAG 2.1 AA)

---

## Phase 3: Platform Features (4 weeks)

### Week 3: RFQ Creation Module

**Deliverables**:
- Multi-step form wizard
- Dynamic question rendering from CSV templates
- Auto-save functionality
- Progress tracking
- Guidance system with Claude API
- PDF generation
- Draft management

**Key Features**:
1. **Product Selection**: Choose insurance product type
2. **Dynamic Forms**: Load questions from database
3. **Smart Guidance**: AI-powered help text for each field
4. **Validation**: Real-time validation with helpful errors
5. **Auto-save**: Periodic saves to prevent data loss
6. **Preview**: Show completed RFQ before submission
7. **PDF Export**: Generate professional RFQ document

**Files Structure**:
```
apps/platform/src/app/rfq/
├── create/
│   ├── page.js                    # Main creation page
│   ├── [step]/page.js             # Dynamic step routing
│   └── components/
│       ├── StepNavigator.js
│       ├── ProgressBar.js
│       ├── QuestionRenderer.js
│       ├── GuidancePanel.js
│       └── AutoSaveIndicator.js
└── api/
    ├── create/route.js
    ├── save-draft/route.js
    └── generate-pdf/route.js
```

---

### Week 4: Bid Distribution Module

**Deliverables**:
- Email validation and import (CSV/manual)
- Sanctuari network interface with filters
- Partner selection (insurers/brokers)
- Unique submission link generation
- Bulk email sending via Brevo
- Delivery tracking

**Key Features**:
1. **Network Browse**: Search and filter insurers/brokers
2. **Custom Selection**: Add external partners via email
3. **Link Generation**: Unique secure links per recipient
4. **Email Templates**: Professional invitation emails
5. **Tracking**: Monitor email delivery and opens
6. **Reminders**: Automated reminder system

---

### Week 5: Bid Submission Portal

**Deliverables**:
- Public bid submission interface (no login required)
- File upload with UploadThing
- Document parsing with Llama Parse
- Data extraction and preview
- Policy wording analysis
- Thank you page with tracking

**Key Features**:
1. **Secure Access**: Unique link validation
2. **File Upload**: Drag-drop with progress
3. **Document Processing**: Auto-extract quote details
4. **Preview & Edit**: Review extracted data
5. **Additional Info**: Optional comments/notes
6. **Confirmation**: Email confirmation to bidder

---

### Week 6: Bid Centre

**Deliverables**:
- Dashboard with all received quotes
- Card-based quote display
- AI-powered comparison
- Multi-agent analysis system
- Communication hub
- Export functionality

**Key Features**:
1. **Quote Cards**: Visual display with key info
2. **Comparison Mode**: Side-by-side comparison
3. **AI Analysis**: Coverage, pricing, terms analysis
4. **Red Flags**: Highlight potential issues
5. **Recommendations**: AI-powered suggestions
6. **Messaging**: Direct communication with bidders
7. **Export**: PDF/Excel export of comparison

**AI Multi-Agent System**:
```javascript
// Orchestrator coordinates sub-agents
const analysisAgents = {
  coverageAgent: analyzeCoverage(quotes),
  pricingAgent: analyzePricing(quotes),
  termsAgent: analyzeTerms(quotes),
  complianceAgent: checkCompliance(quotes)
};

// Combine results
const finalAnalysis = orchestrator.synthesize(analysisAgents);
```

---

### Week 7: Payment Integration

**Deliverables**:
- Razorpay integration
- Pricing logic (free first bid)
- Payment flow
- Invoice generation
- Subscription management
- Webhook handling

**Payment Tiers**:
- First RFQ per month: Free
- Additional RFQs: ₹499 each
- Subscription options (future)

---

## Phase 4: Admin Panel (2 weeks)

### Week 8: Configuration Interfaces

**Deliverables**:
1. **RFQ Template Builder**
   - Drag-drop form builder
   - Field type selection
   - Validation rules
   - Conditional logic

2. **Network Management**
   - Add/edit insurers and brokers
   - Upload photos and logos
   - Manage specializations
   - Email configuration

3. **Email Template System**
   - Template CRUD
   - Variable insertion
   - Preview functionality
   - A/B testing

---

### Week 9: Analytics & Audit

**Deliverables**:
1. **Analytics Dashboard**
   - RFQ metrics
   - Bid statistics
   - User activity
   - Revenue tracking
   - Custom reports

2. **Audit Logs**
   - User activity tracking
   - Document history
   - Communication logs
   - Export capabilities

---

## Phase 5: AI Integration & Optimization (2 weeks)

### Week 10: AI Implementation

**Deliverables**:
- Claude Opus orchestrator
- Claude Sonnet sub-agents
- Batch processing system
- Response caching
- Cost optimization
- Error handling

**Key Implementations**:
1. **RFQ Guidance**: Contextual help during creation
2. **Document Extraction**: Parse bid documents
3. **Quote Analysis**: Multi-agent comparison
4. **Policy Review**: Analyze policy wordings
5. **Recommendations**: Generate insights

---

### Week 11: Performance Optimization

**Deliverables**:
- Code splitting
- Image optimization
- Lazy loading
- Caching strategies
- Database query optimization
- API rate limiting
- Bundle size reduction

**Performance Targets**:
- Lighthouse score: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s

---

## Phase 6: Testing & Launch (1 week)

### Week 12: Final Testing & Deployment

**Day 1-3: Comprehensive Testing**
- End-to-end user flows
- Cross-browser testing
- Mobile responsiveness
- Accessibility audit
- Security testing
- Load testing

**Day 4-5: Production Deployment**
- Final Vercel deployment
- DNS configuration
- SSL verification
- Production data migration
- Monitoring setup
- Launch checklist completion

---

## Development Best Practices

### Code Quality
1. **Consistent Naming**: Clear, descriptive names
2. **Comments**: Document complex logic
3. **Error Handling**: Graceful error recovery
4. **Validation**: Input validation on client and server
5. **Security**: SQL injection, XSS prevention
6. **Testing**: Unit and integration tests

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/rfq-creation
# Make changes
git add .
git commit -m "feat: implement RFQ creation wizard"
git push origin feature/rfq-creation
# Create pull request
```

### Commit Message Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

---

## Resource Requirements

### Team (if scaling)
- 1 Full-stack Developer (Primary)
- 1 UI/UX Designer (Consultant)
- 1 QA Tester (Part-time)

### Third-party Services
- Supabase: $25/month (Pro plan)
- Vercel: $20/month per project
- UploadThing: $10/month
- Llama Parse: Pay per use (~$50/month)
- Claude API: Pay per use (~$200-500/month)
- Razorpay: Transaction fees
- Brevo: Free tier (300 emails/day)

**Estimated Monthly Cost**: $350-600

---

## Risk Management

### Technical Risks
1. **API Rate Limits**: Implement caching and batch processing
2. **Database Scale**: Monitor and optimize queries
3. **File Storage**: Set upload limits, clean old files
4. **AI Costs**: Monitor usage, implement cost controls

### Mitigation Strategies
- Comprehensive testing at each phase
- Regular backups
- Error monitoring (Sentry)
- Performance monitoring
- Cost alerts on APIs

---

## Success Metrics

### Phase 2 Success Criteria
- ✅ Authentication works flawlessly
- ✅ Database schema supports all features
- ✅ Component library is complete and tested

### Phase 3 Success Criteria
- ✅ User can create complete RFQ
- ✅ Bids are successfully distributed
- ✅ Quotes are received and parsed
- ✅ AI analysis provides value

### Phase 4 Success Criteria
- ✅ Admin can manage all configurations
- ✅ Analytics provide actionable insights

### Phase 5 Success Criteria
- ✅ AI responses are accurate and fast
- ✅ Performance targets are met

### Phase 6 Success Criteria
- ✅ Platform is live and stable
- ✅ First users successfully complete flows

---

## Next Immediate Steps

1. **Commit current changes** to GitHub:
   ```bash
   git add .
   git commit -m "fix: add packageManager field, configure deployment, secure env vars"
   git push origin main
   ```

2. **Deploy to Vercel** following VERCEL_DEPLOYMENT.md

3. **Verify deployment** using DEPLOYMENT_CHECKLIST.md

4. **Begin Phase 2** - Database schema creation

---

## Questions for Stakeholder

Before proceeding with Phase 2:

1. **Priority Features**: Are there any features to prioritize or defer?
2. **Timeline**: Is the 11-12 week timeline acceptable?
3. **Budget**: Is the estimated monthly cost within budget?
4. **Resources**: Will additional team members be needed?
5. **Launch Date**: Is there a specific launch deadline?

---

**Last Updated**: October 1, 2025
**Version**: 1.0
**Status**: Ready for Phase 2
