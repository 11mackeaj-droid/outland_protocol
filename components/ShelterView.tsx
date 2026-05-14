"use client";

import { useEffect, useMemo, useState } from "react";
import { canAffordCost, getBuildingUpgradeCost } from "../lib/gameLogic";
import type { BaseLayout, ResourceMap, Slot, Survivor } from "../lib/types";

type Props = {
  slots: Slot[];
  survivors: Survivor[];
  threat: string;
  wallIntegrity: number;
  layout: BaseLayout;
  resources: ResourceMap;
  canUpgradeBase: boolean;
  baseUpgradeCost: Partial<ResourceMap>;
  onOpenBaseUpgrade: () => void;
  onUpgradeBuilding: (slotId: string) => void;
  onSelectSlot: (slot: Slot) => void;
  onAssignSurvivor: (slotId: string, survivorId: string | null) => void;
  onAssignPatient: (slotId: string, survivorId: string | null) => void;
};

type Point = {
  x: number;
  y: number;
};

type AgentMind = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: string;
  wait: number;
};

const roomPositions: Record<string, string> = {
  command: "col-start-2 row-start-2",
  "perm-garden": "col-start-1 row-start-2",
  "perm-gate": "col-start-2 row-start-1",
  radio: "col-start-3 row-start-2",
  "ext-1": "col-start-1 row-start-1",
  "ext-2": "col-start-3 row-start-1",
  "ext-3": "col-start-2 row-start-4",
  "int-1": "col-start-1 row-start-3",
  "int-2": "col-start-3 row-start-3",
  "int-3": "col-start-2 row-start-3",
};

const roomCenters: Record<string, Point> = {
  command: { x: 50, y: 50 },
  "perm-garden": { x: 18, y: 50 },
  "perm-gate": { x: 50, y: 18 },
  radio: { x: 82, y: 50 },
  "ext-1": { x: 18, y: 20 },
  "ext-2": { x: 82, y: 20 },
  "ext-3": { x: 50, y: 86 },
  "int-1": { x: 18, y: 72 },
  "int-2": { x: 82, y: 72 },
  "int-3": { x: 50, y: 72 },
};

const hallwayPoints: Point[] = [
  { x: 50, y: 30 },
  { x: 50, y: 40 },
  { x: 50, y: 58 },
  { x: 50, y: 68 },
  { x: 34, y: 50 },
  { x: 66, y: 50 },
  { x: 28, y: 63 },
  { x: 72, y: 63 },
  { x: 42, y: 78 },
  { x: 58, y: 78 },
];

const wallDefensePoints: Point[] = [
  { x: 42, y: 10 },
  { x: 50, y: 9 },
  { x: 58, y: 10 },
  { x: 33, y: 16 },
  { x: 67, y: 16 },
  { x: 25, y: 25 },
  { x: 75, y: 25 },
];

const gateZombiePoints: Point[] = [
  { x: 32, y: 50 },
  { x: 42, y: 44 },
  { x: 50, y: 47 },
  { x: 58, y: 44 },
  { x: 68, y: 50 },
  { x: 38, y: 62 },
  { x: 62, y: 62 },
];

const outsideZombiePoints: Point[] = [
  { x: 20, y: 45 },
  { x: 32, y: 35 },
  { x: 44, y: 30 },
  { x: 56, y: 30 },
  { x: 68, y: 35 },
  { x: 80, y: 45 },
  { x: 30, y: 62 },
  { x: 70, y: 62 },
  { x: 50, y: 70 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomNearby(point: Point, spread = 6): Point {
  return {
    x: clamp(point.x + (Math.random() - 0.5) * spread, 7, 93),
    y: clamp(point.y + (Math.random() - 0.5) * spread, 7, 93),
  };
}

function randomFrom(points: Point[]) {
  return points[Math.floor(Math.random() * points.length)];
}

function getSlotIcon(name?: string) {
  if (name === "Command Center") return "▣";
  if (name === "Garden" || name === "Permanent Garden") return "✦";
  if (name === "Watchtower") return "▲";
  if (name === "Generator") return "⚡";
  if (name === "Workshop") return "⚙";
  if (name === "Infirmary") return "✚";
  if (name === "Storage") return "▥";
  if (name === "Kitchen") return "◒";
  if (name === "Armory") return "◈";
  if (name === "Rain Collector") return "◇";
  if (name === "Training Yard") return "◎";
  if (name === "Radio Tower") return "◉";
  if (name === "Sleeping Quarters") return "▤";
  if (name === "Reinforced Gate") return "▰";
  if (name === "Radio Room") return "◉";
  return "+";
}

function roomOutput(slot: Slot, workerActive: boolean) {
  if (!slot.building) return "Empty build slot";
  const level = slot.buildingLevel ?? 1;
  if (slot.building.name === "Garden") return workerActive ? `+${(0.7 * level).toFixed(1)} food/tick` : `+${(0.2 * level).toFixed(1)} food/tick`;
  if (slot.building.name === "Permanent Garden") return `+${(0.25 * level).toFixed(2)} passive food/tick`;
  if (slot.building.name === "Workshop") return workerActive ? `+${(0.5 * level).toFixed(1)} materials/tick` : "Needs worker";
  if (slot.building.name === "Infirmary") return workerActive ? "Staffed healing room" : "Patient healing room";
  if (slot.building.name === "Watchtower") return workerActive ? `+${30 * level} defense` : `+${10 * level} defense`;
  if (slot.building.name === "Kitchen") return workerActive ? `+${(0.26 * level).toFixed(2)} food/tick` : `+${(0.08 * level).toFixed(2)} food/tick`;
  if (slot.building.name === "Armory") return workerActive ? `+${10 * level} defense + ammo support` : `+${6 * level} defense`;
  if (slot.building.name === "Training Yard") return workerActive ? `+${12 * level} defense` : `+${8 * level} defense`;
  if (slot.building.name === "Generator") return workerActive ? "Staffed power/fuel support" : "Power systems online";
  if (slot.building.name === "Rain Collector") return "+ food/medicine support";
  if (slot.building.name === "Radio Tower") return workerActive ? "Staffed mission planning" : "Mission planning antenna";
  if (slot.building.name === "Sleeping Quarters") return workerActive ? "+2.5 stamina/tick" : "Assign survivor to rest";
  if (slot.building.name === "Storage") return "+ storage capacity";
  return slot.building.effect;
}

function survivorColor(survivor: Survivor) {
  if (survivor.health <= 35) return "bg-red-500 border-red-200";
  if (survivor.stamina <= 20) return "bg-amber-500 border-amber-200";
  if (survivor.assignment === "On Mission") return "bg-sky-500 border-sky-200";
  if (survivor.assignment === "Guard Duty") return "bg-indigo-500 border-indigo-200";
  if (survivor.assignment === "Farming") return "bg-emerald-500 border-emerald-200";
  return "bg-green-500 border-green-200";
}

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function zombieCount(threat: string, wallIntegrity: number) {
  let count = 2;
  if (threat === "MEDIUM") count = 4;
  if (threat === "HIGH") count = 6;
  if (wallIntegrity <= 60) count += 2;
  if (wallIntegrity <= 25) count += 2;
  return Math.min(count, 10);
}

function getSurvivorGoal(survivor: Survivor, index: number, slots: Slot[], attackMode: boolean) {
  if (survivor.assignment === "On Mission") {
    return { point: randomNearby({ x: 50, y: 94 }, 4), state: "Away" };
  }

  if (attackMode) {
    if (survivor.assignment === "Medical" || survivor.health <= 40) {
      return { point: randomNearby(roomCenters.command, 8), state: "Sheltering" };
    }

    return {
      point: randomNearby(wallDefensePoints[index % wallDefensePoints.length], 5),
      state: survivor.assignment === "Guard Duty" ? "Defending" : "Rallying",
    };
  }

  const patientSlot = slots.find((slot) => slot.patientSurvivorId === survivor.id);
  if (patientSlot && roomCenters[patientSlot.id]) {
    return { point: randomNearby(roomCenters[patientSlot.id], 5), state: "Recovering" };
  }

  const assignedSlot = slots.find((slot) => slot.assignedSurvivorId === survivor.id);
  if (assignedSlot && roomCenters[assignedSlot.id]) {
    return {
      point: randomNearby(roomCenters[assignedSlot.id], 7),
      state: assignedSlot.building?.name === "Watchtower" ? "Patrolling" : "Working",
    };
  }

  if (survivor.stamina <= 25) {
    const sleepSlot = slots.find((slot) => slot.building?.name === "Sleeping Quarters");
    return { point: randomNearby(roomCenters[sleepSlot?.id || "command"] || roomCenters.command, 8), state: "Resting" };
  }

  if (survivor.assignment === "Farming") {
    const garden = slots.find((slot) => slot.building?.name.includes("Garden"));
    return { point: randomNearby(roomCenters[garden?.id || "perm-garden"] || randomFrom(hallwayPoints), 8), state: "Tending" };
  }

  if (survivor.assignment === "Guard Duty") {
    return { point: randomNearby(randomFrom(wallDefensePoints), 8), state: "Patrolling" };
  }

  return { point: randomNearby(randomFrom(hallwayPoints), 8), state: Math.random() > 0.5 ? "Roaming" : "Checking" };
}

function getZombieTarget(index: number, attackMode: boolean): Point {
  if (attackMode) {
    return randomNearby(gateZombiePoints[index % gateZombiePoints.length], 8);
  }

  return randomNearby(outsideZombiePoints[index % outsideZombiePoints.length], 10);
}

function RoomTile({
  slot,
  survivors,
  selected,
  onClick,
}: {
  slot: Slot;
  survivors: Survivor[];
  selected: boolean;
  onClick: () => void;
}) {
  const worker = survivors.find((survivor) => survivor.id === slot.assignedSurvivorId);
  const patient = survivors.find((survivor) => survivor.id === slot.patientSurvivorId);

  const workerActive =
    !!worker &&
    worker.assignment !== "On Mission" &&
    worker.stamina > 0 &&
    worker.health > 0;

  return (
    <button
      onClick={onClick}
      className={`relative min-h-[92px] rounded-2xl border p-2 text-left transition hover:scale-[1.01] active:scale-[0.99] sm:min-h-24 sm:p-3 ${
        selected
          ? "border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/50"
          : slot.building
          ? workerActive || slot.building.name === "Storage" || slot.type === "permanent"
            ? "border-green-800 bg-green-950/20"
            : "border-amber-800 bg-amber-950/20"
          : "border-dashed border-zinc-700 bg-zinc-900"
      } ${roomPositions[slot.id] || ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl sm:text-2xl">{getSlotIcon(slot.building?.name)}</span>
        <span className="rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase text-zinc-400">
          {slot.building ? `Lv${slot.buildingLevel ?? 1}` : slot.type}
        </span>
      </div>

      <h3 className="mt-1 text-xs font-bold leading-tight text-zinc-100 sm:mt-2 sm:text-sm">
        {slot.building?.name || slot.label}
      </h3>

      <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-zinc-500 sm:text-xs">
        {slot.building ? roomOutput(slot, workerActive) : "Click to build"}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {worker && (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold text-white ${survivorColor(worker)}`}
            title={`${worker.name} — STA ${Math.floor(worker.stamina)}%`}
          >
            {initials(worker.name)}
          </span>
        )}

        {patient && slot.building?.name === "Infirmary" && (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold text-white ${survivorColor(patient)}`}
            title={`${patient.name} — Patient`}
          >
            +
          </span>
        )}
      </div>
    </button>
  );
}

function formatCost(cost: Partial<ResourceMap>) {
  return Object.entries(cost)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([key, amount]) => `${amount} ${key}`)
    .join(", ");
}

export default function ShelterView({
  slots,
  survivors,
  threat,
  wallIntegrity,
  layout,
  resources,
  canUpgradeBase,
  baseUpgradeCost,
  onOpenBaseUpgrade,
  onUpgradeBuilding,
  onSelectSlot,
  onAssignSurvivor,
  onAssignPatient,
}: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Record<string, AgentMind>>({});
  const [zombiePositions, setZombiePositions] = useState<Record<string, Point>>({});

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const selectedWorker = survivors.find((s) => s.id === selectedSlot?.assignedSurvivorId);
  const selectedPatient = survivors.find((s) => s.id === selectedSlot?.patientSurvivorId);

  const attackMode = threat === "HIGH" || wallIntegrity <= 35;
  const zombies = useMemo(
    () => Array.from({ length: zombieCount(threat, wallIntegrity) }),
    [threat, wallIntegrity]
  );

  const workerActive =
    !!selectedWorker &&
    selectedWorker.assignment !== "On Mission" &&
    selectedWorker.stamina > 0 &&
    selectedWorker.health > 0;

  const canStaff =
    !!selectedSlot?.building &&
    selectedSlot.type !== "permanent" &&
    selectedSlot.building.name !== "Storage";

  const availableWorkers = survivors.filter((survivor) => {
    if (survivor.id === selectedSlot?.assignedSurvivorId) return true;
    if (survivor.assignment === "On Mission") return false;
    if (survivor.stamina <= 0) return false;
    return true;
  });

  const availablePatients = survivors.filter((survivor) => {
    if (survivor.id === selectedSlot?.patientSurvivorId) return true;
    return survivor.health < 100;
  });

  useEffect(() => {
    setAgents((prev) => {
      const next = { ...prev };

      survivors.forEach((survivor, index) => {
        if (!next[survivor.id]) {
          const goal = getSurvivorGoal(survivor, index, slots, attackMode);
          next[survivor.id] = {
            x: goal.point.x,
            y: goal.point.y,
            targetX: goal.point.x,
            targetY: goal.point.y,
            state: goal.state,
            wait: 0,
          };
        }
      });

      Object.keys(next).forEach((id) => {
        if (!survivors.some((survivor) => survivor.id === id)) delete next[id];
      });

      return next;
    });
  }, [survivors, slots, attackMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) => {
        const next: Record<string, AgentMind> = { ...prev };

        survivors.forEach((survivor, index) => {
          const current = next[survivor.id];
          const goal = getSurvivorGoal(survivor, index, slots, attackMode);
          const speedBoost = 1 + (layout.level - 1) * 0.12;
          const pace = attackMode ? 0.62 : 0.32 * speedBoost;

          if (!current) {
            next[survivor.id] = {
              x: goal.point.x,
              y: goal.point.y,
              targetX: goal.point.x,
              targetY: goal.point.y,
              state: goal.state,
              wait: 0,
            };
            return;
          }

          const distance = Math.hypot(current.targetX - current.x, current.targetY - current.y);
          const needsNewGoal = distance < 2 || current.wait <= 0 || attackMode;
          const target = needsNewGoal ? goal.point : { x: current.targetX, y: current.targetY };

          next[survivor.id] = {
            x: current.x + (target.x - current.x) * pace,
            y: current.y + (target.y - current.y) * pace,
            targetX: target.x,
            targetY: target.y,
            state: goal.state,
            wait: needsNewGoal ? 2 + Math.floor(Math.random() * 4) : current.wait - 1,
          };
        });

        return next;
      });

      setZombiePositions(() => {
        const next: Record<string, Point> = {};

        zombies.forEach((_, index) => {
          next[`zombie-${index}`] = getZombieTarget(index, attackMode);
        });

        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [survivors, slots, attackMode, zombies, layout.level]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Shelter Layout</h2>
          <p className="text-xs text-zinc-500 sm:text-sm">
            {layout.name} • Lv{layout.level} • AI survivors move between jobs, patrols, and attack positions.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-400">
          AI Mode: <span className="font-semibold text-amber-300">{attackMode ? "Defense Rally" : "Daily Routine"}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-2 sm:p-4">
        <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:mb-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Outer Wall</span>
            <span>{Math.floor(wallIntegrity)} / 100</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full ${
                wallIntegrity <= 25
                  ? "bg-red-500"
                  : wallIntegrity <= 60
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${wallIntegrity}%` }}
            />
          </div>

          <div className="relative mt-3 min-h-16 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70 sm:min-h-20">
            {zombies.map((_, index) => {
              const position =
                zombiePositions[`zombie-${index}`] ||
                (attackMode
                  ? gateZombiePoints[index % gateZombiePoints.length]
                  : outsideZombiePoints[index % outsideZombiePoints.length]);

              return (
                <span
                  key={index}
                  className={`absolute h-4 w-4 rounded-full border transition-all duration-[850ms] ease-linear ${
                    attackMode
                      ? "border-red-300 bg-red-600 shadow-[0_0_14px_rgba(220,38,38,0.65)]"
                      : "border-zinc-500 bg-zinc-600"
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  title="Zombie"
                />
              );
            })}

            <p className="absolute left-3 top-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
              Gate Zone
            </p>
          </div>
        </div>

        <div className="relative overflow-x-auto rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_center,_rgba(63,63,70,0.35),_rgba(9,9,11,0.95))] p-2 sm:p-4">
          <div className="relative grid min-h-[520px] min-w-[560px] grid-cols-3 grid-rows-4 gap-3 sm:min-h-[620px] sm:min-w-0 sm:gap-6">
            {slots.map((slot) => (
              <RoomTile
                key={slot.id}
                slot={slot}
                survivors={survivors}
                selected={selectedSlot?.id === slot.id}
                onClick={() => {
                  setSelectedSlotId(slot.id);
                  if (!slot.building) onSelectSlot(slot);
                }}
              />
            ))}

            {!slots.some((slot) => slot.id === "perm-gate") && (
              <div className="col-start-2 row-start-1 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Gate
              </div>
            )}

            {survivors.map((survivor) => {
              const agent = agents[survivor.id];
              const position = agent || { x: 50, y: 50, state: "Loading" };

              return (
                <div
                  key={survivor.id}
                  className={`absolute z-50 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow-xl transition-all duration-[850ms] ease-linear sm:h-8 sm:w-8 sm:text-xs ${survivorColor(
                    survivor
                  )}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title={`${survivor.name} — ${position.state} — HP ${Math.floor(
                    survivor.health
                  )}% / STA ${Math.floor(survivor.stamina)}%`}
                >
                  {initials(survivor.name)}
                  <span className="absolute -bottom-5 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300 opacity-0 transition group-hover:opacity-100">
                    {position.state}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh_-_1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-zinc-500">Selected Room</p>
                <h3 className="text-xl font-bold">
                  {selectedSlot.building?.name || selectedSlot.label}
                </h3>
              </div>

              <button
                onClick={() => setSelectedSlotId(null)}
                className="min-h-10 rounded-lg bg-zinc-800 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs uppercase text-zinc-500">Status</p>
                <p
                  className={
                    workerActive || selectedSlot.type === "permanent"
                      ? "font-semibold text-green-300"
                      : "font-semibold text-amber-300"
                  }
                >
                  {roomOutput(selectedSlot, workerActive)}
                </p>

                {selectedSlot.building && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedSlot.building.effect}
                  </p>
                )}
              </div>

              {!selectedSlot.building && (
                <button
                  onClick={() => {
                    onSelectSlot(selectedSlot);
                    setSelectedSlotId(null);
                  }}
                  className="w-full rounded-xl border border-amber-700 bg-amber-950 px-3 py-3 font-semibold text-amber-200"
                >
                  Build Here
                </button>
              )}

              {canStaff && (
                <div>
                  <label className="text-xs uppercase text-zinc-500">
                    {selectedSlot.building?.name === "Infirmary"
                      ? "Medical Worker"
                      : "Staff"}
                  </label>

                  <select
                    value={selectedSlot.assignedSurvivorId || ""}
                    onChange={(event) =>
                      onAssignSurvivor(
                        selectedSlot.id,
                        event.target.value || null
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-3 text-sm text-zinc-100 outline-none"
                  >
                    <option value="">Unstaffed</option>

                    {availableWorkers.map((survivor) => (
                      <option key={survivor.id} value={survivor.id}>
                        {survivor.name} — STA {Math.floor(survivor.stamina)}% /
                        HP {Math.floor(survivor.health)}%
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSlot.building?.name === "Infirmary" && (
                <div>
                  <label className="text-xs uppercase text-zinc-500">
                    Patient
                  </label>

                  <select
                    value={selectedSlot.patientSurvivorId || ""}
                    onChange={(event) =>
                      onAssignPatient(
                        selectedSlot.id,
                        event.target.value || null
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-3 text-sm text-zinc-100 outline-none"
                  >
                    <option value="">No patient</option>

                    {availablePatients.map((survivor) => (
                      <option key={survivor.id} value={survivor.id}>
                        {survivor.name} — HP {Math.floor(survivor.health)}%
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-zinc-500">
                    Medicine: +1 health/tick. Staffed: +2 health/tick. No
                    medicine: +0.1 health/tick.
                  </p>
                </div>
              )}

              {selectedWorker && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs uppercase text-zinc-500">Worker</p>
                  <p className="font-semibold">{selectedWorker.name}</p>
                  <p className="text-xs text-zinc-500">
                    HP {Math.floor(selectedWorker.health)}% • STA{" "}
                    {Math.floor(selectedWorker.stamina)}%
                  </p>
                </div>
              )}

              {selectedPatient && (
                <div className="rounded-xl border border-red-900 bg-red-950/20 p-3">
                  <p className="text-xs uppercase text-red-300">Patient</p>
                  <p className="font-semibold">{selectedPatient.name}</p>
                  <p className="text-xs text-red-200">
                    HP {Math.floor(selectedPatient.health)}%
                  </p>
                </div>
              )}

              {selectedSlot.building && (() => {
                const upgradeCost = getBuildingUpgradeCost(selectedSlot);
                const canUpgradeBuilding = canAffordCost(resources, upgradeCost);

                return (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-zinc-500">Building Upgrade</p>
                        <p className="text-sm font-semibold text-zinc-200">
                          Level {selectedSlot.buildingLevel ?? 1} / 3
                        </p>
                      </div>

                      {upgradeCost ? (
                        <button
                          onClick={() => onUpgradeBuilding(selectedSlot.id)}
                          disabled={!canUpgradeBuilding}
                          className={`min-h-10 rounded-lg px-3 py-2 text-xs font-bold ${
                            canUpgradeBuilding
                              ? "bg-amber-500 text-black"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          Upgrade
                        </button>
                      ) : (
                        <span className="rounded-lg bg-green-950 px-3 py-2 text-xs font-bold text-green-300">Max</span>
                      )}
                    </div>

                    {upgradeCost && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Cost: {formatCost(upgradeCost)}
                      </p>
                    )}
                  </div>
                );
              })()}

              {selectedSlot.id === "command" && layout.level < 2 && (
                <div className="rounded-xl border border-amber-900 bg-amber-950/20 p-3">
                  <p className="text-xs uppercase text-amber-300">Command Center</p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Upgrade the main base here after reaching 4 survivors. This opens a Level 2 path choice with different permanent bonuses.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Cost: {formatCost(baseUpgradeCost)}
                  </p>
                  <button
                    onClick={onOpenBaseUpgrade}
                    disabled={!canUpgradeBase}
                    className={`mt-3 min-h-12 w-full rounded-xl px-3 py-3 text-sm font-bold ${
                      canUpgradeBase
                        ? "bg-amber-500 text-black"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    Choose Base Path
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
