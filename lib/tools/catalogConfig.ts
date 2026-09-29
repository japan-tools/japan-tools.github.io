export const catalogModeRules: [string[], string][] = [
  [["割り勘"], "split"],
  [["単価"], "unit"],
  [["税込", "消費税"], "tax"],
  [["割引率", "還元率", "利回り", "返済比率"], "rate"],
  [["複利", "積立"], "compound"],
  [["ローン", "分割払い", "借入"], "loan"],
  [["燃費"], "efficiency"],
  [["ガソリン代", "EV充電費"], "fuel"],
  [["交通費", "定期券", "切符"], "transport"],
  [["購入総費用", "年間走行コスト"], "total"],
  [["価格比較"], "price"],
  [["比較"], "compare"],
  [["割引"], "discount"],
  [["ポイント", "還元"], "reward"],
  [["貯金", "目標"], "saving"],
  [["家計", "生活費", "世帯"], "household"],
  [["電気", "ガス", "水道", "消費電力量"], "utility"],
];

export const catalogFieldLabels: Record<string, string[]> = {
  split: ["合計金額", "人数", "予備"],
  unit: ["合計金額", "数量", "予備"],
  tax: ["税抜金額", "税率（%）", "予備"],
  rate: ["基準額", "対象額", "予備"],
  compound: ["元本・毎月積立額", "年利（%）", "運用月数"],
  loan: ["借入額", "年利（%）", "返済回数（月）"],
  efficiency: ["走行距離（km）", "使用燃料（L）", "予備"],
  fuel: ["走行距離・使用量", "燃費・使用量", "単価"],
  transport: ["片道運賃", "利用日数・回数", "往復係数"],
  total: ["本体・走行費", "税金・保険", "その他費用"],
  compare: ["プランA・持ち家", "プランB・賃貸", "期間"],
  discount: ["通常価格", "割引率（%）", "予備"],
  price: ["価格", "数量", "予備"],
  reward: ["利用金額", "還元率（%）", "予備"],
  saving: ["目標金額", "期間（月）", "予備"],
  household: ["収入・住居費", "食費・生活費", "その他"],
  utility: ["使用量", "単価", "使用時間・月数"],
  date: ["基準値", "加算日数", "調整値"],
};

export function getCatalogMode(name: string, category?: string) {
  return (
    catalogModeRules.find(([keywords]) =>
      keywords.some((keyword) => name.includes(keyword)),
    )?.[1] ?? (category === "date" ? "date" : "estimate")
  );
}

export function getCatalogFieldLabels(mode: string, category?: string) {
  return (
    catalogFieldLabels[mode] ??
    (category === "work"
      ? ["基準金額", "控除率（%）", "加算額"]
      : ["基準値", "数量・期間", "固定額"])
  );
}
