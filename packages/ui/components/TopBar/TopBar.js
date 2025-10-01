/**
 * Component: TopBar
 * Purpose: Top navigation bar with greeting, action button, and user menu
 * Features: Time-based greeting, CTA button, user dropdown
 * Used in: DashboardLayout
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '../Button/Button';
import './TopBar.css';

export default function TopBar({ userName, userEmail, onSignOut, onCreateRFQ }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__greeting">
          {getGreeting()}{userName && `, ${userName.split(' ')[0]}`}
        </h1>
      </div>

      <div className="topbar__right">
        {onCreateRFQ && (
          <Button
            variant="primary"
            size="small"
            onClick={onCreateRFQ}
            className="topbar__cta"
          >
            + Create RFQ
          </Button>
        )}

        <div className="topbar__user" ref={dropdownRef}>
          <button
            className="topbar__avatar"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User menu"
          >
            <span className="topbar__avatar-text">{getInitials(userName)}</span>
          </button>

          {isDropdownOpen && (
            <div className="topbar__dropdown">
              <div className="topbar__dropdown-header">
                <div className="topbar__dropdown-name">{userName || 'User'}</div>
                <div className="topbar__dropdown-email">{userEmail}</div>
              </div>

              <div className="topbar__dropdown-divider" />

              <button className="topbar__dropdown-item" onClick={() => {/* TODO: Navigate to settings */}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13 8C13 8.3 12.98 8.59 12.94 8.88L14.35 10C14.46 10.09 14.49 10.24 14.42 10.37L13.09 12.63C13.02 12.76 12.87 12.81 12.74 12.76L11.08 12.07C10.76 12.32 10.41 12.53 10.04 12.69L9.79 14.46C9.77 14.6 9.65 14.7 9.5 14.7H6.9C6.75 14.7 6.63 14.6 6.61 14.46L6.36 12.69C5.99 12.53 5.64 12.32 5.32 12.07L3.66 12.76C3.53 12.81 3.38 12.76 3.31 12.63L1.98 10.37C1.91 10.24 1.94 10.09 2.05 10L3.46 8.88C3.42 8.59 3.4 8.3 3.4 8C3.4 7.7 3.42 7.41 3.46 7.12L2.05 6C1.94 5.91 1.91 5.76 1.98 5.63L3.31 3.37C3.38 3.24 3.53 3.19 3.66 3.24L5.32 3.93C5.64 3.68 5.99 3.47 6.36 3.31L6.61 1.54C6.63 1.4 6.75 1.3 6.9 1.3H9.5C9.65 1.3 9.77 1.4 9.79 1.54L10.04 3.31C10.41 3.47 10.76 3.68 11.08 3.93L12.74 3.24C12.87 3.19 13.02 3.24 13.09 3.37L14.42 5.63C14.49 5.76 14.46 5.91 14.35 6L12.94 7.12C12.98 7.41 13 7.7 13 8Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Settings
              </button>

              <div className="topbar__dropdown-divider" />

              <button className="topbar__dropdown-item topbar__dropdown-item--danger" onClick={onSignOut}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M11 11L14 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
