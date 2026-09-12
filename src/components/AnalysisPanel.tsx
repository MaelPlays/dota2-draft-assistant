import React from 'react';
import { Recommendation, ItemRecommendation, Hero } from '../types';

interface AnalysisPanelProps {
  counterPicks: Recommendation[];
  itemRecommendations: Record<string, ItemRecommendation[]>;
  alliedHeroes: Hero[];
}

const PRIORITY_STYLES = {
  High: { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  Medium: { dot: 'bg-amber-400', badge: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  Low: { dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  counterPicks,
  itemRecommendations,
  alliedHeroes,
}) => {
  if (counterPicks.length === 0 && alliedHeroes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4">
          <svg className="w-5 h-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-[var(--muted)] text-sm">Select heroes to see analysis and recommendations.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Counter Picks */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Counter-Picks</h3>
            <p className="text-[10px] text-[var(--muted)]">Win rate vs enemy lineup — real OpenDota data</p>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {counterPicks.length > 0 ? (
            counterPicks.map((rec, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-blue-500/30 transition-colors">
                <span className="text-[var(--muted)] text-xs font-mono w-4 shrink-0">{idx + 1}</span>
                <img
                  src={rec.hero.img}
                  alt={rec.hero.localized_name}
                  className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">{rec.hero.localized_name}</span>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      rec.score >= 55 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      rec.score >= 50 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>{rec.score}%</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)] truncate">{rec.reason}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[var(--muted)] text-sm italic text-center py-4">Add enemy heroes to see counter-picks.</p>
          )}
        </div>
      </div>

      {/* Item Recommendations */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Item Builds</h3>
            <p className="text-[10px] text-[var(--muted)]">Situational items based on enemy lineup</p>
          </div>
        </div>

        <div className="space-y-5 flex-1 overflow-y-auto">
          {alliedHeroes.length > 0 ? (
            alliedHeroes.map(hero => (
              <div key={hero.id}>
                <div className="flex items-center gap-2 mb-2.5">
                  <img
                    src={hero.img}
                    alt={hero.localized_name}
                    className="w-7 h-7 rounded-md object-cover border border-[var(--border)]"
                    onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                  />
                  <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">{hero.localized_name}</h4>
                </div>
                <div className="space-y-1.5">
                  {itemRecommendations[hero.name]?.map((item, idx) => {
                    const p = PRIORITY_STYLES[item.priority];
                    return (
                      <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                        {/* Item icon */}
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.itemName}
                            className="w-8 h-6 rounded object-cover shrink-0 border border-[var(--border)]"
                            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                          />
                        ) : (
                          <div className="w-8 h-6 rounded bg-[var(--border)] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--foreground)] leading-tight">{item.itemName}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded border ${p.badge} shrink-0`}>{item.priority}</span>
                            {item.cost && (
                              <span className="text-[9px] text-[var(--accent-gold)] font-medium shrink-0">{item.cost}g</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">{item.reason}</p>
                        </div>
                      </div>
                    );
                  }) ?? <p className="text-xs text-[var(--muted)] italic">No items yet.</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[var(--muted)] text-sm italic text-center py-4">Add allied heroes to see item builds.</p>
          )}
        </div>
      </div>
    </div>
  );
};
