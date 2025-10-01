/**
 * Component: DashboardLayout
 * Purpose: Main layout wrapper for authenticated dashboard pages
 * Features: Sidebar navigation, top bar, main content area
 * Used in: All dashboard pages
 */

'use client';

import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
}
