"use client";

import { useState } from "react";
import JapaneseDatePicker from "@/components/DatePicker";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}

export function ChildcareBenefitScreen() {
  const [salary, setSalary] = useState("300000");
  const [months, setMonths] = useState("6");
  const monthly = Math.max(0, Number(salary) || 0),
    period = Math.max(0, Number(months) || 0);
  const benefit = monthly * period * (period <= 6 ? 0.67 : 0.5);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="休業開始前の月額賃金">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={salary}
            onChange={(event) => setSalary(event.target.value)}
          />
        </Field>
        <Field label="給付対象月数">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={months}
            onChange={(event) => setMonths(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">育児休業給付の目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={benefit} />
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        開始から180日までは67%、以降は50%とした概算です。
      </p>
    </Card>
  );
}

export function ChildAllowanceScreen() {
  const [children, setChildren] = useState("1");
  const [age, setAge] = useState("2");
  const count = Math.max(0, Number(children) || 0),
    childAge = Math.max(0, Number(age) || 0);
  const perChild = childAge < 3 ? 15000 : childAge < 18 ? 10000 : 0;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="対象児童数">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={children}
            onChange={(event) => setChildren(event.target.value)}
          />
        </Field>
        <Field label="児童の年齢">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">児童手当（月額目安）</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={perChild * count} />
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        所得要件、第3子以降の加算、制度改定は含まない簡易計算です。
      </p>
    </Card>
  );
}

export function MaternityStartScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [dueDate, setDueDate] = useState(today);
  const [birthType, setBirthType] = useState("single");
  const date = new Date(`${dueDate}T00:00:00`);
  date.setDate(date.getDate() - (birthType === "multiple" ? 98 : 42));
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="出産予定日">
          <JapaneseDatePicker value={dueDate} onChange={setDueDate} />
        </Field>
        <Field label="出産区分">
          <select
            className={inputClass}
            value={birthType}
            onChange={(event) => setBirthType(event.target.value)}
          >
            <option value="single">単胎</option>
            <option value="multiple">多胎（双子以上）</option>
          </select>
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">産前休業の開始日</div>
        <div className="mt-1 text-3xl text-blue-700">
          {date.toLocaleDateString("ja-JP")}
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        単胎は42日前、多胎は98日前を目安に計算します。
      </p>
    </Card>
  );
}
