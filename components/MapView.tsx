"use client";

import { useState } from "react";
import type { MapMission, Mission, ScavengeLocation, Survivor } from "../lib/types";

type Props = {
  survivors: Survivor[];
  missions: Mission[];
  availableMissions: MapMission[];
  currentMinute: number;
  onStartMission: (location: ScavengeLocation, survivorId: string) => void;
};

function riskClasses(risk: string) {
  if (risk === "High") return "border-red-500 bg-red-950 text-red-100";
  if (risk === "Medium") return "border-amber-500 bg-amber-950 text-amber-100";
  return "border-green-500 bg-green-950 text-green-100";
}
function formatLoot(loot: ScavengeLocation["loot"]) {
  return Object.entries(loot).map(([key, value]) => `${key} ${value}`).join(" • ");
}
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}
function travelPosition(mission: Mission, currentMinute: number) {
  const total = Math.max(1, mission.returnAtMinute - mission.departAtMinute);
  const elapsed = Math.max(0, Math.min(total, currentMinute - mission.departAtMinute));
  const progress = elapsed / total;
  const outbound = progress <= 0.5;
  const leg = outbound ? progress * 2 : (1 - progress) * 2;
  const x = 50 + ((mission.mapX ?? 50) - 50) * leg;
  const y = 50 + ((mission.mapY ?? 50) - 50) * leg;
  return { x, y, progress, direction: outbound ? "Outbound" : "Returning" };
}

const backgroundPOIs = [
  { x: 17, y: 18, icon: "⌂" }, { x: 83, y: 22, icon: "⚙" }, { x: 18, y: 78, icon: "⛽" }, { x: 80, y: 78, icon: "✚" }, { x: 50, y: 15, icon: "▲" }, { x: 50, y: 88, icon: "▣" },
];

export default function MapView({ survivors, missions, availableMissions, currentMinute, onStartMission }: Props) {
  const [selectedMission, setSelectedMission] = useState<MapMission | null>(null);
  const [zoom, setZoom] = useState(1);
  const availableSurvivors = survivors.filter((survivor) => survivor.assignment !== "On Mission" && survivor.health > 25 && survivor.stamina > 20);

  return (
    <section className="relative h-full overflow-hidden bg-[#06080b] text-zinc-100">
      <div className="absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 rounded-xl border border-zinc-800 bg-black/75 p-3 backdrop-blur">
        <p className="text-sm font-bold">Outlands Map</p><p className="text-xs text-zinc-400">Tap a site to dispatch.</p>
      </div>
      <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 rounded-xl border border-zinc-800 bg-black/75 p-2 backdrop-blur">
        <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="block rounded-lg bg-zinc-900 px-3 py-2 font-bold">+</button>
        <button onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))} className="mt-2 block rounded-lg bg-zinc-900 px-3 py-2 font-bold">−</button>
      </div>
      <div className="h-full w-full touch-none overflow-hidden">
        <div className="relative h-full w-full origin-center transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-80">
            <rect width="100" height="100" fill="rgba(9,9,11,1)" />
            <path d="M8 50 C23 43, 35 44, 50 50 C65 56, 76 57, 92 50" fill="none" stroke="rgba(120,113,108,0.7)" strokeWidth="1.7" strokeDasharray="1 1" />
            <path d="M50 5 C48 22, 50 37, 50 50 C50 63, 52 78, 50 96" fill="none" stroke="rgba(120,113,108,0.55)" strokeWidth="1.5" strokeDasharray="1 1" />
            {missions.map((mission) => mission.mapX && mission.mapY ? <line key={mission.id} x1="50" y1="50" x2={mission.mapX} y2={mission.mapY} stroke="rgb(251 191 36)" strokeWidth="0.8" strokeDasharray="2 1" /> : null)}
          </svg>
          {backgroundPOIs.map((poi, index) => <div key={index} className="absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-zinc-700/50 bg-black/40 text-lg text-zinc-500" style={{ left: `${poi.x}%`, top: `${poi.y}%` }}>{poi.icon}</div>)}
          <div className="absolute left-1/2 top-1/2 z-30 w-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-500 bg-amber-950/90 p-4 text-center shadow-2xl"><p className="text-xs uppercase tracking-[0.3em] text-amber-300">Command</p><h3 className="mt-1 text-lg font-bold">Shelter Base</h3></div>
          {missions.map((mission) => {
            if (!mission.mapX || !mission.mapY) return null;
            const travel = travelPosition(mission, currentMinute);
            return <div key={`${mission.id}-walker`} className="absolute z-50 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300 bg-black text-lg shadow-xl" style={{ left: `${travel.x}%`, top: `${travel.y}%` }}>🧍</div>;
          })}
          {availableMissions.map((mission) => {
            const active = missions.some((m) => m.locationName === mission.name);
            const selected = selectedMission?.id === mission.id;
            return <button key={mission.id} onClick={() => setSelectedMission(mission)} className={`absolute z-40 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-2xl shadow-xl transition ${selected ? "ring-4 ring-amber-300" : ""} ${riskClasses(mission.risk)}`} style={{ left: `${mission.mapX}%`, top: `${mission.mapY}%` }}>{mission.icon}{active && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">!</span>}</button>;
          })}
        </div>
      </div>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.8rem)] left-3 z-40 max-w-[calc(100vw-1.5rem)] rounded-xl border border-zinc-800 bg-black/70 p-3 text-xs text-zinc-400 backdrop-blur"><p className="font-semibold text-zinc-200">Satellite Outlands Map</p><p>Available <span className="font-bold text-amber-300">{availableMissions.length}</span> • Active <span className="font-bold text-amber-300">{missions.length}</span></p></div>
      {selectedMission && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+6.3rem)] sm:items-center sm:p-4">
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs uppercase text-zinc-500">Selected Mission</p><h3 className="text-xl font-bold">{selectedMission.name}</h3></div><button onClick={() => setSelectedMission(null)} className="min-h-10 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold">Close</button></div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3"><span className="text-zinc-500">Risk</span><span className={`rounded-full border px-2 py-1 text-xs ${riskClasses(selectedMission.risk)}`}>{selectedMission.risk}</span></div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Possible Supplies</p><p className="mt-1 font-semibold text-amber-300">{formatLoot(selectedMission.loot)}</p></div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p>Route Time: {formatDuration(selectedMission.durationMinutes)}</p><p className="text-zinc-500">Expires in {formatDuration(selectedMission.expiresAtMinute - currentMinute)}</p></div>
              {availableSurvivors.length === 0 ? <p className="rounded-xl bg-zinc-900 p-3 text-zinc-500">No available survivors with enough stamina.</p> : (
                <select defaultValue="" onChange={(event) => { if (!event.target.value) return; onStartMission(selectedMission, event.target.value); setSelectedMission(null); event.currentTarget.value = ""; }} className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-4 text-base text-zinc-100 outline-none">
                  <option value="">Dispatch survivor...</option>{availableSurvivors.map((survivor) => <option key={survivor.id} value={survivor.id}>{survivor.name} — Stamina {Math.floor(survivor.stamina)}%</option>)}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
