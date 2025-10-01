/**
 * Component: Label
 * Purpose: Form label with optional required indicator
 * Props: children, htmlFor, required, className
 * Used in: All form fields
 *
 * Design System: Geist Sans, Ink color
 */

import './Label.css';

export default function Label({
  children,
  htmlFor,
  required = false,
  className = '',
}) {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
      {required && <span className="required">*</span>}
    </label>
  );
}
