import type { Slot, Survivor } from "../lib/types";

type Props = {
  survivors: Survivor[];
  slots: Slot[];
};

function getStaffedSlot(survivor: Survivor, slots: Slot[]) {
  return slots.find((slot) => slot.assignedSurvivorId === survivor.id) || null;
}

function staffingBonus(slot: Slot | null) {
  if (!slot?.building) return "Not staffed in a building yet.";

  const level = slot.buildingLevel ?? 1;

  if (slot.building.name === "Garden") return `+${(0.5 * level).toFixed(1)} food/tick while staffed.`;
  if (slot.building.name === "Kitchen") return `+${(0.18 * level).toFixed(2)} food/tick and better food efficiency.`;
  if (slot.building.name === "Workshop") return `+${(0.5 * level).toFixed(1)} materials/tick while staffed.`;
  if (slot.building.name === "Watchtower") return `+${20 * level} defense while staffed.`;
  if (slot.building.name === "Armory") return `+${10 * level} defense and ammo support while staffed.`;
  if (slot.building.name === "Training Yard") return `+${12 * level} defense while staffed.`;
  if (slot.building.name === "Infirmary") return `Doubles healing speed when treating a patient.`;
  if (slot.building.name === "Generator") return `Improves power/fuel support for the base.`;
  if (slot.building.name === "Radio Tower") return `Improves mission planning and future recruitment.`;
  if (slot.building.name === "Rain Collector") return `Passive clean-water support for food and medicine.`;

  return slot.building.effect;
}

function statusText(survivor: Survivor, slot: Slot | null) {
  if (survivor.assignment === "On Mission") return "Away on mission";
  if (slot?.building) return `Staffed: ${slot.building.name}`;
  return "Available for staffing";
}

export default function SurvivorPanel({ survivors, slots }: Props) {
  const staffedCount = survivors.filter((survivor) => getStaffedSlot(survivor, slots)).length;
  const missionCount = survivors.filter((survivor) => survivor.assignment === "On Mission").length;
  const availableCount = survivors.length - staffedCount - missionCount;

  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <h2 className="mb-2 font-semibold">Survivors</h2>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs sm:mb-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-zinc-500">Staffed</p>
          <p className="text-lg font-bold text-green-300">{staffedCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-zinc-500">Available</p>
          <p className="text-lg font-bold text-amber-300">{availableCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-zinc-500">Mission</p>
          <p className="text-lg font-bold text-sky-300">{missionCount}</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-400">
        Survivors no longer need manual idle jobs here. Staff them by clicking a building in the shelter. Their building assignment gives the bonus shown below.
      </div>

      <div className="space-y-2 sm:space-y-3">
        {survivors.map((survivor) => {
          const staffedSlot = getStaffedSlot(survivor, slots);

          return (
            <div key={survivor.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 sm:p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{survivor.name}</p>
                  <p className="text-xs text-zinc-500">{survivor.specialty}</p>
                </div>

                <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                  HP {Math.floor(survivor.health)}
                </span>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs text-zinc-500">Stamina {Math.floor(survivor.stamina)}%</p>
                <div className="h-2 rounded-full bg-zinc-800">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${survivor.stamina}%` }} />
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-zinc-800 bg-black/30 p-2">
                <p className="text-xs uppercase text-zinc-500">Current Role</p>
                <p className="text-sm font-semibold text-zinc-100">{statusText(survivor, staffedSlot)}</p>
                <p className="mt-1 text-xs text-amber-300">{staffingBonus(staffedSlot)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
