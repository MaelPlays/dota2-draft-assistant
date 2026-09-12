"use client";

import React from "react";
import { Hero, Recommendation, ItemRecommendation } from "@/types";

interface ResultsDashboardProps {
  alliedHeroes: Hero[];
  enemyHeroes: Hero[];
  counterPicks: Recommendation[];
  itemRecommendations: Record<string, ItemRecommendation[]>;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  alliedHeroes,
  enemyHeroes,
  counterPicks,
  itemRecommendations,
}) => {
  const calculateDraftScore = () => {
    if (alliedHeroes.length === 0) return 0;
    let score = 50;
    const alliedIds = alliedHeroes.map(h => h.id);
    counterPicks.forEach(rec => {
      if (alliedIds.includes(rec.hero.id)) score += 10;
    });
    return Math.min(Math.max(Math.round(score), 0), 100);
  };

  const draftScore = calculateDraftScore();

  if (alliedHeroes.length === 0 && enemyHeroes.length === 0) return null;

  const scoreColor =
    draftScore >= 70 ? 'text-green-400' :
    draftScore >= 40 ? 'text-amber-400' :
    'text-red-400';

  const barColor =
    draftScore >= 70 ? 'bg-gradient-to-r from-green-600 to-green-400' :
    draftScore >= 40 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
    'bg-gradient-to-r from-red-600 to-red-400';

  const advice =
    draftScore > 70
      ? "Strong counter-potential. Push for early aggression and snowball advantages."
      : draftScore > 40
      ? "Balanced draft. Prioritize key item timings and objective control."
      : "Difficult matchup. Play defensively and scale into late game.";

  return (
    <div className="glass-panel rounded-2xl p-5">

      {/* Header + Score */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">Draft Strength</h2>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">Based on counter-pick alignment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-3xl font-black tabular-nums ${scoreColor}`}>{draftScore}</span>
            <span className="text-[var(--muted)] text-sm">%</span>
          </div>
          <div className="w-24 h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${draftScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 cards */}
      <div className="grid grid-cols-1 gap-3">

        {/* Strengths */}
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-green-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Key Strengths</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alliedHeroes.length > 0 ? alliedHeroes.slice(0, 3).map(hero => (
              <div key={hero.id} className="flex items-center gap-1.5">
                <img
                  src={hero.img}
                  alt={hero.localized_name}
                  className="w-5 h-5 rounded object-cover border border-[var(--border)]"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                <span className="text-xs text-[var(--foreground)]">{hero.localized_name}</span>
              </div>
            )) : (
              <span className="text-xs text-[var(--muted)] italic">Add allied heroes</span>
            )}
          </div>
        </div>

        {/* Threats */}
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-red-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Critical Threats</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {enemyHeroes.length > 0 ? enemyHeroes.slice(0, 3).map(hero => (
              <div key={hero.id} className="flex items-center gap-1.5">
                <img
                  src={hero.img}
                  alt={hero.localized_name}
                  className="w-5 h-5 rounded object-cover border border-[var(--border)]"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                <span className="text-xs text-[var(--foreground)]">{hero.localized_name}</span>
              </div>
            )) : (
              <span className="text-xs text-[var(--muted)] italic">Add enemy heroes</span>
            )}
          </div>
        </div>

        {/* Advice */}
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] shadow-sm shadow-amber-500/50" />
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Strategy</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{advice}</p>
        </div>
      </div>

    </div>
  );
};
