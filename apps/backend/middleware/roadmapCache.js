const cache = new Map();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get item from in-memory cache
 * @param {string} key 
 * @returns {any|null}
 */
export function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Set item in-memory cache with TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlMs 
 */
export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlMs
  });
}

/**
 * Invalidate a specific cache key
 * @param {string} key 
 */
export function invalidate(key) {
  cache.delete(key);
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  cache.clear();
}
