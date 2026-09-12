"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchPlayerProfile, fetchPlayerHeroes, fetchHeroes,
  steamId64ToAccountId, fetchPlayerWL, fetchPlayerTotals,
  fetchPlayerRecentMatches, fetchPlayerPeers, fetchPlayerCounts, proxyImg,
  fetchCurrentPatch,
} from "@/lib/api";
import { Hero } from "@/types";

const RANK_NAMES = ['', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
const RANK_COLORS = ['', '#aaa', '#2dd4bf', '#4ade80', '#60a5fa', '#a78bfa', '#f87171', '#fbbf24', '#fb923c'];

const GAME_MODES: Record<number, string> = {
  1: 'All Pick', 2: 'CM', 3: 'Random Draft', 4: 'Single Draft',
  5: 'All Random', 22: 'Ranked', 23: 'Turbo',
};

const LANE_ROLES: Record<number, string> = {
  1: 'Safe Lane', 2: 'Mid Lane', 3: 'Off Lane', 4: 'Support',
};

function getRankLabel(rank_tier: number) {
  if (!rank_tier) return null;
  const medal = Math.floor(rank_tier / 10);
  const stars = rank_tier % 10;
  if (medal === 8) return { name: 'Immortal', color: RANK_COLORS[8], stars: 0 };
  return { name: RANK_NAMES[medal] || '', color: RANK_COLORS[medal], stars };
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isWin(match: any) {
  return (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win);
}

interface HeroStat { hero_id: number; games: number; win: number; }

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--surface)] rounded-xl ${className ?? ''}`} />;
}

function LoadingSkeleton() {
  return (
    <>
      {/* Profile card skeleton */}
      <div className="glass-panel rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-5 shrink-0">
            {[1,2,3].map(i => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-2 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lifetime averages skeleton */}
      <div className="glass-panel rounded-2xl p-6 mb-6">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="text-center bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] space-y-2">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-2 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent matches skeleton */}
      <div className="glass-panel rounded-2xl p-6 mb-6">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-20 mb-4" />
        <div className="flex flex-col gap-2">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <Skeleton className="w-6 h-4 shrink-0" />
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-20" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Peers + Role skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1,2].map(i => (
          <div key={i} className="glass-panel rounded-2xl p-6 space-y-3">
            <Skeleton className="h-4 w-36 mb-4" />
            {Array.from({length:4}).map((_,j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ProfilePage() {
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [heroStats, setHeroStats] = useState<HeroStat[]>([]);
  const [allHeroes, setAllHeroes] = useState<Hero[]>([]);
  const [wl, setWl] = useState<{ win: number; lose: number } | null>(null);
  const [totals, setTotals] = useState<{ field: string; n: number; sum: number }[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [currentPatch, setCurrentPatch] = useState('');
  const [loadedAccountId, setLoadedAccountId] = useState<number | null>(null);

  useEffect(() => {
    fetchHeroes().then(setAllHeroes).catch(() => {});
    fetchCurrentPatch().then(setCurrentPatch).catch(() => {});
    const saved = localStorage.getItem('dota_steam_id');
    if (saved) setInput(saved);
  }, []);

  const validateInput = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Enter a Steam ID.';
    if (/^\d+$/.test(trimmed)) {
      if (trimmed.length === 17) return null; // SteamID64
      if (trimmed.length <= 10) return null; // OpenDota account ID
      return 'SteamID64 must be 17 digits. OpenDota account IDs are up to 10 digits.';
    }
    return 'Enter only numbers — no spaces or letters.';
  };

  const loadProfile = async () => {
    const validationError = validateInput(input);
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    setProfile(null);
    try {
      const id = steamId64ToAccountId(input.trim());
      setLoadedAccountId(id);
      const [prof, heroes, wlData, totalsData, recent, peersData, countsData] = await Promise.all([
        fetchPlayerProfile(id),
        fetchPlayerHeroes(id),
        fetchPlayerWL(id),
        fetchPlayerTotals(id),
        fetchPlayerRecentMatches(id),
        fetchPlayerPeers(id),
        fetchPlayerCounts(id),
      ]);
      if (prof.profile) {
        setProfile(prof);
        setHeroStats([...heroes].filter((h: HeroStat) => h.games > 0).sort((a: HeroStat, b: HeroStat) => b.games - a.games).slice(0, 20));
        setWl(wlData);
        setTotals(totalsData);
        setRecentMatches(recent.slice(0, 10));
        setPeers([...peersData].sort((a: any, b: any) => b.with_games - a.with_games).slice(0, 5));
        setCounts(countsData);
        localStorage.setItem('dota_steam_id', input.trim());
      } else {
        setError('Profile is private or not found.');
        setGuideOpen(true);
      }
    } catch {
      setError('Could not load profile. Check your Steam ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const rank = profile ? getRankLabel(profile.rank_tier) : null;

  const avgStat = (field: string) => {
    const t = totals.find(x => x.field === field);
    return t && t.n > 0 ? (t.sum / t.n).toFixed(1) : '—';
  };

  const laneRoleData = counts?.lane_role
    ? Object.entries(counts.lane_role as Record<string, { games: number; win: number }>)
        .filter(([k]) => k !== '0')
        .map(([k, v]) => ({ role: LANE_ROLES[Number(k)] || `Pos ${k}`, games: v.games, win: v.win }))
        .sort((a, b) => b.games - a.games)
    : [];

  const maxRoleGames = laneRoleData.reduce((m, r) => Math.max(m, r.games), 1);

  return (
    <div className="min-h-screen text-[var(--foreground)] relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-900/8 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--accent-gold)] opacity-60" />
              <span className="text-[var(--accent-gold)] text-[10px] font-semibold tracking-[0.3em] uppercase opacity-80">Player Hub</span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--accent-gold)] opacity-60" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black gold-text leading-tight">Player Profile</h1>
            <p className="text-[var(--muted)] text-xs mt-1">Connect via OpenDota to view your stats</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentPatch && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <svg className="w-3 h-3 text-[var(--accent-gold)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] text-[var(--accent-gold)] font-bold">{currentPatch}</span>
              </div>
            )}
            <Link href="/draft" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--background)] text-sm font-bold hover:brightness-110 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Draft Assistant
            </Link>
          </div>
        </div>

        {/* Input */}
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Steam ID</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            Enter your SteamID64 (17 digits) or OpenDota account ID. Find it at{' '}
            <span className="text-[var(--accent-gold)]">steamid.io</span> or your Steam profile URL.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadProfile()}
              placeholder="76561198xxxxxxxxx or account ID"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:border-[var(--accent-gold)]/50 transition-all"
            />
            <button
              onClick={loadProfile}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--background)] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading
                </span>
              ) : 'Load Profile'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          {/* Collapsible public-profile guide */}
          <button
            onClick={() => setGuideOpen(o => !o)}
            className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${guideOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            How to make your profile public on OpenDota
          </button>
          {guideOpen && (
            <div className="mt-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
              <p className="font-semibold text-[var(--foreground)]">Your data must be public for this to work:</p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>Open <span className="text-[var(--accent-gold)]">opendota.com</span> and click <strong className="text-[var(--foreground)]">Sign in with Steam</strong>.</li>
                <li>In Dota 2, go to <strong className="text-[var(--foreground)]">Settings → Social</strong> and enable <strong className="text-[var(--foreground)]">Expose Public Match Data</strong>.</li>
                <li>Back on OpenDota, go to your profile and click <strong className="text-[var(--foreground)]">Refresh</strong> to sync your matches.</li>
                <li>Return here and enter your Steam ID.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && <LoadingSkeleton />}

        {/* Loaded profile */}
        {profile?.profile && !loading && (
          <>
            {/* Profile Card */}
            <div className="glass-panel rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-5">
                <img src={proxyImg(profile.profile.avatarfull)} alt={profile.profile.personaname}
                  className="w-16 h-16 rounded-xl border border-[var(--border)] object-cover"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[var(--foreground)] truncate">{profile.profile.personaname}</h2>
                  {rank ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold" style={{ color: rank.color }}>{rank.name}</span>
                      {rank.stars > 0 && (
                        <span className="flex gap-0.5">
                          {Array.from({ length: rank.stars }).map((_, i) => (
                            <span key={i} className="text-[10px]" style={{ color: rank.color }}>★</span>
                          ))}
                        </span>
                      )}
                    </div>
                  ) : <p className="text-xs text-[var(--muted)] mt-1">Unranked / Rank hidden</p>}
                  {loadedAccountId && (
                    <div className="flex gap-2 mt-2">
                      <a href={`https://www.dotabuff.com/players/${loadedAccountId}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/30">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        Dotabuff
                      </a>
                      <a href={`https://www.opendota.com/players/${loadedAccountId}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/30">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        OpenDota
                      </a>
                    </div>
                  )}
                </div>
                {wl && (
                  <div className="flex gap-5 text-center shrink-0">
                    <div>
                      <p className="text-xl font-black text-green-400">{wl.win}</p>
                      <p className="text-[10px] text-[var(--muted)]">Wins</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-red-400">{wl.lose}</p>
                      <p className="text-[10px] text-[var(--muted)]">Losses</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-[var(--accent-gold)]">
                        {wl.win + wl.lose > 0 ? `${Math.round((wl.win / (wl.win + wl.lose)) * 100)}%` : '—'}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">Win Rate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lifetime Averages */}
            {totals.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold text-[var(--foreground)] mb-4">Lifetime Averages</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: 'Kills', field: 'kills', color: 'text-green-400' },
                    { label: 'Deaths', field: 'deaths', color: 'text-red-400' },
                    { label: 'Assists', field: 'assists', color: 'text-blue-400' },
                    { label: 'GPM', field: 'gold_per_min', color: 'text-[var(--accent-gold)]' },
                    { label: 'XPM', field: 'xp_per_min', color: 'text-purple-400' },
                    { label: 'Last Hits', field: 'last_hits', color: 'text-amber-400' },
                  ].map(({ label, field, color }) => (
                    <div key={field} className="text-center bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
                      <p className={`text-lg font-black ${color}`}>{avgStat(field)}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Matches */}
            {recentMatches.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Recent Matches</h2>
                <p className="text-xs text-[var(--muted)] mb-4">Last 10 games</p>
                <div className="flex flex-col gap-2">
                  {recentMatches.map((m: any, i: number) => {
                    const hero = allHeroes.find(h => h.id === m.hero_id);
                    const won = isWin(m);
                    const mode = GAME_MODES[m.game_mode] || 'Unknown';
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${won ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                        <span className={`text-[10px] font-black w-6 text-center shrink-0 ${won ? 'text-green-400' : 'text-red-400'}`}>
                          {won ? 'W' : 'L'}
                        </span>
                        {hero && (
                          <img src={hero.img} alt={hero.localized_name}
                            className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0"
                            onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--foreground)] truncate">{hero?.localized_name ?? `Hero #${m.hero_id}`}</p>
                          <p className="text-[10px] text-[var(--muted)]">{mode} · {fmtDuration(m.duration)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[var(--foreground)]">{m.kills}/{m.deaths}/{m.assists}</p>
                          <p className="text-[10px] text-[var(--muted)]">KDA</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Peers + Role Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {peers.length > 0 && (
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Most Played With</h2>
                  <p className="text-xs text-[var(--muted)] mb-4">Top 5 teammates</p>
                  <div className="flex flex-col gap-3">
                    {peers.map((p: any) => {
                      const wr = p.with_games > 0 ? Math.round((p.with_win / p.with_games) * 100) : 0;
                      const wrColor = wr >= 55 ? 'text-green-400' : wr >= 50 ? 'text-blue-400' : 'text-red-400';
                      return (
                        <div key={p.account_id} className="flex items-center gap-3">
                          <img src={proxyImg(p.avatarfull)} alt={p.personaname}
                            className="w-8 h-8 rounded-lg object-cover border border-[var(--border)] shrink-0"
                            onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--foreground)] truncate">{p.personaname}</p>
                            <p className="text-[10px] text-[var(--muted)]">{p.with_games} games together</p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${wrColor}`}>{wr}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {laneRoleData.length > 0 && (
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Role Breakdown</h2>
                  <p className="text-xs text-[var(--muted)] mb-4">Games played by position</p>
                  <div className="flex flex-col gap-3">
                    {laneRoleData.map(({ role, games, win }) => {
                      const wr = games > 0 ? Math.round((win / games) * 100) : 0;
                      const pct = Math.round((games / maxRoleGames) * 100);
                      return (
                        <div key={role}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[var(--foreground)]">{role}</span>
                            <span className="text-[10px] text-[var(--muted)]">{games} games · {wr}% WR</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--accent-gold)]/70 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Most Played Heroes */}
            {heroStats.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Most Played Heroes</h2>
                <p className="text-xs text-[var(--muted)] mb-5">Top 20 by games played</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {heroStats.map(stat => {
                    const hero = allHeroes.find(h => h.id === stat.hero_id);
                    if (!hero) return null;
                    const wr = Math.round((stat.win / stat.games) * 100);
                    const wrColor = wr >= 55 ? 'text-green-400 border-green-500/20 bg-green-500/10'
                      : wr >= 50 ? 'text-blue-400 border-blue-500/20 bg-blue-500/10'
                      : 'text-red-400 border-red-500/20 bg-red-500/10';
                    return (
                      <div key={stat.hero_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/30 transition-colors">
                        <img src={hero.img} alt={hero.localized_name}
                          className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] shrink-0"
                          onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--foreground)] truncate">{hero.localized_name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{stat.games} games</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${wrColor}`}>{wr}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!profile && !loading && (
          <div className="glass-panel rounded-2xl p-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-[var(--muted)] text-sm">Enter your Steam ID above to load your profile and hero stats.</p>
            <p className="text-[var(--muted)] text-xs mt-2 opacity-60">Your Dota 2 match data must be set to public in OpenDota.</p>
            <Link href="/draft" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/40 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Go to Draft Assistant
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
