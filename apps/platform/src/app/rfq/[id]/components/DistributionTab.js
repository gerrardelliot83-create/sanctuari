/**
 * Component: Distribution Tab
 * Purpose: Send bid to partners (insurers/brokers) via email invitations
 * Features: Manual contacts, network selection, distribution settings
 * Migrated from: /rfq/[id]/distribute/page.js
 */

import { useState, useEffect } from 'react';
import { createClient } from '@sanctuari/database/lib/client';
import { Card, Button } from '@sanctuari/ui';
import CSVUploadModal from './CSVUploadModal';
import '../distribute/distribute.css';

export default function DistributionTab({ rfqId, rfqData, onDistributionComplete }) {
  const supabase = createClient();

  // State
  const [activeTab, setActiveTab] = useState('contacts');
  const [showCSVModal, setShowCSVModal] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [emailError, setEmailError] = useState('');

  // Network state
  const [networkMembers, setNetworkMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Settings state
  const [expiryDays, setExpiryDays] = useState('14');
  const [deadline, setDeadline] = useState('');
  const [templateId, setTemplateId] = useState('standard');

  // Send state
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    loadNetworkMembers();
  }, []);

  const loadNetworkMembers = async () => {
    const { data: networkData } = await supabase
      .from('network_members')
      .select('*')
      .eq('is_active', true)
      .order('company_name');

    setNetworkMembers(networkData || []);
  };

  // Contact Management
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleAddContact = () => {
    setEmailError('');

    if (!emailInput.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(emailInput)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (contacts.some(c => c.email === emailInput.toLowerCase())) {
      setEmailError('This email has already been added');
      return;
    }

    // Add contact
    setContacts([
      ...contacts,
      {
        id: Date.now(),
        email: emailInput.toLowerCase(),
        company: companyInput.trim(),
        contactPerson: personInput.trim(),
        source: 'manual'
      }
    ]);

    // Reset inputs
    setEmailInput('');
    setCompanyInput('');
    setPersonInput('');
  };

  const handleRemoveContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleCSVImport = (importedContacts) => {
    // Filter out duplicates
    const newContacts = importedContacts
      .filter(imported => !contacts.some(c => c.email === imported.email))
      .map(imported => ({
        id: Date.now() + Math.random(),
        email: imported.email,
        company: imported.company,
        contactPerson: imported.contactPerson,
        source: 'csv'
      }));

    setContacts([...contacts, ...newContacts]);

    // Show success message
    if (newContacts.length > 0) {
      alert(`Successfully imported ${newContacts.length} contact${newContacts.length !== 1 ? 's' : ''}`);
    } else {
      alert('All contacts were duplicates and were skipped');
    }
  };

  // Network Selection
  const filteredNetworkMembers = networkMembers.filter(member => {
    const matchesSearch = searchQuery
      ? member.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesType = typeFilter === 'all' || member.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || member.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const toggleMemberSelection = (member) => {
    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handleAddSelectedToContacts = () => {
    const newContacts = selectedMembers
      .filter(member => !contacts.some(c => c.email === member.email))
      .map(member => ({
        id: Date.now() + Math.random(),
        email: member.email,
        company: member.company_name,
        contactPerson: member.contact_person || '',
        networkMemberId: member.id,
        source: 'network'
      }));

    setContacts([...contacts, ...newContacts]);
    setSelectedMembers([]);
    setActiveTab('contacts');
  };

  // Distribution
  const getAllRecipients = () => {
    return contacts;
  };

  const handleSendInvitations = async () => {
    const recipients = getAllRecipients();

    if (recipients.length === 0) {
      alert('Please add at least one contact');
      return;
    }

    if (!deadline) {
      alert('Please set a submission deadline');
      return;
    }

    setSending(true);
    setSendProgress(0);

    try {
      const response = await fetch(`/api/rfq/${rfqId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({
            email: r.email,
            company: r.company,
            contactPerson: r.contactPerson,
            networkMemberId: r.networkMemberId
          })),
          expiryDays: parseInt(expiryDays),
          deadline: new Date(deadline).toISOString(),
          templateId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations');
      }

      setSendProgress(100);
      setSendSuccess(true);

      // Notify parent to switch to tracking tab
      if (onDistributionComplete) {
        setTimeout(() => {
          onDistributionComplete();
        }, 2000);
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(`Failed to send invitations: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (sendSuccess) {
    return (
      <div className="distribute-success">
        <Card className="success-card">
          <div className="success-icon-large">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2>Invitations Sent Successfully!</h2>
          <p>{contacts.length} invitations have been sent to insurers and brokers.</p>
          <p className="success-note">Switching to Tracking tab...</p>
        </Card>
      </div>
    );
  }

  const totalRecipients = getAllRecipients().length;
  const expiresOn = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000);

  return (
    <div className="distribution-tab">
      {/* Tabs */}
      <div className="distribute-tabs">
        <button
          className={`distribute-tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Direct Contacts ({contacts.length})
        </button>
        <button
          className={`distribute-tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          Sanctuari Network
        </button>
        <button
          className={`distribute-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && (
        <div className="tab-content">
          <Card>
            <h3>Add Direct Contacts</h3>
            <p className="tab-description">
              Manually add email addresses of insurers or brokers you want to invite.
            </p>

            <div className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
                    placeholder="insurer@example.com"
                    className={emailError ? 'error' : ''}
                  />
                  {emailError && <span className="error-text">{emailError}</span>}
                </div>
                <div className="form-group">
                  <label>Company Name (optional)</label>
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="ABC Insurance"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person (optional)</label>
                  <input
                    type="text"
                    value={personInput}
                    onChange={(e) => setPersonInput(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label style={{opacity: 0}}>Action</label>
                  <Button onClick={handleAddContact}>Add Contact</Button>
                </div>
              </div>

              <div className="bulk-import-section">
                <p className="bulk-import-label">Or bulk import from CSV:</p>
                <Button variant="secondary" onClick={() => setShowCSVModal(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Import from CSV
                </Button>
              </div>
            </div>

            {contacts.length > 0 && (
              <div className="contact-list">
                <h4>Added Contacts ({contacts.length})</h4>
                {contacts.map(contact => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-info">
                      <div className="contact-email">{contact.email}</div>
                      {contact.company && (
                        <div className="contact-company">{contact.company}</div>
                      )}
                      {contact.contactPerson && (
                        <div className="contact-person">{contact.contactPerson}</div>
                      )}
                    </div>
                    <div className="contact-source">
                      {contact.source === 'network' ? 'From Network' : contact.source === 'csv' ? 'CSV Import' : 'Manual'}
                    </div>
                    <button
                      className="contact-remove"
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="tab-content">
          <Card>
            <h3>Browse Sanctuari Network</h3>
            <p className="tab-description">
              Select verified insurers and brokers from our network.
            </p>

            <div className="network-filters">
              <input
                type="search"
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="network-search"
              />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="insurer">Insurers</option>
                <option value="broker">Brokers</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="general">General Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="life">Life Insurance</option>
                <option value="marine">Marine Insurance</option>
                <option value="cyber">Cyber Insurance</option>
              </select>
            </div>

            {selectedMembers.length > 0 && (
              <div className="selection-bar">
                <span>{selectedMembers.length} partners selected</span>
                <Button onClick={handleAddSelectedToContacts}>
                  Add to Distribution List
                </Button>
              </div>
            )}

            <div className="network-grid">
              {filteredNetworkMembers.length === 0 ? (
                <p className="no-results">No network members found matching your criteria.</p>
              ) : (
                filteredNetworkMembers.map(member => {
                  const isSelected = selectedMembers.find(m => m.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className={`network-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleMemberSelection(member)}
                    >
                      <div className="network-card-header">
                        <h4>{member.company_name}</h4>
                        <div className="network-type">{member.type}</div>
                      </div>
                      {member.rating && (
                        <div className="network-rating">
                          {member.rating.toFixed(1)} ★
                        </div>
                      )}
                      {member.specializations && member.specializations.length > 0 && (
                        <div className="network-specs">
                          {member.specializations.slice(0, 3).map((spec, idx) => (
                            <span key={idx} className="spec-badge">{spec}</span>
                          ))}
                        </div>
                      )}
                      <div className="network-select">
                        {isSelected ? '✓ Selected' : 'Select Partner'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="tab-content">
          <Card>
            <h3>Distribution Settings</h3>
            <p className="tab-description">
              Configure link expiry, deadline, and email template.
            </p>

            <div className="settings-form">
              <div className="form-group">
                <label>Link Expiry</label>
                <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}>
                  <option value="7">7 days</option>
                  <option value="14">14 days (recommended)</option>
                  <option value="30">30 days</option>
                </select>
                <small>Links will expire on {expiresOn.toLocaleDateString('en-IN')}</small>
              </div>

              <div className="form-group">
                <label>Submission Deadline *</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label>Email Template</label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="standard">Standard Invitation</option>
                  <option value="urgent">Urgent Request</option>
                </select>
              </div>
            </div>

            {totalRecipients > 0 && deadline && (
              <div className="summary-box">
                <h4>Distribution Summary</h4>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <div className="stat-number">{totalRecipients}</div>
                    <div className="stat-label">Total Recipients</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-number">{expiryDays}</div>
                    <div className="stat-label">Days Until Expiry</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-number">
                      {new Date(deadline).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}
                    </div>
                    <div className="stat-label">Deadline</div>
                  </div>
                </div>

                <Button
                  onClick={handleSendInvitations}
                  disabled={sending}
                  className="send-button"
                >
                  {sending ? `Sending... ${sendProgress}%` : `Send ${totalRecipients} Invitations`}
                </Button>
              </div>
            )}

            {totalRecipients === 0 && (
              <p className="warning-text">
                Please add at least one contact from the "Direct Contacts" or "Sanctuari Network" tab.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <CSVUploadModal
          onClose={() => setShowCSVModal(false)}
          onImport={handleCSVImport}
        />
      )}
    </div>
  );
}
