import { ROLE_PATTERNS, EXCLUDE, PRIMARY, GLOBAL, APAC, REGION_LOCKED } from './config.js';

const norm = s => (s || '').replace(/\s+/g, ' ').trim();

function roleBucket(title) {
  for (const [re, bucket] of ROLE_PATTERNS) if (re.test(title)) return bucket;
  return null;
}

function level(title) {
  if (/\b(principal|staff|distinguished|architect|lead)\b/i.test(title)) return 'staff+';
  if (/\b(senior|sr\.?|snr)\b|\biii\b/i.test(title)) return 'senior';
  if (/\b(mid|ii)\b/i.test(title)) return 'mid';
  return 'unspecified';
}

function workMode(loc) {
  if (/hybrid/i.test(loc)) return 'hybrid';
  if (/on[- ]?site|in[- ]office|relocat/i.test(loc)) return 'onsite';
  if (/remote|anywhere|global/i.test(loc)) return 'remote';
  return 'unspecified';
}

const PLACES = [
  [/singapore/i, 'Singapore'], [/malaysia|kuala lumpur|penang|johor/i, 'Malaysia'],
  [/hong kong/i, 'Hong Kong'], [/tokyo|japan/i, 'Japan'], [/seoul|korea/i, 'South Korea'],
  [/sydney|melbourne|australia/i, 'Australia'], [/taiwan|taipei/i, 'Taiwan'],
  [/bangalore|bengaluru|hyderabad|mumbai|delhi|india/i, 'India'],
  [/jakarta|indonesia/i, 'Indonesia'], [/ho chi minh|hanoi|vietnam/i, 'Vietnam'],
  [/manila|philippines/i, 'Philippines'], [/bangkok|thailand/i, 'Thailand'],
  [/\bapac\b|asia[- ]pacific/i, 'APAC-wide'],
];
function place(loc) {
  for (const [re, name] of PLACES) if (re.test(loc)) return name;
  if (GLOBAL.test(loc)) return 'Worldwide';
  return 'Remote / unspecified';
}

/** Location gate. Returns null to reject, or a confidence string to keep. */
function locationVerdict(loc) {
  if (PRIMARY.test(loc)) return 'high';      // Singapore / Malaysia -- always wanted
  if (GLOBAL.test(loc))  return 'high';      // explicitly worldwide
  if (APAC.test(loc))    return 'medium';    // elsewhere in APAC
  if (REGION_LOCKED.test(loc)) return null;  // explicitly somewhere else -- drop
  // ponytail: bare "Remote" with no APAC signal is dropped. It was admitting
  // "San Francisco - Remote", "New York, NY (HQ) - Remote" etc. as APAC, because
  // REGION_LOCKED matches country names but not US city/state names.
  // Re-add a .low. tier if you start missing genuinely APAC-open remote roles.
  return null;
}

function score(j) {
  let s = 0;
  s += j.country === 'Singapore' || j.country === 'Malaysia' ? 50
     : ['Worldwide', 'APAC-wide'].includes(j.country) ? 40
     : j.apac_confidence === 'high' ? 25 : 12;
  s += ['backend','fullstack','blockchain','smart_contract','fde','solutions'].includes(j.role_bucket) ? 20 : 10;
  s += ['senior','mid'].includes(j.level) ? 15 : j.level === 'unspecified' ? 10 : 6;
  s += j.work_mode === 'remote' ? 10 : j.work_mode === 'hybrid' ? 6 : 0;
  return s;
}

export function filterAndScore(raw) {
  const out = [];
  const seen = new Set();
  for (const r of raw) {
    const title = norm(r.title), loc = norm(r.location);
    if (!title || !r.url) continue;
    if (EXCLUDE.test(title)) continue;

    const bucket = roleBucket(title);
    if (!bucket) continue;

    const conf = locationVerdict(loc);
    if (!conf) continue;

    const key = `${r.company.toLowerCase()}|${title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const j = {
      id: key,
      title,
      company: r.company.replace(/^\w/, c => c.toUpperCase()),
      location: loc || 'Not stated',
      url: r.url,
      posted: r.posted || '',
      source: r.source,
      role_bucket: bucket,
      level: level(title),
      work_mode: workMode(loc),
      country: place(loc),
      apac_confidence: conf,
    };
    j.score = score(j);
    out.push(j);
  }
  out.sort((a, b) => b.score - a.score || a.company.localeCompare(b.company));
  return out;
}
