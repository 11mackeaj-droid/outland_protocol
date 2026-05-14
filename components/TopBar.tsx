import type { ResourceKey, ResourceMap } from "../lib/types";

type Props = {
  day: number;
  time: string;
  threat: string;
  defense: number;
  wallIntegrity: number;
  resources: ResourceMap;
  resourceRates: ResourceMap;
  storageCaps: ResourceMap;
};

function formatRate(value: number) {
  if (value > 0) return `+${value.toFixed(1)}`;
  return value.toFixed(1);
}

export default function TopBar({
  day,
  time,
  threat,
  defense,
  wallIntegrity,
  resources,
  resourceRates,
  storageCaps,
}: Props) {
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-lg sm:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide sm:text-2xl">OUTLAND PROTOCOL</h1>
          <p className="text-xs text-zinc-400 sm:text-sm">Rebuild humanity beyond the fall.</p>
        </div>

        <div className="text-sm text-zinc-300">
          Day {day} — {time} — Threat:{" "}
          <span
            className={
              threat === "HIGH"
                ? "font-bold text-red-400"
                : threat === "MEDIUM"
                ? "font-bold text-amber-400"
                : "font-bold text-green-400"
            }
          >
            {threat}
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-7 md:overflow-visible md:pb-0">
        {Object.entries(resources).map(([key, value]) => {
          const resourceKey = key as ResourceKey;
          const rate = resourceRates[resourceKey];
          const cap = storageCaps[resourceKey];
          const isFull = value >= cap;

          return (
            <div
              key={key}
              className={`min-w-[132px] rounded-xl border px-3 py-2 md:min-w-0 ${
                isFull
                  ? "border-amber-700 bg-amber-950/20"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase text-zinc-500">{key}</p>
                <p className={rate >= 0 ? "text-xs font-semibold text-green-400" : "text-xs font-semibold text-red-400"}>
                  {formatRate(rate)}/tick
                </p>
              </div>

              <p className="text-lg font-semibold">
                {Math.floor(value)}
                <span className="text-xs text-zinc-500"> / {cap}</span>
              </p>

              {isFull && <p className="text-xs text-amber-300">Storage full</p>}
            </div>
          );
        })}

        <div className="min-w-[112px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 md:min-w-0">
          <p className="text-xs uppercase text-zinc-500">Defense</p>
          <p className="text-lg font-semibold">{defense}</p>
        </div>

        <div
          className={`min-w-[132px] rounded-xl border px-3 py-2 md:min-w-0 ${
            wallIntegrity <= 25
              ? "border-red-700 bg-red-950/30"
              : wallIntegrity <= 60
              ? "border-amber-700 bg-amber-950/20"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <p className="text-xs uppercase text-zinc-500">Wall</p>
          <p className="text-lg font-semibold">{Math.floor(wallIntegrity)} / 100</p>
        </div>
      </div>
    </header>
  );
}