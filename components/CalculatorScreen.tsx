"use client";

import { useMemo, useState } from "react";
import JapaneseDatePicker from "@/components/DatePicker";
import { Card, Field, inputClass } from "@/components/ToolPrimitives";
import type { CalcInputs, CalculatorSpec } from "@/lib/tools/calculators/types";

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function CalculatorScreen({
  spec,
  categoryName,
}: {
  spec: CalculatorSpec;
  categoryName?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.key, f.defaultValue])),
  );

  const outputs = useMemo(() => {
    const input: CalcInputs = {
      raw: (key) => values[key] ?? "",
      num: (key) => toNumber(values[key] ?? "0"),
      int: (key) => Math.trunc(toNumber(values[key] ?? "0")),
      date: (key) => {
        const raw = values[key];
        if (!raw) return null;
        const parsed = new Date(`${raw}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      },
      minutes: (key) => {
        const match = /^(\d{1,2}):(\d{2})$/.exec(values[key] ?? "");
        if (!match) return 0;
        return Number(match[1]) * 60 + Number(match[2]);
      },
    };
    try {
      return spec.compute(input);
    } catch {
      return [
        { label: "エラー", value: "入力値を確認してください", primary: true },
      ];
    }
  }, [spec, values]);

  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const [primary, ...secondary] = outputs;

  return (
    <Card>
      <div className="border-b border-slate-100 pb-5">
        {categoryName && (
          <p className="text-sm font-bold text-blue-600">{categoryName}</p>
        )}
        <h2 className="mt-1 text-xl font-black text-slate-900">{spec.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{spec.lead}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {spec.fields.map((field) => (
          <Field
            key={field.key}
            label={
              field.suffix ? `${field.label}（${field.suffix}）` : field.label
            }
          >
            {field.type === "date" ? (
              <JapaneseDatePicker
                value={values[field.key]}
                onChange={(value) => set(field.key, value)}
              />
            ) : field.type === "time" ? (
              <input
                className={inputClass}
                type="time"
                value={values[field.key]}
                onChange={(event) => set(field.key, event.target.value)}
              />
            ) : field.type === "select" ? (
              <select
                className={inputClass}
                value={values[field.key]}
                onChange={(event) => set(field.key, event.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={field.min}
                step={field.step}
                value={values[field.key]}
                onChange={(event) => set(field.key, event.target.value)}
              />
            )}
            {field.hint && (
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                {field.hint}
              </span>
            )}
          </Field>
        ))}
      </div>

      {primary && (
        <div className="mt-7 rounded-xl bg-slate-50 p-4 text-center">
          <div className="text-sm font-semibold text-slate-500">
            {primary.label}
          </div>
          <div className="mt-1 text-3xl font-black text-blue-700">
            {primary.value}
          </div>
          {primary.note && (
            <div className="mt-1 text-xs text-slate-500">{primary.note}</div>
          )}
        </div>
      )}

      {secondary.length > 0 && (
        <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {secondary.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-4 px-4 py-2.5"
            >
              <dt className="text-sm text-slate-600">
                {item.label}
                {item.note && (
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {item.note}
                  </span>
                )}
              </dt>
              <dd className="shrink-0 text-sm font-bold text-slate-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {spec.note && (
        <p className="mt-4 text-xs leading-5 text-slate-500">{spec.note}</p>
      )}

      {spec.sources && spec.sources.length > 0 && (
        <p className="mt-2 text-xs leading-5 text-slate-400">
          参考：
          {spec.sources.map((source, index) => (
            <span key={source.url}>
              {index > 0 && "／"}
              <a
                className="underline hover:text-blue-600"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.label}
              </a>
            </span>
          ))}
        </p>
      )}
    </Card>
  );
}
