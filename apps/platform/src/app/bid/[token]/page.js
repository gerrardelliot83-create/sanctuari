'use client';

/**
 * Page: Bid Submission Portal
 * Purpose: Public portal for insurers/brokers to submit quotes via unique token
 * Features: Token validation, multiple quote uploads, document parsing, policy wording uploads
 */

import { useState, useEffect } from 'react';
import { createClient } from '@sanctuari/database/lib/client';
import { UploadButton } from '@/utils/uploadthing';
import './bid.css';

export default function BidSubmissionPage({ params }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(p => setToken(p.token));
  }, [params]);

  if (!token) {
    return (
      <div className="bid-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return <BidSubmissionClient token={token} />;
}

function BidSubmissionClient({ token }) {
  const supabase = createClient();

  // State management
  const [pageState, setPageState] = useState('loading'); // loading, invalid, expired, submitted, form, success
  const [invitation, setInvitation] = useState(null);
  const [rfq, setRfq] = useState(null);

  // Form state
  const [bidderType, setBidderType] = useState('insurer'); // insurer or broker
  const [bidderCompanyName, setBidderCompanyName] = useState('');
  const [bidderContactPerson, setBidderContactPerson] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');

  // Multiple quotes state
  const [quotes, setQuotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(null);

  // UI state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setPageState('loading');

      // Query invitation with RFQ details
      const { data: invitationData, error } = await supabase
        .from('rfq_invitations')
        .select(`
          *,
          rfqs (
            *,
            insurance_products (name),
            companies (name)
          )
        `)
        .eq('unique_link_token', token)
        .single();

      if (error || !invitationData) {
        console.error('Token validation failed:', error);
        setPageState('invalid');
        return;
      }

      // Check if already submitted
      if (invitationData.status === 'submitted') {
        setPageState('submitted');
        setInvitation(invitationData);
        return;
      }

      // Check if expired
      if (new Date() > new Date(invitationData.expires_at)) {
        setPageState('expired');
        setInvitation(invitationData);
        return;
      }

      // Valid invitation - show form
      setInvitation(invitationData);
      setRfq(invitationData.rfqs);

      // Pre-fill email if from network member
      if (invitationData.network_member_id) {
        const { data: memberData } = await supabase
          .from('network_members')
          .select('company_name, contact_person, email, phone')
          .eq('id', invitationData.network_member_id)
          .single();

        if (memberData) {
          setBidderCompanyName(memberData.company_name || '');
          setBidderContactPerson(memberData.contact_person || '');
          setBidderEmail(memberData.email || '');
          setBidderPhone(memberData.phone || '');
        }
      } else if (invitationData.external_email) {
        setBidderEmail(invitationData.external_email);
      }

      setPageState('form');

    } catch (error) {
      console.error('Exception during token validation:', error);
      setPageState('invalid');
    }
  };

  const addQuote = () => {
    const newQuote = {
      id: Date.now(),
      // Quote document
      quoteDocument: null,
      quoteDocumentUrl: null,
      quoteDocumentUploading: false,

      // Policy wording document
      policyDocument: null,
      policyDocumentUrl: null,
      policyDocumentUploading: false,

      // Extracted/manual data
      insurerName: '', // For brokers only
      premiumAmount: '',
      coverageAmount: '',
      deductible: '',
      policyTermMonths: '12',
      additionalTerms: '',

      // Parsing state
      parsing: false,
      parsed: false,
      extractedData: null,
    };

    setQuotes([...quotes, newQuote]);
    setCurrentQuote(newQuote.id);
  };

  const removeQuote = (quoteId) => {
    setQuotes(quotes.filter(q => q.id !== quoteId));
    if (currentQuote === quoteId) {
      setCurrentQuote(quotes.length > 1 ? quotes[0].id : null);
    }
  };

  const updateQuote = (quoteId, updates) => {
    setQuotes(quotes.map(q => q.id === quoteId ? { ...q, ...updates } : q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};

    if (!bidderCompanyName.trim()) {
      newErrors.bidderCompanyName = 'Company name is required';
    }

    if (!bidderEmail.trim()) {
      newErrors.bidderEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bidderEmail)) {
      newErrors.bidderEmail = 'Invalid email format';
    }

    if (quotes.length === 0) {
      newErrors.quotes = 'At least one quote is required';
    }

    // Validate each quote
    quotes.forEach((quote, index) => {
      if (!quote.quoteDocumentUrl) {
        newErrors[`quote_${quote.id}_doc`] = 'Quote document is required';
      }
      if (!quote.policyDocumentUrl) {
        newErrors[`quote_${quote.id}_policy`] = 'Policy wording document is required';
      }
      if (bidderType === 'broker' && !quote.insurerName.trim()) {
        newErrors[`quote_${quote.id}_insurer`] = 'Insurer name is required for brokers';
      }
      if (!quote.premiumAmount || parseFloat(quote.premiumAmount) <= 0) {
        newErrors[`quote_${quote.id}_premium`] = 'Valid premium amount is required';
      }
      if (!quote.coverageAmount || parseFloat(quote.coverageAmount) <= 0) {
        newErrors[`quote_${quote.id}_coverage`] = 'Valid coverage amount is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // Submit each quote as a separate bid
      const bidPromises = quotes.map(async (quote) => {
        const bidData = {
          bidder_company_name: bidderCompanyName,
          bidder_contact_person: bidderContactPerson,
          bidder_email: bidderEmail,
          bidder_phone: bidderPhone,
          insurer_name: bidderType === 'broker' ? quote.insurerName : bidderCompanyName,
          premium_amount: parseFloat(quote.premiumAmount),
          coverage_amount: parseFloat(quote.coverageAmount),
          deductible: quote.deductible ? parseFloat(quote.deductible) : null,
          policy_term_months: parseInt(quote.policyTermMonths) || 12,
          additional_terms: quote.additionalTerms,
        };

        const documents = [
          {
            file_name: 'quote.pdf',
            file_url: quote.quoteDocumentUrl,
            file_type: 'quote',
            parsed_data: quote.extractedData,
          },
          {
            file_name: 'policy-wording.pdf',
            file_url: quote.policyDocumentUrl,
            file_type: 'policy',
          }
        ];

        return fetch('/api/bid/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId: invitation.id,
            token: token,
            bidData,
            documents,
          }),
        });
      });

      const responses = await Promise.all(bidPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Check if all succeeded
      const allSucceeded = results.every(r => r.success);

      if (allSucceeded) {
        setPageState('success');
      } else {
        const failedResults = results.filter(r => !r.success);
        console.error('Some bids failed:', failedResults);
        setErrors({ submit: 'Failed to submit one or more quotes. Please try again.' });
      }

    } catch (error) {
      console.error('Error submitting bids:', error);
      setErrors({ submit: 'An error occurred while submitting. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Render different UI states
  if (pageState === 'loading') {
    return (
      <div className="bid-container">
        <div className="bid-loading">
          <div className="loading-spinner"></div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="bid-container">
        <div className="bid-error-state">
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#FD5478" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="#FD5478" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Invalid Invitation Link</h1>
          <p>This invitation link is not valid or has been revoked.</p>
          <p>Please contact the sender for a new invitation link.</p>
        </div>
      </div>
    );
  }

  if (pageState === 'expired') {
    return (
      <div className="bid-container">
        <div className="bid-error-state">
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#F6C754" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="#F6C754" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Invitation Expired</h1>
          <p>This invitation link has expired.</p>
          {invitation && (
            <p className="expired-date">
              Expired on: {new Date(invitation.expires_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          <p>Please contact the sender for a new invitation link.</p>
        </div>
      </div>
    );
  }

  if (pageState === 'submitted') {
    return (
      <div className="bid-container">
        <div className="bid-success-state">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#6F4FFF" strokeWidth="2"/>
              <path d="M9 12l2 2 4-4" stroke="#6F4FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Already Submitted</h1>
          <p>You have already submitted a quote for this RFQ.</p>
          {invitation && invitation.submitted_at && (
            <p className="submitted-date">
              Submitted on: {new Date(invitation.submitted_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="bid-container">
        <div className="bid-success-state">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#6F4FFF" strokeWidth="2"/>
              <path d="M9 12l2 2 4-4" stroke="#6F4FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Quote Submitted Successfully</h1>
          <p>Your {quotes.length > 1 ? 'quotes have' : 'quote has'} been submitted to {rfq?.companies?.name || 'the client'}.</p>
          <p className="success-detail">Reference: {rfq?.rfq_number}</p>
          <p className="success-detail">Submitted {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}</p>
          <p>You will be contacted if your quote is selected.</p>
        </div>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="bid-container">
      <div className="bid-header">
        <div className="bid-header-content">
          <h1>Submit Your Quote</h1>
          {rfq && (
            <div className="rfq-info">
              <div className="rfq-info-item">
                <span className="label">RFQ Number:</span>
                <span className="value">{rfq.rfq_number}</span>
              </div>
              <div className="rfq-info-item">
                <span className="label">Product:</span>
                <span className="value">{rfq.insurance_products?.name}</span>
              </div>
              <div className="rfq-info-item">
                <span className="label">Company:</span>
                <span className="value">{rfq.companies?.name}</span>
              </div>
              {rfq.deadline && (
                <div className="rfq-info-item">
                  <span className="label">Deadline:</span>
                  <span className="value deadline">
                    {new Date(rfq.deadline).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form className="bid-form" onSubmit={handleSubmit}>
        {/* Bidder Information Section */}
        <div className="form-section">
          <h2>Bidder Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bidderType">You are a:</label>
              <select
                id="bidderType"
                value={bidderType}
                onChange={(e) => setBidderType(e.target.value)}
                className="form-select"
              >
                <option value="insurer">Insurance Company (Direct)</option>
                <option value="broker">Broker (Representing Insurer)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bidderCompanyName">
                {bidderType === 'broker' ? 'Broker Company Name' : 'Insurance Company Name'}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="bidderCompanyName"
                value={bidderCompanyName}
                onChange={(e) => setBidderCompanyName(e.target.value)}
                className={errors.bidderCompanyName ? 'error' : ''}
                placeholder="Enter company name"
              />
              {errors.bidderCompanyName && (
                <span className="error-message">{errors.bidderCompanyName}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bidderContactPerson">Contact Person</label>
              <input
                type="text"
                id="bidderContactPerson"
                value={bidderContactPerson}
                onChange={(e) => setBidderContactPerson(e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bidderEmail">
                Email Address<span className="required">*</span>
              </label>
              <input
                type="email"
                id="bidderEmail"
                value={bidderEmail}
                onChange={(e) => setBidderEmail(e.target.value)}
                className={errors.bidderEmail ? 'error' : ''}
                placeholder="email@example.com"
              />
              {errors.bidderEmail && (
                <span className="error-message">{errors.bidderEmail}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bidderPhone">Phone Number</label>
              <input
                type="tel"
                id="bidderPhone"
                value={bidderPhone}
                onChange={(e) => setBidderPhone(e.target.value)}
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Quotes Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Quote Details</h2>
            <button
              type="button"
              className="btn-add-quote"
              onClick={addQuote}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Another Quote
            </button>
          </div>

          {errors.quotes && (
            <div className="error-message-box">{errors.quotes}</div>
          )}

          {quotes.length === 0 && (
            <div className="empty-quotes">
              <p>Click "Add Another Quote" to start adding your quotes.</p>
              <p className="note">You can submit multiple quotes from different insurers if you're a broker.</p>
            </div>
          )}

          {quotes.map((quote, index) => (
            <QuoteForm
              key={quote.id}
              quote={quote}
              index={index}
              bidderType={bidderType}
              onUpdate={(updates) => updateQuote(quote.id, updates)}
              onRemove={() => removeQuote(quote.id)}
              errors={errors}
              canRemove={quotes.length > 1}
            />
          ))}
        </div>

        {/* Submit Section */}
        {quotes.length > 0 && (
          <div className="form-actions">
            {errors.submit && (
              <div className="error-message-box">{errors.submit}</div>
            )}
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : `Submit ${quotes.length} ${quotes.length === 1 ? 'Quote' : 'Quotes'}`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// Quote Form Component
function QuoteForm({ quote, index, bidderType, onUpdate, onRemove, errors, canRemove }) {
  const [parsing, setParsing] = useState(false);

  const handleQuoteUploadComplete = async (res) => {
    if (res && res.length > 0) {
      const fileUrl = res[0].url;
      const fileName = res[0].name;
      const fileSize = res[0].size;

      console.log('[Quote Upload] Complete:', { fileUrl, fileName, fileSize });

      // Preserve existing data when setting upload info
      onUpdate({
        ...quote,
        quoteDocumentUrl: fileUrl,
        quoteDocumentFileName: fileName,
        quoteDocumentSize: fileSize,
        quoteDocumentUploading: false,
      });

      // Auto-parse the quote document
      setParsing(true);
      try {
        const parseResponse = await fetch('/api/parse-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileType: 'quote',
          }),
        });

        const parseResult = await parseResponse.json();

        if (parseResult.success && parseResult.extractedData) {
          console.log('[Quote Parse] Success:', parseResult.extractedData);

          // Pre-fill form with extracted data (preserve all existing data!)
          onUpdate({
            ...quote,
            quoteDocumentUrl: fileUrl,
            quoteDocumentFileName: fileName,
            quoteDocumentSize: fileSize,
            premiumAmount: parseResult.extractedData.premium_amount || quote.premiumAmount,
            coverageAmount: parseResult.extractedData.coverage_amount || quote.coverageAmount,
            deductible: parseResult.extractedData.deductible || quote.deductible,
            policyTermMonths: parseResult.extractedData.policy_term_months || quote.policyTermMonths,
            insurerName: parseResult.extractedData.insurer_name || quote.insurerName,
            extractedData: parseResult.extractedData,
            parsed: true,
          });
        }
      } catch (error) {
        console.error('[Quote Parse] Error:', error);
      } finally {
        setParsing(false);
      }
    }
  };

  const handlePolicyUploadComplete = (res) => {
    if (res && res.length > 0) {
      const fileUrl = res[0].url;
      const fileName = res[0].name;
      const fileSize = res[0].size;

      console.log('[Policy Upload] Complete:', { fileUrl, fileName, fileSize });

      // Preserve all existing quote data when updating policy document
      onUpdate({
        ...quote,
        policyDocumentUrl: fileUrl,
        policyDocumentFileName: fileName,
        policyDocumentSize: fileSize,
        policyDocumentUploading: false,
      });
    }
  };

  return (
    <div className="quote-card">
      <div className="quote-card-header">
        <h3>Quote #{index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            className="btn-remove-quote"
            onClick={onRemove}
            title="Remove this quote"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {bidderType === 'broker' && (
        <div className="form-group">
          <label>
            Insurer Name<span className="required">*</span>
          </label>
          <input
            type="text"
            value={quote.insurerName}
            onChange={(e) => onUpdate({ insurerName: e.target.value })}
            className={errors[`quote_${quote.id}_insurer`] ? 'error' : ''}
            placeholder="Which insurer is this quote from?"
          />
          {errors[`quote_${quote.id}_insurer`] && (
            <span className="error-message">{errors[`quote_${quote.id}_insurer`]}</span>
          )}
        </div>
      )}

      {/* Document Uploads */}
      <div className="documents-section">
        <div className="form-group">
          <label>
            Quote Document<span className="required">*</span>
          </label>
          {!quote.quoteDocumentUrl ? (
            <div className="upload-button-wrapper">
              <UploadButton
                endpoint="quoteUploader"
                onClientUploadComplete={handleQuoteUploadComplete}
                onUploadError={(error) => {
                  console.error('[Quote Upload] Error:', error);
                  alert('Upload failed: ' + error.message);
                }}
                appearance={{
                  button: {
                    background: 'var(--iris)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                  },
                  container: {
                    width: '100%',
                  },
                }}
              />
            </div>
          ) : (
            <div className="file-uploaded-display">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 011.946-.806 3.42 3.42 0 014.438 3.42c0 1.12-.562 2.114-1.42 2.708M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--iris)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="file-name">{quote.quoteDocumentFileName || 'Quote uploaded'}</span>
              <button
                type="button"
                className="btn-clear-file"
                onClick={() => onUpdate({ quoteDocumentUrl: null, quoteDocumentFileName: null })}
              >
                Remove
              </button>
            </div>
          )}
          {parsing && (
            <div className="parsing-indicator">
              <div className="loading-spinner-small"></div>
              <span>Extracting quote data...</span>
            </div>
          )}
          {quote.parsed && (
            <div className="parse-success">
              Quote data extracted successfully. Review and edit below.
            </div>
          )}
          {errors[`quote_${quote.id}_doc`] && (
            <span className="error-message">{errors[`quote_${quote.id}_doc`]}</span>
          )}
        </div>

        <div className="form-group">
          <label>
            Policy Wording Document<span className="required">*</span>
          </label>
          {!quote.policyDocumentUrl ? (
            <div className="upload-button-wrapper">
              <UploadButton
                endpoint="policyWordingUploader"
                onClientUploadComplete={handlePolicyUploadComplete}
                onUploadError={(error) => {
                  console.error('[Policy Upload] Error:', error);
                  alert('Upload failed: ' + error.message);
                }}
                appearance={{
                  button: {
                    background: 'var(--iris)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                  },
                  container: {
                    width: '100%',
                  },
                }}
              />
            </div>
          ) : (
            <div className="file-uploaded-display">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 011.946-.806 3.42 3.42 0 014.438 3.42c0 1.12-.562 2.114-1.42 2.708M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--iris)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="file-name">{quote.policyDocumentFileName || 'Policy uploaded'}</span>
              <button
                type="button"
                className="btn-clear-file"
                onClick={() => onUpdate({ policyDocumentUrl: null, policyDocumentFileName: null })}
              >
                Remove
              </button>
            </div>
          )}
          {errors[`quote_${quote.id}_policy`] && (
            <span className="error-message">{errors[`quote_${quote.id}_policy`]}</span>
          )}
        </div>
      </div>

      {/* Quote Details */}
      <div className="form-row">
        <div className="form-group">
          <label>
            Premium Amount (₹)<span className="required">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quote.premiumAmount}
            onChange={(e) => onUpdate({ premiumAmount: e.target.value })}
            className={errors[`quote_${quote.id}_premium`] ? 'error' : ''}
            placeholder="150000"
          />
          {errors[`quote_${quote.id}_premium`] && (
            <span className="error-message">{errors[`quote_${quote.id}_premium`]}</span>
          )}
        </div>

        <div className="form-group">
          <label>
            Coverage Amount (₹)<span className="required">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quote.coverageAmount}
            onChange={(e) => onUpdate({ coverageAmount: e.target.value })}
            className={errors[`quote_${quote.id}_coverage`] ? 'error' : ''}
            placeholder="10000000"
          />
          {errors[`quote_${quote.id}_coverage`] && (
            <span className="error-message">{errors[`quote_${quote.id}_coverage`]}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Deductible Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quote.deductible}
            onChange={(e) => onUpdate({ deductible: e.target.value })}
            placeholder="25000"
          />
        </div>

        <div className="form-group">
          <label>Policy Term (Months)</label>
          <input
            type="number"
            min="1"
            value={quote.policyTermMonths}
            onChange={(e) => onUpdate({ policyTermMonths: e.target.value })}
            placeholder="12"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Additional Terms</label>
        <textarea
          value={quote.additionalTerms}
          onChange={(e) => onUpdate({ additionalTerms: e.target.value })}
          placeholder="Enter any additional terms, conditions, or notes..."
          rows="3"
        />
      </div>
    </div>
  );
}
