import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API Key Manager
 *
 * Supports GEMINI_API_KEY plus GEMINI_API_KEY_2..GEMINI_API_KEY_20.
 * Keys that hit quota/rate limits are cooled down and skipped until retry time.
 */

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

const exhaustedKeys = new Map();
let currentKeyIndex = 0;

function cleanupExpiredKeys(now = Date.now()) {
  for (const [key, expiry] of exhaustedKeys.entries()) {
    if (now >= expiry) exhaustedKeys.delete(key);
  }
}

export function getGeminiAI() {
  const allKeys = collectKeys();
  if (allKeys.length === 0) return null;

  cleanupExpiredKeys();

  for (let i = 0; i < allKeys.length; i++) {
    const idx = (currentKeyIndex + i) % allKeys.length;
    const { key } = allKeys[idx];
    if (!exhaustedKeys.has(key)) {
      currentKeyIndex = (idx + 1) % allKeys.length;
      return new GoogleGenerativeAI(key);
    }
  }

  console.warn(`All Gemini API keys are cooling down. Next retry in ${getGeminiCooldownSeconds()}s.`);
  return null;
}

export function markKeyExhausted(_genAI, retrySeconds = 60) {
  const allKeys = collectKeys();
  if (allKeys.length === 0) return;

  const prevIdx = (currentKeyIndex - 1 + allKeys.length) % allKeys.length;
  const exhaustedKey = allKeys[prevIdx]?.key;
  if (!exhaustedKey) return;

  const safeRetrySeconds = Math.max(1, Number(retrySeconds) || 60);
  exhaustedKeys.set(exhaustedKey, Date.now() + safeRetrySeconds * 1000);
  console.log(`Gemini key #${allKeys[prevIdx].index} cooling down for ${safeRetrySeconds}s.`);
}

export function parseRetryDelay(error) {
  const msg = error?.message || '';
  const match = msg.match(/retry\s+in\s+([\d.]+)s/i) || msg.match(/"retryDelay":"(\d+)s"/);
  if (match) return Math.ceil(parseFloat(match[1]));
  return 60;
}

export function isRateLimitError(error) {
  const msg = error?.message || '';
  return msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit');
}

export function isInvalidKeyError(error) {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('permission denied') || msg.includes('403');
}

export function getKeyCount() {
  return collectKeys().length;
}

export function getGeminiCooldownSeconds() {
  cleanupExpiredKeys();
  if (exhaustedKeys.size === 0) return 0;
  const earliest = Math.min(...exhaustedKeys.values());
  return Math.max(0, Math.ceil((earliest - Date.now()) / 1000));
}

export function getGeminiUnavailableMessage() {
  if (getKeyCount() === 0) return 'Gemini API is not configured. Set GEMINI_API_KEY in backend .env.';
  const cooldown = getGeminiCooldownSeconds();
  return cooldown > 0
    ? `All Gemini API keys are temporarily rate-limited. Retry in about ${cooldown}s.`
    : 'Gemini API is temporarily unavailable.';
}
