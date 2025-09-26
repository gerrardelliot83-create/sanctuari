'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { RFQTemplate, RFQField } from '@/utils/rfqParser'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface RFQFormProps {
  template: RFQTemplate
  onSubmit?: (data: any) => void
}

export default function RFQForm({ template, onSubmit }: RFQFormProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formProgress, setFormProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Group fields by section
  const fieldsBySection = template.sections.map(section => ({
    name: section,
    fields: template.fields.filter(f => f.section === section)
  }))

  // Create dynamic schema based on fields
  const createFieldSchema = (field: RFQField) => {
    let schema: any

    switch (field.fieldType) {
      case 'email':
        schema = z.string().email('Invalid email address')
        break
      case 'phone':
        schema = z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number')
        break
      case 'gst':
        schema = z.string().regex(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
          'Invalid GST number'
        )
        break
      case 'pan':
        schema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number')
        break
      case 'pincode':
        schema = z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode')
        break
      case 'number':
        schema = z.number()
        if (field.validation?.min !== undefined) schema = schema.min(field.validation.min)
        if (field.validation?.max !== undefined) schema = schema.max(field.validation.max)
        break
      case 'date':
        schema = z.string()
        break
      case 'checkbox':
        schema = z.boolean()
        break
      case 'select':
        schema = z.string()
        break
      case 'file':
        schema = z.any() // Handle file uploads separately
        break
      default:
        schema = z.string()
        if (field.validation?.minLength) schema = schema.min(field.validation.minLength)
        if (field.validation?.maxLength) schema = schema.max(field.validation.maxLength)
        if (field.validation?.pattern) {
          schema = schema.regex(new RegExp(field.validation.pattern))
        }
    }

    return field.required ? schema : schema.optional()
  }

  // Create Zod schema from template fields
  const formSchema = z.object(
    template.fields.reduce((acc, field) => {
      const fieldKey = `${field.section}-${field.questionNumber}`
      acc[fieldKey] = createFieldSchema(field)
      return acc
    }, {} as any)
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onBlur'
  })

  // Calculate progress
  useEffect(() => {
    const subscription = watch((values) => {
      const filledFields = Object.keys(values).filter(key => values[key] !== '' && values[key] !== undefined).length
      const totalFields = template.fields.length
      setFormProgress((filledFields / totalFields) * 100)
    })
    return () => subscription.unsubscribe()
  }, [watch, template.fields.length])

  const renderField = (field: RFQField) => {
    const fieldKey = `${field.section}-${field.questionNumber}`
    const error = errors[fieldKey]

    const commonProps = {
      ...register(fieldKey),
      id: fieldKey,
      placeholder: field.placeholder,
      onFocus: () => setFocusedField(fieldKey),
      onBlur: () => setFocusedField(null),
      className: `form-input ${error ? 'error' : ''}`
    }

    switch (field.fieldType) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            maxLength={field.validation?.maxLength}
          />
        )

      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              {...register(fieldKey)}
              id={fieldKey}
              onFocus={() => setFocusedField(fieldKey)}
            />
            <span>Yes</span>
          </label>
        )

      case 'file':
        return (
          <input
            type="file"
            {...commonProps}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        )

      case 'date':
        return (
          <input
            type="date"
            {...commonProps}
            min={field.validation?.min as string}
            max={field.validation?.max as string}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            min={field.validation?.min as number}
            max={field.validation?.max as number}
            step={field.question.toLowerCase().includes('percentage') ? 0.01 : 1}
          />
        )

      default:
        return (
          <input
            type={field.fieldType === 'email' ? 'email' :
                  field.fieldType === 'phone' ? 'tel' :
                  field.fieldType === 'url' ? 'url' : 'text'}
            {...commonProps}
            maxLength={field.validation?.maxLength}
          />
        )
    }
  }

  const handleSaveProgress = async () => {
    setIsSaving(true)
    const formData = watch()

    try {
      const { error } = await supabase
        .from('rfqs')
        .insert({
          user_id: user?.id,
          product_type: template.productType,
          template_id: null, // Will be set after templates are seeded
          form_data: formData,
          status: 'draft'
        } as any)

      if (error) throw error
      toast.success('Progress saved!')
    } catch (error) {
      toast.error('Failed to save progress')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (onSubmit) {
      onSubmit(data)
    } else {
      // Default submit behavior
      try {
        const { error } = await supabase
          .from('rfqs')
          .insert({
            user_id: user?.id,
            product_type: template.productType,
            template_id: null,
            form_data: data,
            status: 'active'
          } as any)

        if (error) throw error
        toast.success('RFQ created successfully!')
        router.push('/platform/rfqs')
      } catch (error) {
        toast.error('Failed to create RFQ')
      }
    }
  }

  const nextSection = async () => {
    // Validate current section fields
    const currentFields = fieldsBySection[currentSection].fields
    const fieldKeys = currentFields.map(f => `${f.section}-${f.questionNumber}`)
    const isValid = await trigger(fieldKeys)

    if (isValid && currentSection < fieldsBySection.length - 1) {
      setCurrentSection(currentSection + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const currentSectionData = fieldsBySection[currentSection]
  const focusedGuidance = focusedField ? template.guidanceContent?.[focusedField] : null

  return (
    <div className="rfq-form-container">
      <div className="form-header">
        <h1>{template.name}</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${formProgress}%` }} />
        </div>
        <p className="progress-text">{Math.round(formProgress)}% Complete</p>
      </div>

      <div className="form-layout">
        <div className="form-content">
          {/* Section Navigation */}
          <div className="section-tabs">
            {fieldsBySection.map((section, index) => (
              <button
                key={section.name}
                className={`section-tab ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
                onClick={() => setCurrentSection(index)}
              >
                <span className="section-number">{index + 1}</span>
                <span className="section-name">{section.name}</span>
              </button>
            ))}
          </div>

          {/* Introduction Screen for First Section */}
          {currentSection === 0 && (
            <div className="section-intro">
              <h2>Let's Get Started</h2>
              <p>{template.description}</p>
              <div className="info-box">
                <h3>What You'll Need:</h3>
                <ul>
                  <li>Company registration details</li>
                  <li>GST and PAN information</li>
                  <li>Details about your business operations</li>
                  <li>Previous insurance policy details (if any)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="section-content">
              <h2>{currentSectionData.name}</h2>

              {currentSectionData.fields.map((field) => {
                const fieldKey = `${field.section}-${field.questionNumber}`
                const error = errors[fieldKey]

                return (
                  <div key={fieldKey} className="form-field">
                    <label htmlFor={fieldKey}>
                      {field.question}
                      {field.required && <span className="required">*</span>}
                    </label>

                    {renderField(field)}

                    {field.helperText && !error && (
                      <span className="helper-text">{field.helperText}</span>
                    )}

                    {error && (
                      <span className="error-text">{(error as any).message || 'This field is required'}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="form-navigation">
              <button
                type="button"
                onClick={prevSection}
                className="btn-secondary"
                disabled={currentSection === 0}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSaveProgress}
                className="btn-outline"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>

              {currentSection < fieldsBySection.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="btn-primary"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Submit RFQ
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Guidance Panel */}
        <div className="guidance-panel">
          <div className="guidance-sticky">
            {focusedGuidance ? (
              <>
                <h3>{focusedGuidance.title}</h3>
                <p>{focusedGuidance.content}</p>
                {focusedGuidance.mediaUrl && (
                  <div className="guidance-media">
                    {focusedGuidance.mediaType === 'video' ? (
                      <video src={focusedGuidance.mediaUrl} controls />
                    ) : (
                      <img src={focusedGuidance.mediaUrl} alt="Guidance" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>Need Help?</h3>
                <p>Click on any field to see helpful guidance and tips for filling it correctly.</p>

                <div className="tips-section">
                  <h4>Quick Tips:</h4>
                  <ul>
                    <li>Fill all required fields marked with *</li>
                    <li>Provide accurate information for better quotes</li>
                    <li>Save your progress regularly</li>
                    <li>Contact support if you need assistance</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .rfq-form-container {
          min-height: 100vh;
          background: var(--color-gray-50);
        }

        .form-header {
          background: var(--color-white);
          border-bottom: 1px solid var(--color-gray-200);
          padding: var(--spacing-lg) 0;
          margin-bottom: var(--spacing-xl);
          position: sticky;
          top: 64px;
          z-index: 10;
        }

        .form-header h1 {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          font-size: var(--font-size-2xl);
          font-weight: 600;
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-md);
        }

        .progress-bar {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          height: 4px;
          background: var(--color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .progress-text {
          max-width: 1200px;
          margin: var(--spacing-xs) auto 0;
          padding: 0 var(--spacing-xl);
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .form-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--spacing-xl);
          padding: 0 var(--spacing-xl) var(--spacing-2xl);
        }

        .form-content {
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
        }

        .section-tabs {
          display: flex;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-xl);
          overflow-x: auto;
          border-bottom: 1px solid var(--color-gray-200);
          padding-bottom: 0;
        }

        .section-tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          margin-bottom: -1px;
        }

        .section-tab:hover {
          color: var(--color-primary);
        }

        .section-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          font-weight: 500;
        }

        .section-tab.completed {
          color: var(--color-success);
        }

        .section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: var(--color-gray-200);
          color: var(--color-gray-600);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: 600;
        }

        .section-tab.active .section-number {
          background: var(--color-primary);
          color: var(--color-white);
        }

        .section-tab.completed .section-number {
          background: var(--color-success);
          color: var(--color-white);
        }

        .section-intro {
          background: linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-white) 100%);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .section-intro h2 {
          font-size: var(--font-size-xl);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
          font-weight: 600;
        }

        .info-box {
          background: var(--color-white);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          margin-top: var(--spacing-lg);
        }

        .info-box h3 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-md);
        }

        .info-box ul {
          list-style: none;
          padding: 0;
        }

        .info-box li {
          padding: var(--spacing-xs) 0;
          padding-left: var(--spacing-lg);
          position: relative;
        }

        .info-box li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          width: 4px;
          height: 4px;
          background: var(--color-primary);
          border-radius: var(--radius-full);
        }

        .section-content h2 {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-xl);
          color: var(--color-gray-900);
        }

        .form-field {
          margin-bottom: var(--spacing-lg);
        }

        .form-field label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
          color: var(--color-gray-700);
        }

        .required {
          color: var(--color-error);
          margin-left: var(--spacing-xs);
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .form-input.error {
          border-color: var(--color-error);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .helper-text {
          display: block;
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .error-text {
          display: block;
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-error);
        }

        .form-navigation {
          display: flex;
          justify-content: space-between;
          gap: var(--spacing-md);
          margin-top: var(--spacing-2xl);
          padding-top: var(--spacing-xl);
          border-top: 1px solid var(--color-gray-200);
        }

        .guidance-panel {
          position: sticky;
          top: 140px;
          height: fit-content;
        }

        .guidance-sticky {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .guidance-panel h3 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-sm);
          color: var(--color-gray-900);
          font-weight: 600;
        }

        .guidance-panel p {
          color: var(--color-gray-600);
          line-height: 1.5;
          font-size: var(--font-size-sm);
        }

        .guidance-media {
          margin-top: var(--spacing-lg);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .guidance-media img,
        .guidance-media video {
          width: 100%;
          height: auto;
        }

        .tips-section {
          margin-top: var(--spacing-xl);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
        }

        .tips-section h4 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-md);
        }

        .tips-section ul {
          list-style: none;
          padding: 0;
        }

        .tips-section li {
          padding: var(--spacing-xs) 0;
          padding-left: var(--spacing-lg);
          position: relative;
          color: var(--color-gray-700);
        }

        .tips-section li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--color-primary);
        }

        @media (max-width: 1024px) {
          .form-layout {
            grid-template-columns: 1fr;
            padding: 0 var(--spacing-lg);
          }

          .guidance-panel {
            position: static;
            margin-bottom: var(--spacing-lg);
          }

          .guidance-sticky {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .form-header {
            position: static;
          }

          .form-header h1,
          .progress-bar,
          .progress-text {
            padding: 0 var(--spacing-md);
          }

          .form-layout {
            padding: 0 var(--spacing-md);
          }

          .form-content {
            padding: var(--spacing-md);
          }

          .section-tabs {
            gap: 0;
          }

          .section-tab {
            flex-direction: column;
            padding: var(--spacing-xs) var(--spacing-sm);
          }

          .section-name {
            display: none;
          }

          .form-navigation {
            flex-direction: column-reverse;
            gap: var(--spacing-sm);
          }

          .form-navigation button {
            width: 100%;
          }

          .btn-outline {
            order: 1;
          }
        }
      `}</style>
    </div>
  )
}