'use client';

/**
 * Page: Signup
 * Purpose: User registration with email and password
 * Flow: Signup → Email verification → Onboarding
 *
 * Minimal signup: Email + Password only
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@sanctuari/database/lib/auth';
import AuthLayout from '@/components/layouts/AuthLayout';
import Button from '@sanctuari/ui/components/Button/Button';
import Input from '@sanctuari/ui/components/Input/Input';
import PasswordInput from '@sanctuari/ui/components/PasswordInput/PasswordInput';
import FormField from '@sanctuari/ui/components/FormField/FormField';
import ErrorMessage from '@sanctuari/ui/components/ErrorMessage/ErrorMessage';
import './signup.css';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGlobalError('');

    const { data, error } = await signUp(formData.email, formData.password);

    if (error) {
      setGlobalError(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Redirect to email verification page
    router.push('/auth/verify-email');
  };

  return (
    <AuthLayout
      title="Start simplifying insurance today"
      subtitle="Join businesses across India in streamlining their insurance procurement process."
    >
      <div className="signup-page">
        <h1 className="signup-page__title">Create your account</h1>
        <p className="signup-page__subtitle">
          Get started with your first RFQ for free
        </p>

        <form onSubmit={handleSubmit} className="signup-form">
          {globalError && (
            <div className="signup-form__error">
              <ErrorMessage>{globalError}</ErrorMessage>
            </div>
          )}

          <FormField
            label="Email address"
            htmlFor="email"
            required
            error={errors.email}
          >
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              autoComplete="email"
              autoFocus
              error={!!errors.email}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            required
            error={errors.password}
            helper="At least 8 characters"
          >
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              error={!!errors.password}
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              error={!!errors.confirmPassword}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="signup-form__submit"
          >
            Create account
          </Button>
        </form>

        <p className="signup-page__login-link">
          Already have an account?{' '}
          <a href="/auth/login" className="signup-page__link">
            Log in
          </a>
        </p>

        <p className="signup-page__terms">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="signup-page__link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="signup-page__link">
            Privacy Policy
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
