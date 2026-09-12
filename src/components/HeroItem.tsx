import React from 'react';
import { Hero } from '@/types';

interface HeroItemProps {
  hero: Hero;
  isSelected: boolean;
  isRecommended?: boolean;
  onSelect: (hero: Hero) => void;
}

const ATTR_STYLES = {
  str: {
    ring: 'ring-red-500/60 hover:ring-red-400',
    glow: 'shadow-red-500/20',
    dot: 'bg-red-500',
  },
  agi: {
    ring: 'ring-green-500/60 hover:ring-green-400',
    glow: 'shadow-green-500/20',
    dot: 'bg-green-500',
  },
  int: {
    ring: 'ring-blue-400/60 hover:ring-blue-300',
    glow: 'shadow-blue-400/20',
    dot: 'bg-blue-400',
  },
  all: {
    ring: 'ring-amber-400/60 hover:ring-amber-300',
    glow: 'shadow-amber-400/20',
    dot: 'bg-amber-400',
  },
};

export const HeroItem: React.FC<HeroItemProps> = ({ hero, isSelected, isRecommended, onSelect }) => {
  const attr = ATTR_STYLES[hero.primary_attr as keyof typeof ATTR_STYLES] ?? ATTR_STYLES.str;

  const ringClass = isSelected
    ? 'ring-2 ring-white/80 shadow-lg shadow-white/10 scale-105 z-10'
    : isRecommended
    ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/40 scale-105 z-10'
    : `ring-1 ${attr.ring} shadow-sm ${attr.glow}`;

  return (
    <div
      onClick={() => onSelect(hero)}
      title={hero.localized_name}
      className={`relative cursor-pointer group flex flex-col rounded-lg overflow-hidden transition-all duration-200 bg-[var(--surface)] ${ringClass}`}
    >
      {/* Hero image */}
      <div className="relative overflow-hidden">
        <img
          src={hero.img}
          alt={hero.localized_name}
          className={`w-full aspect-[3/2] object-cover transition-all duration-300 ${
            isSelected || isRecommended
              ? 'brightness-110 saturate-110'
              : 'opacity-75 group-hover:opacity-100 group-hover:brightness-105'
          }`}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.2';
          }}
        />
        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="w-3 h-3 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        {/* Recommended badge */}
        {isRecommended && !isSelected && (
          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 shadow-sm shadow-green-400/60 animate-pulse" />
        )}
      </div>

      {/* Hero name */}
      <div className="px-1 py-1 text-center">
        <span className={`text-[9px] font-medium leading-tight block truncate transition-colors ${
          isSelected ? 'text-white' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'
        }`}>
          {hero.localized_name}
        </span>
      </div>

      {/* Attr dot */}
      <div className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full ${attr.dot} opacity-80`} />
    </div>
  );
};
