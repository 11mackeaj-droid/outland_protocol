export type MainTab = "shelter" | "map";

type Props = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSurvivors: () => void;
  onOpenLog: () => void;
};

const tabs: { id: MainTab; label: string; icon: string }[] = [
  { id: "shelter", label: "Shelter", icon: "⌂" },
  { id: "map", label: "Map", icon: "◎" },
];

export default function BottomNav({ activeTab, onTabChange, onOpenSurvivors, onOpenLog }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] border-t border-zinc-800 bg-zinc-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`min-h-14 rounded-xl px-2 py-2 text-xs font-semibold ${activeTab === tab.id ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-300"}`}>
            <span className="block text-lg leading-none">{tab.icon}</span>
            <span className="mt-1 block">{tab.label}</span>
          </button>
        ))}
        <button onClick={onOpenSurvivors} className="min-h-14 rounded-xl bg-zinc-900 px-2 py-2 text-xs font-semibold text-zinc-300">
          <span className="block text-lg leading-none">●</span><span className="mt-1 block">People</span>
        </button>
        <button onClick={onOpenLog} className="min-h-14 rounded-xl bg-zinc-900 px-2 py-2 text-xs font-semibold text-zinc-300">
          <span className="block text-lg leading-none">≡</span><span className="mt-1 block">Log</span>
        </button>
      </div>
    </nav>
  );
}
