"use client";

import { useEffect, useState } from "react";

import BaseStatus from "../components/BaseStatus";
import BottomNav, { type MainTab } from "../components/BottomNav";
import BuildModal from "../components/BuildModal";
import EventLog from "../components/EventLog";
import EventToasts, {
  type ToastMessage,
  type ToastType,
} from "../components/EventToasts";
import MapView from "../components/MapView";
import ShelterView from "../components/ShelterView";
import SideDrawer from "../components/SideDrawer";
import SurvivorPanel from "../components/SurvivorPanel";
import TopBar from "../components/TopBar";

import {
  baseLayouts,
  baseUpgradeCost,
  initialSlots,
  initialSurvivors,
  scavengeLocations,
} from "../lib/gameData";

import {
  calculateDefense,
  calculateRoomProduction,
  canAffordBuilding,
  canAffordCost,
  clampResources,
  countAssignment,
  formatGameTime,
  getBuildingUpgradeCost,
  getStorageCaps,
  getThreat,
  payBuildingCost,
  payResourceCost,
  resolveNightAttack,
} from "../lib/gameLogic";

import type {
  Assignment,
  Building,
  MapMission,
  Mission,
  ResourceKey,
  ResourceMap,
  ScavengeLocation,
  Slot,
} from "../lib/types";

function generateMapMissions(currentMinute: number): MapMission[] {
  const positions = [
    { x: 18, y: 68, icon: "⌂" },
    { x: 30, y: 30, icon: "⚙" },
    { x: 74, y: 36, icon: "⛽" },
    { x: 70, y: 76, icon: "✚" },
    { x: 50, y: 14, icon: "▲" },
    { x: 84, y: 52, icon: "▣" },
  ];

  const shuffled = [...scavengeLocations].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 6).map((location, index) => ({
    ...location,
    id: `${location.id}-${currentMinute}-${index}`,
    mapX: positions[index].x,
    mapY: positions[index].y,
    icon: positions[index].icon,
    expiresAtMinute: currentMinute + 720,
  }));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<MainTab>("shelter");
  const [survivorDrawerOpen, setSurvivorDrawerOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  const [baseLayoutId, setBaseLayoutId] = useState("starter");
  const activeLayout =
    baseLayouts.find((layout) => layout.id === baseLayoutId) || baseLayouts[0];
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [survivors, setSurvivors] = useState(initialSurvivors);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [minutes, setMinutes] = useState(8 * 60);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [lastAttackDay, setLastAttackDay] = useState(0);
  const [wallIntegrity, setWallIntegrity] = useState(100);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [availableMissions, setAvailableMissions] = useState<MapMission[]>([]);

  const [resources, setResources] = useState<ResourceMap>({
    food: 35,
    materials: 40,
    ammo: 12,
    fuel: 8,
    medicine: 6,
  });

  const [log, setLog] = useState<string[]>([
    "08:00 — Outland Protocol activated.",
    "08:00 — Shelter systems running on emergency reserves.",
  ]);

  useEffect(() => {
    setAvailableMissions(generateMapMissions(8 * 60));
  }, []);

  const { day, hour, time } = formatGameTime(minutes);
  const threat = getThreat(hour);

  const roomProduction = calculateRoomProduction(slots, survivors, activeLayout);
  const defense = calculateDefense(survivors, slots, activeLayout);
  const storageCaps = getStorageCaps(slots, activeLayout);

  const farmingCount = slots.filter(
    (slot) => slot.building?.name === "Garden" && slot.assignedSurvivorId
  ).length;

  const guardCount = slots.filter(
    (slot) => slot.building?.name === "Watchtower" && slot.assignedSurvivorId
  ).length;

  const scavengingCount = countAssignment(survivors, "Scavenging");

  const medicalCount = slots.filter(
    (slot) => slot.building?.name === "Infirmary" && slot.assignedSurvivorId
  ).length;

  const engineeringCount = slots.filter(
    (slot) => slot.building?.name === "Workshop" && slot.assignedSurvivorId
  ).length;

  const resourceRates: ResourceMap = {
    food: roomProduction.food - survivors.length * (activeLayout.id === "farmstead" ? 0.12 : 0.15),
    materials: roomProduction.materials,
    ammo: roomProduction.ammo,
    fuel: roomProduction.fuel,
    medicine: roomProduction.medicine,
  };

  function pushToast(message: string, type: ToastType = "info") {
    const id = `${Date.now()}-${Math.random()}`;

    setToasts((prev) => [{ id, message, type }, ...prev].slice(0, 5));

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  }

  function addEvent(message: string, type: ToastType = "info") {
    setLog((prev) => [message, ...prev]);
    pushToast(message, type);
  }

  function destroyRandomBuildingAfterBreach(eventTime: string) {
    const destroyableSlots = slots.filter(
      (slot) => slot.type !== "permanent" && slot.building
    );

    if (destroyableSlots.length === 0) {
      addEvent(
        `${eventTime} — The wall was breached, but there were no facilities left to destroy.`,
        "danger"
      );
      return;
    }

    const destroyedSlot =
      destroyableSlots[Math.floor(Math.random() * destroyableSlots.length)];

    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === destroyedSlot.id
          ? {
              ...slot,
              building: null,
              buildingLevel: undefined,
              assignedSurvivorId: null,
              patientSurvivorId: null,
            }
          : slot
      )
    );

    addEvent(
      `${eventTime} — BREACH! ${destroyedSlot.building?.name} was destroyed and must be rebuilt.`,
      "danger"
    );
  }

  function applyWallDamage(amount: number, eventTime: string) {
    setWallIntegrity((prev) => {
      const nextWall = Math.max(0, prev - amount);

      if (nextWall <= 0) {
        addEvent(
          `${eventTime} — Wall integrity collapsed. The shelter was breached.`,
          "danger"
        );

        destroyRandomBuildingAfterBreach(eventTime);
        return 35;
      }

      addEvent(
        `${eventTime} — Wall took ${amount} damage. Integrity now ${Math.floor(
          nextWall
        )}/100.`,
        nextWall <= 25 ? "danger" : "warning"
      );

      return nextWall;
    });
  }

  const canUpgradeBase =
    activeLayout.level < 2 &&
    survivors.length >= 4 &&
    resources.materials >= baseUpgradeCost.materials &&
    resources.food >= baseUpgradeCost.food &&
    resources.fuel >= baseUpgradeCost.fuel;

  function chooseBaseUpgrade(layoutId: "farmstead" | "fortified") {
    if (!canUpgradeBase) return;

    const nextLayout = baseLayouts.find((layout) => layout.id === layoutId);
    if (!nextLayout) return;

    setResources((prev) =>
      clampResources(
        {
          ...prev,
          materials: prev.materials - baseUpgradeCost.materials,
          food: prev.food - baseUpgradeCost.food,
          fuel: prev.fuel - baseUpgradeCost.fuel,
        },
        getStorageCaps(nextLayout.slots, nextLayout)
      )
    );

    setBaseLayoutId(layoutId);
    setSlots(nextLayout.slots.map((slot) => ({ ...slot })));
    setWallIntegrity(Math.min(100, 75 + nextLayout.wallBonus));
    setSelectedSlot(null);
    setUpgradeOpen(false);

    addEvent(
      `${time} — Base upgraded to ${nextLayout.name}. The base path is now locked in with permanent structures.`,
      "success"
    );
  }

  function upgradeBuildingInSlot(slotId: string) {
    const slot = slots.find((currentSlot) => currentSlot.id === slotId);
    if (!slot?.building) return;

    const cost = getBuildingUpgradeCost(slot);
    if (!canAffordCost(resources, cost)) return;

    setResources((prev) =>
      clampResources(payResourceCost(prev, cost!), getStorageCaps(slots, activeLayout))
    );

    setSlots((prev) =>
      prev.map((currentSlot) =>
        currentSlot.id === slotId
          ? {
              ...currentSlot,
              buildingLevel: Math.min(3, (currentSlot.buildingLevel ?? 1) + 1),
            }
          : currentSlot
      )
    );

    addEvent(
      `${time} — ${slot.building.name} upgraded to level ${(slot.buildingLevel ?? 1) + 1}.`,
      "success"
    );
  }

  function repairWall() {
    if (resources.materials < 10 || wallIntegrity >= 100) return;

    setResources((prev) =>
      clampResources(
        {
          ...prev,
          materials: Math.max(0, prev.materials - 10),
        },
        storageCaps
      )
    );

    setWallIntegrity((prev) => Math.min(100, prev + 25));
    addEvent(`${time} — Wall repaired by 25 integrity.`, "success");
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes((prevMinutes) => {
        const nextMinutes = prevMinutes + 10;
        const currentTime = formatGameTime(nextMinutes);
        const currentThreat = getThreat(currentTime.hour);

        setAvailableMissions((prev) => {
          const stillActive = prev.filter(
            (mission) => mission.expiresAtMinute > nextMinutes
          );

          if (stillActive.length >= 3) return stillActive;

          return generateMapMissions(nextMinutes);
        });

        setResources((prev) => {
          const next: ResourceMap = {
            food: prev.food + resourceRates.food,
            materials: prev.materials + resourceRates.materials,
            ammo: prev.ammo + resourceRates.ammo,
            fuel: prev.fuel + resourceRates.fuel,
            medicine: prev.medicine + resourceRates.medicine,
          };

          return clampResources(next, storageCaps);
        });

        const completedMissions = missions.filter(
          (mission) =>
            mission.returnAtMinute > prevMinutes &&
            mission.returnAtMinute <= nextMinutes
        );

        if (completedMissions.length > 0) {
          completedMissions.forEach((mission) => {
            const failed = Math.random() < (mission.failureChance ?? 0);
            const injured = Math.random() < (mission.injuryChance ?? 0);

            if (!failed) {
              setResources((prev) => {
                const next = { ...prev };

                Object.entries(mission.loot).forEach(([key, value]) => {
                  const randomness = 0.6 + Math.random() * 0.8;
                  const finalAmount = Math.max(
                    1,
                    Math.floor(Number(value ?? 0) * randomness)
                  );

                  next[key as ResourceKey] += finalAmount;
                });

                return clampResources(next, storageCaps);
              });
            }

            setSurvivors((prev) =>
              prev.map((survivor) => {
                if (survivor.id !== mission.survivorId) return survivor;

                return {
                  ...survivor,
                  assignment: "Resting",
                  stamina: Math.max(
                    0,
                    survivor.stamina -
                      (mission.risk === "High"
                        ? 40
                        : mission.risk === "Medium"
                        ? 28
                        : 18)
                  ),
                  health: injured
                    ? Math.max(15, survivor.health - 20)
                    : survivor.health,
                };
              })
            );

            addEvent(
              failed
                ? `${currentTime.time} — ${mission.survivorName} returned from ${mission.locationName} empty-handed.`
                : injured
                ? `${currentTime.time} — ${mission.survivorName} returned injured from ${mission.locationName}.`
                : `${currentTime.time} — ${mission.survivorName} returned from ${mission.locationName} with supplies.`,
              failed || injured ? "warning" : "success"
            );
          });

          setMissions((prev) =>
            prev.filter(
              (mission) =>
                !completedMissions.some(
                  (completed) => completed.id === mission.id
                )
            )
          );
        }

        setSurvivors((prev) =>
          prev.map((survivor) => {
            if (survivor.assignment === "On Mission") return survivor;

            const assignedSlot = slots.find(
              (slot) => slot.assignedSurvivorId === survivor.id
            );

            let staminaChange = 0.6;

            if (assignedSlot?.building?.name === "Garden") staminaChange = -0.35;
            if (assignedSlot?.building?.name === "Workshop") staminaChange = -0.45;
            if (assignedSlot?.building?.name === "Infirmary") staminaChange = -0.3;
            if (assignedSlot?.building?.name === "Watchtower") staminaChange = -0.4;
            if (assignedSlot?.building?.name === "Sleeping Quarters") staminaChange = 2.5;

            return {
              ...survivor,
              stamina: Math.max(
                0,
                Math.min(100, survivor.stamina + staminaChange)
              ),
            };
          })
        );

        setSurvivors((prevSurvivors) =>
          prevSurvivors.map((survivor) => {
            if (survivor.health >= 100) return survivor;

            const infirmarySlot = slots.find(
              (slot) =>
                slot.building?.name === "Infirmary" &&
                slot.patientSurvivorId === survivor.id
            );

            if (!infirmarySlot) return survivor;

            const hasMedicine = resources.medicine > 0;

            const hasWorker =
              !!infirmarySlot.assignedSurvivorId &&
              infirmarySlot.assignedSurvivorId !== survivor.id &&
              prevSurvivors.some(
                (person) =>
                  person.id === infirmarySlot.assignedSurvivorId &&
                  person.assignment !== "On Mission" &&
                  person.stamina > 0 &&
                  person.health > 0
              );

            let healingAmount = 0.1;
            if (hasMedicine) healingAmount = hasWorker ? 2 : 1;

            return {
              ...survivor,
              health: Math.min(100, survivor.health + healingAmount),
            };
          })
        );

        setResources((prev) => {
          const patientsUsingMedicine = survivors.filter((survivor) => {
            if (survivor.health >= 100) return false;

            return slots.some(
              (slot) =>
                slot.building?.name === "Infirmary" &&
                slot.patientSurvivorId === survivor.id
            );
          }).length;

          if (patientsUsingMedicine <= 0 || prev.medicine <= 0) return prev;

          return clampResources(
            {
              ...prev,
              medicine: Math.max(0, prev.medicine - patientsUsingMedicine * 0.1),
            },
            storageCaps
          );
        });

        const attackWindow =
          currentThreat === "HIGH" &&
          currentTime.hour === 22 &&
          currentTime.day !== lastAttackDay;

        if (attackWindow) {
          setLastAttackDay(currentTime.day);

          const attack = resolveNightAttack(defense);
          const wallDamage = attack.success
            ? 5 + Math.floor(Math.random() * 8)
            : 18 + Math.floor(Math.random() * 18);

          applyWallDamage(wallDamage, currentTime.time);

          setResources((prev) => {
            const ammoUsed = Math.min(prev.ammo, attack.success ? 2 : 4);
            const next = { ...prev };

            next.ammo = Math.max(0, next.ammo - ammoUsed);

            if (!attack.success) {
              next.food = Math.max(0, next.food - 6);
              next.materials = Math.max(0, next.materials - 5);
            }

            addEvent(
              `${currentTime.time} — ${attack.message} Ammo used: ${ammoUsed}.${
                attack.success
                  ? ""
                  : " Lost food/materials and one survivor was injured."
              }`,
              attack.success ? "warning" : "danger"
            );

            return clampResources(next, storageCaps);
          });

          if (!attack.success) {
            setSurvivors((prev) => {
              const homeSurvivors = prev.filter(
                (survivor) => survivor.assignment !== "On Mission"
              );

              if (homeSurvivors.length === 0) return prev;

              const injuredSurvivor =
                homeSurvivors[Math.floor(Math.random() * homeSurvivors.length)];

              return prev.map((survivor) =>
                survivor.id === injuredSurvivor.id
                  ? {
                      ...survivor,
                      health: Math.max(10, survivor.health - 18),
                    }
                  : survivor
              );
            });
          }
        }

        return nextMinutes;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [
    resourceRates,
    missions,
    storageCaps,
    defense,
    lastAttackDay,
    slots,
    resources.medicine,
    survivors,
    wallIntegrity,
  ]);

  function buildInSlot(building: Building) {
    if (!selectedSlot || selectedSlot.type === "permanent") return;
    if (building.type !== selectedSlot.type) return;
    if (!canAffordBuilding(resources, building)) return;

    setResources((prev) =>
      clampResources(payBuildingCost(prev, building), storageCaps)
    );

    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === selectedSlot.id
          ? {
              ...slot,
              building,
              buildingLevel: 1,
              assignedSurvivorId: null,
              patientSurvivorId: null,
            }
          : slot
      )
    );

    addEvent(
      `${time} — Built ${building.name} in ${selectedSlot.label}.`,
      "success"
    );

    setSelectedSlot(null);
  }

  function assignSurvivorToSlot(slotId: string, survivorId: string | null) {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          return {
            ...slot,
            assignedSurvivorId: survivorId,
          };
        }

        if (survivorId && slot.assignedSurvivorId === survivorId) {
          return {
            ...slot,
            assignedSurvivorId: null,
          };
        }

        return slot;
      })
    );

    const survivor = survivors.find((person) => person.id === survivorId);
    const slot = slots.find((item) => item.id === slotId);

    if (survivor && slot) {
      addEvent(
        `${time} — ${survivor.name} assigned to ${
          slot.building?.name || slot.label
        }.`,
        "info"
      );
    }
  }

  function assignPatientToInfirmary(slotId: string, survivorId: string | null) {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          return {
            ...slot,
            patientSurvivorId: survivorId,
          };
        }

        if (survivorId && slot.patientSurvivorId === survivorId) {
          return {
            ...slot,
            patientSurvivorId: null,
          };
        }

        return slot;
      })
    );

    const survivor = survivors.find((person) => person.id === survivorId);

    if (survivor) {
      addEvent(`${time} — ${survivor.name} admitted to the Infirmary.`, "info");
    }
  }

  function updateAssignment(survivorId: string, assignment: Assignment) {
    if (assignment === "On Mission") return;

    const survivor = survivors.find((person) => person.id === survivorId);

    setSurvivors((prev) =>
      prev.map((person) =>
        person.id === survivorId ? { ...person, assignment } : person
      )
    );

    if (survivor) {
      addEvent(`${time} — ${survivor.name} assigned to ${assignment}.`, "info");
    }
  }

  function startMission(location: ScavengeLocation, survivorId: string) {
    const survivor = survivors.find((person) => person.id === survivorId);
    if (!survivor) return;

    const mapLocation = location as MapMission;

    const injuryChance =
      location.risk === "High"
        ? 0.45
        : location.risk === "Medium"
        ? 0.2
        : 0.08;

    const failureChance =
      location.risk === "High"
        ? 0.35
        : location.risk === "Medium"
        ? 0.15
        : 0.05;

    const mission: Mission = {
      id: `${location.id}-${survivor.id}-${Date.now()}`,
      survivorId: survivor.id,
      survivorName: survivor.name,
      locationName: location.name,
      departAtMinute: minutes,
      returnAtMinute: minutes + location.durationMinutes,
      loot: location.loot,
      risk: location.risk,
      injuryChance,
      failureChance,
      mapX: mapLocation.mapX,
      mapY: mapLocation.mapY,
      icon: mapLocation.icon,
    };

    setMissions((prev) => [...prev, mission]);

    setSurvivors((prev) =>
      prev.map((person) =>
        person.id === survivorId
          ? { ...person, assignment: "On Mission" }
          : person
      )
    );

    addEvent(
      `${time} — ${survivor.name} departed for ${location.name}.`,
      "info"
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07090c] text-zinc-100">
      {activeTab === "shelter" && (
        <div className="mx-auto max-w-7xl space-y-3 px-3 pb-28 pt-[calc(env(safe-area-inset-top)_+_0.75rem)] sm:space-y-4 sm:p-4 sm:pb-28">
          <TopBar
            day={day}
            time={time}
            threat={threat}
            defense={defense}
            wallIntegrity={wallIntegrity}
            resources={resources}
            resourceRates={resourceRates}
            storageCaps={storageCaps}
          />

          <ShelterView
            slots={slots}
            survivors={survivors}
            threat={threat}
            wallIntegrity={wallIntegrity}
            layout={activeLayout}
            resources={resources}
            canUpgradeBase={canUpgradeBase}
            baseUpgradeCost={baseUpgradeCost}
            onOpenBaseUpgrade={() => setUpgradeOpen(true)}
            onUpgradeBuilding={upgradeBuildingInSlot}
            onSelectSlot={setSelectedSlot}
            onAssignSurvivor={assignSurvivorToSlot}
            onAssignPatient={assignPatientToInfirmary}
          />

          <BaseStatus
            survivors={survivors}
            resourceRates={resourceRates}
            defense={defense}
            wallIntegrity={wallIntegrity}
            resources={resources}
            onRepairWall={repairWall}
          />
        </div>
      )}

      {activeTab === "map" && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(72px_+_env(safe-area-inset-bottom))] z-10 bg-[#07090c]">
          <MapView
            survivors={survivors}
            missions={missions}
            availableMissions={availableMissions}
            currentMinute={minutes}
            onStartMission={startMission}
          />
        </div>
      )}

      <div className="fixed left-2 right-2 top-[calc(env(safe-area-inset-top)_+_0.5rem)] z-[70] flex justify-between gap-2 sm:left-3 sm:right-auto">
        <button
          onClick={() => setSurvivorDrawerOpen(true)}
          className="min-h-11 rounded-xl border border-zinc-800 bg-black/75 px-4 py-2 text-xs font-semibold text-zinc-200 backdrop-blur active:scale-95"
        >
          Survivors
        </button>

        <button
          onClick={() => setLogDrawerOpen(true)}
          className="min-h-11 rounded-xl border border-zinc-800 bg-black/75 px-4 py-2 text-xs font-semibold text-zinc-200 backdrop-blur active:scale-95"
        >
          Log
        </button>
      </div>

      <EventToasts toasts={toasts} />

      <SideDrawer
        title="Survivors"
        side="left"
        open={survivorDrawerOpen}
        onClose={() => setSurvivorDrawerOpen(false)}
      >
        <SurvivorPanel
          survivors={survivors}
          slots={slots}
        />
      </SideDrawer>

      <SideDrawer
        title="Event Log"
        side="right"
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
      >
        <EventLog
          log={log}
          farmingCount={farmingCount}
          guardCount={guardCount}
          scavengingCount={scavengingCount}
          medicalCount={medicalCount}
          engineeringCount={engineeringCount}
        />
      </SideDrawer>

      {upgradeOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh_-_1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Base Evolution</p>
                <h2 className="text-2xl font-bold">Choose Your Level 2 Base Path</h2>
                <p className="mt-1 text-sm text-zinc-500">Pick the direction this base grows. This keeps the upgrade-path choice, but it is controlled from the Command Center.</p>
              </div>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">Close</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {baseLayouts
                .filter((layout) => layout.level === 2)
                .map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => chooseBaseUpgrade(layout.id as "farmstead" | "fortified")}
                    disabled={!canUpgradeBase}
                    className="min-h-36 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-amber-500 active:scale-[0.99] disabled:opacity-50"
                  >
                    <p className="text-xs uppercase text-zinc-500">Level {layout.level}</p>
                    <h3 className="mt-1 text-xl font-bold text-zinc-100">{layout.name}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{layout.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {layout.bonuses.map((bonus) => (
                        <span key={bonus} className="rounded-full border border-zinc-700 bg-black/40 px-2 py-1 text-xs text-zinc-300">
                          {bonus}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      <BuildModal
        selectedSlot={selectedSlot}
        resources={resources}
        onClose={() => setSelectedSlot(null)}
        onBuild={buildInSlot}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}