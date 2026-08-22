import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { loadCache, saveCache } from './cache.js';
import { collectAll } from './sources.js';
import { filterAndScore } from './filter.js';
import { render } from './render.js';
import { notify } from './telegram.js';
import { SEEN_FILE } from './config.js';

const DRY = !!process.env.DRY_RUN;

async function readSeen() {
  try { return new Set(JSON.parse(await readFile(SEEN_FILE, 'utf8'))); }
  catch { return new Set(); }
}

async function main() {
  const t0 = Date.now();
  console.log('APAC jobs radar\n---------------');

  await loadCache();
  console.log('* collecting from boards...');
  const raw = await collectAll();
  console.log(`  ${raw.length} raw postings`);

  const jobs = filterAndScore(raw);
  console.log(`* ${jobs.length} passed the role / seniority / location filters`);

  const seen = await readSeen();
  const firstRun = seen.size === 0;
  const fresh = jobs.filter(j => !seen.has(j.id));
  console.log(`* ${fresh.length} new since last run${firstRun ? ' (first run -- suppressing the alert)' : ''}`);

  jobs.forEach(j => { j.is_new = !firstRun && !seen.has(j.id); });

  await render(jobs);

  if (!DRY) {
    await notify({
      token:   process.env.TELEGRAM_BOT_TOKEN,
      chatId:  process.env.TELEGRAM_CHAT_ID,
      pageUrl: process.env.PAGE_URL,
      fresh:   firstRun ? [] : fresh,
      total:   jobs.length,
    });
    await mkdir('data', { recursive: true });
    await writeFile(SEEN_FILE, JSON.stringify(jobs.map(j => j.id), null, 0));
    await saveCache();
  } else {
    console.log('  DRY_RUN -- nothing pushed, nothing persisted');
    console.log(fresh.slice(0, 15).map(j => `    ${j.score}  ${j.company} - ${j.title} (${j.country})`).join('\n'));
  }

  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
