# APAC Jobs Radar

Daily scan for mid-to-senior engineering roles across **Singapore, Malaysia and
the wider APAC region** — plus genuinely global-remote roles. Publishes a
filterable dashboard to **Vercel** and pushes only the *new* listings to
Telegram.

**How the pieces split:** GitHub Actions does the scraping on a daily cron
(free, no timeout pressure). It commits the refreshed `docs/` to the repo.
Vercel watches the repo and redeploys automatically on that commit. Your
laptop is not involved at any point.

Vercel Cron cannot do the scraping itself — the Hobby plan caps functions at
**10 seconds** and a full pass over ~80 job boards takes far longer. Actions has
no such limit, which is why the work lives there.

It reads companies' own applicant-tracking boards (Greenhouse, Lever, Ashby)
rather than aggregators, so listings are current and every apply link goes
direct to the employer.

---

## Setup (about 10 minutes, all free)

### 1. Create the repo

Create it as **Private** at [github.com/new](https://github.com/new), then:

```bash
git init && git add -A && git commit -m "initial"
git remote add origin git@github.com:jinguxan98/apac-jobs-radar.git
git branch -M main && git push -u origin main
```

### 2. Make a Telegram bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → follow the prompts.
2. Copy the token it gives you (looks like `8123456789:AAH...`).
3. Send your new bot any message (it cannot message you until you do).
4. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and
   copy `result[0].message.chat.id` — that is your chat ID.

### 3. Add the secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | the token from BotFather |
| `TELEGRAM_CHAT_ID` | the chat ID from step 2 |

### 4. Connect Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** your private repo
   (Hobby deploys private *personal* repos free; only org-owned repos need Pro).
2. Vercel reads `vercel.json` and serves `docs/` as a static site — leave every
   build setting alone, just click **Deploy**.
3. Copy the resulting `https://<project>.vercel.app` URL.
4. Back in GitHub: **Settings → Secrets and variables → Actions → Variables**,
   add `PAGE_URL` = that URL, so the Telegram messages link to your dashboard.

From then on, every daily commit from the workflow triggers a Vercel redeploy
automatically. Nothing else to wire up.

> **Name the Vercel project something neutral.** On the Hobby plan the
> production domain is publicly reachable — protecting it requires Pro. The page
> itself contains nothing personal (it is just public job listings) and ships
> with `noindex` headers plus a `robots.txt` so search engines skip it, but a
> project named `jingxuan-job-hunt` would still be a giveaway to anyone who
> guessed the URL. Something like `sg-eng-index` gives nothing away.

### 5. Run it

**Actions → Daily job radar → Run workflow.** After that it runs itself at
**08:00 MYT every day**.

> The first run deliberately sends no Telegram message — otherwise you would get
> pinged with all ~120 existing roles at once. From the second run on, you only
> hear about genuinely new postings.

---

## Tuning it

Everything you would want to change lives in **`src/config.js`**:

- **`BOARDS`** — the companies to watch. Add a slug from any careers URL
  (`boards.greenhouse.io/SLUG`, `jobs.lever.co/SLUG`, `jobs.ashbyhq.com/SLUG`).
  A wrong slug just 404s and is skipped, so guessing is safe.
- **`ROLE_PATTERNS`** — which titles count, and which bucket they land in.
- **`EXCLUDE`** — hard rejects, checked before anything else.
- **`PRIMARY` / `GLOBAL` / `APAC` / `REGION_LOCKED`** — the location gate.
  `REGION_LOCKED` is what drops the "Remote" roles that silently mean
  "Remote (US only)".

Test changes without sending anything or writing state:

```bash
npm run dry
```

---

## How the caching works

`src/cache.js` implements the policy you asked for:

- a cached response younger than **24 hours** is served without touching the network
- otherwise it fetches, retrying **3 times with exponential backoff**
- if every attempt fails but a **stale** cached copy exists, it serves that
  rather than dropping the listings — a board being briefly down should not make
  yesterday's jobs vanish from the dashboard
- entries untouched for a week are evicted so the cache file cannot grow forever

Because GitHub Actions runners are ephemeral, the cache is committed back to
`data/cache.json` — that is what makes it persist between daily runs.

## Costs

Everything here is free, and stays free at this volume:

| | Usage | Free allowance |
|---|---|---|
| GitHub Actions | ~90 min/month | 2,000 min/month on private repos |
| Vercel Hobby | a few MB/month | 100 GB bandwidth |

The only paid path you might ever want is Vercel Pro, and only if you decide you
want the production URL password-protected rather than merely unlisted.

---

## Files

```
src/config.js     what to watch and how to filter   <- tune this
src/cache.js      24h cache, retry, stale fallback
src/sources.js    Greenhouse / Lever / Ashby / RSS adapters
src/filter.js     role, seniority and location gates + scoring
src/render.js     writes docs/index.html + docs/jobs.json
src/telegram.js   batched HTML push, 4096-char safe
src/index.js      orchestration and new-since-last-run diffing
data/cache.json   HTTP cache      (committed by the workflow)
data/seen.json    IDs already alerted on (committed by the workflow)
vercel.json       tells Vercel to serve docs/ as static, adds noindex headers
docs/             the published dashboard (Vercel's output directory)
```

## Scoring

Roles are ranked, not judged. Singapore/Malaysia placement weighs heaviest,
then role fit, then seniority band, then remote flexibility. A 70 you are
excited about beats a 95 you are not.
