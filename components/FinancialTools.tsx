"use client";

import { useState } from "react";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

export function TaxScreen() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("10");
  const taxIncluded = Number(amount) * (1 + Number(rate) / 100);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="税抜金額">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Field label="税率">
          <select
            className={inputClass}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          >
            <option value="10">10%</option>
            <option value="8">8%</option>
          </select>
        </Field>
      </div>
      <Result>税込 {Math.round(taxIncluded).toLocaleString()} 円</Result>
      <p className="mt-3 text-center text-sm text-slate-500">
        消費税額：{Math.round(taxIncluded - Number(amount)).toLocaleString()} 円
      </p>
    </Card>
  );
}

export function DiscountScreen() {
  const [price, setPrice] = useState("10000");
  const [rate, setRate] = useState("20");
  const discount = (Number(price) * Number(rate)) / 100;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="元の価格">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        <Field label="割引率（%）">
          <input
            className={inputClass}
            type="number"
            min="0"
            max="100"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        割引後 {Math.round(Number(price) - discount).toLocaleString()} 円
      </Result>
      <p className="mt-3 text-center text-sm text-slate-500">
        割引額：{Math.round(discount).toLocaleString()} 円
      </p>
    </Card>
  );
}

export function SplitBillScreen() {
  const [total, setTotal] = useState("30000");
  const [people, setPeople] = useState("4");
  const perPerson = Math.ceil(Number(total) / Math.max(1, Number(people)));
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="合計金額">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
          />
        </Field>
        <Field label="人数">
          <input
            className={inputClass}
            type="number"
            min="1"
            value={people}
            onChange={(event) => setPeople(event.target.value)}
          />
        </Field>
      </div>
      <Result>1人あたり {perPerson.toLocaleString()} 円</Result>
      <p className="mt-3 text-center text-sm text-slate-500">
        端数は切り上げています。
      </p>
    </Card>
  );
}

export function GasScreen() {
  const [distance, setDistance] = useState("300");
  const [efficiency, setEfficiency] = useState("15");
  const [price, setPrice] = useState("175");
  const liters = Number(distance) / Math.max(0.1, Number(efficiency));
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="走行距離（km）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          />
        </Field>
        <Field label="燃費（km/L）">
          <input
            className={inputClass}
            type="number"
            min="0.1"
            value={efficiency}
            onChange={(event) => setEfficiency(event.target.value)}
          />
        </Field>
        <Field label="ガソリン単価（円/L）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        ガソリン代 約 {Math.round(liters * Number(price)).toLocaleString()} 円
      </Result>
      <p className="mt-3 text-center text-sm text-slate-500">
        使用量：約 {liters.toFixed(1)} L
      </p>
    </Card>
  );
}

export function ElectricityScreen() {
  const [watts, setWatts] = useState("100");
  const [hours, setHours] = useState("8");
  const [days, setDays] = useState("30");
  const [rate, setRate] = useState("31");
  const kwh = (Number(watts) * Number(hours) * Number(days)) / 1000;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="消費電力（W）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={watts}
            onChange={(event) => setWatts(event.target.value)}
          />
        </Field>
        <Field label="1日の使用時間">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </Field>
        <Field label="使用日数 / 月">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </Field>
        <Field label="電気単価（円/kWh）">
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
        月額 約 {Math.round(kwh * Number(rate)).toLocaleString()} 円
      </Result>
      <p className="mt-3 text-center text-sm text-slate-500">
        月間使用量：約 {kwh.toFixed(1)} kWh
      </p>
    </Card>
  );
}
