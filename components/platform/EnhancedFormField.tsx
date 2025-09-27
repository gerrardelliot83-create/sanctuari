// Component to render form fields based on enhanced configurations
import React from 'react'

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

interface EnhancedFormFieldProps {
  field: FieldEnhancement
  value: any
  onChange: (value: any) => void
  onFocus?: () => void
  onBlur?: () => void
  error?: string
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value

    // Type conversion for number inputs
    if (field.inputType === 'number') {
      onChange(newValue ? Number(newValue) : '')
    } else {
      onChange(newValue)
    }
  }

  const renderInput = () => {
    const commonProps = {
      id: field.fieldName,
      name: field.fieldName,
      value: value || '',
      onChange: handleChange,
      onFocus,
      onBlur,
      placeholder: field.placeholder,
      required: field.required,
      className: `form-input ${error ? 'error' : ''}`,
      ...(field.validation?.pattern && { pattern: field.validation.pattern }),
      ...(field.validation?.minLength && { minLength: field.validation.minLength }),
      ...(field.validation?.maxLength && { maxLength: field.validation.maxLength }),
    }

    switch (field.inputType) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`form-textarea ${error ? 'error' : ''}`}
          />
        )

      case 'select':
        return (
          <select {...commonProps} className={`form-select ${error ? 'error' : ''}`}>
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option) => (
              <label key={option} className="radio-label">
                <input
                  type="radio"
                  name={field.fieldName}
                  value={option}
                  checked={value === option}
                  onChange={handleChange}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  required={field.required}
                  className="form-radio"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={field.fieldName}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              onFocus={onFocus}
              onBlur={onBlur}
              className="form-checkbox"
            />
            <span>{field.placeholder || 'Check if applicable'}</span>
          </label>
        )

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'email':
        return <input {...commonProps} type="email" />

      case 'phone':
        return <input {...commonProps} type="tel" />

      case 'file':
        return (
          <input
            type="file"
            id={field.fieldName}
            name={field.fieldName}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            onFocus={onFocus}
            onBlur={onBlur}
            required={field.required}
            className="form-file"
          />
        )

      default:
        return <input {...commonProps} type="text" />
    }
  }

  return (
    <div className="form-field">
      <label htmlFor={field.fieldName} className="form-label">
        {field.question}
        {field.required && <span className="required-indicator">*</span>}
      </label>
      {renderInput()}
      {field.helperText && !error && (
        <span className="helper-text">{field.helperText}</span>
      )}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}