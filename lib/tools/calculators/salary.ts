import {
  INSURANCE_RATES,
  RESIDENT_TAX,
  basicDeductionIncomeTax,
  basicDeductionResidentTax,
  employmentIncome,
  healthStandardRemuneration,
  incomeTaxFromTaxable,
  pensionStandardRemuneration,
  reconstructionTax,
} from "./data";

export type SocialInsuranceMonthly = {
  healthGrade: number;
  healthStandard: number;
  pensionGrade: number;
  pensionStandard: number;
  health: number;
  care: number;
  pension: number;
  employment: number;
  total: number;
};

/** 月額報酬から本人負担の社会保険料を求める */
export function socialInsuranceMonthly(
  monthlyPay: number,
  over40: boolean,
): SocialInsuranceMonthly {
  const health = healthStandardRemuneration(monthlyPay);
  const pension = pensionStandardRemuneration(monthlyPay);
  const healthPremium = (health.standard * INSURANCE_RATES.health) / 2;
  const care = over40
    ? (health.standard * INSURANCE_RATES.longTermCare) / 2
    : 0;
  const pensionPremium = (pension.standard * INSURANCE_RATES.pension) / 2;
  const employment = monthlyPay * INSURANCE_RATES.employmentEmployee;
  return {
    healthGrade: health.grade,
    healthStandard: health.standard,
    pensionGrade: pension.grade,
    pensionStandard: pension.standard,
    health: healthPremium,
    care,
    pension: pensionPremium,
    employment,
    total: healthPremium + care + pensionPremium + employment,
  };
}

export type SalaryBreakdown = {
  revenue: number;
  deduction: number;
  income: number;
  socialInsurance: number;
  basicDeduction: number;
  dependentDeduction: number;
  taxableIncome: number;
  incomeTaxBase: number;
  reconstruction: number;
  incomeTax: number;
  residentTax: number;
  netAnnual: number;
  netMonthly: number;
};

/** 扶養控除（一般の控除対象扶養親族・所得税38万／住民税33万） */
export const DEPENDENT_DEDUCTION = { incomeTax: 380_000, residentTax: 330_000 };

/** 年収から年間の税・社会保険料・手取りを概算する */
export function salaryBreakdown(
  annualRevenue: number,
  options: {
    over40?: boolean;
    dependents?: number;
    bonusMonths?: number;
    extraDeduction?: number;
  } = {},
): SalaryBreakdown {
  const revenue = Math.max(0, annualRevenue);
  const over40 = options.over40 ?? false;
  const dependents = Math.max(0, options.dependents ?? 0);
  const bonusMonths = Math.max(0, options.bonusMonths ?? 0);
  const extraDeduction = Math.max(0, options.extraDeduction ?? 0);

  const monthlyPay = revenue / (12 + bonusMonths);
  const monthly = socialInsuranceMonthly(monthlyPay, over40);
  // 賞与分は標準賞与額に同率が掛かるため、実質的に年収全体へ同率が掛かるとみなす
  const bonusTotal = monthlyPay * bonusMonths;
  const bonusInsurance =
    bonusTotal *
    (INSURANCE_RATES.health / 2 +
      (over40 ? INSURANCE_RATES.longTermCare / 2 : 0) +
      INSURANCE_RATES.pension / 2 +
      INSURANCE_RATES.employmentEmployee);
  const socialInsurance = monthly.total * 12 + bonusInsurance;

  const income = employmentIncome(revenue);
  const basicDeduction = basicDeductionIncomeTax(income);
  const dependentDeduction = dependents * DEPENDENT_DEDUCTION.incomeTax;
  const taxableIncome = Math.max(
    0,
    income -
      socialInsurance -
      basicDeduction -
      dependentDeduction -
      extraDeduction,
  );
  const incomeTaxBase = incomeTaxFromTaxable(taxableIncome);
  const reconstruction = reconstructionTax(incomeTaxBase);
  const incomeTax = incomeTaxBase + reconstruction;

  const residentBasic = basicDeductionResidentTax(income);
  const residentTaxable = Math.max(
    0,
    income -
      socialInsurance -
      residentBasic -
      dependents * DEPENDENT_DEDUCTION.residentTax -
      extraDeduction,
  );
  const adjustment =
    residentTaxable > 0 ? RESIDENT_TAX.basicDeductionGap * 0.05 : 0;
  const residentTax =
    residentTaxable > 0
      ? Math.max(0, residentTaxable * RESIDENT_TAX.incomeRate - adjustment) +
        RESIDENT_TAX.perCapita +
        RESIDENT_TAX.forestTax
      : 0;

  const netAnnual = revenue - socialInsurance - incomeTax - residentTax;
  return {
    revenue,
    deduction: revenue - income,
    income,
    socialInsurance,
    basicDeduction,
    dependentDeduction,
    taxableIncome,
    incomeTaxBase,
    reconstruction,
    incomeTax,
    residentTax,
    netAnnual,
    netMonthly: netAnnual / 12,
  };
}

/** 手取り年収から額面年収を逆算する（二分探索） */
export function grossFromNet(
  targetNet: number,
  options: Parameters<typeof salaryBreakdown>[1] = {},
): number {
  if (targetNet <= 0) return 0;
  let low = targetNet;
  let high = Math.max(targetNet * 3, 1_000_000);
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (salaryBreakdown(mid, options).netAnnual < targetNet) low = mid;
    else high = mid;
  }
  return Math.round((low + high) / 2);
}
