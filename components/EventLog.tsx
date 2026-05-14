type Props = {
  log: string[];
  farmingCount: number;
  guardCount: number;
  scavengingCount: number;
  medicalCount: number;
  engineeringCount: number;
};

export default function EventLog({
  log,
  farmingCount,
  guardCount,
  scavengingCount,
  medicalCount,
  engineeringCount,
}: Props) {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <h2 className="mb-3 font-semibold">Event Log</h2>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs uppercase text-zinc-500">Active Assignments</p>

        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p>Farmers: {farmingCount}</p>
          <p>Guards: {guardCount}</p>
          <p>Scavengers: {scavengingCount}</p>
          <p>Medics: {medicalCount}</p>
          <p>Engineers: {engineeringCount}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-zinc-400 sm:text-sm">
        {log.slice(0, 10).map((entry, index) => (
          <p key={index} className="rounded-lg bg-zinc-900 p-2">
            {entry}
          </p>
        ))}
      </div>
    </aside>
  );
}