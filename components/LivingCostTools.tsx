"use client";

import { useState } from "react";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

function Money({ value }: { value: number }) {
  return <span>¥{Math.round(value).toLocaleString()}</span>;
}

export default function LivingCostScreen({ name }: { name: string }) {
  const isGamingPc = name.includes("ゲーミングPC");
  const isAppliance =
    name.includes("電気代") &&
    !name.includes("年間") &&
    !name.includes("プラン");
  const isUsage = name.includes("消費電力量");
  const isUtility = name.includes("ガス代") || name.includes("水道代");
  const isLiving = name.includes("暮らし生活費") || name === "家族生活費計算";
  const isPlan = name.includes("プラン比較");
  const isSaving = name.includes("削減");
  const isSubscription = name.includes("サブスク");
  const [first, setFirst] = useState(
    isGamingPc
      ? "500"
      : isAppliance
        ? "100"
        : isLiving
          ? "80000"
          : isSaving
            ? "12000"
            : isSubscription
              ? "1500"
              : "20",
  );
  const [second, setSecond] = useState(
    isGamingPc
      ? "50"
      : isLiving
        ? "60000"
        : isUtility
          ? "20"
          : isSaving
            ? "8000"
            : isSubscription
              ? "990"
              : "8",
  );
  const [third, setThird] = useState(
    isGamingPc ? "8" : isUtility ? "180" : isSubscription ? "500" : "30",
  );
  const [fourth, setFourth] = useState(
    isGamingPc ? "30" : isUtility ? "1000" : isSubscription ? "0" : "31",
  );
  const [fifth, setFifth] = useState(isGamingPc ? "31" : "0");
  const number = (input: string) => Math.max(0, Number(input) || 0);
  const planTotalA = number(first) * number(second) + number(fourth);
  const planTotalB = number(first) * number(third) + number(fifth);
  const result = isGamingPc
    ? ((number(first) + number(second)) *
        number(third) *
        number(fourth) *
        number(fifth)) /
      1000
    : isAppliance
      ? (number(first) * number(second) * number(third) * number(fourth)) / 1000
      : isUsage
        ? (number(first) * number(second) * number(third)) / 1000
        : isUtility
          ? number(fourth) + number(second) * number(third)
          : isLiving
            ? number(first) +
              number(second) +
              number(third) +
              number(fourth) +
              number(fifth)
            : isPlan
              ? Math.abs(planTotalA - planTotalB)
              : isSaving
                ? Math.max(0, number(first) - number(second)) * 12
                : isSubscription
                  ? (number(first) +
                      number(second) +
                      number(third) +
                      number(fourth)) *
                    12
                  : number(first) * (name.includes("年間") ? 12 : 1);
  const groups: Record<string, [string, string, (value: string) => void][]> = {
    gaming: [
      ["PC本体の消費電力（W）", first, setFirst],
      ["モニターの消費電力（W）", second, setSecond],
      ["1日の使用時間", third, setThird],
      ["使用日数 / 月", fourth, setFourth],
      ["電気単価（円/kWh）", fifth, setFifth],
    ],
    appliance: [
      ["消費電力（W）", first, setFirst],
      ["1日の使用時間", second, setSecond],
      ["使用日数 / 月", third, setThird],
      ["電気単価（円/kWh）", fourth, setFourth],
    ],
    usage: [
      ["消費電力（W）", first, setFirst],
      ["使用時間 / 日", second, setSecond],
      ["使用日数", third, setThird],
    ],
    utility: [
      ["使用量（m³）", second, setSecond],
      ["従量料金", third, setThird],
      ["基本料金", fourth, setFourth],
    ],
    living: [
      ["住居費", first, setFirst],
      ["食費", second, setSecond],
      ["光熱費", third, setThird],
      ["通信費", fourth, setFourth],
      ["その他", fifth, setFifth],
    ],
    plan: [
      ["使用量（kWh）", first, setFirst],
      ["プランA単価（円/kWh）", second, setSecond],
      ["プランB単価（円/kWh）", third, setThird],
      ["A基本料金", fourth, setFourth],
      ["B基本料金", fifth, setFifth],
    ],
    saving: [
      ["削減前の月額", first, setFirst],
      ["削減後の月額", second, setSecond],
    ],
    subscription: [
      ["サブスク①（月額）", first, setFirst],
      ["サブスク②（月額）", second, setSecond],
      ["サブスク③（月額）", third, setThird],
      ["サブスク④（月額）", fourth, setFourth],
    ],
    default: [["月額", first, setFirst]],
  };
  const group = isGamingPc
    ? "gaming"
    : isAppliance
      ? "appliance"
      : isUsage
        ? "usage"
        : isUtility
          ? "utility"
          : isLiving
            ? "living"
            : isPlan
              ? "plan"
              : isSaving
                ? "saving"
                : isSubscription
                  ? "subscription"
                  : "default";
  const caption = isPlan
    ? `安いのは${planTotalA <= planTotalB ? "プランA" : "プランB"}（差額）`
    : isSaving
      ? "年間の削減額"
      : isSubscription
        ? "サブスクの年間費用"
        : name;
  return (
    <Card>
      <div className="border-b border-slate-100 pb-5">
        <p className="text-sm font-bold text-blue-600">生活費・光熱費</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">{name}</h2>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups[group].map(([label, current, setter]) => (
          <Field key={label} label={label}>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={current}
              onChange={(event) => setter(event.target.value)}
            />
          </Field>
        ))}
      </div>
      <Result>
        <div className="text-sm text-slate-500">{caption}</div>
        <div className="mt-1 text-3xl text-blue-700">
          <Money value={result} />
        </div>
      </Result>
      {isPlan && (
        <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 text-left">
          <div className="flex items-baseline justify-between px-4 py-2.5">
            <dt className="text-sm text-slate-600">プランAの合計</dt>
            <dd className="text-sm font-bold text-slate-900">
              <Money value={planTotalA} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between px-4 py-2.5">
            <dt className="text-sm text-slate-600">プランBの合計</dt>
            <dd className="text-sm font-bold text-slate-900">
              <Money value={planTotalB} />
            </dd>
          </div>
        </dl>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        入力した単価・料金による概算です。地域・契約プランで実額は変わります。
      </p>
    </Card>
  );
}
