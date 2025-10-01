/**
 * Component: Button
 * Purpose: Primary interactive element with multiple variants
 * Props: variant, size, disabled, loading, type, onClick, children
 * Used in: Forms, actions throughout the platform
 *
 * Design System: Fog, Iris, Rose, Sun, Ink colors
 * Typography: Geist Sans
 */

import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './Button.css';

export default function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  children,
  className = '',
}) {
  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large',
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClasses[size]} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <LoadingSpinner size="small" color="white" /> : null}
      {children}
    </button>
  );
}
