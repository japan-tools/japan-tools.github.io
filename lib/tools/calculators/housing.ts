import { ACQUISITION_TAX, PROPERTY_TAX, brokerageFeeSale } from "./data";
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

/** 元利均等返済の毎月返済額 */
export function annuityPayment(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  );
}

/** 毎月返済額から借入可能額を逆算する */
export function annuityPrincipal(
  payment: number,
  annualRatePct: number,
  months: number,
): number {
  if (payment <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return payment * months;
  return (
    (payment * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months))
  );
}

/** 返済スケジュールから残高推移を求める */
export function amortize(
  principal: number,
  annualRatePct: number,
  months: number,
) {
  const payment = annuityPayment(principal, annualRatePct, months);
  const r = annualRatePct / 100 / 12;
  let balance = principal;
  let totalInterest = 0;
  const yearEndBalances: number[] = [];
  for (let m = 1; m <= months; m += 1) {
    const interest = balance * r;
    totalInterest += interest;
    balance = Math.max(0, balance + interest - payment);
    if (m % 12 === 0) yearEndBalances.push(balance);
  }
  return { payment, totalInterest, yearEndBalances };
}

const loanFields = [
  moneyField("principal", "借入額", "35000000"),
  rateField("rate", "金利（年）", "1.0"),
  countField("years", "返済期間", "35", "年"),
];

export const housingCalculators: Record<string, CalculatorSpec> = {
  /* 66 */
  "catalog-66": {
    title: "家賃予算計算",
    lead: "手取り収入から無理のない家賃の上限を計算します。",
    fields: [
      moneyField("net", "手取り月収", "250000"),
      rateField("ratio", "家賃に充てる割合", "25"),
      moneyField("otherFixed", "その他の固定費（月）", "50000"),
    ],
    compute: (i) => {
      const net = i.num("net");
      const budget = (net * i.num("ratio")) / 100;
      const remaining = net - budget - i.num("otherFixed");
      return [
        {
          label: "家賃の予算（管理費込み）",
          value: yen(budget),
          primary: true,
        },
        { label: "3分の1を上限とした場合", value: yen(net / 3) },
        { label: "4分の1を上限とした場合", value: yen(net / 4) },
        { label: "年間の家賃負担", value: yen(budget * 12) },
        {
          label: "家賃・固定費を引いた残り",
          value: yen(remaining),
          note: remaining < 0 ? "支出が収入を超えています" : undefined,
        },
        {
          label: "入居時に必要な初期費用の目安",
          value: yen(budget * 5),
          note: "敷金・礼金・仲介手数料・前家賃で家賃4〜6ヶ月分",
        },
      ];
    },
  },

  /* 67 */
  "catalog-67": {
    title: "手取り別家賃目安",
    lead: "手取り額ごとの家賃目安を割合別に比較します。",
    fields: [
      moneyField("net", "手取り月収", "250000"),
      countField("household", "世帯人数", "1", "人"),
    ],
    compute: (i) => {
      const net = i.num("net");
      const household = Math.max(1, i.int("household"));
      const recommended = household === 1 ? 0.3 : household === 2 ? 0.27 : 0.25;
      return [
        {
          label: "おすすめの家賃上限",
          value: yen(net * recommended),
          primary: true,
          note: `世帯${household}人の場合は手取りの${pct(recommended * 100, 0)}が目安`,
        },
        { label: "手取りの20％（余裕重視）", value: yen(net * 0.2) },
        { label: "手取りの25％（標準）", value: yen(net * 0.25) },
        { label: "手取りの30％（やや高め）", value: yen(net * 0.3) },
        { label: "手取りの33％（上限）", value: yen(net / 3) },
        {
          label: "残る生活費（おすすめ額の場合）",
          value: yen(net * (1 - recommended)),
        },
      ];
    },
  },

  /* 68 */
  "catalog-68": {
    title: "賃貸初期費用計算",
    lead: "家賃から敷金・礼金・仲介手数料などの初期費用を合計します。",
    fields: [
      moneyField("rent", "家賃（月）", "80000"),
      moneyField("management", "管理費・共益費（月）", "5000"),
      decimalField("deposit", "敷金", "1", "ヶ月分"),
      decimalField("keyMoney", "礼金", "1", "ヶ月分"),
      decimalField(
        "brokerage",
        "仲介手数料",
        "1.1",
        "ヶ月分",
        "上限は家賃1ヶ月＋消費税",
      ),
      moneyField("insurance", "火災保険料（2年）", "20000"),
      moneyField("guarantee", "保証会社の初回保証料", "40000"),
      moneyField("other", "鍵交換・消毒などの費用", "30000"),
    ],
    compute: (i) => {
      const rent = i.num("rent");
      const monthly = rent + i.num("management");
      const deposit = rent * i.num("deposit");
      const keyMoney = rent * i.num("keyMoney");
      const brokerage = rent * i.num("brokerage");
      const total =
        deposit +
        keyMoney +
        brokerage +
        monthly +
        i.num("insurance") +
        i.num("guarantee") +
        i.num("other");
      return [
        { label: "初期費用の合計", value: yen(total), primary: true },
        {
          label: "家賃の何ヶ月分か",
          value: `${num(monthly ? total / monthly : 0, 1)}ヶ月分`,
        },
        { label: "敷金", value: yen(deposit) },
        { label: "礼金", value: yen(keyMoney) },
        { label: "仲介手数料", value: yen(brokerage) },
        { label: "前家賃（家賃＋管理費）", value: yen(monthly) },
        { label: "火災保険料", value: yen(i.num("insurance")) },
        { label: "保証料", value: yen(i.num("guarantee")) },
        { label: "その他費用", value: yen(i.num("other")) },
      ];
    },
    note: "仲介手数料の上限は家賃1ヶ月分＋消費税です。退去時には原状回復費用が敷金から差し引かれます。",
  },

  /* 69 */
  "catalog-69": {
    title: "敷金・礼金計算",
    lead: "敷金・礼金の金額と、退去時に返還される敷金の目安を計算します。",
    fields: [
      moneyField("rent", "家賃（月）", "80000"),
      decimalField("deposit", "敷金", "2", "ヶ月分"),
      decimalField("keyMoney", "礼金", "1", "ヶ月分"),
      moneyField("restoration", "退去時の原状回復費用", "60000"),
      selectField("cleaning", "ハウスクリーニング特約", "yes", [
        { value: "yes", label: "あり（借主負担）" },
        { value: "no", label: "なし" },
      ]),
      moneyField("cleaningCost", "クリーニング費用", "30000"),
    ],
    compute: (i) => {
      const rent = i.num("rent");
      const deposit = rent * i.num("deposit");
      const keyMoney = rent * i.num("keyMoney");
      const cleaning = i.raw("cleaning") === "yes" ? i.num("cleaningCost") : 0;
      const deduction = i.num("restoration") + cleaning;
      const refund = deposit - deduction;
      return [
        {
          label: refund >= 0 ? "返還される敷金" : "追加で請求される額",
          value: yen(Math.abs(refund)),
          primary: true,
        },
        { label: "敷金", value: yen(deposit) },
        { label: "礼金（返還されません）", value: yen(keyMoney) },
        { label: "入居時の支払合計", value: yen(deposit + keyMoney) },
        { label: "原状回復費用", value: `− ${yen(i.num("restoration"))}` },
        ...(cleaning > 0
          ? [{ label: "クリーニング費用", value: `− ${yen(cleaning)}` }]
          : []),
        {
          label: "実質的な負担額",
          value: yen(keyMoney + deduction),
          note: "礼金＋敷金から差し引かれた分",
        },
      ];
    },
    note: "通常損耗・経年劣化の修繕費は貸主負担が原則です（国土交通省 原状回復ガイドライン）。",
  },

  /* 70 */
  "catalog-70": {
    title: "更新料計算",
    lead: "契約更新時にかかる更新料・更新事務手数料などを計算します。",
    fields: [
      moneyField("rent", "家賃（月）", "80000"),
      decimalField("renewal", "更新料", "1", "ヶ月分"),
      moneyField("fee", "更新事務手数料", "11000"),
      moneyField("insurance", "火災保険の更新料", "20000"),
      moneyField("guarantee", "保証会社の更新料", "10000"),
      countField("years", "契約期間", "2", "年"),
    ],
    compute: (i) => {
      const renewal = i.num("rent") * i.num("renewal");
      const total =
        renewal + i.num("fee") + i.num("insurance") + i.num("guarantee");
      const years = Math.max(1, i.int("years"));
      return [
        { label: "更新時の支払合計", value: yen(total), primary: true },
        { label: "更新料", value: yen(renewal) },
        { label: "更新事務手数料", value: yen(i.num("fee")) },
        { label: "火災保険の更新", value: yen(i.num("insurance")) },
        { label: "保証会社の更新料", value: yen(i.num("guarantee")) },
        {
          label: "月あたりに均した負担",
          value: yen(total / (years * 12)),
          note: `${years}年ごとの更新として計算`,
        },
        {
          label: "実質的な月額家賃",
          value: yen(i.num("rent") + total / (years * 12)),
        },
      ];
    },
  },

  /* 71 */
  "catalog-71": {
    title: "引越し費用シミュレーター",
    lead: "時期・距離・荷物量から引越し費用の目安を計算します。",
    fields: [
      selectField("size", "荷物量", "single", [
        { value: "singleS", label: "単身（荷物少なめ）" },
        { value: "single", label: "単身（標準）" },
        { value: "couple", label: "2人暮らし" },
        { value: "family3", label: "3人家族" },
        { value: "family4", label: "4人以上の家族" },
      ]),
      selectField("distance", "移動距離", "short", [
        { value: "same", label: "同一市区町村（〜15km）" },
        { value: "short", label: "同一都道府県（〜50km）" },
        { value: "middle", label: "近隣県（〜200km）" },
        { value: "long", label: "遠距離（500km〜）" },
      ]),
      selectField("season", "時期", "normal", [
        { value: "normal", label: "通常期（5〜2月）" },
        { value: "busy", label: "繁忙期（3〜4月）" },
      ]),
      moneyField(
        "option",
        "オプション費用（エアコン工事・不用品処分など）",
        "20000",
      ),
    ],
    compute: (i) => {
      const base: Record<string, number> = {
        singleS: 35_000,
        single: 50_000,
        couple: 75_000,
        family3: 95_000,
        family4: 120_000,
      };
      const distanceRate: Record<string, number> = {
        same: 1,
        short: 1.2,
        middle: 1.6,
        long: 2.4,
      };
      const seasonRate = i.raw("season") === "busy" ? 1.6 : 1;
      const core =
        (base[i.raw("size")] ?? 50_000) *
        (distanceRate[i.raw("distance")] ?? 1.2) *
        seasonRate;
      const option = i.num("option");
      const total = core + option;
      return [
        { label: "引越し費用の目安", value: yen(total), primary: true },
        {
          label: "見積りの想定レンジ",
          value: `${yen(total * 0.8)} 〜 ${yen(total * 1.3)}`,
        },
        { label: "基本運賃・作業料", value: yen(core) },
        { label: "オプション費用", value: yen(option) },
        {
          label: "繁忙期の割増",
          value:
            seasonRate > 1
              ? `+${yen(core - core / seasonRate)}（約60％増）`
              : "なし",
        },
        {
          label: "節約のポイント",
          value:
            seasonRate > 1
              ? "3〜4月を避けると3〜4割安くなります"
              : "平日・午後便・複数社見積りでさらに削減できます",
        },
      ];
    },
    note: "実際の費用は業者・トラックサイズ・搬出入条件で大きく変わります。相見積りをおすすめします。",
  },

  /* 72 */
  "catalog-72": {
    title: "住宅ローン返済額計算",
    lead: "借入額・金利・返済期間から毎月の返済額を計算します（元利均等返済）。",
    fields: [
      ...loanFields,
      moneyField("bonus", "ボーナス返済分（年2回・1回あたり）", "0"),
    ],
    compute: (i) => {
      const principal = i.num("principal");
      const months = i.int("years") * 12;
      const bonusAnnual = i.num("bonus") * 2;
      // ボーナス返済分に相当する元本を分離
      const bonusPrincipal = bonusAnnual
        ? Math.min(
            principal,
            annuityPrincipal(bonusAnnual / 12, i.num("rate"), months),
          )
        : 0;
      const monthlyPrincipal = principal - bonusPrincipal;
      const payment = annuityPayment(monthlyPrincipal, i.num("rate"), months);
      const total = payment * months + bonusAnnual * i.int("years");
      return [
        { label: "毎月の返済額", value: yen(payment), primary: true },
        ...(bonusAnnual > 0
          ? [{ label: "ボーナス時の加算額", value: yen(i.num("bonus")) }]
          : []),
        { label: "年間の返済額", value: yen(payment * 12 + bonusAnnual) },
        { label: "総返済額", value: yen(total) },
        { label: "利息の総額", value: yen(total - principal) },
        {
          label: "総返済額の借入額に対する割合",
          value: pct(principal ? (total / principal) * 100 : 0, 1),
        },
      ];
    },
    note: "元利均等返済の計算です。団体信用生命保険料・保証料・事務手数料は含みません。",
  },

  /* 73 */
  "catalog-73": {
    title: "住宅ローン総返済額計算",
    lead: "返済期間全体の総返済額と、金利・期間を変えた場合の差額を比較します。",
    fields: loanFields,
    compute: (i) => {
      const principal = i.num("principal");
      const rate = i.num("rate");
      const years = i.int("years");
      const payment = annuityPayment(principal, rate, years * 12);
      const total = payment * years * 12;
      const shorter =
        annuityPayment(principal, rate, (years - 5) * 12) * (years - 5) * 12;
      const higher =
        annuityPayment(principal, rate + 0.5, years * 12) * years * 12;
      return [
        { label: "総返済額", value: yen(total), primary: true },
        { label: "毎月の返済額", value: yen(payment) },
        { label: "元金", value: yen(principal) },
        { label: "利息の総額", value: yen(total - principal) },
        {
          label: `返済期間を${years - 5}年にした場合`,
          value: yen(shorter),
          note: years > 5 ? `${yen(total - shorter)} の削減` : "—",
        },
        {
          label: `金利が${num(rate + 0.5, 2)}％の場合`,
          value: yen(higher),
          note: `${yen(higher - total)} の増加`,
        },
      ];
    },
  },

  /* 74 */
  "catalog-74": {
    title: "住宅ローン利息計算",
    lead: "返済期間中に支払う利息の総額と、初回返済の元金・利息の内訳を計算します。",
    fields: loanFields,
    compute: (i) => {
      const principal = i.num("principal");
      const rate = i.num("rate");
      const months = i.int("years") * 12;
      const { payment, totalInterest, yearEndBalances } = amortize(
        principal,
        rate,
        months,
      );
      const firstInterest = (principal * rate) / 100 / 12;
      return [
        { label: "利息の総額", value: yen(totalInterest), primary: true },
        { label: "毎月の返済額", value: yen(payment) },
        {
          label: "初回返済の内訳",
          value: `元金 ${yen(payment - firstInterest)} / 利息 ${yen(firstInterest)}`,
        },
        {
          label: "10年後の残高",
          value: yen(yearEndBalances[9] ?? 0),
        },
        {
          label: "元金に対する利息の割合",
          value: pct(principal ? (totalInterest / principal) * 100 : 0, 1),
        },
        { label: "総返済額", value: yen(principal + totalInterest) },
      ];
    },
  },

  /* 75 */
  "catalog-75": {
    title: "借入可能額シミュレーター",
    lead: "年収と返済比率から借入可能額の目安を逆算します。",
    fields: [
      moneyField("annual", "年収（額面）", "6000000"),
      rateField("ratio", "返済比率", "30"),
      rateField(
        "rate",
        "審査金利",
        "3.0",
        "実行金利より高い金利で審査されます",
      ),
      countField("years", "返済期間", "35", "年"),
      moneyField("otherLoan", "他の借入の年間返済額", "0"),
    ],
    compute: (i) => {
      const annual = i.num("annual");
      const capacity = (annual * i.num("ratio")) / 100 - i.num("otherLoan");
      const monthly = Math.max(0, capacity / 12);
      const principal = annuityPrincipal(
        monthly,
        i.num("rate"),
        i.int("years") * 12,
      );
      const actualPayment = annuityPayment(principal, 1.0, i.int("years") * 12);
      return [
        { label: "借入可能額の目安", value: yen(principal), primary: true },
        { label: "年間の返済可能額", value: yen(Math.max(0, capacity)) },
        { label: "毎月の返済額（審査金利）", value: yen(monthly) },
        {
          label: "実行金利1.0％での毎月返済額",
          value: yen(actualPayment),
        },
        {
          label: "物件価格の目安（頭金2割）",
          value: yen(principal * 1.25),
        },
        {
          label: "年収倍率",
          value: `${num(annual ? principal / annual : 0, 1)}倍`,
        },
      ];
    },
    note: "金融機関は実行金利ではなく審査金利（3〜4％）で返済比率を判定するのが一般的です。",
  },

  /* 76 */
  "catalog-76": {
    title: "頭金シミュレーター",
    lead: "頭金の額によって総返済額がどれだけ変わるかを比較します。",
    fields: [
      moneyField("price", "物件価格", "40000000"),
      moneyField("downPayment", "頭金", "8000000"),
      rateField("rate", "金利（年）", "1.0"),
      countField("years", "返済期間", "35", "年"),
      rateField("costRatio", "諸費用の割合", "7"),
    ],
    compute: (i) => {
      const price = i.num("price");
      const down = Math.min(i.num("downPayment"), price);
      const months = i.int("years") * 12;
      const rate = i.num("rate");
      const principal = price - down;
      const payment = annuityPayment(principal, rate, months);
      const total = payment * months;
      const noDownTotal = annuityPayment(price, rate, months) * months;
      const costs = (price * i.num("costRatio")) / 100;
      return [
        { label: "毎月の返済額", value: yen(payment), primary: true },
        { label: "借入額", value: yen(principal) },
        {
          label: "頭金の割合",
          value: pct(price ? (down / price) * 100 : 0, 1),
        },
        { label: "総返済額", value: yen(total) },
        {
          label: "頭金なしとの差額",
          value: yen(noDownTotal - total),
          note: "頭金を入れることで減る総支払額",
        },
        {
          label: "諸費用（別途必要）",
          value: yen(costs),
          note: "登記費用・ローン手数料・火災保険・不動産取得税など",
        },
        {
          label: "契約時に必要な自己資金",
          value: yen(down + costs),
        },
      ];
    },
  },

  /* 77 */
  "catalog-77": {
    title: "繰上返済シミュレーター",
    lead: "繰上返済による利息の削減額と期間短縮効果を計算します。",
    fields: [
      moneyField("balance", "現在のローン残高", "25000000"),
      rateField("rate", "金利（年）", "1.0"),
      countField("remainingYears", "残りの返済期間", "25", "年"),
      moneyField("prepay", "繰上返済する金額", "3000000"),
      selectField("type", "繰上返済の方法", "period", [
        { value: "period", label: "期間短縮型" },
        { value: "payment", label: "返済額軽減型" },
      ]),
    ],
    compute: (i) => {
      const balance = i.num("balance");
      const rate = i.num("rate");
      const months = i.int("remainingYears") * 12;
      const prepay = Math.min(i.num("prepay"), balance);
      const payment = annuityPayment(balance, rate, months);
      const currentInterest = payment * months - balance;
      const newBalance = balance - prepay;
      if (i.raw("type") === "period") {
        const r = rate / 100 / 12;
        const newMonths =
          r === 0
            ? newBalance / payment
            : Math.log(payment / (payment - newBalance * r)) / Math.log(1 + r);
        const rounded = Math.ceil(newMonths);
        const newInterest = payment * rounded - newBalance;
        return [
          {
            label: "利息の削減額",
            value: yen(currentInterest - newInterest),
            primary: true,
          },
          { label: "毎月の返済額", value: `${yen(payment)}（変わりません）` },
          {
            label: "短縮される期間",
            value: `${Math.floor((months - rounded) / 12)}年${(months - rounded) % 12}ヶ月`,
          },
          {
            label: "返済期間",
            value: `${Math.floor(rounded / 12)}年${rounded % 12}ヶ月`,
          },
          { label: "繰上返済後の残高", value: yen(newBalance) },
          {
            label: "削減効果の倍率",
            value: prepay
              ? `${num((currentInterest - newInterest) / prepay, 2)}倍`
              : "—",
            note: "繰上返済額1円あたりの利息削減額",
          },
        ];
      }
      const newPayment = annuityPayment(newBalance, rate, months);
      const newInterest = newPayment * months - newBalance;
      return [
        {
          label: "利息の削減額",
          value: yen(currentInterest - newInterest),
          primary: true,
        },
        { label: "繰上返済後の毎月返済額", value: yen(newPayment) },
        { label: "毎月の軽減額", value: yen(payment - newPayment) },
        {
          label: "返済期間",
          value: `${i.int("remainingYears")}年（変わりません）`,
        },
        { label: "繰上返済後の残高", value: yen(newBalance) },
        {
          label: "削減効果の倍率",
          value: prepay
            ? `${num((currentInterest - newInterest) / prepay, 2)}倍`
            : "—",
        },
      ];
    },
    note: "期間短縮型のほうが利息削減効果は大きくなります。住宅ローン控除の適用期間・残高要件にご注意ください。",
  },

  /* 78 */
  "catalog-78": {
    title: "固定金利・変動金利比較",
    lead: "固定金利と変動金利（将来上昇シナリオ）の総返済額を比較します。",
    fields: [
      moneyField("principal", "借入額", "35000000"),
      countField("years", "返済期間", "35", "年"),
      rateField("fixedRate", "固定金利", "1.8"),
      rateField("variableRate", "変動金利（当初）", "0.5"),
      rateField("riseRate", "10年後からの上昇幅", "1.0"),
    ],
    compute: (i) => {
      const principal = i.num("principal");
      const months = i.int("years") * 12;
      const fixedPayment = annuityPayment(
        principal,
        i.num("fixedRate"),
        months,
      );
      const fixedTotal = fixedPayment * months;

      // 変動：当初10年は当初金利、その後は上昇後の金利で再計算
      const initialMonths = Math.min(120, months);
      const varPayment1 = annuityPayment(
        principal,
        i.num("variableRate"),
        months,
      );
      const r = i.num("variableRate") / 100 / 12;
      let balance = principal;
      for (let m = 0; m < initialMonths; m += 1) {
        balance = balance + balance * r - varPayment1;
      }
      balance = Math.max(0, balance);
      const restMonths = months - initialMonths;
      const risenRate = i.num("variableRate") + i.num("riseRate");
      const varPayment2 = annuityPayment(balance, risenRate, restMonths);
      const varTotal = varPayment1 * initialMonths + varPayment2 * restMonths;
      const diff = fixedTotal - varTotal;
      return [
        {
          label: diff >= 0 ? "変動金利のほうが有利" : "固定金利のほうが有利",
          value: yen(Math.abs(diff)),
          primary: true,
          note: "総返済額の差額",
        },
        { label: "固定金利の総返済額", value: yen(fixedTotal) },
        { label: "固定金利の毎月返済額", value: yen(fixedPayment) },
        { label: "変動金利の総返済額", value: yen(varTotal) },
        {
          label: "変動金利の毎月返済額（当初10年）",
          value: yen(varPayment1),
        },
        {
          label: `変動金利の毎月返済額（${num(risenRate, 2)}％に上昇後）`,
          value: yen(varPayment2),
          note: `毎月 ${yen(varPayment2 - varPayment1)} の増加`,
        },
      ];
    },
    note: "変動金利には5年ルール・125％ルールがある場合があります。上昇シナリオは仮定値です。",
  },

  /* 79 */
  "catalog-79": {
    title: "住宅ローン返済比率計算",
    lead: "年収に対する年間返済額の割合（返済比率）を計算し、審査基準と比較します。",
    fields: [
      moneyField("annual", "年収（額面）", "6000000"),
      moneyField("monthlyPayment", "住宅ローンの毎月返済額", "100000"),
      moneyField("bonusPayment", "ボーナス返済（年間合計）", "0"),
      moneyField(
        "otherLoan",
        "その他の借入の年間返済額",
        "0",
        "自動車ローン・カードローンなど",
      ),
    ],
    compute: (i) => {
      const annual = i.num("annual");
      const housing = i.num("monthlyPayment") * 12 + i.num("bonusPayment");
      const total = housing + i.num("otherLoan");
      const ratio = annual ? (total / annual) * 100 : 0;
      const housingRatio = annual ? (housing / annual) * 100 : 0;
      const limit = annual >= 4_000_000 ? 35 : 30;
      return [
        {
          label: "返済比率（総返済負担率）",
          value: pct(ratio, 1),
          primary: true,
        },
        { label: "住宅ローンのみの比率", value: pct(housingRatio, 1) },
        { label: "年間の返済額合計", value: yen(total) },
        {
          label: "審査基準の目安",
          value: `${limit}％以下`,
          note: `年収${annual >= 4_000_000 ? "400万円以上" : "400万円未満"}の一般的な基準`,
        },
        {
          label: "判定",
          value:
            ratio <= 25
              ? "余裕あり"
              : ratio <= limit
                ? "審査基準内"
                : "基準を超えています",
        },
        {
          label: "比率25％に抑える場合の年間返済額",
          value: yen(annual * 0.25),
        },
      ];
    },
    note: "手取りベースでは返済比率20〜25％以内が無理のない水準とされています。",
  },

  /* 80 */
  "catalog-80": {
    title: "持ち家・賃貸比較",
    lead: "一定期間に支払う総額を持ち家と賃貸で比較します。",
    fields: [
      countField("years", "比較する期間", "35", "年"),
      moneyField("price", "物件価格", "40000000"),
      moneyField("downPayment", "頭金", "8000000"),
      rateField("rate", "住宅ローン金利", "1.0"),
      moneyField(
        "maintenance",
        "管理費・修繕積立金・固定資産税（月）",
        "40000",
      ),
      moneyField("rent", "賃貸の家賃（管理費込み・月）", "130000"),
      rateField("renewalCost", "賃貸の更新料（2年ごと・家賃月数）", "1"),
    ],
    compute: (i) => {
      const years = i.int("years");
      const months = years * 12;
      const principal = i.num("price") - i.num("downPayment");
      const payment = annuityPayment(principal, i.num("rate"), months);
      const purchaseCosts = i.num("price") * 0.07;
      const ownTotal =
        payment * months +
        i.num("downPayment") +
        purchaseCosts +
        i.num("maintenance") * months;
      const remainingBalance =
        amortize(principal, i.num("rate"), months).yearEndBalances.at(-1) ?? 0;
      const resaleValue = i.num("price") * 0.4;
      const ownNetCost = ownTotal - resaleValue;
      const rent = i.num("rent");
      const renewals = Math.floor(years / 2) * rent * i.num("renewalCost");
      const rentTotal = rent * months + renewals + rent * 5;
      const diff = ownNetCost - rentTotal;
      return [
        {
          label: diff >= 0 ? "賃貸のほうが安い" : "持ち家のほうが安い",
          value: yen(Math.abs(diff)),
          primary: true,
          note: `${years}年間の支出から売却時の資産価値を差し引いた比較`,
        },
        { label: "持ち家の総支払額", value: yen(ownTotal) },
        { label: "　売却時のローン残高", value: `− ${yen(remainingBalance)}` },
        { label: "　ローン返済", value: yen(payment * months) },
        {
          label: "　頭金・購入諸費用",
          value: yen(i.num("downPayment") + purchaseCosts),
        },
        {
          label: "　維持費（管理費・税金）",
          value: yen(i.num("maintenance") * months),
        },
        { label: "賃貸の総支払額", value: yen(rentTotal) },
        { label: "　家賃", value: yen(rent * months) },
        { label: "　更新料・初期費用", value: yen(renewals + rent * 5) },
        {
          label: "売却時の資産価値（仮定）",
          value: yen(resaleValue),
          note: "築35年で購入価格の約4割と仮定（立地により大きく変動）",
        },
        { label: "持ち家の実質コスト", value: yen(ownNetCost) },
      ];
    },
    note: "持ち家には資産が残る一方、賃貸には住み替えの柔軟性があります。資産価値は立地条件で大きく変わります。",
  },

  /* 81 */
  "catalog-81": {
    title: "マンション管理費込み住宅費計算",
    lead: "ローン返済に管理費・修繕積立金・駐車場代・税金を加えた実質住宅費を計算します。",
    fields: [
      moneyField("loan", "住宅ローン返済額（月）", "100000"),
      moneyField("management", "管理費（月）", "12000"),
      moneyField("repair", "修繕積立金（月）", "10000"),
      moneyField("parking", "駐車場代（月）", "15000"),
      moneyField("propertyTax", "固定資産税・都市計画税（年額）", "120000"),
      moneyField("insurance", "火災保険・地震保険（年額）", "30000"),
    ],
    compute: (i) => {
      const monthly =
        i.num("loan") +
        i.num("management") +
        i.num("repair") +
        i.num("parking") +
        i.num("propertyTax") / 12 +
        i.num("insurance") / 12;
      const nonLoan = monthly - i.num("loan");
      return [
        { label: "実質的な住宅費（月）", value: yen(monthly), primary: true },
        { label: "年間の住宅費", value: yen(monthly * 12) },
        { label: "ローン返済", value: yen(i.num("loan")) },
        {
          label: "管理費・修繕積立金",
          value: yen(i.num("management") + i.num("repair")),
        },
        { label: "駐車場代", value: yen(i.num("parking")) },
        {
          label: "税金・保険（月割）",
          value: yen((i.num("propertyTax") + i.num("insurance")) / 12),
        },
        {
          label: "ローン以外の維持費",
          value: yen(nonLoan),
          note: `住宅費全体の${pct(monthly ? (nonLoan / monthly) * 100 : 0, 1)}`,
        },
        {
          label: "35年間の維持費合計",
          value: yen(nonLoan * 12 * 35),
          note: "修繕積立金は築年数とともに上昇するのが一般的です",
        },
      ];
    },
  },

  /* 82 */
  "catalog-82": {
    title: "固定資産税シミュレーター",
    lead: "土地・建物の評価額から固定資産税と都市計画税を計算します。",
    fields: [
      moneyField("landValue", "土地の固定資産税評価額", "15000000"),
      countField("landArea", "土地の面積", "120", "㎡"),
      moneyField("buildingValue", "建物の固定資産税評価額", "12000000"),
      selectField("newHouse", "新築住宅の減額特例", "yes", [
        { value: "yes", label: "適用あり（新築後3年以内）" },
        { value: "no", label: "適用なし" },
      ]),
      selectField("cityPlanning", "都市計画税", "yes", [
        { value: "yes", label: "課税区域（市街化区域）" },
        { value: "no", label: "課税されない" },
      ]),
    ],
    compute: (i) => {
      const area = i.num("landArea");
      const landValue = i.num("landValue");
      const smallArea = Math.min(area, 200);
      const generalArea = Math.max(0, area - 200);
      const perSqm = area ? landValue / area : 0;
      const landBase =
        perSqm * smallArea * PROPERTY_TAX.smallLandRatio +
        perSqm * generalArea * PROPERTY_TAX.generalLandRatio;
      const landCityBase =
        perSqm * smallArea * (1 / 3) + perSqm * generalArea * (2 / 3);
      const buildingValue = i.num("buildingValue");
      const buildingTax =
        buildingValue *
        PROPERTY_TAX.fixedRate *
        (i.raw("newHouse") === "yes" ? 0.5 : 1);
      const landTax = landBase * PROPERTY_TAX.fixedRate;
      const cityPlanning =
        i.raw("cityPlanning") === "yes"
          ? (landCityBase + buildingValue) * PROPERTY_TAX.cityPlanningRate
          : 0;
      const total = landTax + buildingTax + cityPlanning;
      return [
        { label: "年間の税額（合計）", value: yen(total), primary: true },
        { label: "月あたり", value: yen(total / 12) },
        {
          label: "固定資産税（土地）",
          value: yen(landTax),
          note: `課税標準 ${yen(landBase)}（住宅用地特例適用）`,
        },
        {
          label: "固定資産税（建物）",
          value: yen(buildingTax),
          note:
            i.raw("newHouse") === "yes"
              ? "新築住宅の2分の1減額を適用"
              : undefined,
        },
        { label: "都市計画税", value: yen(cityPlanning) },
        {
          label: "1期あたりの納付額（年4回）",
          value: yen(total / 4),
        },
      ];
    },
    note: "税率は標準税率（固定資産税1.4％・都市計画税0.3％）。自治体により異なる場合があります。",
  },

  /* 83 */
  "catalog-83": {
    title: "不動産取得費用計算",
    lead: "物件価格から購入時に必要な諸費用の合計を計算します。",
    fields: [
      moneyField("price", "物件価格", "40000000"),
      moneyField("landAssessed", "土地の固定資産税評価額", "15000000"),
      moneyField("buildingAssessed", "建物の固定資産税評価額", "12000000"),
      moneyField("loan", "借入額", "32000000"),
      selectField("kind", "物件の種別", "used", [
        { value: "new", label: "新築（仲介手数料なし）" },
        { value: "used", label: "中古（仲介手数料あり）" },
      ]),
    ],
    compute: (i) => {
      const price = i.num("price");
      const brokerage = i.raw("kind") === "used" ? brokerageFeeSale(price) : 0;
      const acquisitionTax =
        i.num("landAssessed") *
          ACQUISITION_TAX.landBaseRatio *
          ACQUISITION_TAX.rate +
        Math.max(0, i.num("buildingAssessed") - 12_000_000) *
          ACQUISITION_TAX.rate;
      const registration =
        i.num("landAssessed") * 0.015 + i.num("buildingAssessed") * 0.003;
      const judicialScrivener = 150_000;
      const stamp = price > 10_000_000 ? 10_000 : 5_000;
      const loanFee = i.num("loan") * 0.022;
      const loanStamp = 20_000;
      const insurance = 200_000;
      const total =
        brokerage +
        acquisitionTax +
        registration +
        judicialScrivener +
        stamp +
        loanFee +
        loanStamp +
        insurance;
      return [
        { label: "諸費用の合計", value: yen(total), primary: true },
        {
          label: "物件価格に対する割合",
          value: pct(price ? (total / price) * 100 : 0, 1),
        },
        ...(brokerage > 0
          ? [{ label: "仲介手数料（税込）", value: yen(brokerage) }]
          : []),
        {
          label: "不動産取得税",
          value: yen(acquisitionTax),
          note: "住宅用土地1/2特例・建物1,200万円控除を適用",
        },
        { label: "登録免許税", value: yen(registration) },
        { label: "司法書士報酬", value: yen(judicialScrivener) },
        {
          label: "印紙税（売買契約・金銭消費貸借）",
          value: yen(stamp + loanStamp),
        },
        { label: "ローン事務手数料（2.2％）", value: yen(loanFee) },
        { label: "火災保険・地震保険", value: yen(insurance) },
        { label: "物件価格＋諸費用", value: yen(price + total) },
      ];
    },
    note: "登録免許税の軽減税率・不動産取得税の特例は住宅の要件を満たす場合に適用されます。",
  },

  /* 84 */
  "catalog-84": {
    title: "仲介手数料計算",
    lead: "売買・賃貸それぞれの仲介手数料の上限額を計算します。",
    fields: [
      selectField("kind", "取引の種類", "sale", [
        { value: "sale", label: "売買" },
        { value: "rent", label: "賃貸" },
      ]),
      moneyField("price", "売買価格", "40000000"),
      moneyField("rent", "家賃（月）", "80000"),
      rateField("tax", "消費税率", "10"),
    ],
    compute: (i) => {
      const tax = i.num("tax");
      if (i.raw("kind") === "rent") {
        const rent = i.num("rent");
        const max = rent * (1 + tax / 100);
        return [
          { label: "仲介手数料の上限", value: yen(max), primary: true },
          { label: "家賃1ヶ月分（税抜）", value: yen(rent) },
          { label: "消費税", value: yen(max - rent) },
          {
            label: "半月分の場合（税込）",
            value: yen((rent / 2) * (1 + tax / 100)),
            note: "承諾がない限り、貸主・借主それぞれ0.55ヶ月分が原則",
          },
        ];
      }
      const price = i.num("price");
      const base =
        price > 4_000_000
          ? price * 0.03 + 60_000
          : price > 2_000_000
            ? price * 0.04 + 20_000
            : price * 0.05;
      const total = base * (1 + tax / 100);
      const formula =
        price > 4_000_000
          ? "売買価格×3％＋6万円"
          : price > 2_000_000
            ? "売買価格×4％＋2万円"
            : "売買価格×5％";
      return [
        { label: "仲介手数料の上限（税込）", value: yen(total), primary: true },
        { label: "本体価格", value: yen(base) },
        { label: "消費税", value: yen(total - base) },
        { label: "適用される速算式", value: formula },
        {
          label: "売買価格に対する割合",
          value: pct(price ? (total / price) * 100 : 0, 2),
        },
      ];
    },
    note: "800万円以下の物件は特例で最大33万円（税込）まで請求できます。表示額は法律上の上限です。",
  },

  /* 85 */
  "catalog-85": {
    title: "火災保険料比較",
    lead: "複数プランの保険料を長期契約も含めて比較します。",
    fields: [
      moneyField("planA", "プランA：年間保険料", "18000"),
      moneyField("planAQuake", "プランA：地震保険（年間）", "12000"),
      moneyField("planB", "プランB：年間保険料", "26000"),
      moneyField("planBQuake", "プランB：地震保険（年間）", "12000"),
      countField("years", "契約期間", "5", "年"),
      rateField("longDiscount", "長期一括払いの割引率", "9"),
    ],
    compute: (i) => {
      const years = Math.max(1, i.int("years"));
      const discount = 1 - i.num("longDiscount") / 100;
      const aFire = i.num("planA") * years * discount;
      const bFire = i.num("planB") * years * discount;
      // 地震保険は最長5年
      const quakeYears = Math.min(years, 5);
      const aTotal = aFire + i.num("planAQuake") * quakeYears;
      const bTotal = bFire + i.num("planBQuake") * quakeYears;
      const diff = bTotal - aTotal;
      return [
        {
          label: diff >= 0 ? "プランAのほうが安い" : "プランBのほうが安い",
          value: yen(Math.abs(diff)),
          primary: true,
          note: `${years}年間の総額の差`,
        },
        { label: "プランA 総額", value: yen(aTotal) },
        { label: "　火災保険（長期割引適用）", value: yen(aFire) },
        { label: "　地震保険", value: yen(i.num("planAQuake") * quakeYears) },
        { label: "プランB 総額", value: yen(bTotal) },
        { label: "　火災保険（長期割引適用）", value: yen(bFire) },
        { label: "　地震保険", value: yen(i.num("planBQuake") * quakeYears) },
        {
          label: "年あたりの差額",
          value: yen(Math.abs(diff) / years),
        },
      ];
    },
    note: "火災保険は最長5年契約。地震保険料は都道府県・構造で決まり、保険会社による差はありません。",
  },
};
