/**
 * Component: Card
 * Purpose: Container card with header, content, and actions
 * Props: title, subtitle, children, actions, status, className
 * Used in: Dashboards, lists, content organization
 *
 * Design System: White background, subtle shadow, 12px border radius
 */

import './Card.css';

export default function Card({
  title,
  subtitle,
  children,
  actions,
  status,
  className = '',
}) {
  return (
    <div className={`card ${status ? `card-${status}` : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">{children}</div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}
