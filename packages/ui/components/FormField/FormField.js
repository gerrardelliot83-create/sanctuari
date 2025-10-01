/**
 * Component: FormField
 * Purpose: Wrapper that combines Label, Input, helper text, and error message
 * Props: label, children, error, helper, required, className
 * Used in: All forms throughout the platform
 *
 * Design System: Complete form field structure
 */

import Label from '../Label/Label';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import './FormField.css';

export default function FormField({
  label,
  children,
  error,
  helper,
  required = false,
  htmlFor,
  className = '',
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
