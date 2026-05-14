export type ToastType = "info" | "success" | "warning" | "danger";

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

type Props = {
  toasts: ToastMessage[];
};

function toastStyle(type: ToastType) {
  if (type === "success") {
    return "border-green-700 bg-green-950/90 text-green-200";
  }

  if (type === "warning") {
    return "border-amber-700 bg-amber-950/90 text-amber-200";
  }

  if (type === "danger") {
    return "border-red-700 bg-red-950/90 text-red-200";
  }

  return "border-zinc-700 bg-zinc-950/90 text-zinc-200";
}

export default function EventToasts({ toasts }: Props) {
  return (
    <div className="pointer-events-none fixed left-3 right-3 top-[calc(env(safe-area-inset-top)_+_3.75rem)] z-[90] flex max-w-sm flex-col gap-2 md:left-auto md:top-20">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border p-3 text-sm shadow-2xl backdrop-blur ${toastStyle(
            toast.type
          )}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}