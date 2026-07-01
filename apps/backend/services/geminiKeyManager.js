import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv, { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

const secondaryCooldowns = new Map();

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
  return (
    status === 403 ||
    msg.includes('api key not valid') ||
    msg.includes('invalid api key') ||
    msg.includes('permission denied') ||
    msg.includes('403') ||
    msg.includes('apikey') ||
    msg.includes('api_key') ||
    msg.includes('invalid_key') ||
    msg.includes('key_invalid') ||
    msg.includes('unauthorized') ||
    msg.includes('invalid key')
  );
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

    const promise = this._executeWithFailover(prompt);
    activeRequests.set(requestKey, promise);

    try {
      return await promise;
    } finally {
      activeRequests.delete(requestKey);
    }
  }

  async _executeWithFailover(prompt) {
    try {
      // 1. Try with primary Gemini key rotation
      return await this._executeWithRetry(prompt);
    } catch (geminiError) {
      console.warn(`[GeminiKeyManager] Primary Gemini keys failed: ${geminiError.message || geminiError}. Attempting failover to secondary providers...`);

      // 2. Try secondary providers (Groq, OpenRouter, Cerebras, Mistral, HuggingFace)
      try {
        const responseText = await this._trySecondaryProviders(prompt);
        if (responseText) {
          console.log(`[GeminiKeyManager] Failover successful! Returning mock response.`);
          const responsePromise = Promise.resolve({ text: () => responseText });
          responsePromise.text = () => responseText;
          return {
            response: responsePromise
          };
        }
      } catch (failoverErr) {
        console.error(`[GeminiKeyManager] Failover routine encountered a critical error:`, failoverErr.message || failoverErr);
      }

      // 3. Propagate original Gemini error if all fallbacks fail
      throw geminiError;
    }
  }

  async _trySecondaryProviders(prompt) {
    const systemInstruction = this.options?.systemInstruction || '';
    
    // Parse the user prompt safely
    let userContent = '';
    if (typeof prompt === 'string') {
      userContent = prompt;
    } else if (prompt && typeof prompt === 'object') {
      if (Array.isArray(prompt)) {
        userContent = JSON.stringify(prompt);
      } else if (prompt.contents) {
        try {
          const parts = prompt.contents[0]?.parts || [];
          userContent = parts.map(p => p.text || '').join('\n') || JSON.stringify(prompt);
        } catch {
          userContent = JSON.stringify(prompt);
        }
      } else {
        userContent = JSON.stringify(prompt);
      }
    } else {
      userContent = String(prompt);
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: userContent });

    const providers = [
      {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        getHeaders: (key) => ({
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        })
      },
      {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        models: ['google/gemini-2.5-flash:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2-5-72b-instruct:free'],
        getHeaders: (key) => ({
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Team-8 AI Platform'
        })
      },
      {
        name: 'Cerebras',
        apiKey: process.env.CEREBRAS_API_KEY,
        endpoint: 'https://api.cerebras.ai/v1/chat/completions',
        models: ['llama3.1-8b', 'llama-3.3-70b'],
        getHeaders: (key) => ({
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        })
      },
      {
        name: 'Mistral',
        apiKey: process.env.MISTRAL_API_KEY,
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        models: ['mistral-tiny', 'mistral-small-latest', 'open-mistral-7b'],
        getHeaders: (key) => ({
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        })
      },
      {
        name: 'HuggingFace',
        apiKey: process.env.HF_TOKEN || process.env.HF_API_KEY,
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        models: ['meta-llama/Meta-Llama-3-8B-Instruct:together', 'meta-llama/Llama-3.2-3B-Instruct'],
        getHeaders: (key) => ({
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        })
      }
    ];

    for (const provider of providers) {
      if (!provider.apiKey) {
        continue;
      }

      // Check circuit breaker/cooldown
      const cooldownEnd = secondaryCooldowns.get(provider.name);
      if (cooldownEnd && Date.now() < cooldownEnd) {
        console.log(`[GeminiKeyManager] Skipping ${provider.name} (cooling down)...`);
        continue;
      }

      for (const modelName of provider.models) {
        try {
          console.log(`[GeminiKeyManager] Failover: Attempting request to ${provider.name} (model: ${modelName})`);
          
          const response = await axios.post(provider.endpoint, {
            model: modelName,
            messages,
            temperature: this.options?.temperature ?? 0.3,
            max_tokens: this.options?.maxOutputTokens ?? 1500
          }, {
            headers: provider.getHeaders(provider.apiKey),
            timeout: 15000 // 15s timeout
          });

          const text = response.data?.choices?.[0]?.message?.content;
          if (text) {
            console.log(`[GeminiKeyManager] Failover succeeded via ${provider.name} (${modelName})`);
            return text;
          }
          throw new Error('Empty response content received.');
        } catch (err) {
          const errMsg = err.response?.data?.error?.message || err.message || '';
          console.error(`[GeminiKeyManager] Failover to ${provider.name} (${modelName}) failed:`, errMsg);
          
          const status = err.response?.status;
          const msgLower = errMsg.toLowerCase();
          const isAuthError = status === 401 || status === 403 || 
                              msgLower.includes('api key') || msgLower.includes('apikey') || 
                              msgLower.includes('unauthorized') || msgLower.includes('invalid key') || 
                              msgLower.includes('forbidden') || msgLower.includes('credentials') || 
                              msgLower.includes('not permitted');

          if (isAuthError) {
            console.warn(`[GeminiKeyManager] Disabling secondary provider ${provider.name} for 24h due to authentication/key failure.`);
            secondaryCooldowns.set(provider.name, Date.now() + 24 * 60 * 60 * 1000);
            break; // Skip other models for this provider
          }

          // Check for 429 rate limits
          if (status === 429 || msgLower.includes('429') || msgLower.includes('quota') || msgLower.includes('rate limit') || msgLower.includes('rate_limit')) {
            console.warn(`[GeminiKeyManager] Cooling down ${provider.name} for 60s due to rate limit/quota.`);
            secondaryCooldowns.set(provider.name, Date.now() + 60000);
            break; // Skip other models for this provider
          }
        }
      }
    }

    return null;
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

      // If all keys are cooling down, do NOT block the HTTP request thread!
      if (!selectedKeyObj) {
        const cooldownSec = getGeminiCooldownSeconds();
        console.warn(`[GeminiKeyManager] All Gemini API keys are cooling down. Skipping retry wait to prevent socket hang up.`);
        throw new Error(`All Gemini API keys are cooling down. Cooldown active for another ${cooldownSec}s.`);
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
