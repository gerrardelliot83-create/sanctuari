'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push('/platform/dashboard')
      } else {
        // If not authenticated, redirect to login
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  // Show loading spinner while checking auth
  return (
    <div className="loading-container">
      <div className="loading-content">
        <img src="/assets/Logo_dark.png" alt="Sanctuari" className="loading-logo" />
        <div className="loading-spinner"></div>
        <p>Loading Sanctuari Platform...</p>
      </div>

      <style jsx>{`
        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-white) 100%);
        }

        .loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .loading-logo {
          height: 64px;
          width: auto;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-gray-200);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-content p {
          color: var(--color-gray-600);
          font-size: var(--font-size-base);
        }
      `}</style>
    </div>
  )
}
