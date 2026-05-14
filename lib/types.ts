export type ResourceKey = "food" | "materials" | "ammo" | "fuel" | "medicine";

export type BuildingType = "interior" | "exterior" | "permanent";

export type ResourceMap = Record<ResourceKey, number>;

export type Building = {
  name: string;
  type: BuildingType;
  effect: string;
  cost: Partial<ResourceMap>;
};

export type Slot = {
  id: string;
  label: string;
  type: BuildingType;
  building: Building | null;
  buildingLevel?: number;
  assignedSurvivorId?: string | null;
  patientSurvivorId?: string | null;
};

export type Assignment =
  | "Resting"
  | "Farming"
  | "Guard Duty"
  | "Scavenging"
  | "Medical"
  | "Engineering"
  | "On Mission";

export type Survivor = {
  id: string;
  name: string;
  specialty: string;
  health: number;
  stamina: number;
  assignment: Assignment;
};

export type BasePath = "starter" | "farmstead" | "fortified";

export type BaseLayout = {
  id: BasePath;
  name: string;
  level: number;
  tagline: string;
  description: string;
  bonuses: string[];
  slots: Slot[];
  passive: Partial<ResourceMap>;
  defenseBonus: number;
  wallBonus: number;
};

export type ScavengeLocation = {
  id: string;
  name: string;
  risk: "Low" | "Medium" | "High";
  durationMinutes: number;
  loot: Partial<ResourceMap>;
  injuryChance?: number;
  failureChance?: number;
};

export type MapMission = ScavengeLocation & {
  mapX: number;
  mapY: number;
  icon: string;
  expiresAtMinute: number;
};

export type Mission = {
  id: string;
  survivorId: string;
  survivorName: string;
  locationName: string;
  departAtMinute: number;
  returnAtMinute: number;
  loot: Partial<ResourceMap>;
  risk: "Low" | "Medium" | "High";
  injuryChance?: number;
  failureChance?: number;
  mapX?: number;
  mapY?: number;
  icon?: string;
};

export type NightAttackResult = {
  happened: boolean;
  success: boolean;
  message: string;
};
