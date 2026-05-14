import type { Assignment, BasePath, Building, ResourceMap, ScavengeLocation, Slot, Survivor } from "./types";

export const startingResources: ResourceMap = {
  food: 35,
  materials: 60,
  ammo: 12,
  fuel: 8,
  medicine: 6,
};

export const buildings: Building[] = [
  { name: "Sleeping Quarters", type: "interior", effect: "Recovers stamina and raises survivor capacity", cost: { materials: 18 }, maxLevel: 3 },
  { name: "Workshop", type: "interior", effect: "Produces materials when staffed", cost: { materials: 30 }, maxLevel: 3 },
  { name: "Infirmary", type: "interior", effect: "Heals injured survivors", cost: { materials: 22, medicine: 4 }, maxLevel: 3 },
  { name: "Storage", type: "interior", effect: "Raises resource caps", cost: { materials: 20 }, maxLevel: 3 },
  { name: "Radio Room", type: "interior", effect: "Improves mission options and map awareness", cost: { materials: 35, fuel: 2 }, maxLevel: 3 },
  { name: "Garden", type: "exterior", effect: "Produces food", cost: { materials: 15 }, maxLevel: 3 },
  { name: "Water Collector", type: "exterior", effect: "Supports food and survival systems", cost: { materials: 18 }, maxLevel: 3 },
  { name: "Watchtower", type: "exterior", effect: "Raises defense", cost: { materials: 25, ammo: 4 }, maxLevel: 3 },
  { name: "Generator", type: "exterior", effect: "Adds powered systems bonuses", cost: { materials: 25, fuel: 5 }, maxLevel: 3 },
  { name: "Training Yard", type: "exterior", effect: "Improves guard efficiency", cost: { materials: 28, ammo: 2 }, maxLevel: 3 },
];

export const initialSlots: Slot[] = [
  {
    id: "command",
    label: "Command Center",
    type: "permanent",
    building: { name: "Command Center", type: "permanent", effect: "Controls base level and upgrade path", cost: {}, maxLevel: 5, level: 1 },
  },
  { id: "int-1", label: "Interior Slot 1", type: "interior", building: null },
  { id: "int-2", label: "Interior Slot 2", type: "interior", building: null },
  { id: "int-3", label: "Interior Slot 3", type: "interior", building: null },
  { id: "ext-1", label: "Exterior Slot 1", type: "exterior", building: null },
  { id: "ext-2", label: "Exterior Slot 2", type: "exterior", building: null },
  { id: "ext-3", label: "Exterior Slot 3", type: "exterior", building: null },
];

export const initialSurvivors: Survivor[] = [
  { id: "mason", name: "Mason", specialty: "Scavenger", health: 100, stamina: 100, assignment: "Unassigned" },
  { id: "elena", name: "Elena", specialty: "Medic", health: 100, stamina: 100, assignment: "Medical" },
  { id: "carter", name: "Carter", specialty: "Guard", health: 100, stamina: 100, assignment: "Guard Duty" },
  { id: "ivy", name: "Ivy", specialty: "Farmer", health: 100, stamina: 100, assignment: "Farming" },
];

export const assignments: Assignment[] = ["Unassigned", "Farming", "Guard Duty", "Medical", "Engineering", "Resting"];

export const basePathInfo: Record<BasePath, { label: string; bonus: string }> = {
  none: { label: "No path selected", bonus: "Upgrade Command Center to choose a base path." },
  farmstead: { label: "Farmstead Compound", bonus: "Permanent garden bonus, better food output, stronger long-term survival." },
  fortified: { label: "Fortified Yard", bonus: "Stronger walls, better defense, safer night attacks." },
  industrial: { label: "Industrial Depot", bonus: "Better materials, generator value, and building upgrade speed." },
};

export const scavengeLocations: ScavengeLocation[] = [
  { id: "houses", name: "Abandoned Houses", risk: "Low", durationMinutes: 360, loot: { food: 4, materials: 3 } },
  { id: "market", name: "Old Market", risk: "Low", durationMinutes: 420, loot: { food: 5, medicine: 1 } },
  { id: "farmhouse", name: "Farmhouse", risk: "Low", durationMinutes: 480, loot: { food: 6, materials: 2 } },
  { id: "hardware", name: "Hardware Store", risk: "Medium", durationMinutes: 720, loot: { materials: 8, fuel: 2 } },
  { id: "warehouse", name: "Warehouse", risk: "Medium", durationMinutes: 780, loot: { materials: 10 } },
  { id: "pharmacy", name: "Pharmacy", risk: "Medium", durationMinutes: 840, loot: { medicine: 5, food: 2 } },
  { id: "gas", name: "Gas Station", risk: "Medium", durationMinutes: 720, loot: { fuel: 5, materials: 3 } },
  { id: "clinic", name: "Emergency Clinic", risk: "Medium", durationMinutes: 900, loot: { medicine: 7 } },
  { id: "police", name: "Police Station", risk: "High", durationMinutes: 1080, loot: { ammo: 8, medicine: 2 } },
  { id: "checkpoint", name: "Military Checkpoint", risk: "High", durationMinutes: 1140, loot: { ammo: 10, fuel: 2 } },
];
