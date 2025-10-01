'use client';

/**
 * Page: Company Onboarding
 * Purpose: Create first company after signup
 * Flow: User creates company → onboarding_completed = true → Dashboard
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { completeOnboarding, getUser } from '@sanctuari/database/lib/auth';
import Container from '@sanctuari/ui/components/Container/Container';
import Card from '@sanctuari/ui/components/Card/Card';
import Button from '@sanctuari/ui/components/Button/Button';
import Input from '@sanctuari/ui/components/Input/Input';
import FormField from '@sanctuari/ui/components/FormField/FormField';
import ErrorMessage from '@sanctuari/ui/components/ErrorMessage/ErrorMessage';
import './company.css';

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { user } = await getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
    }
    checkAuth();
  }, [router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
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

    if (!validateForm() || !userId) {
      return;
    }

    setLoading(true);
    setGlobalError('');

    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          industry: formData.industry || null,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create company member record (owner)
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Mark onboarding as complete
      const { error: onboardingError } = await completeOnboarding(userId);

      if (onboardingError) throw onboardingError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setGlobalError('Failed to create company. Please try again.');
      setLoading(false);
    }
  };

  if (!userId) {
    return null; // Loading state while checking auth
  }

  return (
    <div className="onboarding-page">
      <Container size="small">
        <div className="onboarding-header">
          <h1 className="onboarding-header__brand">Sanctuari</h1>
          <div className="onboarding-progress">
            <div className="onboarding-progress__bar">
              <div className="onboarding-progress__fill" style={{ width: '50%' }} />
            </div>
            <span className="onboarding-progress__text">Step 1 of 2</span>
          </div>
        </div>

        <Card className="onboarding-card">
          <div className="onboarding-content">
            <h2 className="onboarding-content__title">
              Create your organization
            </h2>
            <p className="onboarding-content__subtitle">
              Let's start by setting up your company profile. You can add more
              details later.
            </p>

            <form onSubmit={handleSubmit} className="onboarding-form">
              {globalError && (
                <div className="onboarding-form__error">
                  <ErrorMessage>{globalError}</ErrorMessage>
                </div>
              )}

              <FormField
                label="Company name"
                htmlFor="companyName"
                required
                error={errors.companyName}
                helper="This will appear on your RFQs and quotes"
              >
                <Input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  required
                  autoFocus
                  error={!!errors.companyName}
                />
              </FormField>

              <FormField
                label="Industry"
                htmlFor="industry"
                error={errors.industry}
                helper="Optional - helps us provide better recommendations"
              >
                <Input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g., Manufacturing, IT Services, Healthcare"
                  error={!!errors.industry}
                />
              </FormField>

              <div className="onboarding-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={loading}
                  className="onboarding-form__submit"
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <p className="onboarding-footer">
          Need help?{' '}
          <a href="mailto:support@sanctuari.io" className="onboarding-footer__link">
            Contact support
          </a>
        </p>
      </Container>
    </div>
  );
}
