'use client';

import React, { useState, useEffect } from 'react';
import { Hero } from '@/types';
import { fetchHeroes } from '@/lib/api';
import { HeroItem } from './HeroItem';
import { getHeroPosition } from '@/lib/heroPositions';

interface HeroListProps {
  selectedHeroes: Hero[];
  recommendedHeroIds?: number[];
  onHeroSelect: (hero: Hero) => void;
}

type Position = 'All' | 'Safelane' | 'Mid' | 'Offlane' | 'Soft Support' | 'Hard Support';

const POSITIONS: { key: Position; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Safelane', label: 'Carry' },
  { key: 'Mid', label: 'Mid' },
  { key: 'Offlane', label: 'Offlane' },
  { key: 'Soft Support', label: 'Sup 4' },
  { key: 'Hard Support', label: 'Sup 5' },
];

const POS_COLORS: Record<Position, string> = {
  All:            'text-[var(--foreground)] border-[var(--border)] bg-white/5',
  Safelane:       'text-blue-400 border-blue-500/40 bg-blue-500/10',
  Mid:            'text-purple-400 border-purple-500/40 bg-purple-500/10',
  Offlane:        'text-red-400 border-red-500/40 bg-red-500/10',
  'Soft Support': 'text-green-400 border-green-500/40 bg-green-500/10',
  'Hard Support': 'text-amber-400 border-amber-500/40 bg-amber-500/10',
};

const POS_ACTIVE: Record<Position, string> = {
  All:            'text-white border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 shadow-sm shadow-amber-500/10',
  Safelane:       'text-white border-blue-500 bg-blue-600/30 shadow-sm shadow-blue-500/20',
  Mid:            'text-white border-purple-500 bg-purple-600/30 shadow-sm shadow-purple-500/20',
  Offlane:        'text-white border-red-500 bg-red-600/30 shadow-sm shadow-red-500/20',
  'Soft Support': 'text-white border-green-500 bg-green-600/30 shadow-sm shadow-green-500/20',
  'Hard Support': 'text-white border-amber-400 bg-amber-500/30 shadow-sm shadow-amber-400/20',
};

export const HeroList: React.FC<HeroListProps> = ({ selectedHeroes, recommendedHeroIds = [], onHeroSelect }) => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Position>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroes().then(data => {
      setHeroes(data);
      setLoading(false);
    });
  }, []);

  const filteredHeroes = heroes.filter(h => {
    const matchesSearch = h.localized_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || getHeroPosition(h.localized_name, h.roles ?? [], h.primary_attr) === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search heroes..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:border-[var(--accent-gold)]/50 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Position Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {POSITIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              filter === key ? POS_ACTIVE[key] : POS_COLORS[key]
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{loading ? 'Loading...' : `${filteredHeroes.length} heroes`}</span>
        {selectedHeroes.length > 0 && (
          <span className="text-[var(--accent-gold)]">{selectedHeroes.length} selected</span>
        )}
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 gap-1.5 overflow-y-auto max-h-[45vh] md:max-h-[55vh] pr-1">
        {loading ? (
          Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="aspect-[3/2] rounded-lg bg-[var(--surface)] animate-pulse" />
          ))
        ) : (
          filteredHeroes.map(hero => (
            <HeroItem
              key={hero.id}
              hero={hero}
              isSelected={selectedHeroes.some(h => h.id === hero.id)}
              isRecommended={recommendedHeroIds.includes(hero.id)}
              onSelect={onHeroSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};
