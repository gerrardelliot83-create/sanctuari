/**
 * Component: ProgressBar
 * Purpose: Show progress through RFQ sections
 * Props: currentSection, totalSections, sectionName
 * Used in: RFQ Wizard
 */

'use client';

import './ProgressBar.css';

export default function ProgressBar({ currentSection, totalSections, sectionName }) {
  // Defensive checks
  const validCurrentSection = typeof currentSection === 'number' ? currentSection : 0;
  const validTotalSections = typeof totalSections === 'number' && totalSections > 0 ? totalSections : 1;
  const progress = ((validCurrentSection + 1) / validTotalSections) * 100;

  return (
    <div className="progress-bar">
      <div className="progress-bar__info">
        <div className="progress-bar__dots">
          {Array.from({ length: validTotalSections }).map((_, index) => (
            <div
              key={index}
              className={`progress-bar__dot ${
                index <= validCurrentSection ? 'progress-bar__dot--active' : ''
              }`}
            />
          ))}
        </div>
        <div className="progress-bar__text">
          Section {validCurrentSection + 1} of {validTotalSections}: {sectionName || 'Loading...'}
        </div>
      </div>

      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
