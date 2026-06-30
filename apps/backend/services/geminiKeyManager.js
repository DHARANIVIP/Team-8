import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv, { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

/**
 * Gemini API Key Manager
 *
 * Supports GEMINI_API_KEY plus GEMINI_API_KEY_2..GEMINI_API_KEY_20.
 * Keys that hit quota/rate limits are cooled down and skipped until retry time.
 */

const exhaustedKeys = new Map();
const invalidKeys = new Set();
const activeRequests = new Map();
let currentKeyIndex = 0;

function collectKeys() {
  try {
    if (dotenv && typeof dotenv.config === 'function') {
      dotenv.config({ path: envPath, override: true });
    } else if (typeof config === 'function') {
      config({ path: envPath, override: true });
    }
  } catch (err) {
    console.error('[GeminiKeyManager] Error reloading .env file:', err.message);
  }

  const keys = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary && !invalidKeys.has(primary)) {
    keys.push({ key: primary, index: 0 });
  }

  for (let i = 2; i <= 20; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k && !invalidKeys.has(k)) {
      keys.push({ key: k, index: i });
    }
  }
  return keys;
}

function cleanupExpiredKeys(now = Date.now()) {
  for (const [key, expiry] of exhaustedKeys.entries()) {
    if (now >= expiry) exhaustedKeys.delete(key);
  }
}

export function isRateLimitError(error) {
  const msg = typeof error === 'string' ? error : (error?.message || '');
  const status = error?.status || error?.statusCode || 0;
  return status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit');
}

export function isInvalidKeyError(error) {
  const msg = (typeof error === 'string' ? error : (error?.message || '')).toLowerCase();
  const status = error?.status || error?.statusCode || 0;
  return status === 403 || msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('permission denied') || msg.includes('403') || msg.includes('apikey');
}

function isRetryableError(error) {
  if (isRateLimitError(error)) return true;
  const msg = (error?.message || '').toLowerCase();
  if (
    msg.includes('500') ||
    msg.includes('503') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed') ||
    msg.includes('network error')
  ) {
    return true;
  }
  return false;
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

export function parseRetryDelay(error) {
  const msg = error?.message || '';
  const match = msg.match(/retry\s+in\s+([\d.]+)s/i) || msg.match(/"retryDelay":"(\d+)s"/);
  if (match) return Math.ceil(parseFloat(match[1]));
  return 60;
}

export function markKeyExhausted(genAI, retrySeconds = 60) {
  let keyToExhaust = null;
  if (genAI) {
    keyToExhaust = genAI.apiKey || genAI[Symbol.for('apiKey')] || (typeof genAI === 'string' ? genAI : null);
  }

  if (!keyToExhaust) {
    const allKeys = collectKeys();
    if (allKeys.length > 0) {
      const prevIdx = (currentKeyIndex - 1 + allKeys.length) % allKeys.length;
      keyToExhaust = allKeys[prevIdx]?.key;
    }
  }

  if (keyToExhaust) {
    const safeRetrySeconds = Math.max(1, Number(retrySeconds) || 60);
    exhaustedKeys.set(keyToExhaust, Date.now() + safeRetrySeconds * 1000);

    const allKeys = collectKeys();
    const match = allKeys.find(k => k.key === keyToExhaust);
    const indexStr = match ? `#${match.index}` : 'unknown';
    console.warn(`[GeminiKeyManager] Key ${indexStr} manually marked exhausted. Cooling down for ${safeRetrySeconds}s.`);
  }
}

class RobustGenerativeModel {
  constructor(options) {
    this.options = options;
  }

  async generateContent(prompt) {
    let requestKey = '';
    try {
      requestKey = JSON.stringify({ options: this.options, prompt });
    } catch {
      requestKey = Math.random().toString();
    }

    if (activeRequests.has(requestKey)) {
      console.log(`[GeminiKeyManager] Collapsing duplicate concurrent AI request for prompt: "${typeof prompt === 'string' ? prompt.substring(0, 60) : 'complex prompt'}..."`);
      return activeRequests.get(requestKey);
    }

    const promise = this._executeWithRetry(prompt);
    activeRequests.set(requestKey, promise);

    try {
      return await promise;
    } finally {
      activeRequests.delete(requestKey);
    }
  }

  async _executeWithRetry(prompt) {
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      const allKeys = collectKeys();
      if (allKeys.length === 0) {
        throw new Error('No valid Gemini API keys are configured on the server.');
      }

      cleanupExpiredKeys();

      // Find a key that is NOT cooling down
      let selectedKeyObj = null;
      for (let i = 0; i < allKeys.length; i++) {
        const idx = (currentKeyIndex + i) % allKeys.length;
        const keyObj = allKeys[idx];
        if (!exhaustedKeys.has(keyObj.key)) {
          selectedKeyObj = keyObj;
          currentKeyIndex = (idx + 1) % allKeys.length;
          break;
        }
      }

      // If all keys are cooling down, we must wait!
      if (!selectedKeyObj) {
        const cooldownSec = getGeminiCooldownSeconds();
        console.warn(`[GeminiKeyManager] All Gemini API keys are cooling down. Waiting ${cooldownSec}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, cooldownSec * 1000));
        attempt++;
        continue;
      }

      const rawAI = new GoogleGenerativeAI(selectedKeyObj.key);
      rawAI.apiKey = selectedKeyObj.key;

      try {
        console.log(`[GeminiKeyManager] Attempting request with key #${selectedKeyObj.index} (model: ${this.options.model})`);
        const model = rawAI.getGenerativeModel(this.options);
        const result = await model.generateContent(prompt);

        const response = await result.response;
        const text = typeof response.text === 'function' ? response.text() : response.text;

        const responsePromise = Promise.resolve({ text: () => text });
        responsePromise.text = () => text;

        return {
          response: responsePromise
        };
      } catch (error) {
        console.error(`[GeminiKeyManager] Key #${selectedKeyObj.index} failed:`, error.message || error);

        if (isInvalidKeyError(error)) {
          console.warn(`[GeminiKeyManager] Disabling invalid key #${selectedKeyObj.index}.`);
          invalidKeys.add(selectedKeyObj.key);
          continue;
        }

        if (isRateLimitError(error)) {
          const delay = parseRetryDelay(error);
          exhaustedKeys.set(selectedKeyObj.key, Date.now() + delay * 1000);
          console.warn(`[GeminiKeyManager] Key #${selectedKeyObj.index} rate-limited. Cooling down for ${delay}s.`);
          attempt++;
          continue;
        }

        if (isRetryableError(error)) {
          const backoffMs = Math.min(10000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
          console.warn(`[GeminiKeyManager] Transient error. Retrying in ${(backoffMs / 1000).toFixed(1)}s...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          attempt++;
          continue;
        }

        throw error;
      }
    }

    throw new Error(`All Gemini API keys exhausted or rate-limited. Tried ${maxAttempts} times.`);
  }
}

class RobustGenerativeAI {
  constructor() {
    this.apiKey = 'robust-generative-ai';
  }
  getGenerativeModel(options) {
    return new RobustGenerativeModel(options);
  }
}

export function getGeminiAI() {
  const allKeys = collectKeys();
  if (allKeys.length === 0) return null;
  return new RobustGenerativeAI();
}
