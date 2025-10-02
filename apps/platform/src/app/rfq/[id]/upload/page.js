'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, TopBar } from '@sanctuari/ui';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import { UploadButton } from '@/utils/uploadthing';
import '@uploadthing/react/styles.css';
import './page.css';

export default function PolicyUploadPage({ params }) {
  const [rfqId, setRfqId] = useState(null);

  useEffect(() => {
    // Unwrap params promise for Next.js 15+
    Promise.resolve(params).then(p => setRfqId(p.id));
  }, [params]);

  if (!rfqId) {
    return (
      <div className="upload-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <PolicyUploadPageClient rfqId={rfqId} />;
}

function PolicyUploadPageClient({ rfqId }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [policyUrl, setPolicyUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
    loadRFQ();
  }, [rfqId]);

  const loadUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const loadRFQ = async () => {
    try {
      const res = await fetch(`/api/rfq/${rfqId}`);
      if (!res.ok) throw new Error('Failed to load RFQ');
      const data = await res.json();
      setRfq(data.rfq);
    } catch (err) {
      console.error('Error loading RFQ:', err);
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const handleSkipUpload = () => {
    // Go directly to wizard without uploading
    router.push(`/rfq/${rfqId}/create`);
  };

  const handleUploadComplete = async (res) => {
    if (!res || res.length === 0) return;

    const uploadedFile = res[0];
    setPolicyUrl(uploadedFile.url);
    setUploading(false);

    // Start extraction
    await extractPolicyData(uploadedFile.url);
  };

  const extractPolicyData = async (fileUrl) => {
    try {
      setExtracting(true);
      setError(null);

      console.log('[Policy Upload] Extracting data from:', fileUrl);

      const res = await fetch(`/api/rfq/${rfqId}/extract-policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyUrl: fileUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to extract policy data');
      }

      const data = await res.json();
      setExtractedData(data);
      setExtracting(false);

      console.log('[Policy Upload] Extraction complete:', {
        totalFields: data.totalFields,
        extractedFields: data.extractedFields,
        coverage: `${Math.round((data.extractedFields / data.totalFields) * 100)}%`
      });

    } catch (err) {
      console.error('Error extracting policy:', err);
      setError(err.message);
      setExtracting(false);
    }
  };

  const handleApplyData = async () => {
    try {
      // Apply extracted data is already saved by the extraction API
      // Just redirect to wizard
      router.push(`/rfq/${rfqId}/create`);
    } catch (err) {
      console.error('Error applying data:', err);
      setError(err.message);
    }
  };

  if (error && !policyUrl) {
    return (
      <div className="upload-error">
        <h2>Error</h2>
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
          <div className="upload-container">
            {/* Header */}
            <div className="upload-header">
              <h1 className="upload-title">Upload Your Policy (Optional)</h1>
              <p className="upload-subtitle">
                Save time by uploading your existing insurance policy. We'll automatically extract and pre-fill the form for you.
              </p>
            </div>

            {!policyUrl && !extracting && (
              <>
                {/* Upload Section */}
                <div className="upload-card">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h2>Upload Policy PDF</h2>
                  <p>We'll analyze your policy and pre-fill as many fields as possible</p>

                  <UploadButton
                    endpoint="policyUploader"
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={(error) => {
                      setError(error.message);
                      setUploading(false);
                    }}
                    onUploadBegin={() => setUploading(true)}
                    className="upload-button"
                  />

                  {uploading && (
                    <div className="upload-progress">
                      <div className="loading-spinner"></div>
                      <p>Uploading policy...</p>
                    </div>
                  )}
                </div>

                {/* Skip Option */}
                <div className="upload-divider">
                  <span>OR</span>
                </div>

                <div className="skip-card">
                  <h3>Start Fresh</h3>
                  <p>Fill the form manually without uploading a policy</p>
                  <button
                    type="button"
                    className="skip-button"
                    onClick={handleSkipUpload}
                  >
                    Skip Upload & Start Form
                  </button>
                </div>
              </>
            )}

            {extracting && (
              <div className="extraction-progress">
                <div className="loading-spinner large"></div>
                <h2>Analyzing Your Policy...</h2>
                <p>This may take 30-60 seconds. Please wait.</p>
                <div className="progress-steps">
                  <div className="step active">Upload Complete</div>
                  <div className="step active">Reading Policy</div>
                  <div className="step active">Extracting Data</div>
                  <div className="step">Complete</div>
                </div>
              </div>
            )}

            {extractedData && (
              <div className="extraction-results">
                <div className="results-header">
                  <div className="success-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2>Extraction Complete!</h2>
                  <p>Successfully extracted {extractedData.extractedFields} out of {extractedData.totalFields} fields</p>
                </div>

                <div className="results-stats">
                  <div className="stat-card">
                    <div className="stat-number">{extractedData.extractedFields}</div>
                    <div className="stat-label">Fields Found</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{extractedData.totalFields - extractedData.extractedFields}</div>
                    <div className="stat-label">To Fill Manually</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {Math.round((extractedData.extractedFields / extractedData.totalFields) * 100)}%
                    </div>
                    <div className="stat-label">Coverage</div>
                  </div>
                </div>

                {error && (
                  <div className="extraction-warning">
                    <p>{error}</p>
                  </div>
                )}

                <div className="results-actions">
                  <button
                    type="button"
                    className="results-btn results-btn-secondary"
                    onClick={() => {
                      setPolicyUrl(null);
                      setExtractedData(null);
                      setError(null);
                    }}
                  >
                    Upload Different Policy
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn-primary"
                    onClick={handleApplyData}
                  >
                    Continue to Form →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
