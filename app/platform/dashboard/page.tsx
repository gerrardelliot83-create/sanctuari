'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navigation from '@/components/platform/Navigation'

interface DashboardStats {
  totalRFQs: number
  activeRFQs: number
  totalQuotes: number
  savedAmount: number
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalRFQs: 0,
    activeRFQs: 0,
    totalQuotes: 0,
    savedAmount: 0
  })
  const [recentRFQs, setRecentRFQs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user?.id) return

    try {
      // Fetch RFQs
      const { data: rfqs, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (rfqError) throw rfqError

      setRecentRFQs(rfqs || [])

      // Calculate stats
      const totalRFQs = rfqs?.length || 0
      const activeRFQs = rfqs?.filter((r: any) => r.status === 'active').length || 0

      // Fetch quotes count
      const rfqIds = rfqs?.map((r: any) => r.id) || []
      const { count: quotesCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .in('rfq_id', rfqIds)

      setStats({
        totalRFQs,
        activeRFQs,
        totalQuotes: quotesCount || 0,
        savedAmount: 0 // Calculate based on quotes comparison
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success'
      case 'draft': return 'badge-warning'
      case 'closed': return 'badge-info'
      case 'awarded': return 'badge-primary'
      default: return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="loading-container">Loading dashboard...</div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Welcome back, {profile?.contact_person || 'User'}</h1>
            <p className="subtitle">{profile?.company_name}</p>
          </div>
          <Link href="/platform/rfq/create" className="btn-primary">
            Create New RFQ
          </Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon icon-document"></div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalRFQs}</span>
              <span className="stat-label">Total RFQs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-clock"></div>
            <div className="stat-content">
              <span className="stat-value">{stats.activeRFQs}</span>
              <span className="stat-label">Active RFQs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-chart"></div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalQuotes}</span>
              <span className="stat-label">Quotes Received</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-currency"></div>
            <div className="stat-content">
              <span className="stat-value">₹{stats.savedAmount.toLocaleString()}</span>
              <span className="stat-label">Amount Saved</span>
            </div>
          </div>
        </div>

        <div className="recent-section">
          <div className="section-header">
            <h2>Recent RFQs</h2>
            <Link href="/platform/rfqs" className="link-primary">View All</Link>
          </div>

          {recentRFQs.length > 0 ? (
            <div className="rfq-list">
              {recentRFQs.map((rfq) => (
                <div key={rfq.id} className="rfq-card">
                  <div className="rfq-info">
                    <h3>{rfq.rfq_number}</h3>
                    <p className="rfq-type">{rfq.product_type?.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="rfq-date">Created: {new Date(rfq.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="rfq-actions">
                    <span className={`badge ${getStatusBadgeClass(rfq.status)}`}>
                      {rfq.status}
                    </span>
                    <Link href={`/platform/bid-centre/${rfq.id}`} className="btn-outline">
                      View Bids
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No RFQs created yet</p>
              <Link href="/platform/rfq/create" className="btn-primary">
                Create Your First RFQ
              </Link>
            </div>
          )}
        </div>

        <style jsx>{`
          .dashboard-container {
            padding: var(--spacing-2xl);
            max-width: 1200px;
            margin: 0 auto;
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-2xl);
          }

          .header-content h1 {
            font-size: var(--font-size-3xl);
            margin-bottom: var(--spacing-xs);
          }

          .subtitle {
            color: var(--color-gray-600);
            font-size: var(--font-size-lg);
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-3xl);
          }

          .stat-card {
            background: var(--color-white);
            border: 1px solid var(--color-gray-200);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .stat-icon {
            width: 60px;
            height: 60px;
            background: var(--color-primary-light);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .stat-icon::before {
            content: '';
            width: 24px;
            height: 24px;
            background-color: var(--color-primary);
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
          }

          .icon-document::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3E%3C/svg%3E");
          }

          .icon-clock::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E");
          }

          .icon-chart::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'/%3E%3C/svg%3E");
          }

          .icon-currency::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E");
          }

          .stat-content {
            display: flex;
            flex-direction: column;
          }

          .stat-value {
            font-size: var(--font-size-2xl);
            font-weight: 700;
            color: var(--color-gray-900);
          }

          .stat-label {
            font-size: var(--font-size-sm);
            color: var(--color-gray-600);
          }

          .recent-section {
            background: var(--color-white);
            border: 1px solid var(--color-gray-200);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-lg);
          }

          .section-header h2 {
            font-size: var(--font-size-xl);
            margin: 0;
          }

          .link-primary {
            color: var(--color-primary);
            font-size: var(--font-size-sm);
          }

          .rfq-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .rfq-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            background: var(--color-gray-50);
            border-radius: var(--radius-md);
            transition: background-color 0.2s;
          }

          .rfq-card:hover {
            background: var(--color-gray-100);
          }

          .rfq-info h3 {
            font-size: var(--font-size-lg);
            margin-bottom: var(--spacing-xs);
            color: var(--color-gray-900);
          }

          .rfq-type {
            font-size: var(--font-size-sm);
            color: var(--color-primary);
            font-weight: 500;
            margin-bottom: var(--spacing-xs);
          }

          .rfq-date {
            font-size: var(--font-size-xs);
            color: var(--color-gray-500);
          }

          .rfq-actions {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
          }

          .badge {
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-full);
            font-size: var(--font-size-xs);
            font-weight: 500;
            text-transform: uppercase;
          }

          .badge-success {
            background: #D1FAE5;
            color: #065F46;
          }

          .badge-warning {
            background: #FEF3C7;
            color: #92400E;
          }

          .badge-info {
            background: #DBEAFE;
            color: #1E40AF;
          }

          .badge-primary {
            background: var(--color-primary-light);
            color: var(--color-primary);
          }

          .badge-secondary {
            background: var(--color-gray-200);
            color: var(--color-gray-700);
          }

          .empty-state {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-lg);
          }

          .empty-state p {
            color: var(--color-gray-600);
            margin-bottom: var(--spacing-lg);
          }

          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            font-size: var(--font-size-lg);
            color: var(--color-gray-600);
          }

          @media (max-width: 768px) {
            .dashboard-container {
              padding: var(--spacing-lg);
            }

            .dashboard-header {
              flex-direction: column;
              align-items: flex-start;
              gap: var(--spacing-md);
            }

            .stats-grid {
              grid-template-columns: 1fr;
            }

            .rfq-card {
              flex-direction: column;
              align-items: flex-start;
              gap: var(--spacing-md);
            }
          }
        `}</style>
      </div>
    </>
  )
}