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
    { href: '/platform/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/platform/rfq/create', label: 'Create RFQ', icon: 'plus' },
    { href: '/platform/rfqs', label: 'My RFQs', icon: 'list' },
    { href: '/platform/bid-centre', label: 'Bid Centre', icon: 'briefcase' },
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
          <img
            src="/assets/Logo_light.png"
            alt="Sanctuari"
            style={{
              height: '32px',
              width: 'auto',
              maxWidth: '140px',
              objectFit: 'contain' as any,
              display: 'block'
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span className={`nav-icon icon-${item.icon}`}></span>
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
              <span className={`nav-icon icon-${item.icon}`}></span>
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

        .nav-logo {
          display: flex;
          align-items: center;
          height: 40px;
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
          width: 16px;
          height: 16px;
          display: inline-block;
          position: relative;
        }

        .nav-icon::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
        }

        .icon-dashboard::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'/%3E%3C/svg%3E");
        }

        .icon-plus::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'/%3E%3C/svg%3E");
        }

        .icon-list::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'/%3E%3C/svg%3E");
        }

        .icon-briefcase::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0l4 6-4 6H8l-4-6 4-6h8z'/%3E%3C/svg%3E");
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