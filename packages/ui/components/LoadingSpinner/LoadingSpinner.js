/**
 * Component: LoadingSpinner
 * Purpose: Loading animation for async operations
 * Props: size, color, className
 * Used in: Buttons, page loaders, async operations
 *
 * Design System: Iris color for primary, customizable
 */

import './LoadingSpinner.css';

export default function LoadingSpinner({
  size = 'medium',
  color = 'iris',
  className = '',
}) {
  const sizeClasses = {
    small: 'spinner--small',
    medium: 'spinner--medium',
    large: 'spinner--large',
  };

  const colorClasses = {
    iris: 'spinner--iris',
    white: 'spinner--white',
    rose: 'spinner--rose',
    ink: 'spinner--ink',
  };

  return (
    <div
      className={`spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle
          className="spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
}
