/**
 * Component: GuidancePanel
 * Purpose: Display contextual guidance for active RFQ question
 * Props: question, isSticky
 * Used in: RFQWizard
 */

'use client';

import './GuidancePanel.css';

export default function GuidancePanel({ question, isSticky = true }) {
  if (!question) {
    return (
      <div className={`guidance-panel ${isSticky ? 'guidance-panel--sticky' : ''}`}>
        <div className="guidance-panel__placeholder">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
            <path d="M24 18V24M24 30H24.02" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
          </svg>
          <p className="guidance-panel__placeholder-text">
            Select a field to view guidance
          </p>
        </div>
      </div>
    );
  }

  const metadata = question.metadata || {};
  const hasGuidance = question.guidance_text && question.guidance_text.trim() !== '';

  return (
    <div className={`guidance-panel ${isSticky ? 'guidance-panel--sticky' : ''}`}>
      {/* Header */}
      <div className="guidance-panel__header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 14V10M10 6H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <h3 className="guidance-panel__title">Guidance</h3>
      </div>

      {/* Content */}
      <div className="guidance-panel__content">
        {/* Question Text */}
        <div className="guidance-panel__question">
          <h4 className="guidance-panel__question-label">Current Field:</h4>
          <p className="guidance-panel__question-text">{question.question_text}</p>
        </div>

        {/* Guidance Text */}
        {hasGuidance && (
          <div className="guidance-panel__guidance">
            <h4 className="guidance-panel__guidance-label">How to answer:</h4>
            <div className="guidance-panel__guidance-text">
              {question.guidance_text.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Information */}
        {metadata.auto_fill_enabled && (
          <div className="guidance-panel__tip guidance-panel__tip--info">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 11V8M8 5H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>This field can be auto-filled from your company profile.</p>
          </div>
        )}

        {metadata.policy_extractable && (
          <div className="guidance-panel__tip guidance-panel__tip--success">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.545 6.13L15 6.635L11.09 9.88L12.18 15L8 12.13L3.82 15L4.91 9.88L1 6.635L6.455 6.13L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <p>Upload your existing policy to auto-fill this field.</p>
          </div>
        )}

        {/* Field Type Hint */}
        {question.field_type && (
          <div className="guidance-panel__meta">
            <span className="guidance-panel__meta-label">Field type:</span>
            <span className="guidance-panel__meta-value">{question.field_type}</span>
          </div>
        )}

        {/* Validation Rules */}
        {question.validation_rules && question.validation_rules.required && (
          <div className="guidance-panel__meta">
            <span className="guidance-panel__meta-label">Required:</span>
            <span className="guidance-panel__meta-value guidance-panel__meta-value--required">Yes</span>
          </div>
        )}

        {/* Placeholder as Example */}
        {question.placeholder && (
          <div className="guidance-panel__example">
            <h4 className="guidance-panel__example-label">Example:</h4>
            <code className="guidance-panel__example-code">{question.placeholder}</code>
          </div>
        )}
      </div>
    </div>
  );
}
