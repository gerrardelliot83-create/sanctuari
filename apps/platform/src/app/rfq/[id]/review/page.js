'use client';

/**
 * Page: Bid Review/Comparison
 * Route: /rfq/[id]/review
 * Purpose: View and compare all submitted bids for an RFQ
 * Features: Table/card view, stats, comparison, document download
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser, signOut } from '@sanctuari/database/lib/auth';
import { Sidebar, TopBar, Card, Button } from '@sanctuari/ui';
import './review.css';

export default function ReviewPage({ params }) {
  const [rfqId, setRfqId] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(p => setRfqId(p.id));
  }, [params]);

  if (!rfqId) {
    return (
      <div className="review-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <ReviewPageClient rfqId={rfqId} />;
}

function ReviewPageClient({ rfqId }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'premium_amount', 'coverage_amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  const loadData = async () => {
    const { user: currentUser } = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // Load RFQ with all bids and documents
    const { data: rfqData, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name),
        companies (name),
        bids (
          *,
          bid_documents (*)
        )
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError) {
      console.error('Error loading RFQ:', rfqError);
      router.push('/rfqs');
      return;
    }

    setRfq(rfqData);
    setBids(rfqData.bids || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateRFQ = () => {
    router.push('/rfq/create');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortedBids = () => {
    const sorted = [...bids].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle null values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // For dates
      if (sortBy === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  };

  const toggleComparisonSelection = (bid) => {
    if (selectedForComparison.find(b => b.id === bid.id)) {
      setSelectedForComparison(selectedForComparison.filter(b => b.id !== bid.id));
    } else {
      if (selectedForComparison.length < 3) {
        setSelectedForComparison([...selectedForComparison, bid]);
      } else {
        alert('You can compare up to 3 bids at a time');
      }
    }
  };

  const handleDownloadDocument = (fileUrl, fileName) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownloadAllDocuments = (bid) => {
    bid.bid_documents.forEach(doc => {
      setTimeout(() => {
        window.open(doc.file_url, '_blank');
      }, 500);
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const getStats = () => {
    if (bids.length === 0) {
      return {
        totalBids: 0,
        lowestPremium: null,
        highestCoverage: null,
        averagePremium: null
      };
    }

    const validPremiums = bids.filter(b => b.premium_amount).map(b => b.premium_amount);
    const validCoverages = bids.filter(b => b.coverage_amount).map(b => b.coverage_amount);

    return {
      totalBids: bids.length,
      lowestPremium: validPremiums.length > 0 ? Math.min(...validPremiums) : null,
      highestCoverage: validCoverages.length > 0 ? Math.max(...validCoverages) : null,
      averagePremium: validPremiums.length > 0
        ? validPremiums.reduce((a, b) => a + b, 0) / validPremiums.length
        : null
    };
  };

  if (loading) {
    return (
      <div className="review-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const stats = getStats();
  const sortedBids = getSortedBids();

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
          <div className="review-container">
            {/* Header */}
            <div className="review-header">
              <div>
                <h1 className="review-title">Bid Review</h1>
                <p className="review-subtitle">
                  {rfq?.rfq_number} - {rfq?.insurance_products?.name}
                </p>
              </div>
              <div className="review-header-actions">
                <Button variant="secondary" onClick={() => router.push('/rfqs')}>
                  Back to Bid Centre
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="review-stats">
              <Card className="stat-card">
                <div className="stat-icon total">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="stat-number">{stats.totalBids}</div>
                <div className="stat-label">Total Bids</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon lowest">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                  </svg>
                </div>
                <div className="stat-number">{stats.lowestPremium ? formatCurrency(stats.lowestPremium) : '-'}</div>
                <div className="stat-label">Lowest Premium</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon highest">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                </div>
                <div className="stat-number">{stats.highestCoverage ? formatCurrency(stats.highestCoverage) : '-'}</div>
                <div className="stat-label">Highest Coverage</div>
              </Card>

              <Card className="stat-card">
                <div className="stat-icon average">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="12" y1="3" x2="12" y2="21"/>
                  </svg>
                </div>
                <div className="stat-number">{stats.averagePremium ? formatCurrency(stats.averagePremium) : '-'}</div>
                <div className="stat-label">Average Premium</div>
              </Card>
            </div>

            {/* View Controls */}
            {bids.length > 0 && (
              <Card className="view-controls">
                <div className="controls-row">
                  <div className="view-mode-toggle">
                    <button
                      className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Table View
                    </button>
                    <button
                      className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setViewMode('cards')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="7" rx="2"/>
                        <rect x="3" y="14" width="18" height="7" rx="2"/>
                      </svg>
                      Card View
                    </button>
                  </div>

                  <div className="sort-controls">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="created_at">Date Submitted</option>
                      <option value="premium_amount">Premium Amount</option>
                      <option value="coverage_amount">Coverage Amount</option>
                    </select>
                    <button className="sort-order-btn" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="19" x2="12" y2="5"/>
                          <polyline points="5 12 12 5 19 12"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <polyline points="19 12 12 19 5 12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {selectedForComparison.length > 0 && (
                  <div className="comparison-bar">
                    <span>{selectedForComparison.length} bids selected for comparison</span>
                    <div className="comparison-actions">
                      <Button size="small" onClick={() => setSelectedForComparison([])}>
                        Clear Selection
                      </Button>
                      {selectedForComparison.length >= 2 && (
                        <Button size="small">
                          View Comparison Below
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Empty State */}
            {bids.length === 0 ? (
              <Card>
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="8" width="18" height="4" rx="1"/>
                      <path d="M12 8v13"/>
                      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
                    </svg>
                  </div>
                  <h3>No Bids Submitted Yet</h3>
                  <p>Once insurers and brokers submit their quotes, they will appear here.</p>
                  <Button onClick={() => router.push(`/rfq/${rfqId}/tracking`)}>
                    View Distribution Status
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {/* Table View */}
                {viewMode === 'table' && (
                  <Card className="bids-table-card">
                    <div className="table-wrapper">
                      <table className="bids-table">
                        <thead>
                          <tr>
                            <th>
                              <input type="checkbox" disabled />
                            </th>
                            <th>Company</th>
                            <th>Contact</th>
                            <th className="sortable" onClick={() => handleSort('premium_amount')}>
                              Premium {sortBy === 'premium_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('coverage_amount')}>
                              Coverage {sortBy === 'coverage_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Deductible</th>
                            <th>Term</th>
                            <th>Documents</th>
                            <th className="sortable" onClick={() => handleSort('created_at')}>
                              Submitted {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBids.map(bid => (
                            <tr key={bid.id} className={selectedForComparison.find(b => b.id === bid.id) ? 'selected' : ''}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={!!selectedForComparison.find(b => b.id === bid.id)}
                                  onChange={() => toggleComparisonSelection(bid)}
                                />
                              </td>
                              <td>
                                <div className="company-cell">
                                  <div className="company-name">{bid.insurer_name || bid.bidder_company_name}</div>
                                  {bid.insurer_name && bid.insurer_name !== bid.bidder_company_name && (
                                    <div className="broker-badge">via {bid.bidder_company_name}</div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="contact-cell">
                                  <div>{bid.bidder_contact_person || '-'}</div>
                                  <div className="contact-email">{bid.bidder_email}</div>
                                </div>
                              </td>
                              <td className="amount-cell">{formatCurrency(bid.premium_amount)}</td>
                              <td className="amount-cell">{formatCurrency(bid.coverage_amount)}</td>
                              <td className="amount-cell">{formatCurrency(bid.deductible)}</td>
                              <td>{bid.policy_term_months ? `${bid.policy_term_months} months` : '-'}</td>
                              <td>
                                <div className="documents-cell">
                                  {bid.bid_documents.map(doc => (
                                    <button
                                      key={doc.id}
                                      className="doc-link"
                                      onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                      </svg>
                                      {doc.file_name}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="date-cell">{formatDate(bid.created_at)}</td>
                              <td>
                                <Button
                                  size="small"
                                  variant="secondary"
                                  onClick={() => handleDownloadAllDocuments(bid)}
                                >
                                  Download All
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Card View */}
                {viewMode === 'cards' && (
                  <div className="bids-grid">
                    {sortedBids.map(bid => (
                      <Card
                        key={bid.id}
                        className={`bid-card ${selectedForComparison.find(b => b.id === bid.id) ? 'selected' : ''}`}
                      >
                        <div className="bid-card-header">
                          <input
                            type="checkbox"
                            checked={!!selectedForComparison.find(b => b.id === bid.id)}
                            onChange={() => toggleComparisonSelection(bid)}
                          />
                          <div className="bid-company">
                            <h3>{bid.insurer_name || bid.bidder_company_name}</h3>
                            {bid.insurer_name && bid.insurer_name !== bid.bidder_company_name && (
                              <span className="broker-badge">via {bid.bidder_company_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="bid-contact">
                          {bid.bidder_contact_person && <div>{bid.bidder_contact_person}</div>}
                          <div className="contact-email">{bid.bidder_email}</div>
                          {bid.bidder_phone && <div>{bid.bidder_phone}</div>}
                        </div>

                        <div className="bid-details">
                          <div className="detail-row">
                            <span className="detail-label">Premium</span>
                            <span className="detail-value">{formatCurrency(bid.premium_amount)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Coverage</span>
                            <span className="detail-value">{formatCurrency(bid.coverage_amount)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Deductible</span>
                            <span className="detail-value">{formatCurrency(bid.deductible)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Policy Term</span>
                            <span className="detail-value">{bid.policy_term_months ? `${bid.policy_term_months} months` : '-'}</span>
                          </div>
                        </div>

                        {bid.additional_terms && (
                          <div className="bid-terms">
                            <div className="detail-label">Additional Terms</div>
                            <p>{bid.additional_terms}</p>
                          </div>
                        )}

                        <div className="bid-documents">
                          <div className="detail-label">Documents ({bid.bid_documents.length})</div>
                          <div className="doc-list">
                            {bid.bid_documents.map(doc => (
                              <button
                                key={doc.id}
                                className="doc-link"
                                onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                                {doc.file_name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bid-footer">
                          <div className="bid-date">Submitted {formatDate(bid.created_at)}</div>
                          <Button size="small" variant="secondary" onClick={() => handleDownloadAllDocuments(bid)}>
                            Download All
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Comparison View */}
                {selectedForComparison.length >= 2 && (
                  <Card className="comparison-card">
                    <h3>Side-by-Side Comparison</h3>
                    <div className="comparison-table-wrapper">
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            {selectedForComparison.map(bid => (
                              <th key={bid.id}>
                                {bid.insurer_name || bid.bidder_company_name}
                                {bid.insurer_name && bid.insurer_name !== bid.bidder_company_name && (
                                  <div className="broker-badge-small">via {bid.bidder_company_name}</div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="field-name">Premium</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id} className="amount-cell">{formatCurrency(bid.premium_amount)}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Coverage</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id} className="amount-cell">{formatCurrency(bid.coverage_amount)}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Deductible</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id} className="amount-cell">{formatCurrency(bid.deductible)}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Policy Term</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>{bid.policy_term_months ? `${bid.policy_term_months} months` : '-'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Contact Person</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>{bid.bidder_contact_person || '-'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Email</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>{bid.bidder_email}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Phone</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>{bid.bidder_phone || '-'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Submitted</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>{formatDate(bid.created_at)}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="field-name">Documents</td>
                            {selectedForComparison.map(bid => (
                              <td key={bid.id}>
                                {bid.bid_documents.map(doc => (
                                  <button
                                    key={doc.id}
                                    className="doc-link-small"
                                    onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
                                  >
                                    {doc.file_name}
                                  </button>
                                ))}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
