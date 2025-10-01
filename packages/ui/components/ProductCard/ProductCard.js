/**
 * Component: ProductCard
 * Purpose: Display insurance product in selection grid
 * Props: product object, onClick handler
 * Used in: Product selection page
 */

'use client';

import './ProductCard.css';

export default function ProductCard({ product, onClick }) {
  const getCategoryColor = (category) => {
    const colors = {
      general: '#6F4FFF',     // Iris
      health: '#FD5478',      // Rose
      life: '#F6C754',        // Sun
      marine: '#4FB0FF',      // Blue
      cyber: '#9D4FFF',       // Purple
      commercial: '#070921'   // Ink
    };
    return colors[category] || colors.general;
  };

  return (
    <button className="product-card" onClick={() => onClick(product)}>
      <div
        className="product-card__category"
        style={{ backgroundColor: getCategoryColor(product.category) }}
      >
        {product.category}
      </div>

      <h3 className="product-card__name">{product.name}</h3>

      {product.description && (
        <p className="product-card__description">{product.description}</p>
      )}

      <div className="product-card__cta">
        Create RFQ
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
