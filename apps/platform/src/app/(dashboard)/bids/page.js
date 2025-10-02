'use client';

/**
 * Page: Bids
 * Route: /bids
 * Purpose: List all RFQs and their bids (Bid Centre)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import { Sidebar, TopBar, Card, Button, EmptyState } from '@sanctuari/ui';
import './bids.css';

export default function BidsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [bids, setBids] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { user: currentUser } = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // Get user's company
    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .single();

    if (!memberData) {
      router.push('/onboarding/company');
      return;
    }

    // Load RFQs with bidding status
    const { data: rfqData } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (
          name
        )
      `)
      .eq('company_id', memberData.company_id)
      .in('status', ['bidding', 'published', 'draft'])
      .order('created_at', { ascending: false });

    setRfqs(rfqData || []);

    // Load bids for each RFQ
    if (rfqData && rfqData.length > 0) {
      const bidsMap = {};

      for (const rfq of rfqData) {
        const { data: bidData } = await supabase
          .from('bids')
          .select('*')
          .eq('rfq_id', rfq.id);

        bidsMap[rfq.id] = bidData || [];
      }

      setBids(bidsMap);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const handleResumeRFQ = async (rfq) => {
    if (rfq.status === 'draft') {
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('id')
        .eq('rfq_id', rfq.id)
        .limit(1);

      if (!responses || responses.length === 0) {
        router.push(`/rfq/${rfq.id}/upload`);
      } else {
        router.push(`/rfq/${rfq.id}/create`);
      }
    } else {
      router.push(`/rfq/${rfq.id}/distribute`);
    }
  };

  if (loading) {
    return (
      <div className="bids-loading">
        <div className="bids-loading__spinner" />
      </div>
    );
  }

  const draftRfqs = rfqs.filter(r => r.status === 'draft');
  const activeRfqs = rfqs.filter(r => r.status === 'bidding' || r.status === 'published');

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
          <div className="bids-page">
            <div className="bids-header">
              <h1 className="bids-title">Bid Centre</h1>
              <Button onClick={handleCreateRFQ}>Create New RFQ</Button>
            </div>

            {activeRfqs.length === 0 && draftRfqs.length === 0 ? (
              <Card>
                <EmptyState
                  icon={
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  }
                  title="No bids yet"
                  description="Your RFQ bids will appear here once you publish an RFQ and receive quotes from insurers."
                  actionLabel="Create First RFQ"
                  onAction={handleCreateRFQ}
                />
              </Card>
            ) : (
              <>
                {/* Active RFQs with Bidding */}
                {activeRfqs.length > 0 && (
                  <div className="bids-section">
                    <h2 className="bids-section__title">Active RFQs with Bidding</h2>
                    <div className="bids-list">
                      {activeRfqs.map((rfq) => {
                        const rfqBids = bids[rfq.id] || [];
                        const submittedCount = rfqBids.filter(b => b.status === 'submitted').length;

                        return (
                          <Card key={rfq.id} className="bids-card">
                            <div className="bids-card__header">
                              <div className="bids-card__info">
                                <h3 className="bids-card__title">{rfq.title}</h3>
                                <p className="bids-card__product">{rfq.insurance_products?.name}</p>
                              </div>
                              <div className={`bids-card__status bids-card__status--${rfq.status}`}>
                                {rfq.status}
                              </div>
                            </div>

                            <div className="bids-card__meta">
                              <span>RFQ #{rfq.rfq_number}</span>
                              <span>•</span>
                              <span>Published {new Date(rfq.published_at || rfq.created_at).toLocaleDateString()}</span>
                              {rfq.deadline && (
                                <>
                                  <span>•</span>
                                  <span>Deadline {new Date(rfq.deadline).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>

                            <div className="bids-card__stats">
                              <div className="bid-stat">
                                <div className="bid-stat__number">{submittedCount}</div>
                                <div className="bid-stat__label">Bids Received</div>
                              </div>
                              {rfqBids.length > 0 && (
                                <div className="bid-stat">
                                  <div className="bid-stat__number">
                                    {rfqBids[rfqBids.length - 1]?.created_at
                                      ? new Date(rfqBids[rfqBids.length - 1].created_at).toLocaleDateString()
                                      : 'N/A'}
                                  </div>
                                  <div className="bid-stat__label">Last Activity</div>
                                </div>
                              )}
                            </div>

                            {rfqBids.length > 0 && (
                              <div className="bids-card__bidders">
                                <p className="bids-card__bidders-label">Submitted by:</p>
                                <div className="bidder-list">
                                  {rfqBids.slice(0, 3).map((bid, idx) => (
                                    <div key={idx} className="bidder-chip">
                                      {bid.bidder_company_name || bid.bidder_email}
                                    </div>
                                  ))}
                                  {rfqBids.length > 3 && (
                                    <div className="bidder-chip bidder-chip--more">
                                      +{rfqBids.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="bids-card__actions">
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => router.push(`/rfq/${rfq.id}/distribute`)}
                              >
                                View All Bids
                              </Button>
                              {rfqBids.length === 0 && (
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => router.push(`/rfq/${rfq.id}/distribute`)}
                                >
                                  Send Reminder
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Draft RFQs (Not Yet Distributed) */}
                {draftRfqs.length > 0 && (
                  <div className="bids-section">
                    <h2 className="bids-section__title">Draft RFQs (Not Yet Distributed)</h2>
                    <div className="bids-list">
                      {draftRfqs.map((rfq) => (
                        <Card key={rfq.id} className="bids-card">
                          <div className="bids-card__header">
                            <div className="bids-card__info">
                              <h3 className="bids-card__title">{rfq.title}</h3>
                              <p className="bids-card__product">{rfq.insurance_products?.name}</p>
                            </div>
                            <div className="bids-card__status bids-card__status--draft">
                              Draft
                            </div>
                          </div>

                          <div className="bids-card__meta">
                            <span>Created {new Date(rfq.created_at).toLocaleDateString()}</span>
                          </div>

                          <div className="bids-card__actions">
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleResumeRFQ(rfq)}
                            >
                              Continue Editing
                            </Button>
                            <Button
                              variant="danger"
                              size="small"
                              onClick={async () => {
                                if (confirm(`Delete draft "${rfq.title}"?`)) {
                                  await supabase.from('rfqs').delete().eq('id', rfq.id);
                                  loadData();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
