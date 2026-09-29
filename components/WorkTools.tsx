"use client";

import { useState } from "react";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}

export function TakeHomePayScreen() {
  const [base, setBase] = useState("570000");
  const [overtime, setOvertime] = useState("0");
  const [transport, setTransport] = useState("0");
  const [social, setSocial] = useState("82114");
  const [tax, setTax] = useState("25740");
  const gross = Number(base) + Number(overtime) + Number(transport);
  const takeHome = gross - Number(social) - Number(tax);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="基本給">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={base}
            onChange={(event) => setBase(event.target.value)}
          />
        </Field>
        <Field label="残業代">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={overtime}
            onChange={(event) => setOvertime(event.target.value)}
          />
        </Field>
        <Field label="交通費">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={transport}
            onChange={(event) => setTransport(event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="社会保険料合計">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={social}
            onChange={(event) => setSocial(event.target.value)}
          />
        </Field>
        <Field label="税金合計">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={tax}
            onChange={(event) => setTax(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">差引支給額（手取り）</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={takeHome} />
        </div>
      </Result>
    </Card>
  );
}
function salaryDeduction(income: number) {
  if (income <= 1625000) return 550000;
  if (income <= 1800000) return income * 0.4 - 100000;
  if (income <= 3600000) return income * 0.3 + 80000;
  if (income <= 6600000) return income * 0.2 + 440000;
  if (income <= 8500000) return income * 0.1 + 1100000;
  return 1950000;
}
function incomeTax(taxable: number) {
  if (taxable <= 1950000) return taxable * 0.05;
  if (taxable <= 3300000) return taxable * 0.1 - 97500;
  if (taxable <= 6950000) return taxable * 0.2 - 427500;
  if (taxable <= 9000000) return taxable * 0.23 - 636000;
  return taxable * 0.33 - 1536000;
}

export function SalaryTakeHomeScreen() {
  const [annual, setAnnual] = useState("5000000");
  const [age, setAge] = useState("30");
  const [prefecture, setPrefecture] = useState("東京都");
  const gross = Math.max(0, Number(annual) || 0);
  const social = gross * (prefecture === "東京都" ? 0.1465 : 0.146);
  const tax = incomeTax(
    Math.max(0, gross - salaryDeduction(gross) - 480000 - social),
  );
  const residentTax =
    Math.max(0, gross - salaryDeduction(gross) - 430000) * 0.1 + 5000;
  const takeHome = Math.max(0, gross - social - tax - residentTax);
  return (
    <Card>
      <p className="text-sm font-bold text-blue-600">給与シミュレーション</p>
      <h2 className="mt-1 text-xl font-black">年収から手取りを計算</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Field label="年収（総支給）">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={annual}
            onChange={(event) => setAnnual(event.target.value)}
          />
        </Field>
        <Field label="年齢">
          <input
            className={inputClass}
            type="number"
            min="16"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </Field>
        <Field label="都道府県">
          <select
            className={inputClass}
            value={prefecture}
            onChange={(event) => setPrefecture(event.target.value)}
          >
            <option>東京都</option>
            <option>大阪府</option>
            <option>神奈川県</option>
            <option>その他</option>
          </select>
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">月の手取り目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={takeHome / 12} />
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        税金・社会保険料を単純化した概算です。実際の金額は給与明細を確認してください。
      </p>
    </Card>
  );
}

export function PensionScreen() {
  const [monthly, setMonthly] = useState("350000");
  const result = Math.max(0, Number(monthly) || 0) * 0.0915;
  return (
    <Card>
      <Field label="標準報酬月額の目安">
        <input
          className={inputClass}
          type="number"
          min="0"
          value={monthly}
          onChange={(event) => setMonthly(event.target.value)}
        />
      </Field>
      <Result>
        <div className="text-sm text-slate-500">
          厚生年金保険料（本人負担目安）
        </div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={result} />
        </div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        本人負担率9.15%による概算です。
      </p>
    </Card>
  );
}

export function EmploymentInsuranceScreen() {
  const [monthly, setMonthly] = useState("350000");
  const [rate, setRate] = useState("0.55");
  const result = (Number(monthly) * Number(rate)) / 100;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="月の賃金">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
          />
        </Field>
        <Field label="労働者負担率（%）">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        <div className="text-sm text-slate-500">雇用保険料目安</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={result} />
        </div>
      </Result>
    </Card>
  );
}

export function OvertimeScreen() {
  const [hourly, setHourly] = useState("1500");
  const [hours, setHours] = useState("10");
  const [rate, setRate] = useState("1.25");
  const result = Number(hourly) * Number(hours) * Number(rate);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="通常時給">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={hourly}
            onChange={(event) => setHourly(event.target.value)}
          />
        </Field>
        <Field label="残業時間">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </Field>
        <Field label="割増率">
          <select
            className={inputClass}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          >
            <option value="1.25">1.25倍</option>
            <option value="1.35">1.35倍</option>
            <option value="1.5">1.50倍</option>
          </select>
        </Field>
      </div>
      <Result>
        <Money value={result} />
      </Result>
    </Card>
  );
}

export function HourlyWageScreen() {
  const [monthly, setMonthly] = useState("300000");
  const [hours, setHours] = useState("160");
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="月給">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
          />
        </Field>
        <Field label="月の勤務時間">
          <input
            className={inputClass}
            type="number"
            min="1"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        時給目安 <Money value={Number(monthly) / Math.max(1, Number(hours))} />
      </Result>
    </Card>
  );
}

export function AnnualMonthlyScreen() {
  const [annual, setAnnual] = useState("5000000");
  const [bonus, setBonus] = useState("0");
  const monthly = (Number(annual) - Number(bonus)) / 12;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="年収">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={annual}
            onChange={(event) => setAnnual(event.target.value)}
          />
        </Field>
        <Field label="年間ボーナス">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={bonus}
            onChange={(event) => setBonus(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        月収目安 <Money value={monthly} />
      </Result>
    </Card>
  );
}

export function WorkPremiumScreen({
  type,
}: {
  type: "hours" | "night" | "holiday";
}) {
  const [hourly, setHourly] = useState("1500");
  const [hours, setHours] = useState("10");
  const [days, setDays] = useState("1");
  const totalHours = Number(hours) * Math.max(1, Number(days));
  const multiplier = type === "night" ? 1.5 : type === "holiday" ? 1.35 : 1;
  const result = Number(hourly) * totalHours * multiplier;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="通常時給">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={hourly}
            onChange={(event) => setHourly(event.target.value)}
          />
        </Field>
        <Field label={type === "hours" ? "1日の残業時間" : "1日の勤務時間"}>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </Field>
        <Field label="日数">
          <input
            className={inputClass}
            type="number"
            min="1"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        {type === "hours" ? (
          `${totalHours.toLocaleString()} 時間`
        ) : (
          <Money value={result} />
        )}
      </Result>
    </Card>
  );
}

export function PaidLeaveScreen() {
  const [years, setYears] = useState("3");
  const [used, setUsed] = useState("5");
  const serviceYears = Number(years) || 0;
  const granted =
    serviceYears < 0.5
      ? 0
      : serviceYears < 1.5
        ? 10
        : serviceYears < 2.5
          ? 11
          : serviceYears < 3.5
            ? 12
            : serviceYears < 4.5
              ? 14
              : serviceYears < 5.5
                ? 16
                : serviceYears < 6.5
                  ? 18
                  : 20;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="勤続年数">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.5"
            value={years}
            onChange={(event) => setYears(event.target.value)}
          />
        </Field>
        <Field label="取得済み日数">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={used}
            onChange={(event) => setUsed(event.target.value)}
          />
        </Field>
      </div>
      <Result>
        有給休暇の残日数目安：{Math.max(0, granted - Number(used || 0))}日
      </Result>
    </Card>
  );
}
