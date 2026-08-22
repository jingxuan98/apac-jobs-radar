// ---------------------------------------------------------------------------
// WHAT TO WATCH.  Add or remove slugs freely -- a wrong slug just 404s and is
// skipped, so it is safe to guess.  Find a slug from a company's careers URL:
//   boards.greenhouse.io/SLUG  |  jobs.lever.co/SLUG  |  jobs.ashbyhq.com/SLUG
// ---------------------------------------------------------------------------
export const BOARDS = {
  greenhouse: [
    'okx','bybit','gemini','ripple','bitgo','falconx','coinbase','kraken','circle',
    'chainalysis','consensys','paxos','blockdaemon','fireblocks','ledger','moonpay',
    'gsrmarkets','wintermute','keyrock','talos','deribit','matterlabs','offchainlabs',
    'uniswaplabs','dydxtrading','stripe','databricks','snowflake','gitlab','elastic',
  ],
  lever: [
    'anchorage','immutable','matchgroup','zeta','palantir','Coda','portcast',
    'chainlinklabs','parity','nethermind','aptoslabs','mysten-labs','celestia',
    'eigenlabs','magiceden','phantom','animocabrands','sygnum','hashkey',
    'independentreserve','dtcpay','triple-a',
  ],
  ashby: [
    'airwallex','Coinhako','railway','neon','temporal','supabase','turnkey',
    'openai','ramp','linear','replit','vercel','render','clickhouse','modal',
    'anysphere','sierra','decagon','figment','alchemy','thirdweb','dynamic',
    'privy','fordefi','safe','lido','kiln','chorusone','p2porg','elevenlabs',
  ],
};

// Extra plain-RSS sources (no auth, cheap to poll).
export const RSS = [
  'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
];

// ---------------------------------------------------------------------------
// ROLE MATCHING
// ---------------------------------------------------------------------------
export const ROLE_PATTERNS = [
  [/forward[- ]deployed|deployment strateg|field engineer|applied engineer/i, 'fde'],
  [/smart[- ]contract|solidity|\bsolana\b|\brust engineer\b|protocol engineer/i, 'smart_contract'],
  [/blockchain|web3|crypto engineer|\bdefi\b/i, 'blockchain'],
  [/full[- ]?stack/i, 'fullstack'],
  [/back[- ]?end|backend/i, 'backend'],
  [/solutions? (engineer|architect)|sales engineer|technical account|integrations? engineer|customer success engineer/i, 'solutions'],
  [/site reliability|\bsre\b/i, 'sre'],
  [/platform engineer|infrastructure engineer|devops|developer experience|developer relations/i, 'platform'],
  [/software engineer|software developer|engineer\b/i, 'generalist'],
];

// Hard excludes -- checked BEFORE role matching.
export const EXCLUDE = /\b(intern|internship|graduate|new grad|fresh grad|junior|entry[- ]level|apprentice|trainee)\b|\b(engineering manager|director|vice president|\bvp\b|head of|chief)\b|data scientist|research scientist|\bqa\b|quality assurance|recruiter|accountant|marketing|designer|\b(regional lead|account executive|business development|\bbd\b|partnerships?|sales manager|go[- ]to[- ]market|revenue)\b|trader|quantitative researcher/i;

// ---------------------------------------------------------------------------
// LOCATION MATCHING -- the filter that actually matters.
// ---------------------------------------------------------------------------
export const PRIMARY = /singapore|malaysia|kuala lumpur|\bkl\b|johor|penang/i;
export const GLOBAL  = /worldwide|anywhere in the world|globally remote|global \(remote\)|remote - global|no geographic|fully remote|work from anywhere/i;
export const APAC    = /\bapac\b|asia[- ]pacific|\basia\b|hong kong|tokyo|japan|seoul|south korea|taipei|taiwan|sydney|melbourne|australia|bangalore|bengaluru|hyderabad|mumbai|delhi|india|jakarta|indonesia|ho chi minh|hanoi|vietnam|manila|philippines|bangkok|thailand|shanghai|shenzhen|beijing/i;
// Anything matching this AND NOT matching the three above is dropped.
export const REGION_LOCKED = /united states|\busa\b|\bu\.s\.|remote - us|us remote|us only|americas|canada|latam|\bemea\b|europe only|united kingdom|london only|germany|poland|portugal|spain|brazil|mexico|argentina/i;

export const CACHE_TTL_HOURS = 24;
export const CACHE_FILE = 'data/cache.json';
export const SEEN_FILE  = 'data/seen.json';
export const OUT_JSON   = 'docs/jobs.json';
export const OUT_HTML   = 'docs/index.html';
