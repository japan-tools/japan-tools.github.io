/**
 * 税・社会保険の参照データ。年度改正時はこのファイルだけを更新する。
 * 基準年度: 令和7年度 (2025年度)
 */

export const FISCAL_YEAR = "令和7年度（2025年度）";

/** 給与所得控除（令和7年分以降） */
export function employmentIncomeDeduction(revenue: number): number {
  if (revenue <= 0) return 0;
  if (revenue <= 1_900_000) return Math.min(revenue, 650_000);
  if (revenue <= 3_600_000) return revenue * 0.3 + 80_000;
  if (revenue <= 6_600_000) return revenue * 0.2 + 440_000;
  if (revenue <= 8_500_000) return revenue * 0.1 + 1_100_000;
  return 1_950_000;
}

/** 給与所得金額 = 収入 − 給与所得控除 */
export function employmentIncome(revenue: number): number {
  return Math.max(0, revenue - employmentIncomeDeduction(revenue));
}

/** 基礎控除（所得税・令和7年分。令和7/8年分の上乗せ特例を含む） */
export function basicDeductionIncomeTax(totalIncome: number): number {
  if (totalIncome <= 1_320_000) return 950_000;
  if (totalIncome <= 3_360_000) return 880_000;
  if (totalIncome <= 4_890_000) return 680_000;
  if (totalIncome <= 6_550_000) return 630_000;
  if (totalIncome <= 23_500_000) return 580_000;
  if (totalIncome <= 24_000_000) return 580_000;
  if (totalIncome <= 24_500_000) return 320_000;
  if (totalIncome <= 25_000_000) return 160_000;
  return 0;
}

/** 基礎控除（住民税） */
export function basicDeductionResidentTax(totalIncome: number): number {
  if (totalIncome <= 24_000_000) return 430_000;
  if (totalIncome <= 24_500_000) return 290_000;
  if (totalIncome <= 25_000_000) return 150_000;
  return 0;
}

/** 所得税の速算表 */
const INCOME_TAX_BRACKETS: [limit: number, rate: number, deduction: number][] =
  [
    [1_949_000, 0.05, 0],
    [3_299_000, 0.1, 97_500],
    [6_949_000, 0.2, 427_500],
    [8_999_000, 0.23, 636_000],
    [17_999_000, 0.33, 1_536_000],
    [39_999_000, 0.4, 2_796_000],
    [Infinity, 0.45, 4_796_000],
  ];

/** 課税所得（1,000円未満切捨て）から所得税額（復興特別所得税を除く） */
export function incomeTaxFromTaxable(taxableIncome: number): number {
  const base = Math.floor(Math.max(0, taxableIncome) / 1000) * 1000;
  const bracket = INCOME_TAX_BRACKETS.find(([limit]) => base <= limit)!;
  return Math.max(0, base * bracket[1] - bracket[2]);
}

/** 課税所得に対する限界税率 */
export function marginalIncomeTaxRate(taxableIncome: number): number {
  const base = Math.max(0, taxableIncome);
  return INCOME_TAX_BRACKETS.find(([limit]) => base <= limit)![1];
}

/** 復興特別所得税率 */
export const RECONSTRUCTION_TAX_RATE = 0.021;

export function reconstructionTax(baseIncomeTax: number): number {
  return Math.max(0, baseIncomeTax) * RECONSTRUCTION_TAX_RATE;
}

/** 住民税 */
export const RESIDENT_TAX = {
  incomeRate: 0.1,
  cityRate: 0.06,
  prefectureRate: 0.04,
  /** 均等割（市町村3,500 + 道府県1,500） */
  perCapita: 5_000,
  /** 森林環境税（国税・住民税と併せて徴収） */
  forestTax: 1_000,
  /** 調整控除の簡易計算に使う人的控除差額（基礎控除分） */
  basicDeductionGap: 50_000,
};

/** 社会保険料率（協会けんぽ全国平均ベース・労使折半前の総額） */
export const INSURANCE_RATES = {
  /** 健康保険（総額）。都道府県により 9.3%〜10.7% 程度 */
  health: 0.1,
  /** 介護保険第2号（40〜64歳・総額） */
  longTermCare: 0.0159,
  /** 厚生年金（総額） */
  pension: 0.183,
  /** 雇用保険 労働者負担（一般の事業） */
  employmentEmployee: 0.0055,
  /** 雇用保険 事業主負担（一般の事業） */
  employmentEmployer: 0.009,
};

/** 国民年金保険料（月額） */
export const NATIONAL_PENSION_MONTHLY = 17_510;
/** 付加保険料（月額） */
export const ADDITIONAL_PENSION_MONTHLY = 400;
/** 老齢基礎年金 満額（年額・令和7年度 68歳以下） */
export const BASIC_PENSION_FULL_YEAR = 831_700;
/** 老齢基礎年金の納付上限月数（40年） */
export const PENSION_FULL_MONTHS = 480;

/** 厚生年金 標準報酬月額（等級1〜32）の下限報酬と標準報酬月額 */
const PENSION_GRADES: [lowerBound: number, standard: number][] = [
  [0, 88_000],
  [93_000, 98_000],
  [101_000, 104_000],
  [107_000, 110_000],
  [114_000, 118_000],
  [122_000, 126_000],
  [130_000, 134_000],
  [138_000, 142_000],
  [146_000, 150_000],
  [155_000, 160_000],
  [165_000, 170_000],
  [175_000, 180_000],
  [185_000, 190_000],
  [195_000, 200_000],
  [210_000, 220_000],
  [230_000, 240_000],
  [250_000, 260_000],
  [270_000, 280_000],
  [290_000, 300_000],
  [310_000, 320_000],
  [330_000, 340_000],
  [350_000, 360_000],
  [370_000, 380_000],
  [395_000, 410_000],
  [425_000, 440_000],
  [455_000, 470_000],
  [485_000, 500_000],
  [515_000, 530_000],
  [545_000, 560_000],
  [575_000, 590_000],
  [605_000, 620_000],
  [635_000, 650_000],
];

/** 健康保険 標準報酬月額（等級1〜50） */
const HEALTH_GRADES: [lowerBound: number, standard: number][] = [
  [0, 58_000],
  [63_000, 68_000],
  [73_000, 78_000],
  [83_000, 88_000],
  ...PENSION_GRADES.slice(1),
  [665_000, 680_000],
  [695_000, 710_000],
  [730_000, 750_000],
  [770_000, 790_000],
  [810_000, 830_000],
  [855_000, 880_000],
  [905_000, 930_000],
  [955_000, 980_000],
  [1_005_000, 1_030_000],
  [1_055_000, 1_090_000],
  [1_115_000, 1_150_000],
  [1_175_000, 1_210_000],
  [1_235_000, 1_270_000],
  [1_295_000, 1_330_000],
  [1_355_000, 1_390_000],
];

function resolveGrade(
  table: [number, number][],
  monthlyPay: number,
): { grade: number; standard: number } {
  let index = 0;
  for (let i = 0; i < table.length; i += 1) {
    if (monthlyPay >= table[i][0]) index = i;
  }
  return { grade: index + 1, standard: table[index][1] };
}

/** 報酬月額から厚生年金の標準報酬月額・等級を求める */
export function pensionStandardRemuneration(monthlyPay: number) {
  return resolveGrade(PENSION_GRADES, Math.max(0, monthlyPay));
}

/** 報酬月額から健康保険の標準報酬月額・等級を求める */
export function healthStandardRemuneration(monthlyPay: number) {
  return resolveGrade(HEALTH_GRADES, Math.max(0, monthlyPay));
}

/** 賞与額から標準賞与額を求める（1,000円未満切捨て・上限あり） */
export function standardBonus(bonus: number) {
  const floored = Math.floor(Math.max(0, bonus) / 1000) * 1000;
  return {
    health: Math.min(floored, 5_730_000),
    pension: Math.min(floored, 1_500_000),
  };
}

/** 割増賃金率（労働基準法37条） */
export const PREMIUM_RATES = {
  overtime: 0.25,
  overtimeOver60h: 0.5,
  night: 0.25,
  holiday: 0.35,
};

/** 年次有給休暇の付与日数（通常の労働者） */
const PAID_LEAVE_TABLE: [months: number, days: number][] = [
  [6, 10],
  [18, 11],
  [30, 12],
  [42, 14],
  [54, 16],
  [66, 18],
  [78, 20],
];

export function paidLeaveDays(serviceMonths: number): number {
  let granted = 0;
  for (const [months, value] of PAID_LEAVE_TABLE) {
    if (serviceMonths >= months) granted = value;
  }
  return granted;
}

export function nextPaidLeaveGrant(serviceMonths: number) {
  const next = PAID_LEAVE_TABLE.find(([months]) => serviceMonths < months);
  return next ? { months: next[0], days: next[1] } : null;
}

/** 消費税率 */
export const CONSUMPTION_TAX = { standard: 10, reduced: 8 };

/** 児童手当（2024年10月拡充後・月額） */
export function childAllowanceMonthly(
  ageBucket: "under3" | "toHighSchool",
  birthOrder: number,
): number {
  if (birthOrder >= 3) return 30_000;
  return ageBucket === "under3" ? 15_000 : 10_000;
}

/** 出産育児一時金（産科医療補償制度加入機関） */
export const CHILDBIRTH_LUMP_SUM = 500_000;

/** 育児休業給付の給付率 */
export const CHILDCARE_LEAVE = {
  firstRate: 0.67,
  laterRate: 0.5,
  firstDays: 180,
  /** 出生後休業支援給付金の上乗せ率 */
  postBirthSupportRate: 0.13,
  /** 休業開始時賃金日額の上限（令和7年度） */
  dailyWageCap: 15_690,
};

/** 傷病手当金・出産手当金の支給率 */
export const BENEFIT_RATE_TWO_THIRDS = 2 / 3;

/** 自動車税種別割（自家用乗用車・年額） */
const AUTO_TAX_NEW: [limitCc: number, amount: number][] = [
  [1000, 25_000],
  [1500, 30_500],
  [2000, 36_000],
  [2500, 43_500],
  [3000, 50_000],
  [3500, 57_000],
  [4000, 65_500],
  [4500, 75_500],
  [6000, 87_000],
  [Infinity, 110_000],
];

const AUTO_TAX_OLD: [limitCc: number, amount: number][] = [
  [1000, 29_500],
  [1500, 34_500],
  [2000, 39_500],
  [2500, 45_000],
  [3000, 51_000],
  [3500, 58_000],
  [4000, 66_500],
  [4500, 76_500],
  [6000, 88_000],
  [Infinity, 111_000],
];

export const KEI_AUTO_TAX = 10_800;
export const KEI_AUTO_TAX_OLD = 7_200;
/** 13年超の軽自動車（重課） */
export const KEI_AUTO_TAX_HEAVY = 12_900;

export function autoTaxAnnual(
  displacementCc: number,
  registeredBefore2019Oct: boolean,
): number {
  const table = registeredBefore2019Oct ? AUTO_TAX_OLD : AUTO_TAX_NEW;
  return table.find(([limit]) => displacementCc <= limit)![1];
}

/** 自動車重量税（自家用乗用車・0.5tあたりの年額） */
export const WEIGHT_TAX_PER_HALF_TON = {
  eco: 2_500,
  standard: 4_100,
  over13y: 5_700,
  over18y: 6_300,
};

export const KEI_WEIGHT_TAX_2Y = {
  eco: 5_000,
  standard: 6_600,
  over13y: 8_200,
  over18y: 8_800,
};

/** 自賠責保険料（本土・離島以外） */
export const COMPULSORY_INSURANCE: Record<string, Record<number, number>> = {
  car: { 12: 11_500, 13: 12_010, 24: 17_650, 25: 18_160, 36: 23_690 },
  kei: { 12: 11_440, 13: 11_950, 24: 17_540, 25: 18_040, 36: 23_520 },
  bike: { 12: 6_910, 24: 8_760, 36: 10_590 },
  moped: { 12: 6_910, 24: 8_560, 36: 10_170 },
};

/** 固定資産税・都市計画税の標準税率 */
export const PROPERTY_TAX = {
  fixedRate: 0.014,
  cityPlanningRate: 0.003,
  /** 小規模住宅用地（200㎡以下）の課税標準特例 */
  smallLandRatio: 1 / 6,
  /** 一般住宅用地の課税標準特例 */
  generalLandRatio: 1 / 3,
};

/** 不動産取得税 */
export const ACQUISITION_TAX = { rate: 0.03, landBaseRatio: 0.5 };

/** 仲介手数料の上限（売買・速算式） */
export function brokerageFeeSale(price: number, taxRatePct = 10): number {
  const base =
    price > 4_000_000
      ? price * 0.03 + 60_000
      : price > 2_000_000
        ? price * 0.04 + 20_000
        : price * 0.05;
  return base * (1 + taxRatePct / 100);
}

/** 住宅ローン控除（2024年以降・一般的な新築の控除率） */
export const MORTGAGE_DEDUCTION = { rate: 0.007, maxYears: 13 };
