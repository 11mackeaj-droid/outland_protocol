export type ResourceKey = "food" | "materials" | "ammo" | "fuel" | "medicine";
export type ResourceMap = Record<ResourceKey, number>;

export type BuildingType = "interior" | "exterior" | "permanent";
export type Assignment =
  | "Unassigned"
  | "Farming"
  | "Guard Duty"
  | "Medical"
  | "Engineering"
  | "Resting"
  | "On Mission";

export type BasePath = "none" | "farmstead" | "fortified" | "industrial";

export type Building = {
  name: string;
  type: BuildingType;
  effect: string;
  cost: Partial<ResourceMap>;
  maxLevel: number;
};

export type BuiltBuilding = Building & {
  level: number;
};

export type Slot = {
  id: string;
  label: string;
  type: BuildingType;
  building: BuiltBuilding | null;
  assignedSurvivorId?: string | null;
  patientSurvivorId?: string | null;
};

export type Survivor = {
  id: string;
  name: string;
  specialty: string;
  health: number;
  stamina: number;
  assignment: Assignment;
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
