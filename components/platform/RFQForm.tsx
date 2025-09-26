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
import '@/styles/rfq-form.css'

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
      className: `rfq-form-input ${error ? 'error' : ''}`
    }

    switch (field.fieldType) {
      case 'select':
        return (
          <select {...commonProps} className={`rfq-form-select ${error ? 'error' : ''}`}>
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
            className={`rfq-form-textarea ${error ? 'error' : ''}`}
            rows={4}
            maxLength={field.validation?.maxLength}
          />
        )

      case 'checkbox':
        return (
          <div className="rfq-checkbox-wrapper">
            <input
              type="checkbox"
              {...register(fieldKey)}
              id={fieldKey}
              className="rfq-checkbox-input"
              onFocus={() => setFocusedField(fieldKey)}
            />
            <label htmlFor={fieldKey} className="rfq-checkbox-label">Yes</label>
          </div>
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
    <div className="rfq-form-wrapper" style={{ minHeight: '100vh', background: '#f8f9fa', width: '100%' }}>
      <div className="rfq-form-header" style={{
        background: 'white',
        borderBottom: '1px solid #e1e4e8',
        padding: '20px 0',
        position: 'sticky' as any,
        top: '64px',
        zIndex: 100,
        width: '100%'
      }}>
        <div className="rfq-form-header-content" style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 32px'
        }}>
          <h1 className="rfq-form-title">{template.name}</h1>
          <div className="rfq-progress-container">
            <div className="rfq-progress-bar">
              <div className="rfq-progress-fill" style={{ width: `${formProgress}%` }} />
            </div>
            <p className="rfq-progress-text">{Math.round(formProgress)}% Complete</p>
          </div>
        </div>
      </div>

      <div className="rfq-form-layout" style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '24px auto',
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '32px',
        alignItems: 'start'
      }}>
        <div className="rfq-form-content" style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e1e4e8',
          overflow: 'hidden',
          width: '100%',
          minHeight: '600px'
        }}>
          {/* Section Navigation - Minimalist Progress Stepper */}
          <div style={{
            background: '#fafbfc',
            borderBottom: '1px solid #e1e4e8',
            padding: '24px 32px',
            position: 'relative'
          }}>
            {/* Progress Steps */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '600px',
              margin: '0 auto',
              position: 'relative'
            }}>
              {/* Progress Line */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                right: '30px',
                height: '2px',
                background: '#e1e4e8',
                zIndex: 0
              }} />

              {/* Active Progress Line */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                width: `${(currentSection / (fieldsBySection.length - 1)) * (600 - 60)}px`,
                height: '2px',
                background: '#6B46C1',
                transition: 'width 0.3s ease',
                zIndex: 0
              }} />

              {/* Step Indicators */}
              {fieldsBySection.map((section, index) => (
                <div
                  key={section.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentSection(index)}
                >
                  {/* Circle */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index === currentSection ? '#6B46C1' :
                               index < currentSection ? '#10B981' :
                               '#fff',
                    border: index === currentSection ? 'none' :
                            index < currentSection ? 'none' :
                            '2px solid #e1e4e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: index === currentSection ? '#fff' :
                           index < currentSection ? '#fff' :
                           '#6b7280',
                    transition: 'all 0.3s ease',
                    boxShadow: index === currentSection ? '0 4px 6px rgba(107, 70, 193, 0.2)' : 'none'
                  }}>
                    {index < currentSection ? '✓' : index + 1}
                  </div>

                  {/* Label - Only show for active section */}
                  {index === currentSection && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#6B46C1',
                      whiteSpace: 'nowrap',
                      position: 'absolute',
                      top: '100%'
                    }}>
                      {section.name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Section Title for Mobile */}
            <div style={{
              display: 'none',
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }} className="mobile-section-title">
              Step {currentSection + 1} of {fieldsBySection.length}: {currentSectionData.name}
            </div>
          </div>

          {/* Introduction Screen for First Section */}
          {currentSection === 0 && (
            <div className="rfq-section-intro">
              <h2>Let's Get Started</h2>
              <p>{template.description}</p>
              <div className="rfq-info-box">
                <h3>What You'll Need:</h3>
                <ul className="rfq-info-list">
                  <li>Company registration details</li>
                  <li>GST and PAN information</li>
                  <li>Details about your business operations</li>
                  <li>Previous insurance policy details (if any)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="rfq-form-body">
            <div className="rfq-section-content">
              <h2 className="rfq-section-title">{currentSectionData.name}</h2>

              {currentSectionData.fields.map((field) => {
                const fieldKey = `${field.section}-${field.questionNumber}`
                const error = errors[fieldKey]

                return (
                  <div key={fieldKey} className="rfq-form-field">
                    <label htmlFor={fieldKey} className="rfq-form-label">
                      {field.question}
                      {field.required && <span className="required">*</span>}
                    </label>

                    {renderField(field)}

                    {field.helperText && !error && (
                      <span className="rfq-helper-text">{field.helperText}</span>
                    )}

                    {error && (
                      <span className="rfq-error-text">{(error as any).message || 'This field is required'}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="rfq-form-navigation">
              <button
                type="button"
                onClick={prevSection}
                className="rfq-btn rfq-btn-secondary"
                disabled={currentSection === 0}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSaveProgress}
                className="rfq-btn rfq-btn-outline"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>

              {currentSection < fieldsBySection.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="rfq-btn rfq-btn-primary"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  className="rfq-btn rfq-btn-primary"
                >
                  Submit RFQ
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Guidance Panel */}
        <div className="rfq-guidance-panel" style={{
          position: 'sticky' as any,
          top: '140px',
          height: 'fit-content',
          width: '100%'
        }}>
          <div className="rfq-guidance-content" style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e1e4e8',
            padding: '24px',
            width: '100%',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {focusedGuidance ? (
              <>
                <h3 className="rfq-guidance-title">{focusedGuidance.title}</h3>
                <p className="rfq-guidance-text">{focusedGuidance.content}</p>
                {focusedGuidance.mediaUrl && (
                  <div className="rfq-guidance-media">
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
                <h3 className="rfq-guidance-title">Need Help?</h3>
                <p className="rfq-guidance-text">Click on any field to see helpful guidance and tips for filling it correctly.</p>

                <div className="rfq-tips-section">
                  <h4 className="rfq-tips-title">Quick Tips:</h4>
                  <ul className="rfq-tips-list">
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

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-section-title {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}