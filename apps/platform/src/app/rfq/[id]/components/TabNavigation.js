/**
 * Component: Tab Navigation
 * Purpose: Horizontal tab navigation for Bid Command Center
 * Features: Active state, badges for counts, mobile responsive
 */

export default function TabNavigation({ activeTab, onTabChange, bidData }) {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      badge: bidData.quotesCount > 0 ? bidData.quotesCount : null
    },
    {
      id: 'distribution',
      label: 'Distribution',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      )
    },
    {
      id: 'tracking',
      label: 'Tracking',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      badge: bidData.newResponses > 0 ? bidData.newResponses : null
    }
  ];

  return (
    <>
      {/* Desktop: Horizontal tabs */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="mobile-tab-selector">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="mobile-tab-select"
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
              {tab.badge ? ` (${tab.badge})` : ''}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
