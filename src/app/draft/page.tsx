"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HeroList } from "@/components/HeroList";
import { DraftBoard } from "@/components/DraftBoard";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Hero, Recommendation, ItemRecommendation } from "@/types";
import { getCounterPicks, getItemRecommendations } from "@/lib/analysis";
import { fetchCurrentPatch } from "@/lib/api";

type SelectionMode = "allied" | "enemy" | "ban-ally" | "ban-enemy";

export default function DraftPage() {
  const [alliedHeroes, setAlliedHeroes] = useState<Hero[]>([]);
  const [enemyHeroes, setEnemyHeroes] = useState<Hero[]>([]);
  const [alliedBans, setAlliedBans] = useState<Hero[]>([]);
  const [enemyBans, setEnemyBans] = useState<Hero[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("allied");
  const [counterPicks, setCounterPicks] = useState<Recommendation[]>([]);
  const [itemRecommendations, setItemRecommendations] = useState<Record<string, ItemRecommendation[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPatch, setCurrentPatch] = useState<string>('');
  const [banMode, setBanMode] = useState<'ally' | 'enemy'>('enemy');

  useEffect(() => {
    fetchCurrentPatch().then(setCurrentPatch).catch(() => {});
  }, []);

  const allBanned = [...alliedBans, ...enemyBans];

  const handleHeroSelect = (hero: Hero) => {
    const inAllied = alliedHeroes.some(h => h.id === hero.id);
    const inEnemy = enemyHeroes.some(h => h.id === hero.id);
    const inBans = allBanned.some(h => h.id === hero.id);
    if (inAllied || inEnemy || inBans) return;

    let updatedAllies = alliedHeroes;
    let updatedEnemies = enemyHeroes;
    let updatedAllyBans = alliedBans;
    let updatedEnemyBans = enemyBans;

    if (selectionMode === "allied" && alliedHeroes.length < 5) {
      updatedAllies = [...alliedHeroes, hero];
      setAlliedHeroes(updatedAllies);
    } else if (selectionMode === "enemy" && enemyHeroes.length < 5) {
      updatedEnemies = [...enemyHeroes, hero];
      setEnemyHeroes(updatedEnemies);
    } else if (selectionMode === "ban-ally" && alliedBans.length < 7) {
      updatedAllyBans = [...alliedBans, hero];
      setAlliedBans(updatedAllyBans);
    } else if (selectionMode === "ban-enemy" && enemyBans.length < 7) {
      updatedEnemyBans = [...enemyBans, hero];
      setEnemyBans(updatedEnemyBans);
    }

    runAnalysis(updatedAllies, updatedEnemies);
  };

  const removeHero = (hero: Hero, team: "allied" | "enemy") => {
    let updatedAllies = alliedHeroes;
    let updatedEnemies = enemyHeroes;
    if (team === "allied") {
      updatedAllies = alliedHeroes.filter(h => h.id !== hero.id);
      setAlliedHeroes(updatedAllies);
    } else {
      updatedEnemies = enemyHeroes.filter(h => h.id !== hero.id);
      setEnemyHeroes(updatedEnemies);
    }
    runAnalysis(updatedAllies, updatedEnemies);
  };

  const removeBan = (hero: Hero, side: "allied" | "enemy") => {
    if (side === "allied") setAlliedBans(b => b.filter(h => h.id !== hero.id));
    else setEnemyBans(b => b.filter(h => h.id !== hero.id));
  };

  const runAnalysis = async (allies: Hero[], enemies: Hero[]) => {
    if (allies.length === 0 && enemies.length === 0) return;
    setIsAnalyzing(true);
    try {
      const [counters, items] = await Promise.all([
        getCounterPicks(enemies),
        getItemRecommendations(allies, enemies),
      ]);
      setCounterPicks(counters);
      setItemRecommendations(items);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allSelected = [...alliedHeroes, ...enemyHeroes, ...allBanned];

  return (
    <div className="min-h-screen text-[var(--foreground)] relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-900/8 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Header */}
        <header className="text-center mb-8 md:mb-12 relative">
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-gold)]/40 transition-all">
              <svg className="w-3 h-3 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-[10px] text-[var(--muted)] font-medium hidden sm:inline">My Profile</span>
            </Link>
            {currentPatch && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <svg className="w-3 h-3 text-[var(--accent-gold)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] text-[var(--accent-gold)] font-bold">{currentPatch}</span>
              </div>
            )}
          </div>
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="h-px w-10 md:w-16 bg-gradient-to-r from-transparent to-[var(--accent-gold)] opacity-60" />
            <span className="text-[var(--accent-gold)] text-[10px] font-semibold tracking-[0.3em] uppercase opacity-80">Strategy Tool</span>
            <div className="h-px w-10 md:w-16 bg-gradient-to-l from-transparent to-[var(--accent-gold)] opacity-60" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black gold-text mb-3 leading-tight">
            Dota 2 Draft Assistant
          </h1>
          <p className="text-[var(--muted)] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Counter-picks and item builds, informed by real match data.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Left: hero picker */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {/* Mode toggle */}
            <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setSelectionMode("allied")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 md:px-4 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 ${
                  selectionMode === "allied"
                    ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/25"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1z" />
                </svg>
                <span className="hidden sm:inline">Add </span>Ally
              </button>
              <button
                onClick={() => setSelectionMode("enemy")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 md:px-4 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 ${
                  selectionMode === "enemy"
                    ? "bg-red-700/90 text-white shadow-lg shadow-red-700/25"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Add </span>Enemy
              </button>
              {/* Ban toggle with sub-switcher */}
              <div className={`flex-1 flex items-center rounded-xl transition-all duration-300 overflow-hidden ${
                selectionMode.startsWith('ban')
                  ? 'bg-orange-700/80 shadow-lg shadow-orange-700/20'
                  : 'hover:bg-white/5'
              }`}>
                <button
                  onClick={() => setSelectionMode(banMode === 'ally' ? 'ban-ally' : 'ban-enemy')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 font-semibold text-xs md:text-sm ${
                    selectionMode.startsWith('ban') ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Ban
                </button>
                {/* Side switcher within ban */}
                <div className="flex flex-col gap-0.5 pr-1 shrink-0">
                  <button
                    onClick={() => { setBanMode('ally'); setSelectionMode('ban-ally'); }}
                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${
                      selectionMode === 'ban-ally' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >Us</button>
                  <button
                    onClick={() => { setBanMode('enemy'); setSelectionMode('ban-enemy'); }}
                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${
                      selectionMode === 'ban-enemy' ? 'bg-red-500/30 text-red-300' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >Them</button>
                </div>
              </div>
            </div>

            {/* Hero list */}
            <div className="glass-panel rounded-2xl p-3 md:p-4">
              <HeroList
                selectedHeroes={allSelected}
                recommendedHeroIds={counterPicks.map(cp => cp.hero.id)}
                onHeroSelect={handleHeroSelect}
              />
            </div>
          </div>

          {/* Right: draft board + results */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <DraftBoard
              alliedHeroes={alliedHeroes}
              enemyHeroes={enemyHeroes}
              alliedBans={alliedBans}
              enemyBans={enemyBans}
              onRemoveHero={removeHero}
              onRemoveBan={removeBan}
            />
            <ResultsDashboard
              alliedHeroes={alliedHeroes}
              enemyHeroes={enemyHeroes}
              counterPicks={counterPicks}
              itemRecommendations={itemRecommendations}
            />
          </div>
        </main>

        {/* Analysis panel */}
        <div className="mt-6 pb-10 relative">
          {isAnalyzing && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-sm rounded-2xl">
              <div className="flex items-center gap-3 text-[var(--accent-gold)] font-medium text-sm">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing Draft...
              </div>
            </div>
          )}
          <AnalysisPanel
            counterPicks={counterPicks}
            itemRecommendations={itemRecommendations}
            alliedHeroes={alliedHeroes}
          />
        </div>

      </div>
    </div>
  );
}
