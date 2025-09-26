'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/Logo_light.png" alt="Sanctuari" className="auth-logo" />
          <h1>Check Your Email</h1>
          <p>We've sent you a verification link</p>
        </div>

        <div className="verify-content">
          <div className="icon-container">
            <div className="email-icon">📧</div>
          </div>

          <div className="message">
            <h3>Verification email sent!</h3>
            <p>
              Please check your email and click the verification link to activate your account.
              If you don't see the email, check your spam folder.
            </p>
          </div>

          <div className="actions">
            <Link href="/auth/login" className="btn-primary">
              Back to Login
            </Link>
            <Link href="/auth/signup" className="btn-secondary">
              Sign Up Again
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .verify-content {
          text-align: center;
          padding: var(--spacing-xl) 0;
        }

        .icon-container {
          margin-bottom: var(--spacing-xl);
        }

        .email-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .message h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-md);
          color: var(--color-gray-900);
        }

        .message p {
          color: var(--color-gray-600);
          line-height: 1.6;
          margin-bottom: var(--spacing-xl);
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .actions a {
          display: block;
          text-decoration: none;
        }

        @media (min-width: 480px) {
          .actions {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}