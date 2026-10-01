export type CalcFieldType = "number" | "date" | "select" | "time";

export type CalcField = {
  key: string;
  label: string;
  type: CalcFieldType;
  defaultValue: string;
  suffix?: string;
  step?: string;
  min?: string;
  options?: { value: string; label: string }[];
  hint?: string;
};

export type CalcOutput = {
  label: string;
  value: string;
  primary?: boolean;
  note?: string;
};

export type CalcInputs = {
  num: (key: string) => number;
  int: (key: string) => number;
  raw: (key: string) => string;
  date: (key: string) => Date | null;
  /** "HH:MM" を0時からの分数に変換。未入力・不正値は0 */
  minutes: (key: string) => number;
};

export type CalculatorSpec = {
  title: string;
  lead: string;
  fields: CalcField[];
  compute: (input: CalcInputs) => CalcOutput[];
  note?: string;
  sources?: { label: string; url: string }[];
};

export const yen = (value: number) =>
  `¥${Math.round(value).toLocaleString("ja-JP")}`;

export const yen1 = (value: number) =>
  `¥${(Math.round(value * 10) / 10).toLocaleString("ja-JP", {
    maximumFractionDigits: 1,
  })}`;

export const pct = (value: number, digits = 2) =>
  `${Number.isFinite(value) ? value.toFixed(digits) : "0.00"}%`;

export const num = (value: number, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString("ja-JP", { maximumFractionDigits: digits })
    : "0";

export const days = (value: number) => `${num(value)}日`;
export const hours = (value: number, digits = 2) => `${num(value, digits)}時間`;

/** 金額系フィールドの共通定義 */
export const moneyField = (
  key: string,
  label: string,
  defaultValue: string,
  hint?: string,
): CalcField => ({
  key,
  label,
  type: "number",
  defaultValue,
  suffix: "円",
  step: "1000",
  min: "0",
  hint,
});

export const rateField = (
  key: string,
  label: string,
  defaultValue: string,
  hint?: string,
): CalcField => ({
  key,
  label,
  type: "number",
  defaultValue,
  suffix: "%",
  step: "0.1",
  min: "0",
  hint,
});

export const countField = (
  key: string,
  label: string,
  defaultValue: string,
  suffix = "",
  hint?: string,
): CalcField => ({
  key,
  label,
  type: "number",
  defaultValue,
  suffix,
  step: "1",
  min: "0",
  hint,
});

export const decimalField = (
  key: string,
  label: string,
  defaultValue: string,
  suffix = "",
  hint?: string,
): CalcField => ({
  key,
  label,
  type: "number",
  defaultValue,
  suffix,
  step: "0.1",
  min: "0",
  hint,
});

export const dateField = (
  key: string,
  label: string,
  defaultValue: string,
  hint?: string,
): CalcField => ({ key, label, type: "date", defaultValue, hint });

export const timeField = (
  key: string,
  label: string,
  defaultValue: string,
  hint?: string,
): CalcField => ({ key, label, type: "time", defaultValue, hint });

export const selectField = (
  key: string,
  label: string,
  defaultValue: string,
  options: { value: string; label: string }[],
  hint?: string,
): CalcField => ({ key, label, type: "select", defaultValue, options, hint });

export const NTA = "https://www.nta.go.jp";
export const sourceIncomeDeduction = {
  label: "国税庁 給与所得控除",
  url: `${NTA}/taxes/shiraberu/taxanswer/shotoku/1410.htm`,
};
export const sourceIncomeTaxRate = {
  label: "国税庁 所得税の税率",
  url: `${NTA}/taxes/shiraberu/taxanswer/shotoku/2260.htm`,
};
export const sourceBasicDeduction = {
  label: "国税庁 基礎控除",
  url: `${NTA}/taxes/shiraberu/taxanswer/shotoku/1199.htm`,
};
export const sourcePension = {
  label: "日本年金機構",
  url: "https://www.nenkin.go.jp/",
};
export const sourceKenpo = {
  label: "協会けんぽ 保険料額表",
  url: "https://www.kyoukaikenpo.or.jp/g7/",
};
export const sourceMHLW = {
  label: "厚生労働省",
  url: "https://www.mhlw.go.jp/",
};
