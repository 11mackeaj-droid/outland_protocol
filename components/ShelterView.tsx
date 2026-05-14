"use client";

import { useEffect, useMemo, useState } from "react";
import type { Slot, Survivor } from "../lib/types";

type Props = {
  slots: Slot[];
  survivors: Survivor[];
  threat: string;
  wallIntegrity: number;
  onSelectSlot: (slot: Slot) => void;
  onAssignSurvivor: (slotId: string, survivorId: string | null) => void;
  onAssignPatient: (slotId: string, survivorId: string | null) => void;
};

type Point = {
  x: number;
  y: number;
};

const roomPositions: Record<string, string> = {
  command: "col-start-2 row-start-2",
  "ext-1": "col-start-1 row-start-1",
  "ext-2": "col-start-3 row-start-1",
  "int-1": "col-start-1 row-start-3",
  "int-2": "col-start-3 row-start-3",
};

const roomCenters: Record<string, Point> = {
  command: { x: 50, y: 50 },
  "ext-1": { x: 20, y: 25 },
  "ext-2": { x: 80, y: 25 },
  "int-1": { x: 20, y: 76 },
  "int-2": { x: 80, y: 76 },
};

const hallwayPoints: Point[] = [
  { x: 50, y: 34 },
  { x: 50, y: 44 },
  { x: 50, y: 58 },
  { x: 50, y: 68 },
  { x: 34, y: 50 },
  { x: 66, y: 50 },
  { x: 28, y: 63 },
  { x: 72, y: 63 },
];

const wallDefensePoints: Point[] = [
  { x: 42, y: 13 },
  { x: 50, y: 11 },
  { x: 58, y: 13 },
  { x: 36, y: 17 },
  { x: 64, y: 17 },
  { x: 50, y: 18 },
];

const gateZombiePoints: Point[] = [
  { x: 34, y: 50 },
  { x: 42, y: 44 },
  { x: 50, y: 47 },
  { x: 58, y: 44 },
  { x: 66, y: 50 },
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

const pathLevels = {
  main: 1,
  left: 1,
  right: 1,
  lower: 1,
};

function randomNearby(point: Point, spread = 6): Point {
  return {
    x: Math.max(8, Math.min(92, point.x + (Math.random() - 0.5) * spread)),
    y: Math.max(8, Math.min(92, point.y + (Math.random() - 0.5) * spread)),
  };
}

function randomFrom(points: Point[]) {
  return points[Math.floor(Math.random() * points.length)];
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
  return "+";
}

function roomOutput(slot: Slot, workerActive: boolean) {
  if (!slot.building) return "Empty build slot";
  if (slot.building.name === "Garden") return workerActive ? "+0.7 food/tick" : "+0.2 food/tick";
  if (slot.building.name === "Workshop") return workerActive ? "+0.5 materials/tick" : "Needs worker";
  if (slot.building.name === "Infirmary") return workerActive ? "Staffed healing room" : "Patient healing room";
  if (slot.building.name === "Watchtower") return workerActive ? "+30 defense" : "+10 defense";
  if (slot.building.name === "Sleeping Quarters") return workerActive ? "+2.5 stamina/tick" : "Assign survivor to rest";
  if (slot.building.name === "Storage") return "+ storage capacity";
  return slot.building.effect;
}

function survivorColor(survivor: Survivor) {
  if (survivor.health <= 35) return "bg-red-500 border-red-200";
  if (survivor.stamina <= 20) return "bg-amber-500 border-amber-200";
  if (survivor.assignment === "On Mission") return "bg-sky-500 border-sky-200";
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

function getSurvivorTarget(
  survivor: Survivor,
  index: number,
  slots: Slot[],
  attackMode: boolean
): Point {
  if (survivor.assignment === "On Mission") {
    return randomNearby({ x: 50, y: 91 }, 4);
  }

  if (attackMode) {
    return randomNearby(wallDefensePoints[index % wallDefensePoints.length], 5);
  }

  const patientSlot = slots.find((slot) => slot.patientSurvivorId === survivor.id);
  if (patientSlot && roomCenters[patientSlot.id]) {
    return randomNearby(roomCenters[patientSlot.id], 5);
  }

  const assignedSlot = slots.find((slot) => slot.assignedSurvivorId === survivor.id);
  if (assignedSlot && roomCenters[assignedSlot.id]) {
    return randomNearby(roomCenters[assignedSlot.id], 7);
  }

  return randomNearby(randomFrom(hallwayPoints), 8);
}

function getZombieTarget(index: number, attackMode: boolean): Point {
  if (attackMode) {
    return randomNearby(gateZombiePoints[index % gateZombiePoints.length], 8);
  }

  return randomNearby(outsideZombiePoints[index % outsideZombiePoints.length], 10);
}

function PathSegment({
  label,
  level,
  className,
}: {
  label: string;
  level: number;
  className: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full border border-zinc-700 bg-zinc-900/40 shadow-inner ${className}`}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-700 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label} Lv{level}
      </div>
    </div>
  );
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
      className={`relative min-h-28 rounded-2xl border p-3 text-left transition hover:scale-[1.01] ${
        selected
          ? "border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/50"
          : slot.building
          ? workerActive || slot.building.name === "Storage"
            ? "border-green-800 bg-green-950/20"
            : "border-amber-800 bg-amber-950/20"
          : "border-dashed border-zinc-700 bg-zinc-900"
      } ${roomPositions[slot.id] || ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">{getSlotIcon(slot.building?.name)}</span>
        <span className="rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase text-zinc-400">
          {slot.type}
        </span>
      </div>

      <h3 className="mt-2 text-sm font-bold text-zinc-100">
        {slot.building?.name || slot.label}
      </h3>

      <p className="mt-1 text-xs text-zinc-500">
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

export default function ShelterView({
  slots,
  survivors,
  threat,
  wallIntegrity,
  onSelectSlot,
  onAssignSurvivor,
  onAssignPatient,
}: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [survivorPositions, setSurvivorPositions] = useState<Record<string, Point>>({});
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
    setSurvivorPositions((prev) => {
      const next = { ...prev };

      survivors.forEach((survivor, index) => {
        if (!next[survivor.id]) {
          next[survivor.id] = getSurvivorTarget(survivor, index, slots, attackMode);
        }
      });

      return next;
    });
  }, [survivors, slots, attackMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSurvivorPositions(() => {
        const next: Record<string, Point> = {};

        survivors.forEach((survivor, index) => {
          next[survivor.id] = getSurvivorTarget(
            survivor,
            index,
            slots,
            attackMode
          );
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
    }, 2600);

    return () => clearInterval(interval);
  }, [survivors, slots, attackMode, zombies]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Shelter Layout</h2>
        <p className="text-sm text-zinc-500">
Survivors move between rooms, halls, and the wall. Tap any room to build or staff it.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3 sm:p-4">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
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

          <div className="relative mt-3 min-h-20 rounded-lg border border-zinc-800 bg-zinc-900/70">
            {zombies.map((_, index) => {
              const position =
                zombiePositions[`zombie-${index}`] ||
                getZombieTarget(index, attackMode);

              return (
                <span
                  key={index}
                  className={`absolute h-4 w-4 rounded-full border transition-all duration-[2400ms] ease-in-out ${
                    attackMode
                      ? "border-red-300 bg-red-600"
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

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_center,_rgba(63,63,70,0.35),_rgba(9,9,11,0.95))] p-3 sm:p-4">
          <div className="relative min-w-[640px]">
          <PathSegment
            label="Main Path"
            level={pathLevels.main}
            className="left-1/2 top-4 h-[calc(100%-2rem)] w-14 -translate-x-1/2"
          />
          <PathSegment
            label="Cross Path"
            level={pathLevels.left}
            className="left-4 right-4 top-1/2 h-14 -translate-y-1/2"
          />
          <PathSegment
            label="Lower Path"
            level={pathLevels.lower}
            className="left-[18%] right-[18%] bottom-[18%] h-12"
          />

          <div className="relative grid min-h-[520px] grid-cols-3 grid-rows-3 gap-5 sm:min-h-[540px] sm:gap-6">
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

            <div className="col-start-2 row-start-1 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-[0.25em] text-zinc-500">
              Gate
            </div>

            <div className="col-start-2 row-start-3 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-[0.25em] text-zinc-500">
              Shelter Core
            </div>

            {survivors.map((survivor, index) => {
              const position =
                survivorPositions[survivor.id] ||
                getSurvivorTarget(survivor, index, slots, attackMode);

              return (
                <div
                  key={survivor.id}
                  className={`absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-xl transition-all duration-[2400ms] ease-in-out ${survivorColor(
                    survivor
                  )}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  title={`${survivor.name} — HP ${Math.floor(
                    survivor.health
                  )}% / STA ${Math.floor(survivor.stamina)}%`}
                >
                  {initials(survivor.name)}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center sm:p-4">
          <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-zinc-500">Selected Room</p>
                <h3 className="text-xl font-bold">
                  {selectedSlot.building?.name || selectedSlot.label}
                </h3>
              </div>

              <button
                onClick={() => setSelectedSlotId(null)}
                className="rounded-lg bg-zinc-800 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs uppercase text-zinc-500">Status</p>
                <p
                  className={
                    workerActive
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

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs uppercase text-zinc-500">Mobile Tip</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Swipe the shelter layout sideways if the full base is wider than your screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}