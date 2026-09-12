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

const ATTR_CORE_ITEMS: Record<string, { key: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[]> = {
  agi: [
    { key: 'power_treads', reason: 'Core attack speed and attributes.', priority: 'High' },
    { key: 'butterfly', reason: 'Evasion and agility scaling.', priority: 'Medium' },
  ],
  str: [
    { key: 'phase_boots', reason: 'Armor and movement for STR heroes.', priority: 'High' },
    { key: 'heart', reason: 'Maximum HP and regen for tanking.', priority: 'Medium' },
  ],
  int: [
    { key: 'arcane_boots', reason: 'Mana sustain for spell casters.', priority: 'High' },
    { key: 'blink', reason: 'Positioning for spell combos.', priority: 'High' },
  ],
  all: [
    { key: 'power_treads', reason: 'Versatile stats for universal heroes.', priority: 'High' },
    { key: 'echo_sabre', reason: 'Attack speed and slow.', priority: 'Medium' },
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
    const coreItems = ATTR_CORE_ITEMS[hero.primary_attr] ?? ATTR_CORE_ITEMS.agi;
    const coreKeys = new Set(coreItems.map(i => i.key));

    // Merge core + situational, avoiding duplicates
    const allItems = [
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
