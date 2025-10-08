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
            <li>Real-time email delivery status via Brevo webhooks</li>
            <li>Detailed link open tracking with timestamps</li>
            <li>Resend invitations to specific recipients</li>
            <li>Automated reminder emails before deadline</li>
            <li>CSV export of tracking data for reporting</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
