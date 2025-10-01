/**
 * Component: AuthLayout
 * Purpose: Split-screen layout for authentication pages
 * Left: Form content (60%), Right: Branding/guidance (40%)
 * Used in: All auth pages (signup, login, forgot password)
 *
 * Design System: Fog background, clean split-screen
 */

import './AuthLayout.css';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__left">
        <div className="auth-layout__content">
          <div className="auth-layout__logo">
            <h1 className="auth-layout__brand">Sanctuari</h1>
          </div>
          {children}
        </div>
      </div>
      <div className="auth-layout__right">
        <div className="auth-layout__branding">
          <h2 className="auth-layout__title">
            {title || 'Simplify insurance procurement'}
          </h2>
          <p className="auth-layout__subtitle">
            {subtitle ||
              'Get competitive quotes from verified insurers and brokers across India. Clean, transparent, and jargon-free.'}
          </p>
          <div className="auth-layout__features">
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3>AI-Powered Analysis</h3>
                <p>Smart quote comparison with detailed insights</p>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3>Verified Partners</h3>
                <p>Access to India's trusted insurance network</p>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3>Fast & Transparent</h3>
                <p>Clear pricing, no hidden fees, free first RFQ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
