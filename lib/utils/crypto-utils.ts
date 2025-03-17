/**
 * Cross-platform UUID generation utility
 * Works in both Node.js and Edge runtime environments
 */

/**
 * Generate a random UUID that works in both Node.js and Edge runtime
 * Uses native crypto in Node.js and Web Crypto API in Edge/browser environments
 */
export function randomUUID(): string {
  // Check if we're in a Node.js environment with native crypto
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Use native Node.js crypto
    try {
      // Dynamic import to avoid bundling issues
      // This will only be executed in a Node.js environment
      return require('crypto').randomUUID();
    } catch (e) {
      // Fallback to Web Crypto API if crypto module isn't available
      console.warn('Node crypto module not available, falling back to Web Crypto API');
    }
  }

  // Use Web Crypto API (available in browsers and Edge runtime)
  // Generate 16 random bytes and format them as UUID
  const bytes = new Uint8Array(16);
  
  // Fill with random values
  crypto.getRandomValues(bytes);
  
  // Set UUID version (v4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1

  // Format the UUID string
  let uuid = '';
  for (let i = 0; i < 16; i++) {
    // Add hyphens at appropriate positions
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      uuid += '-';
    }
    
    // Convert byte to hexadecimal
    let hex = bytes[i].toString(16);
    if (hex.length === 1) hex = '0' + hex;
    uuid += hex;
  }
  
  return uuid;
}
