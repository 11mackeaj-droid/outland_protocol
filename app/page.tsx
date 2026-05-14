"use client";

import { useEffect, useMemo, useState } from "react";
import BaseStatus from "../components/BaseStatus";
import BottomNav, { type MainTab } from "../components/BottomNav";
import BuildModal from "../components/BuildModal";
import EventLog from "../components/EventLog";
import EventToasts, { type ToastMessage, type ToastType } from "../components/EventToasts";
import MapView from "../components/MapView";
import ShelterView from "../components/ShelterView";
import SideDrawer from "../components/SideDrawer";
import SurvivorPanel from "../components/SurvivorPanel";
import TopBar from "../components/TopBar";
import { initialSlots, initialSurvivors, scavengeLocations, startingResources } from "../lib/gameData";
import { calculateDefense, calculateRoomProduction, canAfford, canAffordBuilding, clampResources, formatGameTime, getBaseUpgradeCost, getBuildingUpgradeCost, getStorageCaps, getThreat, payBuildingCost, payCost, resolveNightAttack } from "../lib/gameLogic";
import type { Assignment, BasePath, Building, MapMission, Mission, ResourceKey, ResourceMap, ScavengeLocation, Slot } from "../lib/types";

function generateMapMissions(currentMinute: number): MapMission[] {
  const positions = [
    { x: 18, y: 68, icon: "⌂" }, { x: 30, y: 30, icon: "⚙" }, { x: 74, y: 36, icon: "⛽" },
    { x: 70, y: 76, icon: "✚" }, { x: 50, y: 14, icon: "▲" }, { x: 84, y: 52, icon: "▣" },
  ];
  const shuffled = [...scavengeLocations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6).map((location, index) => ({ ...location, id: `${location.id}-${currentMinute}-${index}`, mapX: positions[index].x, mapY: positions[index].y, icon: positions[index].icon, expiresAtMinute: currentMinute + 720 }));
}

function assignmentForBuilding(buildingName?: string): Assignment {
  if (buildingName === "Garden" || buildingName === "Water Collector") return "Farming";
  if (buildingName === "Watchtower" || buildingName === "Training Yard") return "Guard Duty";
  if (buildingName === "Infirmary") return "Medical";
  if (buildingName === "Workshop" || buildingName === "Generator" || buildingName === "Radio Room") return "Engineering";
  if (buildingName === "Sleeping Quarters") return "Resting";
  return "Unassigned";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<MainTab>("shelter");
  const [survivorDrawerOpen, setSurvivorDrawerOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [survivors, setSurvivors] = useState(initialSurvivors);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [minutes, setMinutes] = useState(8 * 60);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [lastAttackDay, setLastAttackDay] = useState(0);
  const [wallIntegrity, setWallIntegrity] = useState(100);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [baseLevel, setBaseLevel] = useState(1);
  const [basePath, setBasePath] = useState<BasePath>("none");
  const [resources, setResources] = useState<ResourceMap>(startingResources);
  const [availableMissions, setAvailableMissions] = useState<MapMission[]>(() => generateMapMissions(8 * 60));
  const [log, setLog] = useState<string[]>(["08:00 — Outland Protocol activated.", "08:00 — Shelter systems running on emergency reserves."]);

  const { day, hour, time } = formatGameTime(minutes);
  const threat = getThreat(hour);
  const storageCaps = useMemo(() => getStorageCaps(slots, baseLevel), [slots, baseLevel]);
  const roomProduction = useMemo(() => calculateRoomProduction(slots, survivors, basePath), [slots, survivors, basePath]);
  const defense = useMemo(() => calculateDefense(survivors, slots, basePath, baseLevel, wallIntegrity), [survivors, slots, basePath, baseLevel, wallIntegrity]);
  const resourceRates = useMemo<ResourceMap>(() => ({ food: roomProduction.food - survivors.length * 0.15, materials: roomProduction.materials, ammo: roomProduction.ammo, fuel: roomProduction.fuel, medicine: roomProduction.medicine }), [roomProduction, survivors.length]);

  const farmingCount = slots.filter((slot) => ["Garden", "Water Collector"].includes(slot.building?.name ?? "") && slot.assignedSurvivorId).length;
  const guardCount = slots.filter((slot) => ["Watchtower", "Training Yard"].includes(slot.building?.name ?? "") && slot.assignedSurvivorId).length;
  const medicalCount = slots.filter((slot) => slot.building?.name === "Infirmary" && slot.assignedSurvivorId).length;
  const engineeringCount = slots.filter((slot) => ["Workshop", "Generator", "Radio Room"].includes(slot.building?.name ?? "") && slot.assignedSurvivorId).length;

  function pushToast(message: string, type: ToastType = "info") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, message, type }, ...prev].slice(0, 5));
    window.setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4500);
  }

  function addEvent(message: string, type: ToastType = "info") {
    setLog((prev) => [message, ...prev].slice(0, 80));
    pushToast(message, type);
  }

  function destroyRandomBuildingAfterBreach(eventTime: string) {
    const destroyableSlots = slots.filter((slot) => slot.type !== "permanent" && slot.building);
    if (destroyableSlots.length === 0) {
      addEvent(`${eventTime} — The wall was breached, but there were no facilities left to destroy.`, "danger");
      return;
    }
    const destroyedSlot = destroyableSlots[Math.floor(Math.random() * destroyableSlots.length)];
    setSlots((prev) => prev.map((slot) => slot.id === destroyedSlot.id ? { ...slot, building: null, assignedSurvivorId: null, patientSurvivorId: null } : slot));
    addEvent(`${eventTime} — BREACH! ${destroyedSlot.building?.name} was destroyed and must be rebuilt.`, "danger");
  }

  function applyWallDamage(amount: number, eventTime: string) {
    setWallIntegrity((prev) => {
      const nextWall = Math.max(0, prev - amount);
      if (nextWall <= 0) {
        addEvent(`${eventTime} — Wall integrity collapsed. The shelter was breached.`, "danger");
        destroyRandomBuildingAfterBreach(eventTime);
        return 35;
      }
      addEvent(`${eventTime} — Wall took ${amount} damage. Integrity now ${Math.floor(nextWall)}/100.`, nextWall <= 25 ? "danger" : "warning");
      return nextWall;
    });
  }

  function repairWall() {
    if (resources.materials < 10 || wallIntegrity >= 100) return;
    setResources((prev) => clampResources({ ...prev, materials: Math.max(0, prev.materials - 10) }, storageCaps));
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
          const stillActive = prev.filter((mission) => mission.expiresAtMinute > nextMinutes);
          return stillActive.length >= 3 ? stillActive : generateMapMissions(nextMinutes);
        });

        setResources((prev) => clampResources({ food: prev.food + resourceRates.food, materials: prev.materials + resourceRates.materials, ammo: prev.ammo + resourceRates.ammo, fuel: prev.fuel + resourceRates.fuel, medicine: prev.medicine + resourceRates.medicine }, storageCaps));

        const completedMissions = missions.filter((mission) => mission.returnAtMinute > prevMinutes && mission.returnAtMinute <= nextMinutes);
        if (completedMissions.length > 0) {
          completedMissions.forEach((mission) => {
            const failed = Math.random() < (mission.failureChance ?? 0);
            const injured = Math.random() < (mission.injuryChance ?? 0);
            if (!failed) {
              setResources((prev) => {
                const next = { ...prev };
                Object.entries(mission.loot).forEach(([key, value]) => {
                  const finalAmount = Math.max(1, Math.floor((value ?? 0) * (0.6 + Math.random() * 0.8)));
                  next[key as ResourceKey] += finalAmount;
                });
                return clampResources(next, storageCaps);
              });
            }
            setSurvivors((prev) => prev.map((survivor) => survivor.id !== mission.survivorId ? survivor : { ...survivor, assignment: "Unassigned", stamina: Math.max(0, survivor.stamina - (mission.risk === "High" ? 40 : mission.risk === "Medium" ? 28 : 18)), health: injured ? Math.max(15, survivor.health - 20) : survivor.health }));
            addEvent(failed ? `${currentTime.time} — ${mission.survivorName} returned from ${mission.locationName} empty-handed.` : injured ? `${currentTime.time} — ${mission.survivorName} returned injured from ${mission.locationName}.` : `${currentTime.time} — ${mission.survivorName} returned from ${mission.locationName} with supplies.`, failed || injured ? "warning" : "success");
          });
          setMissions((prev) => prev.filter((mission) => !completedMissions.some((completed) => completed.id === mission.id)));
        }

        setSurvivors((prev) => prev.map((survivor) => {
          if (survivor.assignment === "On Mission") return survivor;
          const assignedSlot = slots.find((slot) => slot.assignedSurvivorId === survivor.id);
          let staminaChange = survivor.assignment === "Unassigned" ? 0.8 : -0.15;
          if (assignedSlot?.building?.name === "Garden") staminaChange = -0.3;
          if (assignedSlot?.building?.name === "Workshop") staminaChange = -0.4;
          if (assignedSlot?.building?.name === "Infirmary") staminaChange = -0.25;
          if (assignedSlot?.building?.name === "Watchtower") staminaChange = -0.35;
          if (assignedSlot?.building?.name === "Sleeping Quarters") staminaChange = 2.5;
          return { ...survivor, stamina: Math.max(0, Math.min(100, survivor.stamina + staminaChange)) };
        }));

        setSurvivors((prevSurvivors) => prevSurvivors.map((survivor) => {
          if (survivor.health >= 100) return survivor;
          const infirmarySlot = slots.find((slot) => slot.building?.name === "Infirmary" && slot.patientSurvivorId === survivor.id);
          if (!infirmarySlot) return survivor;
          const hasWorker = !!infirmarySlot.assignedSurvivorId && infirmarySlot.assignedSurvivorId !== survivor.id;
          const healingAmount = resources.medicine > 0 ? (hasWorker ? 2 : 1) : 0.1;
          return { ...survivor, health: Math.min(100, survivor.health + healingAmount) };
        }));

        const attackWindow = currentThreat === "HIGH" && currentTime.hour === 22 && currentTime.day !== lastAttackDay;
        if (attackWindow) {
          setLastAttackDay(currentTime.day);
          const attack = resolveNightAttack(defense);
          const wallDamage = attack.success ? 5 + Math.floor(Math.random() * 8) : 18 + Math.floor(Math.random() * 18);
          applyWallDamage(wallDamage, currentTime.time);
          setResources((prev) => {
            const ammoUsed = Math.min(prev.ammo, attack.success ? 2 : 4);
            const next = { ...prev, ammo: Math.max(0, prev.ammo - ammoUsed) };
            if (!attack.success) { next.food = Math.max(0, next.food - 6); next.materials = Math.max(0, next.materials - 5); }
            addEvent(`${currentTime.time} — ${attack.message} Ammo used: ${ammoUsed}.${attack.success ? "" : " Lost food/materials and one survivor was injured."}`, attack.success ? "warning" : "danger");
            return clampResources(next, storageCaps);
          });
        }
        return nextMinutes;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [resourceRates, missions, storageCaps, defense, lastAttackDay, slots, resources.medicine]);

  function buildInSlot(building: Building) {
    if (!selectedSlot || selectedSlot.type === "permanent" || building.type !== selectedSlot.type || !canAffordBuilding(resources, building)) return;
    setResources((prev) => clampResources(payBuildingCost(prev, building), storageCaps));
    setSlots((prev) => prev.map((slot) => slot.id === selectedSlot.id ? { ...slot, building: { ...building, level: 1 }, assignedSurvivorId: null, patientSurvivorId: null } : slot));
    addEvent(`${time} — Built ${building.name} in ${selectedSlot.label}.`, "success");
    setSelectedSlot(null);
  }

  function upgradeBuilding(slotId: string) {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot?.building || slot.building.level >= slot.building.maxLevel) return;
    const cost = getBuildingUpgradeCost(slot.building);
    if (!canAfford(resources, cost)) return;
    setResources((prev) => clampResources(payCost(prev, cost), storageCaps));
    setSlots((prev) => prev.map((item) => item.id === slotId && item.building ? { ...item, building: { ...item.building, level: item.building.level + 1 } } : item));
    addEvent(`${time} — Upgraded ${slot.building.name} to level ${slot.building.level + 1}.`, "success");
  }

  function upgradeBase(path: BasePath) {
    if (baseLevel >= 5 || survivors.length < 4) return;
    const cost = getBaseUpgradeCost(baseLevel);
    if (!canAfford(resources, cost)) return;
    setResources((prev) => clampResources(payCost(prev, cost), storageCaps));
    setBaseLevel((prev) => prev + 1);
    setBasePath(path);
    setSlots((prev) => prev.map((slot) => slot.id === "command" && slot.building ? { ...slot, building: { ...slot.building, level: slot.building.level + 1 } } : slot));
    addEvent(`${time} — Base upgraded to level ${baseLevel + 1}. Path set to ${path}.`, "success");
  }

  function assignSurvivorToSlot(slotId: string, survivorId: string | null) {
    const slot = slots.find((item) => item.id === slotId);
    setSlots((prev) => prev.map((item) => {
      if (item.id === slotId) return { ...item, assignedSurvivorId: survivorId };
      if (survivorId && item.assignedSurvivorId === survivorId) return { ...item, assignedSurvivorId: null };
      return item;
    }));
    if (survivorId && slot?.building) {
      const assignment = assignmentForBuilding(slot.building.name);
      setSurvivors((prev) => prev.map((person) => person.id === survivorId ? { ...person, assignment } : person));
      const survivor = survivors.find((person) => person.id === survivorId);
      if (survivor) addEvent(`${time} — ${survivor.name} assigned to ${slot.building.name}.`, "info");
    }
  }

  function assignPatientToInfirmary(slotId: string, survivorId: string | null) {
    setSlots((prev) => prev.map((slot) => {
      if (slot.id === slotId) return { ...slot, patientSurvivorId: survivorId };
      if (survivorId && slot.patientSurvivorId === survivorId) return { ...slot, patientSurvivorId: null };
      return slot;
    }));
    const survivor = survivors.find((person) => person.id === survivorId);
    if (survivor) addEvent(`${time} — ${survivor.name} admitted to the Infirmary.`, "info");
  }

  function startMission(location: ScavengeLocation, survivorId: string) {
    const survivor = survivors.find((person) => person.id === survivorId);
    if (!survivor) return;
    const mapLocation = location as MapMission;
    const mission: Mission = { id: `${location.id}-${survivor.id}-${Date.now()}`, survivorId: survivor.id, survivorName: survivor.name, locationName: location.name, departAtMinute: minutes, returnAtMinute: minutes + location.durationMinutes, loot: location.loot, risk: location.risk, injuryChance: location.risk === "High" ? 0.45 : location.risk === "Medium" ? 0.2 : 0.08, failureChance: location.risk === "High" ? 0.35 : location.risk === "Medium" ? 0.15 : 0.05, mapX: mapLocation.mapX, mapY: mapLocation.mapY, icon: mapLocation.icon };
    setMissions((prev) => [...prev, mission]);
    setSurvivors((prev) => prev.map((person) => person.id === survivorId ? { ...person, assignment: "On Mission" } : person));
    setSlots((prev) => prev.map((slot) => slot.assignedSurvivorId === survivorId ? { ...slot, assignedSurvivorId: null } : slot));
    addEvent(`${time} — ${survivor.name} departed for ${location.name}.`, "info");
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#07090c] text-zinc-100">
      {activeTab === "shelter" && <div className="h-dvh overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+6.8rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-4"><div className="mx-auto max-w-7xl space-y-4"><TopBar day={day} time={time} threat={threat} defense={defense} wallIntegrity={wallIntegrity} resources={resources} resourceRates={resourceRates} storageCaps={storageCaps} /><ShelterView slots={slots} survivors={survivors} resources={resources} baseLevel={baseLevel} basePath={basePath} threat={threat} wallIntegrity={wallIntegrity} onSelectSlot={setSelectedSlot} onAssignSurvivor={assignSurvivorToSlot} onAssignPatient={assignPatientToInfirmary} onUpgradeBuilding={upgradeBuilding} onUpgradeBase={upgradeBase} /><BaseStatus survivors={survivors} resourceRates={resourceRates} defense={defense} wallIntegrity={wallIntegrity} resources={resources} baseLevel={baseLevel} basePath={basePath} onRepairWall={repairWall} /></div></div>}
      {activeTab === "map" && <div className="fixed inset-x-0 top-0 bottom-[calc(env(safe-area-inset-bottom)+5.4rem)] z-10 bg-[#07090c]"><MapView survivors={survivors} missions={missions} availableMissions={availableMissions} currentMinute={minutes} onStartMission={startMission} /></div>}
      <EventToasts toasts={toasts} />
      <SideDrawer title="Survivors" open={survivorDrawerOpen} onClose={() => setSurvivorDrawerOpen(false)}><SurvivorPanel survivors={survivors} /></SideDrawer>
      <SideDrawer title="Event Log" open={logDrawerOpen} onClose={() => setLogDrawerOpen(false)}><EventLog log={log} farmingCount={farmingCount} guardCount={guardCount} medicalCount={medicalCount} engineeringCount={engineeringCount} /></SideDrawer>
      <BuildModal selectedSlot={selectedSlot} resources={resources} onClose={() => setSelectedSlot(null)} onBuild={buildInSlot} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onOpenSurvivors={() => setSurvivorDrawerOpen(true)} onOpenLog={() => setLogDrawerOpen(true)} />
    </main>
  );
}
