'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface SignupData {
  email: string
  password: string
  companyName: string
  contactPerson: string
  phone: string
  gstNumber: string
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    gstNumber: '',
  })

  const router = useRouter()
  const supabase = createClient()

  const updateData = (field: keyof SignupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!data.email || !data.password) {
      toast.error('Please fill in all fields')
      return false
    }
    if (data.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!data.companyName || !data.contactPerson || !data.phone) {
      toast.error('Please fill in all required fields')
      return false
    }
    return true
  }

  const handleSignup = async () => {
    if (!validateStep2()) return

    setLoading(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          data: {
            company_name: data.companyName,
            contact_person: data.contactPerson,
          }
        }
      })

      if (authError) throw authError

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            role: 'business',
            company_name: data.companyName,
            contact_person: data.contactPerson,
            phone: data.phone,
            gst_number: data.gstNumber,
          } as any)

        if (profileError) throw profileError
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/auth/verify-email')
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/Logo_dark.png" alt="Sanctuari" className="auth-logo" />
          <h1>Create Your Account</h1>
          <p>Start procuring insurance the smart way</p>
        </div>

        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <label>Account</label>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <label>Business Details</label>
          </div>
        </div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="email">Business Email</label>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  placeholder="your@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => updateData('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => validateStep1() && setStep(2)}
                disabled={loading}
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  value={data.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                  placeholder="Your Company Pvt Ltd"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPerson">Contact Person</label>
                <input
                  id="contactPerson"
                  type="text"
                  value={data.contactPerson}
                  onChange={(e) => updateData('contactPerson', e.target.value)}
                  placeholder="Full Name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gstNumber">GST Number (Optional)</label>
                <input
                  id="gstNumber"
                  type="text"
                  value={data.gstNumber}
                  onChange={(e) => updateData('gstNumber', e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}

          <div className="auth-links">
            <span>Already have an account?</span>
            <Link href="/auth/login">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  )
}