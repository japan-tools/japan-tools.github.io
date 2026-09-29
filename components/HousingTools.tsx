"use client";

import { useState } from "react";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}

export function MortgageScreen() {
  const [principal, setPrincipal] = useState("35000000");
  const [rate, setRate] = useState("0.7");
  const [years, setYears] = useState("35");
  const loan = Math.max(0, Number(principal) || 0),
    months = Math.max(1, Number(years) || 1) * 12,
    monthlyRate = Math.max(0, Number(rate) || 0) / 100 / 12;
  const payment =
    monthlyRate === 0
      ? loan / months
      : (loan * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="借入金額">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
          />
        </Field>
        <Field label="年利（%）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
        <Field label="返済期間（年）">
          <input
            className={inputClass}
            type="number"
            min="1"
            value={years}
            onChange={(event) => setYears(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">毎月の返済額目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={payment} />
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        元利均等返済の概算です。諸費用・金利変動は含みません。
      </p>
    </Card>
  );
}

export function RentInitialCostScreen() {
  const [rent, setRent] = useState("100000");
  const [deposit, setDeposit] = useState("1");
  const [keyMoney, setKeyMoney] = useState("1");
  const [fee, setFee] = useState("1");
  const total =
    Number(rent) * (1 + Number(deposit) + Number(keyMoney) + Number(fee)) +
    Number(rent) * 0.5 +
    20000;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="月額家賃">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={rent}
            onChange={(event) => setRent(event.target.value)}
          />
        </Field>
        <Field label="敷金（月数）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.5"
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
          />
        </Field>
        <Field label="礼金（月数）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.5"
            value={keyMoney}
            onChange={(event) => setKeyMoney(event.target.value)}
          />
        </Field>
        <Field label="仲介手数料（月数）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.1"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <Money value={total} />
      </Result>
    </Card>
  );
}

export function MovingCostScreen() {
  const [people, setPeople] = useState("1");
  const [distance, setDistance] = useState("20");
  const [season, setSeason] = useState("normal");
  const base = Number(people) * 30000 + Number(distance) * 180,
    multiplier = season === "peak" ? 1.5 : season === "busy" ? 1.25 : 1;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="人数">
          <input
            className={inputClass}
            type="number"
            min="1"
            value={people}
            onChange={(event) => setPeople(event.target.value)}
          />
        </Field>
        <Field label="移動距離（km）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          />
        </Field>
        <Field label="時期">
          <select
            className={inputClass}
            value={season}
            onChange={(event) => setSeason(event.target.value)}
          >
            <option value="normal">通常期</option>
            <option value="busy">繁忙期</option>
            <option value="peak">3〜4月</option>
          </select>
        </Field>
      </div>
      <Result>
        <Money value={base * multiplier} />
      </Result>
    </Card>
  );
}

export function UtilityScreen({ kind }: { kind: "gas" | "water" }) {
  const [usage, setUsage] = useState(kind === "gas" ? "25" : "20");
  const [basic, setBasic] = useState(kind === "gas" ? "1100" : "900");
  const [rate, setRate] = useState("180");
  const total = Number(basic) + Number(usage) * Number(rate);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="使用量（m³）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.1"
            value={usage}
            onChange={(event) => setUsage(event.target.value)}
          />
        </Field>
        <Field label="基本料金">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={basic}
            onChange={(event) => setBasic(event.target.value)}
          />
        </Field>
        <Field label="従量料金（円 / m³）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        {kind === "gas" ? "ガス" : "水道"}料金目安 <Money value={total} />
      </Result>
    </Card>
  );
}

export function LifeCostScreen({
  type,
}: {
  type: "deposit" | "ratio" | "commuter" | "car" | "nhk";
}) {
  const [first, setFirst] = useState(
    type === "car"
      ? "300000"
      : type === "commuter"
        ? "1200"
        : type === "nhk"
          ? "1100"
          : "100000",
  );
  const [second, setSecond] = useState(
    type === "ratio"
      ? "350000"
      : type === "commuter"
        ? "20"
        : type === "car"
          ? "50000"
          : "1",
  );
  const [third, setThird] = useState(
    type === "car" ? "40000" : type === "commuter" ? "18000" : "1",
  );
  const a = Number(first) || 0,
    b = Number(second) || 0,
    c = Number(third) || 0;
  const result =
    type === "deposit"
      ? a * (b + c)
      : type === "ratio"
        ? (a / Math.max(1, b)) * 100
        : type === "commuter"
          ? a * b - c
          : type === "car"
            ? a / 12 + b / 12 + c / 12
            : a * 12;
  const labels =
    type === "deposit"
      ? ["家賃", "敷金（月数）", "礼金（月数）"]
      : type === "ratio"
        ? ["月額家賃", "月の手取り", "予備"]
        : type === "commuter"
          ? ["片道運賃", "出勤日数", "定期券（月額）"]
          : type === "car"
            ? ["自動車税（年額）", "保険料（年額）", "車検・整備（年額）"]
            : ["月額受信料", "予備", "予備"];
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={labels[0]}>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={first}
            onChange={(event) => setFirst(event.target.value)}
          />
        </Field>
        <Field label={labels[1]}>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={second}
            onChange={(event) => setSecond(event.target.value)}
          />
        </Field>
        {type !== "nhk" && (
          <Field label={labels[2]}>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={third}
              onChange={(event) => setThird(event.target.value)}
            />
          </Field>
        )}
      </div>
      <Result>
        {type === "ratio" ? `${result.toFixed(1)}%` : <Money value={result} />}
      </Result>
    </Card>
  );
}
