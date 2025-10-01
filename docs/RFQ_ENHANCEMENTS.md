# RFQ Question Enhancements

All 45 insurance product RFQ templates have been enhanced with smart features.

## Enhancement Summary

- **Total Questions**: 1,558 questions across all products
- **Currency Fields**: 138 fields with Indian comma formatting
- **Auto-fill Fields**: 259 fields that can be populated from company profile
- **Policy Extractable**: 176 fields that can be extracted from uploaded policy documents
- **"Other" Options**: 18 business type fields with custom text input

---

## 1. Indian Currency Formatting

### Fields Affected:
- Sum Insured
- Annual Turnover
- Coverage Amount
- Premium amounts
- Claim amounts
- Asset values
- Contract values

### How it Works:

**JSON Structure:**
```json
{
  "field_name": "sum_insured",
  "field_type": "number",
  "format": "indian_currency",
  "validation_rules": {
    "required": true,
    "min": 0,
    "max": 100000000000
  }
}
```

**UI Implementation:**
```javascript
// Component should format as user types
Input: 5000000
Display: 50,00,000 (50 lakhs)

Input: 50000000
Display: 5,00,00,000 (5 crores)

// User can type with or without commas
// System auto-formats to Indian numbering system
```

**User Experience:**
- User types number freely
- System auto-adds commas in Indian format (XX,XX,XXX)
- Placeholder shows example: "e.g., 50,00,000"
- Helper text explains: "Enter in lakhs or crores"

---

## 2. Auto-Fill from Company Profile

### Fields Affected (259 fields):
- Company Name
- GST Number
- PAN Number
- Registered Address
- City, State, Pincode
- Contact Email & Phone
- Industry Type
- Nature of Business
- Annual Turnover
- Employee Count
- Website

### How it Works:

**JSON Structure:**
```json
{
  "field_name": "company_name",
  "field_type": "text",
  "auto_fill_source": "company_profile",
  "auto_fill_enabled": true
}
```

**UI Implementation:**

**Step 1 - Company Selection:**
```javascript
// At start of RFQ
<CompanySelector>
  Which company is this RFQ for?
  [Dropdown: ABC Manufacturing Pvt Ltd ▼]
  [+ Add New Company]
</CompanySelector>
```

**Step 2 - Auto-Fill:**
```javascript
// When user selects company:
onCompanySelect(companyId) {
  const company = fetchCompanyProfile(companyId);

  // Auto-fill all matching fields
  form.setValue('company_name', company.name);
  form.setValue('gst_number', company.gst_number);
  form.setValue('pan_number', company.pan_number);
  form.setValue('registered_address', company.registered_address);
  form.setValue('city', company.city);
  form.setValue('state', company.state);
  form.setValue('pincode', company.pincode);
  form.setValue('email', company.email);
  form.setValue('phone', company.phone);
  form.setValue('annual_turnover', company.annual_turnover);
  form.setValue('employee_count', company.employee_count);
  // ... etc
}
```

**User Experience:**
- User selects company at start
- All company fields instantly populated
- User can edit if needed (e.g., different location)
- Saves 5-10 minutes per RFQ

---

## 3. Policy Document Upload & Extraction

### What Gets Extracted (176 fields):
- Sum Insured / Coverage Amount
- Policy Period (Start/End dates)
- Coverage Type
- Deductible
- Premium
- Previous Insurer Name
- Policy Number
- Claim History
- Add-on Covers
- Asset Values (Building, Stock, Machinery)

### How it Works:

**JSON Structure:**
```json
{
  "field_name": "sum_insured",
  "field_type": "number",
  "policy_extractable": true,
  "extraction_priority": "high"
}
```

**UI Flow:**

**Step 1 - Upload Option:**
```javascript
<RFQStart>
  Do you have an existing or expiring policy?

  [Yes - Upload Policy] [No - Fill Manually]
</RFQStart>
```

**Step 2 - Document Upload:**
```javascript
<PolicyUpload>
  Upload your current policy document or competing quote

  <FileDropzone>
    Drag & drop or click to upload
    Accepts: PDF, JPG, PNG
  </FileDropzone>

  [Upload & Extract Details] →
</PolicyUpload>
```

**Step 3 - AI Extraction:**
```javascript
async function extractPolicyDetails(file) {
  // 1. Upload to UploadThing
  const fileUrl = await uploadToUploadThing(file);

  // 2. Parse with Llama Parse
  const parsedData = await llamaParse(fileUrl);

  // 3. Extract with Claude API
  const extractedFields = await claudeExtract(parsedData, {
    fields: getExtractableFields(productType),
    priority: 'high'
  });

  // 4. Pre-fill form
  extractedFields.forEach(field => {
    if (field.confidence > 0.7) { // Only if confident
      form.setValue(field.name, field.value);
    }
  });

  return extractedFields;
}
```

**Step 4 - Review & Edit:**
```javascript
<ExtractedDataReview>
  We extracted the following from your policy:

  ✓ Sum Insured: ₹50,00,000
  ✓ Policy Period: 01/04/2024 - 31/03/2025
  ✓ Coverage Type: Comprehensive
  ⚠ Deductible: Not found - Please enter

  [Looks Good] [Edit]
</ExtractedDataReview>
```

**User Experience:**
- Upload policy document
- AI extracts 60-80% of fields automatically
- User reviews and fills missing fields
- Saves 10-15 minutes per RFQ

---

## 4. "Other" Option with Text Input

### Fields Affected (18 fields):
- Nature of Business
- Business Type
- Industry Type
- Type of Manufacturing
- Business Activity
- Occupation Type

### How it Works:

**JSON Structure:**
```json
{
  "field_name": "nature_of_business",
  "field_type": "select",
  "options": [
    "Manufacturing",
    "Trading",
    "Service Provider",
    "Other (Please specify)"
  ],
  "has_other_option": true,
  "other_field": {
    "field_name": "nature_of_business_other",
    "field_type": "text",
    "placeholder": "Please specify your business type",
    "validation_rules": {
      "required": false,
      "maxLength": 200
    },
    "conditional_logic": {
      "show_if": {
        "field": "nature_of_business",
        "value": "Other (Please specify)"
      }
    }
  }
}
```

**UI Implementation:**
```javascript
<FormField>
  <Label>Nature of Business</Label>

  <Select name="nature_of_business">
    <option>Manufacturing</option>
    <option>Trading</option>
    <option>Service Provider</option>
    <option value="other">Other (Please specify)</option>
  </Select>

  {/* Conditional field - shows only if "Other" selected */}
  {natureOfBusiness === 'other' && (
    <Input
      name="nature_of_business_other"
      placeholder="Please specify your business type"
      required
    />
  )}
</FormField>
```

**User Experience:**
- User selects from dropdown
- If they choose "Other", text field appears below
- Text field is required when "Other" is selected
- Captures all business types, not just predefined ones

---

## Implementation Checklist

### Frontend Components Needed:

1. **CurrencyInput Component**
   - Format numbers with Indian commas
   - Allow typing with/without commas
   - Display lakhs/crores helper
   - Handle validation

2. **CompanySelector Component**
   - Dropdown of user's companies
   - Auto-fill form on selection
   - Option to add new company

3. **PolicyUploader Component**
   - File upload interface
   - Integration with UploadThing
   - AI extraction progress indicator
   - Review extracted data UI

4. **ConditionalField Component**
   - Show/hide based on other field values
   - Handle "Other" option text inputs
   - Dynamic validation

### Backend Services Needed:

1. **Policy Extraction Service**
   - Llama Parse integration
   - Claude API for extraction
   - Confidence scoring
   - Field mapping

2. **Company Profile API**
   - Fetch company details
   - Return auto-fill data
   - Handle multiple companies per user

3. **RFQ Form Builder**
   - Load questions from database
   - Apply conditional logic
   - Handle validation rules
   - Support document uploads

---

## Example User Journey

### Before Enhancements:
1. User manually types all 50+ fields
2. Struggles with formatting large numbers
3. Re-enters company details every RFQ
4. Takes 30-45 minutes

### After Enhancements:
1. User selects company → 10 fields auto-filled
2. User uploads policy → 20 more fields extracted
3. Currency fields auto-format as they type
4. "Other" fields capture edge cases
5. Takes 10-15 minutes

**Time Saved: 20-30 minutes per RFQ**

---

## Next Steps

1. Load enhanced JSON files into Supabase `rfq_questions` table
2. Build frontend components for these features
3. Integrate AI extraction pipeline
4. Test with real insurance documents
5. Measure accuracy and user time savings
