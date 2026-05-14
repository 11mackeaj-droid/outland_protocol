type Props = {
  title: string;
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SideDrawer({
  title,
  side,
  open,
  onClose,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/65">
      <button
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close drawer"
      />

      <aside
        className={`absolute bottom-0 top-0 h-full w-full overflow-hidden border-zinc-800 bg-[#07090c] shadow-2xl sm:max-w-md ${
          side === "left" ? "left-0 border-r" : "right-0 border-l"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-[#07090c]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur">
          <h2 className="text-lg font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="min-h-10 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-5rem)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-4">
          {children}
        </div>
      </aside>
    </div>
  );
}
