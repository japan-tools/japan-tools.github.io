import { carCalculators } from "./car";
import { dateCalculators } from "./date";
import { familyCalculators } from "./family";
import { housingCalculators } from "./housing";
import { moneyCalculators } from "./money";
import { workCalculators } from "./work";
import type { CalculatorSpec } from "./types";

const catalogSpecs: Record<string, CalculatorSpec> = {
  ...workCalculators,
  ...housingCalculators,
  ...carCalculators,
  ...dateCalculators,
  ...familyCalculators,
  ...moneyCalculators,
};

/**
 * 同じ内容の専用スラッグをカタログの計算ロジックに統合する。
 * 重複ページで計算結果が食い違うのを防ぐ。
 */
const aliases: Record<string, string> = {
  "take-home-pay": "catalog-1",
  "salary-take-home": "catalog-2",
  "income-tax": "catalog-11",
  "resident-tax": "catalog-15",
  "social-insurance": "catalog-26",
  "pension-premium": "catalog-28",
  "employment-insurance": "catalog-29",
  "annual-monthly": "catalog-5",
  "overtime-hours": "catalog-49",
  "overtime-pay": "catalog-50",
  "night-overtime": "catalog-51",
  "holiday-work": "catalog-52",
  "paid-leave": "catalog-56",
  "service-years": "catalog-58",
  "hourly-wage": "catalog-63",
  "rent-income-ratio": "catalog-67",
  "rent-initial-cost": "catalog-68",
  "deposit-key-money": "catalog-69",
  "moving-cost": "catalog-71",
  mortgage: "catalog-72",
  "car-ownership": "catalog-89",
  "gas-cost": "catalog-90",
  "commuter-pass": "catalog-100",
  "age-calculator": "catalog-106",
  "date-add-subtract": "catalog-117",
  "date-difference": "catalog-121",
  "business-days": "catalog-122",
  "due-date": "catalog-126",
  "pregnancy-weeks": "catalog-127",
  "maternity-start-date": "catalog-128",
  "maternity-leave": "catalog-128",
  "parental-leave": "catalog-129",
  "child-allowance": "catalog-130",
  "childcare-benefit": "catalog-39",
  "baby-age": "catalog-134",
  "nursery-age": "catalog-136",
  "discount-calculator": "catalog-146",
  "tax-calculator": "catalog-147",
  "split-bill": "catalog-149",
};

export function getCalculatorSpec(slug: string): CalculatorSpec | null {
  const target = aliases[slug] ?? slug;
  return catalogSpecs[target] ?? null;
}

export const calculatorSlugs = new Set([
  ...Object.keys(catalogSpecs),
  ...Object.keys(aliases),
]);

export type { CalculatorSpec };
