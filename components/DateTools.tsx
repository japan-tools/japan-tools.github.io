"use client";

import { useMemo, useState } from "react";
import JapaneseDatePicker from "@/components/DatePicker";
import { Card, Field, Result, inputClass } from "@/components/ToolPrimitives";

export function AgeScreen() {
  const [birth, setBirth] = useState("1990-01-01");
  const [base, setBase] = useState(new Date().toISOString().slice(0, 10));
  const result = useMemo(() => {
    const birthDate = new Date(`${birth}T00:00:00`),
      baseDate = new Date(`${base}T00:00:00`);
    if (
      Number.isNaN(birthDate.getTime()) ||
      Number.isNaN(baseDate.getTime()) ||
      baseDate < birthDate
    )
      return null;
    let years = baseDate.getFullYear() - birthDate.getFullYear();
    let months = baseDate.getMonth() - birthDate.getMonth();
    let days = baseDate.getDate() - birthDate.getDate();
    if (days < 0) {
      months--;
      days += new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        0,
      ).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}歳 ${months}か月 ${days}日`;
  }, [birth, base]);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="生年月日">
          <JapaneseDatePicker value={birth} onChange={setBirth} />
        </Field>
        <Field label="基準日">
          <JapaneseDatePicker value={base} onChange={setBase} />
        </Field>
      </div>
      <Result>{result ?? "日付を確認してください"}</Result>
    </Card>
  );
}

export function DateDifferenceScreen() {
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const days = Math.round(
    (new Date(`${end}T00:00:00`).getTime() -
      new Date(`${start}T00:00:00`).getTime()) /
      86400000,
  );
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="開始日">
          <JapaneseDatePicker value={start} onChange={setStart} />
        </Field>
        <Field label="終了日">
          <JapaneseDatePicker value={end} onChange={setEnd} />
        </Field>
      </div>
      <Result>{days >= 0 ? `${days}日` : `-${Math.abs(days)}日`}</Result>
      <p className="mt-3 text-xs text-slate-500">
        開始日を0日目として計算します。
      </p>
    </Card>
  );
}

export function DateAddScreen() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState("30");
  const [mode, setMode] = useState("add");
  const result = useMemo(() => {
    const value = new Date(`${date}T00:00:00`);
    value.setDate(
      value.getDate() + (mode === "add" ? Number(days) : -Number(days)),
    );
    return Number.isNaN(value.getTime())
      ? ""
      : value.toISOString().slice(0, 10);
  }, [date, days, mode]);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="基準日">
          <JapaneseDatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="日数">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </Field>
        <Field label="計算">
          <select
            className={inputClass}
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="add">○日後</option>
            <option value="sub">○日前</option>
          </select>
        </Field>
      </div>
      <Result>{result}</Result>
    </Card>
  );
}

export function BusinessDaysScreen() {
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const count = useMemo(() => {
    let from = new Date(`${start}T00:00:00`),
      to = new Date(`${end}T00:00:00`);
    if (from > to) [from, to] = [to, from];
    let total = 0;
    for (const day = new Date(from); day <= to; day.setDate(day.getDate() + 1))
      if (day.getDay() !== 0 && day.getDay() !== 6) total++;
    return total;
  }, [start, end]);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="開始日">
          <JapaneseDatePicker value={start} onChange={setStart} />
        </Field>
        <Field label="終了日">
          <JapaneseDatePicker value={end} onChange={setEnd} />
        </Field>
      </div>
      <Result>{count}営業日</Result>
      <p className="mt-3 text-xs text-slate-500">土日を除いた営業日数です。</p>
    </Card>
  );
}

export function DateUtilityScreen({
  type,
}: {
  type:
    | "service"
    | "resignation"
    | "maternity"
    | "due"
    | "pregnancy"
    | "baby"
    | "nursery"
    | "leave"
    | "month-edge"
    | "era"
    | "zodiac";
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(
    type === "era" || type === "zodiac"
      ? "1990"
      : type === "maternity" || type === "pregnancy" || type === "month-edge"
        ? today
        : "2023-04-01",
  );
  const [base, setBase] = useState(today);
  const parsed = new Date(
      `${date.length === 7 ? `${date}-01` : date}T00:00:00`,
    ),
    reference = new Date(`${base}T00:00:00`);
  const addDays = (amount: number) => {
    const result = new Date(parsed);
    result.setDate(result.getDate() + amount);
    return result.toLocaleDateString("ja-JP");
  };
  const year = Math.max(1, Number(date) || 1);
  const zodiac = [
    "申",
    "酉",
    "戌",
    "亥",
    "子",
    "丑",
    "寅",
    "卯",
    "辰",
    "巳",
    "午",
    "未",
  ];
  const era =
    year >= 2019
      ? `令和${year - 2018}年`
      : year >= 1989
        ? `平成${year - 1988}年`
        : year >= 1926
          ? `昭和${year - 1925}年`
          : `${year}年`;
  const days = Math.floor((reference.getTime() - parsed.getTime()) / 86400000);
  const result =
    type === "service"
      ? `${Math.max(0, Math.floor(days / 365.2425))}年`
      : type === "resignation"
        ? addDays(14)
        : type === "maternity"
          ? `${addDays(-42)} 〜 ${addDays(56)}`
          : type === "due"
            ? addDays(280)
            : type === "pregnancy"
              ? `${Math.max(0, Math.floor(days / 7))}週 ${Math.max(0, days % 7)}日`
              : type === "baby"
                ? `${Math.max(0, Math.floor(days / 30.44))}か月`
                : type === "nursery"
                  ? `${reference.getFullYear() - parsed.getFullYear()}歳`
                  : type === "leave"
                    ? `${parsed.toLocaleDateString("ja-JP")} 〜 ${addDays(365)}`
                    : type === "month-edge"
                      ? `${new Date(parsed.getFullYear(), parsed.getMonth(), 1).toLocaleDateString("ja-JP")} 〜 ${new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).toLocaleDateString("ja-JP")}`
                      : type === "era"
                        ? era
                        : `${year}年は${zodiac[year % 12]}年`;
  const label =
    type === "era" || type === "zodiac"
      ? "西暦"
      : type === "month-edge"
        ? "年月"
        : type === "due" || type === "pregnancy"
          ? "最終月経開始日"
          : type === "maternity"
            ? "出産予定日"
            : "対象日";
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={label}>
          {type === "era" || type === "zodiac" ? (
            <input
              className={inputClass}
              type="number"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          ) : (
            <JapaneseDatePicker value={date} onChange={setDate} />
          )}
        </Field>
        {!["era", "zodiac", "month-edge", "maternity", "due", "leave"].includes(
          type,
        ) && (
          <Field label="基準日">
            <JapaneseDatePicker value={base} onChange={setBase} />
          </Field>
        )}
      </div>
      <Result>
        <div className="text-sm text-slate-500">計算結果</div>
        <div className="mt-1 text-2xl text-blue-700">{result}</div>
      </Result>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        制度上の扱いは用途により異なるため、公的な案内をご確認ください。
      </p>
    </Card>
  );
}

export function HolidayScreen() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const day = new Date(`${date}T00:00:00`);
  const nthMonday = (month: number, nth: number) =>
    1 +
    ((8 - new Date(day.getFullYear(), month, 1).getDay()) % 7) +
    (nth - 1) * 7;
  const fixed: Record<string, string> = {
    "1-1": "元日",
    "2-11": "建国記念の日",
    "2-23": "天皇誕生日",
    "4-29": "昭和の日",
    "5-3": "憲法記念日",
    "5-4": "みどりの日",
    "5-5": "こどもの日",
    "8-11": "山の日",
    "11-3": "文化の日",
    "11-23": "勤労感謝の日",
  };
  const key = `${day.getMonth() + 1}-${day.getDate()}`;
  const holiday =
    fixed[key] ??
    (day.getMonth() === 0 && day.getDate() === nthMonday(0, 2)
      ? "成人の日"
      : day.getMonth() === 6 && day.getDate() === nthMonday(6, 3)
        ? "海の日"
        : day.getMonth() === 8 && day.getDate() === nthMonday(8, 3)
          ? "敬老の日"
          : day.getMonth() === 9 && day.getDate() === nthMonday(9, 2)
            ? "スポーツの日"
            : "");
  return (
    <Card>
      <Field label="確認したい日">
        <JapaneseDatePicker value={date} onChange={setDate} />
      </Field>
      <Result>
        <div className="text-sm text-slate-500">祝日判定</div>
        <div className="mt-1 text-3xl text-blue-700">
          {holiday || "祝日ではありません"}
        </div>
      </Result>
      <p className="mt-4 text-xs text-slate-500">
        主な国民の祝日を判定します。
      </p>
    </Card>
  );
}
