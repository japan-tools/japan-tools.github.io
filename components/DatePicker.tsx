"use client";

import { DayPicker } from "react-day-picker";
import { ja } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/ToolPrimitives";
import "react-day-picker/style.css";

export default function JapaneseDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const formatIso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const display = value ? value.replaceAll("-", "/") : "日付を選択";
  return (
    <div className="relative">
      <button
        type="button"
        className={`${inputClass} flex items-center justify-between text-left font-medium`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{display}</span>
        <CalendarDays
          aria-hidden="true"
          size={18}
          className="shrink-0 text-slate-500"
        />
      </button>
      {open && (
        <div
          className="absolute z-30 mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          role="dialog"
          aria-label="日付を選択"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatIso(date));
              setOpen(false);
            }}
            locale={ja}
            defaultMonth={selected}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2100, 11)}
            captionLayout="dropdown"
            navLayout="after"
            showOutsideDays
          />
          <button
            type="button"
            className="mt-2 w-full border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            onClick={() => {
              onChange(formatIso(new Date()));
              setOpen(false);
            }}
          >
            今日を選択
          </button>
        </div>
      )}
    </div>
  );
}
