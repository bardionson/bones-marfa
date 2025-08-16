/**
 * Security utility functions for API routes
 */

/**
 * Add security headers to API responses
 * @param {Response} response - The response object to add headers to
 * @returns {Response} Response with security headers added
 */
export function addSecurityHeaders(response) {
  if (!response || !response.headers) return response;

  // Prevent content type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent framing (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy (restrict access to sensitive APIs)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict transport security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return response;
}

/**
 * Create a secure JSON response with security headers
 * @param {any} data - Data to return as JSON
 * @param {ResponseInit} init - Response initialization options
 * @returns {Response} Secure JSON response
 */
export function secureJsonResponse(data, init = {}) {
  const response = new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  
  return addSecurityHeaders(response);
}

/**
 * Sanitize and validate input data to prevent injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate wallet address format
 * @param {string} address - Wallet address to validate
 * @returns {boolean} True if valid Ethereum address format
 */
export function isValidWalletAddress(address) {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Rate limiting helper (basic implementation)
 * @param {string} identifier - Unique identifier for rate limiting
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if request is allowed
 */
const rateLimitStore = new Map();
export function isRateLimited(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) || 0;
  if (current >= maxRequests) {
    return true;
  }
  
  rateLimitStore.set(key, current + 1);
  
  // Cleanup old entries
  for (const [k] of rateLimitStore) {
    const keyTime = parseInt(k.split('_')[1]);
    if (now - keyTime * windowMs > windowMs * 2) {
      rateLimitStore.delete(k);
    }
  }
  
  return false;
}

/**
 * Secure fetch wrapper that prevents header forwarding to untrusted sites
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function secureFetch(url, options = {}) {
  // List of trusted domains - add your trusted domains here
  const trustedDomains = [
    'api.create.xyz',
    'ipfs.io',
    'gateway.pinata.cloud',
    // Add other trusted domains as needed
  ];
  
  try {
    const urlObj = new URL(url);
    const isTrusted = trustedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    // If not trusted, remove sensitive headers
    if (!isTrusted && options.headers) {
      const filteredHeaders = { ...options.headers };
      
      // Remove potentially sensitive headers
      delete filteredHeaders['Authorization'];
      delete filteredHeaders['Cookie'];
      delete filteredHeaders['X-API-Key'];
      delete filteredHeaders['X-Auth-Token'];
      
      options = { ...options, headers: filteredHeaders };
    }
    
    // Use native fetch with security measures
    const response = await fetch(url, {
      ...options,
      // Prevent following redirects to untrusted sites
      redirect: 'manual'
    });
    
    return response;
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
}