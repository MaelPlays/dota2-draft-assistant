import React from 'react';
import { Hero } from '@/types';

interface DraftBoardProps {
  enemyHeroes: Hero[];
  alliedHeroes: Hero[];
  enemyBans: Hero[];
  alliedBans: Hero[];
  onRemoveHero: (hero: Hero, side: 'enemy' | 'allied') => void;
  onRemoveBan: (hero: Hero, side: 'enemy' | 'allied') => void;
}

const MAX_HEROES = 5;
const MAX_BANS = 7;

const HeroSlot: React.FC<{
  hero?: Hero;
  index: number;
  side: 'enemy' | 'allied';
  onRemove: (hero: Hero, side: 'enemy' | 'allied') => void;
  size?: 'normal' | 'small';
}> = ({ hero, index, side, onRemove, size = 'normal' }) => {
  const isEnemy = side === 'enemy';
  const dim = size === 'small' ? 'w-8 h-8' : 'w-12 h-12 md:w-14 md:h-14';

  if (!hero) {
    return (
      <div className={`${dim} rounded-lg border border-dashed flex items-center justify-center transition-colors ${
        isEnemy ? 'border-red-900/30 bg-red-950/10' : 'border-blue-900/30 bg-blue-950/10'
      }`}>
        {size !== 'small' && <span className="text-xs opacity-20 text-[var(--muted)]">{index + 1}</span>}
      </div>
    );
  }

  return (
    <div className="relative group shrink-0">
      <div className={`${dim} rounded-lg overflow-hidden border-2 transition-all ${
        isEnemy ? 'border-red-500/50 shadow-sm shadow-red-500/15' : 'border-blue-500/50 shadow-sm shadow-blue-500/15'
      }`}>
        <img src={hero.img} alt={hero.localized_name} className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
        <button
          onClick={() => onRemove(hero, side)}
          className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-bold ${
            isEnemy ? 'bg-red-900/75' : 'bg-blue-900/75'
          }`}
        >×</button>
      </div>
      {size === 'normal' && (
        <p className="text-[9px] text-[var(--muted)] text-center mt-1 truncate w-full max-w-[56px] mx-auto">{hero.localized_name}</p>
      )}
    </div>
  );
};

const BanSlot: React.FC<{
  hero?: Hero;
  index: number;
  side: 'enemy' | 'allied';
  onRemove: (hero: Hero, side: 'enemy' | 'allied') => void;
}> = ({ hero, index, side, onRemove }) => {
  const isEnemy = side === 'enemy';

  if (!hero) {
    return (
      <div className="w-8 h-8 rounded-md border border-dashed border-gray-700/40 bg-gray-900/20 flex items-center justify-center shrink-0">
        <span className="text-[9px] text-gray-700">{index + 1}</span>
      </div>
    );
  }

  return (
    <div className="relative group shrink-0">
      <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-500/40 grayscale opacity-60">
        <img src={hero.img} alt={hero.localized_name} className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
        <button
          onClick={() => onRemove(hero, side)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs"
        >×</button>
      </div>
      {/* X overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-px bg-red-500/60 rotate-45 absolute" />
        <div className="w-full h-px bg-red-500/60 -rotate-45 absolute" />
      </div>
    </div>
  );
};

export const DraftBoard: React.FC<DraftBoardProps> = ({
  enemyHeroes, alliedHeroes, enemyBans, alliedBans, onRemoveHero, onRemoveBan,
}) => {
  const enemySlots = Array.from({ length: MAX_HEROES }, (_, i) => enemyHeroes[i]);
  const allySlots = Array.from({ length: MAX_HEROES }, (_, i) => alliedHeroes[i]);
  const enemyBanSlots = Array.from({ length: MAX_BANS }, (_, i) => enemyBans[i]);
  const allyBanSlots = Array.from({ length: MAX_BANS }, (_, i) => alliedBans[i]);

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-5">

      {/* Enemy section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">Enemy Draft</h3>
          <span className="ml-auto text-[10px] text-[var(--muted)]">{enemyHeroes.length}/{MAX_HEROES}</span>
        </div>
        {/* Enemy picks */}
        <div className="flex gap-2 justify-between mb-3">
          {enemySlots.map((hero, i) => (
            <HeroSlot key={i} hero={hero} index={i} side="enemy" onRemove={onRemoveHero} />
          ))}
        </div>
        {/* Enemy bans */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 uppercase tracking-wider shrink-0">Bans</span>
          <div className="flex gap-1 flex-wrap">
            {enemyBanSlots.map((hero, i) => (
              <BanSlot key={i} hero={hero} index={i} side="enemy" onRemove={onRemoveBan} />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">vs</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[var(--border)] to-transparent" />
      </div>

      {/* Allied section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Your Draft</h3>
          <span className="ml-auto text-[10px] text-[var(--muted)]">{alliedHeroes.length}/{MAX_HEROES}</span>
        </div>
        {/* Allied picks */}
        <div className="flex gap-2 justify-between mb-3">
          {allySlots.map((hero, i) => (
            <HeroSlot key={i} hero={hero} index={i} side="allied" onRemove={onRemoveHero} />
          ))}
        </div>
        {/* Allied bans */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 uppercase tracking-wider shrink-0">Bans</span>
          <div className="flex gap-1 flex-wrap">
            {allyBanSlots.map((hero, i) => (
              <BanSlot key={i} hero={hero} index={i} side="allied" onRemove={onRemoveBan} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
