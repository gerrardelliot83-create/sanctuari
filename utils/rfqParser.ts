import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
import { ProductType } from '@/lib/supabase/types'

export interface RFQField {
  section: string
  questionNumber: string
  question: string
  responseField: string
  notes?: string
  instructions?: string
  fieldType?: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox' | 'email' | 'phone' | 'url' | 'file' | 'address' | 'gst' | 'pan' | 'pincode'
  required?: boolean
  options?: string[]
  validation?: {
    pattern?: string
    min?: number | string
    max?: number | string
    minLength?: number
    maxLength?: number
  }
  placeholder?: string
  helperText?: string
}

export interface RFQTemplate {
  productType: ProductType
  name: string
  description?: string
  fields: RFQField[]
  sections: string[]
  guidanceContent?: {
    [fieldId: string]: {
      title?: string
      content: string
      mediaUrl?: string
      mediaType?: 'image' | 'video'
    }
  }
}

// Map CSV filenames to product types
const productTypeMap: { [key: string]: ProductType } = {
  'Fire_Loss_of_Profit_Insurance_RFQ': 'business_interruption',
  'Burglary_Insurance_RFQ': 'burglary',
  'Business_Interruption_Insurance_RFQ': 'business_interruption',
  'Contractors_All_Risk_RFQ': 'contractors_all_risk',
  'Cyber_Liability_Insurance_RFQ': 'cyber_liability',
  'Directors_Officers_Liability_Insurance_RFQ': 'directors_officers',
  'Erection_All_Risk_Insurance_RFQ': 'erection_all_risk',
  'Group_Health_Insurance_RFQ': 'group_health',
  'Group_Personal_Accident_Insurance_RFQ': 'group_personal_accident',
  'Group_Term_Life_Insurance_RFQ': 'group_term_life',
  'Marine_Cargo_Open_Cover_Insurance_RFQ': 'marine_cargo',
  'Product_Liability_Insurance_RFQ': 'product_liability',
  'Professional_Indemnity_IT_Insurance_RFQ': 'professional_indemnity',
  'Professional_Indemnity_RFQ': 'professional_indemnity',
  'Public_Liability_Industrial_Insurance_RFQ': 'public_liability',
  'Public_Liability_Non_Industrial_Insurance_RFQ': 'public_liability',
  'Standard_Fire_Special_Perils_Insurance_RFQ': 'fire_special_perils',
  'Workmen_s_Compensation_Insurance_RFQ': 'workmen_compensation',
}

// Enhanced field type determination with comprehensive pattern matching
function determineFieldType(responseField: string, question: string, notes: string = ''): RFQField['fieldType'] {
  const field = responseField.toLowerCase()
  const q = question.toLowerCase()
  const n = notes.toLowerCase()

  // Check for boolean fields
  if (field.includes('[yes/no]') || field.includes('yes/no') ||
      q.includes('do you') || q.includes('does') || q.includes('is there') ||
      q.includes('are you') || q.includes('have you') || q.includes('will you')) {
    return 'checkbox'
  }

  // Check for date fields
  if (field.includes('[enter date]') || field.includes('dd/mm/yyyy') ||
      field.includes('date') || q.includes('date') || q.includes('period') ||
      q.includes('when') || q.includes('expiry') || q.includes('renewal') ||
      q.includes('validity') || field.includes('from to')) {
    return 'date'
  }

  // Check for numeric fields
  if (field.includes('[enter number]') || field.includes('[enter amount]') ||
      field.includes('[enter %]') || field.includes('enter percentage') ||
      q.includes('number of') || q.includes('count') || q.includes('how many') ||
      q.includes('amount') || q.includes('sum insured') || q.includes('premium') ||
      q.includes('value') || q.includes('rate') || q.includes('percentage') ||
      q.includes('age') || q.includes('years') || q.includes('days') ||
      q.includes('months') || q.includes('hours') || q.includes('employees') ||
      q.includes('turnover') || q.includes('revenue') || q.includes('salary')) {
    return 'number'
  }

  // Check for select/dropdown fields
  if (field.includes('[select') || field.includes('[choose') ||
      field.includes('choose from') || n.includes('e.g.,') ||
      n.includes('such as') || n.includes('options:') ||
      q.includes('type of') || q.includes('kind of') || q.includes('category')) {
    return 'select'
  }

  // Check for email fields
  if (q.includes('email') || q.includes('e-mail') || field.includes('@')) {
    return 'email'
  }

  // Check for phone fields
  if (q.includes('phone') || q.includes('mobile') || q.includes('contact number') ||
      q.includes('telephone') || q.includes('whatsapp')) {
    return 'phone'
  }

  // Check for URL fields
  if (q.includes('website') || q.includes('url') || q.includes('link') ||
      field.includes('http') || field.includes('www')) {
    return 'url'
  }

  // Check for file upload fields
  if (q.includes('upload') || q.includes('attach') || q.includes('document') ||
      q.includes('certificate') || q.includes('proof')) {
    return 'file'
  }

  // Check for textarea/long text fields
  if (field.includes('[enter description]') || field.includes('[enter details]') ||
      field.includes('[explain') || field.includes('[describe') ||
      q.includes('describe') || q.includes('explain') || q.includes('details') ||
      q.includes('elaborate') || q.includes('summary') || q.includes('history') ||
      q.includes('experience') || q.includes('additional information') ||
      q.includes('remarks') || q.includes('comments')) {
    return 'textarea'
  }

  // Check for address fields
  if (q.includes('address') || q.includes('location') || q.includes('premises')) {
    return 'address'
  }

  // Check for GST fields
  if (q.includes('gst') || q.includes('gstin')) {
    return 'gst'
  }

  // Check for PAN fields
  if (q.includes('pan') && !q.includes('company')) {
    return 'pan'
  }

  // Check for pincode fields
  if (q.includes('pincode') || q.includes('pin code') || q.includes('postal code')) {
    return 'pincode'
  }

  // Default to text for everything else
  return 'text'
}

// Extract and parse options from response field and notes
function extractOptions(responseField: string, notes: string = ''): string[] | undefined {
  let options: string[] = []

  // Check response field for options
  const fieldMatch = responseField.match(/\[(.*?)\]/)
  if (fieldMatch) {
    const content = fieldMatch[1]
    if (content.includes('Select') || content.includes('Choose')) {
      const fieldOptions = content.split(',')
        .map(opt => opt.trim())
        .filter(opt => opt && !opt.includes('Select') && !opt.includes('Choose'))
      options.push(...fieldOptions)
    }
  }

  // Check notes for e.g., patterns
  const egMatch = notes.match(/e\.g\.,?\s*([^.]+)/i)
  if (egMatch) {
    const examples = egMatch[1].split(',')
      .map(ex => ex.trim())
      .filter(ex => ex.length > 0 && ex.length < 50) // Filter out long descriptions
    options.push(...examples)
  }

  // Check for common insurance-specific options
  const field = responseField.toLowerCase()
  const q = notes.toLowerCase() + ' ' + responseField.toLowerCase()

  if (q.includes('occupancy') || q.includes('type of building')) {
    options = ['Factory', 'Warehouse', 'Office', 'Retail', 'Residential', 'Mixed Use', 'Industrial']
  } else if (q.includes('construction type')) {
    options = ['RCC', 'Brick', 'Steel', 'Wood', 'Mixed']
  } else if (q.includes('policy type')) {
    options = ['New', 'Renewal', 'Portability']
  } else if (q.includes('claim status')) {
    options = ['No Claims', 'Claims Made', 'Claims Pending']
  }

  return options.length > 0 ? [...new Set(options)] : undefined // Remove duplicates
}

// Determine if a field should be required based on question context
function determineIfRequired(question: string, responseField: string): boolean {
  const q = question.toLowerCase()
  const field = responseField.toLowerCase()

  // Optional fields typically have these patterns
  if (q.includes('optional') || q.includes('if any') || q.includes('if applicable') ||
      q.includes('additional') || field.includes('optional') || field.includes('n/a')) {
    return false
  }

  // Critical fields that should always be required
  if (q.includes('name') || q.includes('address') || q.includes('contact') ||
      q.includes('sum insured') || q.includes('premium') || q.includes('policy period')) {
    return true
  }

  // Default to required for most fields
  return true
}

// Generate contextual placeholder text
function generatePlaceholder(fieldType: string | undefined, question: string, responseField: string): string {
  const q = question.toLowerCase()

  // Field type specific placeholders
  switch (fieldType) {
    case 'email':
      return 'email@company.com'
    case 'phone':
      return '+91 98765 43210'
    case 'gst':
      return '22AAAAA0000A1Z5'
    case 'pan':
      return 'AAAAA0000A'
    case 'pincode':
      return '400001'
    case 'date':
      return 'DD/MM/YYYY'
    case 'url':
      return 'https://www.example.com'
    case 'address':
      return 'Building, Street, Area, City, State'
    case 'number':
      if (q.includes('percentage')) return '0-100'
      if (q.includes('amount')) return 'Enter amount in ₹'
      if (q.includes('count') || q.includes('number of')) return 'Enter number'
      return 'Enter value'
    case 'textarea':
      return 'Provide detailed information...'
    case 'select':
      return 'Select an option'
    default:
      // Try to extract placeholder from response field
      const match = responseField.match(/\[([^\]]+)\]/)
      if (match && match[1] !== 'Enter' && !match[1].includes('Enter')) {
        return match[1]
      }
      return 'Enter ' + question.toLowerCase().replace(/[?:]/g, '')
  }
}

// Generate helper text for better UX
function generateHelperText(fieldType: string | undefined, instructions: string, notes: string): string {
  // If instructions are provided, use them
  if (instructions && instructions.length > 0) {
    return instructions
  }

  // If notes provide examples, extract them
  if (notes) {
    const egMatch = notes.match(/e\.g\.,?\s*(.+)/i)
    if (egMatch) {
      return `Example: ${egMatch[1]}`
    }
  }

  // Field type specific helper text
  switch (fieldType) {
    case 'gst':
      return 'Enter 15-digit GST identification number'
    case 'pan':
      return 'Enter 10-character PAN number'
    case 'phone':
      return 'Enter 10-digit mobile number'
    case 'email':
      return 'Enter valid email address'
    case 'date':
      return 'Select date from calendar'
    case 'file':
      return 'Upload PDF, JPG, or PNG files (Max 10MB)'
    case 'address':
      return 'Enter complete address with pincode'
    default:
      return ''
  }
}

// Generate intelligent validation rules based on field type and context
function generateValidation(
  fieldType: RFQField['fieldType'],
  question: string,
  responseField: string
): RFQField['validation'] {
  const q = question.toLowerCase()
  const field = responseField.toLowerCase()

  switch (fieldType) {
    case 'number':
      let validation: any = { min: 0 }

      // Percentage validations
      if (q.includes('percentage') || field.includes('%')) {
        validation = { min: 0, max: 100 }
      }
      // Age validations
      else if (q.includes('age')) {
        validation = { min: 18, max: 100 }
      }
      // Employee count
      else if (q.includes('employee') || q.includes('staff')) {
        validation = { min: 1, max: 100000 }
      }
      // Years
      else if (q.includes('years')) {
        validation = { min: 0, max: 100 }
      }
      // Days
      else if (q.includes('days')) {
        validation = { min: 1, max: 365 }
      }
      // Amount validations (no upper limit for sums/premiums)
      else if (q.includes('amount') || q.includes('sum') || q.includes('premium')) {
        validation = { min: 0 }
      }

      return validation

    case 'text':
      // Company names, person names
      if (q.includes('name')) {
        return { minLength: 2, maxLength: 100, pattern: '^[a-zA-Z0-9\\s\\.\\-&,]+$' }
      }
      // General text
      return { maxLength: 255 }

    case 'textarea':
      return { maxLength: 2000 }

    case 'email':
      return {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        maxLength: 100
      }

    case 'phone':
      return {
        pattern: '^(\\+91)?[6-9]\\d{9}$', // Indian phone numbers
        minLength: 10,
        maxLength: 13
      }

    case 'gst':
      return {
        pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
        minLength: 15,
        maxLength: 15
      }

    case 'pan':
      return {
        pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
        minLength: 10,
        maxLength: 10
      }

    case 'pincode':
      return {
        pattern: '^[1-9][0-9]{5}$',
        minLength: 6,
        maxLength: 6
      }

    case 'url':
      return {
        pattern: '^https?:\\/\\/.+',
        maxLength: 500
      }

    case 'date':
      // For policy dates, set reasonable bounds
      const today = new Date()
      const nextYear = new Date()
      nextYear.setFullYear(today.getFullYear() + 1)
      return {
        min: today.toISOString().split('T')[0],
        max: nextYear.toISOString().split('T')[0]
      }

    default:
      return undefined
  }
}

// Parse a single CSV file
export function parseRFQCsv(csvContent: string, filename: string): RFQTemplate {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  const data = result.data as any[]
  const fields: RFQField[] = []
  const sections = new Set<string>()

  data.forEach((row) => {
    if (row.Section && row.Question) {
      const section = row.Section.trim()
      sections.add(section)

      const fieldType = determineFieldType(
        row['Response Field'] || '',
        row.Question,
        row.Notes || ''
      )

      const field: RFQField = {
        section,
        questionNumber: row['Question Number']?.toString() || '',
        question: row.Question,
        responseField: row['Response Field'] || '',
        notes: row.Notes || undefined,
        instructions: row.Instructions || undefined,
        fieldType,
        required: determineIfRequired(row.Question, row['Response Field']),
        options: extractOptions(row['Response Field'] || '', row.Notes || ''),
        validation: generateValidation(fieldType, row.Question, row['Response Field'] || ''),
        placeholder: generatePlaceholder(fieldType, row.Question, row['Response Field'] || ''),
        helperText: generateHelperText(fieldType, row.Instructions || '', row.Notes || '')
      }

      fields.push(field)
    }
  })

  const baseName = filename.replace('.csv', '')
  const productType = productTypeMap[baseName] || 'other'

  return {
    productType,
    name: baseName.replace(/_/g, ' '),
    description: `Request for Quote template for ${baseName.replace(/_/g, ' ')}`,
    fields,
    sections: Array.from(sections),
    guidanceContent: generateDefaultGuidance(fields),
  }
}

// Generate default guidance content
function generateDefaultGuidance(fields: RFQField[]): RFQTemplate['guidanceContent'] {
  const guidance: RFQTemplate['guidanceContent'] = {}

  fields.forEach((field) => {
    const fieldId = `${field.section}-${field.questionNumber}`
    let content = field.instructions || ''

    if (field.notes) {
      content += content ? '\n\n' + field.notes : field.notes
    }

    if (!content) {
      content = `Please provide accurate information for: ${field.question}`
    }

    guidance[fieldId] = {
      title: field.question,
      content,
    }
  })

  return guidance
}

// Parse all RFQ CSV files in a directory
export async function parseAllRFQs(directory: string): Promise<RFQTemplate[]> {
  const templates: RFQTemplate[] = []
  const files = fs.readdirSync(directory)

  for (const file of files) {
    if (file.endsWith('.csv')) {
      const filePath = path.join(directory, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const template = parseRFQCsv(content, file)
      templates.push(template)
    }
  }

  return templates
}

// Convert template to database format
export function templateToDbFormat(template: RFQTemplate) {
  return {
    product_type: template.productType,
    name: template.name,
    description: template.description,
    fields: template.fields,
    guidance_content: template.guidanceContent,
    is_active: true,
    version: 1,
  }
}

// Get template by product type
export async function getTemplateByProductType(
  productType: ProductType,
  directory: string
): Promise<RFQTemplate | null> {
  const templates = await parseAllRFQs(directory)
  return templates.find(t => t.productType === productType) || null
}