import type {
  BaseLayout,
  Building,
  NightAttackResult,
  ResourceKey,
  ResourceMap,
  Slot,
  Survivor,
} from "./types";

export function formatGameTime(minutes: number) {
  const day = Math.floor(minutes / 1440) + 1;
  const timeMinutes = minutes % 1440;

  const hour = Math.floor(timeMinutes / 60);
  const minute = timeMinutes % 60;

  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}`;

  return {
    day,
    hour,
    minute,
    time,
  };
}

export function getThreat(hour: number) {
  if (hour >= 21 || hour < 5) return "HIGH";
  if (hour >= 18 || hour < 7) return "MEDIUM";
  return "LOW";
}

export function hasBuilding(slots: Slot[], buildingName: string) {
  return slots.some((slot) => slot.building?.name === buildingName);
}

export function countBuilding(slots: Slot[], buildingName: string) {
  return slots.filter((slot) => slot.building?.name === buildingName).length;
}

export function countAssignment(survivors: Survivor[], assignment: string) {
  return survivors.filter((survivor) => survivor.assignment === assignment)
    .length;
}

export function getActiveSlotWorker(slot: Slot, survivors: Survivor[]) {
  if (!slot.assignedSurvivorId) return null;

  const survivor = survivors.find(
    (person) => person.id === slot.assignedSurvivorId
  );

  if (!survivor) return null;
  if (survivor.assignment === "On Mission") return null;
  if (survivor.stamina <= 0) return null;
  if (survivor.health <= 0) return null;

  return survivor;
}

export function calculateRoomProduction(
  slots: Slot[],
  survivors: Survivor[],
  layout?: BaseLayout
): ResourceMap {
  const production: ResourceMap = {
    food: 0,
    materials: 0,
    ammo: 0,
    fuel: 0,
    medicine: 0,
  };

  if (layout?.passive) {
    Object.entries(layout.passive).forEach(([key, amount]) => {
      production[key as ResourceKey] += amount ?? 0;
    });
  }

  slots.forEach((slot) => {
    if (!slot.building) return;

    const worker = getActiveSlotWorker(slot, survivors);

    const level = slot.buildingLevel ?? 1;

    if (slot.building.name === "Garden") {
      production.food += 0.2 * level;
      if (worker) production.food += 0.5 * level;
    }

    if (slot.building.name === "Permanent Garden") {
      production.food += 0.25 * level;
    }

    if (slot.building.name === "Workshop") {
      if (worker) production.materials += 0.5 * level;
    }

    if (slot.building.name === "Kitchen") {
      production.food += 0.08 * level;
      if (worker) production.food += 0.18 * level;
    }

    if (slot.building.name === "Armory") {
      if (worker) production.ammo += 0.12 * level;
    }

    if (slot.building.name === "Generator") {
      if (worker) production.fuel += 0.06 * level;
    }

    if (slot.building.name === "Rain Collector") {
      production.medicine += 0.04 * level;
      production.food += 0.06 * level;
    }

    if (slot.building.name === "Radio Tower") {
      if (worker) production.materials += 0.12 * level;
    }

    if (slot.building.name === "Infirmary") {
      // Infirmary heals patients instead of producing medicine.
    }
  });

  return production;
}

export function calculateDefense(
  survivors: Survivor[],
  slots: Slot[],
  layout?: BaseLayout
) {
  let defense = 10 + (layout?.defenseBonus ?? 0);

  slots.forEach((slot) => {
    if (!["Watchtower", "Armory", "Training Yard"].includes(slot.building?.name || "")) return;

    const worker = getActiveSlotWorker(slot, survivors);

    const level = slot.buildingLevel ?? 1;
    if (slot.building?.name === "Watchtower") defense += 10 * level;
    if (slot.building?.name === "Armory") defense += 6 * level;
    if (slot.building?.name === "Training Yard") defense += 8 * level;

    if (worker) {
      if (slot.building?.name === "Watchtower") defense += 20 * level;
      if (slot.building?.name === "Armory") defense += 10 * level;
      if (slot.building?.name === "Training Yard") defense += 12 * level;
    }
  });

  return defense;
}

export function getStorageCaps(slots: Slot[], layout?: BaseLayout): ResourceMap {
  const storageLevelTotal = slots.reduce((total, slot) => {
    if (slot.building?.name !== "Storage") return total;
    return total + (slot.buildingLevel ?? 1);
  }, 0);

  return {
    food: 75 + storageLevelTotal * 50 + (layout?.level ?? 1) * 10,
    materials: 75 + storageLevelTotal * 50 + (layout?.level ?? 1) * 10,
    ammo: 40 + storageLevelTotal * 25 + ((layout?.level ?? 1) - 1) * 10,
    fuel: 40 + storageLevelTotal * 25 + ((layout?.level ?? 1) - 1) * 10,
    medicine: 40 + storageLevelTotal * 25 + ((layout?.level ?? 1) - 1) * 10,
  };
}

export function canAffordBuilding(resources: ResourceMap, building: Building) {
  return Object.entries(building.cost).every(([key, cost]) => {
    return resources[key as ResourceKey] >= (cost ?? 0);
  });
}

export function payBuildingCost(resources: ResourceMap, building: Building) {
  const next = { ...resources };

  Object.entries(building.cost).forEach(([key, cost]) => {
    next[key as ResourceKey] -= cost ?? 0;
  });

  return next;
}

export function getBuildingUpgradeCost(slot: Slot): Partial<ResourceMap> | null {
  if (!slot.building) return null;

  const level = slot.buildingLevel ?? 1;
  if (level >= 3) return null;

  const baseMaterialCost = slot.type === "permanent" ? 30 : 18;
  const cost: Partial<ResourceMap> = {
    materials: baseMaterialCost * level,
  };

  if (["Generator", "Radio Room", "Radio Tower"].includes(slot.building.name)) {
    cost.fuel = 2 * level;
  }

  if (slot.building.name === "Infirmary") {
    cost.medicine = 1 * level;
  }

  if (["Garden", "Permanent Garden", "Kitchen", "Rain Collector"].includes(slot.building.name)) {
    cost.food = 4 * level;
  }

  if (slot.building.name === "Armory") {
    cost.ammo = 2 * level;
  }

  return cost;
}

export function canAffordCost(resources: ResourceMap, cost: Partial<ResourceMap> | null) {
  if (!cost) return false;

  return Object.entries(cost).every(([key, amount]) => {
    return resources[key as ResourceKey] >= (amount ?? 0);
  });
}

export function payResourceCost(resources: ResourceMap, cost: Partial<ResourceMap>) {
  const next = { ...resources };

  Object.entries(cost).forEach(([key, amount]) => {
    next[key as ResourceKey] = Math.max(0, next[key as ResourceKey] - (amount ?? 0));
  });

  return next;
}

export function clampResources(
  resources: ResourceMap,
  caps: ResourceMap
): ResourceMap {
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

  if (defenseRoll >= attackPower) {
    return {
      happened: true,
      success: true,
      message: `Night attack repelled. Defense ${defenseRoll} vs attack ${attackPower}.`,
    };
  }

  return {
    happened: true,
    success: false,
    message: `Night attack breached the perimeter. Defense ${defenseRoll} vs attack ${attackPower}.`,
  };
}