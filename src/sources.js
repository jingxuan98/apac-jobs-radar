import { cachedFetch } from './cache.js';
import { BOARDS, RSS } from './config.js';

const j = s => { try { return JSON.parse(s); } catch { return null; } };

async function greenhouse(slug) {
  const { body } = await cachedFetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`);
  const d = body && j(body);
  if (!d?.jobs) return [];
  return d.jobs.map(x => ({
    title: x.title,
    company: slug,
    location: x.location?.name ?? '',
    url: x.absolute_url,
    posted: x.updated_at ?? '',
    source: 'greenhouse',
  }));
}

async function lever(slug) {
  const { body } = await cachedFetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  const d = body && j(body);
  if (!Array.isArray(d)) return [];
  return d.map(x => ({
    title: x.text,
    company: slug,
    location: [x.categories?.location, x.categories?.commitment].filter(Boolean).join(' - '),
    url: x.hostedUrl,
    posted: x.createdAt ? new Date(x.createdAt).toISOString() : '',
    source: 'lever',
  }));
}

async function ashby(slug) {
  const { body } = await cachedFetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
  const d = body && j(body);
  if (!d?.jobs) return [];
  return d.jobs.map(x => ({
    title: x.title,
    company: slug,
    location: [x.location, x.isRemote ? 'Remote' : '', x.employmentType].filter(Boolean).join(' - '),
    url: x.jobUrl,
    posted: x.publishedAt ?? '',
    source: 'ashby',
  }));
}

async function rss(url) {
  const { body } = await cachedFetch(url);
  if (!body) return [];
  const out = [];
  for (const m of body.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const pick = t => (b.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() ?? '';
    const raw = pick('title');
    const [company, ...rest] = raw.split(':');
    out.push({
      title: (rest.join(':') || raw).trim(),
      company: rest.length ? company.trim() : 'unknown',
      location: pick('region') || pick('category') || '',
      url: pick('link'),
      posted: pick('pubDate'),
      source: 'weworkremotely',
    });
  }
  return out;
}

const RUNNERS = { greenhouse, lever, ashby };

export async function collectAll({ concurrency = 6 } = {}) {
  const tasks = [];
  for (const [kind, slugs] of Object.entries(BOARDS))
    for (const s of slugs) tasks.push(() => RUNNERS[kind](s));
  for (const u of RSS) tasks.push(() => rss(u));

  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < tasks.length) {
      const n = i++;
      try { results.push(...await tasks[n]()); }
      catch (e) { console.warn(`  ! source ${n} threw: ${e.message}`); }
    }
  }));
  return results;
}
