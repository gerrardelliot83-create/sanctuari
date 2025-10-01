/**
 * Component: Container
 * Purpose: Page-level content wrapper with max-width constraint
 * Props: children, className, size
 * Used in: Page layouts
 *
 * Design System: Centered content with responsive padding
 */

import './Container.css';

export default function Container({
  children,
  className = '',
  size = 'default',
}) {
  const sizeClasses = {
    small: 'container--small',
    default: 'container--default',
    large: 'container--large',
    full: 'container--full',
  };

  return (
    <div className={`container ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
