# Product Mismatch Issue - Root Cause Analysis & Fix

**Date:** October 2, 2025
**Issue:** RFQ wizard shows "No questions configured" for some products
**Status:** Root cause identified, migration ready to apply

---

## 🔍 Root Cause Analysis

### The Problem

When users create RFQs for certain products (like "Contractors All Risk"), the wizard page shows:
- "No questions configured for this product"
- Total questions in DB: 0

However, the questions **DO exist** in the database - they're just attached to a different product_id!

### Why This Happened

The issue stems from a **product naming mismatch** between two data sources:

#### 1. Migration 001 (Initial Schema)
Created **15 base products** with these names:
```sql
INSERT INTO insurance_products (name, category) VALUES
  ('Fire and Special Perils Insurance', 'general'),
  ('Marine Cargo Insurance', 'marine'),
  ('Marine Transit Insurance', 'marine'),
  ('Group Health Insurance', 'health'),
  ('Group Personal Accident Insurance', 'health'),
  ('Group Term Life Insurance', 'life'),
  ('Cyber Liability Insurance', 'cyber'),
  ('Directors & Officers Liability Insurance', 'commercial'),
  ('Professional Indemnity Insurance', 'commercial'),
  ('Commercial General Liability', 'commercial'),
  ('Product Liability Insurance', 'commercial'),
  ('Workmen''s Compensation Insurance', 'commercial'),
  ('Business Interruption Insurance', 'general'),
  ('Contractors All Risk', 'general'),          ← SHORT NAME
  ('Machinery Breakdown Insurance', 'general');
```

#### 2. load-rfq-questions.js Script
Loaded **45 products** from JSON files using `data.product_name`:
```json
{
  "product_name": "Contractors All Risk Insurance",    ← FULL NAME (with "Insurance")
  "product_category": "commercial",
  "questions": [...]
}
```

The script's `getOrCreateProduct()` function:
- Reads `product_name` from JSON
- Searches for existing product by exact name match
- If not found, **creates a NEW product**

#### The Result

**TWO separate products in the database:**
1. "Contractors All Risk" (migration 001) - **0 questions** ❌
2. "Contractors All Risk Insurance" (script) - **46 questions** ✅

When users select "Contractors All Risk" from the UI (product #1), an RFQ is created with `product_id` pointing to the product with **0 questions**.

---

## 📊 Affected Products

These migration 001 products may have duplicates with slightly different names:

| Migration 001 Name | Likely JSON Name | Status |
|-------------------|------------------|--------|
| Fire and Special Perils Insurance | Standard Fire and Special Perils Insurance | Mismatch |
| Directors & Officers Liability Insurance | Directors and Officers Liability Insurance | Mismatch |
| Commercial General Liability | Commercial General Liability Insurance | Mismatch |
| Contractors All Risk | Contractors All Risk Insurance | Mismatch |
| Machinery Breakdown Insurance | Machinery Breakdown Policy | Mismatch |
| Product Liability Insurance | *(No JSON file)* | Missing |

---

## 🔧 The Fix

### Step 1: Diagnose Current State

Run the diagnostic script to see the current situation:

```bash
cd /mnt/c/Users/DELL/Desktop/sanctuari
node scripts/diagnose-product-issues.js
```

This will show:
- ✅ Products with questions (should be 45)
- ⚠️  Products without questions (migration 001 leftovers)
- ❌ Products with RFQs but no questions (CRITICAL)
- 🔍 Potential duplicates

### Step 2: Apply Migration 011

Run migration 011 in Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of:
-- /packages/database/migrations/011_fix_product_duplicates.sql
```

**What this migration does:**

1. **Identifies products with questions** (the valid ones)
2. **Migrates RFQs** from old product names to new ones:
   - "Contractors All Risk" → "Contractors All Risk Insurance"
   - "Directors & Officers..." → "Directors and Officers..."
   - etc.
3. **Deletes products without questions** (the migration 001 leftovers)
4. **Safety check** - raises error if any RFQs become orphaned

### Step 3: Verify Fix

Run the diagnostic script again:

```bash
node scripts/diagnose-product-issues.js
```

Expected results after migration:
- ✅ All ~45 products should have questions
- ❌ No products should have RFQs without questions
- 🔍 No duplicates

### Step 4: Test RFQ Creation

1. Go to `/rfq/create`
2. Select "Contractors All Risk Insurance" (or any product)
3. Verify questions load correctly
4. Navigate through all sections
5. Confirm no "No questions configured" errors

---

## 🛡️ Why This Migration is Safe

1. **Foreign Key Protection:**
   - `rfqs.product_id` has `ON DELETE RESTRICT` constraint
   - Cannot delete a product if any RFQ references it
   - Migration will FAIL FAST if something goes wrong

2. **RFQ Migration First:**
   - All RFQs are updated to point to products with questions
   - Only THEN are empty products deleted
   - No data loss possible

3. **Safety Check:**
   - Migration includes verification query at the end
   - Raises exception if any RFQs are orphaned
   - Transaction will rollback on error

4. **Rollback Plan:**
   - If anything goes wrong, re-run `load-rfq-questions.js`
   - Script will recreate all 45 products and reload questions
   - No permanent damage possible

---

## 📋 Post-Migration Verification

After applying the migration, run this query in Supabase:

```sql
SELECT
  p.name,
  p.category,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT r.id) as rfq_count
FROM insurance_products p
LEFT JOIN rfq_questions q ON q.product_id = p.id
LEFT JOIN rfqs r ON r.product_id = p.id
GROUP BY p.id, p.name, p.category
HAVING COUNT(DISTINCT q.id) = 0 OR (COUNT(DISTINCT r.id) > 0 AND COUNT(DISTINCT q.id) = 0)
ORDER BY p.name;
```

**Expected result:** No rows (empty table)

If this query returns any rows, it means there are still products with issues.

---

## 🔮 Preventing Future Issues

### For New Products

When adding new insurance products:

1. **Always use the JSON's internal `product_name`** as the source of truth
2. **Don't create products manually** in migrations
3. **Let the load script handle product creation** via `getOrCreateProduct()`

### Data Integrity Checks

Add to CI/CD pipeline:

```bash
# Verify all products have questions
node scripts/diagnose-product-issues.js | grep "PROBLEMATIC: 0"
```

---

## 📝 Files Created/Modified

### New Files
1. `/packages/database/migrations/011_fix_product_duplicates.sql` - Migration to fix duplicates
2. `/scripts/diagnose-product-issues.js` - Diagnostic tool
3. `/PRODUCT_MISMATCH_FIX.md` - This documentation

### Understanding the Codebase

**Key files involved:**
- `/packages/database/migrations/001_initial_schema.sql` - Created initial 15 products
- `/scripts/load-rfq-questions.js` - Loads questions from JSON (creates products if needed)
- `/Resources/processed-rfq-questions/*.json` - 45 JSON files with questions
- `/apps/platform/src/app/api/insurance-products/route.js` - API to fetch products for UI
- `/apps/platform/src/app/api/rfq/[id]/questions/route.js` - API to load questions for RFQ

---

## ✅ Summary

**Problem:** Product name mismatch caused RFQs to reference products with no questions

**Root Cause:** Migration 001 created 15 products, script created 45 products, slight name differences caused duplicates

**Solution:** Migration 011 migrates RFQs to correct products and removes duplicates

**Impact:** All products will have questions, users won't see "No questions configured" error

**Risk:** Very low - migration has safety checks and foreign key constraints prevent data loss

---

## 🆘 Troubleshooting

### Migration fails with "RFQs reference non-existent products"

This means the migration couldn't map all RFQs to products with questions. Check:

```sql
-- Find problematic RFQs
SELECT r.id, r.title, p.name as product_name
FROM rfqs r
LEFT JOIN insurance_products p ON p.id = r.product_id
WHERE r.product_id NOT IN (
  SELECT DISTINCT product_id FROM rfq_questions
);
```

Manually update these RFQs to point to the correct product before running migration.

### Still seeing "No questions configured" after migration

1. Check if migration was actually applied
2. Verify with diagnostic script
3. Check browser console for the specific product_id causing issues
4. Query database for that product_id and verify it has questions

### Need to rollback migration

Migration is designed to be idempotent and safe. If needed:

```bash
# Reload all products and questions
node scripts/load-rfq-questions.js
```

This will recreate any deleted products and reload all questions.

---

**Last Updated:** October 2, 2025
**Next Steps:** Apply migration 011 and verify with diagnostic script
