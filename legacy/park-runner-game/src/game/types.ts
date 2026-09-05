export type WeaponKind = "gun" | "bow" | "banana";
export type EnemyKind = "ground" | "air";

export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

export type Projectile = {
  id: number;
  weapon: WeaponKind;
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
};

export type Mushroom = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MysteryBox = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  opened: boolean;
};

export type PlayerCombatState = {
  armor: number;
  bullets: number;
  arrows: number;
  bananas: number;
  disguised: boolean;
  giantTimer: number;
};

export type CombatHitResult = {
  enemies: Enemy[];
  projectiles: Projectile[];
  scoreDelta: number;
};
