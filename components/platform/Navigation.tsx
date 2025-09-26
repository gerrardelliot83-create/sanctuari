'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { href: '/platform/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/platform/rfq/create', label: 'Create RFQ', icon: '➕' },
    { href: '/platform/rfqs', label: 'My RFQs', icon: '📋' },
    { href: '/platform/bid-centre', label: 'Bid Centre', icon: '💼' },
  ]

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <Link href="/platform/dashboard" className="nav-logo">
          <img src="/assets/Logo_dark.png" alt="Sanctuari" />
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="user-menu">
          <div className="user-info">
            <span className="user-name">{profile?.contact_person}</span>
            <span className="company-name">{profile?.company_name}</span>
          </div>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button onClick={handleSignOut} className="mobile-sign-out">
            Sign Out
          </button>
        </div>
      )}

      <style jsx>{`
        .navigation {
          background: var(--color-white);
          border-bottom: 1px solid var(--color-gray-200);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 var(--spacing-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .nav-logo img {
          height: 32px;
          width: auto;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: var(--spacing-xl);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-gray-700);
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-900);
        }

        .nav-item.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .nav-icon {
          font-size: var(--font-size-base);
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .user-name {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .company-name {
          font-size: var(--font-size-xs);
          color: var(--color-gray-600);
        }

        .sign-out-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-gray-100);
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-gray-700);
          font-size: var(--font-size-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .sign-out-btn:hover {
          background: var(--color-gray-200);
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-sm);
        }

        .mobile-menu-btn span {
          width: 20px;
          height: 2px;
          background: var(--color-gray-700);
          transition: all 0.3s;
        }

        .mobile-menu {
          display: none;
          background: var(--color-white);
          border-top: 1px solid var(--color-gray-200);
          padding: var(--spacing-lg);
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-gray-700);
          font-weight: 500;
          margin-bottom: var(--spacing-sm);
        }

        .mobile-nav-item:hover,
        .mobile-nav-item.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .mobile-sign-out {
          width: 100%;
          padding: var(--spacing-md);
          background: var(--color-gray-100);
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-gray-700);
          font-weight: 500;
          cursor: pointer;
          margin-top: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .nav-menu,
          .user-menu {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </nav>
  )
}