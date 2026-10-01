import { CONSUMPTION_TAX } from "./data";
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

const taxRateField = selectField("taxRate", "消費税率", "10", [
  { value: "10", label: "10％（標準税率）" },
  { value: "8", label: "8％（軽減税率・飲食料品など）" },
]);

export const moneyCalculators: Record<string, CalculatorSpec> = {
  /* 146 */
  "catalog-146": {
    title: "割引率計算",
    lead: "定価と割引後の価格から割引率と割引額を計算します。",
    fields: [
      moneyField("original", "定価（割引前の価格）", "10000"),
      moneyField("sale", "割引後の価格", "7800"),
    ],
    compute: (i) => {
      const original = i.num("original");
      const sale = i.num("sale");
      const discount = original - sale;
      const rate = original ? (discount / original) * 100 : 0;
      return [
        { label: "割引率", value: pct(rate, 1), primary: true },
        { label: "割引額", value: yen(discount) },
        { label: "定価に対する支払率", value: pct(100 - rate, 1) },
        {
          label: "「〇割引」表記",
          value: `${num(rate / 10, 1)}割引`,
        },
        {
          label: "さらに10％オフの場合",
          value: yen(sale * 0.9),
          note: `定価からの割引率 ${pct(original ? (1 - (sale * 0.9) / original) * 100 : 0, 1)}`,
        },
      ];
    },
  },

  /* 147 */
  "catalog-147": {
    title: "税込・税抜計算",
    lead: "税抜価格と税込価格を相互に変換します。",
    fields: [
      selectField("direction", "変換の方向", "toIncluded", [
        { value: "toIncluded", label: "税抜 → 税込" },
        { value: "toExcluded", label: "税込 → 税抜" },
      ]),
      moneyField("amount", "金額", "10000"),
      taxRateField,
      selectField("rounding", "端数処理", "floor", [
        { value: "floor", label: "切り捨て" },
        { value: "round", label: "四捨五入" },
        { value: "ceil", label: "切り上げ" },
      ]),
    ],
    compute: (i) => {
      const rate = Number(i.raw("taxRate")) / 100;
      const amount = i.num("amount");
      const apply = (value: number) => {
        const mode = i.raw("rounding");
        return mode === "round"
          ? Math.round(value)
          : mode === "ceil"
            ? Math.ceil(value)
            : Math.floor(value);
      };
      const toIncluded = i.raw("direction") === "toIncluded";
      const excluded = toIncluded ? amount : apply(amount / (1 + rate));
      const included = toIncluded ? apply(amount * (1 + rate)) : amount;
      const tax = included - excluded;
      return [
        {
          label: toIncluded ? "税込価格" : "税抜価格",
          value: yen(toIncluded ? included : excluded),
          primary: true,
        },
        { label: "税抜価格", value: yen(excluded) },
        { label: "消費税額", value: yen(tax) },
        { label: "税込価格", value: yen(included) },
        { label: "適用税率", value: `${i.raw("taxRate")}％` },
        {
          label: "もう一方の税率で計算した場合",
          value: yen(
            toIncluded
              ? apply(amount * (1 + (rate === 0.1 ? 0.08 : 0.1)))
              : apply(amount / (1 + (rate === 0.1 ? 0.08 : 0.1))),
          ),
          note: `${rate === 0.1 ? "8" : "10"}％で計算`,
        },
      ];
    },
  },

  /* 148 */
  "catalog-148": {
    title: "消費税計算",
    lead: "金額に含まれる消費税額と、国税・地方税の内訳を計算します。",
    fields: [
      moneyField("amount", "税抜金額", "10000"),
      taxRateField,
      countField("quantity", "数量", "1", "個"),
    ],
    compute: (i) => {
      const rate = Number(i.raw("taxRate"));
      const subtotal = i.num("amount") * Math.max(1, i.int("quantity"));
      const tax = Math.floor((subtotal * rate) / 100);
      const standard = rate === CONSUMPTION_TAX.standard;
      // 10％＝国税7.8％＋地方2.2％／8％＝国税6.24％＋地方1.76％
      const nationalRate = standard ? 7.8 : 6.24;
      const localRate = standard ? 2.2 : 1.76;
      return [
        { label: "消費税額", value: yen(tax), primary: true },
        { label: "税抜金額（小計）", value: yen(subtotal) },
        { label: "税込金額", value: yen(subtotal + tax) },
        {
          label: "国税分",
          value: yen((subtotal * nationalRate) / 100),
          note: `${nationalRate}％`,
        },
        {
          label: "地方消費税分",
          value: yen((subtotal * localRate) / 100),
          note: `${localRate}％`,
        },
        {
          label: "1個あたりの消費税",
          value: yen(tax / Math.max(1, i.int("quantity"))),
        },
      ];
    },
    note: "軽減税率8％は飲食料品（外食・酒類を除く）と週2回以上発行の新聞が対象です。",
  },

  /* 149 */
  "catalog-149": {
    title: "割り勘計算",
    lead: "合計金額を人数で割り、端数や傾斜配分にも対応します。",
    fields: [
      moneyField("total", "合計金額", "24000"),
      countField("people", "人数", "5", "人"),
      selectField("rounding", "端数の単位", "100", [
        { value: "1", label: "1円単位" },
        { value: "10", label: "10円単位" },
        { value: "100", label: "100円単位" },
        { value: "500", label: "500円単位" },
      ]),
      countField("payMore", "多めに払う人数", "0", "人"),
      moneyField("extra", "多めに払う人の追加額", "1000"),
    ],
    compute: (i) => {
      const total = i.num("total");
      const people = Math.max(1, i.int("people"));
      const unit = Number(i.raw("rounding"));
      const payMore = Math.min(i.int("payMore"), people - 1);
      const extraTotal = payMore * i.num("extra");
      const basePerPerson = (total - extraTotal) / people;
      const rounded = Math.ceil(basePerPerson / unit) * unit;
      const collected =
        rounded * (people - payMore) + (rounded + i.num("extra")) * payMore;
      return [
        { label: "1人あたりの金額", value: yen(rounded), primary: true },
        { label: "合計金額", value: yen(total) },
        { label: "人数", value: `${people}人` },
        ...(payMore > 0
          ? [
              {
                label: `多めに払う人（${payMore}人）`,
                value: yen(rounded + i.num("extra")),
              },
              {
                label: `通常の人（${people - payMore}人）`,
                value: yen(rounded),
              },
            ]
          : []),
        {
          label: "集まる合計",
          value: yen(collected),
          note:
            collected > total
              ? `${yen(collected - total)} の余り（幹事の取り分・チップに）`
              : `${yen(total - collected)} 不足`,
        },
        { label: "端数を丸めない場合", value: yen(total / people) },
      ];
    },
  },

  /* 150 */
  "catalog-150": {
    title: "単価計算",
    lead: "内容量や個数から単価を求め、他の商品と比べやすくします。",
    fields: [
      moneyField("price", "価格", "498"),
      decimalField("quantity", "内容量・個数", "500", "g / 個 / mL"),
      selectField("unit", "表示する単位", "100", [
        { value: "1", label: "1単位あたり" },
        { value: "100", label: "100単位あたり（100gなど）" },
        { value: "1000", label: "1,000単位あたり（1kg・1Lなど）" },
      ]),
      selectField("taxIncluded", "価格の税表示", "included", [
        { value: "included", label: "税込価格" },
        { value: "excluded", label: "税抜価格" },
      ]),
    ],
    compute: (i) => {
      const price = i.num("price");
      const quantity = i.num("quantity");
      const unit = Number(i.raw("unit"));
      const unitPrice = quantity ? price / quantity : 0;
      const taxIncluded =
        i.raw("taxIncluded") === "included" ? price : price * 1.08;
      return [
        {
          label: `${unit === 1 ? "1単位" : `${num(unit)}単位`}あたりの価格`,
          value: `${num(unitPrice * unit, 2)}円`,
          primary: true,
        },
        { label: "1単位あたり", value: `${num(unitPrice, 3)}円` },
        { label: "100単位あたり", value: `${num(unitPrice * 100, 2)}円` },
        { label: "1,000単位あたり", value: `${num(unitPrice * 1000, 1)}円` },
        ...(i.raw("taxIncluded") === "excluded"
          ? [
              {
                label: "税込での単価（8％）",
                value: `${num(quantity ? (taxIncluded / quantity) * unit : 0, 2)}円`,
              },
            ]
          : []),
        { label: "内容量", value: `${num(quantity, 2)}` },
      ];
    },
  },

  /* 151 */
  "catalog-151": {
    title: "価格比較計算",
    lead: "内容量の違う3つの商品の単価を比較し、最も割安なものを判定します。",
    fields: [
      moneyField("priceA", "商品A：価格", "498"),
      decimalField("quantityA", "商品A：内容量", "500", "g / 個"),
      moneyField("priceB", "商品B：価格", "880"),
      decimalField("quantityB", "商品B：内容量", "1000", "g / 個"),
      moneyField("priceC", "商品C：価格", "0"),
      decimalField("quantityC", "商品C：内容量", "0", "g / 個"),
    ],
    compute: (i) => {
      const items = [
        { name: "商品A", price: i.num("priceA"), quantity: i.num("quantityA") },
        { name: "商品B", price: i.num("priceB"), quantity: i.num("quantityB") },
        { name: "商品C", price: i.num("priceC"), quantity: i.num("quantityC") },
      ]
        .filter((item) => item.price > 0 && item.quantity > 0)
        .map((item) => ({ ...item, unit: item.price / item.quantity }));
      if (items.length === 0)
        return [
          {
            label: "価格と内容量を入力してください",
            value: "—",
            primary: true,
          },
        ];
      const sorted = [...items].sort((a, b) => a.unit - b.unit);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return [
        {
          label: "最も割安なのは",
          value: best.name,
          primary: true,
          note: `100単位あたり ${num(best.unit * 100, 2)}円`,
        },
        ...items.map((item) => ({
          label: `${item.name}（${num(item.quantity, 1)}）`,
          value: `${num(item.unit * 100, 2)}円 / 100単位`,
          note: `${yen(item.price)}・1単位あたり ${num(item.unit, 3)}円`,
        })),
        {
          label: "最安と最高の差",
          value: `${num((worst.unit - best.unit) * 100, 2)}円 / 100単位`,
          note:
            worst.unit > 0
              ? `${pct(((worst.unit - best.unit) / worst.unit) * 100, 1)} 安い`
              : undefined,
        },
        {
          label: "同じ量を買った場合の差額",
          value: yen((worst.unit - best.unit) * worst.quantity),
          note: `${num(worst.quantity, 1)}単位で比較`,
        },
      ];
    },
  },

  /* 152 */
  "catalog-152": {
    title: "ポイント還元率計算",
    lead: "獲得ポイントから還元率を計算し、複数カードを比較します。",
    fields: [
      moneyField("amount", "利用金額", "10000"),
      countField("points", "獲得ポイント", "100", "pt"),
      decimalField("pointValue", "1ポイントの価値", "1", "円"),
      rateField("compareRate", "比較するカードの還元率", "1.0"),
    ],
    compute: (i) => {
      const amount = i.num("amount");
      const value = i.num("points") * i.num("pointValue");
      const rate = amount ? (value / amount) * 100 : 0;
      const compare = (amount * i.num("compareRate")) / 100;
      return [
        { label: "還元率", value: pct(rate, 2), primary: true },
        { label: "ポイントの金額価値", value: yen(value) },
        { label: "実質的な支払額", value: yen(amount - value) },
        {
          label: "比較するカードの還元額",
          value: yen(compare),
          note: `還元率 ${pct(i.num("compareRate"), 2)}`,
        },
        {
          label: "差額",
          value: yen(value - compare),
          note:
            value >= compare
              ? "こちらのほうがお得です"
              : "比較先のほうがお得です",
        },
        {
          label: "月10万円利用した場合の年間還元額",
          value: yen(((100_000 * rate) / 100) * 12),
        },
      ];
    },
  },

  /* 153 */
  "catalog-153": {
    title: "実質還元率計算",
    lead: "年会費やポイントの失効を考慮した、実質的な還元率を計算します。",
    fields: [
      moneyField("annualSpend", "年間の利用金額", "1200000"),
      rateField("baseRate", "表示上の還元率", "1.0"),
      moneyField("annualFee", "年会費", "11000"),
      rateField(
        "usedRate",
        "実際に使えるポイントの割合",
        "80",
        "失効・交換レートを考慮",
      ),
      moneyField("otherBenefit", "その他の特典の金額価値（年間）", "5000"),
    ],
    compute: (i) => {
      const spend = i.num("annualSpend");
      const gross = (spend * i.num("baseRate")) / 100;
      const usable = (gross * i.num("usedRate")) / 100;
      const net = usable + i.num("otherBenefit") - i.num("annualFee");
      const realRate = spend ? (net / spend) * 100 : 0;
      const breakEven =
        i.num("baseRate") > 0
          ? (i.num("annualFee") - i.num("otherBenefit")) /
            ((i.num("baseRate") / 100) * (i.num("usedRate") / 100))
          : 0;
      return [
        { label: "実質還元率", value: pct(realRate, 2), primary: true },
        { label: "獲得ポイント（年間）", value: yen(gross) },
        {
          label: "実際に使えるポイント",
          value: yen(usable),
          note: `失効分 ${yen(gross - usable)}`,
        },
        { label: "その他の特典", value: yen(i.num("otherBenefit")) },
        { label: "年会費", value: `− ${yen(i.num("annualFee"))}` },
        { label: "年間の実質的な利益", value: yen(net) },
        {
          label: "年会費の元が取れる年間利用額",
          value: yen(Math.max(0, breakEven)),
        },
      ];
    },
  },

  /* 154 */
  "catalog-154": {
    title: "貯金目標計算",
    lead: "目標金額と期限から、必要な毎月の貯金額を計算します。",
    fields: [
      moneyField("target", "目標金額", "3000000"),
      moneyField("current", "現在の貯蓄額", "500000"),
      countField("months", "目標までの期間", "36", "ヶ月"),
      rateField("rate", "想定利回り（年）", "0"),
      moneyField("bonus", "ボーナスから貯める額（年2回・1回あたり）", "100000"),
    ],
    compute: (i) => {
      const months = Math.max(1, i.int("months"));
      const r = i.num("rate") / 100 / 12;
      const currentFuture = i.num("current") * Math.pow(1 + r, months);
      const bonusCount = Math.floor(months / 6);
      const bonusTotal = i.num("bonus") * bonusCount;
      const needed = Math.max(0, i.num("target") - currentFuture - bonusTotal);
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      const monthly = needed / factor;
      return [
        { label: "毎月必要な貯金額", value: yen(monthly), primary: true },
        { label: "目標金額", value: yen(i.num("target")) },
        { label: "現在の貯蓄", value: yen(i.num("current")) },
        {
          label: "ボーナスからの貯金",
          value: yen(bonusTotal),
          note: `${bonusCount}回分`,
        },
        { label: "毎月の積立で貯める額", value: yen(needed) },
        {
          label: "期間",
          value: `${Math.floor(months / 12)}年${months % 12}ヶ月`,
        },
        {
          label: "毎月の貯金を1万円増やした場合",
          value: `${num(
            needed > 0 && monthly + 10_000 > 0
              ? needed / (monthly + 10_000)
              : months,
            0,
          )}ヶ月で達成`,
        },
      ];
    },
  },

  /* 155 */
  "catalog-155": {
    title: "毎月貯金額計算",
    lead: "手取り収入から適正な貯金額を計算し、将来の貯蓄額を試算します。",
    fields: [
      moneyField("income", "手取り月収", "280000"),
      moneyField("expense", "1ヶ月の支出", "220000"),
      rateField("targetRate", "目標貯蓄率", "20"),
      countField("years", "貯め続ける年数", "10", "年"),
      rateField("rate", "想定利回り（年）", "0"),
    ],
    compute: (i) => {
      const income = i.num("income");
      const actual = income - i.num("expense");
      const target = (income * i.num("targetRate")) / 100;
      const months = i.int("years") * 12;
      const r = i.num("rate") / 100 / 12;
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      return [
        { label: "実際の貯金額（月）", value: yen(actual), primary: true },
        {
          label: "現在の貯蓄率",
          value: pct(income ? (actual / income) * 100 : 0, 1),
        },
        {
          label: "目標貯蓄額（月）",
          value: yen(target),
          note:
            actual >= target
              ? "目標を達成しています"
              : `あと ${yen(target - actual)} 必要です`,
        },
        { label: "年間の貯金額", value: yen(actual * 12) },
        {
          label: `${i.int("years")}年後の貯蓄額`,
          value: yen(actual * factor),
        },
        {
          label: "目標額で貯めた場合",
          value: yen(target * factor),
        },
        {
          label: "生活防衛資金の目安",
          value: yen(i.num("expense") * 6),
          note: "支出6ヶ月分",
        },
      ];
    },
  },

  /* 156 */
  "catalog-156": {
    title: "複利計算",
    lead: "元本を複利で運用した場合の将来価値を計算します。",
    fields: [
      moneyField("principal", "元本", "1000000"),
      rateField("rate", "年利", "5"),
      countField("years", "運用期間", "20", "年"),
      selectField("frequency", "複利の頻度", "12", [
        { value: "1", label: "年1回" },
        { value: "2", label: "半年ごと" },
        { value: "4", label: "四半期ごと" },
        { value: "12", label: "毎月" },
      ]),
    ],
    compute: (i) => {
      const principal = i.num("principal");
      const rate = i.num("rate") / 100;
      const years = i.int("years");
      const n = Number(i.raw("frequency"));
      const future = principal * Math.pow(1 + rate / n, n * years);
      const simple = principal * (1 + rate * years);
      const doubling = rate > 0 ? 72 / i.num("rate") : 0;
      return [
        { label: "運用後の金額", value: yen(future), primary: true },
        { label: "元本", value: yen(principal) },
        { label: "運用益", value: yen(future - principal) },
        {
          label: "元本に対する倍率",
          value: `${num(principal ? future / principal : 0, 2)}倍`,
        },
        {
          label: "単利で運用した場合",
          value: yen(simple),
          note: `複利との差 ${yen(future - simple)}`,
        },
        {
          label: "元本が2倍になる年数",
          value: doubling > 0 ? `約${num(doubling, 1)}年` : "—",
          note: "72の法則による概算",
        },
        {
          label: "税引後（20.315％）",
          value: yen(principal + (future - principal) * 0.79685),
        },
      ];
    },
  },

  /* 157 */
  "catalog-157": {
    title: "積立シミュレーター",
    lead: "毎月の積立額と利回りから、将来の資産額を計算します。",
    fields: [
      moneyField("monthly", "毎月の積立額", "30000"),
      moneyField("initial", "初期投資額", "0"),
      rateField("rate", "想定利回り（年）", "5"),
      countField("years", "積立期間", "20", "年"),
    ],
    compute: (i) => {
      const months = i.int("years") * 12;
      const r = i.num("rate") / 100 / 12;
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      const fromMonthly = i.num("monthly") * factor;
      const fromInitial = i.num("initial") * Math.pow(1 + r, months);
      const future = fromMonthly + fromInitial;
      const principal = i.num("monthly") * months + i.num("initial");
      const gain = future - principal;
      const halfway =
        i.num("monthly") *
          (r === 0 ? months / 2 : (Math.pow(1 + r, months / 2) - 1) / r) +
        i.num("initial") * Math.pow(1 + r, months / 2);
      return [
        { label: "積立後の資産額", value: yen(future), primary: true },
        { label: "積立元本の合計", value: yen(principal) },
        { label: "運用益", value: yen(gain) },
        {
          label: "元本に対する増加率",
          value: pct(principal ? (gain / principal) * 100 : 0, 1),
        },
        {
          label: `${Math.floor(i.int("years") / 2)}年後の資産額`,
          value: yen(halfway),
        },
        {
          label: "税引後（20.315％）",
          value: yen(principal + gain * 0.79685),
          note: "NISA口座なら非課税",
        },
        {
          label: "利回り0％だった場合",
          value: yen(principal),
        },
      ];
    },
    note: "将来の運用成果を保証するものではありません。投資にはリスクがあります。",
  },

  /* 158 */
  "catalog-158": {
    title: "投資元本計算",
    lead: "目標額から逆算して、必要な元本または毎月の積立額を求めます。",
    fields: [
      moneyField("target", "目標額", "20000000"),
      rateField("rate", "想定利回り（年）", "5"),
      countField("years", "運用期間", "25", "年"),
      selectField("method", "計算する内容", "monthly", [
        { value: "lump", label: "一括投資に必要な元本" },
        { value: "monthly", label: "毎月の積立額" },
      ]),
    ],
    compute: (i) => {
      const months = i.int("years") * 12;
      const r = i.num("rate") / 100 / 12;
      const target = i.num("target");
      const lump = target / Math.pow(1 + r, months);
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      const monthly = target / factor;
      const lumpMode = i.raw("method") === "lump";
      return [
        {
          label: lumpMode ? "必要な元本（一括投資）" : "必要な毎月の積立額",
          value: yen(lumpMode ? lump : monthly),
          primary: true,
        },
        { label: "目標額", value: yen(target) },
        { label: "一括投資に必要な元本", value: yen(lump) },
        { label: "毎月の積立額", value: yen(monthly) },
        {
          label: "積立元本の合計",
          value: yen(monthly * months),
          note: `運用益 ${yen(target - monthly * months)}`,
        },
        { label: "運用期間", value: `${i.int("years")}年（${months}ヶ月）` },
        {
          label: "利回り0％の場合に必要な毎月の額",
          value: yen(target / months),
        },
      ];
    },
  },

  /* 159 */
  "catalog-159": {
    title: "利回り計算",
    lead: "投資額と受取額から利回り（単利・年平均・年率）を計算します。",
    fields: [
      moneyField("invested", "投資した金額", "1000000"),
      moneyField("received", "受け取った金額（評価額）", "1500000"),
      decimalField("years", "運用期間", "5", "年"),
      moneyField("income", "期間中の配当・分配金の合計", "0"),
    ],
    compute: (i) => {
      const invested = i.num("invested");
      const received = i.num("received") + i.num("income");
      const years = Math.max(0.01, i.num("years"));
      const gain = received - invested;
      const totalReturn = invested ? (gain / invested) * 100 : 0;
      const annualSimple = totalReturn / years;
      const cagr =
        invested > 0 && received > 0
          ? (Math.pow(received / invested, 1 / years) - 1) * 100
          : 0;
      return [
        {
          label: "年平均利回り（年率・CAGR）",
          value: pct(cagr, 2),
          primary: true,
        },
        { label: "トータルリターン", value: pct(totalReturn, 2) },
        { label: "単純年利回り", value: pct(annualSimple, 2) },
        { label: "損益", value: yen(gain) },
        ...(i.num("income") > 0
          ? [
              {
                label: "インカムゲイン（配当など）",
                value: yen(i.num("income")),
                note: `利回り ${pct(invested ? (i.num("income") / invested / years) * 100 : 0, 2)}／年`,
              },
            ]
          : []),
        {
          label: "税引後の損益（20.315％）",
          value: yen(gain > 0 ? gain * 0.79685 : gain),
        },
        {
          label: "同じ利回りが続いた場合の10年後",
          value: yen(invested * Math.pow(1 + cagr / 100, 10)),
        },
      ];
    },
  },

  /* 160 */
  "catalog-160": {
    title: "ローン返済計算",
    lead: "借入額・金利・返済回数から毎月の返済額と総返済額を計算します。",
    fields: [
      moneyField("principal", "借入額", "1000000"),
      rateField("rate", "実質年率", "15.0"),
      countField("months", "返済回数", "36", "回"),
      selectField("method", "返済方式", "annuity", [
        { value: "annuity", label: "元利均等返済" },
        { value: "equal", label: "元金均等返済" },
      ]),
    ],
    compute: (i) => {
      const principal = i.num("principal");
      const months = Math.max(1, i.int("months"));
      const rate = i.num("rate");
      const r = rate / 100 / 12;
      if (i.raw("method") === "equal") {
        const principalPart = principal / months;
        const firstPayment = principalPart + principal * r;
        const lastPayment = principalPart + principalPart * r;
        const totalInterest = (principal * r * (months + 1)) / 2;
        return [
          { label: "初回の返済額", value: yen(firstPayment), primary: true },
          { label: "最終回の返済額", value: yen(lastPayment) },
          { label: "毎月の元金", value: yen(principalPart) },
          { label: "総返済額", value: yen(principal + totalInterest) },
          { label: "利息の総額", value: yen(totalInterest) },
          {
            label: "元利均等返済との比較",
            value: yen(
              annuityPayment(principal, rate, months) * months -
                principal -
                totalInterest,
            ),
            note: "元金均等のほうが利息を抑えられます",
          },
        ];
      }
      const payment = annuityPayment(principal, rate, months);
      const total = payment * months;
      return [
        { label: "毎月の返済額", value: yen(payment), primary: true },
        { label: "総返済額", value: yen(total) },
        { label: "利息の総額", value: yen(total - principal) },
        { label: "返済回数", value: `${months}回（${num(months / 12, 1)}年）` },
        {
          label: "初回の内訳",
          value: `元金 ${yen(payment - principal * r)} / 利息 ${yen(principal * r)}`,
        },
        {
          label: "返済総額の借入額に対する割合",
          value: pct(principal ? (total / principal) * 100 : 0, 1),
        },
      ];
    },
  },

  /* 161 */
  "catalog-161": {
    title: "分割払い計算",
    lead: "分割払いの手数料と支払総額を計算し、一括払いと比較します。",
    fields: [
      moneyField("amount", "購入金額", "300000"),
      countField("times", "分割回数", "12", "回"),
      rateField("rate", "実質年率", "15.0"),
      selectField("kind", "支払い方法", "installment", [
        { value: "installment", label: "分割払い" },
        { value: "revolving", label: "リボ払い（定額）" },
      ]),
      moneyField("revolvingMonthly", "リボ払いの毎月の支払額", "10000"),
    ],
    compute: (i) => {
      const amount = i.num("amount");
      const rate = i.num("rate");
      const r = rate / 100 / 12;
      if (i.raw("kind") === "revolving") {
        const monthly = Math.max(1, i.num("revolvingMonthly"));
        let balance = amount;
        let months = 0;
        let interest = 0;
        while (balance > 0 && months < 600) {
          const fee = balance * r;
          interest += fee;
          balance = balance + fee - monthly;
          months += 1;
        }
        return [
          { label: "支払総額", value: yen(amount + interest), primary: true },
          { label: "手数料の総額", value: yen(interest) },
          {
            label: "完済までの回数",
            value: `${months}回（${num(months / 12, 1)}年）`,
          },
          { label: "毎月の支払額", value: yen(monthly) },
          {
            label: "初回の内訳",
            value: `元金 ${yen(Math.max(0, monthly - amount * r))} / 手数料 ${yen(amount * r)}`,
          },
          {
            label: "一括払いとの差額",
            value: yen(interest),
            note: `購入金額の ${pct(amount ? (interest / amount) * 100 : 0, 1)}`,
          },
        ];
      }
      const times = Math.max(1, i.int("times"));
      const payment = annuityPayment(amount, rate, times);
      const total = payment * times;
      return [
        { label: "毎月の支払額", value: yen(payment), primary: true },
        { label: "支払総額", value: yen(total) },
        { label: "手数料の総額", value: yen(total - amount) },
        { label: "分割回数", value: `${times}回` },
        {
          label: "一括払いとの差額",
          value: yen(total - amount),
          note: `購入金額の ${pct(amount ? ((total - amount) / amount) * 100 : 0, 1)}`,
        },
        {
          label: "2回払い・ボーナス一括の場合",
          value: yen(amount),
          note: "手数料は無料になるのが一般的です",
        },
      ];
    },
    note: "リボ払いは残高が減りにくく、手数料が膨らみやすい点に注意してください。",
  },

  /* 162 */
  "catalog-162": {
    title: "クレジット手数料計算",
    lead: "分割回数ごとの手数料を比較し、実質年率から負担額を確認します。",
    fields: [
      moneyField("amount", "利用金額", "200000"),
      rateField("rate", "実質年率", "15.0"),
      countField("times", "分割回数", "12", "回"),
      rateField("pointRate", "ポイント還元率", "1"),
    ],
    compute: (i) => {
      const amount = i.num("amount");
      const rate = i.num("rate");
      const options = [3, 6, 12, 24, 36];
      const rows = options.map((times) => {
        const payment = annuityPayment(amount, rate, times);
        return {
          label: `${times}回払い`,
          value: `${yen(payment)} / 月`,
          note: `手数料 ${yen(payment * times - amount)}`,
        };
      });
      const selected = Math.max(1, i.int("times"));
      const payment = annuityPayment(amount, rate, selected);
      const fee = payment * selected - amount;
      const points = (amount * i.num("pointRate")) / 100;
      return [
        {
          label: `手数料（${selected}回払い）`,
          value: yen(fee),
          primary: true,
          note: `毎月 ${yen(payment)}`,
        },
        { label: "支払総額", value: yen(amount + fee) },
        {
          label: "ポイント還元を差し引いた実質負担",
          value: yen(fee - points),
          note: `獲得ポイント ${yen(points)}`,
        },
        ...rows,
        {
          label: "1回払い（手数料なし）",
          value: yen(amount),
          note: `${yen(fee)} の節約`,
        },
      ];
    },
  },

  /* 163 */
  "catalog-163": {
    title: "家計固定費計算",
    lead: "毎月の固定費を集計し、削減余地の大きい項目を確認します。",
    fields: [
      moneyField("housing", "家賃・住宅ローン", "90000"),
      moneyField("utility", "水道光熱費", "15000"),
      moneyField("communication", "通信費（スマホ・ネット）", "12000"),
      moneyField("insurance", "保険料", "15000"),
      moneyField("subscription", "サブスク・会費", "4000"),
      moneyField("car", "車関連（ローン・駐車場）", "25000"),
      moneyField("education", "教育費・習い事", "20000"),
      moneyField("income", "手取り月収", "280000"),
    ],
    compute: (i) => {
      const items: [string, number][] = [
        ["家賃・住宅ローン", i.num("housing")],
        ["水道光熱費", i.num("utility")],
        ["通信費", i.num("communication")],
        ["保険料", i.num("insurance")],
        ["サブスク・会費", i.num("subscription")],
        ["車関連", i.num("car")],
        ["教育費・習い事", i.num("education")],
      ];
      const total = items.reduce((sum, [, value]) => sum + value, 0);
      const income = i.num("income");
      const largest = [...items].sort((a, b) => b[1] - a[1])[0];
      return [
        { label: "固定費の合計（月）", value: yen(total), primary: true },
        { label: "年間の固定費", value: yen(total * 12) },
        {
          label: "手取りに占める割合",
          value: pct(income ? (total / income) * 100 : 0, 1),
          note: "手取りの50％以内が一つの目安です",
        },
        ...items.map(([label, value]) => ({
          label,
          value: `${yen(value)}（${pct(total ? (value / total) * 100 : 0, 1)}）`,
        })),
        {
          label: "最も大きい固定費",
          value: `${largest[0]} ${yen(largest[1])}`,
        },
        {
          label: "固定費を10％削減できた場合",
          value: `${yen(total * 0.1)} / 月`,
          note: `年間 ${yen(total * 1.2)} の節約`,
        },
      ];
    },
  },

  /* 164 */
  "catalog-164": {
    title: "家計年間支出計算",
    lead: "毎月の支出と年数回の特別支出を合算し、年間支出を計算します。",
    fields: [
      moneyField("monthly", "毎月の支出（生活費すべて）", "250000"),
      moneyField("insurance", "年払いの保険料", "80000"),
      moneyField("tax", "税金（自動車税・固定資産税など）", "150000"),
      moneyField("travel", "旅行・帰省費（年間）", "200000"),
      moneyField("event", "冠婚葬祭・お祝い（年間）", "100000"),
      moneyField("maintenance", "車検・家電買替など（年間）", "100000"),
      moneyField("income", "手取り年収", "4200000"),
    ],
    compute: (i) => {
      const monthlyTotal = i.num("monthly") * 12;
      const special =
        i.num("insurance") +
        i.num("tax") +
        i.num("travel") +
        i.num("event") +
        i.num("maintenance");
      const total = monthlyTotal + special;
      const income = i.num("income");
      const balance = income - total;
      return [
        { label: "年間の支出合計", value: yen(total), primary: true },
        {
          label: "月あたりの平均支出",
          value: yen(total / 12),
          note: `毎月の支出より ${yen(total / 12 - i.num("monthly"))} 多い`,
        },
        { label: "毎月の支出（12ヶ月分）", value: yen(monthlyTotal) },
        { label: "特別支出の合計", value: yen(special) },
        { label: "　年払いの保険料", value: yen(i.num("insurance")) },
        { label: "　税金", value: yen(i.num("tax")) },
        { label: "　旅行・帰省", value: yen(i.num("travel")) },
        { label: "　冠婚葬祭", value: yen(i.num("event")) },
        { label: "　車検・買替", value: yen(i.num("maintenance")) },
        {
          label: balance >= 0 ? "年間の黒字額" : "年間の赤字額",
          value: yen(Math.abs(balance)),
          note: `貯蓄率 ${income ? num((balance / income) * 100, 1) : 0}%`,
        },
        {
          label: "特別支出に備える毎月の積立額",
          value: yen(special / 12),
        },
      ];
    },
  },

  /* 165 */
  "catalog-165": {
    title: "節約額年間換算",
    lead: "日々の小さな節約が年間・生涯でいくらになるかを計算します。",
    fields: [
      moneyField("amount", "1回あたりの節約額", "300"),
      countField("frequency", "頻度", "20", "回"),
      selectField("period", "頻度の単位", "month", [
        { value: "day", label: "1日あたり" },
        { value: "week", label: "1週あたり" },
        { value: "month", label: "1ヶ月あたり" },
      ]),
      countField("years", "続ける年数", "10", "年"),
      rateField("rate", "節約分を運用した場合の利回り", "3"),
    ],
    compute: (i) => {
      const per = i.num("amount") * i.int("frequency");
      const multipliers: Record<string, number> = {
        day: 365,
        week: 52,
        month: 12,
      };
      const annual = per * (multipliers[i.raw("period")] ?? 12);
      const monthly = annual / 12;
      const years = Math.max(1, i.int("years"));
      const months = years * 12;
      const r = i.num("rate") / 100 / 12;
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      const invested = monthly * factor;
      return [
        { label: "年間の節約額", value: yen(annual), primary: true },
        { label: "月あたり", value: yen(monthly) },
        { label: "1日あたり", value: yen(annual / 365) },
        { label: `${years}年間の合計`, value: yen(annual * years) },
        {
          label: `${years}年間 運用した場合`,
          value: yen(invested),
          note: `運用益 ${yen(invested - annual * years)}`,
        },
        {
          label: "30年間続けた場合",
          value: yen(annual * 30),
        },
      ];
    },
  },
};
