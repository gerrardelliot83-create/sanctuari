/**
 * Component: CategoryFilter
 * Purpose: Filter insurance products by category
 * Props: activeCategory, onCategoryChange
 * Used in: Product selection page
 */

'use client';

import './CategoryFilter.css';

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  const categories = [
    { value: 'all', label: 'All Products', count: 0 },
    { value: 'general', label: 'General', count: 0 },
    { value: 'health', label: 'Health', count: 0 },
    { value: 'life', label: 'Life', count: 0 },
    { value: 'marine', label: 'Marine', count: 0 },
    { value: 'cyber', label: 'Cyber', count: 0 },
    { value: 'commercial', label: 'Commercial', count: 0 },
  ];

  return (
    <div className="category-filter">
      {categories.map((category) => (
        <button
          key={category.value}
          className={`category-filter__button ${
            activeCategory === category.value ? 'category-filter__button--active' : ''
          }`}
          onClick={() => onCategoryChange(category.value)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
