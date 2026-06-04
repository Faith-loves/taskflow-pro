import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: LucideIcon; hint: string }) {
  return (
    <div className="soft-panel rounded-lg p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(23,32,51,0.08)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#667085]">{label}</p>
        <Icon className="size-4 text-[#0f766e]" />
      </div>
      <p className="text-3xl font-black tracking-normal text-[#172033]">{value}</p>
      <p className="mt-1 text-xs text-[#788498]">{hint}</p>
    </div>
  );
}
