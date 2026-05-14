export type MainTab = "shelter" | "map";

type Props = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
};

const tabs: { id: MainTab; label: string }[] = [
  { id: "shelter", label: "Shelter" },
  { id: "map", label: "Map" },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold active:scale-95 ${
              activeTab === tab.id
                ? "bg-amber-500 text-black"
                : "bg-zinc-900 text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}