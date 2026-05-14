import { buildings } from "../lib/gameData";
import { canAffordBuilding } from "../lib/gameLogic";
import type { Building, ResourceKey, ResourceMap, Slot } from "../lib/types";

type Props = {
  selectedSlot: Slot | null;
  resources: ResourceMap;
  onClose: () => void;
  onBuild: (building: Building) => void;
};

function formatCost(cost: Building["cost"]) {
  const entries = Object.entries(cost);

  if (entries.length === 0) return "Free";

  return entries
    .map(([key, value]) => `${key.toUpperCase()} ${value}`)
    .join(" • ");
}

export default function BuildModal({
  selectedSlot,
  resources,
  onClose,
  onBuild,
}: Props) {
  if (!selectedSlot || selectedSlot.type === "permanent") return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:items-center md:p-4">
      <div className="max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">
              Build in {selectedSlot.label}
            </h2>
            <p className="text-sm text-zinc-500">
              Slot type: {selectedSlot.type}
            </p>
          </div>

          <button
            onClick={onClose}
            className="min-h-10 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="grid gap-2">
          {buildings
            .filter((building) => building.type === selectedSlot.type)
            .map((building) => {
              const affordable = canAffordBuilding(resources, building);

              return (
                <button
                  key={building.name}
                  disabled={!affordable}
                  onClick={() => onBuild(building)}
                  className={`rounded-xl border p-3 text-left ${
                    affordable
                      ? "border-zinc-800 bg-zinc-900 hover:border-amber-600"
                      : "cursor-not-allowed border-zinc-900 bg-zinc-950 opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{building.name}</p>
                      <p className="text-sm text-zinc-500">{building.effect}</p>
                    </div>

                    <p
                      className={
                        affordable
                          ? "text-xs text-amber-300"
                          : "text-xs text-red-300"
                      }
                    >
                      {affordable ? "Can build" : "Need resources"}
                    </p>
                  </div>

                  <p className="mt-2 text-xs uppercase text-zinc-500">
                    Cost: {formatCost(building.cost)}
                  </p>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}