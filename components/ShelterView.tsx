"use client";

import { useEffect, useMemo, useState } from "react";
import { basePathInfo } from "../lib/gameData";
import { canAfford, formatCost, getBaseUpgradeCost, getBuildingUpgradeCost } from "../lib/gameLogic";
import type { BasePath, ResourceMap, Slot, Survivor } from "../lib/types";

type Props = {
  slots: Slot[];
  survivors: Survivor[];
  resources: ResourceMap;
  baseLevel: number;
  basePath: BasePath;
  threat: string;
  wallIntegrity: number;
  onSelectSlot: (slot: Slot) => void;
  onAssignSurvivor: (slotId: string, survivorId: string | null) => void;
  onAssignPatient: (slotId: string, survivorId: string | null) => void;
  onUpgradeBuilding: (slotId: string) => void;
  onUpgradeBase: (path: BasePath) => void;
};

type Point = { x: number; y: number };

const roomPositions: Record<string, string> = {
  command: "col-start-2 row-start-2",
  "ext-1": "col-start-1 row-start-1",
  "ext-2": "col-start-3 row-start-1",
  "ext-3": "col-start-2 row-start-1",
  "int-1": "col-start-1 row-start-3",
  "int-2": "col-start-3 row-start-3",
  "int-3": "col-start-2 row-start-3",
};

const roomCenters: Record<string, Point> = {
  command: { x: 50, y: 50 },
  "ext-1": { x: 18, y: 20 },
  "ext-2": { x: 82, y: 20 },
  "ext-3": { x: 50, y: 20 },
  "int-1": { x: 18, y: 80 },
  "int-2": { x: 82, y: 80 },
  "int-3": { x: 50, y: 80 },
};

const hallwayPoints: Point[] = [
  { x: 50, y: 34 }, { x: 50, y: 44 }, { x: 50, y: 58 }, { x: 50, y: 68 }, { x: 34, y: 50 }, { x: 66, y: 50 },
];
const wallDefensePoints: Point[] = [{ x: 40, y: 10 }, { x: 50, y: 10 }, { x: 60, y: 10 }, { x: 35, y: 18 }, { x: 65, y: 18 }];
const zombiePoints: Point[] = [{ x: 20, y: 45 }, { x: 32, y: 35 }, { x: 44, y: 28 }, { x: 56, y: 28 }, { x: 68, y: 35 }, { x: 80, y: 45 }, { x: 38, y: 62 }, { x: 62, y: 62 }];

function randomNearby(point: Point, spread = 6): Point {
  return { x: Math.max(8, Math.min(92, point.x + (Math.random() - 0.5) * spread)), y: Math.max(8, Math.min(92, point.y + (Math.random() - 0.5) * spread)) };
}
function randomFrom(points: Point[]) { return points[Math.floor(Math.random() * points.length)]; }
function initials(name: string) { return name.slice(0, 1).toUpperCase(); }
function survivorColor(survivor: Survivor) {
  if (survivor.health <= 35) return "bg-red-500 border-red-200";
  if (survivor.stamina <= 20) return "bg-amber-500 border-amber-200";
  if (survivor.assignment === "On Mission") return "bg-sky-500 border-sky-200";
  return "bg-green-500 border-green-200";
}
function getSlotIcon(name?: string) {
  if (name === "Command Center") return "▣";
  if (name === "Garden") return "✦";
  if (name === "Watchtower") return "▲";
  if (name === "Generator") return "⚡";
  if (name === "Workshop") return "⚙";
  if (name === "Infirmary") return "✚";
  if (name === "Storage") return "▥";
  if (name === "Sleeping Quarters") return "▤";
  if (name === "Radio Room") return "◉";
  if (name === "Water Collector") return "◌";
  if (name === "Training Yard") return "◆";
  return "+";
}
function roomOutput(slot: Slot, workerActive: boolean) {
  if (!slot.building) return "Empty build slot";
  const level = slot.building.level;
  if (slot.building.name === "Garden") return workerActive ? `Lv${level} food production staffed` : `Lv${level} passive food`;
  if (slot.building.name === "Workshop") return workerActive ? `Lv${level} materials production` : "Needs engineer";
  if (slot.building.name === "Infirmary") return workerActive ? `Lv${level} staffed healing` : "Patient healing room";
  if (slot.building.name === "Watchtower") return workerActive ? `Lv${level} staffed defense` : `Lv${level} passive defense`;
  if (slot.building.name === "Sleeping Quarters") return workerActive ? `Lv${level} rest recovery` : "Assign survivor to rest";
  return `Lv${level} • ${slot.building.effect}`;
}
function zombieCount(threat: string, wallIntegrity: number) {
  let count = threat === "HIGH" ? 6 : threat === "MEDIUM" ? 4 : 2;
  if (wallIntegrity <= 60) count += 2;
  if (wallIntegrity <= 25) count += 2;
  return Math.min(count, 10);
}
function getSurvivorTarget(survivor: Survivor, index: number, slots: Slot[], attackMode: boolean): Point {
  if (survivor.assignment === "On Mission") return randomNearby({ x: 50, y: 93 }, 3);
  if (attackMode) return randomNearby(wallDefensePoints[index % wallDefensePoints.length], 5);
  const patientSlot = slots.find((slot) => slot.patientSurvivorId === survivor.id);
  if (patientSlot && roomCenters[patientSlot.id]) return randomNearby(roomCenters[patientSlot.id], 6);
  const assignedSlot = slots.find((slot) => slot.assignedSurvivorId === survivor.id);
  if (assignedSlot && roomCenters[assignedSlot.id]) return randomNearby(roomCenters[assignedSlot.id], 7);
  return randomNearby(randomFrom(hallwayPoints), 9);
}
function getZombieTarget(index: number, attackMode: boolean): Point {
  const target = attackMode ? { x: 50 + (index - 3) * 4, y: 18 + (index % 2) * 7 } : zombiePoints[index % zombiePoints.length];
  return randomNearby(target, attackMode ? 6 : 10);
}

function RoomTile({ slot, survivors, selected, onClick }: { slot: Slot; survivors: Survivor[]; selected: boolean; onClick: () => void }) {
  const worker = survivors.find((survivor) => survivor.id === slot.assignedSurvivorId);
  const patient = survivors.find((survivor) => survivor.id === slot.patientSurvivorId);
  const workerActive = !!worker && worker.assignment !== "On Mission" && worker.stamina > 0 && worker.health > 0;
  return (
    <button onClick={onClick} className={`relative min-h-28 rounded-2xl border p-3 text-left transition ${selected ? "border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/50" : slot.building ? "border-green-800 bg-green-950/20" : "border-dashed border-zinc-700 bg-zinc-900"} ${roomPositions[slot.id] || ""}`}>
      <div className="flex items-start justify-between gap-2"><span className="text-2xl">{getSlotIcon(slot.building?.name)}</span><span className="rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase text-zinc-400">{slot.type}</span></div>
      <h3 className="mt-2 text-sm font-bold text-zinc-100">{slot.building?.name || slot.label}</h3>
      <p className="mt-1 text-xs text-zinc-500">{slot.building ? roomOutput(slot, workerActive) : "Tap to build"}</p>
      <div className="mt-3 flex flex-wrap gap-1">{worker && <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold text-white ${survivorColor(worker)}`}>{initials(worker.name)}</span>}{patient && slot.building?.name === "Infirmary" && <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold text-white ${survivorColor(patient)}`}>+</span>}</div>
    </button>
  );
}

export default function ShelterView({ slots, survivors, resources, baseLevel, basePath, threat, wallIntegrity, onSelectSlot, onAssignSurvivor, onAssignPatient, onUpgradeBuilding, onUpgradeBase }: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [survivorPositions, setSurvivorPositions] = useState<Record<string, Point>>({});
  const [zombiePositions, setZombiePositions] = useState<Record<string, Point>>({});
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const selectedWorker = survivors.find((s) => s.id === selectedSlot?.assignedSurvivorId);
  const selectedPatient = survivors.find((s) => s.id === selectedSlot?.patientSurvivorId);
  const attackMode = threat === "HIGH" || wallIntegrity <= 35;
  const zombies = useMemo(() => Array.from({ length: zombieCount(threat, wallIntegrity) }), [threat, wallIntegrity]);
  const workerActive = !!selectedWorker && selectedWorker.assignment !== "On Mission" && selectedWorker.stamina > 0 && selectedWorker.health > 0;
  const canStaff = !!selectedSlot?.building && selectedSlot.type !== "permanent" && selectedSlot.building.name !== "Storage";
  const availableWorkers = survivors.filter((survivor) => survivor.id === selectedSlot?.assignedSurvivorId || (survivor.assignment !== "On Mission" && survivor.stamina > 0 && survivor.health > 0));
  const availablePatients = survivors.filter((survivor) => survivor.id === selectedSlot?.patientSurvivorId || survivor.health < 100);
  const baseUpgradeCost = getBaseUpgradeCost(baseLevel);
  const canUpgradeBase = baseLevel < 5 && survivors.length >= 4 && canAfford(resources, baseUpgradeCost);
  const buildingUpgradeCost = selectedSlot?.building ? getBuildingUpgradeCost(selectedSlot.building) : null;
  const canUpgradeBuilding = !!selectedSlot?.building && selectedSlot.type !== "permanent" && selectedSlot.building.level < selectedSlot.building.maxLevel && !!buildingUpgradeCost && canAfford(resources, buildingUpgradeCost);

  useEffect(() => {
    const interval = setInterval(() => {
      setSurvivorPositions(() => {
        const next: Record<string, Point> = {};
        survivors.forEach((survivor, index) => { next[survivor.id] = getSurvivorTarget(survivor, index, slots, attackMode); });
        return next;
      });
      setZombiePositions(() => {
        const next: Record<string, Point> = {};
        zombies.forEach((_, index) => { next[`zombie-${index}`] = getZombieTarget(index, attackMode); });
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [survivors, slots, attackMode, zombies]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="mb-4"><h2 className="text-xl font-bold">Shelter Layout</h2><p className="text-sm text-zinc-500">Tap rooms to build, upgrade, or staff. Survivors stay inside the shelter map.</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3 sm:p-4">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500"><span>Outer Wall</span><span>{Math.floor(wallIntegrity)} / 100</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-800"><div className={`h-full ${wallIntegrity <= 25 ? "bg-red-500" : wallIntegrity <= 60 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${wallIntegrity}%` }} /></div>
          <div className="relative mt-3 min-h-20 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70">
            {zombies.map((_, index) => { const position = zombiePositions[`zombie-${index}`] || getZombieTarget(index, attackMode); return <span key={index} className={`absolute h-4 w-4 rounded-full border transition-all duration-[2200ms] ease-in-out ${attackMode ? "border-red-300 bg-red-600" : "border-zinc-500 bg-zinc-600"}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} />; })}
            <p className="absolute left-3 top-2 text-xs uppercase tracking-[0.25em] text-zinc-500">Gate Zone</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_center,_rgba(63,63,70,0.35),_rgba(9,9,11,0.95))] p-3 sm:p-4">
          <div className="relative min-w-[700px]">
            <div className="pointer-events-none absolute left-1/2 top-4 h-[calc(100%-2rem)] w-14 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/40" />
            <div className="pointer-events-none absolute left-4 right-4 top-1/2 h-14 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900/40" />
            <div className="relative grid min-h-[560px] grid-cols-3 grid-rows-3 gap-5 sm:gap-6">
              {slots.map((slot) => <RoomTile key={slot.id} slot={slot} survivors={survivors} selected={selectedSlot?.id === slot.id} onClick={() => { setSelectedSlotId(slot.id); if (!slot.building) onSelectSlot(slot); }} />)}
              {survivors.map((survivor, index) => { const position = survivorPositions[survivor.id] || getSurvivorTarget(survivor, index, slots, attackMode); return <div key={survivor.id} className={`absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-xl transition-all duration-[2200ms] ease-in-out ${survivorColor(survivor)}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}>{initials(survivor.name)}</div>; })}
            </div>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center sm:p-4">
          <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs uppercase text-zinc-500">Selected Room</p><h3 className="text-xl font-bold">{selectedSlot.building?.name || selectedSlot.label}</h3></div><button onClick={() => setSelectedSlotId(null)} className="min-h-10 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold">Close</button></div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Status</p><p className={workerActive ? "font-semibold text-green-300" : "font-semibold text-amber-300"}>{roomOutput(selectedSlot, workerActive)}</p>{selectedSlot.building && <p className="mt-1 text-xs text-zinc-500">{selectedSlot.building.effect}</p>}</div>
              {!selectedSlot.building && <button onClick={() => { onSelectSlot(selectedSlot); setSelectedSlotId(null); }} className="w-full rounded-xl border border-amber-700 bg-amber-950 px-3 py-3 font-semibold text-amber-200">Build Here</button>}
              {selectedSlot.type === "permanent" && (
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <div><p className="text-xs uppercase text-zinc-500">Command Path</p><p className="font-semibold text-amber-300">{basePathInfo[basePath].label}</p><p className="text-xs text-zinc-500">{basePathInfo[basePath].bonus}</p></div>
                  <p className="text-xs text-zinc-400">Next base upgrade cost: {formatCost(baseUpgradeCost)}</p>
                  <div className="grid gap-2">
                    {(["farmstead", "fortified", "industrial"] as BasePath[]).map((path) => <button key={path} disabled={!canUpgradeBase} onClick={() => onUpgradeBase(path)} className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-left disabled:opacity-40"><p className="font-bold">Upgrade to Level {baseLevel + 1}: {basePathInfo[path].label}</p><p className="text-xs text-zinc-400">{basePathInfo[path].bonus}</p></button>)}
                  </div>
                  {survivors.length < 4 && <p className="text-xs text-red-300">Need 4 survivors to upgrade the main base.</p>}
                </div>
              )}
              {canStaff && <div><label className="text-xs uppercase text-zinc-500">{selectedSlot.building?.name === "Infirmary" ? "Medical Worker" : "Staff"}</label><select value={selectedSlot.assignedSurvivorId || ""} onChange={(e) => onAssignSurvivor(selectedSlot.id, e.target.value || null)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-3 text-base text-zinc-100"><option value="">No staff</option>{availableWorkers.map((survivor) => <option key={survivor.id} value={survivor.id}>{survivor.name} — {survivor.specialty}</option>)}</select></div>}
              {selectedSlot.building?.name === "Infirmary" && <div><label className="text-xs uppercase text-zinc-500">Patient</label><select value={selectedSlot.patientSurvivorId || ""} onChange={(e) => onAssignPatient(selectedSlot.id, e.target.value || null)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-3 text-base text-zinc-100"><option value="">No patient</option>{availablePatients.map((survivor) => <option key={survivor.id} value={survivor.id}>{survivor.name} — HP {Math.floor(survivor.health)}%</option>)}</select></div>}
              {selectedSlot.building && selectedSlot.type !== "permanent" && <button disabled={!canUpgradeBuilding} onClick={() => onUpgradeBuilding(selectedSlot.id)} className="w-full rounded-xl border border-amber-700 bg-amber-950 px-3 py-3 font-semibold text-amber-200 disabled:opacity-40">Upgrade Building {selectedSlot.building.level < selectedSlot.building.maxLevel && buildingUpgradeCost ? `— ${formatCost(buildingUpgradeCost)}` : "— Max Level"}</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
