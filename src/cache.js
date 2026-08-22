import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { CACHE_TTL_HOURS, CACHE_FILE } from './config.js';

const TTL_MS = CACHE_TTL_HOURS * 3600 * 1000;
let store = {};

export async function loadCache() {
  try { store = JSON.parse(await readFile(CACHE_FILE, 'utf8')); }
  catch { store = {}; }
  return store;
}

export async function saveCache() {
  await mkdir('data', { recursive: true });
  // Drop entries untouched for a week so the file cannot grow without bound.
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  for (const [k, v] of Object.entries(store)) if (v.ts < cutoff) delete store[k];
  await writeFile(CACHE_FILE, JSON.stringify(store));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Fetch with the caching policy you asked for:
 *   - a cached body younger than 24h is returned without touching the network
 *   - otherwise fetch, with 3 attempts and exponential backoff
 *   - if every attempt fails but we still hold a STALE cached body, serve that
 *     rather than losing the listing entirely (a board being briefly down
 *     should not make yesterday's jobs vanish from your dashboard)
 */
export async function cachedFetch(url, { attempts = 3, timeoutMs = 20000 } = {}) {
  const hit = store[url];
  if (hit && Date.now() - hit.ts < TTL_MS) return { body: hit.body, cached: true };

  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'user-agent': 'apac-jobs-radar/1.0 (personal job search)', accept: '*/*' },
      });
      clearTimeout(t);
      if (res.status === 404) return { body: null, cached: false, missing: true };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      store[url] = { ts: Date.now(), body };
      return { body, cached: false };
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(600 * 2 ** i);
    }
  }
  if (hit) {
    console.warn(`  ! ${url} failed (${lastErr.message}) - serving stale cache`);
    return { body: hit.body, cached: true, stale: true };
  }
  console.warn(`  ! ${url} failed (${lastErr.message}) - no cache to fall back on`);
  return { body: null, cached: false, error: lastErr.message };
}
