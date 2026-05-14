import type { BasePath, ResourceMap, Survivor } from "../lib/types";
import { basePathInfo } from "../lib/gameData";

type Props = {
  survivors: Survivor[];
  resourceRates: ResourceMap;
  defense: number;
  wallIntegrity: number;
  resources: ResourceMap;
  baseLevel: number;
  basePath: BasePath;
  onRepairWall: () => void;
};

function formatRate(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export default function BaseStatus({ survivors, resourceRates, defense, wallIntegrity, resources, baseLevel, basePath, onRepairWall }: Props) {
  const canRepair = resources.materials >= 10 && wallIntegrity < 100;
  const assignedHome = survivors.filter((s) => s.assignment !== "Unassigned" && s.assignment !== "On Mission").length;
  const away = survivors.filter((s) => s.assignment === "On Mission").length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-lg font-bold">Base Status</h2>
      <p className="mt-1 text-sm text-zinc-500">Base level, staffed buildings, and selected command path drive your output.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Base Level</p><p className="mt-1 text-xl font-bold text-amber-300">Level {baseLevel}</p><p className="mt-2 text-xs text-zinc-400">{basePathInfo[basePath].label}</p></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Food Balance</p><p className={resourceRates.food >= 0 ? "mt-1 text-xl font-bold text-green-400" : "mt-1 text-xl font-bold text-red-400"}>{formatRate(resourceRates.food)}/tick</p><p className="mt-2 text-xs text-zinc-400">Food changes every game tick.</p></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Defense</p><p className="mt-1 text-xl font-bold text-amber-400">{defense}</p><p className="mt-2 text-xs text-zinc-400">Watchtowers, walls, and path bonuses matter.</p></div>
        <div className={`rounded-xl border p-3 ${wallIntegrity <= 25 ? "border-red-700 bg-red-950/30" : wallIntegrity <= 60 ? "border-amber-700 bg-amber-950/20" : "border-zinc-800 bg-zinc-900"}`}>
          <p className="text-xs uppercase text-zinc-500">Wall Integrity</p><p className="mt-1 text-xl font-bold">{Math.floor(wallIntegrity)} / 100</p>
          <button onClick={onRepairWall} disabled={!canRepair} className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">Repair Wall — 10 materials</button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><p className="rounded-lg bg-zinc-900 p-2">Home Staff: {assignedHome}</p><p className="rounded-lg bg-zinc-900 p-2">Away: {away}</p><p className="rounded-lg bg-zinc-900 p-2">People: {survivors.length}</p></div>
    </section>
  );
}
