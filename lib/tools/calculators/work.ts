import {
  ADDITIONAL_PENSION_MONTHLY,
  BASIC_PENSION_FULL_YEAR,
  BENEFIT_RATE_TWO_THIRDS,
  CHILDBIRTH_LUMP_SUM,
  CHILDCARE_LEAVE,
  FISCAL_YEAR,
  INSURANCE_RATES,
  MORTGAGE_DEDUCTION,
  NATIONAL_PENSION_MONTHLY,
  PENSION_FULL_MONTHS,
  PREMIUM_RATES,
  RECONSTRUCTION_TAX_RATE,
  RESIDENT_TAX,
  basicDeductionIncomeTax,
  basicDeductionResidentTax,
  employmentIncome,
  employmentIncomeDeduction,
  healthStandardRemuneration,
  incomeTaxFromTaxable,
  marginalIncomeTaxRate,
  nextPaidLeaveGrant,
  paidLeaveDays,
  pensionStandardRemuneration,
  reconstructionTax,
  standardBonus,
} from "./data";
import {
  DEPENDENT_DEDUCTION,
  grossFromNet,
  salaryBreakdown,
  socialInsuranceMonthly,
} from "./salary";
import { calendarDiff, diffDays, toIso } from "./dateUtils";
import {
  countField,
  dateField,
  decimalField,
  hours as fmtHours,
  moneyField,
  num,
  pct,
  rateField,
  selectField,
  sourceBasicDeduction,
  sourceIncomeDeduction,
  sourceIncomeTaxRate,
  sourceKenpo,
  sourceMHLW,
  sourcePension,
  timeField,
  yen,
  days as fmtDays,
  type CalculatorSpec,
} from "./types";

const careField = selectField("care", "介護保険", "no", [
  { value: "no", label: "対象外（40歳未満・65歳以上）" },
  { value: "yes", label: "対象（40〜64歳）" },
]);

const isCare = (value: string) => value === "yes";

const today = () => new Date();
const iso = toIso;

const taxNote = `${FISCAL_YEAR}の制度に基づく概算です。自治体・健康保険組合により実額は異なります。`;

export const workCalculators: Record<string, CalculatorSpec> = {
  /* 1 */
  "catalog-1": {
    title: "手取り計算",
    lead: "給与明細の支給額から社会保険料と税金を差し引いた手取り額を計算します。",
    fields: [
      moneyField("gross", "総支給額（月）", "300000"),
      moneyField("allowance", "うち非課税の通勤手当", "10000"),
      careField,
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const gross = i.num("gross");
      const commute = Math.min(i.num("allowance"), gross);
      const insurance = socialInsuranceMonthly(gross, isCare(i.raw("care")));
      const taxableMonthly = gross - commute - insurance.total;
      const annual = (gross - commute) * 12;
      const breakdown = salaryBreakdown(annual, {
        over40: isCare(i.raw("care")),
        dependents: i.int("dependents"),
      });
      const incomeTax = breakdown.incomeTax / 12;
      const residentTax = breakdown.residentTax / 12;
      const net = gross - insurance.total - incomeTax - residentTax;
      return [
        { label: "月の手取り額", value: yen(net), primary: true },
        { label: "総支給額", value: yen(gross) },
        { label: "社会保険料（本人負担）", value: `− ${yen(insurance.total)}` },
        { label: "所得税（月割）", value: `− ${yen(incomeTax)}` },
        { label: "住民税（月割）", value: `− ${yen(residentTax)}` },
        { label: "課税対象額", value: yen(Math.max(0, taxableMonthly)) },
        {
          label: "控除合計",
          value: yen(insurance.total + incomeTax + residentTax),
        },
        { label: "手取り率", value: pct(gross ? (net / gross) * 100 : 0, 1) },
      ];
    },
    note: taxNote,
    sources: [sourceKenpo, sourceIncomeTaxRate],
  },

  /* 2 */
  "catalog-2": {
    title: "年収→手取り計算",
    lead: "額面年収から社会保険料・所得税・住民税を差し引いた年間手取りを計算します。",
    fields: [
      moneyField("annual", "額面年収", "5000000"),
      decimalField(
        "bonus",
        "賞与（月数）",
        "0",
        "ヶ月",
        "年収に含まれる賞与の月数",
      ),
      careField,
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const b = salaryBreakdown(i.num("annual"), {
        over40: isCare(i.raw("care")),
        dependents: i.int("dependents"),
        bonusMonths: i.num("bonus"),
      });
      return [
        { label: "年間手取り額", value: yen(b.netAnnual), primary: true },
        { label: "月あたり手取り", value: yen(b.netMonthly) },
        { label: "給与所得控除", value: yen(b.deduction) },
        { label: "給与所得", value: yen(b.income) },
        { label: "社会保険料", value: `− ${yen(b.socialInsurance)}` },
        { label: "所得税（復興税込）", value: `− ${yen(b.incomeTax)}` },
        { label: "住民税", value: `− ${yen(b.residentTax)}` },
        {
          label: "手取り率",
          value: pct(b.revenue ? (b.netAnnual / b.revenue) * 100 : 0, 1),
        },
      ];
    },
    note: taxNote,
    sources: [sourceIncomeDeduction, sourceIncomeTaxRate],
  },

  /* 3 */
  "catalog-3": {
    title: "手取り→年収計算",
    lead: "目標の手取り額から必要な額面年収を逆算します。",
    fields: [
      moneyField("net", "目標の手取り年収", "4000000"),
      careField,
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const options = {
        over40: isCare(i.raw("care")),
        dependents: i.int("dependents"),
      };
      const gross = grossFromNet(i.num("net"), options);
      const b = salaryBreakdown(gross, options);
      return [
        { label: "必要な額面年収", value: yen(gross), primary: true },
        { label: "額面月収（12分割）", value: yen(gross / 12) },
        { label: "手取り年収（検算）", value: yen(b.netAnnual) },
        { label: "社会保険料", value: yen(b.socialInsurance) },
        { label: "所得税＋住民税", value: yen(b.incomeTax + b.residentTax) },
        {
          label: "額面との差額",
          value: yen(gross - b.netAnnual),
          note: "天引きされる合計額",
        },
      ];
    },
    note: taxNote,
  },

  /* 4 */
  "catalog-4": {
    title: "月給→年収計算",
    lead: "月給と賞与から額面年収を計算します。",
    fields: [
      moneyField("monthly", "月給（額面）", "300000"),
      decimalField("bonusMonths", "賞与", "4", "ヶ月分"),
      moneyField("other", "その他の年間手当", "0"),
    ],
    compute: (i) => {
      const monthly = i.num("monthly");
      const bonus = monthly * i.num("bonusMonths");
      const annual = monthly * 12 + bonus + i.num("other");
      const b = salaryBreakdown(annual, { bonusMonths: i.num("bonusMonths") });
      return [
        { label: "額面年収", value: yen(annual), primary: true },
        { label: "月給×12ヶ月", value: yen(monthly * 12) },
        { label: "賞与合計", value: yen(bonus) },
        { label: "その他手当", value: yen(i.num("other")) },
        { label: "手取り年収の目安", value: yen(b.netAnnual) },
      ];
    },
  },

  /* 5 */
  "catalog-5": {
    title: "年収→月給計算",
    lead: "年収と賞与月数から1ヶ月あたりの額面月給を求めます。",
    fields: [
      moneyField("annual", "額面年収", "5000000"),
      decimalField("bonusMonths", "賞与", "4", "ヶ月分"),
    ],
    compute: (i) => {
      const annual = i.num("annual");
      const bonusMonths = i.num("bonusMonths");
      const monthly = annual / (12 + bonusMonths);
      return [
        { label: "額面月給", value: yen(monthly), primary: true },
        {
          label: "賞与1回あたり（年2回）",
          value: yen((monthly * bonusMonths) / 2),
        },
        { label: "賞与合計（年額）", value: yen(monthly * bonusMonths) },
        {
          label: "賞与なしで12分割した場合",
          value: yen(annual / 12),
        },
      ];
    },
  },

  /* 6 */
  "catalog-6": {
    title: "時給→月収計算",
    lead: "時給と勤務時間から1ヶ月の収入を計算します。",
    fields: [
      moneyField("hourly", "時給", "1200"),
      decimalField("hoursPerDay", "1日の労働時間", "8", "時間"),
      countField("daysPerMonth", "月の勤務日数", "20", "日"),
      moneyField("allowance", "月の交通費・手当", "0"),
    ],
    compute: (i) => {
      const base =
        i.num("hourly") * i.num("hoursPerDay") * i.num("daysPerMonth");
      const total = base + i.num("allowance");
      return [
        { label: "月収（額面）", value: yen(total), primary: true },
        { label: "基本給部分", value: yen(base) },
        {
          label: "月の総労働時間",
          value: fmtHours(i.num("hoursPerDay") * i.num("daysPerMonth"), 1),
        },
        { label: "年収換算", value: yen(total * 12) },
      ];
    },
  },

  /* 7 */
  "catalog-7": {
    title: "時給→年収計算",
    lead: "時給から年収と手取りの目安を計算します。",
    fields: [
      moneyField("hourly", "時給", "1200"),
      decimalField("hoursPerWeek", "週の労働時間", "40", "時間"),
      countField("weeks", "年間の勤務週数", "52", "週"),
      careField,
    ],
    compute: (i) => {
      const annual = i.num("hourly") * i.num("hoursPerWeek") * i.num("weeks");
      const b = salaryBreakdown(annual, { over40: isCare(i.raw("care")) });
      return [
        { label: "額面年収", value: yen(annual), primary: true },
        { label: "手取り年収の目安", value: yen(b.netAnnual) },
        { label: "月収（12分割）", value: yen(annual / 12) },
        {
          label: "年間労働時間",
          value: fmtHours(i.num("hoursPerWeek") * i.num("weeks"), 0),
        },
      ];
    },
    note: taxNote,
  },

  /* 8 */
  "catalog-8": {
    title: "日給→月収計算",
    lead: "日給と勤務日数から月収・年収を計算します。",
    fields: [
      moneyField("daily", "日給", "12000"),
      countField("days", "月の勤務日数", "20", "日"),
      moneyField("allowance", "月の手当合計", "0"),
    ],
    compute: (i) => {
      const base = i.num("daily") * i.num("days");
      const total = base + i.num("allowance");
      return [
        { label: "月収（額面）", value: yen(total), primary: true },
        { label: "日給×勤務日数", value: yen(base) },
        { label: "年収換算", value: yen(total * 12) },
        { label: "時給換算（1日8時間）", value: yen(i.num("daily") / 8) },
      ];
    },
  },

  /* 9 */
  "catalog-9": {
    title: "賞与手取り計算",
    lead: "賞与額から社会保険料と源泉所得税を差し引いた手取りを計算します。",
    fields: [
      moneyField("bonus", "賞与額（額面）", "500000"),
      moneyField("prevMonthly", "前月の社会保険料控除後の給与", "250000"),
      careField,
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const bonus = i.num("bonus");
      const sb = standardBonus(bonus);
      const care = isCare(i.raw("care"));
      const health = (sb.health * INSURANCE_RATES.health) / 2;
      const careIns = care ? (sb.health * INSURANCE_RATES.longTermCare) / 2 : 0;
      const pension = (sb.pension * INSURANCE_RATES.pension) / 2;
      const employment = bonus * INSURANCE_RATES.employmentEmployee;
      const insurance = health + careIns + pension + employment;
      // 賞与の源泉徴収税率は前月給与（社保控除後）と扶養人数で決まる賞与算出率
      const prev = i.num("prevMonthly");
      const dependents = i.int("dependents");
      const base = Math.max(0, prev - dependents * 31_667);
      const rate =
        base < 68_000
          ? 0
          : base < 79_000
            ? 0.02042
            : base < 252_000
              ? 0.04084
              : base < 300_000
                ? 0.06126
                : base < 334_000
                  ? 0.08168
                  : base < 363_000
                    ? 0.1021
                    : base < 395_000
                      ? 0.12252
                      : base < 426_000
                        ? 0.14294
                        : base < 550_000
                          ? 0.16336
                          : base < 647_000
                            ? 0.18378
                            : 0.2042;
      const taxable = Math.max(0, bonus - insurance);
      const tax = taxable * rate;
      const net = bonus - insurance - tax;
      return [
        { label: "賞与の手取り額", value: yen(net), primary: true },
        { label: "健康保険料", value: `− ${yen(health)}` },
        ...(care ? [{ label: "介護保険料", value: `− ${yen(careIns)}` }] : []),
        { label: "厚生年金保険料", value: `− ${yen(pension)}` },
        { label: "雇用保険料", value: `− ${yen(employment)}` },
        {
          label: "源泉所得税",
          value: `− ${yen(tax)}`,
          note: `賞与の源泉徴収税率 ${pct(rate * 100, 3)}`,
        },
        { label: "手取り率", value: pct(bonus ? (net / bonus) * 100 : 0, 1) },
      ];
    },
    note: "賞与には住民税はかかりません（住民税は毎月の給与から徴収）。年末調整で過不足が精算されます。",
    sources: [sourceKenpo],
  },

  /* 10 */
  "catalog-10": {
    title: "給与所得控除計算",
    lead: "給与収入から給与所得控除額と給与所得を計算します。",
    fields: [moneyField("revenue", "給与収入（年間）", "5000000")],
    compute: (i) => {
      const revenue = i.num("revenue");
      const deduction = employmentIncomeDeduction(revenue);
      const income = employmentIncome(revenue);
      const formula =
        revenue <= 1_900_000
          ? "収入金額（最低65万円）"
          : revenue <= 3_600_000
            ? "収入金額×30％＋80,000円"
            : revenue <= 6_600_000
              ? "収入金額×20％＋440,000円"
              : revenue <= 8_500_000
                ? "収入金額×10％＋1,100,000円"
                : "1,950,000円（上限）";
      return [
        { label: "給与所得控除額", value: yen(deduction), primary: true },
        { label: "給与所得（収入−控除）", value: yen(income) },
        { label: "適用される計算式", value: formula },
        {
          label: "収入に対する控除割合",
          value: pct(revenue ? (deduction / revenue) * 100 : 0, 1),
        },
      ];
    },
    note: "令和7年分以降の給与所得控除（最低保障額65万円）で計算しています。",
    sources: [sourceIncomeDeduction],
  },

  /* 11 */
  "catalog-11": {
    title: "所得税計算",
    lead: "給与収入から課税所得を求め、速算表で所得税額を計算します。",
    fields: [
      moneyField("revenue", "給与収入（年間）", "5000000"),
      moneyField("social", "社会保険料控除", "750000"),
      countField("dependents", "扶養親族の人数", "0", "人"),
      moneyField("other", "その他の所得控除", "0", "生命保険料控除など"),
    ],
    compute: (i) => {
      const income = employmentIncome(i.num("revenue"));
      const basic = basicDeductionIncomeTax(income);
      const dependents = i.int("dependents") * DEPENDENT_DEDUCTION.incomeTax;
      const taxable = Math.max(
        0,
        income - i.num("social") - basic - dependents - i.num("other"),
      );
      const base = incomeTaxFromTaxable(taxable);
      const extra = reconstructionTax(base);
      return [
        {
          label: "所得税額（復興特別所得税込）",
          value: yen(base + extra),
          primary: true,
        },
        { label: "給与所得", value: yen(income) },
        { label: "基礎控除", value: yen(basic) },
        { label: "扶養控除", value: yen(dependents) },
        {
          label: "課税所得金額",
          value: yen(Math.floor(taxable / 1000) * 1000),
        },
        {
          label: "適用税率",
          value: pct(marginalIncomeTaxRate(taxable) * 100, 0),
        },
        { label: "所得税（本税）", value: yen(base) },
        { label: "復興特別所得税", value: yen(extra) },
      ];
    },
    note: taxNote,
    sources: [sourceIncomeTaxRate, sourceBasicDeduction],
  },

  /* 12 */
  "catalog-12": {
    title: "復興特別所得税計算",
    lead: "基準所得税額に2.1％を乗じた復興特別所得税額を計算します。",
    fields: [moneyField("baseTax", "基準所得税額（所得税額）", "200000")],
    compute: (i) => {
      const base = i.num("baseTax");
      const extra = reconstructionTax(base);
      return [
        { label: "復興特別所得税額", value: yen(extra), primary: true },
        { label: "基準所得税額", value: yen(base) },
        { label: "税率", value: pct(RECONSTRUCTION_TAX_RATE * 100, 1) },
        { label: "合計納付額", value: yen(base + extra) },
      ];
    },
    note: "復興特別所得税は2037年分まで課税されます。",
  },

  /* 13 */
  "catalog-13": {
    title: "基礎控除計算",
    lead: "合計所得金額に応じた基礎控除額（所得税・住民税）を確認します。",
    fields: [moneyField("income", "合計所得金額", "3000000")],
    compute: (i) => {
      const income = i.num("income");
      return [
        {
          label: "基礎控除額（所得税）",
          value: yen(basicDeductionIncomeTax(income)),
          primary: true,
        },
        {
          label: "基礎控除額（住民税）",
          value: yen(basicDeductionResidentTax(income)),
        },
        {
          label: "判定区分",
          value:
            income <= 1_320_000
              ? "132万円以下"
              : income <= 3_360_000
                ? "132万円超336万円以下"
                : income <= 4_890_000
                  ? "336万円超489万円以下"
                  : income <= 6_550_000
                    ? "489万円超655万円以下"
                    : income <= 23_500_000
                      ? "655万円超2,350万円以下"
                      : income <= 24_500_000
                        ? "2,400万円超2,450万円以下"
                        : income <= 25_000_000
                          ? "2,450万円超2,500万円以下"
                          : "2,500万円超（適用なし）",
        },
      ];
    },
    note: "令和7年・8年分は所得に応じた上乗せ特例（最大95万円）が適用されます。",
    sources: [sourceBasicDeduction],
  },

  /* 14 */
  "catalog-14": {
    title: "課税所得計算",
    lead: "収入から各種控除を差し引いた課税所得金額を計算します。",
    fields: [
      moneyField("revenue", "給与収入（年間）", "5000000"),
      moneyField("social", "社会保険料控除", "750000"),
      moneyField("insurance", "生命保険料・地震保険料控除", "40000"),
      moneyField("other", "その他の所得控除", "0"),
    ],
    compute: (i) => {
      const income = employmentIncome(i.num("revenue"));
      const basic = basicDeductionIncomeTax(income);
      const deductions =
        basic + i.num("social") + i.num("insurance") + i.num("other");
      const taxable = Math.max(0, income - deductions);
      return [
        {
          label: "課税所得金額",
          value: yen(Math.floor(taxable / 1000) * 1000),
          primary: true,
          note: "1,000円未満切捨て",
        },
        { label: "給与所得", value: yen(income) },
        { label: "基礎控除", value: yen(basic) },
        { label: "所得控除の合計", value: yen(deductions) },
        { label: "所得税額", value: yen(incomeTaxFromTaxable(taxable)) },
      ];
    },
    sources: [sourceIncomeDeduction],
  },

  /* 15 */
  "catalog-15": {
    title: "住民税シミュレーター",
    lead: "前年の所得から住民税（所得割＋均等割）を試算します。",
    fields: [
      moneyField("revenue", "前年の給与収入", "5000000"),
      moneyField("social", "社会保険料控除", "750000"),
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const income = employmentIncome(i.num("revenue"));
      const basic = basicDeductionResidentTax(income);
      const taxable = Math.max(
        0,
        income -
          i.num("social") -
          basic -
          i.int("dependents") * DEPENDENT_DEDUCTION.residentTax,
      );
      const rounded = Math.floor(taxable / 1000) * 1000;
      const adjustment =
        rounded > 0 ? RESIDENT_TAX.basicDeductionGap * 0.05 : 0;
      const incomeLevy = Math.max(
        0,
        rounded * RESIDENT_TAX.incomeRate - adjustment,
      );
      const perCapita = rounded > 0 ? RESIDENT_TAX.perCapita : 0;
      const forest = rounded > 0 ? RESIDENT_TAX.forestTax : 0;
      const total = incomeLevy + perCapita + forest;
      return [
        { label: "住民税（年額）", value: yen(total), primary: true },
        { label: "月あたり", value: yen(total / 12) },
        { label: "課税標準額", value: yen(rounded) },
        {
          label: "所得割",
          value: yen(incomeLevy),
          note: `市町村民税6％＋道府県民税4％ − 調整控除${yen(adjustment)}`,
        },
        { label: "均等割", value: yen(perCapita) },
        { label: "森林環境税", value: yen(forest) },
      ];
    },
    note: "自治体により税率・均等割額が異なる場合があります（標準税率で計算）。",
  },

  /* 16 */
  "catalog-16": {
    title: "扶養控除計算",
    lead: "扶養親族の区分ごとの人数から扶養控除額を計算します。",
    fields: [
      countField(
        "general",
        "一般の控除対象扶養親族（16〜18歳・23〜69歳）",
        "1",
        "人",
      ),
      countField("specific", "特定扶養親族（19〜22歳）", "0", "人"),
      countField("elderly", "老人扶養親族（70歳以上・同居以外）", "0", "人"),
      countField("livingWith", "同居老親等（70歳以上・同居）", "0", "人"),
    ],
    compute: (i) => {
      const general = i.int("general") * 380_000;
      const specific = i.int("specific") * 630_000;
      const elderly = i.int("elderly") * 480_000;
      const livingWith = i.int("livingWith") * 580_000;
      const total = general + specific + elderly + livingWith;
      const residentTotal =
        i.int("general") * 330_000 +
        i.int("specific") * 450_000 +
        i.int("elderly") * 380_000 +
        i.int("livingWith") * 450_000;
      return [
        { label: "扶養控除額（所得税）", value: yen(total), primary: true },
        { label: "扶養控除額（住民税）", value: yen(residentTotal) },
        { label: "一般（38万円×人数）", value: yen(general) },
        { label: "特定（63万円×人数）", value: yen(specific) },
        { label: "老人・同居以外（48万円×人数）", value: yen(elderly) },
        { label: "同居老親等（58万円×人数）", value: yen(livingWith) },
      ];
    },
    note: "16歳未満の扶養親族は扶養控除の対象外です（児童手当の対象）。",
  },

  /* 17 */
  "catalog-17": {
    title: "配偶者控除計算",
    lead: "本人と配偶者の所得から配偶者控除額を判定します。",
    fields: [
      moneyField("selfIncome", "本人の合計所得金額", "4000000"),
      moneyField("spouseIncome", "配偶者の合計所得金額", "0"),
      selectField("age", "配偶者の年齢", "under70", [
        { value: "under70", label: "70歳未満" },
        { value: "over70", label: "70歳以上（老人控除対象配偶者）" },
      ]),
    ],
    compute: (i) => {
      const self = i.num("selfIncome");
      const spouse = i.num("spouseIncome");
      const elderly = i.raw("age") === "over70";
      if (spouse > 580_000)
        return [
          {
            label: "配偶者控除額",
            value: yen(0),
            primary: true,
            note: "配偶者の合計所得が58万円を超えるため対象外（配偶者特別控除を確認）",
          },
          { label: "配偶者の合計所得", value: yen(spouse) },
        ];
      if (self > 10_000_000)
        return [
          {
            label: "配偶者控除額",
            value: yen(0),
            primary: true,
            note: "本人の合計所得が1,000万円を超えるため適用されません",
          },
        ];
      const tier = self <= 9_000_000 ? 0 : self <= 9_500_000 ? 1 : 2;
      const normal = [380_000, 260_000, 130_000][tier];
      const old = [480_000, 320_000, 160_000][tier];
      const resident = elderly
        ? [380_000, 260_000, 130_000][tier]
        : [330_000, 220_000, 110_000][tier];
      const amount = elderly ? old : normal;
      return [
        { label: "配偶者控除額（所得税）", value: yen(amount), primary: true },
        { label: "配偶者控除額（住民税）", value: yen(resident) },
        {
          label: "本人の所得区分",
          value: [
            "900万円以下",
            "900万円超950万円以下",
            "950万円超1,000万円以下",
          ][tier],
        },
        {
          label: "配偶者の区分",
          value: elderly ? "老人控除対象配偶者" : "一般の控除対象配偶者",
        },
      ];
    },
    note: "令和7年分から配偶者の所得要件は合計所得58万円（給与収入123万円）以下です。",
  },

  /* 18 */
  "catalog-18": {
    title: "配偶者特別控除計算",
    lead: "配偶者の所得が58万円を超える場合の配偶者特別控除額を計算します。",
    fields: [
      moneyField("selfIncome", "本人の合計所得金額", "4000000"),
      moneyField("spouseIncome", "配偶者の合計所得金額", "700000"),
    ],
    compute: (i) => {
      const self = i.num("selfIncome");
      const spouse = i.num("spouseIncome");
      if (self > 10_000_000)
        return [
          {
            label: "配偶者特別控除額",
            value: yen(0),
            primary: true,
            note: "本人の合計所得が1,000万円を超えるため適用されません",
          },
        ];
      if (spouse <= 580_000)
        return [
          {
            label: "配偶者特別控除額",
            value: yen(0),
            primary: true,
            note: "配偶者の所得が58万円以下のため、配偶者控除の対象です",
          },
        ];
      if (spouse > 1_330_000)
        return [
          {
            label: "配偶者特別控除額",
            value: yen(0),
            primary: true,
            note: "配偶者の合計所得が133万円を超えるため対象外",
          },
        ];
      const table: [number, number][] = [
        [950_000, 380_000],
        [1_000_000, 360_000],
        [1_050_000, 310_000],
        [1_100_000, 260_000],
        [1_150_000, 210_000],
        [1_200_000, 160_000],
        [1_250_000, 110_000],
        [1_300_000, 60_000],
        [1_330_000, 30_000],
      ];
      const base = table.find(([limit]) => spouse <= limit)![1];
      const ratio = self <= 9_000_000 ? 1 : self <= 9_500_000 ? 2 / 3 : 1 / 3;
      const amount = Math.ceil((base * ratio) / 10_000) * 10_000;
      return [
        {
          label: "配偶者特別控除額（所得税）",
          value: yen(amount),
          primary: true,
        },
        { label: "満額の控除額", value: yen(base) },
        {
          label: "本人所得による調整率",
          value: ratio === 1 ? "100％" : ratio > 0.5 ? "2/3" : "1/3",
        },
        { label: "配偶者の合計所得", value: yen(spouse) },
      ];
    },
  },

  /* 19 */
  "catalog-19": {
    title: "医療費控除計算",
    lead: "1年間に支払った医療費から医療費控除額と減税額を計算します。",
    fields: [
      moneyField("medical", "支払った医療費の合計", "300000"),
      moneyField("compensation", "保険金などで補填される金額", "0"),
      moneyField("income", "総所得金額等", "4000000"),
    ],
    compute: (i) => {
      const paid = Math.max(0, i.num("medical") - i.num("compensation"));
      const income = i.num("income");
      const threshold = Math.min(income * 0.05, 100_000);
      const deduction = Math.min(Math.max(0, paid - threshold), 2_000_000);
      const rate = marginalIncomeTaxRate(income);
      const incomeTaxSaving = deduction * rate * (1 + RECONSTRUCTION_TAX_RATE);
      const residentSaving = deduction * RESIDENT_TAX.incomeRate;
      return [
        { label: "医療費控除額", value: yen(deduction), primary: true },
        { label: "自己負担した医療費", value: yen(paid) },
        {
          label: "足切り額",
          value: yen(threshold),
          note: "10万円と総所得金額等の5％のいずれか少ない方",
        },
        { label: "所得税の減税額", value: yen(incomeTaxSaving) },
        { label: "住民税の減税額", value: yen(residentSaving) },
        {
          label: "還付・軽減の合計",
          value: yen(incomeTaxSaving + residentSaving),
        },
      ];
    },
    note: "控除の上限は200万円です。セルフメディケーション税制とは選択適用となります。",
  },

  /* 20 */
  "catalog-20": {
    title: "生命保険料控除計算",
    lead: "新制度の一般・介護医療・個人年金の保険料から控除額を計算します。",
    fields: [
      moneyField("general", "一般生命保険料（年間）", "80000"),
      moneyField("medical", "介護医療保険料（年間）", "40000"),
      moneyField("pension", "個人年金保険料（年間）", "0"),
    ],
    compute: (i) => {
      const forIncomeTax = (premium: number) => {
        if (premium <= 20_000) return premium;
        if (premium <= 40_000) return premium / 2 + 10_000;
        if (premium <= 80_000) return premium / 4 + 20_000;
        return 40_000;
      };
      const forResident = (premium: number) => {
        if (premium <= 12_000) return premium;
        if (premium <= 32_000) return premium / 2 + 6_000;
        if (premium <= 56_000) return premium / 4 + 14_000;
        return 28_000;
      };
      const keys = ["general", "medical", "pension"] as const;
      const incomeTaxTotal = Math.min(
        keys.reduce((sum, key) => sum + forIncomeTax(i.num(key)), 0),
        120_000,
      );
      const residentTotal = Math.min(
        keys.reduce((sum, key) => sum + forResident(i.num(key)), 0),
        70_000,
      );
      return [
        {
          label: "生命保険料控除額（所得税）",
          value: yen(incomeTaxTotal),
          primary: true,
        },
        { label: "生命保険料控除額（住民税）", value: yen(residentTotal) },
        { label: "一般生命保険料", value: yen(forIncomeTax(i.num("general"))) },
        { label: "介護医療保険料", value: yen(forIncomeTax(i.num("medical"))) },
        { label: "個人年金保険料", value: yen(forIncomeTax(i.num("pension"))) },
      ];
    },
    note: "新制度（2012年1月1日以降契約）の計算式です。所得税は合計12万円、住民税は7万円が上限。",
  },

  /* 21 */
  "catalog-21": {
    title: "地震保険料控除計算",
    lead: "支払った地震保険料から所得税・住民税の控除額を計算します。",
    fields: [moneyField("premium", "地震保険料（年間）", "30000")],
    compute: (i) => {
      const premium = i.num("premium");
      const incomeTax = Math.min(premium, 50_000);
      const resident = Math.min(premium / 2, 25_000);
      return [
        {
          label: "地震保険料控除額（所得税）",
          value: yen(incomeTax),
          primary: true,
        },
        { label: "地震保険料控除額（住民税）", value: yen(resident) },
        { label: "支払保険料", value: yen(premium) },
        {
          label: "上限",
          value: "所得税 50,000円／住民税 25,000円",
        },
      ];
    },
  },

  /* 22 */
  "catalog-22": {
    title: "住宅ローン控除計算",
    lead: "年末のローン残高から住宅ローン控除額（減税額）を計算します。",
    fields: [
      moneyField("balance", "年末のローン残高", "30000000"),
      moneyField(
        "limit",
        "借入限度額",
        "30000000",
        "住宅の性能・入居年で決まります",
      ),
      moneyField("incomeTax", "その年の所得税額", "150000"),
      moneyField("residentTaxable", "住民税の課税総所得金額", "3000000"),
    ],
    compute: (i) => {
      const target = Math.min(i.num("balance"), i.num("limit"));
      const theoretical = target * MORTGAGE_DEDUCTION.rate;
      const incomeTax = i.num("incomeTax");
      const fromIncomeTax = Math.min(theoretical, incomeTax);
      const residentCap = Math.min(i.num("residentTaxable") * 0.05, 97_500);
      const fromResident = Math.min(theoretical - fromIncomeTax, residentCap);
      const total = fromIncomeTax + Math.max(0, fromResident);
      return [
        { label: "実際の控除額（年間）", value: yen(total), primary: true },
        {
          label: "控除可能額",
          value: yen(theoretical),
          note: `対象残高 ${yen(target)} × ${pct(MORTGAGE_DEDUCTION.rate * 100, 1)}`,
        },
        { label: "所得税からの控除", value: yen(fromIncomeTax) },
        {
          label: "住民税からの控除",
          value: yen(Math.max(0, fromResident)),
          note: "課税総所得金額の5％（上限97,500円）まで",
        },
        {
          label: "控除しきれない額",
          value: yen(Math.max(0, theoretical - total)),
        },
        {
          label: `最大${MORTGAGE_DEDUCTION.maxYears}年間の累計目安`,
          value: yen(total * MORTGAGE_DEDUCTION.maxYears),
          note: "残高が一定の場合の単純累計",
        },
      ];
    },
    note: "控除率0.7％。借入限度額は住宅の省エネ性能・入居年・子育て世帯かどうかで変わります。",
  },

  /* 23 */
  "catalog-23": {
    title: "ふるさと納税上限計算",
    lead: "年収と家族構成から自己負担2,000円で済む寄附上限額を試算します。",
    fields: [
      moneyField("revenue", "給与収入（年間）", "5000000"),
      moneyField("social", "社会保険料控除", "750000"),
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const income = employmentIncome(i.num("revenue"));
      const residentTaxable = Math.max(
        0,
        income -
          i.num("social") -
          basicDeductionResidentTax(income) -
          i.int("dependents") * DEPENDENT_DEDUCTION.residentTax,
      );
      const incomeTaxable = Math.max(
        0,
        income -
          i.num("social") -
          basicDeductionIncomeTax(income) -
          i.int("dependents") * DEPENDENT_DEDUCTION.incomeTax,
      );
      const levy = residentTaxable * RESIDENT_TAX.incomeRate;
      const rate = marginalIncomeTaxRate(incomeTaxable);
      const denominator = 0.9 - rate * (1 + RECONSTRUCTION_TAX_RATE);
      const limit =
        denominator > 0 ? (levy * 0.2) / denominator + 2_000 : 2_000;
      return [
        { label: "寄附上限額の目安", value: yen(limit), primary: true },
        { label: "住民税所得割額", value: yen(levy) },
        { label: "所得税の限界税率", value: pct(rate * 100, 0) },
        {
          label: "実質的な自己負担",
          value: yen(2_000),
          note: "上限内で寄附した場合",
        },
        {
          label: "控除額の合計",
          value: yen(Math.max(0, limit - 2_000)),
        },
      ];
    },
    note: "医療費控除や住宅ローン控除がある場合は上限が下がります。正確な額は自治体にご確認ください。",
  },

  /* 24 */
  "catalog-24": {
    title: "源泉徴収税額計算",
    lead: "月々の給与から天引きされる源泉所得税額（甲欄）を概算します。",
    fields: [
      moneyField("gross", "総支給額（月）", "300000"),
      moneyField("social", "社会保険料（月）", "45000"),
      countField("dependents", "扶養親族等の数", "0", "人"),
    ],
    compute: (i) => {
      const base = Math.max(0, i.num("gross") - i.num("social"));
      // 月額表（甲欄）の近似：年換算して年税額を求め12分割する
      const annualRevenue = i.num("gross") * 12;
      const income = employmentIncome(annualRevenue);
      const taxable = Math.max(
        0,
        income -
          i.num("social") * 12 -
          basicDeductionIncomeTax(income) -
          i.int("dependents") * DEPENDENT_DEDUCTION.incomeTax,
      );
      const annualTax =
        incomeTaxFromTaxable(taxable) * (1 + RECONSTRUCTION_TAX_RATE);
      const monthly = Math.floor(annualTax / 12 / 10) * 10;
      return [
        { label: "源泉徴収税額（月）", value: yen(monthly), primary: true },
        { label: "社会保険料控除後の給与", value: yen(base) },
        { label: "年間の所得税額", value: yen(annualTax) },
        { label: "扶養親族等の数", value: `${i.int("dependents")}人` },
        {
          label: "年間の源泉徴収合計",
          value: yen(monthly * 12),
          note: "年末調整で差額が精算されます",
        },
      ];
    },
    note: "源泉徴収税額表（月額表・甲欄）の近似計算です。実際の天引額は税額表の区分により数十円〜数百円異なります。",
  },

  /* 25 */
  "catalog-25": {
    title: "年末調整シミュレーター",
    lead: "源泉徴収済みの税額と年税額を比較し、還付・追徴額を試算します。",
    fields: [
      moneyField("revenue", "給与収入（年間）", "5000000"),
      moneyField("social", "社会保険料控除", "750000"),
      moneyField("withheld", "源泉徴収税額の合計", "150000"),
      moneyField("other", "その他の所得控除（保険料控除など）", "80000"),
      countField("dependents", "扶養親族の人数", "0", "人"),
    ],
    compute: (i) => {
      const income = employmentIncome(i.num("revenue"));
      const taxable = Math.max(
        0,
        income -
          i.num("social") -
          basicDeductionIncomeTax(income) -
          i.int("dependents") * DEPENDENT_DEDUCTION.incomeTax -
          i.num("other"),
      );
      const annualTax =
        incomeTaxFromTaxable(taxable) * (1 + RECONSTRUCTION_TAX_RATE);
      const diff = i.num("withheld") - annualTax;
      return [
        {
          label: diff >= 0 ? "還付される金額" : "追加で納める金額",
          value: yen(Math.abs(diff)),
          primary: true,
        },
        { label: "年税額（確定額）", value: yen(annualTax) },
        { label: "源泉徴収税額の合計", value: yen(i.num("withheld")) },
        {
          label: "課税所得金額",
          value: yen(Math.floor(taxable / 1000) * 1000),
        },
        { label: "所得控除の合計", value: yen(income - taxable) },
      ];
    },
    note: taxNote,
  },

  /* 26 */
  "catalog-26": {
    title: "社会保険料計算",
    lead: "報酬月額から健康保険・介護保険・厚生年金・雇用保険の本人負担額を計算します。",
    fields: [moneyField("monthly", "報酬月額", "300000"), careField],
    compute: (i) => {
      const s = socialInsuranceMonthly(i.num("monthly"), isCare(i.raw("care")));
      return [
        {
          label: "社会保険料（本人負担・月額）",
          value: yen(s.total),
          primary: true,
        },
        {
          label: "健康保険料",
          value: yen(s.health),
          note: `標準報酬月額 ${yen(s.healthStandard)}（${s.healthGrade}等級）`,
        },
        ...(s.care > 0 ? [{ label: "介護保険料", value: yen(s.care) }] : []),
        {
          label: "厚生年金保険料",
          value: yen(s.pension),
          note: `標準報酬月額 ${yen(s.pensionStandard)}（${s.pensionGrade}等級）`,
        },
        { label: "雇用保険料", value: yen(s.employment) },
        { label: "年間の本人負担額", value: yen(s.total * 12) },
        {
          label: "負担率",
          value: pct(
            i.num("monthly") ? (s.total / i.num("monthly")) * 100 : 0,
            2,
          ),
        },
      ];
    },
    note: "健康保険料率は協会けんぽ全国平均10.00％で計算。都道府県・健保組合により異なります。",
    sources: [sourceKenpo, sourcePension],
  },

  /* 27 */
  "catalog-27": {
    title: "健康保険料計算",
    lead: "標準報酬月額と保険料率から健康保険料を計算します。",
    fields: [
      moneyField("monthly", "報酬月額", "300000"),
      rateField("rate", "健康保険料率（全体）", "10.00"),
      careField,
    ],
    compute: (i) => {
      const grade = healthStandardRemuneration(i.num("monthly"));
      const total = (grade.standard * i.num("rate")) / 100;
      const care = isCare(i.raw("care"))
        ? grade.standard * INSURANCE_RATES.longTermCare
        : 0;
      return [
        {
          label: "健康保険料（本人負担・月額）",
          value: yen((total + care) / 2),
          primary: true,
        },
        {
          label: "標準報酬月額",
          value: yen(grade.standard),
          note: `第${grade.grade}等級`,
        },
        { label: "健康保険料（全体）", value: yen(total) },
        ...(care > 0
          ? [
              { label: "介護保険料（全体）", value: yen(care) },
              { label: "介護保険料（本人）", value: yen(care / 2) },
            ]
          : []),
        { label: "事業主負担", value: yen((total + care) / 2) },
        { label: "年間の本人負担額", value: yen(((total + care) / 2) * 12) },
      ];
    },
    note: "健康保険料は労使折半です。料率は協会けんぽの都道府県別料額表でご確認ください。",
    sources: [sourceKenpo],
  },

  /* 28 */
  "catalog-28": {
    title: "厚生年金保険料計算",
    lead: "標準報酬月額から厚生年金保険料の本人負担額を計算します。",
    fields: [moneyField("monthly", "報酬月額", "300000")],
    compute: (i) => {
      const grade = pensionStandardRemuneration(i.num("monthly"));
      const total = grade.standard * INSURANCE_RATES.pension;
      return [
        {
          label: "厚生年金保険料（本人負担・月額）",
          value: yen(total / 2),
          primary: true,
        },
        {
          label: "標準報酬月額",
          value: yen(grade.standard),
          note: `第${grade.grade}等級（上限は第32等級 650,000円）`,
        },
        { label: "保険料率", value: pct(INSURANCE_RATES.pension * 100, 3) },
        { label: "保険料（全体）", value: yen(total) },
        { label: "事業主負担", value: yen(total / 2) },
        { label: "年間の本人負担額", value: yen((total / 2) * 12) },
      ];
    },
    sources: [sourcePension],
  },

  /* 29 */
  "catalog-29": {
    title: "雇用保険料計算",
    lead: "賃金総額と負担率から雇用保険料を計算します。",
    fields: [
      moneyField("wage", "賃金総額（月）", "300000"),
      rateField("rate", "労働者負担率", "0.55"),
      rateField("employerRate", "事業主負担率", "0.90"),
    ],
    compute: (i) => {
      const wage = i.num("wage");
      const employee = (wage * i.num("rate")) / 100;
      const employer = (wage * i.num("employerRate")) / 100;
      return [
        {
          label: "雇用保険料（本人負担・月額）",
          value: yen(employee),
          primary: true,
        },
        { label: "事業主負担", value: yen(employer) },
        { label: "合計", value: yen(employee + employer) },
        { label: "年間の本人負担額", value: yen(employee * 12) },
      ];
    },
    note: "令和7年度の一般の事業は労働者5.5/1000・事業主9.0/1000。農林水産・建設業は率が異なります。",
    sources: [sourceMHLW],
  },

  /* 30 */
  "catalog-30": {
    title: "標準報酬月額計算",
    lead: "報酬月額から健康保険・厚生年金の標準報酬月額と等級を判定します。",
    fields: [
      moneyField("april", "4月の報酬", "300000"),
      moneyField("may", "5月の報酬", "300000"),
      moneyField("june", "6月の報酬", "310000"),
    ],
    compute: (i) => {
      const average = (i.num("april") + i.num("may") + i.num("june")) / 3;
      const health = healthStandardRemuneration(average);
      const pension = pensionStandardRemuneration(average);
      return [
        {
          label: "標準報酬月額（健康保険）",
          value: yen(health.standard),
          primary: true,
          note: `第${health.grade}等級`,
        },
        {
          label: "標準報酬月額（厚生年金）",
          value: yen(pension.standard),
          note: `第${pension.grade}等級`,
        },
        { label: "報酬月額の平均（4〜6月）", value: yen(average) },
        {
          label: "健康保険料（本人）",
          value: yen((health.standard * INSURANCE_RATES.health) / 2),
        },
        {
          label: "厚生年金保険料（本人）",
          value: yen((pension.standard * INSURANCE_RATES.pension) / 2),
        },
      ];
    },
    note: "定時決定は4〜6月の報酬平均で決まり、その年の9月から翌年8月まで適用されます。",
    sources: [sourceKenpo],
  },

  /* 31 */
  "catalog-31": {
    title: "国民年金保険料計算",
    lead: "国民年金第1号被保険者の保険料と免除・納付額を計算します。",
    fields: [
      moneyField("monthly", "保険料（月額）", String(NATIONAL_PENSION_MONTHLY)),
      countField("months", "納付月数", "12", "ヶ月"),
      selectField("exemption", "免除区分", "0", [
        { value: "0", label: "全額納付" },
        { value: "0.25", label: "4分の1免除" },
        { value: "0.5", label: "半額免除" },
        { value: "0.75", label: "4分の3免除" },
        { value: "1", label: "全額免除" },
      ]),
    ],
    compute: (i) => {
      const monthly = i.num("monthly");
      const ratio = 1 - i.num("exemption");
      const payment = monthly * ratio;
      const months = i.int("months");
      return [
        { label: "納付総額", value: yen(payment * months), primary: true },
        { label: "1ヶ月あたりの納付額", value: yen(payment) },
        { label: "免除される額（月）", value: yen(monthly - payment) },
        { label: "納付月数", value: `${months}ヶ月` },
        {
          label: "年金額への反映割合",
          value: pct(
            (i.num("exemption") === 0
              ? 1
              : i.num("exemption") === 0.25
                ? 7 / 8
                : i.num("exemption") === 0.5
                  ? 3 / 4
                  : i.num("exemption") === 0.75
                    ? 5 / 8
                    : 1 / 2) * 100,
            1,
          ),
          note: "免除期間は国庫負担分が年金額に反映されます",
        },
      ];
    },
    note: `令和7年度の国民年金保険料は月額${yen(NATIONAL_PENSION_MONTHLY)}です。`,
    sources: [sourcePension],
  },

  /* 32 */
  "catalog-32": {
    title: "国民年金前納比較",
    lead: "毎月納付と6ヶ月・1年・2年前納の割引額を比較します。",
    fields: [
      moneyField("monthly", "保険料（月額）", String(NATIONAL_PENSION_MONTHLY)),
      selectField("method", "納付方法", "bank", [
        { value: "bank", label: "口座振替" },
        { value: "cash", label: "現金・クレジットカード" },
      ]),
    ],
    compute: (i) => {
      const monthly = i.num("monthly");
      const bank = i.raw("method") === "bank";
      // 前納の割引額（令和7年度の実績に近い水準）
      const plans: [string, number, number][] = [
        ["毎月納付（当月末振替）", 1, bank ? 50 : 0],
        ["6ヶ月前納", 6, bank ? 1_180 : 830],
        ["1年前納", 12, bank ? 4_390 : 3_700],
        ["2年前納", 24, bank ? 16_610 : 15_240],
      ];
      const rows = plans.map(([label, months, discount]) => {
        const normal = monthly * months;
        return {
          label,
          value: yen(normal - discount),
          note: `割引 ${yen(discount)}／実質月額 ${yen((normal - discount) / months)}`,
        };
      });
      const best = plans[3];
      return [
        {
          label: "2年前納の割引額",
          value: yen(best[2]),
          primary: true,
          note: bank ? "口座振替の場合" : "現金・クレジットカードの場合",
        },
        ...rows,
        {
          label: "2年前納の割引率",
          value: pct((best[2] / (monthly * 24)) * 100, 2),
        },
      ];
    },
    note: "割引額は年度ごとに決まります。2年前納の申込期限は2月末です。",
    sources: [sourcePension],
  },

  /* 33 */
  "catalog-33": {
    title: "付加年金計算",
    lead: "月400円の付加保険料を納めた場合の年金増額と元を取る年数を計算します。",
    fields: [
      countField("months", "付加保険料の納付月数", "240", "ヶ月"),
      countField(
        "premium",
        "付加保険料（月額）",
        String(ADDITIONAL_PENSION_MONTHLY),
        "円",
      ),
    ],
    compute: (i) => {
      const months = i.int("months");
      const paid = months * i.num("premium");
      const annualIncrease = 200 * months;
      return [
        {
          label: "年金の増額（年額）",
          value: yen(annualIncrease),
          primary: true,
        },
        { label: "納付総額", value: yen(paid) },
        { label: "月あたりの増額", value: yen(annualIncrease / 12) },
        {
          label: "元が取れる年数",
          value:
            annualIncrease > 0 ? `${num(paid / annualIncrease, 1)}年` : "—",
          note: "受給開始から2年で納付額を回収できます",
        },
        { label: "10年受給した場合の受取額", value: yen(annualIncrease * 10) },
        { label: "20年受給した場合の受取額", value: yen(annualIncrease * 20) },
      ];
    },
    note: "付加年金は国民年金第1号被保険者と任意加入被保険者が対象です（国民年金基金との併用不可）。",
    sources: [sourcePension],
  },

  /* 34 */
  "catalog-34": {
    title: "老齢基礎年金シミュレーター",
    lead: "保険料の納付月数・免除月数から老齢基礎年金の受給額を試算します。",
    fields: [
      countField("paid", "保険料納付月数", "480", "ヶ月"),
      countField("fullExempt", "全額免除月数", "0", "ヶ月"),
      countField("halfExempt", "半額免除月数", "0", "ヶ月"),
    ],
    compute: (i) => {
      const paid = i.int("paid");
      const full = i.int("fullExempt");
      const half = i.int("halfExempt");
      const effective = Math.min(
        PENSION_FULL_MONTHS,
        paid + full * 0.5 + half * 0.75,
      );
      const annual =
        (BASIC_PENSION_FULL_YEAR * effective) / PENSION_FULL_MONTHS;
      const totalMonths = paid + full + half;
      return [
        { label: "老齢基礎年金（年額）", value: yen(annual), primary: true },
        { label: "月あたり", value: yen(annual / 12) },
        { label: "満額（40年納付）", value: yen(BASIC_PENSION_FULL_YEAR) },
        {
          label: "満額に対する割合",
          value: pct((annual / BASIC_PENSION_FULL_YEAR) * 100, 1),
        },
        {
          label: "年金額に反映される月数",
          value: `${num(effective, 1)}ヶ月 / ${PENSION_FULL_MONTHS}ヶ月`,
        },
        {
          label: "受給資格",
          value: totalMonths >= 120 ? "あり（10年以上）" : "不足（10年未満）",
        },
      ];
    },
    note: `令和7年度の満額は年額${yen(BASIC_PENSION_FULL_YEAR)}（68歳以下）です。`,
    sources: [sourcePension],
  },

  /* 35 */
  "catalog-35": {
    title: "厚生年金受給額シミュレーター",
    lead: "平均標準報酬額と加入月数から報酬比例部分の年金額を試算します。",
    fields: [
      moneyField("average", "平均標準報酬額（賞与含む月額換算）", "350000"),
      countField("months", "厚生年金の加入月数", "480", "ヶ月"),
      countField("basicMonths", "国民年金の納付月数", "480", "ヶ月"),
    ],
    compute: (i) => {
      const proportional = i.num("average") * (5.481 / 1000) * i.int("months");
      const basic =
        (BASIC_PENSION_FULL_YEAR *
          Math.min(PENSION_FULL_MONTHS, i.int("basicMonths"))) /
        PENSION_FULL_MONTHS;
      const total = proportional + basic;
      return [
        { label: "年金の合計（年額）", value: yen(total), primary: true },
        { label: "月あたり", value: yen(total / 12) },
        {
          label: "報酬比例部分（厚生年金）",
          value: yen(proportional),
          note: "平均標準報酬額 × 5.481/1000 × 加入月数",
        },
        { label: "老齢基礎年金", value: yen(basic) },
        { label: "加入年数", value: `${num(i.int("months") / 12, 1)}年` },
      ];
    },
    note: "平成15年4月以降の総報酬制による簡易計算です。経過的加算・加給年金は含みません。",
    sources: [sourcePension],
  },

  /* 36 */
  "catalog-36": {
    title: "年金繰上げ受給シミュレーター",
    lead: "65歳より早く受け取る場合の減額率と生涯受取額の損益分岐を計算します。",
    fields: [
      moneyField("annual", "65歳から受け取る年金額（年額）", "1800000"),
      countField("age", "受給開始年齢", "62", "歳", "60〜64歳"),
      countField("lifeExpectancy", "想定する受給終了年齢", "85", "歳"),
    ],
    compute: (i) => {
      const startAge = Math.min(64, Math.max(60, i.int("age")));
      const months = (65 - startAge) * 12;
      const reduction = months * 0.004;
      const annual = i.num("annual") * (1 - reduction);
      const end = Math.max(startAge, i.int("lifeExpectancy"));
      const earlyTotal = annual * (end - startAge);
      const normalTotal = i.num("annual") * Math.max(0, end - 65);
      const breakEven = reduction
        ? 65 + ((1 - reduction) * (months / 12)) / reduction
        : 65;
      return [
        {
          label: "繰上げ後の年金額（年額）",
          value: yen(annual),
          primary: true,
        },
        { label: "月あたり", value: yen(annual / 12) },
        {
          label: "減額率",
          value: pct(reduction * 100, 1),
          note: `1ヶ月あたり0.4％ × ${months}ヶ月`,
        },
        { label: `${end}歳までの累計（繰上げ）`, value: yen(earlyTotal) },
        { label: `${end}歳までの累計（65歳開始）`, value: yen(normalTotal) },
        {
          label: "有利なのは",
          value: earlyTotal >= normalTotal ? "繰上げ受給" : "65歳から受給",
          note: `差額 ${yen(Math.abs(earlyTotal - normalTotal))}`,
        },
        {
          label: "損益分岐年齢の目安",
          value: `${num(Math.round(breakEven * 10) / 10, 1)}歳前後`,
        },
      ];
    },
    note: "繰上げ受給の減額は生涯続きます。障害年金・寡婦年金が受けられなくなる点に注意してください。",
    sources: [sourcePension],
  },

  /* 37 */
  "catalog-37": {
    title: "年金繰下げ受給シミュレーター",
    lead: "65歳より遅く受け取る場合の増額率と生涯受取額を比較します。",
    fields: [
      moneyField("annual", "65歳から受け取る年金額（年額）", "1800000"),
      countField("age", "受給開始年齢", "70", "歳", "66〜75歳"),
      countField("lifeExpectancy", "想定する受給終了年齢", "88", "歳"),
    ],
    compute: (i) => {
      const startAge = Math.min(75, Math.max(66, i.int("age")));
      const months = (startAge - 65) * 12;
      const increase = months * 0.007;
      const annual = i.num("annual") * (1 + increase);
      const end = Math.max(startAge, i.int("lifeExpectancy"));
      const deferredTotal = annual * (end - startAge);
      const normalTotal = i.num("annual") * (end - 65);
      const breakEven = startAge + (i.num("annual") * months) / 12 / annual;
      return [
        {
          label: "繰下げ後の年金額（年額）",
          value: yen(annual),
          primary: true,
        },
        { label: "月あたり", value: yen(annual / 12) },
        {
          label: "増額率",
          value: pct(increase * 100, 1),
          note: `1ヶ月あたり0.7％ × ${months}ヶ月`,
        },
        { label: `${end}歳までの累計（繰下げ）`, value: yen(deferredTotal) },
        { label: `${end}歳までの累計（65歳開始）`, value: yen(normalTotal) },
        {
          label: "有利なのは",
          value: deferredTotal >= normalTotal ? "繰下げ受給" : "65歳から受給",
          note: `差額 ${yen(Math.abs(deferredTotal - normalTotal))}`,
        },
        {
          label: "損益分岐年齢の目安",
          value: `${num(Math.round(breakEven * 10) / 10, 1)}歳前後`,
        },
      ];
    },
    note: "繰下げ中は加給年金が支給されません。年金額の増加で税・社会保険料も増える点に注意してください。",
    sources: [sourcePension],
  },

  /* 38 */
  "catalog-38": {
    title: "失業給付シミュレーター",
    lead: "離職前の賃金と被保険者期間から基本手当の日額・総額を試算します。",
    fields: [
      moneyField("wage6m", "離職前6ヶ月の賃金総額", "1800000"),
      countField("insuredYears", "雇用保険の被保険者期間", "10", "年"),
      selectField("ageBand", "離職時の年齢", "30", [
        { value: "29", label: "29歳以下" },
        { value: "30", label: "30〜44歳" },
        { value: "45", label: "45〜59歳" },
        { value: "60", label: "60〜64歳" },
      ]),
      selectField("reason", "離職理由", "self", [
        { value: "self", label: "自己都合" },
        { value: "company", label: "会社都合（特定受給資格者）" },
      ]),
    ],
    compute: (i) => {
      const daily = i.num("wage6m") / 180;
      const rate =
        daily <= 5_200
          ? 0.8
          : daily <= 12_790
            ? 0.8 - (0.3 * (daily - 5_200)) / 7_590
            : 0.5;
      const caps: Record<string, number> = {
        "29": 7_065,
        "30": 7_845,
        "45": 8_635,
        "60": 7_420,
      };
      const cap = caps[i.raw("ageBand")] ?? 7_845;
      const benefit = Math.min(daily * rate, cap);
      const years = i.int("insuredYears");
      const company = i.raw("reason") === "company";
      const age = Number(i.raw("ageBand"));
      let duration: number;
      if (company) {
        duration =
          years < 1
            ? 90
            : years < 5
              ? age >= 30
                ? 180
                : 90
              : years < 10
                ? age >= 45
                  ? 240
                  : 180
                : years < 20
                  ? age >= 45
                    ? 270
                    : 210
                  : age >= 45
                    ? 330
                    : 240;
      } else {
        duration = years < 1 ? 0 : years < 10 ? 90 : years < 20 ? 120 : 150;
      }
      return [
        {
          label: "基本手当の総額（目安）",
          value: yen(benefit * duration),
          primary: true,
        },
        { label: "基本手当日額", value: yen(benefit) },
        { label: "賃金日額", value: yen(daily) },
        { label: "給付率", value: pct(rate * 100, 1) },
        { label: "所定給付日数", value: `${duration}日` },
        {
          label: "支給開始まで",
          value: company ? "待期7日後" : "待期7日＋給付制限1ヶ月",
        },
        { label: "1ヶ月あたり（28日分）", value: yen(benefit * 28) },
      ];
    },
    note: "日額の上限は年齢区分ごとに毎年8月に改定されます。実際の給付日数はハローワークの判定によります。",
    sources: [sourceMHLW],
  },

  /* 39 */
  "catalog-39": {
    title: "育児休業給付シミュレーター",
    lead: "休業開始前の賃金から育児休業給付金の支給額を試算します。",
    fields: [
      moneyField("monthly", "休業開始前6ヶ月の平均月給", "300000"),
      countField("months", "育児休業の期間", "12", "ヶ月"),
    ],
    compute: (i) => {
      const dailyWage = Math.min(
        i.num("monthly") / 30,
        CHILDCARE_LEAVE.dailyWageCap,
      );
      const first = dailyWage * CHILDCARE_LEAVE.firstRate * 30;
      const later = dailyWage * CHILDCARE_LEAVE.laterRate * 30;
      const months = i.int("months");
      const firstMonths = Math.min(months, 6);
      const laterMonths = Math.max(0, months - 6);
      const total = first * firstMonths + later * laterMonths;
      return [
        { label: "育児休業給付金の総額", value: yen(total), primary: true },
        {
          label: "支給額（開始〜180日）",
          value: `${yen(first)} / 月`,
          note: `賃金日額 ${yen(dailyWage)} × 67％ × 30日`,
        },
        {
          label: "支給額（181日以降）",
          value: `${yen(later)} / 月`,
          note: "賃金日額 × 50％ × 30日",
        },
        { label: "休業期間", value: `${months}ヶ月` },
        {
          label: "社会保険料の免除",
          value: yen(
            socialInsuranceMonthly(i.num("monthly"), false).total * months,
          ),
          note: "育休中は健康保険・厚生年金が免除されます",
        },
      ];
    },
    note: "育児休業給付は非課税で社会保険料も免除されるため、手取りベースでは休業前の約8割相当になります。",
    sources: [sourceMHLW],
  },

  /* 40 */
  "catalog-40": {
    title: "出生後休業支援給付シミュレーター",
    lead: "2025年4月開始の出生後休業支援給付金（13％上乗せ）を含めた支給額を試算します。",
    fields: [
      moneyField("monthly", "休業開始前6ヶ月の平均月給", "300000"),
      countField("days", "対象となる休業日数", "28", "日", "最大28日"),
    ],
    compute: (i) => {
      const dailyWage = Math.min(
        i.num("monthly") / 30,
        CHILDCARE_LEAVE.dailyWageCap,
      );
      const days = Math.min(28, i.int("days"));
      const base = dailyWage * CHILDCARE_LEAVE.firstRate * days;
      const support = dailyWage * CHILDCARE_LEAVE.postBirthSupportRate * days;
      return [
        { label: "合計支給額", value: yen(base + support), primary: true },
        {
          label: "育児休業給付金（67％）",
          value: yen(base),
        },
        {
          label: "出生後休業支援給付金（13％）",
          value: yen(support),
        },
        {
          label: "合計給付率",
          value: pct(80, 0),
          note: "手取りでは実質10割相当",
        },
        { label: "賃金日額", value: yen(dailyWage) },
        { label: "対象日数", value: `${days}日` },
      ];
    },
    note: "子の出生後一定期間内に夫婦ともに14日以上の育児休業を取得した場合、最大28日間支給されます。",
    sources: [sourceMHLW],
  },

  /* 41 */
  "catalog-41": {
    title: "介護休業給付シミュレーター",
    lead: "介護休業給付金（賃金の67％・最大93日）の支給額を試算します。",
    fields: [
      moneyField("monthly", "休業開始前6ヶ月の平均月給", "300000"),
      countField("days", "介護休業の日数", "93", "日", "通算93日まで"),
    ],
    compute: (i) => {
      const dailyWage = i.num("monthly") / 30;
      const days = Math.min(93, i.int("days"));
      const benefit = dailyWage * 0.67 * days;
      return [
        { label: "介護休業給付金", value: yen(benefit), primary: true },
        { label: "1日あたりの支給額", value: yen(dailyWage * 0.67) },
        { label: "賃金日額", value: yen(dailyWage) },
        { label: "支給日数", value: `${days}日` },
        { label: "給付率", value: pct(67, 0) },
        {
          label: "1ヶ月あたり（30日）",
          value: yen(dailyWage * 0.67 * 30),
        },
      ];
    },
    note: "対象家族1人につき通算93日・3回まで分割取得できます。介護休業中の社会保険料は免除されません。",
    sources: [sourceMHLW],
  },

  /* 42 */
  "catalog-42": {
    title: "傷病手当金シミュレーター",
    lead: "標準報酬月額から傷病手当金の日額・支給総額を計算します。",
    fields: [
      moneyField(
        "standard",
        "支給開始日前12ヶ月の標準報酬月額の平均",
        "300000",
      ),
      countField("days", "休業日数", "90", "日"),
      countField("waiting", "待期完成までの日数", "3", "日"),
    ],
    compute: (i) => {
      const daily = (i.num("standard") / 30) * BENEFIT_RATE_TWO_THIRDS;
      const payable = Math.max(0, i.int("days") - i.int("waiting"));
      return [
        {
          label: "傷病手当金の総額",
          value: yen(daily * payable),
          primary: true,
        },
        {
          label: "1日あたりの支給額",
          value: yen(daily),
          note: "標準報酬月額の平均 ÷ 30 × 2/3",
        },
        { label: "支給対象日数", value: `${payable}日` },
        { label: "待期期間（無給）", value: `${i.int("waiting")}日` },
        { label: "1ヶ月あたり（30日）", value: yen(daily * 30) },
        {
          label: "支給期間の上限",
          value: "通算1年6ヶ月",
        },
      ];
    },
    note: "連続する3日間の待期完成後、4日目から支給されます。給与が支払われる場合は差額調整されます。",
    sources: [sourceKenpo],
  },

  /* 43 */
  "catalog-43": {
    title: "出産手当金シミュレーター",
    lead: "産前42日・産後56日の出産手当金を計算します。",
    fields: [
      moneyField(
        "standard",
        "支給開始日前12ヶ月の標準報酬月額の平均",
        "300000",
      ),
      countField("before", "産前の休業日数", "42", "日", "多胎は98日"),
      countField("after", "産後の休業日数", "56", "日"),
    ],
    compute: (i) => {
      const daily = (i.num("standard") / 30) * BENEFIT_RATE_TWO_THIRDS;
      const total = i.int("before") + i.int("after");
      return [
        { label: "出産手当金の総額", value: yen(daily * total), primary: true },
        { label: "1日あたりの支給額", value: yen(daily) },
        { label: "産前分", value: yen(daily * i.int("before")) },
        { label: "産後分", value: yen(daily * i.int("after")) },
        { label: "支給日数の合計", value: `${total}日` },
        {
          label: "社会保険料の免除額",
          value: yen(
            socialInsuranceMonthly(i.num("standard"), false).total *
              (total / 30),
          ),
          note: "産休中は健康保険・厚生年金が免除されます",
        },
      ];
    },
    note: "出産手当金は非課税です。出産が予定日より遅れた場合、その日数分も産前として支給されます。",
    sources: [sourceKenpo],
  },

  /* 44 */
  "catalog-44": {
    title: "出産育児一時金チェック",
    lead: "出産育児一時金の支給額と自己負担額を確認します。",
    fields: [
      countField("babies", "出産した子の人数", "1", "人"),
      moneyField("cost", "分娩・入院費の総額", "550000"),
      selectField("system", "産科医療補償制度", "yes", [
        { value: "yes", label: "加入機関で出産（在胎週数22週以上）" },
        { value: "no", label: "対象外" },
      ]),
    ],
    compute: (i) => {
      const perBaby = i.raw("system") === "yes" ? CHILDBIRTH_LUMP_SUM : 488_000;
      const total = perBaby * Math.max(1, i.int("babies"));
      const cost = i.num("cost");
      const diff = total - cost;
      return [
        {
          label: diff >= 0 ? "差額として受け取れる額" : "自己負担額",
          value: yen(Math.abs(diff)),
          primary: true,
        },
        { label: "出産育児一時金（合計）", value: yen(total) },
        { label: "1人あたりの支給額", value: yen(perBaby) },
        { label: "分娩・入院費", value: yen(cost) },
        {
          label: "直接支払制度を使う場合",
          value:
            diff >= 0 ? "差額を申請して受給" : `窓口で${yen(-diff)}を支払い`,
        },
      ];
    },
    note: "2023年4月以降の出産で50万円（産科医療補償制度未加入機関は48.8万円）。帝王切開など保険適用分は高額療養費の対象にもなります。",
  },

  /* 45 */
  "catalog-45": {
    title: "社会保険適用判定",
    lead: "短時間労働者が社会保険の加入対象になるかを判定します。",
    fields: [
      decimalField("weeklyHours", "週の所定労働時間", "20", "時間"),
      moneyField("monthlyWage", "所定内賃金（月額）", "90000"),
      countField("employees", "勤務先の従業員数", "100", "人"),
      countField("expectedMonths", "雇用の見込み期間", "12", "ヶ月"),
      selectField("student", "学生かどうか", "no", [
        { value: "no", label: "学生ではない" },
        { value: "yes", label: "学生（昼間部）" },
      ]),
    ],
    compute: (i) => {
      const hours = i.num("weeklyHours");
      const wage = i.num("monthlyWage");
      const employees = i.int("employees");
      const months = i.int("expectedMonths");
      const student = i.raw("student") === "yes";
      const fullTime = hours >= 30;
      const expanded =
        hours >= 20 &&
        wage >= 88_000 &&
        months >= 2 &&
        !student &&
        employees >= 51;
      const eligible = fullTime || expanded;
      const check = (ok: boolean, text: string) => ({
        label: text,
        value: ok ? "○ 満たす" : "× 満たさない",
      });
      return [
        {
          label: "社会保険（健康保険・厚生年金）の加入",
          value: eligible ? "加入対象です" : "加入対象外です",
          primary: true,
          note: fullTime
            ? "週30時間以上のため通常の被保険者に該当"
            : "適用拡大の4要件で判定",
        },
        check(hours >= 20, "週の所定労働時間が20時間以上"),
        check(wage >= 88_000, "所定内賃金が月額88,000円以上"),
        check(months >= 2, "2ヶ月を超える雇用の見込み"),
        check(!student, "学生ではない"),
        check(employees >= 51, "従業員数51人以上の企業"),
        {
          label: "雇用保険の加入",
          value: hours >= 20 && months >= 1 ? "加入対象です" : "加入対象外です",
          note: "週20時間以上かつ31日以上の雇用見込み",
        },
      ];
    },
    note: "2024年10月から従業員51人以上の企業に適用拡大されています。賃金に残業代・賞与・通勤手当は含みません。",
    sources: [sourceMHLW],
  },

  /* 46 */
  "catalog-46": {
    title: "勤務時間計算",
    lead: "出勤時刻と退勤時刻から拘束時間と実働時間を計算します。",
    fields: [
      timeField("start", "出勤時刻", "09:00"),
      timeField("end", "退勤時刻", "18:00"),
      countField("break", "休憩時間", "60", "分"),
    ],
    compute: (i) => {
      const start = i.minutes("start");
      let end = i.minutes("end");
      if (end <= start) end += 24 * 60;
      const span = end - start;
      const work = Math.max(0, span - i.num("break"));
      const legalBreak =
        work + i.num("break") > 480 ? 60 : work + i.num("break") > 360 ? 45 : 0;
      return [
        { label: "実働時間", value: fmtHours(work / 60, 2), primary: true },
        { label: "拘束時間", value: fmtHours(span / 60, 2) },
        { label: "休憩時間", value: `${num(i.num("break"))}分` },
        {
          label: "法定の休憩時間",
          value: legalBreak > 0 ? `${legalBreak}分以上` : "不要",
          note: "6時間超で45分、8時間超で60分",
        },
        {
          label: "法定労働時間（8時間）との差",
          value:
            work > 480
              ? `+${fmtHours((work - 480) / 60, 2)}`
              : fmtHours((work - 480) / 60, 2),
        },
      ];
    },
  },

  /* 47 */
  "catalog-47": {
    title: "実働時間計算",
    lead: "拘束時間から休憩を除いた実働時間と時間外労働を計算します。",
    fields: [
      timeField("start", "始業時刻", "09:00"),
      timeField("end", "終業時刻", "20:00"),
      countField("break", "休憩時間", "60", "分"),
      decimalField("scheduled", "所定労働時間", "8", "時間"),
    ],
    compute: (i) => {
      const start = i.minutes("start");
      let end = i.minutes("end");
      if (end <= start) end += 24 * 60;
      const work = Math.max(0, end - start - i.num("break"));
      const scheduled = i.num("scheduled") * 60;
      const overtime = Math.max(0, work - scheduled);
      const legalOvertime = Math.max(0, work - 480);
      return [
        { label: "実働時間", value: fmtHours(work / 60, 2), primary: true },
        { label: "所定労働時間", value: fmtHours(scheduled / 60, 2) },
        { label: "所定外労働", value: fmtHours(overtime / 60, 2) },
        {
          label: "法定時間外労働（割増対象）",
          value: fmtHours(legalOvertime / 60, 2),
          note: "1日8時間を超える部分",
        },
        { label: "拘束時間", value: fmtHours((end - start) / 60, 2) },
      ];
    },
  },

  /* 48 */
  "catalog-48": {
    title: "休憩時間計算",
    lead: "労働時間に応じて必要な法定休憩時間を判定します。",
    fields: [
      decimalField("work", "労働時間（休憩を除く）", "8", "時間"),
      countField("actual", "実際に取得した休憩", "60", "分"),
    ],
    compute: (i) => {
      const work = i.num("work");
      const total = work * 60 + i.num("actual");
      const required = total > 480 ? 60 : total > 360 ? 45 : 0;
      const actual = i.num("actual");
      return [
        {
          label: "必要な休憩時間",
          value: required > 0 ? `${required}分以上` : "法定の付与義務なし",
          primary: true,
        },
        { label: "拘束時間", value: fmtHours(total / 60, 2) },
        { label: "実際の休憩時間", value: `${num(actual)}分` },
        {
          label: "判定",
          value: actual >= required ? "適法（基準を満たす）" : "不足しています",
          note:
            actual >= required
              ? undefined
              : `あと${required - actual}分の休憩が必要です`,
        },
        {
          label: "根拠",
          value: "労働基準法34条（6時間超45分／8時間超60分）",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 49 */
  "catalog-49": {
    title: "残業時間計算",
    lead: "1ヶ月の労働時間から法定時間外労働の時間数を計算します。",
    fields: [
      decimalField("totalHours", "月の総労働時間", "190", "時間"),
      countField("workDays", "月の勤務日数", "21", "日"),
      decimalField("scheduled", "1日の所定労働時間", "8", "時間"),
    ],
    compute: (i) => {
      const total = i.num("totalHours");
      const scheduledTotal = i.num("scheduled") * i.int("workDays");
      const legalTotal = 8 * i.int("workDays");
      const overtime = Math.max(0, total - scheduledTotal);
      const legalOvertime = Math.max(0, total - legalTotal);
      const over60 = Math.max(0, legalOvertime - 60);
      return [
        {
          label: "法定時間外労働",
          value: fmtHours(legalOvertime, 1),
          primary: true,
        },
        { label: "所定外労働", value: fmtHours(overtime, 1) },
        { label: "所定労働時間の合計", value: fmtHours(scheduledTotal, 1) },
        {
          label: "月60時間を超える部分",
          value: fmtHours(over60, 1),
          note: "50％以上の割増率が必要",
        },
        {
          label: "36協定の上限（原則45時間）",
          value:
            legalOvertime <= 45
              ? "範囲内"
              : `${num(legalOvertime - 45, 1)}時間超過`,
        },
        {
          label: "単月上限（100時間未満）",
          value: legalOvertime < 100 ? "範囲内" : "上限超過",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 50 */
  "catalog-50": {
    title: "残業代計算",
    lead: "基礎時給と残業時間から割増賃金を計算します。",
    fields: [
      moneyField("monthly", "月給（割増賃金の基礎となる額）", "280000"),
      decimalField("monthlyHours", "月平均所定労働時間", "160", "時間"),
      decimalField("overtime", "時間外労働", "20", "時間"),
      decimalField("night", "うち深夜労働（22時〜5時）", "0", "時間"),
      decimalField("holiday", "法定休日労働", "0", "時間"),
    ],
    compute: (i) => {
      const hourly = i.num("monthlyHours")
        ? i.num("monthly") / i.num("monthlyHours")
        : 0;
      const ot = i.num("overtime");
      const normalOt = Math.min(ot, 60);
      const extraOt = Math.max(0, ot - 60);
      const otPay =
        hourly * normalOt * (1 + PREMIUM_RATES.overtime) +
        hourly * extraOt * (1 + PREMIUM_RATES.overtimeOver60h);
      const nightPay = hourly * i.num("night") * PREMIUM_RATES.night;
      const holidayPay =
        hourly * i.num("holiday") * (1 + PREMIUM_RATES.holiday);
      const total = otPay + nightPay + holidayPay;
      return [
        { label: "割増賃金の合計", value: yen(total), primary: true },
        {
          label: "基礎時給",
          value: yen(hourly),
          note: "月給 ÷ 月平均所定労働時間",
        },
        {
          label: `時間外労働（60時間まで・${pct(125, 0)}）`,
          value: yen(hourly * normalOt * 1.25),
        },
        ...(extraOt > 0
          ? [
              {
                label: `60時間超の時間外労働（${pct(150, 0)}）`,
                value: yen(hourly * extraOt * 1.5),
              },
            ]
          : []),
        ...(i.num("night") > 0
          ? [{ label: "深夜割増（25％加算）", value: yen(nightPay) }]
          : []),
        ...(i.num("holiday") > 0
          ? [
              {
                label: `法定休日労働（${pct(135, 0)}）`,
                value: yen(holidayPay),
              },
            ]
          : []),
      ];
    },
    note: "基礎賃金からは家族手当・通勤手当・住宅手当・賞与などを除外できます。",
    sources: [sourceMHLW],
  },

  /* 51 */
  "catalog-51": {
    title: "深夜残業代計算",
    lead: "22時〜5時の深夜時間帯に働いた場合の割増賃金を計算します。",
    fields: [
      moneyField("hourly", "基礎時給", "1800"),
      decimalField("nightOvertime", "深夜かつ時間外の労働時間", "10", "時間"),
      decimalField("nightOnly", "深夜だが所定内の労働時間", "0", "時間"),
      selectField("over60", "月60時間超の時間外か", "no", [
        { value: "no", label: "60時間以内（時間外25％）" },
        { value: "yes", label: "60時間超（時間外50％）" },
      ]),
    ],
    compute: (i) => {
      const hourly = i.num("hourly");
      const otRate =
        i.raw("over60") === "yes"
          ? PREMIUM_RATES.overtimeOver60h
          : PREMIUM_RATES.overtime;
      const rate = 1 + otRate + PREMIUM_RATES.night;
      const nightOt = hourly * i.num("nightOvertime") * rate;
      const nightOnly = hourly * i.num("nightOnly") * (1 + PREMIUM_RATES.night);
      return [
        {
          label: "深夜残業代の合計",
          value: yen(nightOt + nightOnly),
          primary: true,
        },
        {
          label: "適用される割増率",
          value: pct(rate * 100, 0),
          note: `時間外${pct(otRate * 100, 0)}＋深夜25％`,
        },
        { label: "1時間あたりの支給額", value: yen(hourly * rate) },
        { label: "深夜かつ時間外の分", value: yen(nightOt) },
        ...(i.num("nightOnly") > 0
          ? [
              {
                label: "深夜のみ（所定内）の分",
                value: yen(nightOnly),
                note: "割増率125％",
              },
            ]
          : []),
      ];
    },
    sources: [sourceMHLW],
  },

  /* 52 */
  "catalog-52": {
    title: "休日出勤手当計算",
    lead: "法定休日・法定外休日の出勤に対する賃金を計算します。",
    fields: [
      moneyField("hourly", "基礎時給", "1800"),
      decimalField("legalHoliday", "法定休日の労働時間", "8", "時間"),
      decimalField("otherHoliday", "法定外休日の労働時間", "0", "時間"),
      decimalField("night", "うち深夜労働", "0", "時間"),
    ],
    compute: (i) => {
      const hourly = i.num("hourly");
      const legal =
        hourly * i.num("legalHoliday") * (1 + PREMIUM_RATES.holiday);
      const other =
        hourly * i.num("otherHoliday") * (1 + PREMIUM_RATES.overtime);
      const night = hourly * i.num("night") * PREMIUM_RATES.night;
      return [
        {
          label: "休日出勤手当の合計",
          value: yen(legal + other + night),
          primary: true,
        },
        {
          label: `法定休日労働（${pct(135, 0)}）`,
          value: yen(legal),
          note: "週1日の法定休日に労働した場合",
        },
        {
          label: `法定外休日労働（${pct(125, 0)}）`,
          value: yen(other),
          note: "週休2日制の土曜など。時間外労働として扱われます",
        },
        ...(night > 0
          ? [{ label: "深夜割増（25％加算）", value: yen(night) }]
          : []),
        { label: "基礎時給", value: yen(hourly) },
      ];
    },
    note: "法定休日労働には時間外割増は加算されず、35％以上の割増率が適用されます。",
    sources: [sourceMHLW],
  },

  /* 53 */
  "catalog-53": {
    title: "法定休日・所定休日判定",
    lead: "出勤日が法定休日か所定休日かを判定し、割増率を確認します。",
    fields: [
      dateField("date", "出勤した日", iso(today())),
      selectField("legalDay", "就業規則で定める法定休日", "0", [
        { value: "0", label: "日曜日" },
        { value: "6", label: "土曜日" },
        { value: "1", label: "月曜日" },
        { value: "2", label: "火曜日" },
        { value: "3", label: "水曜日" },
        { value: "4", label: "木曜日" },
        { value: "5", label: "金曜日" },
      ]),
      selectField("offDays", "会社の休日", "weekend", [
        { value: "weekend", label: "完全週休2日（土日）" },
        { value: "sunday", label: "週休1日（日曜のみ）" },
      ]),
    ],
    compute: (i) => {
      const date = i.date("date");
      if (!date)
        return [{ label: "日付を選択してください", value: "—", primary: true }];
      const day = date.getDay();
      const names = ["日", "月", "火", "水", "木", "金", "土"];
      const legalDay = Number(i.raw("legalDay"));
      const isLegal = day === legalDay;
      const offDays = i.raw("offDays") === "weekend" ? [0, 6] : [0];
      const isOff = offDays.includes(day);
      const kind = isLegal
        ? "法定休日"
        : isOff
          ? "法定外休日（所定休日）"
          : "通常の勤務日";
      return [
        { label: "この日の区分", value: kind, primary: true },
        { label: "曜日", value: `${names[day]}曜日` },
        {
          label: "割増率",
          value: isLegal
            ? "35％以上（休日割増）"
            : isOff
              ? "25％以上（時間外割増・週40時間超の場合）"
              : "8時間超で25％以上",
        },
        {
          label: "深夜労働がある場合",
          value: isLegal ? "60％以上" : "50％以上",
        },
        {
          label: "法定休日の付与義務",
          value: "週1日または4週4日",
        },
      ];
    },
    note: "法定休日が特定されていない場合、週の起算日から見て後順の休日が法定休日として扱われるのが一般的です。",
    sources: [sourceMHLW],
  },

  /* 54 */
  "catalog-54": {
    title: "有給休暇付与日数チェック",
    lead: "勤続期間と出勤率から年次有給休暇の付与日数を確認します。",
    fields: [
      dateField("joined", "入社日", "2022-04-01"),
      dateField("base", "判定する日", iso(today())),
      rateField("attendance", "出勤率", "100"),
      decimalField("weekDays", "週の所定労働日数", "5", "日"),
    ],
    compute: (i) => {
      const joined = i.date("joined");
      const base = i.date("base");
      if (!joined || !base)
        return [{ label: "日付を選択してください", value: "—", primary: true }];
      const { totalMonths, years, months } = calendarDiff(joined, base);
      const weekDays = i.num("weekDays");
      const fullTime = weekDays >= 5;
      const granted = paidLeaveDays(totalMonths);
      // 比例付与（週4日以下かつ週30時間未満）
      const proportional: Record<number, number[]> = {
        4: [7, 8, 9, 10, 12, 13, 15],
        3: [5, 6, 6, 8, 9, 10, 11],
        2: [3, 4, 4, 5, 6, 6, 7],
        1: [1, 2, 2, 2, 3, 3, 3],
      };
      const stages = [6, 18, 30, 42, 54, 66, 78];
      const stageIndex = stages.reduce(
        (acc, m, index) => (totalMonths >= m ? index : acc),
        -1,
      );
      const value =
        fullTime || stageIndex < 0
          ? granted
          : ((proportional[Math.max(1, Math.min(4, Math.round(weekDays)))] ??
              [])[stageIndex] ?? 0);
      const next = nextPaidLeaveGrant(totalMonths);
      const attendance = i.num("attendance");
      return [
        {
          label: "付与日数",
          value: attendance >= 80 ? `${value}日` : "0日",
          primary: true,
          note:
            attendance >= 80
              ? undefined
              : "出勤率が8割未満のため付与されません",
        },
        { label: "勤続期間", value: `${years}年${months}ヶ月` },
        { label: "出勤率", value: pct(attendance, 1) },
        {
          label: "付与方式",
          value: fullTime
            ? "通常付与（週5日以上）"
            : `比例付与（週${weekDays}日）`,
        },
        ...(next
          ? [
              {
                label: "次回の付与",
                value: `勤続${Math.floor(next.months / 12)}年${next.months % 12}ヶ月時点で${next.days}日`,
              },
            ]
          : [{ label: "次回の付与", value: "毎年20日（上限）" }]),
        {
          label: "時効",
          value: "付与日から2年（最大40日まで繰越）",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 55 */
  "catalog-55": {
    title: "有給休暇付与日計算",
    lead: "入社日から次回以降の有給休暇の付与日と日数を一覧します。",
    fields: [dateField("joined", "入社日", "2024-04-01")],
    compute: (i) => {
      const joined = i.date("joined");
      if (!joined)
        return [
          { label: "入社日を選択してください", value: "—", primary: true },
        ];
      const stages: [number, number][] = [
        [6, 10],
        [18, 11],
        [30, 12],
        [42, 14],
        [54, 16],
        [66, 18],
        [78, 20],
      ];
      const now = today();
      const grants = stages.map(([months, value]) => {
        const date = new Date(joined);
        date.setMonth(date.getMonth() + months);
        return { date, value, months };
      });
      const nextGrant = grants.find((g) => g.date > now);
      return [
        {
          label: "次回の付与日",
          value: nextGrant
            ? `${iso(nextGrant.date).replaceAll("-", "/")}（${nextGrant.value}日）`
            : "毎年同月日に20日",
          primary: true,
          note: nextGrant
            ? `あと${diffDays(now, nextGrant.date)}日`
            : undefined,
        },
        ...grants.map((g) => ({
          label: `勤続${Math.floor(g.months / 12)}年${g.months % 12}ヶ月`,
          value: `${iso(g.date).replaceAll("-", "/")} に ${g.value}日`,
        })),
      ];
    },
    note: "入社日を基準とした法定の付与日です。会社が一斉付与（基準日方式）を採用している場合は異なります。",
  },

  /* 56 */
  "catalog-56": {
    title: "有給残日数管理",
    lead: "前年繰越分と当年付与分から有給休暇の残日数と時効消滅分を計算します。",
    fields: [
      countField("carried", "前年からの繰越日数", "8", "日"),
      countField("granted", "当年の付与日数", "16", "日"),
      countField("used", "取得済み日数", "5", "日"),
    ],
    compute: (i) => {
      const carried = i.int("carried");
      const granted = i.int("granted");
      const used = i.int("used");
      const total = Math.min(carried, 20) + granted;
      const remaining = Math.max(0, total - used);
      // 繰越分から先に消化する運用を前提
      const usedFromCarried = Math.min(used, carried);
      const expiring = Math.max(0, carried - usedFromCarried);
      return [
        { label: "残日数", value: fmtDays(remaining), primary: true },
        { label: "保有日数の合計", value: fmtDays(total) },
        { label: "繰越分", value: fmtDays(carried) },
        { label: "当年付与分", value: fmtDays(granted) },
        { label: "取得済み", value: `− ${fmtDays(used)}` },
        {
          label: "今年度末に時効消滅する日数",
          value: fmtDays(expiring),
          note: "繰越分から消化した場合の残り",
        },
        {
          label: "年5日の取得義務",
          value: used >= 5 ? "達成済み" : `あと${5 - used}日`,
          note: "付与日数10日以上の労働者が対象",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 57 */
  "catalog-57": {
    title: "入社年数計算",
    lead: "入社日から現在までの経過年数・月数・日数を計算します。",
    fields: [
      dateField("joined", "入社日", "2020-04-01"),
      dateField("base", "基準日", iso(today())),
    ],
    compute: (i) => {
      const joined = i.date("joined");
      const base = i.date("base");
      if (!joined || !base)
        return [{ label: "日付を選択してください", value: "—", primary: true }];
      const d = calendarDiff(joined, base);
      const total = diffDays(joined, base);
      return [
        {
          label: "入社からの期間",
          value: `${d.years}年${d.months}ヶ月${d.days}日`,
          primary: true,
        },
        { label: "通算月数", value: `${d.totalMonths}ヶ月` },
        { label: "通算日数", value: fmtDays(total) },
        { label: "通算週数", value: `${num(Math.floor(total / 7))}週` },
        {
          label: "年数（小数）",
          value: `${num(total / 365.25, 2)}年`,
        },
      ];
    },
  },

  /* 58 */
  "catalog-58": {
    title: "勤続年数計算",
    lead: "勤続年数と退職金の計算に使う勤続年数（端数切上げ）を確認します。",
    fields: [
      dateField("joined", "入社日", "2015-04-01"),
      dateField("leave", "退職日", iso(today())),
    ],
    compute: (i) => {
      const joined = i.date("joined");
      const leave = i.date("leave");
      if (!joined || !leave)
        return [{ label: "日付を選択してください", value: "—", primary: true }];
      const d = calendarDiff(joined, leave);
      const roundedYears = d.months > 0 || d.days > 0 ? d.years + 1 : d.years;
      const retirementDeduction =
        roundedYears <= 20
          ? Math.max(800_000, 400_000 * roundedYears)
          : 8_000_000 + 700_000 * (roundedYears - 20);
      return [
        {
          label: "勤続年数",
          value: `${d.years}年${d.months}ヶ月${d.days}日`,
          primary: true,
        },
        {
          label: "退職所得控除に使う勤続年数",
          value: `${roundedYears}年`,
          note: "1年未満の端数は切上げ",
        },
        { label: "退職所得控除額", value: yen(retirementDeduction) },
        { label: "通算月数", value: `${d.totalMonths}ヶ月` },
        { label: "通算日数", value: fmtDays(diffDays(joined, leave)) },
        {
          label: "有給の付与日数",
          value: fmtDays(paidLeaveDays(d.totalMonths)),
        },
      ];
    },
  },

  /* 59 */
  "catalog-59": {
    title: "労働時間集計",
    lead: "週ごとの労働時間を合計し、月間・年間の労働時間を集計します。",
    fields: [
      decimalField("week1", "第1週の労働時間", "40", "時間"),
      decimalField("week2", "第2週の労働時間", "42", "時間"),
      decimalField("week3", "第3週の労働時間", "45", "時間"),
      decimalField("week4", "第4週の労働時間", "40", "時間"),
      decimalField("extra", "端数日の労働時間", "0", "時間"),
    ],
    compute: (i) => {
      const weeks = [
        i.num("week1"),
        i.num("week2"),
        i.num("week3"),
        i.num("week4"),
      ];
      const total = weeks.reduce((a, b) => a + b, 0) + i.num("extra");
      const overWeeks = weeks.filter((w) => w > 40).length;
      const weeklyOvertime = weeks.reduce(
        (sum, w) => sum + Math.max(0, w - 40),
        0,
      );
      return [
        { label: "月の総労働時間", value: fmtHours(total, 1), primary: true },
        { label: "週平均", value: fmtHours(total / 4.345, 1) },
        {
          label: "週40時間を超えた週",
          value: `${overWeeks}週`,
        },
        {
          label: "週40時間超の合計",
          value: fmtHours(weeklyOvertime, 1),
          note: "法定時間外労働として割増対象",
        },
        { label: "年間換算", value: fmtHours(total * 12, 0) },
      ];
    },
  },

  /* 60 */
  "catalog-60": {
    title: "月間残業時間集計",
    lead: "月ごとの残業時間から36協定の上限規制への適合を判定します。",
    fields: [
      decimalField("current", "今月の時間外労働", "50", "時間"),
      decimalField("prev", "先月の時間外労働", "40", "時間"),
      decimalField("annual", "年度の累計（今月を含む）", "400", "時間"),
      countField("over45", "45時間を超えた月数（年度内）", "3", "ヶ月"),
    ],
    compute: (i) => {
      const current = i.num("current");
      const prev = i.num("prev");
      const average2m = (current + prev) / 2;
      const annual = i.num("annual");
      const over45 = i.int("over45");
      const judge = (ok: boolean, text: string) =>
        ok ? `○ ${text}` : `× ${text}`;
      return [
        {
          label: "36協定の上限規制",
          value:
            current < 100 && average2m <= 80 && annual <= 720 && over45 <= 6
              ? "すべての基準を満たしています"
              : "上限を超えている項目があります",
          primary: true,
        },
        {
          label: "単月100時間未満",
          value: judge(current < 100, `${num(current, 1)}時間`),
        },
        {
          label: "2〜6ヶ月平均80時間以内",
          value: judge(average2m <= 80, `${num(average2m, 1)}時間`),
        },
        {
          label: "年720時間以内",
          value: judge(annual <= 720, `${num(annual, 1)}時間`),
        },
        {
          label: "45時間超は年6回まで",
          value: judge(over45 <= 6, `${over45}回`),
        },
        {
          label: "月60時間を超える部分",
          value: fmtHours(Math.max(0, current - 60), 1),
          note: "50％以上の割増率が必要",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 61 */
  "catalog-61": {
    title: "年間休日数計算",
    lead: "週休日と祝日・長期休暇から年間休日数を計算します。",
    fields: [
      decimalField("weekly", "週の休日数", "2", "日"),
      countField("holidays", "休日となる祝日数", "16", "日"),
      countField("summer", "夏季休暇", "3", "日"),
      countField("yearEnd", "年末年始休暇", "6", "日"),
      countField("other", "その他の特別休暇", "0", "日"),
    ],
    compute: (i) => {
      const weekly = i.num("weekly") * 52;
      const total =
        weekly +
        i.int("holidays") +
        i.int("summer") +
        i.int("yearEnd") +
        i.int("other");
      const workDays = 365 - total;
      return [
        { label: "年間休日数", value: fmtDays(total), primary: true },
        { label: "年間勤務日数", value: fmtDays(workDays) },
        { label: "週休（週の休日×52週）", value: fmtDays(weekly) },
        { label: "祝日", value: fmtDays(i.int("holidays")) },
        {
          label: "夏季・年末年始・特別休暇",
          value: fmtDays(i.int("summer") + i.int("yearEnd") + i.int("other")),
        },
        {
          label: "評価",
          value:
            total >= 125
              ? "多め（完全週休2日＋祝日水準）"
              : total >= 120
                ? "標準的"
                : total >= 105
                  ? "やや少なめ"
                  : "法定下限に近い水準",
          note: "1日8時間勤務の場合、法定の最低ラインは年105日程度",
        },
      ];
    },
  },

  /* 62 */
  "catalog-62": {
    title: "週所定労働時間計算",
    lead: "1日の所定労働時間と週の勤務日数から週所定労働時間を計算します。",
    fields: [
      decimalField("daily", "1日の所定労働時間", "8", "時間"),
      decimalField("days", "週の所定労働日数", "5", "日"),
    ],
    compute: (i) => {
      const weekly = i.num("daily") * i.num("days");
      return [
        { label: "週所定労働時間", value: fmtHours(weekly, 1), primary: true },
        { label: "月平均所定労働時間", value: fmtHours((weekly * 52) / 12, 1) },
        { label: "年間所定労働時間", value: fmtHours(weekly * 52, 0) },
        {
          label: "法定労働時間（週40時間）",
          value:
            weekly <= 40
              ? "範囲内"
              : `${num(weekly - 40, 1)}時間超過（割増対象）`,
        },
        {
          label: "社会保険の適用",
          value:
            weekly >= 30
              ? "通常の被保険者として加入"
              : weekly >= 20
                ? "適用拡大の要件を確認"
                : "原則対象外",
        },
        {
          label: "雇用保険の適用",
          value: weekly >= 20 ? "加入対象" : "対象外",
        },
      ];
    },
    sources: [sourceMHLW],
  },

  /* 63 */
  "catalog-63": {
    title: "時給換算",
    lead: "月給から実質時給を計算し、残業を含めた場合の時給も確認します。",
    fields: [
      moneyField("monthly", "月給（額面）", "300000"),
      decimalField("scheduled", "月の所定労働時間", "160", "時間"),
      decimalField(
        "overtime",
        "月の残業時間（無給・みなし含む）",
        "20",
        "時間",
      ),
    ],
    compute: (i) => {
      const monthly = i.num("monthly");
      const scheduled = i.num("scheduled");
      const overtime = i.num("overtime");
      const base = scheduled ? monthly / scheduled : 0;
      const actual =
        scheduled + overtime ? monthly / (scheduled + overtime) : 0;
      return [
        { label: "実質時給（残業含む）", value: yen(actual), primary: true },
        { label: "所定労働時間ベースの時給", value: yen(base) },
        {
          label: "残業による時給の目減り",
          value: yen(base - actual),
          note: overtime > 0 ? `残業${num(overtime, 1)}時間分` : undefined,
        },
        { label: "総労働時間", value: fmtHours(scheduled + overtime, 1) },
        {
          label: "最低賃金との比較（1,055円）",
          value: actual >= 1055 ? "上回っています" : "下回っています",
          note: "令和7年度の全国加重平均額",
        },
      ];
    },
  },

  /* 64 */
  "catalog-64": {
    title: "年収時給換算",
    lead: "年収を年間労働時間で割り、1時間あたりの価値を計算します。",
    fields: [
      moneyField("annual", "額面年収", "5000000"),
      decimalField("weeklyHours", "週の労働時間", "45", "時間"),
      countField("workWeeks", "年間の勤務週数", "48", "週"),
      careField,
    ],
    compute: (i) => {
      const annualHours = i.num("weeklyHours") * i.int("workWeeks");
      const annual = i.num("annual");
      const b = salaryBreakdown(annual, { over40: isCare(i.raw("care")) });
      return [
        {
          label: "額面ベースの時給",
          value: yen(annualHours ? annual / annualHours : 0),
          primary: true,
        },
        {
          label: "手取りベースの時給",
          value: yen(annualHours ? b.netAnnual / annualHours : 0),
        },
        { label: "年間労働時間", value: fmtHours(annualHours, 0) },
        { label: "手取り年収", value: yen(b.netAnnual) },
        {
          label: "1日あたり（8時間）",
          value: yen(annualHours ? (annual / annualHours) * 8 : 0),
        },
      ];
    },
    note: taxNote,
  },

  /* 65 */
  "catalog-65": {
    title: "給与明細チェック",
    lead: "給与明細の控除額が制度上の目安と合っているかを検算します。",
    fields: [
      moneyField("gross", "総支給額", "300000"),
      moneyField("health", "健康保険料（明細の金額）", "15000"),
      moneyField("pension", "厚生年金保険料（明細の金額）", "27450"),
      moneyField("employment", "雇用保険料（明細の金額）", "1650"),
      careField,
    ],
    compute: (i) => {
      const gross = i.num("gross");
      const expected = socialInsuranceMonthly(gross, isCare(i.raw("care")));
      const compare = (label: string, actual: number, target: number) => {
        const diff = actual - target;
        return {
          label,
          value: `${yen(actual)}（目安 ${yen(target)}）`,
          note:
            Math.abs(diff) < Math.max(500, target * 0.05)
              ? "ほぼ一致しています"
              : `${diff > 0 ? "+" : ""}${yen(diff)} の差があります`,
        };
      };
      const actualTotal =
        i.num("health") + i.num("pension") + i.num("employment");
      return [
        {
          label: "社会保険料の合計",
          value: `${yen(actualTotal)}（目安 ${yen(expected.total)}）`,
          primary: true,
          note: `標準報酬月額 ${yen(expected.healthStandard)}（健保第${expected.healthGrade}等級）で計算`,
        },
        compare("健康保険料", i.num("health"), expected.health + expected.care),
        compare("厚生年金保険料", i.num("pension"), expected.pension),
        compare("雇用保険料", i.num("employment"), expected.employment),
        {
          label: "差引支給額の目安",
          value: yen(gross - actualTotal),
          note: "所得税・住民税を除いた金額",
        },
      ];
    },
    note: "健康保険料率は都道府県・健保組合で異なるため、数千円の差は正常な場合があります。",
    sources: [sourceKenpo],
  },
};
