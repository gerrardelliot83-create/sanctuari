/**
 * Page: Bids
 * Route: /bids
 * Purpose: List all RFQs and their bids (Bid Centre)
 */

'use client';

import { EmptyState } from '@sanctuari/ui';

export default function BidsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Bid Centre</h1>
      <EmptyState
        title="No bids yet"
        message="Your RFQ bids will appear here once you publish an RFQ and receive quotes from insurers."
      />
    </div>
  );
}
