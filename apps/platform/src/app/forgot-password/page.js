'use client';

/**
 * Page: Forgot Password
 * Purpose: Request password reset email
 */

import { useState } from 'react';
import { resetPasswordForEmail } from '@sanctuari/database/lib/auth';
import AuthLayout from '@/components/layouts/AuthLayout';
import Button from '@sanctuari/ui/components/Button/Button';
import Input from '@sanctuari/ui/components/Input/Input';
import FormField from '@sanctuari/ui/components/FormField/FormField';
import ErrorMessage from '@sanctuari/ui/components/ErrorMessage/ErrorMessage';
import './forgot-password.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await resetPasswordForEmail(email);

    if (resetError) {
      setError('Failed to send reset email. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you instructions to reset your password."
      >
        <div className="forgot-password-page">
          <div className="forgot-password-success">
            <div className="forgot-password-success__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" fill="var(--iris-light)" />
                <path
                  d="M16 24l6 6 10-12"
                  stroke="var(--iris)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="forgot-password-success__title">
              Reset link sent
            </h1>
            <p className="forgot-password-success__text">
              We've sent a password reset link to <strong>{email}</strong>.
              Check your inbox and follow the instructions.
            </p>
            <p className="forgot-password-success__note">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="forgot-password-success__retry"
              >
                try again
              </button>
            </p>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => (window.location.href = '/login')}
            >
              Back to login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you instructions to reset your password."
    >
      <div className="forgot-password-page">
        <h1 className="forgot-password-page__title">Forgot password?</h1>
        <p className="forgot-password-page__subtitle">
          No worries, we'll send you reset instructions
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="forgot-password-form__error">
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          )}

          <FormField
            label="Email address"
            htmlFor="email"
            required
            error={error}
          >
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@company.com"
              required
              autoComplete="email"
              autoFocus
              error={!!error}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="forgot-password-form__submit"
          >
            Send reset link
          </Button>
        </form>

        <p className="forgot-password-page__back">
          <a href="/login" className="forgot-password-page__link">
            ← Back to login
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
