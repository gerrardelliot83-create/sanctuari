// Script to enhance RFQ fields with Claude API
// This script will batch process RFQ questions and get optimal field configurations

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { productCategories } from '../data/products'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface FieldEnhancement {
  fieldName: string
  question: string
  inputType: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'textarea' | 'email' | 'phone' | 'file'
  required: boolean
  placeholder?: string
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number | string
    max?: number | string
  }
  options?: string[]
  helperText: string
  guidanceTitle: string
  guidanceTips: string[]
}

// Define RFQ questions for each insurance type
const getRFQQuestions = (productType: string) => {
  const baseQuestions = [
    'Company Name',
    'Business Registration Number',
    'GST Number',
    'PAN Number',
    'Business Type/Industry',
    'Year of Establishment',
    'Number of Employees',
    'Annual Revenue',
    'Business Address',
    'City',
    'State',
    'PIN Code',
    'Contact Person Name',
    'Email Address',
    'Phone Number',
    'Policy Start Date',
    'Policy End Date',
    'Coverage Amount Required',
    'Current Insurance Provider',
    'Previous Claims History',
    'Risk Management Measures',
  ]

  // Product-specific questions
  const productSpecificQuestions: { [key: string]: string[] } = {
    'fire_special_perils': [
      'Building Value',
      'Stock/Inventory Value',
      'Plant & Machinery Value',
      'Fire Safety Equipment Available',
      'Building Construction Type',
      'Storage of Hazardous Materials',
    ],
    'marine_cargo': [
      'Type of Goods Transported',
      'Mode of Transportation',
      'Average Shipment Value',
      'Monthly Shipment Frequency',
      'International or Domestic',
      'Port of Loading',
      'Port of Discharge',
    ],
    'liability_insurance': [
      'Type of Liability Coverage Needed',
      'Professional Services Offered',
      'Client Base Size',
      'Average Contract Value',
      'Litigation History',
    ],
    'health_insurance': [
      'Number of Employees to Cover',
      'Average Age of Employees',
      'Dependents Coverage Required',
      'Pre-existing Conditions Declaration',
      'Preferred Hospital Network',
    ],
    'cyber_insurance': [
      'IT Infrastructure Size',
      'Data Sensitivity Level',
      'Customer Data Volume',
      'Cybersecurity Measures',
      'Previous Cyber Incidents',
      'Compliance Requirements',
    ],
  }

  return [
    ...baseQuestions,
    ...(productSpecificQuestions[productType] || [])
  ]
}

const enhanceField = async (productType: string, fieldName: string): Promise<FieldEnhancement> => {
  const prompt = `You are an expert in insurance RFQ (Request for Quote) forms for Indian businesses.

For the insurance product: ${productType}
For the field: ${fieldName}

Please provide the optimal configuration for this form field in the following JSON format:
{
  "fieldName": "${fieldName}",
  "question": "The exact question to ask the user",
  "inputType": "Choose from: text, number, select, radio, checkbox, date, textarea, email, phone, file",
  "required": true/false,
  "placeholder": "Placeholder text if applicable",
  "validation": {
    "pattern": "regex pattern if needed",
    "minLength": number if applicable,
    "maxLength": number if applicable,
    "min": number or date string if applicable,
    "max": number or date string if applicable
  },
  "options": ["array of options for select/radio fields"],
  "helperText": "Brief helper text shown below the field",
  "guidanceTitle": "Title for the guidance panel when this field is focused",
  "guidanceTips": [
    "Tip 1 for filling this field correctly",
    "Tip 2 with specific guidance",
    "Tip 3 with best practices"
  ]
}

Consider Indian business context, regulatory requirements (GST, PAN, etc.), and insurance industry standards.
Make the guidance practical and helpful for Indian SMEs.
For number fields like employees or revenue, use exact numbers not ranges.
For dates, consider policy periods are typically 1 year.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (error) {
    console.error(`Error enhancing field ${fieldName}:`, error)
  }

  // Return default if enhancement fails
  return {
    fieldName,
    question: fieldName,
    inputType: 'text',
    required: false,
    helperText: `Enter ${fieldName}`,
    guidanceTitle: fieldName,
    guidanceTips: [`Enter accurate information for ${fieldName}`]
  }
}

const processProductFields = async (productType: string) => {
  const questions = getRFQQuestions(productType)
  const enhancedFields: FieldEnhancement[] = []

  console.log(`Processing ${questions.length} fields for ${productType}...`)

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < questions.length; i += 5) {
    const batch = questions.slice(i, i + 5)

    const batchPromises = batch.map(question => enhanceField(productType, question))
    const batchResults = await Promise.all(batchPromises)

    enhancedFields.push(...batchResults)

    console.log(`Processed ${Math.min(i + 5, questions.length)}/${questions.length} fields`)

    // Wait 1 second between batches to respect rate limits
    if (i + 5 < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return enhancedFields
}

const main = async () => {
  console.log('Starting RFQ field enhancement...')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not found in environment variables')
    process.exit(1)
  }

  const results: { [key: string]: FieldEnhancement[] } = {}

  // Process each product type
  for (const category of productCategories) {
    for (const product of category.products) {
      console.log(`\nProcessing: ${product.name} (${product.type})`)

      try {
        const enhancedFields = await processProductFields(product.type)
        results[product.type] = enhancedFields

        // Save intermediate results
        const outputPath = path.join(__dirname, `../data/enhanced-rfq-fields/${product.type}.json`)
        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, JSON.stringify(enhancedFields, null, 2))

        console.log(`Saved enhanced fields for ${product.name}`)
      } catch (error) {
        console.error(`Error processing ${product.type}:`, error)
      }

      // Wait 2 seconds between products
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Save complete results
  const finalOutputPath = path.join(__dirname, '../data/enhanced-rfq-fields/all-products.json')
  fs.writeFileSync(finalOutputPath, JSON.stringify(results, null, 2))

  console.log('\nField enhancement complete!')
  console.log(`Results saved to: ${finalOutputPath}`)
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { enhanceField, processProductFields }
export type { FieldEnhancement }