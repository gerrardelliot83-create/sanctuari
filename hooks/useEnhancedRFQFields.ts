// Hook to load and use enhanced RFQ field configurations
import { useState, useEffect } from 'react'

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

export const useEnhancedRFQFields = (productType: string) => {
  const [fields, setFields] = useState<FieldEnhancement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true)

        // Try to load enhanced fields from JSON
        const response = await fetch(`/data/enhanced-rfq-fields/${productType}.json`)

        if (response.ok) {
          const enhancedFields = await response.json()
          setFields(enhancedFields)
        } else {
          // Fallback to default fields if enhanced not available
          console.warn(`Enhanced fields not found for ${productType}, using defaults`)
          setFields([])
        }
      } catch (err) {
        console.error('Error loading enhanced fields:', err)
        setError('Failed to load field configurations')
        setFields([])
      } finally {
        setLoading(false)
      }
    }

    if (productType) {
      loadFields()
    }
  }, [productType])

  const getFieldConfig = (fieldName: string): FieldEnhancement | null => {
    return fields.find(f => f.fieldName === fieldName) || null
  }

  const getFieldGuidance = (fieldName: string) => {
    const field = getFieldConfig(fieldName)
    if (!field) {
      return {
        title: `Guidance for ${fieldName}`,
        tips: [`Enter accurate information for ${fieldName}`]
      }
    }
    return {
      title: field.guidanceTitle,
      tips: field.guidanceTips
    }
  }

  return {
    fields,
    loading,
    error,
    getFieldConfig,
    getFieldGuidance
  }
}