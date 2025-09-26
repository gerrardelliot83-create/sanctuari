'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface ProfileData {
  id: string
  company_name: string
  contact_person: string
  phone: string
  gst_number: string
}

export default function ProfileSetupPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get stored profile data from localStorage
    const stored = localStorage.getItem('pendingUserProfile')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setProfileData(data)
      } catch (error) {
        console.error('Error parsing stored profile data:', error)
      }
    }

    // If no stored data and user exists, redirect to dashboard
    if (!stored && user) {
      router.push('/platform/dashboard')
    }
  }, [user, router])

  const handleCompleteProfile = async () => {
    if (!profileData || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          role: 'business',
          company_name: profileData.company_name,
          contact_person: profileData.contact_person,
          phone: profileData.phone,
          gst_number: profileData.gst_number,
        } as any)

      if (error) throw error

      // Clear stored data
      localStorage.removeItem('pendingUserProfile')

      toast.success('Profile setup complete! Welcome to Sanctuari.')
      router.push('/platform/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile setup')
      console.error('Profile setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profileData) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/assets/Logo_dark.png" alt="Sanctuari" className="auth-logo" />
            <h1>Setting up your profile...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/Logo_dark.png" alt="Sanctuari" className="auth-logo" />
          <h1>Complete Your Profile</h1>
          <p>Your email has been verified! Let's finish setting up your account.</p>
        </div>

        <div className="profile-summary">
          <h3>Profile Information</h3>
          <div className="profile-field">
            <label>Company Name:</label>
            <span>{profileData.company_name}</span>
          </div>
          <div className="profile-field">
            <label>Contact Person:</label>
            <span>{profileData.contact_person}</span>
          </div>
          <div className="profile-field">
            <label>Phone:</label>
            <span>{profileData.phone}</span>
          </div>
          {profileData.gst_number && (
            <div className="profile-field">
              <label>GST Number:</label>
              <span>{profileData.gst_number}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCompleteProfile}
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}
        >
          {loading ? 'Setting up...' : 'Complete Setup & Enter Platform'}
        </button>

        <style jsx>{`
          .profile-summary {
            background: var(--color-gray-50);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg);
            margin: var(--spacing-lg) 0;
          }

          .profile-summary h3 {
            margin-bottom: var(--spacing-md);
            color: var(--color-gray-900);
            font-size: var(--font-size-lg);
          }

          .profile-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) 0;
            border-bottom: 1px solid var(--color-gray-200);
          }

          .profile-field:last-child {
            border-bottom: none;
          }

          .profile-field label {
            font-weight: 500;
            color: var(--color-gray-600);
            font-size: var(--font-size-sm);
          }

          .profile-field span {
            color: var(--color-gray-900);
            font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  )
}