'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Only run when loading is complete
    if (loading) return

    // Prevent multiple redirects
    if (isRedirecting) return

    setIsRedirecting(true)

    // Small delay to ensure state is ready
    setTimeout(() => {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push('/platform/dashboard')
      } else {
        // If not authenticated, redirect to login
        router.push('/auth/login')
      }
    }, 100)
  }, [user, loading, router, isRedirecting])

  // Show loading spinner while checking auth
  return (
    <div className="loading-container">
      <div className="loading-content">
        <img
          src="/assets/Logo_light.png"
          alt="Sanctuari"
          className="loading-logo"
          style={{
            height: '36px',
            width: 'auto',
            maxWidth: '160px',
            objectFit: 'contain' as any,
            display: 'block'
          }}
        />
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
          display: block;
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
