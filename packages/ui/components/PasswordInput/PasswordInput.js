/**
 * Component: PasswordInput
 * Purpose: Password input field with show/hide toggle
 * Props: id, name, value, onChange, placeholder, required, disabled, error, className
 * Used in: Auth forms (signup, login, password reset)
 *
 * Design System: Iris for toggle button, Rose for errors
 */

'use client';

import { useState } from 'react';
import Input from '../Input/Input';
import './PasswordInput.css';

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Enter your password',
  required = false,
  disabled = false,
  error = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-input-wrapper">
      <Input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        className={`password-input ${className}`}
        autoComplete="current-password"
        {...props}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        disabled={disabled}
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.5 10s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6S2.5 10 2.5 10z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.5 10s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6S2.5 10 2.5 10z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
