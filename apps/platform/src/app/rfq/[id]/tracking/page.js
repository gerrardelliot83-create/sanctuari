'use client';

/**
 * Page: Partner Response Tracking
 * Route: /rfq/[id]/tracking
 * Purpose: Track invitation status, email delivery, and quote submissions
 * Status: PLACEHOLDER - Full implementation in Week 2
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import { Sidebar, TopBar, Card, Button } from '@sanctuari/ui';
import './tracking.css';

export default function TrackingPage({ params }) {
  const [rfqId, setRfqId] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(p => setRfqId(p.id));
  }, [params]);

  if (!rfqId) {
    return (
      <div className="tracking-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <TrackingPageClient rfqId={rfqId} />;
}

function TrackingPageClient({ rfqId }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  const loadData = async () => {
    const { user: currentUser } = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // Load bid
    const { data: rfqData } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name),
        companies (name)
      `)
      .eq('id', rfqId)
      .single();

    setRfq(rfqData);

    // Load invitations
    const { data: invitationsData } = await supabase
      .from('rfq_invitations')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('sent_at', { ascending: false });

    setInvitations(invitationsData || []);

    setLoading(false);
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
      <div className="tracking-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const sentCount = invitations.filter(i => i.status === 'sent').length;
  const openedCount = invitations.filter(i => i.status === 'opened').length;
  const submittedCount = invitations.filter(i => i.status === 'submitted').length;

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
          <div className="tracking-container">
            {/* Header */}
            <div className="tracking-header">
              <div>
                <h1 className="tracking-title">Track Partner Responses</h1>
                <p className="tracking-subtitle">
                  {rfq?.rfq_number} - {rfq?.insurance_products?.name}
                </p>
              </div>
              <Button variant="secondary" onClick={() => router.push('/rfqs')}>
                Back to Bid Centre
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="tracking-stats">
              <Card className="stat-card">
                <div className="stat-icon sent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </div>
                <div className="stat-number">{sentCount}</div>
                <div className="stat-label">Invitations Sent</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon opened">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="stat-number">{openedCount}</div>
                <div className="stat-label">Opened</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon submitted">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="stat-number">{submittedCount}</div>
                <div className="stat-label">Quotes Received</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon total">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="stat-number">{invitations.length}</div>
                <div className="stat-label">Total Invitations</div>
              </Card>
            </div>

            {/* Invitations List */}
            <Card>
              <h3>Invitation Status</h3>

              {invitations.length === 0 ? (
                <div className="empty-state">
                  <p>No invitations have been sent yet.</p>
                  <Button onClick={() => router.push(`/rfq/${rfqId}/distribute`)}>
                    Send Bid to Partners
                  </Button>
                </div>
              ) : (
                <div className="invitations-list">
                  {invitations.map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-email">
                        {invitation.external_email}
                      </div>
                      <div className={`invitation-status status-${invitation.status}`}>
                        {invitation.status === 'sent' && 'Sent'}
                        {invitation.status === 'opened' && 'Opened'}
                        {invitation.status === 'submitted' && 'Quote Submitted'}
                        {invitation.status === 'expired' && 'Expired'}
                      </div>
                      <div className="invitation-date">
                        {new Date(invitation.sent_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Coming Soon Notice */}
            <Card className="coming-soon-card">
              <div className="coming-soon-content">
                <h4>Week 2 Features Coming Soon</h4>
                <ul>
                  <li>Real-time email delivery status</li>
                  <li>Link open tracking</li>
                  <li>Resend invitations to specific recipients</li>
                  <li>Automated reminder emails</li>
                  <li>CSV export of tracking data</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
