/**
 * Page: RFQ Wizard
 * Route: /rfq/[id]/create
 * Purpose: Multi-step form for completing RFQ with guidance panel
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar, QuestionRenderer, GuidancePanel } from '@sanctuari/ui';
import './page.css';

export default function RFQWizardPage({ params }) {
  const router = useRouter();
  const rfqId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimerRef = useRef(null);

  // Load questions and existing responses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load questions
        const questionsRes = await fetch(`/api/rfq/${rfqId}/questions`);
        if (!questionsRes.ok) throw new Error('Failed to load questions');
        const questionsData = await questionsRes.json();
        setSections(questionsData.sections || []);

        // Load existing responses
        const responsesRes = await fetch(`/api/rfq/${rfqId}/responses`);
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json();
          setResponses(responsesData.responses || {});
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading RFQ data:', error);
        setLoading(false);
        // TODO: Show error toast
      }
    };

    loadData();
  }, [rfqId]);

  // Auto-save functionality
  const saveResponse = useCallback(async (questionId, value) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/rfq/${rfqId}/responses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          value,
        }),
      });

      if (!res.ok) throw new Error('Failed to save response');

      setSaving(false);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving response:', error);
      setSaving(false);
      return false;
    }
  }, [rfqId]);

  // Handle field change with auto-save debouncing
  const handleFieldChange = useCallback((questionId, value) => {
    // Update local state immediately (optimistic update)
    setResponses(prev => ({
      ...prev,
      [questionId]: { value, updatedAt: new Date().toISOString() }
    }));

    setHasUnsavedChanges(true);

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new auto-save timer (30 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      saveResponse(questionId, value);
    }, 30000);
  }, [saveResponse]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Validate current section
  const validateSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return true;

    const newErrors = {};
    let isValid = true;

    currentSection.questions.forEach(question => {
      const validationRules = question.validation_rules || {};
      const value = responses[question.id]?.value;

      if (validationRules.required && (!value || value === '')) {
        newErrors[question.id] = 'This field is required';
        isValid = false;
      }

      // Add more validation as needed (min, max, pattern, etc.)
      if (validationRules.min && value && parseFloat(value) < validationRules.min) {
        newErrors[question.id] = `Minimum value is ${validationRules.min}`;
        isValid = false;
      }

      if (validationRules.max && value && parseFloat(value) > validationRules.max) {
        newErrors[question.id] = `Maximum value is ${validationRules.max}`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Navigation handlers
  const handleNext = async () => {
    if (!validateSection()) {
      return;
    }

    // Save all responses in current section before moving
    if (hasUnsavedChanges) {
      const currentSection = sections[currentSectionIndex];
      for (const question of currentSection.questions) {
        const value = responses[question.id]?.value;
        if (value) {
          await saveResponse(question.id, value);
        }
      }
    }

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setErrors({});
      setActiveQuestionId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Last section - redirect to review
      router.push(`/rfq/${rfqId}/review`);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      setErrors({});
      setActiveQuestionId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = async () => {
    // Save all current responses
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return;

    setSaving(true);
    for (const question of currentSection.questions) {
      const value = responses[question.id]?.value;
      if (value) {
        await saveResponse(question.id, value);
      }
    }
    setSaving(false);

    // Show success message
    alert('Draft saved successfully!');
  };

  // Get current section and active question
  const currentSection = sections[currentSectionIndex];
  const activeQuestion = activeQuestionId
    ? currentSection?.questions.find(q => q.id === activeQuestionId)
    : currentSection?.questions[0];

  if (loading) {
    return (
      <div className="rfq-wizard-loading">
        <div className="loading-spinner"></div>
        <p>Loading questions...</p>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="rfq-wizard">
        <div className="rfq-wizard-error">
          <h2>No Questions Available</h2>
          <p>There are no questions configured for this insurance product yet.</p>
          <p>Please contact support or try a different product.</p>
        </div>
      </div>
    );
  }

  if (!currentSection) {
    return (
      <div className="rfq-wizard-error">
        <p>Section not found.</p>
      </div>
    );
  }

  return (
    <div className="rfq-wizard">
      {/* Progress Bar */}
      <div className="rfq-wizard__progress">
        <ProgressBar
          currentSection={currentSectionIndex}
          totalSections={sections.length}
          sectionName={currentSection.name}
        />
      </div>

      {/* Split-screen layout */}
      <div className="rfq-wizard__content">
        {/* Left Panel - Form (60%) */}
        <div className="rfq-wizard__form">
          <div className="rfq-wizard__form-header">
            <h2 className="rfq-wizard__section-title">{currentSection.name}</h2>
            <div className="rfq-wizard__save-indicator">
              {saving && (
                <span className="rfq-wizard__saving">Saving...</span>
              )}
              {!saving && hasUnsavedChanges && (
                <span className="rfq-wizard__unsaved">Unsaved changes</span>
              )}
              {!saving && !hasUnsavedChanges && responses[activeQuestionId]?.updatedAt && (
                <span className="rfq-wizard__saved">Saved</span>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="rfq-wizard__questions">
            {currentSection.questions.map((question) => {
              // Check conditional logic
              const conditionalLogic = question.conditional_logic;
              if (conditionalLogic && conditionalLogic.show_if) {
                const { field, value } = conditionalLogic.show_if;

                // Find dependent question (could be in any section, not just current)
                let dependentQuestion = null;
                let dependentValue = undefined;

                // Search in all sections for the dependent field
                for (const section of sections) {
                  dependentQuestion = section.questions.find(q => q.field_name === field);
                  if (dependentQuestion) {
                    dependentValue = responses[dependentQuestion.id]?.value;
                    break;
                  }
                }

                // Only hide if:
                // 1. Dependent question exists
                // 2. Dependent question has been answered (not undefined)
                // 3. The answer does NOT match the required value
                if (dependentQuestion && dependentValue !== undefined && dependentValue !== value) {
                  return null; // Hide this question
                }

                // If dependent question not found or not answered yet, show the question
                // This prevents questions from being hidden incorrectly
              }

              return (
                <div
                  key={question.id}
                  className="rfq-wizard__question"
                  onFocus={() => setActiveQuestionId(question.id)}
                  onClick={() => setActiveQuestionId(question.id)}
                >
                  <QuestionRenderer
                    question={question}
                    value={responses[question.id]?.value || ''}
                    onChange={handleFieldChange}
                    error={errors[question.id]}
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="rfq-wizard__navigation">
            <button
              type="button"
              className="rfq-wizard__btn rfq-wizard__btn--secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              Save Draft
            </button>

            <div className="rfq-wizard__nav-buttons">
              {currentSectionIndex > 0 && (
                <button
                  type="button"
                  className="rfq-wizard__btn rfq-wizard__btn--secondary"
                  onClick={handlePrevious}
                >
                  Previous
                </button>
              )}

              <button
                type="button"
                className="rfq-wizard__btn rfq-wizard__btn--primary"
                onClick={handleNext}
              >
                {currentSectionIndex === sections.length - 1 ? 'Review' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Guidance (40%) */}
        <div className="rfq-wizard__guidance">
          <GuidancePanel question={activeQuestion} isSticky={true} />
        </div>
      </div>
    </div>
  );
}
