/**
 * Component: ProgressBar
 * Purpose: Show progress through RFQ sections
 * Props: currentSection, totalSections, sectionName
 * Used in: RFQ Wizard
 */

'use client';

import './ProgressBar.css';

export default function ProgressBar({ currentSection, totalSections, sectionName }) {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="progress-bar">
      <div className="progress-bar__info">
        <div className="progress-bar__dots">
          {Array.from({ length: totalSections }).map((_, index) => (
            <div
              key={index}
              className={`progress-bar__dot ${
                index <= currentSection ? 'progress-bar__dot--active' : ''
              }`}
            />
          ))}
        </div>
        <div className="progress-bar__text">
          Section {currentSection + 1} of {totalSections}: {sectionName}
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
