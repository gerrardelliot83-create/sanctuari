/**
 * Page: Network
 * Route: /network
 * Purpose: Browse Sanctuari's network of insurers and brokers
 */

'use client';

import { EmptyState } from '@sanctuari/ui';

export default function NetworkPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Sanctuari Network</h1>
      <EmptyState
        title="Network coming soon"
        message="Browse verified insurers and brokers in the Sanctuari network."
      />
    </div>
  );
}
