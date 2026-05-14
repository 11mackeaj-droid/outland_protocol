import type { Survivor } from "../lib/types";

type Props = { survivors: Survivor[] };

function staffingBonus(survivor: Survivor) {
  if (survivor.assignment === "Farming") return "Food staffing bonus when assigned to Garden.";
  if (survivor.assignment === "Guard Duty") return "Defense staffing bonus when assigned to Watchtower or Training Yard.";
  if (survivor.assignment === "Medical") return "Healing and medicine bonus when assigned to Infirmary.";
  if (survivor.assignment === "Engineering") return "Material bonus when assigned to Workshop or Generator.";
  if (survivor.assignment === "Resting") return "Stamina recovery bonus in Sleeping Quarters.";
  if (survivor.assignment === "On Mission") return "Away from base until mission return.";
  return "No current building bonus. Assign them to a room from the Shelter view.";
}

function statusColor(value: number) {
  if (value <= 30) return "bg-red-500";
  if (value <= 60) return "bg-amber-500";
  return "bg-green-500";
}

export default function SurvivorPanel({ survivors }: Props) {
  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="font-semibold">Survivors</h2>
        <p className="mt-1 text-sm text-zinc-500">Staff survivors from building popups. This page only shows condition and staffing bonuses.</p>
      </div>
      {survivors.map((survivor) => (
        <div key={survivor.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-start justify-between gap-2">
            <div><p className="font-bold">{survivor.name}</p><p className="text-xs text-zinc-500">{survivor.specialty}</p></div>
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{survivor.assignment}</span>
          </div>
          <div className="mt-3 grid gap-2">
            <div><p className="mb-1 text-xs text-zinc-500">Health {Math.floor(survivor.health)}%</p><div className="h-2 rounded-full bg-zinc-800"><div className={`h-2 rounded-full ${statusColor(survivor.health)}`} style={{ width: `${survivor.health}%` }} /></div></div>
            <div><p className="mb-1 text-xs text-zinc-500">Stamina {Math.floor(survivor.stamina)}%</p><div className="h-2 rounded-full bg-zinc-800"><div className={`h-2 rounded-full ${statusColor(survivor.stamina)}`} style={{ width: `${survivor.stamina}%` }} /></div></div>
          </div>
          <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-amber-200">{staffingBonus(survivor)}</p>
        </div>
      ))}
    </aside>
  );
}
