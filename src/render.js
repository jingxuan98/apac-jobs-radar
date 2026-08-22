import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { OUT_HTML, OUT_JSON } from './config.js';

const here = dirname(fileURLToPath(import.meta.url));

export async function render(jobs) {
  const tpl = await readFile(join(here, 'template.html'), 'utf8');
  const stamp = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) + ' MYT';

  const html = tpl
    .replace('__DATA__', JSON.stringify(jobs))
    .replace('__TS__', stamp);

  await mkdir('docs', { recursive: true });
  // Vercel Hobby serves the production domain publicly, so keep it out of search.
  await writeFile('docs/robots.txt', 'User-agent: *\nDisallow: /\n');
  await writeFile(OUT_HTML, html);
  await writeFile(OUT_JSON, JSON.stringify(jobs, null, 1));
  // Stops GitHub Pages running the output through Jekyll.
  await writeFile('docs/.nojekyll', '');
  console.log(`  wrote ${OUT_HTML} (${jobs.length} roles)`);
}
