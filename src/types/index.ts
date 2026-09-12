export interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  img: string;
}

export interface HeroStats {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  base_str: number;
  base_agi: number;
  base_int: number;
  str_gain: number;
  agi_gain: number;
  int_gain: number;
  base_health: number;
  base_armor: number;
  move_speed: number;
  base_attack_min: number;
  base_attack_max: number;
  attack_range: number;
  img: string;
  icon: string;
}

export interface DotaItem {
  id: number;
  dname: string;
  cost: number;
  img: string;
  qual: string;
  abilities?: { title: string; description: string; type: string }[];
  lore?: string;
}

export interface DraftState {
  enemyHeroes: Hero[];
  alliedHeroes: Hero[];
}

export interface Recommendation {
  hero: Hero;
  score: number;
  reason: string;
}

export interface ItemRecommendation {
  itemName: string;
  itemKey: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
  img?: string;
  cost?: number;
}
