'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navigation from '@/components/platform/Navigation'

interface RFQ {
  id: string
  rfq_number: string
  product_type: string
  status: string
  created_at: string
  submission_deadline?: string
  form_data: any
}

export default function RFQsPage() {
  const { user } = useAuth()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchRFQs()
    }
  }, [user, filter])

  const fetchRFQs = async () => {
    if (!user?.id) return

    try {
      let query = supabase
        .from('rfqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setRfqs(data || [])
    } catch (error) {
      console.error('Error fetching RFQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active'
      case 'draft': return 'status-draft'
      case 'closed': return 'status-closed'
      case 'awarded': return 'status-awarded'
      default: return 'status-default'
    }
  }

  const formatProductType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="page-container">
          <div className="loading-state">Loading your RFQs...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>My RFQs</h1>
            <p>Manage your insurance procurement requests</p>
          </div>
          <Link href="/platform/rfq/create" className="btn-primary">
            Create New RFQ
          </Link>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All RFQs ({rfqs.length})
          </button>
          <button
            className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Drafts
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-tab ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
        </div>

        {rfqs.length > 0 ? (
          <div className="rfqs-grid">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="rfq-card">
                <div className="rfq-header">
                  <div className="rfq-info">
                    <h3>{rfq.rfq_number}</h3>
                    <p className="rfq-product">{formatProductType(rfq.product_type)}</p>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(rfq.status)}`}>
                    {rfq.status}
                  </span>
                </div>

                <div className="rfq-meta">
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">
                      {new Date(rfq.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rfq.submission_deadline && (
                    <div className="meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-value">
                        {new Date(rfq.submission_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rfq-actions">
                  <Link href={`/platform/bid-centre/${rfq.id}`} className="btn-outline">
                    View Bids
                  </Link>
                  {rfq.status === 'draft' && (
                    <Link href={`/platform/rfq/${rfq.id}/edit`} className="btn-secondary">
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon icon-document"></div>
            <h3>No RFQs found</h3>
            <p>
              {filter === 'all'
                ? "You haven't created any RFQs yet"
                : `No ${filter} RFQs found`}
            </p>
            <Link href="/platform/rfq/create" className="btn-primary">
              Create Your First RFQ
            </Link>
          </div>
        )}

        <style jsx>{`
          .page-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-2xl);
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-2xl);
          }

          .header-content h1 {
            font-size: var(--font-size-3xl);
            margin-bottom: var(--spacing-xs);
            color: var(--color-gray-900);
          }

          .header-content p {
            color: var(--color-gray-600);
            font-size: var(--font-size-lg);
          }

          .filter-tabs {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-xl);
            border-bottom: 1px solid var(--color-gray-200);
          }

          .filter-tab {
            padding: var(--spacing-sm) var(--spacing-lg);
            background: none;
            border: none;
            color: var(--color-gray-600);
            font-weight: 500;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }

          .filter-tab:hover {
            color: var(--color-primary);
          }

          .filter-tab.active {
            color: var(--color-primary);
            border-bottom-color: var(--color-primary);
          }

          .rfqs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: var(--spacing-lg);
          }

          .rfq-card {
            background: var(--color-white);
            border: 1px solid var(--color-gray-200);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            transition: all 0.2s;
          }

          .rfq-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--color-gray-300);
          }

          .rfq-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-md);
          }

          .rfq-info h3 {
            font-size: var(--font-size-lg);
            margin-bottom: var(--spacing-xs);
            color: var(--color-gray-900);
          }

          .rfq-product {
            color: var(--color-primary);
            font-weight: 500;
            font-size: var(--font-size-sm);
          }

          .status-badge {
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-full);
            font-size: var(--font-size-xs);
            font-weight: 600;
            text-transform: uppercase;
          }

          .status-active {
            background: #D1FAE5;
            color: #065F46;
          }

          .status-draft {
            background: #FEF3C7;
            color: #92400E;
          }

          .status-closed {
            background: #DBEAFE;
            color: #1E40AF;
          }

          .status-awarded {
            background: var(--color-primary-light);
            color: var(--color-primary);
          }

          .status-default {
            background: var(--color-gray-200);
            color: var(--color-gray-700);
          }

          .rfq-meta {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-lg);
          }

          .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .meta-label {
            font-size: var(--font-size-sm);
            color: var(--color-gray-600);
          }

          .meta-value {
            font-size: var(--font-size-sm);
            color: var(--color-gray-900);
            font-weight: 500;
          }

          .rfq-actions {
            display: flex;
            gap: var(--spacing-sm);
          }

          .rfq-actions .btn-outline,
          .rfq-actions .btn-secondary {
            flex: 1;
            text-align: center;
            padding: var(--spacing-sm);
            font-size: var(--font-size-sm);
          }

          .empty-state {
            text-align: center;
            padding: var(--spacing-3xl);
            background: var(--color-gray-50);
            border-radius: var(--radius-lg);
            margin-top: var(--spacing-xl);
          }

          .empty-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto var(--spacing-lg);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .empty-icon::before {
            content: '';
            width: 48px;
            height: 48px;
            background-color: var(--color-gray-400);
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
          }

          .empty-icon.icon-document::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3E%3C/svg%3E");
          }

          .empty-state h3 {
            font-size: var(--font-size-xl);
            margin-bottom: var(--spacing-md);
            color: var(--color-gray-900);
          }

          .empty-state p {
            color: var(--color-gray-600);
            margin-bottom: var(--spacing-xl);
          }

          .loading-state {
            text-align: center;
            padding: var(--spacing-3xl);
            color: var(--color-gray-600);
            font-size: var(--font-size-lg);
          }

          @media (max-width: 768px) {
            .page-container {
              padding: var(--spacing-lg);
            }

            .page-header {
              flex-direction: column;
              align-items: flex-start;
              gap: var(--spacing-md);
            }

            .rfqs-grid {
              grid-template-columns: 1fr;
            }

            .filter-tabs {
              overflow-x: auto;
              padding-bottom: var(--spacing-sm);
            }

            .filter-tab {
              white-space: nowrap;
            }
          }
        `}</style>
      </div>
    </>
  )
}