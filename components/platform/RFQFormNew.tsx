'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { getProductByType } from '@/data/products'

interface RFQFormNewProps {
  productId: string
}

// Define sections for all insurance products
const getFormSections = (productType: string) => {
  const commonSections = [
    {
      id: 'business',
      name: 'Business Information',
      icon: '🏢',
      description: 'Tell us about your business'
    },
    {
      id: 'coverage',
      name: 'Coverage Details',
      icon: '🛡️',
      description: 'Specify your coverage requirements'
    },
    {
      id: 'risk',
      name: 'Risk Assessment',
      icon: '📊',
      description: 'Help us understand your risk profile'
    },
    {
      id: 'additional',
      name: 'Additional Information',
      icon: '📋',
      description: 'Any other relevant details'
    },
    {
      id: 'review',
      name: 'Review & Submit',
      icon: '✅',
      description: 'Review your application'
    }
  ]

  return commonSections
}

export default function RFQFormNew({ productId }: RFQFormNewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const product = getProductByType(productId)

  const sections = getFormSections(productId)
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!product) {
    return <div>Product not found</div>
  }

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('rfqs')
        .insert({
          user_id: user?.id,
          product_type: productId,
          form_data: formData,
          status: 'active'
        } as any)

      if (error) throw error

      toast.success('RFQ submitted successfully!')
      router.push('/platform/rfqs')
    } catch (error) {
      toast.error('Failed to submit RFQ')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSectionContent = () => {
    const section = sections[currentSection]

    switch (section.id) {
      case 'business':
        return (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Company Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your company name"
                value={formData.companyName || ''}
                onChange={(e) => updateFormData('companyName', e.target.value)}
              />
              <span style={styles.helperText}>
                Use your official registered company name for accurate quotes
              </span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Business Type <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.businessType || ''}
                onChange={(e) => updateFormData('businessType', e.target.value)}
              >
                <option value="">Select business type</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="services">Services</option>
                <option value="retail">Retail</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="construction">Construction</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Number of Employees <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.employeeCount || ''}
                onChange={(e) => updateFormData('employeeCount', e.target.value)}
              >
                <option value="">Select range</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Annual Revenue <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.annualRevenue || ''}
                onChange={(e) => updateFormData('annualRevenue', e.target.value)}
              >
                <option value="">Select range</option>
                <option value="<1cr">Less than ₹1 Crore</option>
                <option value="1-5cr">₹1-5 Crore</option>
                <option value="5-25cr">₹5-25 Crore</option>
                <option value="25-100cr">₹25-100 Crore</option>
                <option value="100cr+">Above ₹100 Crore</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Business Address <span style={styles.required}>*</span>
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Enter your complete business address"
                value={formData.businessAddress || ''}
                onChange={(e) => updateFormData('businessAddress', e.target.value)}
                rows={3}
              />
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Enter city"
                  value={formData.city || ''}
                  onChange={(e) => updateFormData('city', e.target.value)}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>PIN Code</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="6-digit PIN"
                  value={formData.pinCode || ''}
                  onChange={(e) => updateFormData('pinCode', e.target.value)}
                />
              </div>
            </div>
          </>
        )

      case 'coverage':
        return (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Coverage Amount Required <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.coverageAmount || ''}
                onChange={(e) => updateFormData('coverageAmount', e.target.value)}
              >
                <option value="">Select coverage amount</option>
                <option value="10L">Up to ₹10 Lakhs</option>
                <option value="25L">₹10-25 Lakhs</option>
                <option value="50L">₹25-50 Lakhs</option>
                <option value="1Cr">₹50 Lakhs - 1 Crore</option>
                <option value="5Cr">₹1-5 Crore</option>
                <option value="10Cr+">Above ₹10 Crore</option>
              </select>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Policy Start Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  style={styles.dateInput}
                  value={formData.policyStartDate || ''}
                  onChange={(e) => updateFormData('policyStartDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <span style={styles.helperText}>When do you want coverage to begin?</span>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Policy End Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  style={styles.dateInput}
                  value={formData.policyEndDate || ''}
                  onChange={(e) => updateFormData('policyEndDate', e.target.value)}
                  min={formData.policyStartDate || new Date().toISOString().split('T')[0]}
                />
                <span style={styles.helperText}>Typically 1 year from start date</span>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Current Insurance Provider (if any)</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Name of current insurer"
                value={formData.currentInsurer || ''}
                onChange={(e) => updateFormData('currentInsurer', e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Specific Coverage Requirements</label>
              <textarea
                style={styles.textarea}
                placeholder="Describe any specific coverage needs"
                value={formData.specificRequirements || ''}
                onChange={(e) => updateFormData('specificRequirements', e.target.value)}
                rows={4}
              />
            </div>
          </>
        )

      case 'risk':
        return (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Have you made any claims in the last 3 years?
              </label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasClaims"
                    value="no"
                    checked={formData.hasClaims === 'no'}
                    onChange={(e) => updateFormData('hasClaims', e.target.value)}
                  />
                  No
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasClaims"
                    value="yes"
                    checked={formData.hasClaims === 'yes'}
                    onChange={(e) => updateFormData('hasClaims', e.target.value)}
                  />
                  Yes
                </label>
              </div>
            </div>

            {formData.hasClaims === 'yes' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Please describe the claims</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Provide details about previous claims"
                  value={formData.claimsDetails || ''}
                  onChange={(e) => updateFormData('claimsDetails', e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Risk Management Measures</label>
              <textarea
                style={styles.textarea}
                placeholder="Describe safety measures, certifications, etc."
                value={formData.riskMeasures || ''}
                onChange={(e) => updateFormData('riskMeasures', e.target.value)}
                rows={3}
              />
            </div>
          </>
        )

      case 'additional':
        return (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Contact Person</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Full name"
                value={formData.contactPerson || ''}
                onChange={(e) => updateFormData('contactPerson', e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="email@company.com"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                style={styles.input}
                placeholder="+91 98765 43210"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Additional Comments</label>
              <textarea
                style={styles.textarea}
                placeholder="Any other information you'd like to share"
                value={formData.additionalComments || ''}
                onChange={(e) => updateFormData('additionalComments', e.target.value)}
                rows={4}
              />
            </div>
          </>
        )

      case 'review':
        return (
          <div style={styles.reviewSection}>
            <h3 style={styles.reviewTitle}>Review Your Information</h3>

            <div style={styles.reviewCard}>
              <h4>Business Information</h4>
              <p><strong>Company:</strong> {formData.companyName || 'Not provided'}</p>
              <p><strong>Type:</strong> {formData.businessType || 'Not provided'}</p>
              <p><strong>Employees:</strong> {formData.employeeCount || 'Not provided'}</p>
              <p><strong>Revenue:</strong> {formData.annualRevenue || 'Not provided'}</p>
            </div>

            <div style={styles.reviewCard}>
              <h4>Coverage Details</h4>
              <p><strong>Coverage Amount:</strong> {formData.coverageAmount || 'Not provided'}</p>
              <p><strong>Policy Period:</strong> {formData.policyStartDate || 'Not provided'} to {formData.policyEndDate || 'Not provided'}</p>
              <p><strong>Current Insurer:</strong> {formData.currentInsurer || 'None'}</p>
            </div>

            <div style={styles.reviewCard}>
              <h4>Contact Information</h4>
              <p><strong>Contact Person:</strong> {formData.contactPerson || 'Not provided'}</p>
              <p><strong>Email:</strong> {formData.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {formData.phone || 'Not provided'}</p>
            </div>

            <div style={styles.consentBox}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.consent || false}
                  onChange={(e) => updateFormData('consent', e.target.checked)}
                />
                I agree to share this information with insurance providers and understand that multiple insurers will contact me with quotes.
              </label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const currentSectionData = sections[currentSection]
  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          {product.name} - Request for Quote
        </h1>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.progressText}>
            Step {currentSection + 1} of {sections.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Side - Form */}
        <div style={styles.formCard}>
          {/* Section Header */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>{currentSectionData.icon}</span>
            <div>
              <h2 style={styles.sectionTitle}>{currentSectionData.name}</h2>
              <p style={styles.sectionDescription}>{currentSectionData.description}</p>
            </div>
          </div>

          {/* Form Content */}
          <div style={styles.formContent}>
            {renderSectionContent()}
          </div>

          {/* Navigation */}
          <div style={styles.navigation}>
            <button
              style={currentSection === 0 ? styles.buttonDisabled : styles.buttonSecondary}
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              Previous
            </button>

            {currentSection === sections.length - 1 ? (
              <button
                style={formData.consent ? styles.buttonPrimary : styles.buttonDisabled}
                onClick={handleSubmit}
                disabled={!formData.consent || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
              </button>
            ) : (
              <button
                style={styles.buttonPrimary}
                onClick={handleNext}
              >
                Next Step
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Guidance */}
        <div style={styles.guidanceCard}>
          <h3 style={styles.guidanceTitle}>
            💡 Helpful Tips
          </h3>

          {currentSection === 0 && (
            <div style={styles.guidanceContent}>
              <p><strong>Accurate Information Matters</strong></p>
              <ul style={styles.tipsList}>
                <li>Use your official company name as registered</li>
                <li>Ensure employee count is current</li>
                <li>Revenue figures help get accurate quotes</li>
              </ul>
            </div>
          )}

          {currentSection === 1 && (
            <div style={styles.guidanceContent}>
              <p><strong>Coverage Guidelines</strong></p>
              <ul style={styles.tipsList}>
                <li>Consider your business size when selecting coverage</li>
                <li>Factor in future growth plans</li>
                <li>Review your current policy gaps</li>
              </ul>
            </div>
          )}

          {currentSection === 2 && (
            <div style={styles.guidanceContent}>
              <p><strong>Risk Disclosure</strong></p>
              <ul style={styles.tipsList}>
                <li>Be transparent about past claims</li>
                <li>Highlight safety measures in place</li>
                <li>Mention certifications if any</li>
              </ul>
            </div>
          )}

          {currentSection === 3 && (
            <div style={styles.guidanceContent}>
              <p><strong>Contact Information</strong></p>
              <ul style={styles.tipsList}>
                <li>Provide direct contact details</li>
                <li>Use business email for faster processing</li>
                <li>Ensure phone number is reachable</li>
              </ul>
            </div>
          )}

          {currentSection === 4 && (
            <div style={styles.guidanceContent}>
              <p><strong>Before Submitting</strong></p>
              <ul style={styles.tipsList}>
                <li>Review all information carefully</li>
                <li>You'll receive quotes within 24-48 hours</li>
                <li>Our team will contact you if clarification is needed</li>
              </ul>
            </div>
          )}

          <div style={styles.helpBox}>
            <p style={styles.helpText}>
              Need assistance? Our insurance experts are here to help.
            </p>
            <button style={styles.helpButton}>
              Chat with Expert
            </button>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div style={styles.stepIndicators}>
        {sections.map((section, index) => (
          <div
            key={section.id}
            style={{
              ...styles.stepItem,
              ...(index === currentSection ? styles.stepActive : {}),
              ...(index < currentSection ? styles.stepCompleted : {})
            }}
            onClick={() => index <= currentSection && setCurrentSection(index)}
          >
            <div style={styles.stepCircle}>
              {index < currentSection ? '✓' : index + 1}
            </div>
            <span style={styles.stepLabel}>{section.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Styles
const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: '#f8f9fa'
  },
  header: {
    background: 'white',
    padding: '24px 32px',
    borderBottom: '1px solid #e1e4e8',
    position: 'sticky' as any,
    top: '64px',
    zIndex: 50
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#24292e',
    marginBottom: '16px'
  },
  progressContainer: {
    maxWidth: '400px'
  },
  progressBar: {
    height: '8px',
    background: '#e1e4e8',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6B46C1 0%, #8B5CF6 100%)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '32px auto',
    padding: '0 32px',
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '32px',
    alignItems: 'start'
  },
  formCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  sectionIcon: {
    fontSize: '32px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280'
  },
  formContent: {
    marginBottom: '32px'
  },
  fieldGroup: {
    marginBottom: '24px'
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  required: {
    color: '#ef4444'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none'
  },
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    background: 'white',
    color: '#374151',
    cursor: 'pointer'
  },
  helperText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    display: 'block'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    background: 'white'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    resize: 'vertical' as any
  },
  radioGroup: {
    display: 'flex',
    gap: '24px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '14px',
    lineHeight: '1.5',
    cursor: 'pointer'
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  buttonPrimary: {
    padding: '10px 24px',
    background: 'linear-gradient(90deg, #6B46C1 0%, #8B5CF6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  buttonSecondary: {
    padding: '10px 24px',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    padding: '10px 24px',
    background: '#f3f4f6',
    color: '#9ca3af',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'not-allowed'
  },
  guidanceCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'sticky' as any,
    top: '140px'
  },
  guidanceTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px'
  },
  guidanceContent: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6'
  },
  tipsList: {
    marginTop: '12px',
    paddingLeft: '20px',
    listStyle: 'disc'
  },
  helpBox: {
    marginTop: '24px',
    padding: '16px',
    background: 'linear-gradient(135deg, #f3f0ff 0%, #fafafe 100%)',
    borderRadius: '8px'
  },
  helpText: {
    fontSize: '13px',
    color: '#4b5563',
    marginBottom: '12px'
  },
  helpButton: {
    width: '100%',
    padding: '8px 16px',
    background: '#6B46C1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  stepIndicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px',
    background: 'white',
    borderTop: '1px solid #e5e7eb'
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column' as any,
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    opacity: 0.5,
    transition: 'opacity 0.2s'
  },
  stepActive: {
    opacity: 1
  },
  stepCompleted: {
    opacity: 1
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280'
  },
  stepLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center' as any,
    maxWidth: '80px'
  },
  reviewSection: {
    display: 'flex',
    flexDirection: 'column' as any,
    gap: '16px'
  },
  reviewTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  reviewCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  consentBox: {
    marginTop: '16px',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #fcd34d'
  }
}