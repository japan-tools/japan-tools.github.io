"use client";

import { useMemo, useState } from "react";
import { getTool } from "@/lib/tools/registry";
import {
  getCatalogFieldLabels,
  getCatalogMode,
} from "@/lib/tools/catalogConfig";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}

export default function CatalogToolScreen({ slug }: { slug: string }) {
  const tool = getTool(slug);
  const name = tool?.name ?? "計算ツール";
  const mode = getCatalogMode(name, tool?.category);
  const [first, setFirst] = useState("100000");
  const [second, setSecond] = useState("10");
  const [third, setThird] = useState("1");
  const values = [first, second, third];
  const setters = [setFirst, setSecond, setThird];
  const result = useMemo(() => {
    const a = Math.max(0, Number(first) || 0);
    const b = Math.max(0, Number(second) || 0);
    const c = Math.max(0, Number(third) || 0);
    if (
      mode === "split" ||
      mode === "unit" ||
      mode === "price" ||
      mode === "saving"
    )
      return b ? a / b : 0;
    if (mode === "tax") return a * (1 + b / 100);
    if (mode === "rate") return a ? (b / a) * 100 : 0;
    if (mode === "discount") return a * Math.max(0, 1 - b / 100);
    if (mode === "reward") return (a * b) / 100;
    if (mode === "efficiency") return b ? a / b : 0;
    if (mode === "fuel") return b ? (a / b) * c : 0;
    if (mode === "transport") return a * b * Math.max(1, c);
    if (mode === "total" || mode === "compare" || mode === "household")
      return mode === "compare" ? Math.abs(a - b) : a + b + c;
    if (mode === "compound") {
      const monthlyRate = b / 100 / 12;
      return monthlyRate
        ? a * ((Math.pow(1 + monthlyRate, c) - 1) / monthlyRate)
        : a * c;
    }
    if (mode === "loan") {
      const monthlyRate = b / 100 / 12;
      return monthlyRate
        ? (a * monthlyRate * Math.pow(1 + monthlyRate, c)) /
            (Math.pow(1 + monthlyRate, c) - 1)
        : a / Math.max(1, c);
    }
    if (mode === "date") return a + b + c;
    return tool?.category === "work"
      ? a * Math.max(0, 1 - b / 100) + c
      : a * b + c;
  }, [first, second, third, mode, tool?.category]);
  const fields = getCatalogFieldLabels(mode, tool?.category);
  const percent = mode === "rate";
  const numeric = mode === "efficiency" || mode === "date";
  return (
    <Card>
      <div className="border-b border-slate-100 pb-5">
        <p className="text-sm font-bold text-blue-600">
          {tool?.categoryName ?? "TOOLS"}
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-900">{name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          入力条件を変更すると、このツール専用の計算結果を確認できます。
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {fields.map((label, index) => (
          <Field key={label} label={label}>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={values[index]}
              onChange={(event) => setters[index](event.target.value)}
            />
          </Field>
        ))}
      </div>
      <Result>
        <div className="text-sm text-slate-500">計算結果</div>
        <div className="mt-1 text-3xl text-blue-700">
          {percent ? (
            `${result.toFixed(2)}%`
          ) : numeric ? (
            result.toLocaleString("ja-JP")
          ) : (
            <Money value={result} />
          )}
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        制度・地域・契約条件が関係する場合は、公式データを入力した概算としてご利用ください。
      </p>
    </Card>
  );
}
