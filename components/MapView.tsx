import { useRef, useState } from "react";
import type {
  MapMission,
  Mission,
  ScavengeLocation,
  Survivor,
} from "../lib/types";

type Props = {
  survivors: Survivor[];
  missions: Mission[];
  availableMissions: MapMission[];
  currentMinute: number;
  onStartMission: (location: ScavengeLocation, survivorId: string) => void;
};

const backgroundPOIs = [
  { icon: "⌂", x: 12, y: 68 },
  { icon: "⌂", x: 32, y: 82 },
  { icon: "⌂", x: 38, y: 70 },
  { icon: "▣", x: 62, y: 25 },
  { icon: "▣", x: 85, y: 48 },
  { icon: "✚", x: 64, y: 84 },
  { icon: "✚", x: 84, y: 71 },
  { icon: "⛽", x: 69, y: 43 },
  { icon: "⚙", x: 31, y: 28 },
  { icon: "▲", x: 43, y: 18 },
  { icon: "⌂", x: 10, y: 45 },
  { icon: "▣", x: 18, y: 21 },
  { icon: "⌂", x: 89, y: 24 },
  { icon: "⌂", x: 54, y: 67 },
  { icon: "⚑", x: 48, y: 90 },
  { icon: "⌂", x: 74, y: 62 },
  { icon: "▣", x: 28, y: 52 },
  { icon: "⛽", x: 57, y: 38 },
  { icon: "⌂", x: 6, y: 14 },
  { icon: "⌂", x: 92, y: 12 },
  { icon: "▣", x: 7, y: 86 },
  { icon: "✚", x: 91, y: 91 },
  { icon: "⚙", x: 42, y: 6 },
  { icon: "⛽", x: 58, y: 94 },
  { icon: "⌂", x: 23, y: 12 },
  { icon: "⌂", x: 79, y: 17 },
  { icon: "▣", x: 16, y: 39 },
  { icon: "✚", x: 37, y: 91 },
  { icon: "⚑", x: 71, y: 8 },
  { icon: "⌂", x: 96, y: 66 },
];

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours <= 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function formatLoot(loot: ScavengeLocation["loot"]) {
  return Object.entries(loot)
    .map(([key, value]) => `${key.toUpperCase()} +${value}`)
    .join(" • ");
}

function riskClasses(risk: ScavengeLocation["risk"]) {
  if (risk === "High") return "border-red-500 bg-red-950 text-red-200";
  if (risk === "Medium") return "border-amber-500 bg-amber-950 text-amber-200";
  return "border-green-500 bg-green-950 text-green-200";
}

function minutesRemaining(returnAtMinute: number, currentMinute: number) {
  return Math.max(0, returnAtMinute - currentMinute);
}

function missionTravelPosition(mission: Mission, currentMinute: number) {
  const total = Math.max(1, mission.returnAtMinute - mission.departAtMinute);
  const elapsed = Math.max(0, currentMinute - mission.departAtMinute);
  const progress = Math.min(1, elapsed / total);

  const targetX = mission.mapX ?? 50;
  const targetY = mission.mapY ?? 50;

  const outbound = progress <= 0.5;
  const legProgress = outbound ? progress / 0.5 : (progress - 0.5) / 0.5;

  const x = outbound
    ? 50 + (targetX - 50) * legProgress
    : targetX + (50 - targetX) * legProgress;

  const y = outbound
    ? 50 + (targetY - 50) * legProgress
    : targetY + (50 - targetY) * legProgress;

  return {
    x,
    y,
    progress,
    direction: outbound ? "Outbound" : "Returning",
  };
}

const BASE_MAP_SIZE = 2200;

export default function MapView({
  survivors,
  missions,
  availableMissions,
  currentMinute,
  onStartMission,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const [selectedMission, setSelectedMission] = useState<MapMission | null>(
    null
  );
  const [zoom, setZoom] = useState(0.85);
  const [dragging, setDragging] = useState(false);

  const mapSize = BASE_MAP_SIZE * zoom;

  const availableSurvivors = survivors.filter(
    (survivor) => survivor.assignment !== "On Mission" && survivor.stamina > 20
  );

  function zoomIn() {
    setZoom((prev) => Math.min(1.8, Number((prev + 0.15).toFixed(2))));
  }

  function zoomOut() {
    setZoom((prev) => Math.max(0.55, Number((prev - 0.15).toFixed(2))));
  }

  function centerBase() {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      left: mapSize / 2 - viewport.clientWidth / 2,
      top: mapSize / 2 - viewport.clientHeight / 2,
      behavior: "smooth",
    });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("select")
    ) {
      return;
    }

    dragState.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };

    setDragging(true);
    viewport.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || !dragState.current.active) return;

    event.preventDefault();

    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;

    viewport.scrollLeft = dragState.current.scrollLeft - dx;
    viewport.scrollTop = dragState.current.scrollTop - dy;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;

    dragState.current.active = false;
    setDragging(false);

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section className="relative h-full w-full overflow-hidden bg-zinc-950 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
      <div
        ref={viewportRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className={`h-full w-full touch-pan-x touch-pan-y select-none overflow-auto bg-zinc-950 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          className="relative overflow-hidden bg-[#11130f]"
          style={{
            width: `${mapSize}px`,
            height: `${mapSize}px`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(63,78,47,0.48),transparent_18%),radial-gradient(circle_at_72%_32%,rgba(55,65,81,0.42),transparent_22%),radial-gradient(circle_at_44%_74%,rgba(75,85,99,0.34),transparent_24%),radial-gradient(circle_at_86%_84%,rgba(39,39,42,0.5),transparent_20%),linear-gradient(135deg,rgba(24,24,27,0.95),rgba(3,7,18,0.98))]" />

          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:72px_72px]" />
          </div>

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M3 58 C15 54, 29 55, 42 50 C57 45, 72 43, 97 34" fill="none" stroke="rgba(120,113,108,0.9)" strokeWidth="2.5" />
            <path d="M5 61 C18 58, 31 59, 44 53 C59 48, 74 46, 98 38" fill="none" stroke="rgba(39,39,42,0.95)" strokeWidth="1.2" />
            <path d="M50 4 C47 20, 48 34, 50 50 C53 65, 55 80, 49 96" fill="none" stroke="rgba(120,113,108,0.85)" strokeWidth="2.3" />
            <path d="M53 5 C50 21, 51 35, 53 51 C56 66, 58 81, 52 96" fill="none" stroke="rgba(39,39,42,0.95)" strokeWidth="1.1" />
            <path d="M15 18 C27 29, 38 38, 50 50 C62 62, 70 72, 83 88" fill="none" stroke="rgba(120,113,108,0.65)" strokeWidth="1.7" strokeDasharray="1 1" />
            <path d="M87 16 C79 34, 78 50, 77 63 C75 77, 69 88, 58 96" fill="none" stroke="rgba(120,113,108,0.65)" strokeWidth="1.7" strokeDasharray="1 1" />
            <path d="M6 84 C22 77, 36 75, 50 76 C67 77, 80 83, 96 92" fill="none" stroke="rgba(120,113,108,0.5)" strokeWidth="1.4" strokeDasharray="1 1" />
            <path d="M7 9 C21 15, 34 20, 48 20 C64 20, 78 15, 94 8" fill="none" stroke="rgba(120,113,108,0.45)" strokeWidth="1.3" strokeDasharray="1 1" />

            {missions.map((mission) => {
              if (!mission.mapX || !mission.mapY) return null;

              const travel = missionTravelPosition(mission, currentMinute);

              return (
                <g key={mission.id}>
                  <line
                    x1="50"
                    y1="50"
                    x2={mission.mapX}
                    y2={mission.mapY}
                    stroke="rgb(251 191 36)"
                    strokeWidth="0.8"
                    strokeDasharray="2 1"
                  />

                  <line
                    x1="50"
                    y1="50"
                    x2={travel.x}
                    y2={travel.y}
                    stroke="rgb(251 191 36)"
                    strokeWidth="1.4"
                  />
                </g>
              );
            })}
          </svg>

          {backgroundPOIs.map((poi, index) => (
            <div
              key={index}
              className="absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-zinc-700/50 bg-black/40 text-lg text-zinc-500 md:h-14 md:w-14 md:text-2xl"
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
            >
              {poi.icon}
            </div>
          ))}

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-700/20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-700/20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-700/20" />

          <div className="absolute left-1/2 top-1/2 z-30 w-56 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-500 bg-amber-950/90 p-4 text-center shadow-2xl md:w-72 md:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
              Command
            </p>
            <h3 className="mt-1 text-lg font-bold text-zinc-100 md:text-2xl">
              Shelter Base
            </h3>
            <p className="mt-2 text-xs text-zinc-400 md:text-sm">
              Central operations hub.
            </p>
          </div>

          {missions.map((mission) => {
            if (!mission.mapX || !mission.mapY) return null;

            const travel = missionTravelPosition(mission, currentMinute);

            return (
              <div
                key={`${mission.id}-walker`}
                className="absolute z-50 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300 bg-black text-lg shadow-xl shadow-amber-900/40"
                style={{ left: `${travel.x}%`, top: `${travel.y}%` }}
                title={`${mission.survivorName} ${travel.direction.toLowerCase()} — ${Math.round(
                  travel.progress * 100
                )}%`}
              >
                🧍
              </div>
            );
          })}

          {availableMissions.map((mission) => {
            const active = missions.some((m) => m.locationName === mission.name);
            const selected = selectedMission?.id === mission.id;

            return (
              <button
                key={mission.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedMission(mission);
                }}
                className={`absolute z-40 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-2xl shadow-xl transition hover:scale-110 md:h-20 md:w-20 md:text-3xl ${
                  selected ? "ring-4 ring-amber-300" : ""
                } ${riskClasses(mission.risk)}`}
                style={{ left: `${mission.mapX}%`, top: `${mission.mapY}%` }}
              >
                {mission.icon}

                {active && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black md:h-6 md:w-6 md:text-xs">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 rounded-xl border border-zinc-800 bg-black/75 p-2 backdrop-blur">
        <div className="mb-2 text-center text-[11px] text-zinc-400">
          {Math.round(zoom * 100)}%
        </div>

        <div className="grid gap-2">
          <button
            onClick={zoomIn}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100"
          >
            +
          </button>

          <button
            onClick={zoomOut}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100"
          >
            −
          </button>

          <button
            onClick={centerBase}
            className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-xs font-semibold text-amber-200"
          >
            Base
          </button>
        </div>
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.8rem)] left-3 z-40 max-w-[calc(100vw-1.5rem)] rounded-xl border border-zinc-800 bg-black/70 p-3 text-xs text-zinc-400 backdrop-blur md:max-w-sm">
        <p className="font-semibold text-zinc-200">Satellite Outlands Map</p>
        <p>
          Available{" "}
          <span className="font-bold text-amber-300">
            {availableMissions.length}
          </span>{" "}
          • Active{" "}
          <span className="font-bold text-amber-300">{missions.length}</span>
        </p>
      </div>

      {selectedMission && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center sm:p-4">
          <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-zinc-500">
                  Selected Mission
                </p>
                <h3 className="text-xl font-bold">{selectedMission.name}</h3>
              </div>

              <button
                onClick={() => setSelectedMission(null)}
                className="rounded-lg bg-zinc-800 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <span className="text-zinc-500">Risk</span>
                <span
                  className={`rounded-full border px-2 py-1 text-xs ${riskClasses(
                    selectedMission.risk
                  )}`}
                >
                  {selectedMission.risk}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs uppercase text-zinc-500">
                  Possible Supplies
                </p>
                <p className="mt-1 font-semibold text-amber-300">
                  {formatLoot(selectedMission.loot)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p>
                  Route Time: {formatDuration(selectedMission.durationMinutes)}
                </p>
                <p className="text-zinc-500">
                  Expires in{" "}
                  {formatDuration(
                    selectedMission.expiresAtMinute - currentMinute
                  )}
                </p>
              </div>

              {availableSurvivors.length === 0 ? (
                <p className="rounded-xl bg-zinc-900 p-3 text-zinc-500">
                  No available survivors with enough stamina.
                </p>
              ) : (
                <select
                  defaultValue=""
                  onChange={(event) => {
                    if (!event.target.value) return;
                    onStartMission(selectedMission, event.target.value);
                    setSelectedMission(null);
                    event.currentTarget.value = "";
                  }}
                  className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-4 text-base text-zinc-100 outline-none"
                >
                  <option value="">Dispatch survivor...</option>
                  {availableSurvivors.map((survivor) => (
                    <option key={survivor.id} value={survivor.id}>
                      {survivor.name} — Stamina {Math.floor(survivor.stamina)}%
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}