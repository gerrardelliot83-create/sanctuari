/**
 * Component: Button
 * Purpose: Primary interactive element with multiple variants
 * Props: variant, size, disabled, loading, type, onClick, children
 * Used in: Forms, actions throughout the platform
 *
 * Design System: Fog, Iris, Rose, Sun, Ink colors
 * Typography: Geist Sans
 */

import './Button.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  children,
  className = '',
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="button__loading">
          <span className="button__spinner"></span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
