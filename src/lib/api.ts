import { Hero, DotaItem } from '@/types';

const proxy = (url: string) => `/api/image?url=${encodeURIComponent(url)}`;

const STEAM_IMG = (name: string) =>
  proxy(`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${name.replace('npc_dota_hero_', '')}_full.png`);

const STEAM_ITEM_IMG = (path: string) =>
  proxy(`https://cdn.cloudflare.steamstatic.com${path.split('?')[0]}`);

export const proxyImg = proxy;

// ─── Module-level caches ───────────────────────────────────────────────────
let heroCache: Hero[] | null = null;
const matchupCache = new Map<number, { hero_id: number; games_played: number; wins: number }[]>();
let itemCache: Record<string, DotaItem> | null = null;
let heroStatsCache: Record<string, any> | null = null;

// ─── Heroes ───────────────────────────────────────────────────────────────
export async function fetchHeroes(): Promise<Hero[]> {
  if (heroCache) return heroCache;
  const r = await fetch('https://api.opendota.com/api/heroes');
  if (!r.ok) return [];
  const heroes = await r.json();
  heroCache = heroes.map((h: any) => ({ ...h, img: STEAM_IMG(h.name) }));
  return heroCache!;
}

// ─── Matchups ─────────────────────────────────────────────────────────────
export async function fetchHeroMatchups(heroId: number) {
  if (matchupCache.has(heroId)) return matchupCache.get(heroId)!;
  const r = await fetch(`https://api.opendota.com/api/heroes/${heroId}/matchups`);
  if (!r.ok) return [];
  const data = await r.json();
  matchupCache.set(heroId, data);
  return data as { hero_id: number; games_played: number; wins: number }[];
}

// ─── Items ────────────────────────────────────────────────────────────────
export async function fetchItems(): Promise<Record<string, DotaItem>> {
  if (itemCache) return itemCache;
  const r = await fetch('https://api.opendota.com/api/constants/items');
  if (!r.ok) return {};
  const raw = await r.json();
  // Enrich with full Steam CDN image URL
  const enriched: Record<string, DotaItem> = {};
  for (const [key, val] of Object.entries(raw) as [string, any][]) {
    enriched[key] = {
      ...val,
      img: val.img ? STEAM_ITEM_IMG(val.img) : '',
    };
  }
  itemCache = enriched;
  return itemCache;
}

// ─── Hero stats (detailed) ────────────────────────────────────────────────
export async function fetchHeroStats(): Promise<Record<string, any>> {
  if (heroStatsCache) return heroStatsCache;
  const r = await fetch('https://api.opendota.com/api/constants/heroes');
  if (!r.ok) return {};
  heroStatsCache = await r.json();
  return heroStatsCache!;
}

// ─── Player profile ──────────────────────────────────────────────────────
export function steamId64ToAccountId(input: string): number {
  const num = BigInt(input.trim());
  const base = BigInt('76561197960265728');
  return num > base ? Number(num - base) : Number(num);
}

export async function fetchPlayerProfile(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}`);
  if (!r.ok) throw new Error('Player not found');
  return r.json();
}

export async function fetchPlayerHeroes(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/heroes`);
  if (!r.ok) return [];
  return r.json() as Promise<{ hero_id: number; games: number; win: number; last_played: number }[]>;
}

export async function fetchPlayerWL(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/wl`);
  if (!r.ok) return { win: 0, lose: 0 };
  return r.json() as Promise<{ win: number; lose: number }>;
}

export async function fetchPlayerTotals(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/totals`);
  if (!r.ok) return [];
  return r.json() as Promise<{ field: string; n: number; sum: number }[]>;
}

export async function fetchPlayerRecentMatches(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/recentMatches`);
  if (!r.ok) return [];
  return r.json();
}

export async function fetchPlayerPeers(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/peers`);
  if (!r.ok) return [];
  return r.json();
}

export async function fetchPlayerCounts(accountId: number) {
  const r = await fetch(`https://api.opendota.com/api/players/${accountId}/counts`);
  if (!r.ok) return {};
  return r.json();
}

// ─── Patch version ───────────────────────────────────────────────────────
let patchCache: string | null = null;

export async function fetchCurrentPatch(): Promise<string> {
  if (patchCache) return patchCache;
  const r = await fetch('https://api.opendota.com/api/constants/patch');
  if (!r.ok) return '';
  const patches = await r.json();
  const latest = Array.isArray(patches) ? patches[patches.length - 1] : null;
  patchCache = latest?.name ?? '';
  return patchCache!;
}
