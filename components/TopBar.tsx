import type { ResourceMap } from "../lib/types";

const resourceLabels: Record<keyof ResourceMap, string> = {
  food: "Food",
  materials: "Mats",
  ammo: "Ammo",
  fuel: "Fuel",
  medicine: "Meds",
};

function rateText(value: number) {
  if (value > 0) return `+${value.toFixed(1)}`;
  return value.toFixed(1);
}

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

export default function TopBar({ day, time, threat, defense, wallIntegrity, resources, resourceRates, storageCaps }: Props) {
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black tracking-tight sm:text-2xl">Outland Protocol</h1>
          <p className="text-xs text-zinc-500">Day {day} • {time} • Threat <span className={threat === "HIGH" ? "text-red-400" : threat === "MEDIUM" ? "text-amber-400" : "text-green-400"}>{threat}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-xs sm:flex">
          <span className="rounded-xl bg-zinc-900 px-3 py-2">DEF <b className="text-amber-300">{defense}</b></span>
          <span className="rounded-xl bg-zinc-900 px-3 py-2">WALL <b className={wallIntegrity <= 30 ? "text-red-400" : "text-green-400"}>{Math.floor(wallIntegrity)}%</b></span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(Object.keys(resources) as (keyof ResourceMap)[]).map((key) => (
          <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-[11px] uppercase text-zinc-500">{resourceLabels[key]}</p>
            <p className="font-bold">{Math.floor(resources[key])}<span className="text-xs text-zinc-500">/{Math.floor(storageCaps[key])}</span></p>
            <p className={resourceRates[key] >= 0 ? "text-xs text-green-400" : "text-xs text-red-400"}>{rateText(resourceRates[key])}/tick</p>
          </div>
        ))}
      </div>
    </header>
  );
}
