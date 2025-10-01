'use client';

/**
 * Page: Dashboard
 * Purpose: Main landing page after authentication
 * Shows: Welcome message, quick actions, recent RFQs
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import Container from '@sanctuari/ui/components/Container/Container';
import Card from '@sanctuari/ui/components/Card/Card';
import Button from '@sanctuari/ui/components/Button/Button';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { user: currentUser } = await getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Get user's company
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id, companies(*)')
        .eq('user_id', currentUser.id)
        .single();

      if (memberData) {
        setCompany(memberData.companies);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <Container>
          <div className="dashboard-header__content">
            <h1 className="dashboard-header__brand">Sanctuari</h1>
            <Button variant="ghost" size="small" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </Container>
      </div>

      <Container className="dashboard-content">
        <div className="dashboard-welcome">
          <h2 className="dashboard-welcome__title">
            Welcome{company ? ` to ${company.name}` : ''}
          </h2>
          <p className="dashboard-welcome__subtitle">
            You're all set! Here's what you can do next:
          </p>
        </div>

        <div className="dashboard-grid">
          <Card
            title="Create your first RFQ"
            subtitle="Get started by creating a Request for Quote"
            status="active"
          >
            <p className="dashboard-card__text">
              Create an RFQ for any insurance product and distribute it to
              verified insurers and brokers across India.
            </p>
            <Button variant="primary" size="medium">
              Create RFQ
            </Button>
          </Card>

          <Card
            title="Explore the Network"
            subtitle="Browse verified insurance partners"
          >
            <p className="dashboard-card__text">
              Discover trusted insurers and brokers in the Sanctuari network
              who can provide quotes for your needs.
            </p>
            <Button variant="secondary" size="medium">
              View Partners
            </Button>
          </Card>

          <Card
            title="Company Settings"
            subtitle="Manage your organization profile"
          >
            <p className="dashboard-card__text">
              Update your company information, add team members, and configure
              preferences.
            </p>
            <Button variant="secondary" size="medium">
              Settings
            </Button>
          </Card>
        </div>

        <div className="dashboard-info">
          <Card>
            <div className="dashboard-info__content">
              <h3>Your first RFQ is free</h3>
              <p>
                Try Sanctuari with no commitment. Create your first RFQ, get
                quotes, and experience AI-powered quote comparison at no cost.
              </p>
              <p className="dashboard-info__pricing">
                Subsequent RFQs: ₹1,599 per placement
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
