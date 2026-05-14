import type { ResourceKey, ResourceMap, Survivor } from "../lib/types";

type Props = {
  survivors: Survivor[];
  resourceRates: ResourceMap;
  defense: number;
  wallIntegrity: number;
  resources: ResourceMap;
  onRepairWall: () => void;
};

function formatRate(value: number) {
  if (value > 0) return `+${value.toFixed(1)}`;
  return value.toFixed(1);
}

export default function BaseStatus({
  survivors,
  resourceRates,
  defense,
  wallIntegrity,
  resources,
  onRepairWall,
}: Props) {
  const farmers = survivors.filter((s) => s.assignment === "Farming").length;
  const guards = survivors.filter((s) => s.assignment === "Guard Duty").length;
  const medics = survivors.filter((s) => s.assignment === "Medical").length;
  const engineers = survivors.filter((s) => s.assignment === "Engineering").length;
  const away = survivors.filter((s) => s.assignment === "On Mission").length;
  const available = survivors.filter((s) => s.assignment === "Resting").length;

  const canRepair = resources.materials >= 10 && wallIntegrity < 100;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <h2 className="text-lg font-bold">Base Status</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Your base output comes from staffed rooms, survivor condition, and wall integrity.
      </p>

      <div className="mt-3 grid gap-2 sm:mt-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 sm:p-3">
          <p className="text-xs uppercase text-zinc-500">Food Balance</p>
          <p className={resourceRates.food >= 0 ? "mt-1 text-xl font-bold text-green-400" : "mt-1 text-xl font-bold text-red-400"}>
            {formatRate(resourceRates.food)}/tick
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Survivors consume food. Staffed gardens and kitchens increase food production.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 sm:p-3">
          <p className="text-xs uppercase text-zinc-500">Material Output</p>
          <p className={resourceRates.materials >= 0 ? "mt-1 text-xl font-bold text-green-400" : "mt-1 text-xl font-bold text-red-400"}>
            {formatRate(resourceRates.materials)}/tick
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Staffed workshops increase construction material production.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 sm:p-3">
          <p className="text-xs uppercase text-zinc-500">Defense Rating</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{defense}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Staffed watchtowers, armories, and training yards improve protection during attacks.
          </p>
        </div>

        <div
          className={`rounded-xl border p-3 ${
            wallIntegrity <= 25
              ? "border-red-700 bg-red-950/30"
              : wallIntegrity <= 60
              ? "border-amber-700 bg-amber-950/20"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <p className="text-xs uppercase text-zinc-500">Wall Integrity</p>
          <p className="mt-1 text-xl font-bold">{Math.floor(wallIntegrity)} / 100</p>
          <p className="mt-2 text-xs text-zinc-400">
            If the wall hits 0, the shelter is breached and a building may be destroyed.
          </p>

          <button
            onClick={onRepairWall}
            disabled={!canRepair}
            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Repair Wall — 10 materials
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:mt-4 sm:text-sm md:grid-cols-6">
        <p className="rounded-lg bg-zinc-900 p-2">Farmers: {farmers}</p>
        <p className="rounded-lg bg-zinc-900 p-2">Guards: {guards}</p>
        <p className="rounded-lg bg-zinc-900 p-2">Medics: {medics}</p>
        <p className="rounded-lg bg-zinc-900 p-2">Engineers: {engineers}</p>
        <p className="rounded-lg bg-zinc-900 p-2">Available: {available}</p>
        <p className="rounded-lg bg-zinc-900 p-2">Away: {away}</p>
      </div>
    </section>
  );
}