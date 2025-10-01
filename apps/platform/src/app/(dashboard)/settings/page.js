/**
 * Page: Settings
 * Route: /settings
 * Purpose: User and company settings
 */

'use client';

import { EmptyState } from '@sanctuari/ui';

export default function SettingsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>
      <EmptyState
        title="Settings coming soon"
        message="Manage your account and company settings here."
      />
    </div>
  );
}
