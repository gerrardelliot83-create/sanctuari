'use client';

/**
 * Page: Email Verification
 * Purpose: Inform user to check email for verification link
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/layouts/AuthLayout';
import Button from '@sanctuari/ui/components/Button/Button';
import './verify-email.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Check your inbox to confirm your email address."
    >
      <div className="verify-email-page">
        <div className="verify-email-content">
          <div className="verify-email-content__icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" fill="var(--iris-light)" />
              <path
                d="M16 24l16 12 16-12M16 24v20a4 4 0 004 4h24a4 4 0 004-4V24M16 24l14-8h4l14 8"
                stroke="var(--iris)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="verify-email-content__title">Check your email</h1>

          <p className="verify-email-content__text">
            We've sent a verification link to <strong>{email}</strong>
          </p>

          <p className="verify-email-content__instructions">
            Click the link in the email to verify your account and get started
            with Sanctuari.
          </p>

          <div className="verify-email-content__note">
            <p>Didn't receive the email?</p>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Make sure the email address is correct</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          <div className="verify-email-content__actions">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => (window.location.href = '/login')}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
