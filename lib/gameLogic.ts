import type { BasePath, Building, BuiltBuilding, NightAttackResult, ResourceKey, ResourceMap, Slot, Survivor } from "./types";

export function formatGameTime(minutes: number) {
  const day = Math.floor(minutes / 1440) + 1;
  const timeMinutes = minutes % 1440;
  const hour = Math.floor(timeMinutes / 60);
  const minute = timeMinutes % 60;
  return { day, hour, minute, time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

export function getThreat(hour: number) {
  if (hour >= 21 || hour < 5) return "HIGH";
  if (hour >= 18 || hour < 7) return "MEDIUM";
  return "LOW";
}

export function getBuildingLevel(slot: Slot) {
  return slot.building?.level ?? 0;
}

export function countBuilding(slots: Slot[], buildingName: string) {
  return slots.filter((slot) => slot.building?.name === buildingName).length;
}

export function countStaffedBuilding(slots: Slot[], survivors: Survivor[], buildingName: string) {
  return slots.filter((slot) => {
    if (slot.building?.name !== buildingName || !slot.assignedSurvivorId) return false;
    const worker = survivors.find((person) => person.id === slot.assignedSurvivorId);
    return !!worker && worker.assignment !== "On Mission" && worker.health > 0 && worker.stamina > 0;
  }).length;
}

export function getActiveSlotWorker(slot: Slot, survivors: Survivor[]) {
  if (!slot.assignedSurvivorId) return null;
  const survivor = survivors.find((person) => person.id === slot.assignedSurvivorId);
  if (!survivor || survivor.assignment === "On Mission" || survivor.health <= 0 || survivor.stamina <= 0) return null;
  return survivor;
}

export function getPathMultiplier(basePath: BasePath) {
  if (basePath === "farmstead") return { food: 1.25, materials: 1, defense: 1, healing: 1 };
  if (basePath === "fortified") return { food: 1, materials: 1, defense: 1.3, healing: 1 };
  if (basePath === "industrial") return { food: 1, materials: 1.25, defense: 1, healing: 1.1 };
  return { food: 1, materials: 1, defense: 1, healing: 1 };
}

export function calculateRoomProduction(slots: Slot[], survivors: Survivor[], basePath: BasePath): ResourceMap {
  const multiplier = getPathMultiplier(basePath);
  const production: ResourceMap = { food: 0, materials: 0, ammo: 0, fuel: 0, medicine: 0 };

  slots.forEach((slot) => {
    if (!slot.building) return;
    const level = slot.building.level;
    const worker = getActiveSlotWorker(slot, survivors);

    if (slot.building.name === "Garden") production.food += (0.2 * level + (worker ? 0.45 * level : 0)) * multiplier.food;
    if (slot.building.name === "Water Collector") production.food += 0.08 * level;
    if (slot.building.name === "Workshop" && worker) production.materials += 0.45 * level * multiplier.materials;
    if (slot.building.name === "Generator" && worker) production.fuel += 0.08 * level;
    if (slot.building.name === "Infirmary" && worker) production.medicine += 0.05 * level;
  });

  if (basePath === "farmstead") production.food += 0.35;
  return production;
}

export function calculateDefense(survivors: Survivor[], slots: Slot[], basePath: BasePath, baseLevel: number, wallIntegrity: number) {
  const multiplier = getPathMultiplier(basePath);
  let defense = 8 + baseLevel * 4 + Math.floor(wallIntegrity / 20);

  slots.forEach((slot) => {
    if (!slot.building) return;
    const worker = getActiveSlotWorker(slot, survivors);
    if (slot.building.name === "Watchtower") defense += 8 * slot.building.level + (worker ? 12 * slot.building.level : 0);
    if (slot.building.name === "Training Yard") defense += 4 * slot.building.level;
  });

  return Math.floor(defense * multiplier.defense);
}

export function getStorageCaps(slots: Slot[], baseLevel: number): ResourceMap {
  const storageLevels = slots.reduce((total, slot) => total + (slot.building?.name === "Storage" ? slot.building.level : 0), 0);
  const baseBonus = (baseLevel - 1) * 30;
  return {
    food: 75 + baseBonus + storageLevels * 45,
    materials: 75 + baseBonus + storageLevels * 45,
    ammo: 40 + baseBonus + storageLevels * 20,
    fuel: 40 + baseBonus + storageLevels * 20,
    medicine: 40 + baseBonus + storageLevels * 20,
  };
}

export function canAfford(resources: ResourceMap, cost: Partial<ResourceMap>) {
  return Object.entries(cost).every(([key, value]) => resources[key as ResourceKey] >= (value ?? 0));
}

export function payCost(resources: ResourceMap, cost: Partial<ResourceMap>) {
  const next = { ...resources };
  Object.entries(cost).forEach(([key, value]) => {
    next[key as ResourceKey] = Math.max(0, next[key as ResourceKey] - (value ?? 0));
  });
  return next;
}

export function canAffordBuilding(resources: ResourceMap, building: Building) {
  return canAfford(resources, building.cost);
}

export function payBuildingCost(resources: ResourceMap, building: Building) {
  return payCost(resources, building.cost);
}

export function getBuildingUpgradeCost(building: BuiltBuilding): Partial<ResourceMap> {
  const nextLevel = building.level + 1;
  return {
    materials: Math.ceil((building.cost.materials ?? 15) * nextLevel * 0.85),
    ammo: building.cost.ammo ? Math.ceil(building.cost.ammo * nextLevel * 0.75) : 0,
    fuel: building.cost.fuel ? Math.ceil(building.cost.fuel * nextLevel * 0.75) : 0,
    medicine: building.cost.medicine ? Math.ceil(building.cost.medicine * nextLevel * 0.75) : 0,
  };
}

export function getBaseUpgradeCost(baseLevel: number): Partial<ResourceMap> {
  const next = baseLevel + 1;
  return { materials: next * 45, food: next * 12, fuel: next >= 3 ? 8 : 3 };
}

export function clampResources(resources: ResourceMap, caps: ResourceMap): ResourceMap {
  return {
    food: Math.max(0, Math.min(resources.food, caps.food)),
    materials: Math.max(0, Math.min(resources.materials, caps.materials)),
    ammo: Math.max(0, Math.min(resources.ammo, caps.ammo)),
    fuel: Math.max(0, Math.min(resources.fuel, caps.fuel)),
    medicine: Math.max(0, Math.min(resources.medicine, caps.medicine)),
  };
}

export function resolveNightAttack(defense: number): NightAttackResult {
  const attackPower = 25 + Math.floor(Math.random() * 60);
  const defenseRoll = defense + Math.floor(Math.random() * 35);
  return {
    happened: true,
    success: defenseRoll >= attackPower,
    message: defenseRoll >= attackPower
      ? `Night attack repelled. Defense ${defenseRoll} vs attack ${attackPower}.`
      : `Night attack breached the perimeter. Defense ${defenseRoll} vs attack ${attackPower}.`,
  };
}

export function formatCost(cost: Partial<ResourceMap>) {
  const entries = Object.entries(cost).filter(([, value]) => (value ?? 0) > 0);
  if (entries.length === 0) return "Free";
  return entries.map(([key, value]) => `${key.toUpperCase()} ${value}`).join(" • ");
}
