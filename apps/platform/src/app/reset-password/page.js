'use client';

/**
 * Page: Reset Password
 * Purpose: Set new password after clicking reset link from email
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@sanctuari/database/lib/auth';
import AuthLayout from '@/components/layouts/AuthLayout';
import Button from '@sanctuari/ui/components/Button/Button';
import PasswordInput from '@sanctuari/ui/components/PasswordInput/PasswordInput';
import FormField from '@sanctuari/ui/components/FormField/FormField';
import ErrorMessage from '@sanctuari/ui/components/ErrorMessage/ErrorMessage';
import './reset-password.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

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

    const { error } = await updatePassword(formData.password);

    if (error) {
      setGlobalError('Failed to update password. Please try again.');
      setLoading(false);
      return;
    }

    // Redirect to login with success message
    router.push('/login?reset=success');
  };

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password to secure your account."
    >
      <div className="reset-password-page">
        <h1 className="reset-password-page__title">Set new password</h1>
        <p className="reset-password-page__subtitle">
          Your new password must be different from previous passwords
        </p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {globalError && (
            <div className="reset-password-form__error">
              <ErrorMessage>{globalError}</ErrorMessage>
            </div>
          )}

          <FormField
            label="New password"
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
              autoFocus
              error={!!errors.password}
            />
          </FormField>

          <FormField
            label="Confirm new password"
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
            className="reset-password-form__submit"
          >
            Reset password
          </Button>
        </form>

        <p className="reset-password-page__back">
          <a href="/login" className="reset-password-page__link">
            ← Back to login
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
