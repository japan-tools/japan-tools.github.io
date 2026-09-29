import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="tool-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Result({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 rounded-xl bg-slate-50 p-4 text-center text-lg font-bold">
      {children}
    </div>
  );
}
