/**
 * Page: RFQs
 * Route: /rfqs
 * Purpose: List all user's RFQs (drafts and published)
 */

'use client';

import { EmptyState } from '@sanctuari/ui';

export default function RFQsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>My RFQs</h1>
      <EmptyState
        title="No RFQs yet"
        message="Create your first RFQ to get started with quotes from insurers."
      />
    </div>
  );
}
