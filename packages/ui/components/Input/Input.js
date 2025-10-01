/**
 * Component: Input
 * Purpose: Form input field with variants and validation states
 * Props: type, id, name, value, onChange, placeholder, required, disabled, error, className
 * Used in: All forms throughout the platform
 *
 * Design System: Fog, Iris, Rose colors
 * Typography: Geist Sans
 */

import './Input.css';

export default function Input({
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  min,
  max,
  step,
  className = '',
  ...props
}) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
      aria-invalid={error}
      aria-required={required}
      {...props}
    />
  );
}
