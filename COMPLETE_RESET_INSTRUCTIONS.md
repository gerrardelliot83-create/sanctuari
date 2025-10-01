# Complete Database Reset - Instructions

**Date:** October 2, 2025
**Purpose:** Clean slate reload of all insurance products and questions
**Impact:** Deletes all test RFQs and reloads 45 products with correct naming

---

## 🎯 What This Does

1. ✅ Deletes ALL products (45 products)
2. ✅ Deletes ALL questions (~1,500 questions)
3. ✅ Deletes ALL test RFQs (10 RFQs) and their responses
4. ✅ Reloads 45 products from JSON files (using correct names from JSON)
5. ✅ Reloads all questions for each product
6. ✅ Re-enables database constraints

**Result:** Fresh database with all products matching JSON file names exactly.

---

## 📋 Step-by-Step Instructions

### Step 1: Run Migration 012 in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of:
   ```
   /packages/database/migrations/012_reset_products_and_questions.sql
   ```
3. Click **Run**
4. You should see notices like:
   ```
   Preserved X RFQ mappings for restoration
   Disabled foreign key constraint on rfqs.product_id
   Deleted all RFQ questions
   Deleted all insurance products

   ========================================
   Migration 012 Complete!
   ========================================

   NEXT STEP (REQUIRED):
   Run the reload script...
   ```

### Step 2: Run the Reload Script

Open terminal and run:

```bash
cd /mnt/c/Users/DELL/Desktop/sanctuari
node scripts/reload-all-products.js --clean
```

The `--clean` flag will:
- Delete all existing test RFQs
- Delete all RFQ responses
- Start completely fresh

You should see output like:

```
=== Reloading All Products and Questions ===

Found 45 JSON files to process

Step 1: Checking for existing user RFQs...
  Found 10 existing RFQs

  🗑️  --clean flag detected: Deleting all existing RFQs...
  ✓ Deleted all 10 RFQs and their responses

Step 2: Loading products and questions from JSON files...

Processing: baggage_insurance_json.json
  ✓ Created product: Baggage Insurance
    Product ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ✓ Inserted 18 questions

Processing: boiler_pressure_plant_json.json
  ✓ Created product: Boiler and Pressure Plant Insurance
    Product ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ✓ Inserted 30 questions

...

✓ Loaded 45 products with ~1,500 total questions

Step 3: No RFQs to update (clean start)

Step 4: Re-enabling foreign key constraint...
```

### Step 3: Re-enable Foreign Key Constraint

Copy and paste this in Supabase SQL Editor:

```sql
ALTER TABLE rfqs
ADD CONSTRAINT rfqs_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES insurance_products(id);
```

Click **Run**.

### Step 4: Verify Everything Works

Run the diagnostic script:

```bash
node scripts/diagnose-product-issues.js
```

Expected output:

```
📊 SUMMARY
================================================================================
Products with questions: 45
Products without questions: 0
Products with RFQs: 0
❌ PROBLEMATIC (RFQs but no questions): 0

✅ PRODUCTS WITH QUESTIONS
================================================================================
[All 45 products listed with question counts]

✓ Diagnosis complete!
```

### Step 5: Test RFQ Creation

1. Start the dev server: `npm run dev` (if not already running)
2. Go to: `http://localhost:3000/rfq/create`
3. Select any product (e.g., "Contractors All Risk Insurance")
4. Verify:
   - ✅ Questions load correctly
   - ✅ All sections appear
   - ✅ Can navigate between sections
   - ✅ No "No questions configured" error

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify:

### Check all products have questions

```sql
SELECT
  p.name,
  p.category,
  COUNT(q.id) as question_count
FROM insurance_products p
LEFT JOIN rfq_questions q ON q.product_id = p.id
GROUP BY p.id, p.name, p.category
ORDER BY question_count ASC, p.name;
```

**Expected:** All products should have `question_count > 0`

### Count total products and questions

```sql
SELECT
  (SELECT COUNT(*) FROM insurance_products) as total_products,
  (SELECT COUNT(*) FROM rfq_questions) as total_questions,
  (SELECT COUNT(*) FROM rfqs) as total_rfqs;
```

**Expected:**
- `total_products`: 45
- `total_questions`: ~1,500
- `total_rfqs`: 0 (after clean start)

---

## 🆘 Troubleshooting

### Script fails with "Directory not found"

Make sure you're running from the project root:
```bash
cd /mnt/c/Users/DELL/Desktop/sanctuari
pwd  # Should show: /mnt/c/Users/DELL/Desktop/sanctuari
```

### Script fails with "Error creating product: duplicate key"

This means products already exist. Either:
1. Migration 012 wasn't run correctly
2. Script was run twice

Solution: Re-run migration 012, then run the script again.

### Foreign key constraint error

If you see: `violates foreign key constraint "rfqs_product_id_fkey"`

This means the constraint wasn't dropped. Run in Supabase:
```sql
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_product_id_fkey;
```

Then re-run the script.

### Some products still missing questions

Check if JSON files are present:
```bash
ls -la /mnt/c/Users/DELL/Desktop/sanctuari/Resources/processed-rfq-questions/ | wc -l
```

Should show 46 lines (45 files + header).

---

## 📁 What Gets Pushed to GitHub

After completing the reset, push these files:

```bash
git add packages/database/migrations/012_reset_products_and_questions.sql
git add scripts/reload-all-products.js
git add scripts/diagnose-product-issues.js
git add PRODUCT_MISMATCH_FIX.md
git add COMPLETE_RESET_INSTRUCTIONS.md
git commit -m "Fix: Complete database reset for product/question mismatch

- Add migration 012 to reset all products and questions
- Add reload script to load from JSON with correct product names
- Add diagnostic script to verify database state
- Fixes 'No questions configured' error in RFQ wizard
- All 45 products now load with correct question mappings"

git push origin main
```

---

## ✅ Success Criteria

After completing all steps, you should have:

- ✅ 45 insurance products in database
- ✅ ~1,500 questions loaded across all products
- ✅ Every product has questions (no products with 0 questions)
- ✅ No test RFQs in database (clean slate)
- ✅ RFQ creation works for all products
- ✅ No "No questions configured" errors

---

**Last Updated:** October 2, 2025
**Estimated Time:** 5-10 minutes
**Risk Level:** LOW (test environment, no production data)
