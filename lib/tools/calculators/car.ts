import {
  COMPULSORY_INSURANCE,
  KEI_AUTO_TAX,
  KEI_AUTO_TAX_HEAVY,
  KEI_WEIGHT_TAX_2Y,
  WEIGHT_TAX_PER_HALF_TON,
  autoTaxAnnual,
} from "./data";
import { annuityPayment } from "./housing";
import {
  countField,
  decimalField,
  moneyField,
  num,
  pct,
  rateField,
  selectField,
  yen,
  type CalculatorSpec,
} from "./types";

const vehicleKindField = selectField("kind", "車種区分", "car", [
  { value: "car", label: "普通自動車（自家用）" },
  { value: "kei", label: "軽自動車（自家用）" },
]);

const ageField = selectField("age", "初度登録からの経過年数", "new", [
  { value: "new", label: "13年未満" },
  { value: "over13", label: "13年超18年以下" },
  { value: "over18", label: "18年超" },
]);

/** 車検2年分の重量税 */
function weightTax2y(
  kind: string,
  weightKg: number,
  age: string,
  eco: boolean,
): number {
  if (kind === "kei") {
    if (eco) return KEI_WEIGHT_TAX_2Y.eco;
    if (age === "over18") return KEI_WEIGHT_TAX_2Y.over18y;
    if (age === "over13") return KEI_WEIGHT_TAX_2Y.over13y;
    return KEI_WEIGHT_TAX_2Y.standard;
  }
  const halfTons = Math.max(1, Math.ceil(weightKg / 500));
  const perYear = eco
    ? WEIGHT_TAX_PER_HALF_TON.eco
    : age === "over18"
      ? WEIGHT_TAX_PER_HALF_TON.over18y
      : age === "over13"
        ? WEIGHT_TAX_PER_HALF_TON.over13y
        : WEIGHT_TAX_PER_HALF_TON.standard;
  return halfTons * perYear * 2;
}

export const carCalculators: Record<string, CalculatorSpec> = {
  /* 86 */
  "catalog-86": {
    title: "自動車税計算",
    lead: "排気量と初度登録年から自動車税種別割の年額を計算します。",
    fields: [
      vehicleKindField,
      countField("displacement", "総排気量", "1500", "cc"),
      selectField("registered", "初度登録時期", "after", [
        { value: "after", label: "2019年10月1日以降" },
        { value: "before", label: "2019年9月30日以前" },
      ]),
      ageField,
      countField("month", "購入月（月割計算用）", "4", "月"),
    ],
    compute: (i) => {
      const kei = i.raw("kind") === "kei";
      const age = i.raw("age");
      const base = kei
        ? age === "new"
          ? KEI_AUTO_TAX
          : KEI_AUTO_TAX_HEAVY
        : autoTaxAnnual(
            i.num("displacement"),
            i.raw("registered") === "before",
          );
      // ガソリン車13年超は概ね15％重課（軽は別体系）
      const heavy = !kei && age !== "new" ? base * 1.15 : base;
      const rounded = Math.floor(heavy / 100) * 100;
      const month = Math.min(12, Math.max(1, i.int("month")));
      const remainingMonths = month <= 4 ? 12 : 12 - (month - 4);
      return [
        { label: "自動車税種別割（年額）", value: yen(rounded), primary: true },
        { label: "月あたり", value: yen(rounded / 12) },
        {
          label: "重課（13年超）",
          value: rounded > base ? `+${yen(rounded - base)}` : "なし",
          note: kei ? "軽自動車は13年超で12,900円" : "おおむね15％の重課",
        },
        {
          label: "年度途中で購入した場合の月割額",
          value: kei
            ? "月割なし（4月1日時点の所有者に課税）"
            : yen((rounded / 12) * remainingMonths),
          note: kei ? undefined : `${remainingMonths}ヶ月分`,
        },
        {
          label: "納付時期",
          value: "毎年5月（4月1日時点の所有者に課税）",
        },
      ];
    },
    note: "電気自動車・グリーン化特例対象車は税額が軽減される場合があります。",
  },

  /* 87 */
  "catalog-87": {
    title: "自動車重量税計算",
    lead: "車両重量と経過年数から車検時に納める重量税を計算します。",
    fields: [
      vehicleKindField,
      countField("weight", "車両重量", "1300", "kg"),
      ageField,
      selectField("eco", "エコカー減税", "no", [
        { value: "no", label: "対象外" },
        { value: "yes", label: "対象（2030年度燃費基準達成など）" },
      ]),
      selectField("term", "車検の有効期間", "24", [
        { value: "24", label: "2年（継続車検）" },
        { value: "36", label: "3年（新車登録時）" },
      ]),
    ],
    compute: (i) => {
      const kind = i.raw("kind");
      const eco = i.raw("eco") === "yes";
      const two = weightTax2y(kind, i.num("weight"), i.raw("age"), eco);
      const term = i.raw("term") === "36" ? 3 : 2;
      const total = (two / 2) * term;
      const halfTons =
        kind === "kei" ? null : Math.max(1, Math.ceil(i.num("weight") / 500));
      return [
        {
          label: `自動車重量税（${term}年分）`,
          value: yen(total),
          primary: true,
        },
        { label: "1年あたり", value: yen(two / 2) },
        ...(halfTons
          ? [
              {
                label: "課税区分",
                value: `${halfTons * 0.5}t以下（0.5tごとに課税）`,
              },
            ]
          : [{ label: "課税区分", value: "軽自動車（定額）" }]),
        {
          label: "エコカー減税",
          value: eco ? "適用あり" : "適用なし",
        },
        {
          label: "経過年数による重課",
          value:
            i.raw("age") === "over18"
              ? "18年超（最も重い重課）"
              : i.raw("age") === "over13"
                ? "13年超"
                : "なし",
        },
      ];
    },
  },

  /* 88 */
  "catalog-88": {
    title: "車検費用シミュレーター",
    lead: "法定費用と整備費用を合わせた車検の総額を計算します。",
    fields: [
      vehicleKindField,
      countField("weight", "車両重量", "1300", "kg"),
      ageField,
      selectField("eco", "エコカー減税", "no", [
        { value: "no", label: "対象外" },
        { value: "yes", label: "対象" },
      ]),
      moneyField("inspectionFee", "車検基本料（点検・代行料）", "40000"),
      moneyField("maintenance", "整備・部品交換費用", "30000"),
    ],
    compute: (i) => {
      const kind = i.raw("kind");
      const weight = weightTax2y(
        kind,
        i.num("weight"),
        i.raw("age"),
        i.raw("eco") === "yes",
      );
      const compulsory = (
        kind === "kei" ? COMPULSORY_INSURANCE.kei : COMPULSORY_INSURANCE.car
      )[24];
      const stamp = kind === "kei" ? 1_800 : 2_300;
      const legal = weight + compulsory + stamp;
      const total = legal + i.num("inspectionFee") + i.num("maintenance");
      return [
        { label: "車検費用の合計", value: yen(total), primary: true },
        { label: "法定費用（値引き不可）", value: yen(legal) },
        { label: "　自動車重量税（2年分）", value: yen(weight) },
        { label: "　自賠責保険料（24ヶ月）", value: yen(compulsory) },
        { label: "　印紙・証紙代", value: yen(stamp) },
        { label: "車検基本料", value: yen(i.num("inspectionFee")) },
        { label: "整備・部品交換", value: yen(i.num("maintenance")) },
        {
          label: "月あたりの積立額",
          value: yen(total / 24),
          note: "2年ごとの車検に備える場合",
        },
      ];
    },
    note: "ユーザー車検なら車検基本料を抑えられます。法定費用は業者を変えても同額です。",
  },

  /* 89 */
  "catalog-89": {
    title: "自動車維持費計算",
    lead: "税金・保険・燃料・駐車場・車検を合計した年間維持費を計算します。",
    fields: [
      moneyField("autoTax", "自動車税（年額）", "34500"),
      moneyField("insurance", "任意保険料（年額）", "60000"),
      moneyField("parking", "駐車場代（月額）", "10000"),
      countField("distance", "年間走行距離", "8000", "km"),
      decimalField("efficiency", "燃費", "15", "km/L"),
      moneyField("fuelPrice", "ガソリン単価", "175", "円/L"),
      moneyField("inspection", "車検費用（2年ごと）", "100000"),
      moneyField("maintenance", "点検・消耗品費（年額）", "30000"),
    ],
    compute: (i) => {
      const fuel = i.num("efficiency")
        ? (i.num("distance") / i.num("efficiency")) * i.num("fuelPrice")
        : 0;
      const parking = i.num("parking") * 12;
      const inspection = i.num("inspection") / 2;
      const compulsory = COMPULSORY_INSURANCE.car[24] / 2;
      const total =
        i.num("autoTax") +
        i.num("insurance") +
        parking +
        fuel +
        inspection +
        compulsory +
        i.num("maintenance");
      return [
        { label: "年間の維持費", value: yen(total), primary: true },
        { label: "月あたり", value: yen(total / 12) },
        { label: "自動車税", value: yen(i.num("autoTax")) },
        { label: "任意保険料", value: yen(i.num("insurance")) },
        { label: "自賠責保険料（年割）", value: yen(compulsory) },
        { label: "駐車場代", value: yen(parking) },
        { label: "ガソリン代", value: yen(fuel) },
        { label: "車検費用（年割）", value: yen(inspection) },
        { label: "点検・消耗品費", value: yen(i.num("maintenance")) },
        {
          label: "1kmあたりのコスト",
          value: i.num("distance")
            ? `${num(total / i.num("distance"), 1)}円/km`
            : "—",
        },
      ];
    },
  },

  /* 90 */
  "catalog-90": {
    title: "ガソリン代計算",
    lead: "走行距離・燃費・ガソリン単価から燃料費を計算します。",
    fields: [
      countField("distance", "走行距離", "300", "km"),
      decimalField("efficiency", "燃費", "15", "km/L"),
      moneyField("price", "ガソリン単価", "175", "円/L"),
      countField("people", "同乗者を含む人数", "1", "人"),
    ],
    compute: (i) => {
      const liters = i.num("efficiency")
        ? i.num("distance") / i.num("efficiency")
        : 0;
      const cost = liters * i.num("price");
      const people = Math.max(1, i.int("people"));
      return [
        { label: "ガソリン代", value: yen(cost), primary: true },
        { label: "必要な燃料", value: `${num(liters, 2)}L` },
        { label: "往復の場合", value: yen(cost * 2) },
        {
          label: "1人あたり（割り勘）",
          value: yen(cost / people),
          note: `${people}人で割った場合`,
        },
        {
          label: "1kmあたりの燃料費",
          value: i.num("distance")
            ? `${num(cost / i.num("distance"), 2)}円/km`
            : "—",
        },
      ];
    },
  },

  /* 91 */
  "catalog-91": {
    title: "燃費計算",
    lead: "走行距離と給油量から実燃費を計算します。",
    fields: [
      countField("distance", "走行距離", "450", "km"),
      decimalField("liters", "給油量", "30", "L"),
      moneyField("price", "ガソリン単価", "175", "円/L"),
      decimalField("catalogValue", "カタログ燃費", "20", "km/L"),
    ],
    compute: (i) => {
      const liters = i.num("liters");
      const efficiency = liters ? i.num("distance") / liters : 0;
      const catalogValue = i.num("catalogValue");
      const ratio = catalogValue ? (efficiency / catalogValue) * 100 : 0;
      return [
        { label: "実燃費", value: `${num(efficiency, 2)} km/L`, primary: true },
        { label: "燃料費", value: yen(liters * i.num("price")) },
        {
          label: "1kmあたりの燃料費",
          value: efficiency
            ? `${num(i.num("price") / efficiency, 2)}円/km`
            : "—",
        },
        {
          label: "カタログ燃費の達成率",
          value: pct(ratio, 1),
          note:
            ratio >= 80
              ? "非常に良好です"
              : ratio >= 65
                ? "一般的な水準です"
                : "市街地走行が多い可能性があります",
        },
        {
          label: "満タン（50L）での航続距離",
          value: `${num(efficiency * 50)} km`,
        },
      ];
    },
  },

  /* 92 */
  "catalog-92": {
    title: "年間走行コスト計算",
    lead: "年間走行距離から燃料費・タイヤ・オイル交換などの走行コストを計算します。",
    fields: [
      countField("distance", "年間走行距離", "10000", "km"),
      decimalField("efficiency", "燃費", "15", "km/L"),
      moneyField("price", "ガソリン単価", "175", "円/L"),
      moneyField("tire", "タイヤ代（4本）", "60000"),
      countField("tireLife", "タイヤの寿命", "40000", "km"),
      moneyField("oil", "オイル交換1回の費用", "6000"),
      countField("oilInterval", "オイル交換の間隔", "5000", "km"),
      moneyField("toll", "年間の高速道路料金", "20000"),
    ],
    compute: (i) => {
      const distance = i.num("distance");
      const fuel = i.num("efficiency")
        ? (distance / i.num("efficiency")) * i.num("price")
        : 0;
      const tire = i.num("tireLife")
        ? (distance / i.num("tireLife")) * i.num("tire")
        : 0;
      const oil = i.num("oilInterval")
        ? (distance / i.num("oilInterval")) * i.num("oil")
        : 0;
      const toll = i.num("toll");
      const total = fuel + tire + oil + toll;
      return [
        { label: "年間の走行コスト", value: yen(total), primary: true },
        { label: "月あたり", value: yen(total / 12) },
        { label: "ガソリン代", value: yen(fuel) },
        { label: "タイヤ代（走行距離按分）", value: yen(tire) },
        { label: "オイル交換代", value: yen(oil) },
        { label: "高速道路料金", value: yen(toll) },
        {
          label: "1kmあたりの走行コスト",
          value: distance ? `${num(total / distance, 2)}円/km` : "—",
        },
      ];
    },
    note: "税金・保険・駐車場などの固定費は含みません（自動車維持費計算をご利用ください）。",
  },

  /* 93 */
  "catalog-93": {
    title: "EV充電費計算",
    lead: "電費と電気単価からEVの充電費用を計算します。",
    fields: [
      countField("distance", "走行距離", "300", "km"),
      decimalField("efficiency", "電費", "7", "km/kWh"),
      moneyField("price", "電気単価", "31", "円/kWh"),
      selectField("place", "充電場所", "home", [
        { value: "home", label: "自宅（普通充電）" },
        { value: "public", label: "外部の急速充電" },
      ]),
      rateField("loss", "充電ロス", "10"),
    ],
    compute: (i) => {
      const kwhForDrive = i.num("efficiency")
        ? i.num("distance") / i.num("efficiency")
        : 0;
      const kwh = kwhForDrive * (1 + i.num("loss") / 100);
      const cost = kwh * i.num("price");
      return [
        { label: "充電費用", value: yen(cost), primary: true },
        { label: "必要な電力量", value: `${num(kwh, 2)} kWh` },
        {
          label: "1kmあたりの電気代",
          value: i.num("distance")
            ? `${num(cost / i.num("distance"), 2)}円/km`
            : "—",
        },
        {
          label: "充電ロス分",
          value: yen((kwh - kwhForDrive) * i.num("price")),
        },
        {
          label: "参考：ガソリン車（15km/L・175円/L）",
          value: yen((i.num("distance") / 15) * 175),
        },
        {
          label: "充電場所",
          value:
            i.raw("place") === "home"
              ? "自宅の深夜電力プランならさらに安くなります"
              : "急速充電は定額プラン・従量課金で単価が変わります",
        },
      ];
    },
  },

  /* 94 */
  "catalog-94": {
    title: "ガソリン車・EVコスト比較",
    lead: "車両価格・燃料費・税金を含めた総保有コストを比較します。",
    fields: [
      countField("years", "保有年数", "8", "年"),
      countField("distance", "年間走行距離", "10000", "km"),
      moneyField("gasPrice", "ガソリン車の車両価格", "2500000"),
      decimalField("gasEfficiency", "ガソリン車の燃費", "18", "km/L"),
      moneyField("fuelPrice", "ガソリン単価", "175", "円/L"),
      moneyField("evPrice", "EVの車両価格", "4500000"),
      decimalField("evEfficiency", "EVの電費", "7", "km/kWh"),
      moneyField("electricPrice", "電気単価", "31", "円/kWh"),
      moneyField("subsidy", "EVの補助金", "650000"),
    ],
    compute: (i) => {
      const years = Math.max(1, i.int("years"));
      const distance = i.num("distance");
      const gasFuel = i.num("gasEfficiency")
        ? (distance / i.num("gasEfficiency")) * i.num("fuelPrice") * years
        : 0;
      const evFuel = i.num("evEfficiency")
        ? (distance / i.num("evEfficiency")) *
          i.num("electricPrice") *
          1.1 *
          years
        : 0;
      // ガソリン車：自動車税34,500円、EV：25,000円＋初回車検まで減税
      const gasTax = 34_500 * years;
      const evTax = 25_000 * Math.max(0, years - 1);
      const gasMaintenance = 40_000 * years;
      const evMaintenance = 25_000 * years;
      const gasTotal = i.num("gasPrice") + gasFuel + gasTax + gasMaintenance;
      const evTotal =
        i.num("evPrice") - i.num("subsidy") + evFuel + evTax + evMaintenance;
      const diff = gasTotal - evTotal;
      const annualSaving =
        (gasFuel + gasTax + gasMaintenance - evFuel - evTax - evMaintenance) /
        years;
      const priceGap = i.num("evPrice") - i.num("subsidy") - i.num("gasPrice");
      return [
        {
          label: diff >= 0 ? "EVのほうが安い" : "ガソリン車のほうが安い",
          value: yen(Math.abs(diff)),
          primary: true,
          note: `${years}年間の総保有コストの差`,
        },
        { label: "ガソリン車 総コスト", value: yen(gasTotal) },
        { label: "　車両価格", value: yen(i.num("gasPrice")) },
        { label: "　燃料費", value: yen(gasFuel) },
        { label: "　税金・整備", value: yen(gasTax + gasMaintenance) },
        { label: "EV 総コスト", value: yen(evTotal) },
        {
          label: "　車両価格（補助金差引後）",
          value: yen(i.num("evPrice") - i.num("subsidy")),
        },
        { label: "　電気代", value: yen(evFuel) },
        { label: "　税金・整備", value: yen(evTax + evMaintenance) },
        {
          label: "車両価格差を回収できる年数",
          value:
            annualSaving > 0 && priceGap > 0
              ? `${num(priceGap / annualSaving, 1)}年`
              : priceGap <= 0
                ? "初年度から有利"
                : "回収できません",
        },
      ];
    },
    note: "EVには充電設備の工事費（10〜30万円程度）やバッテリー劣化による下取り価格の差もあります。",
  },

  /* 95 */
  "catalog-95": {
    title: "駐車場年間費用計算",
    lead: "月極駐車場の年間費用と、時間貸しを併用した場合の費用を計算します。",
    fields: [
      moneyField("monthly", "月極駐車場の月額", "15000"),
      moneyField("initial", "契約時の初期費用", "30000"),
      countField("months", "契約期間", "12", "ヶ月"),
      moneyField("hourly", "時間貸しの料金（1時間）", "400"),
      countField("hoursPerMonth", "月の時間貸し利用時間", "0", "時間"),
    ],
    compute: (i) => {
      const months = Math.max(1, i.int("months"));
      const monthlyTotal = i.num("monthly") * months + i.num("initial");
      const hourlyTotal = i.num("hourly") * i.num("hoursPerMonth") * months;
      const total = monthlyTotal + hourlyTotal;
      const breakEvenHours = i.num("hourly")
        ? i.num("monthly") / i.num("hourly")
        : 0;
      return [
        { label: "駐車場費用の合計", value: yen(total), primary: true },
        { label: "月あたりの平均", value: yen(total / months) },
        { label: "月極駐車場", value: yen(monthlyTotal) },
        ...(hourlyTotal > 0
          ? [{ label: "時間貸しの利用分", value: yen(hourlyTotal) }]
          : []),
        {
          label: "月極が得になる利用時間",
          value: `月${num(breakEvenHours, 1)}時間以上`,
          note: "これ未満なら時間貸しのほうが安くなります",
        },
        { label: "10年間の費用", value: yen((total / months) * 120) },
      ];
    },
  },

  /* 96 */
  "catalog-96": {
    title: "任意保険料予算計算",
    lead: "等級・年齢条件から自動車任意保険料の目安を計算します。",
    fields: [
      moneyField("base", "基準保険料（年額）", "80000"),
      countField("grade", "ノンフリート等級", "10", "等級", "6〜20等級"),
      selectField("ageCondition", "運転者年齢条件", "30", [
        { value: "all", label: "年齢問わず補償" },
        { value: "21", label: "21歳以上補償" },
        { value: "26", label: "26歳以上補償" },
        { value: "30", label: "30歳以上補償" },
      ]),
      selectField("vehicleUse", "使用目的", "daily", [
        { value: "business", label: "業務使用" },
        { value: "commute", label: "通勤・通学使用" },
        { value: "daily", label: "日常・レジャー使用" },
      ]),
      moneyField("deductible", "車両保険の免責金額", "50000"),
    ],
    compute: (i) => {
      const grade = Math.min(20, Math.max(1, i.int("grade")));
      // 無事故係数（概算）
      const gradeRates: Record<number, number> = {
        1: 1.08,
        2: 0.63,
        3: 0.38,
        4: 0.07,
        5: -0.02,
        6: -0.13,
        7: -0.27,
        8: -0.38,
        9: -0.44,
        10: -0.46,
        11: -0.48,
        12: -0.5,
        13: -0.51,
        14: -0.52,
        15: -0.53,
        16: -0.54,
        17: -0.55,
        18: -0.56,
        19: -0.57,
        20: -0.63,
      };
      const gradeFactor = 1 + (gradeRates[grade] ?? -0.46);
      const ageFactor: Record<string, number> = {
        all: 1.6,
        "21": 1.25,
        "26": 1.0,
        "30": 0.93,
      };
      const useFactor: Record<string, number> = {
        business: 1.15,
        commute: 1.05,
        daily: 1,
      };
      const annual =
        i.num("base") *
        gradeFactor *
        (ageFactor[i.raw("ageCondition")] ?? 1) *
        (useFactor[i.raw("vehicleUse")] ?? 1);
      return [
        { label: "年間保険料の目安", value: yen(annual), primary: true },
        { label: "月あたり", value: yen(annual / 12) },
        {
          label: `${grade}等級の割引・割増率`,
          value: pct((gradeFactor - 1) * 100, 0),
        },
        {
          label: "年齢条件による係数",
          value: `×${num(ageFactor[i.raw("ageCondition")] ?? 1, 2)}`,
        },
        {
          label: "翌年（無事故で1等級アップ）",
          value: yen(
            i.num("base") *
              (1 + (gradeRates[Math.min(20, grade + 1)] ?? -0.46)) *
              (ageFactor[i.raw("ageCondition")] ?? 1) *
              (useFactor[i.raw("vehicleUse")] ?? 1),
          ),
        },
        {
          label: "事故で3等級ダウンした場合",
          value: yen(
            i.num("base") *
              (1 + (gradeRates[Math.max(1, grade - 3)] ?? 0)) *
              (ageFactor[i.raw("ageCondition")] ?? 1) *
              (useFactor[i.raw("vehicleUse")] ?? 1) *
              1.2,
          ),
          note: "事故有係数適用期間の割増を含む概算",
        },
      ];
    },
    note: "保険料は保険会社・車種・補償内容・地域で大きく変わります。必ず見積りでご確認ください。",
  },

  /* 97 */
  "catalog-97": {
    title: "自賠責保険料確認",
    lead: "車種と契約期間から自賠責保険料（強制保険）を確認します。",
    fields: [
      selectField("kind", "車種", "car", [
        { value: "car", label: "自家用乗用車（普通・小型）" },
        { value: "kei", label: "軽自動車（検査対象）" },
        { value: "bike", label: "二輪車（125cc超）" },
        { value: "moped", label: "原動機付自転車（125cc以下）" },
      ]),
      selectField("months", "契約期間", "24", [
        { value: "12", label: "12ヶ月" },
        { value: "24", label: "24ヶ月" },
        { value: "36", label: "36ヶ月" },
      ]),
    ],
    compute: (i) => {
      const table =
        COMPULSORY_INSURANCE[i.raw("kind")] ?? COMPULSORY_INSURANCE.car;
      const months = Number(i.raw("months"));
      const premium = table[months] ?? table[24];
      const rows = Object.entries(table).map(([m, value]) => ({
        label: `${m}ヶ月`,
        value: yen(value),
        note: `月あたり ${yen(value / Number(m))}`,
      }));
      return [
        {
          label: `自賠責保険料（${months}ヶ月）`,
          value: yen(premium),
          primary: true,
        },
        { label: "月あたり", value: yen(premium / months) },
        ...rows,
        {
          label: "補償限度額",
          value: "死亡3,000万円／後遺障害最大4,000万円／傷害120万円",
        },
        {
          label: "注意",
          value: "対物賠償・自分のケガは対象外（任意保険が必要）",
        },
      ];
    },
    note: "本土（離島・沖縄以外）の保険料です。保険料は全社共通で、保険会社による差はありません。",
  },

  /* 98 */
  "catalog-98": {
    title: "高速料金比較",
    lead: "高速道路を使う場合と下道を使う場合の費用・時間を比較します。",
    fields: [
      moneyField("toll", "高速道路料金（片道）", "4000"),
      countField("highwayDistance", "高速利用時の走行距離", "300", "km"),
      decimalField("highwayHours", "高速利用時の所要時間", "3.5", "時間"),
      countField("localDistance", "下道の走行距離", "280", "km"),
      decimalField("localHours", "下道の所要時間", "7", "時間"),
      decimalField("efficiencyHighway", "高速での燃費", "18", "km/L"),
      decimalField("efficiencyLocal", "下道での燃費", "13", "km/L"),
      moneyField("fuelPrice", "ガソリン単価", "175", "円/L"),
    ],
    compute: (i) => {
      const fuelPrice = i.num("fuelPrice");
      const highwayFuel = i.num("efficiencyHighway")
        ? (i.num("highwayDistance") / i.num("efficiencyHighway")) * fuelPrice
        : 0;
      const localFuel = i.num("efficiencyLocal")
        ? (i.num("localDistance") / i.num("efficiencyLocal")) * fuelPrice
        : 0;
      const highwayTotal = i.num("toll") + highwayFuel;
      const localTotal = localFuel;
      const costDiff = highwayTotal - localTotal;
      const timeDiff = i.num("localHours") - i.num("highwayHours");
      return [
        {
          label: "高速利用の追加費用",
          value: yen(costDiff),
          primary: true,
          note:
            timeDiff > 0
              ? `${num(timeDiff, 1)}時間の短縮／1時間あたり ${yen(costDiff / timeDiff)}`
              : undefined,
        },
        { label: "高速利用の合計", value: yen(highwayTotal) },
        { label: "　通行料金", value: yen(i.num("toll")) },
        { label: "　ガソリン代", value: yen(highwayFuel) },
        { label: "下道の合計", value: yen(localTotal) },
        { label: "　ガソリン代", value: yen(localFuel) },
        {
          label: "短縮できる時間",
          value: `${num(timeDiff, 1)}時間`,
        },
        { label: "往復の差額", value: yen(costDiff * 2) },
      ];
    },
  },

  /* 99 */
  "catalog-99": {
    title: "ETC料金計算",
    lead: "ETC割引を適用した実質的な通行料金を計算します。",
    fields: [
      moneyField("normal", "通常料金（ETC無割引）", "4000"),
      selectField("discount", "適用される割引", "none", [
        { value: "none", label: "割引なし" },
        { value: "holiday", label: "休日割引（30％）" },
        { value: "night", label: "深夜割引（30％・0〜4時）" },
        { value: "commuter", label: "平日朝夕割引（最大50％還元）" },
      ]),
      countField("trips", "利用回数（月）", "8", "回"),
      moneyField("cardFee", "ETCカードの年会費", "0"),
    ],
    compute: (i) => {
      const normal = i.num("normal");
      const rates: Record<string, number> = {
        none: 0,
        holiday: 0.3,
        night: 0.3,
        commuter: 0.5,
      };
      const rate = rates[i.raw("discount")] ?? 0;
      const discounted = normal * (1 - rate);
      const trips = Math.max(0, i.int("trips"));
      const monthly = discounted * trips;
      return [
        { label: "1回あたりの料金", value: yen(discounted), primary: true },
        { label: "通常料金", value: yen(normal) },
        {
          label: "割引額",
          value: yen(normal - discounted),
          note: rate > 0 ? `割引率 ${pct(rate * 100, 0)}` : "割引なし",
        },
        { label: `月の合計（${trips}回）`, value: yen(monthly) },
        { label: "年間の合計", value: yen(monthly * 12 + i.num("cardFee")) },
        {
          label: "年間の割引額",
          value: yen((normal - discounted) * trips * 12),
        },
      ];
    },
    note: "平日朝夕割引は月の利用回数（5回以上）に応じた還元方式です。深夜割引は2025年に制度変更が予定されています。",
  },

  /* 100 */
  "catalog-100": {
    title: "定期券・切符比較",
    lead: "定期券と都度払いのどちらが安いかを比較し、損益分岐の利用回数を求めます。",
    fields: [
      moneyField("oneWay", "片道運賃", "320"),
      moneyField("pass1", "1ヶ月定期券", "9800"),
      moneyField("pass3", "3ヶ月定期券", "27930"),
      moneyField("pass6", "6ヶ月定期券", "52920"),
      countField("daysPerMonth", "月の通勤・通学日数", "20", "日"),
      countField("extraTrips", "月の私用利用（片道回数）", "0", "回"),
    ],
    compute: (i) => {
      const oneWay = i.num("oneWay");
      const trips = i.int("daysPerMonth") * 2 + i.int("extraTrips");
      const ticketMonthly = oneWay * trips;
      const pass1 = i.num("pass1");
      const pass3 = i.num("pass3") / 3;
      const pass6 = i.num("pass6") / 6;
      const options = [
        { name: "切符（都度払い）", monthly: ticketMonthly },
        { name: "1ヶ月定期券", monthly: pass1 },
        { name: "3ヶ月定期券", monthly: pass3 },
        { name: "6ヶ月定期券", monthly: pass6 },
      ].sort((a, b) => a.monthly - b.monthly);
      const best = options[0];
      const breakEven = oneWay ? Math.ceil(pass1 / oneWay) : 0;
      return [
        {
          label: "最も安いのは",
          value: best.name,
          primary: true,
          note: `月あたり ${yen(best.monthly)}`,
        },
        {
          label: "切符（都度払い）",
          value: `${yen(ticketMonthly)} / 月`,
          note: `片道${trips}回`,
        },
        { label: "1ヶ月定期券", value: `${yen(pass1)} / 月` },
        {
          label: "3ヶ月定期券",
          value: `${yen(pass3)} / 月`,
          note: `一括 ${yen(i.num("pass3"))}`,
        },
        {
          label: "6ヶ月定期券",
          value: `${yen(pass6)} / 月`,
          note: `一括 ${yen(i.num("pass6"))}`,
        },
        {
          label: "1ヶ月定期の損益分岐",
          value: `片道${breakEven}回（往復${Math.ceil(breakEven / 2)}日）以上`,
        },
        {
          label: "6ヶ月定期を選んだ場合の年間節約額",
          value: yen(Math.max(0, (ticketMonthly - pass6) * 12)),
          note: "都度払いと比較",
        },
      ];
    },
  },

  /* 101 */
  "catalog-101": {
    title: "通勤交通費計算",
    lead: "通勤手段ごとの費用と、非課税限度額の範囲内かを確認します。",
    fields: [
      moneyField("pass", "定期券代（1ヶ月）", "12000"),
      countField("carDistance", "マイカー通勤の片道距離", "0", "km"),
      decimalField("efficiency", "燃費", "15", "km/L"),
      moneyField("fuelPrice", "ガソリン単価", "175", "円/L"),
      countField("workDays", "月の出勤日数", "20", "日"),
      moneyField("parking", "駐車場代（月）", "0"),
    ],
    compute: (i) => {
      const pass = i.num("pass");
      const distance = i.num("carDistance");
      const fuel = i.num("efficiency")
        ? ((distance * 2 * i.int("workDays")) / i.num("efficiency")) *
          i.num("fuelPrice")
        : 0;
      const total = pass + fuel + i.num("parking");
      // マイカー通勤の1ヶ月あたり非課税限度額
      const limits: [number, number][] = [
        [2, 0],
        [10, 4_200],
        [15, 7_100],
        [25, 12_900],
        [35, 18_700],
        [45, 24_400],
        [55, 28_000],
        [Infinity, 31_600],
      ];
      const carLimit = limits.find(([km]) => distance < km)![1];
      const passLimit = Math.min(pass, 150_000);
      return [
        { label: "通勤にかかる費用（月）", value: yen(total), primary: true },
        { label: "年間の通勤費", value: yen(total * 12) },
        { label: "定期券代", value: yen(pass) },
        ...(fuel > 0
          ? [
              { label: "ガソリン代", value: yen(fuel) },
              { label: "駐車場代", value: yen(i.num("parking")) },
            ]
          : []),
        {
          label: "非課税限度額（公共交通機関）",
          value: yen(passLimit),
          note: "1ヶ月15万円まで非課税",
        },
        ...(distance > 0
          ? [
              {
                label: `非課税限度額（片道${num(distance, 1)}km）`,
                value: yen(carLimit),
                note:
                  fuel + i.num("parking") > carLimit
                    ? `${yen(fuel + i.num("parking") - carLimit)} は課税対象`
                    : "全額非課税の範囲内",
              },
            ]
          : []),
      ];
    },
    note: "通勤手当の非課税限度額を超える部分は給与として課税されます。",
  },

  /* 102 */
  "catalog-102": {
    title: "片道・往復交通費計算",
    lead: "片道運賃から往復・回数券・複数人分の交通費を計算します。",
    fields: [
      moneyField("oneWay", "片道運賃", "780"),
      countField("people", "人数", "1", "人"),
      countField("trips", "往復回数", "1", "回"),
      moneyField("transfer", "乗り換え・その他の運賃（片道）", "0"),
    ],
    compute: (i) => {
      const oneWay = i.num("oneWay") + i.num("transfer");
      const people = Math.max(1, i.int("people"));
      const trips = Math.max(1, i.int("trips"));
      const roundTrip = oneWay * 2;
      const total = roundTrip * trips * people;
      return [
        { label: "交通費の合計", value: yen(total), primary: true },
        { label: "片道（1人）", value: yen(oneWay) },
        { label: "往復（1人）", value: yen(roundTrip) },
        { label: `往復×${trips}回（1人）`, value: yen(roundTrip * trips) },
        { label: `人数 ${people}人分`, value: yen(total) },
        {
          label: "1人あたりの負担",
          value: yen(total / people),
        },
      ];
    },
  },

  /* 103 */
  "catalog-103": {
    title: "交通費月額計算",
    lead: "通勤・私用を合わせた1ヶ月の交通費を集計します。",
    fields: [
      moneyField("commute", "通勤定期代（月）", "12000"),
      moneyField("oneWay", "定期区間外の片道運賃", "300"),
      countField("extraTrips", "定期区間外の利用回数（片道・月）", "10", "回"),
      moneyField("taxi", "タクシー代（月）", "0"),
      moneyField("other", "その他の交通費（月）", "0"),
      moneyField("allowance", "会社からの交通費支給額（月）", "12000"),
    ],
    compute: (i) => {
      const extra = i.num("oneWay") * i.int("extraTrips");
      const total = i.num("commute") + extra + i.num("taxi") + i.num("other");
      const selfPay = total - i.num("allowance");
      return [
        { label: "1ヶ月の交通費", value: yen(total), primary: true },
        { label: "年間の交通費", value: yen(total * 12) },
        { label: "通勤定期代", value: yen(i.num("commute")) },
        { label: "定期区間外の運賃", value: yen(extra) },
        {
          label: "タクシー・その他",
          value: yen(i.num("taxi") + i.num("other")),
        },
        { label: "会社からの支給額", value: `− ${yen(i.num("allowance"))}` },
        {
          label: selfPay >= 0 ? "自己負担額（月）" : "支給額の余剰（月）",
          value: yen(Math.abs(selfPay)),
        },
      ];
    },
  },

  /* 104 */
  "catalog-104": {
    title: "車購入総費用計算",
    lead: "車両本体価格に諸経費・税金・オプションを加えた総支払額を計算します。",
    fields: [
      moneyField("body", "車両本体価格", "2500000"),
      moneyField("options", "オプション・付属品", "300000"),
      vehicleKindField,
      countField("displacement", "総排気量", "1500", "cc"),
      countField("weight", "車両重量", "1300", "kg"),
      moneyField("dealerFee", "販売諸費用（登録代行・納車費用など）", "100000"),
      moneyField("tradeIn", "下取り価格", "0"),
      countField("month", "登録月", "4", "月"),
    ],
    compute: (i) => {
      const kei = i.raw("kind") === "kei";
      const body = i.num("body") + i.num("options");
      const autoTax = kei
        ? KEI_AUTO_TAX
        : autoTaxAnnual(i.num("displacement"), false);
      const month = Math.min(12, Math.max(1, i.int("month")));
      const monthlyTax = kei ? 0 : Math.floor((autoTax / 12) * (13 - month));
      const weight = weightTax2y(i.raw("kind"), i.num("weight"), "new", false);
      const weight3y = (weight / 2) * 3;
      const compulsory = (
        kei ? COMPULSORY_INSURANCE.kei : COMPULSORY_INSURANCE.car
      )[36];
      // 環境性能割（燃費基準により0〜3％）
      const envTax = Math.floor(body * 0.9 * 0.01);
      const recycle = 12_000;
      const total =
        body +
        monthlyTax +
        weight3y +
        compulsory +
        envTax +
        recycle +
        i.num("dealerFee") -
        i.num("tradeIn");
      return [
        { label: "総支払額", value: yen(total), primary: true },
        { label: "車両本体＋オプション", value: yen(body) },
        {
          label: "自動車税（月割）",
          value: yen(monthlyTax),
          note: kei ? "軽自動車税は月割なし" : `${13 - month}ヶ月分`,
        },
        { label: "自動車重量税（3年分）", value: yen(weight3y) },
        { label: "自賠責保険料（36ヶ月）", value: yen(compulsory) },
        { label: "環境性能割", value: yen(envTax) },
        { label: "リサイクル料金", value: yen(recycle) },
        { label: "販売諸費用", value: yen(i.num("dealerFee")) },
        ...(i.num("tradeIn") > 0
          ? [{ label: "下取り価格", value: `− ${yen(i.num("tradeIn"))}` }]
          : []),
        {
          label: "本体価格に対する諸費用の割合",
          value: pct(
            body ? ((total - body + i.num("tradeIn")) / body) * 100 : 0,
            1,
          ),
        },
      ];
    },
    note: "環境性能割は燃費基準の達成度により0〜3％で変動します。任意保険料は含みません。",
  },

  /* 105 */
  "catalog-105": {
    title: "車ローン返済計算",
    lead: "マイカーローンと残価設定ローンの返済額を比較します。",
    fields: [
      moneyField("price", "車両価格（諸費用込み）", "3000000"),
      moneyField("downPayment", "頭金", "300000"),
      rateField("rate", "金利（年）", "3.5"),
      countField("years", "返済期間", "5", "年"),
      moneyField(
        "residual",
        "残価設定額（据置額）",
        "0",
        "残価設定型の場合に入力",
      ),
    ],
    compute: (i) => {
      const principal = Math.max(0, i.num("price") - i.num("downPayment"));
      const months = i.int("years") * 12;
      const rate = i.num("rate");
      const normalPayment = annuityPayment(principal, rate, months);
      const normalTotal = normalPayment * months;
      const residual = Math.min(i.num("residual"), principal);
      const r = rate / 100 / 12;
      const residualPayment =
        residual > 0
          ? annuityPayment(principal - residual, rate, months) + residual * r
          : 0;
      return [
        { label: "毎月の返済額", value: yen(normalPayment), primary: true },
        { label: "借入額", value: yen(principal) },
        { label: "総返済額", value: yen(normalTotal) },
        { label: "利息の総額", value: yen(normalTotal - principal) },
        ...(residual > 0
          ? [
              {
                label: "残価設定型の毎月返済額",
                value: yen(residualPayment),
                note: `毎月 ${yen(normalPayment - residualPayment)} 軽減`,
              },
              {
                label: "満了時に必要な支払い",
                value: yen(residual),
                note: "返却・再ローン・一括支払いから選択",
              },
              {
                label: "残価設定型の支払総額",
                value: yen(residualPayment * months + residual),
              },
            ]
          : []),
        {
          label: "頭金を倍にした場合の毎月返済額",
          value: yen(
            annuityPayment(
              Math.max(0, i.num("price") - i.num("downPayment") * 2),
              rate,
              months,
            ),
          ),
        },
      ];
    },
    note: "残価設定ローンは走行距離制限や車両の状態に関する条件があります。",
  },
};
