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
    <div className="fixed inset-0 z-50 bg-black/60">
      <button
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close drawer"
      />

      <aside
        className={`absolute top-0 h-full w-full max-w-md overflow-y-auto border-zinc-800 bg-[#07090c] px-3 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] pt-[calc(env(safe-area-inset-top)_+_1rem)] shadow-2xl sm:p-4 ${
          side === "left"
            ? "left-0 border-r"
            : "right-0 border-l"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="min-h-10 rounded-lg bg-zinc-800 px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>

        {children}
      </aside>
    </div>
  );
}