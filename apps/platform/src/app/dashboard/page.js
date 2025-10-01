'use client';

/**
 * Page: Dashboard
 * Purpose: Main landing page after authentication
 * Shows: Company overview, quick actions, RFQ list
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
import CompanySwitcher from '@sanctuari/ui/components/CompanySwitcher/CompanySwitcher';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { user: currentUser } = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Load user's companies
      const { data: memberData } = await supabase
        .from('company_members')
        .select(`
          company_id,
          role,
          companies (
            id,
            name,
            industry,
            logo_url
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'active');

      if (memberData && memberData.length > 0) {
        const userCompanies = memberData.map(m => m.companies);
        setCompanies(userCompanies);
        setCurrentCompanyId(userCompanies[0].id);

        // Load RFQs for first company
        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('*')
          .eq('company_id', userCompanies[0].id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRfqs(rfqData || []);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const handleSwitchCompany = async (companyId) => {
    setCurrentCompanyId(companyId);

    // Reload RFQs for selected company
    const { data: rfqData } = await supabase
      .from('rfqs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    setRfqs(rfqData || []);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__spinner" />
      </div>
    );
  }

  const currentCompany = companies.find(c => c.id === currentCompanyId);

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
          <div className="dashboard-page">
            {/* Company Switcher */}
            {companies.length > 0 && (
              <div className="dashboard-company-section">
                <CompanySwitcher
                  companies={companies}
                  currentCompanyId={currentCompanyId}
                  onSwitch={handleSwitchCompany}
                  onAddCompany={() => router.push('/onboarding/company')}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="dashboard-stats">
              <Card className="dashboard-stat-card">
                <div className="dashboard-stat">
                  <div className="dashboard-stat__label">Active RFQs</div>
                  <div className="dashboard-stat__value">
                    {rfqs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length}
                  </div>
                </div>
              </Card>

              <Card className="dashboard-stat-card">
                <div className="dashboard-stat">
                  <div className="dashboard-stat__label">Total Bids</div>
                  <div className="dashboard-stat__value">0</div>
                </div>
              </Card>

              <Card className="dashboard-stat-card">
                <div className="dashboard-stat">
                  <div className="dashboard-stat__label">Completed</div>
                  <div className="dashboard-stat__value">
                    {rfqs.filter(r => r.status === 'completed').length}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent RFQs */}
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h2 className="dashboard-section-title">Recent RFQs</h2>
                {rfqs.length > 0 && (
                  <Button variant="ghost" size="small" onClick={() => router.push('/rfqs')}>
                    View all
                  </Button>
                )}
              </div>

              {rfqs.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 8C10 6.89543 10.8954 6 12 6H22L30 14V32C30 33.1046 29.1046 34 28 34H12C10.8954 34 10 33.1046 10 32V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6V14H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 20H24M16 26H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    }
                    title="No RFQs yet"
                    description={`Create your first RFQ for ${currentCompany?.name || 'your company'} to get started. Choose from 60 insurance products and get AI-powered quote comparisons.`}
                    actionLabel="Create RFQ"
                    onAction={handleCreateRFQ}
                  />
                </Card>
              ) : (
                <div className="dashboard-rfq-list">
                  {rfqs.map((rfq) => (
                    <Card key={rfq.id} className="dashboard-rfq-card">
                      <div className="dashboard-rfq">
                        <div className="dashboard-rfq__header">
                          <div className="dashboard-rfq__title">{rfq.title}</div>
                          <div className={`dashboard-rfq__status dashboard-rfq__status--${rfq.status}`}>
                            {rfq.status}
                          </div>
                        </div>
                        {rfq.description && (
                          <div className="dashboard-rfq__description">{rfq.description}</div>
                        )}
                        <div className="dashboard-rfq__meta">
                          <span>RFQ #{rfq.rfq_number}</span>
                          <span>•</span>
                          <span>{new Date(rfq.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2 className="dashboard-section-title">Quick Actions</h2>
              <div className="dashboard-actions">
                <Card className="dashboard-action-card">
                  <div className="dashboard-action">
                    <div className="dashboard-action__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10L7 21M12 6V21M17 14V21M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="dashboard-action__content">
                      <div className="dashboard-action__title">View Analytics</div>
                      <div className="dashboard-action__description">Track your RFQ performance</div>
                    </div>
                    <Button variant="ghost" size="small">View</Button>
                  </div>
                </Card>

                <Card className="dashboard-action-card">
                  <div className="dashboard-action">
                    <div className="dashboard-action__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="dashboard-action__content">
                      <div className="dashboard-action__title">Invite Team</div>
                      <div className="dashboard-action__description">Add team members to collaborate</div>
                    </div>
                    <Button variant="ghost" size="small">Invite</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
