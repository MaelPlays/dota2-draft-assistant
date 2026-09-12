import { Hero, Recommendation, ItemRecommendation } from '../types';
import { fetchHeroes, fetchHeroMatchups, fetchItems } from './api';

// ─── Counter-pick item keys per matchup situation ─────────────────────────
const ENEMY_ROLE_ITEMS: Record<string, { key: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[]> = {
  Burst: [
    { key: 'black_king_bar', reason: 'Blocks magic burst damage.', priority: 'High' },
    { key: 'linken', reason: 'Blocks single-target spells.', priority: 'Medium' },
  ],
  Support: [
    { key: 'spirit_vessel', reason: 'Reduces enemy healing/regen.', priority: 'Medium' },
  ],
  Disabler: [
    { key: 'black_king_bar', reason: 'Spell immunity vs disables.', priority: 'High' },
    { key: 'aeon_disk', reason: 'Survives burst + disable combos.', priority: 'Medium' },
  ],
  Nuker: [
    { key: 'pipe', reason: 'Reduces incoming magic damage.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Magic immunity vs nukers.', priority: 'High' },
  ],
  Pusher: [
    { key: 'radiance', reason: 'Burn damage for wave clear.', priority: 'Medium' },
  ],
  Carry: [
    { key: 'crimson_guard', reason: 'Reduces physical attack damage.', priority: 'Medium' },
    { key: 'blade_mail', reason: 'Reflects damage back to attackers.', priority: 'Medium' },
  ],
  Initiator: [
    { key: 'blink', reason: 'Disengage or counter-initiate.', priority: 'Medium' },
    { key: 'force_staff', reason: 'Escape from initiation.', priority: 'Medium' },
  ],
  Jungler: [
    { key: 'desolator', reason: 'Armor reduction for objective focus.', priority: 'Low' },
  ],
};

type ItemEntry = { key: string; reason: string; priority: 'High' | 'Medium' | 'Low' };

// ─── Hero-specific item builds (patch 7.41 meta) ──────────────────────────
const HERO_ITEM_BUILDS: Record<string, ItemEntry[]> = {
  // ── Carries ──────────────────────────────────────────────────────────────
  'Anti-Mage': [
    { key: 'power_treads', reason: 'Attack speed and attribute switching.', priority: 'High' },
    { key: 'bfury', reason: 'Farm accelerator and mana burn synergy.', priority: 'High' },
    { key: 'manta', reason: 'Purges debuffs and splits for mana burn.', priority: 'High' },
    { key: 'abyssal_blade', reason: 'Lock down single targets for kills.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slows enemies and huge stat gain.', priority: 'Medium' },
    { key: 'butterfly', reason: 'Evasion and DPS for late game.', priority: 'Medium' },
  ],
  'Juggernaut': [
    { key: 'phase_boots', reason: 'Phase for chasing and armor.', priority: 'High' },
    { key: 'bfury', reason: 'Wave clear and sustained DPS.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity for safe Omnislash.', priority: 'High' },
    { key: 'manta', reason: 'Purges silences during Blade Fury.', priority: 'Medium' },
    { key: 'abyssal_blade', reason: 'Locks down targets for Omnislash.', priority: 'Medium' },
    { key: 'satanic', reason: 'Lifesteal during Omnislash for survivability.', priority: 'Medium' },
  ],
  'Phantom Assassin': [
    { key: 'bfury', reason: 'Farm speed and cleave for waves.', priority: 'High' },
    { key: 'desolator', reason: 'Armor reduction amplifies crits massively.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity for safe kill windows.', priority: 'High' },
    { key: 'abyssal_blade', reason: 'Stun target for guaranteed crit kills.', priority: 'Medium' },
    { key: 'satanic', reason: 'Lifesteal to survive after the kill.', priority: 'Medium' },
    { key: 'monkey_king_bar', reason: 'Counters evasion from Butterfly/Windrun.', priority: 'Medium' },
  ],
  'Terrorblade': [
    { key: 'dragon_lance', reason: 'Stats and range for illusion control.', priority: 'High' },
    { key: 'manta', reason: 'More illusions and purge.', priority: 'High' },
    { key: 'skadi', reason: 'Slow and stats applied to illusions.', priority: 'High' },
    { key: 'butterfly', reason: 'Evasion and highest DPS item.', priority: 'Medium' },
    { key: 'satanic', reason: 'Survivability when Reflection is on cooldown.', priority: 'Medium' },
    { key: 'sange_and_yasha', reason: 'Status resist and movement speed.', priority: 'Medium' },
  ],
  'Faceless Void': [
    { key: 'power_treads', reason: 'Attack speed amplifies Time Walk procs.', priority: 'High' },
    { key: 'mjollnir', reason: 'Chain lightning for AoE inside Chronosphere.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Ensures Chrono lands without interruption.', priority: 'High' },
    { key: 'abyssal_blade', reason: 'Single-target lock to isolate carries.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slows enemies fleeing after Chrono ends.', priority: 'Medium' },
    { key: 'satanic', reason: 'Max lifesteal inside Chronosphere.', priority: 'Medium' },
  ],
  'Slark': [
    { key: 'power_treads', reason: 'Attack speed synergizes with Essence Shift.', priority: 'High' },
    { key: 'echo_sabre', reason: 'Double hit procs for Essence Shift stacks.', priority: 'High' },
    { key: 'shadow_blade', reason: 'Initiation tool and break from detection.', priority: 'High' },
    { key: 'skadi', reason: 'Slow and stats for unkillable late game.', priority: 'Medium' },
    { key: 'manta', reason: 'Purges debuffs and adds illusion pressure.', priority: 'Medium' },
    { key: 'abyssal_blade', reason: 'Lockdown on fleeing targets.', priority: 'Medium' },
  ],
  'Spectre': [
    { key: 'radiance', reason: 'Burn damage applies through Haunt illusions.', priority: 'High' },
    { key: 'diffusal_blade', reason: 'Mana burn on Haunt illusions globally.', priority: 'High' },
    { key: 'manta', reason: 'More illusions for global pressure.', priority: 'High' },
    { key: 'heart', reason: 'HP regen between Haunts.', priority: 'Medium' },
    { key: 'skadi', reason: 'Stats and slow for late game.', priority: 'Medium' },
    { key: 'butterfly', reason: 'Evasion and DPS.', priority: 'Medium' },
  ],
  'Phantom Lancer': [
    { key: 'power_treads', reason: 'Attack speed multiplied across illusions.', priority: 'High' },
    { key: 'diffusal_blade', reason: 'Mana burn applied by all illusions.', priority: 'High' },
    { key: 'manta', reason: 'Creates more illusions for overwhelming pressure.', priority: 'High' },
    { key: 'skadi', reason: 'Slow applied by all illusions.', priority: 'High' },
    { key: 'heart', reason: 'Huge HP for the main hero.', priority: 'Medium' },
    { key: 'butterfly', reason: 'Evasion and DPS for the real PL.', priority: 'Medium' },
  ],
  'Naga Siren': [
    { key: 'radiance', reason: 'Burn damages all units in Song during Riptide.', priority: 'High' },
    { key: 'manta', reason: 'Creates illusions that benefit from Riptide.', priority: 'High' },
    { key: 'diffusal_blade', reason: 'Mana burn applied across all illusions.', priority: 'High' },
    { key: 'skadi', reason: 'Stat aura and slow for illusion army.', priority: 'Medium' },
    { key: 'heart', reason: 'Sustain for long teamfights.', priority: 'Medium' },
    { key: 'aghanims_shard', reason: 'Upgrades Song of the Siren for full reset.', priority: 'Medium' },
  ],
  'Wraith King': [
    { key: 'armlet', reason: 'HP toggle synergizes with Reincarnation.', priority: 'High' },
    { key: 'desolator', reason: 'Armor reduction on skeletons and attacks.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity while farming or fighting.', priority: 'High' },
    { key: 'abyssal_blade', reason: 'Locks down targets during Skeletons.', priority: 'Medium' },
    { key: 'assault', reason: 'Armor and attack speed for late game push.', priority: 'Medium' },
    { key: 'aghanims_scepter', reason: 'Reincarnation creates even more skeletons.', priority: 'Medium' },
  ],
  'Ursa': [
    { key: 'phase_boots', reason: 'Chase speed and armor.', priority: 'High' },
    { key: 'blink', reason: 'Gap close for Fury Swipes stacking.', priority: 'High' },
    { key: 'skull_basher', reason: 'Bash stops targets from escaping Fury Swipes.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity during Earthshock combo.', priority: 'High' },
    { key: 'satanic', reason: 'Survive after Enrage wears off.', priority: 'Medium' },
    { key: 'abyssal_blade', reason: 'Guaranteed stun for full Fury Swipes combo.', priority: 'Medium' },
  ],
  'Luna': [
    { key: 'power_treads', reason: 'Attack speed for Lucent Beam procs.', priority: 'High' },
    { key: 'mask_of_madness', reason: 'Attack speed and silence aura.', priority: 'High' },
    { key: 'dragon_lance', reason: 'Attack range and stats.', priority: 'High' },
    { key: 'hurricane_pike', reason: 'Escape and range for kiting.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slow and stats for late game.', priority: 'Medium' },
    { key: 'butterfly', reason: 'Top DPS and evasion.', priority: 'Medium' },
  ],
  'Drow Ranger': [
    { key: 'power_treads', reason: 'Attack speed for Frost Arrows and Precision Aura.', priority: 'High' },
    { key: 'dragon_lance', reason: 'Range boost and strong stats.', priority: 'High' },
    { key: 'hurricane_pike', reason: 'Escape tool and further range.', priority: 'High' },
    { key: 'shadow_blade', reason: 'Initiation and escape option.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slows fleeing targets and huge stat gain.', priority: 'Medium' },
    { key: 'butterfly', reason: 'Evasion and maximum DPS.', priority: 'Medium' },
  ],
  'Sniper': [
    { key: 'power_treads', reason: 'Attack speed for Headshot procs.', priority: 'High' },
    { key: 'dragon_lance', reason: 'Range extension and stats.', priority: 'High' },
    { key: 'hurricane_pike', reason: 'Push away melee threats.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity vs targeted disables.', priority: 'High' },
    { key: 'mjollnir', reason: 'Chain lightning and attack speed.', priority: 'Medium' },
    { key: 'monkey_king_bar', reason: 'Counters evasion heroes.', priority: 'Medium' },
  ],
  'Clinkz': [
    { key: 'orchid', reason: 'Silence + damage amplifier for burst kills.', priority: 'High' },
    { key: 'deso_clinkz', reason: 'Armor reduction on Burning Army skeleton.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity for safe positioning.', priority: 'High' },
    { key: 'bloodthorn', reason: 'Upgrades Orchid for crit amplify.', priority: 'Medium' },
    { key: 'aghanims_scepter', reason: 'Burning Army skeletons are much stronger.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slows target during Skeleton Walk engages.', priority: 'Medium' },
  ],
  'Medusa': [
    { key: 'power_treads', reason: 'Attack speed and mana shield synergy.', priority: 'High' },
    { key: 'manta', reason: 'Split Shot illusions and purge.', priority: 'High' },
    { key: 'skadi', reason: 'Slows enemies so Split Shot hits.', priority: 'High' },
    { key: 'butterfly', reason: 'Maximum DPS with Split Shot.', priority: 'Medium' },
    { key: 'linken', reason: 'Blocks single-target disables that bypass mana shield.', priority: 'Medium' },
    { key: 'greater_crit', reason: 'Huge crits across all Split Shot targets.', priority: 'Medium' },
  ],
  'Troll Warlord': [
    { key: 'power_treads', reason: 'Max attack speed synergy with Fervor.', priority: 'High' },
    { key: 'skull_basher', reason: 'Bash stacks with Fervor attack speed.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity while ramping Fervor.', priority: 'High' },
    { key: 'abyssal_blade', reason: 'Guaranteed stun at max Fervor stacks.', priority: 'Medium' },
    { key: 'mjollnir', reason: 'Chain lightning with max attack speed.', priority: 'Medium' },
    { key: 'satanic', reason: 'Lifesteal at max attack speed.', priority: 'Medium' },
  ],

  // ── Midlaners ─────────────────────────────────────────────────────────────
  'Shadow Fiend': [
    { key: 'phase_boots', reason: 'Armor and chase speed.', priority: 'High' },
    { key: 'shadow_blade', reason: 'Positioning for Requiem of Souls.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity to land full Requiem.', priority: 'High' },
    { key: 'silver_edge', reason: 'Upgrades Shadow Blade and breaks passives.', priority: 'Medium' },
    { key: 'greater_crit', reason: 'Massive physical crit damage.', priority: 'Medium' },
    { key: 'bloodthorn', reason: 'Silence and crit amplify for burst.', priority: 'Medium' },
  ],
  'Storm Spirit': [
    { key: 'power_treads', reason: 'Attack speed and attribute flexibility.', priority: 'High' },
    { key: 'bloodstone', reason: 'Mana and spell regen for infinite mobility.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity vs chain disables.', priority: 'High' },
    { key: 'linken', reason: 'Blocks single-target disables.', priority: 'Medium' },
    { key: 'aghanims_scepter', reason: 'Overload deals more damage and slows.', priority: 'Medium' },
    { key: 'skadi', reason: 'Slow and tankiness for late game.', priority: 'Medium' },
  ],
  'Invoker': [
    { key: 'phase_boots', reason: 'Armor for laning and movement speed.', priority: 'High' },
    { key: 'cyclone', reason: "Eul's for Tornado combo setup.", priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Fourth spell slot massively increases combo options.', priority: 'High' },
    { key: 'octarine_core', reason: 'Cooldown reduction for more Sun Strike/Meteor.', priority: 'Medium' },
    { key: 'blink', reason: 'Initiation and escape positioning.', priority: 'Medium' },
    { key: 'refresher', reason: 'Double Black Hole or Sun Strike in big fights.', priority: 'Medium' },
  ],
  'Puck': [
    { key: 'blink', reason: 'Extended initiation range for Phase Shift combos.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Dream Coil no longer breaks on distance.', priority: 'High' },
    { key: 'octarine_core', reason: 'Dream Coil every fight with CDR.', priority: 'High' },
    { key: 'ethereal_blade', reason: 'Amplifies magic damage on Phase Shift exit.', priority: 'Medium' },
    { key: 'kaya', reason: 'Spell damage and mana regen.', priority: 'Medium' },
    { key: 'veil_of_discord', reason: 'Magic resist reduction on Coil targets.', priority: 'Medium' },
  ],
  'Queen of Pain': [
    { key: 'power_treads', reason: 'Attack speed and attribute cycling.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Sonic Wave.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity when ulting into their team.', priority: 'High' },
    { key: 'kaya_and_sange', reason: 'Spell amp, status resist and stats.', priority: 'Medium' },
    { key: 'orchid', reason: 'Silence target before Sonic Wave.', priority: 'Medium' },
    { key: 'bloodthorn', reason: 'Silence + crit amplify upgrade.', priority: 'Medium' },
  ],
  'Ember Spirit': [
    { key: 'phase_boots', reason: 'Armor and movement speed for SoF chases.', priority: 'High' },
    { key: 'maelstrom', reason: 'Chain lightning procs on Sleight of Fist hits.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity during Sleight.', priority: 'High' },
    { key: 'mjollnir', reason: 'Upgrades Maelstrom for massive AoE.', priority: 'Medium' },
    { key: 'desolator', reason: 'Armor reduction applied each Sleight hit.', priority: 'Medium' },
    { key: 'aghanims_scepter', reason: 'Flame Guard becomes a permanent aura.', priority: 'Medium' },
  ],
  'Lina': [
    { key: 'arcane_boots', reason: 'Mana for Dragon Slave + Light Strike Array.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Light Strike Array.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Laguna Blade goes through BKB.', priority: 'High' },
    { key: 'ethereal_blade', reason: 'Amplifies Laguna Blade damage greatly.', priority: 'Medium' },
    { key: 'bloodthorn', reason: 'Silence + crit amplify before Laguna.', priority: 'Medium' },
    { key: 'sheepstick', reason: 'Hex target for guaranteed Laguna kills.', priority: 'Medium' },
  ],
  'Templar Assassin': [
    { key: 'power_treads', reason: 'Attack speed for Psi Blades proc.', priority: 'High' },
    { key: 'blink', reason: 'Meld + Blink for instant burst kills.', priority: 'High' },
    { key: 'desolator', reason: 'Armor reduction on Psi Blade hits.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity while Meld striking.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Psionic Trap roots on trigger.', priority: 'Medium' },
    { key: 'greater_crit', reason: 'Massive crit on Meld attacks.', priority: 'Medium' },
  ],

  // ── Offlaners ─────────────────────────────────────────────────────────────
  'Axe': [
    { key: 'arcane_boots', reason: 'Mana for Berserker\'s Call spam.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Berserker\'s Call.', priority: 'High' },
    { key: 'blade_mail', reason: 'Reflects damage from forced attackers in Call.', priority: 'High' },
    { key: 'heart', reason: 'HP to survive diving into multiple enemies.', priority: 'Medium' },
    { key: 'aghanims_scepter', reason: 'Battle Hunger refreshes on Counter Helix.', priority: 'Medium' },
    { key: 'black_king_bar', reason: 'Spell immunity for diving deep.', priority: 'Medium' },
  ],
  'Doom': [
    { key: 'phase_boots', reason: 'Armor and movement to chase and doom targets.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range to reach priority targets.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity while dooming carries.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Doom now provides bonus gold and silence aura.', priority: 'Medium' },
    { key: 'refresher', reason: 'Double Doom in crucial teamfights.', priority: 'Medium' },
    { key: 'heart', reason: 'Tankiness for diving deep.', priority: 'Medium' },
  ],
  'Enigma': [
    { key: 'arcane_boots', reason: 'Mana for Midnight Pulse + Black Hole.', priority: 'High' },
    { key: 'blink', reason: 'Positioning for surprise Black Hole.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity to complete full Black Hole channel.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Eidolons multiply more and linger after Black Hole.', priority: 'Medium' },
    { key: 'refresher', reason: 'Double Black Hole wins any teamfight.', priority: 'Medium' },
    { key: 'ultimate_scepter', reason: 'Black Hole pulls from further range.', priority: 'Medium' },
  ],
  'Timbersaw': [
    { key: 'arcane_boots', reason: 'Mana sustain for constant Whirling Death spam.', priority: 'High' },
    { key: 'bloodstone', reason: 'Huge mana and regen for infinite spells.', priority: 'High' },
    { key: 'lotus_orb', reason: 'Reflects targeted spells back at casters.', priority: 'High' },
    { key: 'heart', reason: 'HP for Reactive Armor scaling.', priority: 'Medium' },
    { key: 'eternal_shroud', reason: 'Magic resistance and spell lifesteal.', priority: 'Medium' },
    { key: 'kaya', reason: 'Spell damage and mana regen.', priority: 'Medium' },
  ],
  'Tidehunter': [
    { key: 'arcane_boots', reason: 'Mana for Kraken Shell and Ravage.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for surprise Ravage.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Ravage tentacles hit larger area.', priority: 'High' },
    { key: 'refresher', reason: 'Double Ravage stuns entire game.', priority: 'Medium' },
    { key: 'heart', reason: 'Huge HP with Kraken Shell passive.', priority: 'Medium' },
    { key: 'assault', reason: 'Armor reduction and attack speed aura.', priority: 'Medium' },
  ],
  'Legion Commander': [
    { key: 'phase_boots', reason: 'Armor and movement to chase duel targets.', priority: 'High' },
    { key: 'blink', reason: 'Initiation for Duel on isolated carries.', priority: 'High' },
    { key: 'blade_mail', reason: 'Reflects damage back during Duel — very punishing.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity protects during Duel.', priority: 'High' },
    { key: 'aghanims_shard', reason: 'Press the Attack removes debuffs.', priority: 'Medium' },
    { key: 'harpoon', reason: 'Pulls target into Duel range.', priority: 'Medium' },
  ],

  // ── Supports ──────────────────────────────────────────────────────────────
  'Crystal Maiden': [
    { key: 'arcane_boots', reason: 'Mana sustain for teammates via Brilliance Aura.', priority: 'High' },
    { key: 'glimmer_cape', reason: 'Invisible channeling for Freezing Field.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Freezing Field with BKB and faster bolts.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape from heroes that interrupt Freezing Field.', priority: 'Medium' },
    { key: 'blink', reason: 'Safe initiation and escape.', priority: 'Medium' },
    { key: 'black_king_bar', reason: 'Channeling Freezing Field uninterrupted.', priority: 'Medium' },
  ],
  'Lion': [
    { key: 'arcane_boots', reason: 'Mana for two stuns + Finger of Death.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Hex + stun combo.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Finger of Death bounces to nearby enemies.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape from ganks and positioning.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Invisibility to reposition for kills.', priority: 'Medium' },
    { key: 'aeon_disk', reason: 'Survives burst when caught out of position.', priority: 'Medium' },
  ],
  'Shadow Shaman': [
    { key: 'arcane_boots', reason: 'Mana for Mass Serpent Wards.', priority: 'High' },
    { key: 'blink', reason: 'Jump in for Shackles channel range.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Wards attack faster and deal more damage.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape after Shackles channel.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Invisibility while channeling Shackles.', priority: 'Medium' },
    { key: 'black_king_bar', reason: 'Spell immunity during Shackles channel.', priority: 'Medium' },
  ],
  'Rubick': [
    { key: 'arcane_boots', reason: 'Mana to cast stolen spells repeatedly.', priority: 'High' },
    { key: 'blink', reason: 'Repositioning after stealing ultimates.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape and set up Telekinesis.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Spell Steal copies entire spell knowledge.', priority: 'High' },
    { key: 'aeon_disk', reason: 'Survives being targeted as the steal threat.', priority: 'Medium' },
    { key: 'lotus_orb', reason: 'Reflects targeted spells and dispels.', priority: 'Medium' },
  ],
  'Witch Doctor': [
    { key: 'arcane_boots', reason: 'Mana for Maledict + Death Ward.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Death Ward attacks nearby units.', priority: 'High' },
    { key: 'glimmer_cape', reason: 'Invisible channeling for Death Ward.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape after placing Death Ward.', priority: 'Medium' },
    { key: 'aeon_disk', reason: 'Survives burst when caught channeling.', priority: 'Medium' },
    { key: 'black_king_bar', reason: 'Channel Death Ward without interruption.', priority: 'Medium' },
  ],
  'Disruptor': [
    { key: 'arcane_boots', reason: 'Mana for Kinetic Field + Static Storm.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Kinetic Field placement.', priority: 'High' },
    { key: 'force_staff', reason: 'Push enemies into Kinetic Field.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Glimpse sends enemies back further.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Invisibility while repositioning.', priority: 'Medium' },
    { key: 'solar_crest', reason: 'Armor buff/debuff on priority targets.', priority: 'Medium' },
  ],
  'Omniknight': [
    { key: 'arcane_boots', reason: 'Mana for Purification and Guardian Angel.', priority: 'High' },
    { key: 'holy_locket', reason: 'Amplifies Purification heals.', priority: 'High' },
    { key: 'force_staff', reason: 'Repositioning during Guardian Angel.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Guardian Angel now affects buildings.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Kite with invisibility during GA channel.', priority: 'Medium' },
    { key: 'solar_crest', reason: 'Armor amplification on key targets.', priority: 'Medium' },
  ],
  'Dazzle': [
    { key: 'arcane_boots', reason: 'Mana for Shallow Grave + Weave.', priority: 'High' },
    { key: 'solar_crest', reason: 'Weave synergy with armor reduction.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Shallow Grave becomes area Weave empowered.', priority: 'High' },
    { key: 'force_staff', reason: 'Save allies or self with positioning.', priority: 'Medium' },
    { key: 'holy_locket', reason: 'Heal amplification on Shadow Wave.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Escape tool when targeted.', priority: 'Medium' },
  ],
  'Bane': [
    { key: 'arcane_boots', reason: 'Mana for Brain Sap + Fiend\'s Grip.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Fiend\'s Grip.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Fiend\'s Grip can be cast from full-screen range.', priority: 'High' },
    { key: 'glimmer_cape', reason: 'Invisible channeling for Fiend\'s Grip.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape from ganks between channels.', priority: 'Medium' },
    { key: 'aeon_disk', reason: 'Survives burst if enemy focuses you.', priority: 'Medium' },
  ],
  'Jakiro': [
    { key: 'arcane_boots', reason: 'Mana for Dual Breath + Macropyre.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Macropyre extends for much longer duration.', priority: 'High' },
    { key: 'force_staff', reason: 'Push enemies into Liquid Fire or Macropyre.', priority: 'High' },
    { key: 'glimmer_cape', reason: 'Survive burst and reposition.', priority: 'Medium' },
    { key: 'blink', reason: 'Initiation range for Macropyre placement.', priority: 'Medium' },
    { key: 'lotus_orb', reason: 'Dispel + reflect targeted spells.', priority: 'Medium' },
  ],
  'Warlock': [
    { key: 'arcane_boots', reason: 'Mana for Fatal Bonds + Chaotic Offering.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Golem is stronger and Upheaval has no cast limit.', priority: 'High' },
    { key: 'refresher', reason: 'Double Chaotic Offering = two golems in fights.', priority: 'High' },
    { key: 'force_staff', reason: 'Escape while golems tank for you.', priority: 'Medium' },
    { key: 'glimmer_cape', reason: 'Invisibility to reposition during Fatal Bonds.', priority: 'Medium' },
    { key: 'holy_locket', reason: 'Amplifies Shadow Word healing.', priority: 'Medium' },
  ],
  'Sand King': [
    { key: 'arcane_boots', reason: 'Mana for Burrowstrike + Sand Storm + Epicenter.', priority: 'High' },
    { key: 'blink', reason: 'Initiation range for Burrowstrike combo.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity for full Epicenter channel.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Epicenter pulses more and hits harder.', priority: 'Medium' },
    { key: 'kaya_and_sange', reason: 'Spell amp and status resist.', priority: 'Medium' },
    { key: 'heart', reason: 'HP for diving deep during Epicenter.', priority: 'Medium' },
  ],
};

const ATTR_CORE_ITEMS: Record<string, ItemEntry[]> = {
  agi: [
    { key: 'power_treads', reason: 'Core attack speed and attributes.', priority: 'High' },
    { key: 'butterfly', reason: 'Evasion and agility scaling.', priority: 'Medium' },
    { key: 'black_king_bar', reason: 'Spell immunity for safe fighting.', priority: 'High' },
  ],
  str: [
    { key: 'phase_boots', reason: 'Armor and movement for STR heroes.', priority: 'High' },
    { key: 'heart', reason: 'Maximum HP and regen for tanking.', priority: 'Medium' },
    { key: 'blink', reason: 'Initiation gap closer.', priority: 'High' },
  ],
  int: [
    { key: 'arcane_boots', reason: 'Mana sustain for spell casters.', priority: 'High' },
    { key: 'blink', reason: 'Positioning for spell combos.', priority: 'High' },
    { key: 'aghanims_scepter', reason: 'Upgrades ultimate for more impact.', priority: 'Medium' },
  ],
  all: [
    { key: 'power_treads', reason: 'Versatile stats for universal heroes.', priority: 'High' },
    { key: 'blink', reason: 'Initiation and escape.', priority: 'High' },
    { key: 'black_king_bar', reason: 'Spell immunity for safe fighting.', priority: 'Medium' },
  ],
};

const SPECIFIC_COUNTERS: Record<string, string> = {
  'Anti-Mage':       'Spell immunity and blink punish slow, ability-reliant lineups.',
  'Axe':             'Berserker\'s Call forces right-clickers into combat on bad terms.',
  'Bane':            'Fiend\'s Grip locks down a key hero for 7 seconds — unstoppable.',
  'Batrider':        'Flaming Lasso removes carries from fights with no counter-play.',
  'Bloodseeker':     'Rupture punishes blinkers and high-mobility heroes.',
  'Chen':            'Creep control adds early pressure and global saves.',
  'Clockwerk':       'Power Cogs isolate and trap heroes that rely on positioning.',
  'Crystal Maiden':  'Freezing Field punishes melee-heavy, slow lineups.',
  'Death Prophet':   'Silence and Exorcism shred squishy backlines.',
  'Disruptor':       'Kinetic Field + Static Storm deletes supports caught in the open.',
  'Doom':            'Doom removes one hero\'s kit entirely for 18 seconds.',
  'Dragon Knight':   'High armor and disable punish physical-damage-heavy lineups.',
  'Drow Ranger':     'Precision Aura shreds lineups with no evasion or dispel.',
  'Earthshaker':     'Echo Slam punishes tight, grouped-up lineups catastrophically.',
  'Elder Titan':     'Natural Order strips armor and magic resistance off tanky heroes.',
  'Ember Spirit':    'Chains of Flame and Sleight of Fist devastate grouped supports.',
  'Enigma':          'Black Hole wins teamfights outright against grouped lineups.',
  'Faceless Void':   'Chronosphere stops the enemy team cold — allies still act inside.',
  'Gyrocopter':      'Rocket Barrage and Call Down obliterate squishy targets.',
  'Huskar':          'Life Break ignores BKB — dominates magic-heavy lineups.',
  'Invoker':         'Versatile toolkit adapts to and counters almost any lineup.',
  'IO':              'Relocate provides global saves and pressure unavailable elsewhere.',
  'Juggernaut':      'Omnislash is BKB-piercing and impossible to outrun.',
  'Kunkka':          'X Marks the Spot + Torrent sets up free kills on any hero.',
  'Legion Commander':'Duel wins against isolated or low-armor targets snowball fast.',
  'Leshrac':         'Pulse Nova and Split Earth shred armored, grouped lineups.',
  'Lina':            'Dragon Slave + Light Strike Array punishes heroes without BKB.',
  'Lion':            'Hex + Finger of Death eliminates one target instantly.',
  'Luna':            'Eclipse wipes clumped supports and shreds physical-light lineups.',
  'Lycan':           'Shapeshift speed and wolves apply pressure faster than most heroes.',
  'Magnus':          'Reverse Polarity pulls the enemy team together for any AoE follow-up.',
  'Medusa':          'Stone Gaze and mana shield counter heavy-burst magic lineups.',
  'Mirana':          'Sacred Arrow picks off isolated, poorly-positioned heroes.',
  'Morphling':       'Adaptive Strike + replicate punish heroes who commit hard.',
  'Naga Siren':      'Song of the Siren gives allies a full reset in losing fights.',
  'Nature\'s Prophet': 'Global teleport picks off isolated heroes and sieges all game.',
  'Night Stalker':   'Crippling Fear silences casters and dominates at night.',
  'Ogre Magi':       'Multicast Ignite and slow punish low-mobility lineups.',
  'Omniknight':      'Guardian Angel makes physical-damage carries useless for 6 seconds.',
  'Oracle':          'False Promise saves allies from otherwise-lethal burst.',
  'Outworld Destroyer': 'Arcane Orb punishes high-int supports and casters.',
  'Phantom Assassin': 'Coup de Grâce crits delete squishy targets before they react.',
  'Phoenix':         'Supernova + Icarus Dive punishes grouped lineups hard.',
  'Pudge':           'Meat Hook removes one hero from a fight every 12 seconds.',
  'Puck':            'Ethereal Jaunt + Dream Coil prevents enemy disengagement.',
  'Queen of Pain':   'Sonic Wave devastates squishy backlines with no warning.',
  'Razor':           'Static Link drains carry damage to zero in a sustained fight.',
  'Rubick':          'Spell Steal copies the strongest ability in the enemy lineup.',
  'Sand King':       'Epicenter wipes grouped lineups that lack strong dispel.',
  'Shadow Demon':    'Disruption + Soul Catcher amplifies burst damage catastrophically.',
  'Shadow Fiend':    'Shadowraze pressure dominates lineups that lack gap-closers.',
  'Silencer':        'Global Silence shuts down every active ability for 6 seconds.',
  'Skywrath Mage':   'Mystic Flare nukes heroes with low magic resistance for free.',
  'Slark':           'Dark Pact purges debuffs that most heroes rely on to kill him.',
  'Sniper':          'Shrapnel + long range kites melee-heavy lineups with no escape.',
  'Spirit Breaker':  'Charge of Darkness picks off anyone out of position anywhere.',
  'Storm Spirit':    'Electric Vortex + Ball Lightning punishes stationary lineups.',
  'Techies':         'Minefield and remote mines punish aggressive, positional heroes.',
  'Templar Assassin': 'Psi Blades and Meld punish heroes with no vision tools.',
  'Terrorblade':     'Reflection punishes illusion-reliant or high-stat single heroes.',
  'Tidehunter':      'Ravage stuns the entire enemy team — follow-up wins fights.',
  'Timbersaw':       'Pure damage ignores armor on high-armor, tanky lineups.',
  'Tinker':          'Rearm allows infinite spell cycling against slow, reactive lineups.',
  'Tiny':            'Toss + Avalanche combo deletes supports in one rotation.',
  'Troll Warlord':   'Fervor stacks give right-click damage no tanky hero can ignore.',
  'Undying':         'Tombstone zombies overwhelm lineups that lack AoE clear.',
  'Vengeful Spirit':  'Nether Swap removes a core from their team at a critical moment.',
  'Visage':          'Gravekeeper\'s Cloak and familiars punish burst-reliant lineups.',
  'Warlock':         'Fatal Bonds + Chaotic Offering locks down grouped teamfight comps.',
  'Windranger':      'Windrun makes physical carries completely ineffective.',
  'Winter Wyvern':   'Arctic Burn + Cold Embrace punish melee-heavy lineups.',
  'Witch Doctor':    'Paralyzing Cask bounces and Death Ward shreds grouped targets.',
  'Wraith King':     'Reincarnation denies critical pick-off timing in close fights.',
  'Zeus':            'Lightning Bolt provides true sight and nukes invisible/low-HP targets.',
};

function buildCounterReason(hero: Hero, enemyHeroes: Hero[]): string {
  if (SPECIFIC_COUNTERS[hero.localized_name]) return SPECIFIC_COUNTERS[hero.localized_name];

  const heroRoles = new Set(hero.roles);
  const enemyRoles = new Set(enemyHeroes.flatMap(e => e.roles));
  const enemyNames = enemyHeroes.map(e => e.localized_name);

  if (heroRoles.has('Disabler') && enemyRoles.has('Carry')) {
    return `Reliable CC shuts down ${enemyNames[0] ?? 'the carry'} before they come online.`;
  }
  if (heroRoles.has('Nuker') && enemyRoles.has('Support')) {
    return `Burst damage eliminates ${enemyNames.find(n => enemyHeroes.find(h => h.localized_name === n && h.roles.includes('Support'))) ?? 'squishy supports'} before they act.`;
  }
  if (heroRoles.has('Initiator') && enemyRoles.has('Carry')) {
    return `Forces fights before ${enemyNames[0] ?? 'the enemy carry'} farms to full strength.`;
  }
  if (heroRoles.has('Durable') && enemyRoles.has('Nuker')) return 'Tanks through burst damage and stays relevant all fight.';
  if (heroRoles.has('Escape') && enemyRoles.has('Disabler')) return 'Slips out of disable combos that would trap other heroes.';
  if (heroRoles.has('Carry') && enemyRoles.has('Support')) return 'Outscales this support-heavy lineup by the late game.';
  if (heroRoles.has('Pusher') && enemyRoles.has('Initiator')) return 'Applies constant pressure this lineup cannot ignore.';
  if (heroRoles.has('Support') && enemyRoles.has('Nuker')) return 'Sustains allies through the constant nuke pressure.';
  if (hero.primary_attr === 'str') return `Physical durability punishes the burst this lineup relies on.`;
  if (hero.primary_attr === 'int') return `Spell kit exploits weaknesses across this enemy lineup.`;
  return `High win rate against this hero combination based on real match data.`;
}

// ─── Counter-Picks ────────────────────────────────────────────────────────
export async function getCounterPicks(enemyHeroes: Hero[]): Promise<Recommendation[]> {
  if (enemyHeroes.length === 0) return [];

  const [allHeroes, ...matchupsData] = await Promise.all([
    fetchHeroes(),
    ...enemyHeroes.map(h => fetchHeroMatchups(h.id)),
  ]);

  // Build counter score map: for each candidate hero, avg win rate AGAINST all enemies
  const scoreMap = new Map<number, { total: number; count: number }>();

  for (const matchups of matchupsData) {
    for (const m of matchups) {
      if (m.games_played < 200) continue;
      // m.wins = enemy wins vs m.hero_id → 1 - m.wins/games = m.hero_id win rate vs enemy
      const counterWinRate = 1 - m.wins / m.games_played;
      if (!scoreMap.has(m.hero_id)) scoreMap.set(m.hero_id, { total: 0, count: 0 });
      const e = scoreMap.get(m.hero_id)!;
      e.total += counterWinRate;
      e.count++;
    }
  }

  const alreadyPicked = new Set(enemyHeroes.map(h => h.id));

  return [...scoreMap.entries()]
    .filter(([id]) => !alreadyPicked.has(id))
    .map(([id, { total, count }]) => ({
      id,
      avgWinRate: total / count,
    }))
    .sort((a, b) => b.avgWinRate - a.avgWinRate)
    .slice(0, 10)
    .map(({ id, avgWinRate }) => {
      const hero = allHeroes.find(h => h.id === id);
      if (!hero) return null;
      const pct = Math.round(avgWinRate * 100);
      return {
        hero,
        score: pct,
        reason: buildCounterReason(hero, enemyHeroes),
      };
    })
    .filter(Boolean) as Recommendation[];
}

// ─── Item Recommendations ─────────────────────────────────────────────────
export async function getItemRecommendations(
  alliedHeroes: Hero[],
  enemyHeroes: Hero[]
): Promise<Record<string, ItemRecommendation[]>> {
  const items = await fetchItems();
  const result: Record<string, ItemRecommendation[]> = {};

  // Collect enemy role-based items
  const enemyRoleItems: { key: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[] = [];
  const seenKeys = new Set<string>();

  for (const enemy of enemyHeroes) {
    for (const role of enemy.roles) {
      const roleItems = ENEMY_ROLE_ITEMS[role] ?? [];
      for (const item of roleItems) {
        if (!seenKeys.has(item.key)) {
          seenKeys.add(item.key);
          enemyRoleItems.push(item);
        }
      }
    }
  }

  for (const hero of alliedHeroes) {
    const heroSpecific = HERO_ITEM_BUILDS[hero.localized_name];
    const coreItems = heroSpecific ?? ATTR_CORE_ITEMS[hero.primary_attr] ?? ATTR_CORE_ITEMS.agi;
    const coreKeys = new Set(coreItems.map(i => i.key));

    // If hero-specific build, show all 6 core items; otherwise blend in situational counter items
    const allItems = heroSpecific
      ? coreItems.slice(0, 6)
      : [
          ...coreItems,
          ...enemyRoleItems.filter(i => !coreKeys.has(i.key)),
        ].slice(0, 6);

    result[hero.name] = allItems.map(({ key, reason, priority }) => {
      const itemData = items[key];
      return {
        itemKey: key,
        itemName: itemData?.dname ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        reason,
        priority,
        img: itemData?.img,
        cost: itemData?.cost,
      };
    });
  }

  return result;
}
