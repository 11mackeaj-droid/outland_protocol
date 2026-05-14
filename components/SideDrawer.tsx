type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SideDrawer({ title, open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/70">
      <div className="fixed inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl md:left-auto md:right-0 md:top-0 md:h-dvh md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="min-h-11 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100">Close</button>
        </div>
        <div className="max-h-[calc(88dvh-4.5rem)] overflow-y-auto p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:max-h-[calc(100dvh-4.5rem)]">{children}</div>
      </div>
    </div>
  );
}
