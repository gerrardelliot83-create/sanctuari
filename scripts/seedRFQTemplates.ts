import { createClient } from '@supabase/supabase-js'
import { parseAllRFQs, templateToDbFormat } from '../utils/rfqParser'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedRFQTemplates() {
  try {
    console.log('Starting RFQ template seeding...')

    // Parse all RFQ CSV files
    const rfqDirectory = path.join(process.cwd(), '../Resources/Product RFQ')
    const templates = await parseAllRFQs(rfqDirectory)

    console.log(`Found ${templates.length} RFQ templates`)

    // Insert templates into database
    for (const template of templates) {
      const dbTemplate = templateToDbFormat(template)

      // Check if template already exists
      const { data: existing } = await supabase
        .from('rfq_templates')
        .select('id')
        .eq('product_type', dbTemplate.product_type)
        .single()

      if (existing) {
        // Update existing template
        const { error } = await supabase
          .from('rfq_templates')
          .update({
            ...dbTemplate,
            version: dbTemplate.version + 1,
          })
          .eq('id', existing.id)

        if (error) {
          console.error(`Error updating template ${template.name}:`, error)
        } else {
          console.log(`Updated template: ${template.name}`)
        }
      } else {
        // Insert new template
        const { error } = await supabase
          .from('rfq_templates')
          .insert(dbTemplate)

        if (error) {
          console.error(`Error inserting template ${template.name}:`, error)
        } else {
          console.log(`Inserted template: ${template.name}`)
        }
      }
    }

    console.log('RFQ template seeding completed!')
  } catch (error) {
    console.error('Error seeding RFQ templates:', error)
    process.exit(1)
  }
}

// Run the seeding script
seedRFQTemplates()