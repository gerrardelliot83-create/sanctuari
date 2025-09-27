// Test script to verify the enhancement works with a single field
import { enhanceField } from './enhance-rfq-fields'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const testEnhancement = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not found in environment variables')
    console.log('Please add ANTHROPIC_API_KEY to your .env.local file')
    process.exit(1)
  }

  console.log('Testing field enhancement with a single field...')

  try {
    const result = await enhanceField('fire-special-perils', 'Company Name')
    console.log('Enhanced field configuration:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testEnhancement()