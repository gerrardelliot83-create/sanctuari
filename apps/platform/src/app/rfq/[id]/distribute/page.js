'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, TopBar } from '@sanctuari/ui';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import './page.css';

export default function RFQDistributePage({ params }) {
  const router = useRouter();
  const rfqId = params.id;

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="distribute-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
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
          <div className="distribute-container">
            {/* Success Header */}
            <div className="distribute-success">
              <div className="success-icon">✓</div>
              <h1 className="distribute-title">RFQ Created Successfully!</h1>
              <p className="distribute-subtitle">
                Your RFQ <strong>{rfq?.rfq_number}</strong> has been created and is ready to be distributed.
              </p>
            </div>

            {/* RFQ Details Card */}
            <div className="distribute-details-card">
              <h2>RFQ Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">RFQ Number:</span>
                  <span className="detail-value">{rfq?.rfq_number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{rfq?.title}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className="status-badge status-published">Published</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {rfq?.created_at && new Date(rfq.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Distribution Options - Placeholder */}
            <div className="distribute-options">
              <h2>Distribution Options</h2>
              <p className="distribute-description">
                Choose how you want to distribute your RFQ to insurers and brokers in the Sanctuari network.
              </p>

              <div className="options-placeholder">
                <div className="placeholder-card">
                  <h3>📧 Invite Specific Insurers</h3>
                  <p>Manually select insurers from the network to invite for bidding</p>
                  <button className="placeholder-btn" disabled>
                    Coming Soon
                  </button>
                </div>

                <div className="placeholder-card">
                  <h3>🌐 Auto-Match Network</h3>
                  <p>Automatically distribute to top-rated insurers based on product and criteria</p>
                  <button className="placeholder-btn" disabled>
                    Coming Soon
                  </button>
                </div>

                <div className="placeholder-card">
                  <h3>🔗 Share Link</h3>
                  <p>Generate a shareable link to send to any insurer or broker</p>
                  <button className="placeholder-btn" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="distribute-actions">
              <button
                type="button"
                className="distribute-btn distribute-btn-secondary"
                onClick={() => router.push('/rfqs')}
              >
                View All RFQs
              </button>
              <button
                type="button"
                className="distribute-btn distribute-btn-primary"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
