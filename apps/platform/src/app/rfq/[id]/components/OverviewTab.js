/**
 * Component: Overview Tab
 * Purpose: Single-pane-of-glass status view for a bid
 * Features: Bid summary, key metrics, quick actions, recent activity
 */

import { useRouter } from 'next/navigation';
import { Card, Button } from '@sanctuari/ui';

export default function OverviewTab({ rfq, stats, bids, invitations, onTabChange }) {
  const router = useRouter();

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'draft': 'status-draft',
      'published': 'status-published',
      'bidding': 'status-bidding',
      'reviewing': 'status-reviewing',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || '';
  };

  const getRecentActivity = () => {
    const activities = [];

    // Bid created
    activities.push({
      id: 'created',
      type: 'created',
      description: 'Bid created',
      timestamp: rfq.created_at,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      )
    });

    // Bid published
    if (rfq.published_at) {
      activities.push({
        id: 'published',
        type: 'published',
        description: 'Bid published',
        timestamp: rfq.published_at,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )
      });
    }

    // Invitations sent
    if (invitations.length > 0) {
      activities.push({
        id: 'invitations',
        type: 'invitations',
        description: `${invitations.length} invitations sent to partners`,
        timestamp: invitations[0].sent_at,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        )
      });
    }

    // Partner opened
    const openedInvitations = invitations.filter(i => i.opened_at);
    if (openedInvitations.length > 0) {
      activities.push({
        id: 'opened',
        type: 'opened',
        description: `${openedInvitations.length} partners opened the bid`,
        timestamp: openedInvitations[0].opened_at,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )
      });
    }

    // Quotes received
    if (bids.length > 0) {
      const sortedBids = [...bids].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      sortedBids.slice(0, 3).forEach((bid, index) => {
        activities.push({
          id: `bid-${bid.id}`,
          type: 'quote',
          description: `Quote received from ${bid.insurer_name || bid.bidder_company_name}`,
          timestamp: bid.created_at,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          )
        });
      });
    }

    // Sort by most recent
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="overview-tab">
      {/* Top Grid: Bid Summary + Progress */}
      <div className="overview-grid">
        <Card className="summary-card">
          <h3>Bid Details</h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">Bid Number</span>
              <span className="detail-value">{rfq.rfq_number || 'Draft'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Product</span>
              <span className="detail-value">{rfq.insurance_products?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Company</span>
              <span className="detail-value">{rfq.companies?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`status-badge ${getStatusBadgeClass(rfq.status)}`}>
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Deadline</span>
              <span className="detail-value">{formatDate(rfq.deadline)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created</span>
              <span className="detail-value">{formatDate(rfq.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className="progress-card">
          <h3>Progress</h3>
          <div className="progress-steps">
            <div className={`progress-step ${rfq.status !== 'draft' ? 'completed' : 'active'}`}>
              <div className="step-icon">
                {rfq.status !== 'draft' ? '✓' : '1'}
              </div>
              <div className="step-label">Draft Created</div>
            </div>
            <div className={`progress-step ${rfq.status === 'published' || rfq.status === 'bidding' || rfq.status === 'reviewing' || rfq.status === 'completed' ? 'completed' : rfq.status === 'published' ? 'active' : ''}`}>
              <div className="step-icon">
                {rfq.status === 'published' || rfq.status === 'bidding' || rfq.status === 'reviewing' || rfq.status === 'completed' ? '✓' : '2'}
              </div>
              <div className="step-label">Published</div>
            </div>
            <div className={`progress-step ${rfq.status === 'bidding' || rfq.status === 'reviewing' || rfq.status === 'completed' ? 'completed' : rfq.status === 'bidding' ? 'active' : ''}`}>
              <div className="step-icon">
                {rfq.status === 'bidding' || rfq.status === 'reviewing' || rfq.status === 'completed' ? '✓' : '3'}
              </div>
              <div className="step-label">Receiving Quotes</div>
            </div>
            <div className={`progress-step ${rfq.status === 'reviewing' || rfq.status === 'completed' ? 'completed' : rfq.status === 'reviewing' ? 'active' : ''}`}>
              <div className="step-icon">
                {rfq.status === 'reviewing' || rfq.status === 'completed' ? '✓' : '4'}
              </div>
              <div className="step-label">Under Review</div>
            </div>
            <div className={`progress-step ${rfq.status === 'completed' ? 'completed' : ''}`}>
              <div className="step-icon">
                {rfq.status === 'completed' ? '✓' : '5'}
              </div>
              <div className="step-label">Completed</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <Card className="metric-card metric-blue">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div className="metric-value">{stats.invitationsSent}</div>
          <div className="metric-label">Invitations Sent</div>
        </Card>

        <Card className="metric-card metric-purple">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="metric-value">{stats.opened}</div>
          <div className="metric-label">Opened by Partners</div>
        </Card>

        <Card className="metric-card metric-green">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="metric-value">{stats.quotesReceived}</div>
          <div className="metric-label">Quotes Received</div>
        </Card>

        <Card className="metric-card metric-amber">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="metric-value">{stats.daysRemaining !== null ? stats.daysRemaining : '-'}</div>
          <div className="metric-label">Days Until Deadline</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="quick-actions-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {rfq.status === 'draft' && (
            <Button onClick={() => router.push(`/rfq/${rfq.id}/upload`)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              Continue Editing Bid
            </Button>
          )}
          {(rfq.status === 'published' || rfq.status === 'bidding') && invitations.length === 0 && (
            <Button onClick={() => onTabChange('distribution')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send to Partners
            </Button>
          )}
          {stats.quotesReceived > 0 && (
            <Button onClick={() => onTabChange('quotes')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              View {stats.quotesReceived} {stats.quotesReceived === 1 ? 'Quote' : 'Quotes'}
            </Button>
          )}
          {invitations.length > 0 && (
            <Button variant="secondary" onClick={() => onTabChange('tracking')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Track Partner Responses
            </Button>
          )}
          {rfq.pdf_url && (
            <Button variant="secondary" onClick={() => window.open(rfq.pdf_url, '_blank')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Bid PDF
            </Button>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="activity-card">
        <h3>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="no-activity">No activity yet</p>
        ) : (
          <div className="activity-timeline">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
