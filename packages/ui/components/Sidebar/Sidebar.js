/**
 * Component: Sidebar
 * Purpose: Left navigation sidebar for dashboard
 * Features: Brand logo, navigation links with icons
 * Used in: DashboardLayout
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: 'home' },
    { href: '/rfqs', label: 'Bid Centre', icon: 'inbox' },
    { href: '/network', label: 'Network', icon: 'users' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Link href="/dashboard" className="sidebar__logo">
          <div className="sidebar__logo-icon">S</div>
          <span className="sidebar__logo-text">Sanctuari</span>
        </Link>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <div className="sidebar__icon" data-icon={item.icon}>
                {renderIcon(item.icon)}
              </div>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Simple icon renderer (using CSS shapes for now)
function renderIcon(icon) {
  switch (icon) {
    case 'home':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10L10 3L17 10V17C17 17.5523 16.5523 18 16 18H12V13H8V18H4C3.44772 18 3 17.5523 3 17V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'document':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 3C5 2.44772 5.44772 2 6 2H11L16 7V17C16 17.5523 15.5523 18 15 18H6C5.44772 18 5 17.5523 5 17V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 2V7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'inbox':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L3 15C3 16.1046 3.89543 17 5 17L15 17C16.1046 17 17 16.1046 17 15V8M3 8L10 3L17 8M3 8L7 10.5M17 8L13 10.5M7 10.5L10 12L13 10.5M7 10.5V17M13 10.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'users':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 16C2 13.2386 4.23858 11 7 11C9.76142 11 12 13.2386 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M13 16C13 14.5 14 13 15.5 13C17 13 18 14.5 18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'settings':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16.5 10C16.5 10.3 16.48 10.59 16.44 10.88L17.85 12C17.96 12.09 17.99 12.24 17.92 12.37L16.59 14.63C16.52 14.76 16.37 14.81 16.24 14.76L14.58 14.07C14.26 14.32 13.91 14.53 13.54 14.69L13.29 16.46C13.27 16.6 13.15 16.7 13 16.7H10.4C10.25 16.7 10.13 16.6 10.11 16.46L9.86 14.69C9.49 14.53 9.14 14.32 8.82 14.07L7.16 14.76C7.03 14.81 6.88 14.76 6.81 14.63L5.48 12.37C5.41 12.24 5.44 12.09 5.55 12L6.96 10.88C6.92 10.59 6.9 10.3 6.9 10C6.9 9.7 6.92 9.41 6.96 9.12L5.55 8C5.44 7.91 5.41 7.76 5.48 7.63L6.81 5.37C6.88 5.24 7.03 5.19 7.16 5.24L8.82 5.93C9.14 5.68 9.49 5.47 9.86 5.31L10.11 3.54C10.13 3.4 10.25 3.3 10.4 3.3H13C13.15 3.3 13.27 3.4 13.29 3.54L13.54 5.31C13.91 5.47 14.26 5.68 14.58 5.93L16.24 5.24C16.37 5.19 16.52 5.24 16.59 5.37L17.92 7.63C17.99 7.76 17.96 7.91 17.85 8L16.44 9.12C16.48 9.41 16.5 9.7 16.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    default:
      return null;
  }
}
