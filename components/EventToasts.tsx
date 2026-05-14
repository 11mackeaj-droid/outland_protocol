export type ToastType = "info" | "success" | "warning" | "danger";
export type ToastMessage = { id: string; message: string; type: ToastType };

const colors: Record<ToastType, string> = {
  info: "border-sky-700 bg-sky-950/90 text-sky-100",
  success: "border-green-700 bg-green-950/90 text-green-100",
  warning: "border-amber-700 bg-amber-950/90 text-amber-100",
  danger: "border-red-700 bg-red-950/90 text-red-100",
};

export default function EventToasts({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="pointer-events-none fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[150] mx-auto flex max-w-md flex-col gap-2">
      {toasts.map((toast) => <div key={toast.id} className={`rounded-xl border px-3 py-2 text-sm shadow-xl backdrop-blur ${colors[toast.type]}`}>{toast.message}</div>)}
    </div>
  );
}
