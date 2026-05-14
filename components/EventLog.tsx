type Props = { log: string[]; farmingCount: number; guardCount: number; medicalCount: number; engineeringCount: number };
export default function EventLog({ log, farmingCount, guardCount, medicalCount, engineeringCount }: Props) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-zinc-900 p-3">Farm staff: {farmingCount}</div>
        <div className="rounded-xl bg-zinc-900 p-3">Guards: {guardCount}</div>
        <div className="rounded-xl bg-zinc-900 p-3">Medical: {medicalCount}</div>
        <div className="rounded-xl bg-zinc-900 p-3">Engineers: {engineeringCount}</div>
      </div>
      <div className="space-y-2">
        {log.map((item, index) => <p key={`${item}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">{item}</p>)}
      </div>
    </section>
  );
}
