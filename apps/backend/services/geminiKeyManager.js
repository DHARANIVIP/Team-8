import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API Key Manager
 * 
 * Supports multiple GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
 * Automatically rotates to the next available key when one hits a 429 rate limit.
 * Keys are temporarily marked as exhausted and restored after their cooldown period.
 */

// Collect all Gemini API keys from environment
function collectKeys() {
  const keys = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary) keys.push({ key: primary, index: 0 });

  for (let i = 2; i <= 20; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push({ key: k, index: i });
  }
  return keys;
}

// Track exhausted keys: Map<keyString, expiryTimestamp>
const exhaustedKeys = new Map();

// Current key index for round-robin
let currentKeyIndex = 0;

/**
 * Get a fresh GoogleGenerativeAI instance using a non-exhausted key.
 * Returns null if no keys are configured.
 */
export function getGeminiAI() {
  const allKeys = collectKeys();
  if (allKeys.length === 0) return null;

  const now = Date.now();

  // Clean up expired entries
  for (const [k, expiry] of exhaustedKeys.entries()) {
    if (now >= expiry) exhaustedKeys.delete(k);
  }

  // Try to find a non-exhausted key starting from current position
  for (let i = 0; i < allKeys.length; i++) {
    const idx = (currentKeyIndex + i) % allKeys.length;
    const { key } = allKeys[idx];
    if (!exhaustedKeys.has(key)) {
      currentKeyIndex = (idx + 1) % allKeys.length;
      return new GoogleGenerativeAI(key);
    }
  }

  // All keys exhausted — find the one with the earliest expiry and use it
  let earliestKey = null;
  let earliestExpiry = Infinity;
  for (const { key } of allKeys) {
    const expiry = exhaustedKeys.get(key);
    if (expiry < earliestExpiry) {
      earliestExpiry = expiry;
      earliestKey = key;
    }
  }

  if (earliestKey && now >= earliestExpiry) {
    exhaustedKeys.delete(earliestKey);
    return new GoogleGenerativeAI(earliestKey);
  }

  // Return the earliest-expiring key anyway (caller will handle the 429)
  console.warn('⚠️ All Gemini API keys are rate-limited. Using the soonest-available key.');
  return new GoogleGenerativeAI(earliestKey || allKeys[0].key);
}

/**
 * Mark the given key as rate-limited with a retry delay in seconds.
 * Call this when you catch a 429 error.
 */
export function markKeyExhausted(genAI, retrySeconds = 60) {
  // genAI doesn't expose the key directly, so we track by iterating
  // Instead, we mark ALL instances created from the same key
  // Since we can't access the key from the instance, we mark by the current round-robin position
  const allKeys = collectKeys();
  const prevIdx = (currentKeyIndex - 1 + allKeys.length) % allKeys.length;
  const exhaustedKey = allKeys[prevIdx]?.key;
  if (exhaustedKey) {
    const expiry = Date.now() + (retrySeconds * 1000);
    exhaustedKeys.set(exhaustedKey, expiry);
    console.log(`🔄 Gemini key #${allKeys[prevIdx].index} rate-limited. Rotating. Next available in ${retrySeconds}s.`);
  }
}

/**
 * Extract retry delay from a Gemini 429 error message.
 * Returns seconds to wait, or null if not parseable.
 */
export function parseRetryDelay(error) {
  const msg = error?.message || '';
  const match = msg.match(/retry\s+in\s+([\d.]+)s/i) || msg.match(/"retryDelay":"(\d+)s"/);
  if (match) return Math.ceil(parseFloat(match[1]));
  return 60; // default 60s
}

/**
 * Check if an error is a 429 rate limit error.
 */
export function isRateLimitError(error) {
  const msg = error?.message || '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate');
}

/**
 * Get count of configured keys.
 */
export function getKeyCount() {
  return collectKeys().length;
}
