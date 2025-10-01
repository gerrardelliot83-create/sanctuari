'use client';

/**
 * Page: Login
 * Purpose: User authentication
 * Flow: Login → Dashboard (if onboarded) or Onboarding
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, checkOnboardingStatus } from '@sanctuari/database/lib/auth';
import AuthLayout from '@/components/layouts/AuthLayout';
import Button from '@sanctuari/ui/components/Button/Button';
import Input from '@sanctuari/ui/components/Input/Input';
import PasswordInput from '@sanctuari/ui/components/PasswordInput/PasswordInput';
import FormField from '@sanctuari/ui/components/FormField/FormField';
import ErrorMessage from '@sanctuari/ui/components/ErrorMessage/ErrorMessage';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    const { data, error } = await signIn(formData.email, formData.password);

    if (error) {
      setGlobalError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    // Check if user has completed onboarding
    if (data.user) {
      const { completed } = await checkOnboardingStatus(data.user.id);

      if (completed) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding/company');
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to access your dashboard and manage your insurance procurement."
    >
      <div className="login-page">
        <h1 className="login-page__title">Log in to Sanctuari</h1>
        <p className="login-page__subtitle">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {globalError && (
            <div className="login-form__error">
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
          >
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              error={!!errors.password}
            />
          </FormField>

          <div className="login-form__forgot">
            <a href="/auth/forgot-password" className="login-form__link">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="login-form__submit"
          >
            Log in
          </Button>
        </form>

        <p className="login-page__signup-link">
          Don't have an account?{' '}
          <a href="/auth/signup" className="login-page__link">
            Sign up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
