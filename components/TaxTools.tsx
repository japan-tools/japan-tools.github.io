"use client";

import { useState } from "react";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}
function salaryDeduction(income: number) {
  if (income <= 1625000) return 550000;
  if (income <= 1800000) return income * 0.4 - 100000;
  if (income <= 3600000) return income * 0.3 + 80000;
  if (income <= 6600000) return income * 0.2 + 440000;
  if (income <= 8500000) return income * 0.1 + 1100000;
  return 1950000;
}
function incomeTax(value: number) {
  if (value <= 1950000) return value * 0.05;
  if (value <= 3300000) return value * 0.1 - 97500;
  if (value <= 6950000) return value * 0.2 - 427500;
  if (value <= 9000000) return value * 0.23 - 636000;
  return value * 0.33 - 1536000;
}

export function IncomeTaxScreen() {
  const [annual, setAnnual] = useState("5000000");
  const income = Math.max(0, Number(annual) || 0);
  const taxable = Math.max(0, income - salaryDeduction(income) - 480000);
  return (
    <Card>
      <Field label="給与収入（年収）">
        <input
          className={inputClass}
          type="number"
          min="0"
          value={annual}
          onChange={(event) => setAnnual(event.target.value)}
        />
      </Field>
      <Result>
        <div className="text-sm text-slate-500">所得税の目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={incomeTax(taxable)} />
        </div>
      </Result>
      <p className="mt-4 text-xs text-slate-500">控除を簡略化した概算です。</p>
    </Card>
  );
}

export function ResidentTaxScreen() {
  const [annual, setAnnual] = useState("5000000");
  const income = Math.max(0, Number(annual) || 0);
  const taxable = Math.max(0, income - salaryDeduction(income) - 430000);
  const tax = taxable * 0.1 + 5000;
  return (
    <Card>
      <Field label="前年の給与収入（年収）">
        <input
          className={inputClass}
          type="number"
          min="0"
          value={annual}
          onChange={(event) => setAnnual(event.target.value)}
        />
      </Field>
      <Result>
        <div className="text-sm text-slate-500">住民税の年額目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={tax} />
        </div>
        <div className="mt-2 text-sm font-normal text-slate-500">
          月平均 約 <Money value={tax / 12} />
        </div>
      </Result>
    </Card>
  );
}

export function SocialInsuranceScreen() {
  const [monthly, setMonthly] = useState("350000");
  const [rate, setRate] = useState("15");
  const amount = (Number(monthly) * Number(rate)) / 100;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="標準報酬月額の目安">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
          />
        </Field>
        <Field label="本人負担率（%）">
          <input
            className={inputClass}
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">月の社会保険料目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={amount} />
        </div>
      </Result>
    </Card>
  );
}
