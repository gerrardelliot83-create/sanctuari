/**
 * Utility: Token and ID Generators
 * Purpose: Generate secure random tokens and formatted IDs
 */

import { customAlphabet } from 'nanoid';

// Create custom nanoid with alphanumeric characters only
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 32);

/**
 * Generate a unique secure token for bid invitation links
 * Returns: 32-character alphanumeric string
 * Example: "aBc123XyZ789pQrStU4vW5xY6zA7bC8d"
 *
 * Security: 62^32 = ~2.27x10^57 possible combinations (collision-proof)
 */
export function generateUniqueToken() {
  return nanoid();
}

/**
 * Generate RFQ number in format: RFQ-YYYY-NNNN
 * @param {number} year - Current year
 * @param {number} sequence - Sequence number for the year
 * @returns {string} Formatted RFQ number
 * Example: generateRFQNumber(2025, 1) => "RFQ-2025-0001"
 */
export function generateRFQNumber(year, sequence) {
  return `RFQ-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generate invitation token for company invitations
 * Returns: 64-character token for extra security on company invites
 */
export function generateInvitationToken() {
  const longNanoid = customAlphabet(alphabet, 64);
  return longNanoid();
}
