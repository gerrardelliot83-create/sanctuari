/**
 * Component: CompanySwitcher
 * Purpose: Dropdown to switch between user's companies
 * Features: Company list, add company button
 * Used in: TopBar or Sidebar
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import './CompanySwitcher.css';

export default function CompanySwitcher({ companies, currentCompanyId, onSwitch, onAddCompany }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentCompany = companies?.find(c => c.id === currentCompanyId) || companies?.[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <div className="company-switcher" ref={dropdownRef}>
      <button
        className="company-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch company"
      >
        <div className="company-switcher__current">
          <div className="company-switcher__icon">
            {currentCompany?.logo_url ? (
              <img src={currentCompany.logo_url} alt={currentCompany.name} />
            ) : (
              <span>{currentCompany?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="company-switcher__info">
            <div className="company-switcher__name">{currentCompany?.name || 'Select Company'}</div>
            <div className="company-switcher__count">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</div>
          </div>
        </div>
        <svg
          className={`company-switcher__arrow ${isOpen ? 'company-switcher__arrow--open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="company-switcher__dropdown">
          <div className="company-switcher__list">
            {companies.map((company) => (
              <button
                key={company.id}
                className={`company-switcher__item ${
                  company.id === currentCompanyId ? 'company-switcher__item--active' : ''
                }`}
                onClick={() => {
                  onSwitch(company.id);
                  setIsOpen(false);
                }}
              >
                <div className="company-switcher__item-icon">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} />
                  ) : (
                    <span>{company.name[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="company-switcher__item-info">
                  <div className="company-switcher__item-name">{company.name}</div>
                  {company.industry && (
                    <div className="company-switcher__item-meta">{company.industry}</div>
                  )}
                </div>
                {company.id === currentCompanyId && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {onAddCompany && (
            <>
              <div className="company-switcher__divider" />
              <button className="company-switcher__add" onClick={() => {
                onAddCompany();
                setIsOpen(false);
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add Company
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
