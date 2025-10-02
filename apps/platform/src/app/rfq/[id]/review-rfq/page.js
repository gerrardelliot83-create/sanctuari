'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, TopBar } from '@sanctuari/ui';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import './page.css';

export default function RFQReviewPage({ params }) {
  const router = useRouter();
  const rfqId = params.id;

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [sections, setSections] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
    loadRFQData();
  }, [rfqId]);

  const loadUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const loadRFQData = async () => {
    try {
      setLoading(true);

      // Load RFQ details
      const rfqRes = await fetch(`/api/rfq/${rfqId}`);
      if (!rfqRes.ok) throw new Error('Failed to load RFQ');
      const rfqData = await rfqRes.json();
      setRfq(rfqData.rfq);

      // Load questions
      const questionsRes = await fetch(`/api/rfq/${rfqId}/questions`);
      if (!questionsRes.ok) throw new Error('Failed to load questions');
      const questionsData = await questionsRes.json();
      setSections(questionsData.sections || []);

      // Load responses
      const responsesRes = await fetch(`/api/rfq/${rfqId}/responses`);
      if (!responsesRes.ok) throw new Error('Failed to load responses');
      const responsesData = await responsesRes.json();

      // API already returns responses as a map keyed by question_id
      // Each value is { value, fileUrl, updatedAt }
      const responsesMap = {};
      Object.entries(responsesData.responses || {}).forEach(([questionId, data]) => {
        responsesMap[questionId] = data.value;
      });
      setResponses(responsesMap);

    } catch (err) {
      console.error('Error loading RFQ data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const handleEditSection = (sectionIndex) => {
    // Go back to wizard at specific section
    router.push(`/rfq/${rfqId}/create?section=${sectionIndex}`);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Submit RFQ - generate number and publish
      const res = await fetch(`/api/rfq/${rfqId}/submit`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit RFQ');
      }

      const data = await res.json();

      // Success! Redirect to distribution page
      alert(`RFQ ${data.rfq.rfq_number} submitted successfully!`);
      router.push(`/rfq/${rfqId}/distribute`);

    } catch (err) {
      console.error('Error submitting RFQ:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-loading">
        <div className="loading-spinner"></div>
        <p>Loading RFQ data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-error">
        <h2>Error Loading RFQ</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <>
      <Sidebar />

      <div className="dashboard-main-wrapper">
        <TopBar
          userName={user?.user_metadata?.full_name || user?.email}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onCreateRFQ={handleCreateRFQ}
        />

        <div className="dashboard-content-wrapper">
          <div className="review-container">
            {/* Header */}
            <div className="review-header">
              <div className="review-header-content">
                <h1 className="review-title">Review Your RFQ</h1>
                <p className="review-subtitle">
                  Please review all information before submitting. You can edit any section by clicking the edit button.
                </p>
              </div>
              <div className="review-meta">
                <span className="review-meta-item">
                  <strong>Product:</strong> {rfq?.title}
                </span>
                <span className="review-meta-item">
                  <strong>Status:</strong> <span className="status-badge status-draft">Draft</span>
                </span>
              </div>
            </div>

            {/* Sections Review */}
            <div className="review-sections">
              {sections.map((section, sectionIndex) => {
                // Get all responses for this section
                const sectionResponses = section.questions?.filter(q => responses[q.id]) || [];

                return (
                  <div key={section.index} className="review-section">
                    <div className="review-section-header">
                      <h2 className="review-section-title">{section.name}</h2>
                      <button
                        type="button"
                        className="review-edit-btn"
                        onClick={() => handleEditSection(sectionIndex)}
                      >
                        Edit Section
                      </button>
                    </div>

                    <div className="review-section-content">
                      {sectionResponses.length === 0 ? (
                        <p className="review-no-responses">No responses in this section</p>
                      ) : (
                        <div className="review-questions-list">
                          {section.questions.map(question => {
                            const value = responses[question.id];
                            if (!value) return null;

                            return (
                              <div key={question.id} className="review-question-item">
                                <div className="review-question-label">
                                  {question.question_text}
                                </div>
                                <div className="review-question-value">
                                  {formatResponseValue(value, question.field_type)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="review-actions">
              <button
                type="button"
                className="review-btn review-btn-secondary"
                onClick={() => router.push(`/rfq/${rfqId}/create`)}
              >
                Back to Wizard
              </button>
              <button
                type="button"
                className="review-btn review-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Preparing...' : "Let's Distribute"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to format response values based on field type
function formatResponseValue(value, fieldType) {
  if (!value) return '-';

  switch (fieldType) {
    case 'date':
      return new Date(value).toLocaleDateString('en-IN');

    case 'number':
      return value.toLocaleString('en-IN');

    case 'multiselect':
    case 'checkbox':
      try {
        const arr = Array.isArray(value) ? value : JSON.parse(value);
        return arr.join(', ');
      } catch {
        return value;
      }

    case 'file':
      return <a href={value} target="_blank" rel="noopener noreferrer">View File</a>;

    default:
      return value;
  }
}
