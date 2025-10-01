/**
 * Component: QuestionRenderer
 * Purpose: Dynamically render RFQ form fields based on question metadata
 * Props: question, value, onChange, error
 * Used in: RFQWizard
 */

'use client';

import { useState, useEffect } from 'react';
import './QuestionRenderer.css';

export default function QuestionRenderer({ question, value, onChange, error }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(question.id, newValue);
  };

  // Format currency in Indian format (₹XX,XX,XXX)
  const formatIndianCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/[^0-9]/g, '');
    if (!num) return '';

    const lastThree = num.substring(num.length - 3);
    const otherNumbers = num.substring(0, num.length - 3);
    const formatted = otherNumbers !== ''
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;

    return formatted;
  };

  const handleCurrencyChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    handleChange(rawValue);
  };

  // Parse validation rules from JSONB
  const validationRules = question.validation_rules || {};
  const metadata = question.metadata || {};
  const isRequired = validationRules.required === true;
  const isCurrency = metadata.format === 'indian_currency';
  const hasAutoFill = metadata.auto_fill_enabled === true;
  const hasOtherOption = metadata.has_other_option === true;

  // Render field based on field_type
  const renderField = () => {
    switch (question.field_type) {
      case 'text':
        return (
          <input
            type="text"
            className={`question-input ${error ? 'question-input--error' : ''}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            required={isRequired}
          />
        );

      case 'number':
        if (isCurrency) {
          return (
            <div className="question-currency-wrapper">
              <span className="question-currency-symbol">₹</span>
              <input
                type="text"
                className={`question-input question-input--currency ${error ? 'question-input--error' : ''}`}
                value={formatIndianCurrency(localValue)}
                onChange={handleCurrencyChange}
                placeholder={question.placeholder || '0'}
                required={isRequired}
              />
            </div>
          );
        }
        return (
          <input
            type="number"
            className={`question-input ${error ? 'question-input--error' : ''}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            min={validationRules.min}
            max={validationRules.max}
            required={isRequired}
          />
        );

      case 'textarea':
        return (
          <textarea
            className={`question-textarea ${error ? 'question-input--error' : ''}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            required={isRequired}
          />
        );

      case 'select':
        const options = Array.isArray(question.options) ? question.options : [];
        return (
          <div className="question-select-wrapper">
            <select
              className={`question-select ${error ? 'question-input--error' : ''}`}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              required={isRequired}
            >
              <option value="">
                {question.placeholder || 'Select an option'}
              </option>
              {options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
              {hasOtherOption && <option value="__other__">Other</option>}
            </select>
            <svg className="question-select-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );

      case 'multiselect':
        const multiselectOptions = Array.isArray(question.options) ? question.options : [];
        const selectedValues = Array.isArray(localValue) ? localValue : (localValue ? localValue.split(',') : []);

        const toggleOption = (option) => {
          const newValues = selectedValues.includes(option)
            ? selectedValues.filter(v => v !== option)
            : [...selectedValues, option];
          handleChange(newValues.join(','));
        };

        return (
          <div className="question-multiselect">
            {multiselectOptions.map((option, index) => (
              <label key={index} className="question-checkbox-label">
                <input
                  type="checkbox"
                  className="question-checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span className="question-checkbox-text">{option}</span>
              </label>
            ))}
            {hasOtherOption && (
              <label className="question-checkbox-label">
                <input
                  type="checkbox"
                  className="question-checkbox"
                  checked={selectedValues.includes('__other__')}
                  onChange={() => toggleOption('__other__')}
                />
                <span className="question-checkbox-text">Other</span>
              </label>
            )}
          </div>
        );

      case 'radio':
        const radioOptions = Array.isArray(question.options) ? question.options : [];
        return (
          <div className="question-radio-group">
            {radioOptions.map((option, index) => (
              <label key={index} className="question-radio-label">
                <input
                  type="radio"
                  className="question-radio"
                  name={question.field_name}
                  value={option}
                  checked={localValue === option}
                  onChange={(e) => handleChange(e.target.value)}
                  required={isRequired}
                />
                <span className="question-radio-text">{option}</span>
              </label>
            ))}
            {hasOtherOption && (
              <label className="question-radio-label">
                <input
                  type="radio"
                  className="question-radio"
                  name={question.field_name}
                  value="__other__"
                  checked={localValue === '__other__'}
                  onChange={(e) => handleChange(e.target.value)}
                />
                <span className="question-radio-text">Other</span>
              </label>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <label className="question-checkbox-label question-checkbox-label--single">
            <input
              type="checkbox"
              className="question-checkbox"
              checked={localValue === 'true' || localValue === true}
              onChange={(e) => handleChange(e.target.checked.toString())}
              required={isRequired}
            />
            <span className="question-checkbox-text">{question.question_text}</span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            className={`question-input ${error ? 'question-input--error' : ''}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            required={isRequired}
          />
        );

      case 'file':
        return (
          <div className="question-file-wrapper">
            <input
              type="file"
              className="question-file-input"
              id={`file-${question.id}`}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleChange(file.name);
                }
              }}
              required={isRequired}
            />
            <label htmlFor={`file-${question.id}`} className="question-file-label">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V12M10 4L7 7M10 4L13 7M4 12V16H16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {localValue || 'Choose file'}
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={`question-input ${error ? 'question-input--error' : ''}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
          />
        );
    }
  };

  // Show "Other" text input if selected
  const showOtherInput = hasOtherOption && (
    localValue === '__other__' ||
    (Array.isArray(localValue) && localValue.includes('__other__')) ||
    (typeof localValue === 'string' && localValue.split(',').includes('__other__'))
  );

  return (
    <div className="question-renderer">
      {/* Question Label - Skip for checkbox type as it's inline */}
      {question.field_type !== 'checkbox' && (
        <label className="question-label">
          {question.question_text}
          {isRequired && <span className="question-required">*</span>}
          {hasAutoFill && (
            <span className="question-autofill-badge">Auto-filled</span>
          )}
        </label>
      )}

      {/* Field */}
      {renderField()}

      {/* "Other" text input if needed */}
      {showOtherInput && (
        <input
          type="text"
          className="question-input question-other-input"
          placeholder="Please specify..."
          onChange={(e) => {
            // Store the other value separately or append it
            handleChange(`__other__:${e.target.value}`);
          }}
        />
      )}

      {/* Error message */}
      {error && (
        <span className="question-error">{error}</span>
      )}

      {/* Helper text */}
      {!error && question.placeholder && question.field_type !== 'text' && question.field_type !== 'number' && (
        <span className="question-helper">{question.placeholder}</span>
      )}
    </div>
  );
}
