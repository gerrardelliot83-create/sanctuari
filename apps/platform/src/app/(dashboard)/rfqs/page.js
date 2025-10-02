'use client';

/**
 * Page: Bid Centre
 * Purpose: Show all RFQs with filtering and bid management
 * Features: Filter by status, search, view bids, track invitations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import Sidebar from '@sanctuari/ui/components/Sidebar/Sidebar';
import TopBar from '@sanctuari/ui/components/TopBar/TopBar';
import Card from '@sanctuari/ui/components/Card/Card';
import Button from '@sanctuari/ui/components/Button/Button';
import EmptyState from '@sanctuari/ui/components/EmptyState/EmptyState';
import './rfqs.css';

export default function RFQsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [filteredRfqs, setFilteredRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRfqs();
  }, [activeTab, searchQuery, rfqs]);

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

    setCompanyId(memberData.company_id);

    // Load all RFQs for the company
    const { data: rfqData } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (
          name
        )
      `)
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    setRfqs(rfqData || []);
    setLoading(false);
  };

  const filterRfqs = () => {
    let filtered = [...rfqs];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(rfq => rfq.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rfq =>
        rfq.title?.toLowerCase().includes(query) ||
        rfq.rfq_number?.toLowerCase().includes(query) ||
        rfq.insurance_products?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredRfqs(filtered);
  };

  const handleResumeRFQ = async (rfq) => {
    if (rfq.status === 'draft') {
      // Draft RFQs: Resume editing
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
    } else if (rfq.status === 'published') {
      // Published but not yet distributed: Go to distribute page
      router.push(`/rfq/${rfq.id}/distribute`);
    } else if (rfq.status === 'bidding') {
      // Bidding RFQs: Go to tracking page to view invitations and bids
      router.push(`/rfq/${rfq.id}/tracking`);
    } else {
      // Completed/Cancelled: Go to review page
      router.push(`/rfq/${rfq.id}/review`);
    }
  };

  const handleDeleteDraft = async (rfq, e) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete draft "${rfq.title}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('rfqs')
      .delete()
      .eq('id', rfq.id);

    if (!error) {
      setRfqs(rfqs.filter(r => r.id !== rfq.id));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const getStatusCounts = () => {
    return {
      all: rfqs.length,
      draft: rfqs.filter(r => r.status === 'draft').length,
      published: rfqs.filter(r => r.status === 'published').length,
      bidding: rfqs.filter(r => r.status === 'bidding').length,
      completed: rfqs.filter(r => r.status === 'completed').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="rfqs-loading">
        <div className="rfqs-loading__spinner" />
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
          <div className="rfqs-page">
            {/* Header */}
            <div className="rfqs-header">
              <h1 className="rfqs-title">Bid Centre</h1>
              <Button onClick={handleCreateRFQ}>Create New RFQ</Button>
            </div>

            {/* Search Bar */}
            <div className="rfqs-search">
              <input
                type="search"
                placeholder="Search by RFQ number, product, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rfqs-search__input"
              />
            </div>

            {/* Tabs */}
            <div className="rfqs-tabs">
              <button
                className={`rfqs-tab ${activeTab === 'all' ? 'rfqs-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({statusCounts.all})
              </button>
              <button
                className={`rfqs-tab ${activeTab === 'draft' ? 'rfqs-tab--active' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                Drafts ({statusCounts.draft})
              </button>
              <button
                className={`rfqs-tab ${activeTab === 'published' ? 'rfqs-tab--active' : ''}`}
                onClick={() => setActiveTab('published')}
              >
                Published ({statusCounts.published})
              </button>
              <button
                className={`rfqs-tab ${activeTab === 'bidding' ? 'rfqs-tab--active' : ''}`}
                onClick={() => setActiveTab('bidding')}
              >
                Bidding ({statusCounts.bidding})
              </button>
              <button
                className={`rfqs-tab ${activeTab === 'completed' ? 'rfqs-tab--active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed ({statusCounts.completed})
              </button>
            </div>

            {/* RFQ List */}
            <div className="rfqs-list">
              {filteredRfqs.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    }
                    title={searchQuery ? 'No matching RFQs' : `No ${activeTab === 'all' ? '' : activeTab} RFQs`}
                    description={searchQuery ? 'Try adjusting your search' : 'Create your first RFQ to get started'}
                    actionLabel={searchQuery ? 'Clear Search' : 'Create RFQ'}
                    onAction={searchQuery ? () => setSearchQuery('') : handleCreateRFQ}
                  />
                </Card>
              ) : (
                filteredRfqs.map((rfq) => (
                  <Card
                    key={rfq.id}
                    className="rfqs-card"
                    onClick={() => handleResumeRFQ(rfq)}
                  >
                    <div className="rfqs-card__header">
                      <div className="rfqs-card__info">
                        <h3 className="rfqs-card__title">{rfq.title}</h3>
                        <p className="rfqs-card__product">{rfq.insurance_products?.name}</p>
                      </div>
                      <div className={`rfqs-card__status rfqs-card__status--${rfq.status}`}>
                        {rfq.status}
                      </div>
                    </div>

                    <div className="rfqs-card__meta">
                      <span>RFQ #{rfq.rfq_number || 'Draft'}</span>
                      <span>•</span>
                      <span>Created {new Date(rfq.created_at).toLocaleDateString()}</span>
                      {rfq.deadline && (
                        <>
                          <span>•</span>
                          <span>Deadline {new Date(rfq.deadline).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    <div className="rfqs-card__actions" onClick={(e) => e.stopPropagation()}>
                      {rfq.status === 'draft' ? (
                        <>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleResumeRFQ(rfq)}
                          >
                            Continue Editing
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={(e) => handleDeleteDraft(rfq, e)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : rfq.status === 'bidding' ? (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => router.push(`/rfq/${rfq.id}/tracking`)}
                        >
                          View Bids
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => router.push(`/rfq/${rfq.id}/review`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
