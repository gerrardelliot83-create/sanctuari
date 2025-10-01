/**
 * @sanctuari/config
 * Shared configuration for Sanctuari platform
 *
 * This package contains configuration constants and settings used across the platform.
 */

export const INSURANCE_PRODUCTS = [
  'Fire and Special Perils',
  'Marine Cargo',
  'Group Health',
  'Group Personal Accident',
  'Cyber Liability',
  'Directors & Officers Liability',
  // ... more products
];

export const RFQ_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  BIDDING: 'bidding',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};
