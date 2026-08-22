const API = 'https://api.telegram.org';

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function send(token, chatId, text) {
  const res = await fetch(`${API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Telegram caps a message at 4096 chars, so batch into chunks. */
export async function notify({ token, chatId, fresh, pageUrl, total }) {
  if (!token || !chatId) { console.log('  (no Telegram credentials -- skipping push)'); return; }
  if (!fresh.length) { console.log('  no new roles -- staying quiet'); return; }

  const header = `<b>${fresh.length} new role${fresh.length > 1 ? 's' : ''}</b> — ${total} live on the board\n` +
                 (pageUrl ? `<a href="${esc(pageUrl)}">Open dashboard</a>\n` : '');

  const lines = fresh.slice(0, 40).map(j => {
    const flag = j.country === 'Singapore' ? '\u{1F1F8}\u{1F1EC}'
               : j.country === 'Malaysia' ? '\u{1F1F2}\u{1F1FE}'
               : j.country === 'Worldwide' ? '\u{1F310}' : '\u{1F4CD}';
    return `${flag} <a href="${esc(j.url)}">${esc(j.title)}</a>\n` +
           `<i>${esc(j.company)}</i> · ${esc(j.location)} · ${esc(j.level)}`;
  });
  if (fresh.length > 40) lines.push(`<i>…and ${fresh.length - 40} more on the dashboard</i>`);

  let buf = header;
  for (const line of lines) {
    if ((buf + '\n' + line).length > 3800) { await send(token, chatId, buf); buf = ''; }
    buf += (buf ? '\n\n' : '') + line;
  }
  if (buf.trim()) await send(token, chatId, buf);
  console.log(`  pushed ${fresh.length} new role(s) to Telegram`);
}
