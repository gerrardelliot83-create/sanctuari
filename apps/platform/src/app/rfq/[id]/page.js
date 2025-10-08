'use client';

/**
 * Page: Bid Command Center
 * Route: /rfq/[id]
 * Purpose: Unified interface for managing a single bid
 * Features: Tab navigation, Overview, Quotes, Distribution, Tracking
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import { Sidebar, TopBar } from '@sanctuari/ui';
import TabNavigation from './components/TabNavigation';
import OverviewTab from './components/OverviewTab';
import QuotesTab from './components/QuotesTab';
import DistributionTab from './components/DistributionTab';
import TrackingTab from './components/TrackingTab';
import CommunicationTab from './components/CommunicationTab';
import './command-center.css';

export default function BidCommandCenter({ params }) {
  const [rfqId, setRfqId] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(p => setRfqId(p.id));
  }, [params]);

  if (!rfqId) {
    return (
      <div className="command-center-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <CommandCenterClient rfqId={rfqId} />;
}

function CommandCenterClient({ rfqId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [bids, setBids] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  useEffect(() => {
    // Set active tab from URL or calculate smart default
    const tabParam = searchParams.get('tab');
    if (tabParam && isValidTab(tabParam)) {
      setActiveTab(tabParam);
    } else if (rfq) {
      setActiveTab(getDefaultTab(rfq, bids.length, invitations.length));
    }
  }, [searchParams, rfq, bids, invitations]);

  const loadData = async () => {
    const { user: currentUser } = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // Load bid with all related data
    const { data: rfqData, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name),
        companies (name),
        bids (
          *,
          bid_documents (*)
        ),
        rfq_invitations (*)
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError) {
      console.error('Error loading bid:', rfqError);
      router.push('/rfqs');
      return;
    }

    setRfq(rfqData);
    setBids(rfqData.bids || []);
    setInvitations(rfqData.rfq_invitations || []);
    setLoading(false);
  };

  const isValidTab = (tab) => {
    return ['overview', 'quotes', 'distribution', 'tracking', 'communication'].includes(tab);
  };

  const getDefaultTab = (rfqData, bidsCount, invitationsCount) => {
    // If draft, show overview
    if (rfqData.status === 'draft') return 'overview';

    // If no invitations sent, show distribution
    if (invitationsCount === 0) return 'distribution';

    // If quotes received, show quotes
    if (bidsCount > 0) return 'quotes';

    // If invitations sent but no quotes, show tracking
    if (invitationsCount > 0) return 'tracking';

    // Default
    return 'overview';
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/rfq/${rfqId}?tab=${newTab}`, { scroll: false });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  if (loading || !activeTab) {
    return (
      <div className="command-center-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Calculate stats for badges
  const stats = {
    quotesCount: bids.length,
    newResponses: invitations.filter(i => i.status === 'submitted').length,
    invitationsSent: invitations.length,
    opened: invitations.filter(i => i.status === 'opened' || i.status === 'submitted').length,
    quotesReceived: bids.length,
    daysRemaining: rfq.deadline ? Math.ceil((new Date(rfq.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
  };

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
          <div className="command-center-container">
            {/* Header */}
            <div className="command-center-header">
              <div>
                <h1 className="command-center-title">
                  {rfq.rfq_number || 'Draft Bid'}
                </h1>
                <p className="command-center-subtitle">
                  {rfq.insurance_products?.name} - {rfq.companies?.name}
                </p>
              </div>
              <div className="command-center-header-actions">
                <button
                  className="back-button"
                  onClick={() => router.push('/rfqs')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Back to Bid Centre
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              bidData={stats}
            />

            {/* Tab Content */}
            <div className="command-center-content">
              {activeTab === 'overview' && (
                <OverviewTab
                  rfq={rfq}
                  stats={stats}
                  bids={bids}
                  invitations={invitations}
                  onTabChange={handleTabChange}
                />
              )}

              {activeTab === 'quotes' && (
                <QuotesTab
                  rfqId={rfqId}
                  rfqData={rfq}
                  bids={bids}
                />
              )}

              {activeTab === 'distribution' && (
                <DistributionTab
                  rfqId={rfqId}
                  rfqData={rfq}
                  onDistributionComplete={() => handleTabChange('tracking')}
                />
              )}

              {activeTab === 'tracking' && (
                <TrackingTab
                  rfqId={rfqId}
                  rfqData={rfq}
                  invitations={invitations}
                  onViewQuotes={() => handleTabChange('quotes')}
                />
              )}

              {activeTab === 'communication' && (
                <CommunicationTab
                  rfqId={rfqId}
                  rfqData={rfq}
                  invitations={invitations}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
