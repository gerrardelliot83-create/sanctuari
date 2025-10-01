/**
 * Component: EmptyState
 * Purpose: Display when there's no data to show
 * Features: Icon, title, description, CTA button
 * Used in: Dashboard, RFQ list, Bid list, etc.
 */

'use client';

import Button from '../Button/Button';
import './EmptyState.css';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
