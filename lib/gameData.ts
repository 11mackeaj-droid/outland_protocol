import type {
  Assignment,
  BaseLayout,
  Building,
  ScavengeLocation,
  Slot,
  Survivor,
} from "./types";

export const buildings: Building[] = [
  {
    name: "Sleeping Quarters",
    type: "interior",
    effect: "+ survivor capacity",
    cost: { materials: 18 },
  },
  {
    name: "Workshop",
    type: "interior",
    effect: "+ materials crafting",
    cost: { materials: 30 },
  },
  {
    name: "Infirmary",
    type: "interior",
    effect: "+ healing",
    cost: { materials: 22, medicine: 4 },
  },
  {
    name: "Storage",
    type: "interior",
    effect: "+ resource storage capacity",
    cost: { materials: 20 },
  },
  {
    name: "Kitchen",
    type: "interior",
    effect: "Reduces food waste and boosts staffed food output",
    cost: { materials: 24, food: 6 },
  },
  {
    name: "Armory",
    type: "interior",
    effect: "+ ammo upkeep and defense planning",
    cost: { materials: 32, ammo: 6 },
  },
  {
    name: "Garden",
    type: "exterior",
    effect: "+ food production",
    cost: { materials: 15 },
  },
  {
    name: "Watchtower",
    type: "exterior",
    effect: "+ defense",
    cost: { materials: 25, ammo: 4 },
  },
  {
    name: "Generator",
    type: "exterior",
    effect: "+ power systems and fuel efficiency",
    cost: { materials: 25, fuel: 5 },
  },
  {
    name: "Rain Collector",
    type: "exterior",
    effect: "+ passive medicine/food support from clean water",
    cost: { materials: 18 },
  },
  {
    name: "Training Yard",
    type: "exterior",
    effect: "+ staffed defense and survivor stamina training",
    cost: { materials: 28 },
  },
  {
    name: "Radio Tower",
    type: "exterior",
    effect: "+ mission planning and future recruitment",
    cost: { materials: 30, fuel: 3 },
  },
];

const commandCenter: Building = {
  name: "Command Center",
  type: "permanent",
  effect: "Outland Protocol active",
  cost: {},
};

const permanentGarden: Building = {
  name: "Permanent Garden",
  type: "permanent",
  effect: "+0.45 passive food/tick and unlocks Farmstead path",
  cost: {},
};

const reinforcedGate: Building = {
  name: "Reinforced Gate",
  type: "permanent",
  effect: "+18 defense and stronger night attack resistance",
  cost: {},
};

const radioRoom: Building = {
  name: "Radio Room",
  type: "permanent",
  effect: "Improves future survivor recruitment and mission planning",
  cost: {},
};

export const initialSlots: Slot[] = [
  {
    id: "command",
    label: "Command Center",
    type: "permanent",
    building: commandCenter,
    buildingLevel: 1,
  },
  { id: "int-1", label: "Interior Slot 1", type: "interior", building: null },
  { id: "int-2", label: "Interior Slot 2", type: "interior", building: null },
  { id: "ext-1", label: "Exterior Slot 1", type: "exterior", building: null },
  { id: "ext-2", label: "Exterior Slot 2", type: "exterior", building: null },
];

export const baseLayouts: BaseLayout[] = [
  {
    id: "starter",
    name: "Starter Shelter",
    level: 1,
    tagline: "Small emergency shelter",
    description: "Basic rooms and enough space to survive the first nights.",
    bonuses: ["No permanent bonus", "Upgradeable at 4 survivors"],
    slots: initialSlots,
    passive: {},
    defenseBonus: 0,
    wallBonus: 0,
  },
  {
    id: "farmstead",
    name: "Farmstead Compound",
    level: 2,
    tagline: "Food-first survivor base",
    description:
      "Choose the Farmstead path: the base expands into a wider food-focused compound with a permanent garden and better food security.",
    bonuses: ["Permanent Garden", "+0.45 food/tick", "More exterior space"],
    slots: [
      { id: "command", label: "Command Center", type: "permanent", building: commandCenter, buildingLevel: 1 },
      { id: "perm-garden", label: "Permanent Garden", type: "permanent", building: permanentGarden, buildingLevel: 1 },
      { id: "int-1", label: "Interior Slot 1", type: "interior", building: null },
      { id: "int-2", label: "Interior Slot 2", type: "interior", building: null },
      { id: "int-3", label: "Interior Slot 3", type: "interior", building: null },
      { id: "ext-1", label: "Exterior Slot 1", type: "exterior", building: null },
      { id: "ext-2", label: "Exterior Slot 2", type: "exterior", building: null },
      { id: "ext-3", label: "Exterior Slot 3", type: "exterior", building: null },
    ],
    passive: { food: 0.45 },
    defenseBonus: 4,
    wallBonus: 5,
  },
  {
    id: "fortified",
    name: "Fortified Yard",
    level: 2,
    tagline: "Defense-first survivor base",
    description:
      "Choose the Fortified path: the base expands into a tighter defensive yard with a reinforced gate and patrol lanes.",
    bonuses: ["Permanent Reinforced Gate", "+18 defense", "Night attacks hit softer"],
    slots: [
      { id: "command", label: "Command Center", type: "permanent", building: commandCenter, buildingLevel: 1 },
      { id: "perm-gate", label: "Reinforced Gate", type: "permanent", building: reinforcedGate, buildingLevel: 1 },
      { id: "radio", label: "Radio Room", type: "permanent", building: radioRoom, buildingLevel: 1 },
      { id: "int-1", label: "Interior Slot 1", type: "interior", building: null },
      { id: "int-2", label: "Interior Slot 2", type: "interior", building: null },
      { id: "ext-1", label: "Exterior Slot 1", type: "exterior", building: null },
      { id: "ext-2", label: "Exterior Slot 2", type: "exterior", building: null },
    ],
    passive: {},
    defenseBonus: 18,
    wallBonus: 20,
  },
];

export const baseUpgradeCost = {
  materials: 45,
  food: 20,
  fuel: 4,
} as const;

export const initialSurvivors: Survivor[] = [
  {
    id: "mason",
    name: "Mason",
    specialty: "Scavenger",
    health: 100,
    stamina: 100,
    assignment: "Resting",
  },
  {
    id: "elena",
    name: "Elena",
    specialty: "Medic",
    health: 100,
    stamina: 100,
    assignment: "Medical",
  },
  {
    id: "carter",
    name: "Carter",
    specialty: "Guard",
    health: 100,
    stamina: 100,
    assignment: "Guard Duty",
  },
  {
    id: "ivy",
    name: "Ivy",
    specialty: "Farmer",
    health: 100,
    stamina: 100,
    assignment: "Farming",
  },
];

export const assignments: Assignment[] = [
  "Resting",
  "Farming",
  "Guard Duty",
  "Scavenging",
  "Medical",
  "Engineering",
];

export const scavengeLocations: ScavengeLocation[] = [
  {
    id: "houses",
    name: "Abandoned Houses",
    risk: "Low",
    durationMinutes: 360,
    loot: { food: 4, materials: 3 },
  },
  {
    id: "market",
    name: "Old Market",
    risk: "Low",
    durationMinutes: 420,
    loot: { food: 5, medicine: 1 },
  },
  {
    id: "farmhouse",
    name: "Farmhouse",
    risk: "Low",
    durationMinutes: 480,
    loot: { food: 6, materials: 2 },
  },
  {
    id: "hardware",
    name: "Hardware Store",
    risk: "Medium",
    durationMinutes: 720,
    loot: { materials: 8, fuel: 2 },
  },
  {
    id: "warehouse",
    name: "Warehouse",
    risk: "Medium",
    durationMinutes: 780,
    loot: { materials: 10 },
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    risk: "Medium",
    durationMinutes: 840,
    loot: { medicine: 5, food: 2 },
  },
  {
    id: "gas",
    name: "Gas Station",
    risk: "Medium",
    durationMinutes: 720,
    loot: { fuel: 5, materials: 3 },
  },
  {
    id: "clinic",
    name: "Emergency Clinic",
    risk: "Medium",
    durationMinutes: 900,
    loot: { medicine: 7 },
  },
  {
    id: "police",
    name: "Police Station",
    risk: "High",
    durationMinutes: 1080,
    loot: { ammo: 8, medicine: 2 },
  },
  {
    id: "checkpoint",
    name: "Military Checkpoint",
    risk: "High",
    durationMinutes: 1140,
    loot: { ammo: 10, fuel: 2 },
  },
];
