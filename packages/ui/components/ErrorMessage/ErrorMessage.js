/**
 * Component: ErrorMessage
 * Purpose: Display validation or API error messages
 * Props: children, className
 * Used in: Form validation and error handling
 *
 * Design System: Rose color for errors
 */

import './ErrorMessage.css';

export default function ErrorMessage({ children, className = '' }) {
  if (!children) return null;

  return <span className={`form-error ${className}`}>{children}</span>;
}
