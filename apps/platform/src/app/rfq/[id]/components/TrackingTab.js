/**
 * Component: Tracking Tab
 * Purpose: Track invitation status, email delivery, and quote submissions
 * Features: Real-time status, invitation list, stats overview
 * Migrated from: /rfq/[id]/tracking/page.js
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { Card, Button } from '@sanctuari/ui';
import '../tracking/tracking.css';

export default function TrackingTab({ rfqId, rfqData, invitations: initialInvitations, onViewQuotes }) {
  const router = useRouter();
  const supabase = createClient();

  const [invitations, setInvitations] = useState(initialInvitations || []);
  const [resending, setResending] = useState(null); // Track which invitation is being resent

  useEffect(() => {
    // Set up real-time subscription for invitation updates
    const channel = supabase
      .channel('rfq_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfq_invitations',
          filter: `rfq_id=eq.${rfqId}`
        },
        (payload) => {
          console.log('Invitation update:', payload);
          // Reload invitations when changes occur
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rfqId]);

  const loadInvitations = async () => {
    const { data: invitationsData } = await supabase
      .from('rfq_invitations')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('sent_at', { ascending: false });

    if (invitationsData) {
      setInvitations(invitationsData);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    if (!confirm('Resend invitation to this partner?')) {
      return;
    }

    setResending(invitationId);

    try {
      const response = await fetch(`/api/rfq/${rfqId}/resend-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      alert(`Invitation resent successfully to ${data.email}`);
      // Reload invitations to show updated sent_at time
      await loadInvitations();

    } catch (error) {
      console.error('Error resending invitation:', error);
      alert(`Failed to resend invitation: ${error.message}`);
    } finally {
      setResending(null);
    }
  };

  const sentCount = invitations.filter(i => i.status === 'sent').length;
  const openedCount = invitations.filter(i => i.status === 'opened').length;
  const submittedCount = invitations.filter(i => i.status === 'submitted').length;

  return (
    <div className="tracking-tab">
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

      {/* Call to Action for Quotes */}
      {submittedCount > 0 && onViewQuotes && (
        <Card className="cta-card">
          <div className="cta-content">
            <div className="cta-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="cta-text">
              <h3>{submittedCount} {submittedCount === 1 ? 'Quote' : 'Quotes'} Received!</h3>
              <p>You have new quotes ready to review and compare.</p>
            </div>
            <Button onClick={onViewQuotes}>
              View Quotes
            </Button>
          </div>
        </Card>
      )}

      {/* Invitations List */}
      <Card>
        <h3>Invitation Status</h3>

        {invitations.length === 0 ? (
          <div className="empty-state">
            <p>No invitations have been sent yet.</p>
            <Button onClick={() => router.push(`/rfq/${rfqId}?tab=distribution`)}>
              Send Bid to Partners
            </Button>
          </div>
        ) : (
          <div className="invitations-list">
            {invitations.map(invitation => (
              <div key={invitation.id} className="invitation-item">
                <div className="invitation-main">
                  <div className="invitation-info-group">
                    <div className="invitation-email">
                      {invitation.external_email}
                    </div>
                    <div className={`invitation-status status-${invitation.status}`}>
                      {invitation.status === 'sent' && 'Sent'}
                      {invitation.status === 'opened' && 'Opened'}
                      {invitation.status === 'submitted' && 'Quote Submitted'}
                      {invitation.status === 'expired' && (invitation.bounce_reason || 'Expired')}
                    </div>
                  </div>
                  {invitation.status !== 'submitted' && invitation.status !== 'expired' && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={resending === invitation.id}
                    >
                      {resending === invitation.id ? 'Sending...' : 'Resend'}
                    </Button>
                  )}
                </div>

                {/* Detailed Tracking Timeline */}
                <div className="invitation-timeline">
                  <div className="timeline-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    <span>Sent {new Date(invitation.sent_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>

                  {invitation.delivered_at && (
                    <div className="timeline-item delivered">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Delivered {new Date(invitation.delivered_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}

                  {invitation.opened_at && (
                    <div className="timeline-item opened">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span>Opened {new Date(invitation.opened_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}

                  {invitation.clicked_at && (
                    <div className="timeline-item clicked">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <span>Clicked link {new Date(invitation.clicked_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}

                  {invitation.submitted_at && (
                    <div className="timeline-item submitted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>Quote submitted {new Date(invitation.submitted_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}

                  {invitation.bounce_reason && (
                    <div className="timeline-item bounced">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>{invitation.bounce_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
