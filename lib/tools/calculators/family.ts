import {
  CHILDBIRTH_LUMP_SUM,
  childAllowanceMonthly,
  employmentIncome,
} from "./data";
import {
  addDays,
  addMonths,
  ageAt,
  calendarDiff,
  diffDays,
  formatDate,
  gradeLabel,
  schoolGrade,
  toIso,
} from "./dateUtils";
import { salaryBreakdown } from "./salary";
import {
  countField,
  dateField,
  days as fmtDays,
  decimalField,
  moneyField,
  num,
  pct,
  rateField,
  selectField,
  yen,
  type CalculatorSpec,
} from "./types";

const todayIso = () => toIso(new Date());
const needDate = [
  { label: "日付を選択してください", value: "—", primary: true },
];

export const familyCalculators: Record<string, CalculatorSpec> = {
  /* 126 */
  "catalog-126": {
    title: "出産予定日計算",
    lead: "最終月経開始日から出産予定日と妊娠の各節目を計算します。",
    fields: [
      dateField("lastPeriod", "最終月経の開始日", todayIso()),
      countField("cycle", "月経周期", "28", "日"),
    ],
    compute: (i) => {
      const last = i.date("lastPeriod");
      if (!last) return needDate;
      const adjust = i.int("cycle") - 28;
      const due = addDays(last, 280 + adjust);
      const base = new Date();
      const elapsed = diffDays(last, base);
      const weeks = Math.floor(elapsed / 7);
      return [
        { label: "出産予定日", value: formatDate(due), primary: true },
        {
          label: "現在の妊娠週数",
          value: elapsed >= 0 ? `妊娠${weeks}週${elapsed % 7}日` : "—",
          note: elapsed >= 0 ? `あと${diffDays(base, due)}日` : undefined,
        },
        { label: "妊娠2ヶ月（4週0日）", value: formatDate(addDays(last, 28)) },
        {
          label: "安定期の入り（妊娠16週）",
          value: formatDate(addDays(last, 112)),
        },
        {
          label: "産前休業の開始日（予定日6週前）",
          value: formatDate(addDays(due, -42)),
        },
        {
          label: "正期産の開始（37週0日）",
          value: formatDate(addDays(last, 259)),
        },
        {
          label: "産後休業の終了日（産後8週）",
          value: formatDate(addDays(due, 56)),
        },
      ];
    },
    note: "ネーゲレ概算法による計算です。実際の予定日は超音波検査をもとに医師が判断します。",
  },

  /* 127 */
  "catalog-127": {
    title: "妊娠週数計算",
    lead: "出産予定日または最終月経日から現在の妊娠週数・月数を計算します。",
    fields: [
      selectField("basis", "計算の基準", "due", [
        { value: "due", label: "出産予定日から" },
        { value: "period", label: "最終月経開始日から" },
      ]),
      dateField("due", "出産予定日", toIso(addDays(new Date(), 180))),
      dateField(
        "lastPeriod",
        "最終月経の開始日",
        toIso(addDays(new Date(), -100)),
      ),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const start =
        i.raw("basis") === "due"
          ? (() => {
              const due = i.date("due");
              return due ? addDays(due, -280) : null;
            })()
          : i.date("lastPeriod");
      if (!start) return needDate;
      const due = addDays(start, 280);
      const elapsed = diffDays(start, base);
      const weeks = Math.floor(elapsed / 7);
      const months = Math.floor(weeks / 4) + 1;
      const trimester =
        weeks < 16 ? "妊娠初期" : weeks < 28 ? "妊娠中期" : "妊娠後期";
      return [
        {
          label: "妊娠週数",
          value: elapsed >= 0 ? `妊娠${weeks}週${elapsed % 7}日` : "妊娠前です",
          primary: true,
          note: elapsed >= 0 ? `妊娠${months}ヶ月・${trimester}` : undefined,
        },
        { label: "出産予定日", value: formatDate(due) },
        {
          label: "予定日まで",
          value: fmtDays(Math.max(0, diffDays(base, due))),
        },
        { label: "妊娠経過日数", value: fmtDays(Math.max(0, elapsed)) },
        {
          label: "正期産の期間（37〜41週）",
          value: `${formatDate(addDays(start, 259))} 〜 ${formatDate(addDays(start, 293))}`,
        },
        {
          label: "産前休業の開始日",
          value: formatDate(addDays(due, -42)),
          note: "多胎妊娠は98日前から取得できます",
        },
        {
          label: "母子健康手帳の交付",
          value: "妊娠6〜10週ごろに自治体の窓口で受け取ります",
        },
      ];
    },
  },

  /* 128 */
  "catalog-128": {
    title: "産休開始日計算",
    lead: "出産予定日から産前・産後休業の期間を計算します。",
    fields: [
      dateField("due", "出産予定日", toIso(addDays(new Date(), 120))),
      selectField("multiple", "妊娠の種別", "single", [
        { value: "single", label: "単胎妊娠（産前6週間）" },
        { value: "multiple", label: "多胎妊娠（産前14週間）" },
      ]),
      dateField(
        "actual",
        "実際の出産日（確定後に入力）",
        toIso(addDays(new Date(), 120)),
      ),
    ],
    compute: (i) => {
      const due = i.date("due");
      const actual = i.date("actual");
      if (!due || !actual) return needDate;
      const beforeDays = i.raw("multiple") === "multiple" ? 98 : 42;
      const start = addDays(due, -beforeDays);
      const afterEnd = addDays(actual, 56);
      const canWorkFrom = addDays(actual, 42);
      const total = diffDays(start, afterEnd);
      return [
        { label: "産前休業の開始日", value: formatDate(start), primary: true },
        {
          label: "産前休業の期間",
          value: `${formatDate(start)} 〜 ${formatDate(addDays(actual, -1))}`,
          note: `予定日の${beforeDays}日前から（請求により取得）`,
        },
        {
          label: "産後休業の終了日",
          value: formatDate(afterEnd),
          note: "出産日の翌日から8週間（強制休業）",
        },
        {
          label: "本人の請求で就業できる日",
          value: formatDate(canWorkFrom),
          note: "産後6週間経過後、医師が認めた場合",
        },
        { label: "産休の合計日数", value: fmtDays(total) },
        {
          label: "育児休業の開始日",
          value: formatDate(addDays(afterEnd, 1)),
        },
        {
          label: "子が1歳になる日",
          value: formatDate(addMonths(actual, 12)),
        },
      ];
    },
    note: "出産が予定日より遅れた場合、その日数も産前休業として扱われます。産後8週間は原則として就業できません。",
  },

  /* 129 */
  "catalog-129": {
    title: "育休開始・終了日計算",
    lead: "出産日から育児休業の開始日・終了日と延長可能な期限を計算します。",
    fields: [
      dateField("birth", "出産日", toIso(addDays(new Date(), -30))),
      selectField("parent", "取得する人", "mother", [
        { value: "mother", label: "母（産後休業のあと）" },
        { value: "father", label: "父（出産日から取得可能）" },
      ]),
      selectField("extend", "延長の予定", "none", [
        { value: "none", label: "1歳まで" },
        { value: "half", label: "1歳6ヶ月まで延長" },
        { value: "two", label: "2歳まで延長" },
      ]),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      if (!birth) return needDate;
      const mother = i.raw("parent") === "mother";
      const postpartumEnd = addDays(birth, 56);
      const start = mother ? addDays(postpartumEnd, 1) : birth;
      const oneYear = addDays(addMonths(birth, 12), -1);
      const extend = i.raw("extend");
      const end =
        extend === "two"
          ? addDays(addMonths(birth, 24), -1)
          : extend === "half"
            ? addDays(addMonths(birth, 18), -1)
            : oneYear;
      const months = calendarDiff(start, end).totalMonths;
      return [
        { label: "育児休業の開始日", value: formatDate(start), primary: true },
        { label: "育児休業の終了日", value: formatDate(end) },
        {
          label: "休業期間",
          value: `${months}ヶ月（${fmtDays(diffDays(start, end) + 1)}）`,
        },
        ...(mother
          ? [{ label: "産後休業の終了日", value: formatDate(postpartumEnd) }]
          : [
              {
                label: "出生時育児休業（産後パパ育休）",
                value: `${formatDate(birth)} 〜 ${formatDate(addDays(birth, 56))}`,
                note: "出生後8週以内に最大4週間・2回まで分割取得",
              },
            ]),
        { label: "子が1歳になる日の前日", value: formatDate(oneYear) },
        {
          label: "1歳6ヶ月までの延長期限",
          value: formatDate(addDays(addMonths(birth, 18), -1)),
          note: "保育所に入所できない場合などに延長できます",
        },
        {
          label: "2歳までの延長期限",
          value: formatDate(addDays(addMonths(birth, 24), -1)),
        },
      ];
    },
    note: "育児休業は原則2回まで分割して取得できます。申出は原則1ヶ月前までに行う必要があります。",
  },

  /* 130 */
  "catalog-130": {
    title: "児童手当シミュレーター",
    lead: "子どもの年齢と人数から児童手当の支給額を計算します（2024年10月拡充後）。",
    fields: [
      countField("under3", "0〜2歳の子ども", "1", "人"),
      countField("toHighSchool", "3歳〜高校生年代の子ども", "1", "人"),
      countField(
        "counted",
        "第3子カウント対象の子ども（22歳年度末まで）",
        "2",
        "人",
        "第3子以降の判定に使う、養育している子の総数",
      ),
    ],
    compute: (i) => {
      const under3 = i.int("under3");
      const older = i.int("toHighSchool");
      const totalChildren = under3 + older;
      const counted = Math.max(totalChildren, i.int("counted"));
      let monthly = 0;
      let order = counted - totalChildren;
      const details: string[] = [];
      // 年齢が高い順に第1子から数えるため、年長の子から割り当てる
      for (let n = 0; n < older; n += 1) {
        order += 1;
        const amount = childAllowanceMonthly("toHighSchool", order);
        monthly += amount;
        details.push(`第${order}子 ${yen(amount)}`);
      }
      for (let n = 0; n < under3; n += 1) {
        order += 1;
        const amount = childAllowanceMonthly("under3", order);
        monthly += amount;
        details.push(`第${order}子 ${yen(amount)}`);
      }
      return [
        { label: "児童手当（月額）", value: yen(monthly), primary: true },
        { label: "年間の支給額", value: yen(monthly * 12) },
        {
          label: "内訳",
          value: `${totalChildren}人`,
          note: details.join("／"),
        },
        { label: "0〜2歳（第1・2子）", value: `${yen(15_000)} / 月` },
        { label: "3歳〜高校生年代（第1・2子）", value: `${yen(10_000)} / 月` },
        { label: "第3子以降（年齢問わず）", value: `${yen(30_000)} / 月` },
        {
          label: "支給月",
          value: "偶数月（年6回・2ヶ月分ずつ）",
          note: `1回の振込額 ${yen(monthly * 2)}`,
        },
      ];
    },
    note: "2024年10月から所得制限が撤廃され、高校生年代まで支給対象になりました。第3子の数え方は22歳年度末までの子を含みます。",
  },

  /* 131 */
  "catalog-131": {
    title: "育児休業期間計算",
    lead: "育児休業の期間と、その間に受け取れる給付金の総額を計算します。",
    fields: [
      dateField("start", "育休の開始日", todayIso()),
      dateField("end", "育休の終了日", toIso(addMonths(new Date(), 12))),
      moneyField("monthly", "休業開始前6ヶ月の平均月給", "300000"),
    ],
    compute: (i) => {
      const start = i.date("start");
      const end = i.date("end");
      if (!start || !end) return needDate;
      const totalDays = Math.max(0, diffDays(start, end) + 1);
      const d = calendarDiff(start, end);
      const dailyWage = Math.min(i.num("monthly") / 30, 15_690);
      const firstDays = Math.min(totalDays, 180);
      const laterDays = Math.max(0, totalDays - 180);
      const benefit = dailyWage * (firstDays * 0.67 + laterDays * 0.5);
      return [
        {
          label: "育児休業の期間",
          value: `${d.years ? `${d.years}年` : ""}${d.months}ヶ月${d.days}日`,
          primary: true,
          note: fmtDays(totalDays),
        },
        { label: "育児休業給付金の総額", value: yen(benefit) },
        {
          label: "支給額（最初の180日）",
          value: `${yen(dailyWage * 0.67 * 30)} / 月`,
        },
        ...(laterDays > 0
          ? [
              {
                label: "支給額（181日以降）",
                value: `${yen(dailyWage * 0.5 * 30)} / 月`,
              },
            ]
          : []),
        {
          label: "社会保険料の免除額",
          value: yen((i.num("monthly") * 0.145 * totalDays) / 30),
          note: "健康保険・厚生年金の本人負担が免除されます",
        },
        {
          label: "実質的な手取り率",
          value: pct(80, 0),
          note: "給付金は非課税・社会保険料も免除のため",
        },
      ];
    },
  },

  /* 132 */
  "catalog-132": {
    title: "保育料シミュレーター",
    lead: "住民税所得割額と子どもの年齢から認可保育園の保育料を試算します。",
    fields: [
      moneyField("residentTax", "世帯の市町村民税所得割額（年額）", "200000"),
      selectField("age", "子どもの年齢", "under3", [
        { value: "under3", label: "0〜2歳児クラス" },
        { value: "over3", label: "3歳以上児クラス" },
      ]),
      countField("children", "同時入所している子どもの数", "1", "人"),
      selectField("hours", "保育時間", "standard", [
        { value: "standard", label: "保育標準時間（11時間）" },
        { value: "short", label: "保育短時間（8時間）" },
      ]),
      moneyField("meal", "副食費など実費（月）", "4500"),
    ],
    compute: (i) => {
      if (i.raw("age") === "over3") {
        return [
          {
            label: "保育料（月額）",
            value: yen(0),
            primary: true,
            note: "3〜5歳児は幼児教育・保育の無償化により無料",
          },
          {
            label: "実費負担（給食費など）",
            value: yen(i.num("meal")),
            note: "第3子以降や年収360万円未満相当世帯は免除される場合があります",
          },
          { label: "年間の負担額", value: yen(i.num("meal") * 12) },
        ];
      }
      const tax = i.num("residentTax");
      // 標準的な自治体の階層区分（0〜2歳児・保育標準時間）
      const tiers: [limit: number, amount: number, label: string][] = [
        [1, 0, "生活保護・非課税世帯"],
        [48_600, 9_000, "市町村民税所得割 48,600円未満"],
        [97_000, 19_500, "48,600円以上97,000円未満"],
        [169_000, 30_000, "97,000円以上169,000円未満"],
        [301_000, 41_500, "169,000円以上301,000円未満"],
        [397_000, 51_000, "301,000円以上397,000円未満"],
        [Infinity, 60_000, "397,000円以上"],
      ];
      const tier =
        tiers.find(([limit]) => tax < limit) ?? tiers[tiers.length - 1];
      let fee = tier[1];
      if (i.raw("hours") === "short") fee *= 0.98;
      const children = Math.max(1, i.int("children"));
      // 第2子半額・第3子以降無償
      const second = children >= 2 ? fee * 0.5 : 0;
      const third = children >= 3 ? 0 : 0;
      const total = fee + second + third + i.num("meal") * children;
      return [
        { label: "保育料の合計（月額）", value: yen(total), primary: true },
        { label: "第1子の保育料", value: yen(fee), note: tier[2] },
        ...(children >= 2
          ? [{ label: "第2子の保育料（半額）", value: yen(second) }]
          : []),
        ...(children >= 3
          ? [{ label: "第3子以降の保育料", value: yen(0), note: "無償" }]
          : []),
        { label: "実費（給食費など）", value: yen(i.num("meal") * children) },
        { label: "年間の負担額", value: yen(total * 12) },
        {
          label: "3歳児クラスになったら",
          value: yen(i.num("meal") * children),
          note: "保育料は無償化され実費のみになります",
        },
      ];
    },
    note: "保育料は自治体ごとに階層区分と金額が異なります。必ずお住まいの自治体の基準額表でご確認ください。",
  },

  /* 133 */
  "catalog-133": {
    title: "子育て費用月額計算",
    lead: "年齢に応じた子育て費用の月額と、児童手当を差し引いた実質負担を計算します。",
    fields: [
      selectField("stage", "子どもの年齢", "infant", [
        { value: "baby", label: "0〜2歳（乳児）" },
        { value: "infant", label: "3〜5歳（未就学）" },
        { value: "elementary", label: "小学生" },
        { value: "junior", label: "中学生" },
        { value: "high", label: "高校生" },
      ]),
      moneyField("food", "食費", "20000"),
      moneyField("clothing", "衣類・生活用品", "8000"),
      moneyField("education", "保育料・学費・教材費", "15000"),
      moneyField("lesson", "習い事・塾", "10000"),
      moneyField("medical", "医療費・その他", "3000"),
      countField("allowanceOrder", "何番目の子か", "1", "番目"),
    ],
    compute: (i) => {
      const total =
        i.num("food") +
        i.num("clothing") +
        i.num("education") +
        i.num("lesson") +
        i.num("medical");
      const stage = i.raw("stage");
      const allowance = childAllowanceMonthly(
        stage === "baby" ? "under3" : "toHighSchool",
        i.int("allowanceOrder"),
      );
      const net = total - allowance;
      const references: Record<string, number> = {
        baby: 65_000,
        infant: 60_000,
        elementary: 65_000,
        junior: 90_000,
        high: 100_000,
      };
      return [
        { label: "子育て費用（月額）", value: yen(total), primary: true },
        { label: "年間の費用", value: yen(total * 12) },
        { label: "児童手当", value: `− ${yen(allowance)}` },
        { label: "実質的な負担額（月）", value: yen(Math.max(0, net)) },
        { label: "実質的な負担額（年）", value: yen(Math.max(0, net) * 12) },
        {
          label: "一般的な水準との比較",
          value: `${yen(references[stage] ?? 60_000)} / 月`,
          note:
            total > (references[stage] ?? 60_000)
              ? "平均よりやや高めです"
              : "平均的な水準です",
        },
      ];
    },
  },

  /* 134 */
  "catalog-134": {
    title: "子どもの年齢計算",
    lead: "生年月日から満年齢・月齢・学年・予防接種の目安を確認します。",
    fields: [
      dateField("birth", "生年月日", toIso(addMonths(new Date(), -18))),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      const base = i.date("base");
      if (!birth || !base) return needDate;
      const d = calendarDiff(birth, base);
      const totalDays = diffDays(birth, base);
      const { grade } = schoolGrade(birth, base);
      const nextBirthday = new Date(
        base.getFullYear(),
        birth.getMonth(),
        birth.getDate(),
      );
      if (nextBirthday < base) nextBirthday.setFullYear(base.getFullYear() + 1);
      return [
        {
          label: "満年齢",
          value:
            d.years >= 1
              ? `${d.years}歳${d.months}ヶ月`
              : `${d.totalMonths}ヶ月`,
          primary: true,
        },
        { label: "月齢", value: `${d.totalMonths}ヶ月${d.days}日` },
        { label: "生まれてからの日数", value: fmtDays(totalDays) },
        { label: "学年", value: gradeLabel(grade) },
        {
          label: "生後100日（お食い初め）",
          value: formatDate(addDays(birth, 100)),
        },
        { label: "1歳の誕生日", value: formatDate(addMonths(birth, 12)) },
        {
          label: "次の誕生日",
          value: formatDate(nextBirthday),
          note: `あと${diffDays(base, nextBirthday)}日`,
        },
      ];
    },
  },

  /* 135 */
  "catalog-135": {
    title: "兄弟姉妹年齢差計算",
    lead: "2人の生年月日から年齢差と、同時に在学する期間を確認します。",
    fields: [
      dateField("first", "上の子の生年月日", "2018-05-10"),
      dateField("second", "下の子の生年月日", "2021-09-20"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const first = i.date("first");
      const second = i.date("second");
      const base = i.date("base");
      if (!first || !second || !base) return needDate;
      const [older, younger] =
        first <= second ? [first, second] : [second, first];
      const gap = calendarDiff(older, younger);
      const olderGrade = schoolGrade(older, base);
      const youngerGrade = schoolGrade(younger, base);
      const gradeGap = olderGrade.grade - youngerGrade.grade;
      return [
        {
          label: "年齢差",
          value: `${gap.years}歳${gap.months}ヶ月`,
          primary: true,
          note: fmtDays(diffDays(older, younger)),
        },
        { label: "学年差", value: `${gradeGap}学年` },
        {
          label: "上の子",
          value: `${ageAt(older, base)}歳（${gradeLabel(olderGrade.grade)}）`,
        },
        {
          label: "下の子",
          value: `${ageAt(younger, base)}歳（${gradeLabel(youngerGrade.grade)}）`,
        },
        {
          label: "同じ小学校に通う期間",
          value: gradeGap < 6 ? `${6 - gradeGap}年間` : "重なりません",
        },
        {
          label: "保育料の多子軽減",
          value:
            gradeGap <= 5
              ? "下の子が半額または無償の対象になり得ます"
              : "同時入所でないため対象外の可能性があります",
          note: "自治体により年齢要件が異なります",
        },
      ];
    },
  },

  /* 136 */
  "catalog-136": {
    title: "入園・入学年度計算",
    lead: "生年月日から保育園・幼稚園・小学校などの入園・入学年月を一覧します。",
    fields: [dateField("birth", "生年月日", toIso(addMonths(new Date(), -12)))],
    compute: (i) => {
      const birth = i.date("birth");
      if (!birth) return needDate;
      const { cohortYear } = schoolGrade(birth, birth);
      const row = (label: string, offset: number, month = 4) => ({
        label,
        value: `${cohortYear + offset}年${month}月`,
      });
      return [
        {
          label: "小学校の入学",
          value: `${cohortYear + 6}年4月`,
          primary: true,
          note: `${cohortYear}年4月2日〜${cohortYear + 1}年4月1日生まれが同学年`,
        },
        row("保育園0歳児クラス", 0),
        row("保育園1歳児クラス", 1),
        row("幼稚園・保育園 年少（3歳児）", 3),
        row("年中（4歳児）", 4),
        row("年長（5歳児）", 5),
        row("中学校の入学", 12),
        row("高校の入学", 15),
        row("大学の入学（現役）", 18),
      ];
    },
    note: "0歳児クラスは生後57日以降などの条件があり、実際の入園可能時期は施設によって異なります。",
  },

  /* 137 */
  "catalog-137": {
    title: "出産関連費用計算",
    lead: "妊婦健診から出産・退院までにかかる費用と、受け取れる給付を差し引いた自己負担を計算します。",
    fields: [
      moneyField("delivery", "分娩・入院費", "550000"),
      moneyField("checkup", "妊婦健診の自己負担（総額）", "50000"),
      moneyField("maternityGoods", "マタニティ用品・出産準備品", "100000"),
      moneyField(
        "babyGoods",
        "ベビー用品（ベビーカー・チャイルドシートなど）",
        "150000",
      ),
      moneyField("other", "内祝い・里帰り費用など", "80000"),
      selectField("lumpSum", "出産育児一時金", "yes", [
        { value: "yes", label: "受け取る（50万円）" },
        { value: "no", label: "受け取らない" },
      ]),
      moneyField("maternityAllowance", "出産手当金（受け取る場合）", "0"),
    ],
    compute: (i) => {
      const cost =
        i.num("delivery") +
        i.num("checkup") +
        i.num("maternityGoods") +
        i.num("babyGoods") +
        i.num("other");
      const lumpSum = i.raw("lumpSum") === "yes" ? CHILDBIRTH_LUMP_SUM : 0;
      const benefits = lumpSum + i.num("maternityAllowance");
      const net = cost - benefits;
      return [
        {
          label: net >= 0 ? "自己負担の合計" : "給付が上回る額",
          value: yen(Math.abs(net)),
          primary: true,
        },
        { label: "費用の合計", value: yen(cost) },
        { label: "　分娩・入院費", value: yen(i.num("delivery")) },
        { label: "　妊婦健診の自己負担", value: yen(i.num("checkup")) },
        {
          label: "　マタニティ・ベビー用品",
          value: yen(i.num("maternityGoods") + i.num("babyGoods")),
        },
        { label: "　その他", value: yen(i.num("other")) },
        { label: "受け取れる給付", value: yen(benefits) },
        { label: "　出産育児一時金", value: yen(lumpSum) },
        ...(i.num("maternityAllowance") > 0
          ? [{ label: "　出産手当金", value: yen(i.num("maternityAllowance")) }]
          : []),
        {
          label: "医療費控除の対象",
          value: yen(
            Math.max(0, i.num("delivery") + i.num("checkup") - lumpSum),
          ),
          note: "確定申告で所得控除を受けられます",
        },
      ];
    },
    note: "妊婦健診は自治体の補助券で大部分がカバーされます。帝王切開など保険適用の分娩は高額療養費の対象です。",
  },

  /* 138 */
  "catalog-138": {
    title: "育児用品予算計算",
    lead: "出産準備品の予算を、新品・レンタル・お下がりで比較します。",
    fields: [
      moneyField("stroller", "ベビーカー", "50000"),
      moneyField("carSeat", "チャイルドシート", "40000"),
      moneyField("crib", "ベビーベッド", "30000"),
      moneyField("clothes", "ベビー服・肌着", "30000"),
      moneyField("nursing", "授乳・調乳用品", "20000"),
      moneyField("bath", "沐浴・衛生用品", "15000"),
      moneyField("diaper", "おむつ・おしりふき（月）", "6000"),
      moneyField("milk", "ミルク（月）", "8000"),
      rateField("usedDiscount", "レンタル・お下がりでの削減率", "40"),
    ],
    compute: (i) => {
      const durable = i.num("stroller") + i.num("carSeat") + i.num("crib");
      const consumableInitial =
        i.num("clothes") + i.num("nursing") + i.num("bath");
      const initial = durable + consumableInitial;
      const monthly = i.num("diaper") + i.num("milk");
      const discounted = durable * (1 - i.num("usedDiscount") / 100);
      return [
        { label: "出産準備の初期費用", value: yen(initial), primary: true },
        {
          label: "　大型用品（ベビーカー・チャイルドシートなど）",
          value: yen(durable),
        },
        { label: "　衣類・消耗品の初期購入", value: yen(consumableInitial) },
        { label: "毎月かかる費用", value: yen(monthly) },
        { label: "1年目の合計", value: yen(initial + monthly * 12) },
        {
          label: "レンタル・お下がりを使った場合",
          value: yen(discounted + consumableInitial),
          note: `${yen(durable - discounted)} の節約`,
        },
        {
          label: "2年目以降（おむつ・ミルク）",
          value: `${yen(monthly * 12)} / 年`,
        },
      ];
    },
  },

  /* 139 */
  "catalog-139": {
    title: "家族生活費計算",
    lead: "世帯の収入と支出項目から家計の収支バランスを計算します。",
    fields: [
      moneyField("income", "世帯の手取り月収", "450000"),
      moneyField("housing", "住居費（家賃・ローン）", "120000"),
      moneyField("food", "食費", "80000"),
      moneyField("utility", "水道光熱費", "25000"),
      moneyField("communication", "通信費", "20000"),
      moneyField("insurance", "保険料", "25000"),
      moneyField("education", "教育費・保育料", "40000"),
      moneyField("transport", "交通費・車関連", "30000"),
      moneyField("other", "日用品・娯楽・交際費など", "60000"),
    ],
    compute: (i) => {
      const keys = [
        "housing",
        "food",
        "utility",
        "communication",
        "insurance",
        "education",
        "transport",
        "other",
      ] as const;
      const expense = keys.reduce((sum, key) => sum + i.num(key), 0);
      const income = i.num("income");
      const balance = income - expense;
      const share = (value: number) =>
        income ? `${num((value / income) * 100, 1)}%` : "—";
      return [
        {
          label: balance >= 0 ? "毎月の黒字額" : "毎月の赤字額",
          value: yen(Math.abs(balance)),
          primary: true,
          note: `貯蓄率 ${income ? num((balance / income) * 100, 1) : 0}%`,
        },
        { label: "支出の合計", value: yen(expense) },
        {
          label: "住居費",
          value: `${yen(i.num("housing"))}（${share(i.num("housing"))}）`,
        },
        {
          label: "食費",
          value: `${yen(i.num("food"))}（${share(i.num("food"))}）`,
        },
        {
          label: "水道光熱費",
          value: `${yen(i.num("utility"))}（${share(i.num("utility"))}）`,
        },
        {
          label: "通信費",
          value: `${yen(i.num("communication"))}（${share(i.num("communication"))}）`,
        },
        {
          label: "保険料",
          value: `${yen(i.num("insurance"))}（${share(i.num("insurance"))}）`,
        },
        {
          label: "教育費",
          value: `${yen(i.num("education"))}（${share(i.num("education"))}）`,
        },
        {
          label: "交通費・車",
          value: `${yen(i.num("transport"))}（${share(i.num("transport"))}）`,
        },
        {
          label: "その他",
          value: `${yen(i.num("other"))}（${share(i.num("other"))}）`,
        },
        { label: "年間の収支", value: yen(balance * 12) },
      ];
    },
    note: "住居費は手取りの25〜30％以内、貯蓄率は手取りの15〜20％が一つの目安です。",
  },

  /* 140 */
  "catalog-140": {
    title: "扶養人数チェック",
    lead: "家族が税法上・社会保険上の扶養に入れるかを判定します。",
    fields: [
      selectField("relation", "続柄", "spouse", [
        { value: "spouse", label: "配偶者" },
        { value: "child", label: "子" },
        { value: "parent", label: "父母・祖父母" },
        { value: "other", label: "その他の親族" },
      ]),
      countField("age", "年齢", "20", "歳"),
      moneyField("income", "年収（給与収入）", "1000000"),
      moneyField("selfIncome", "扶養する人の年収", "6000000"),
      selectField("liveTogether", "同居しているか", "yes", [
        { value: "yes", label: "同居している" },
        { value: "no", label: "別居している" },
      ]),
    ],
    compute: (i) => {
      const revenue = i.num("income");
      // 給与所得（令和7年分の給与所得控除 最低65万円）
      const totalIncome = employmentIncome(revenue);
      const age = i.int("age");
      const relation = i.raw("relation");
      const taxEligible =
        totalIncome <= 580_000 &&
        (relation === "spouse" ? i.num("selfIncome") <= 11_950_000 : age >= 16);
      const socialLimit = age >= 60 ? 1_800_000 : 1_300_000;
      const socialEligible = revenue < socialLimit;
      const deduction =
        relation === "spouse"
          ? 380_000
          : age >= 19 && age <= 22
            ? 630_000
            : age >= 70
              ? i.raw("liveTogether") === "yes"
                ? 580_000
                : 480_000
              : age >= 16
                ? 380_000
                : 0;
      return [
        {
          label: "税法上の扶養",
          value: taxEligible ? "扶養に入れます" : "扶養に入れません",
          primary: true,
          note: `合計所得金額 ${yen(totalIncome)}（要件は58万円以下）`,
        },
        {
          label: "適用される控除額",
          value: yen(taxEligible ? deduction : 0),
          note:
            !taxEligible && relation === "spouse"
              ? "配偶者特別控除の対象になる可能性があります"
              : age < 16
                ? "16歳未満は扶養控除の対象外（児童手当の対象）"
                : undefined,
        },
        {
          label: "社会保険上の扶養",
          value: socialEligible ? "扶養に入れます" : "扶養に入れません",
          note: `年収${yen(socialLimit)}未満が要件（${age >= 60 ? "60歳以上" : "60歳未満"}）`,
        },
        {
          label: "収入の壁（税法上）",
          value: yen(1_230_000),
          note: "給与収入123万円＝合計所得58万円",
        },
        {
          label: "収入の壁（社会保険）",
          value: yen(socialLimit),
          note: "勤務先の規模により106万円の壁が適用される場合があります",
        },
        {
          label: "別居の場合の要件",
          value:
            i.raw("liveTogether") === "no"
              ? "継続的に仕送りをしていることが必要です"
              : "同居のため追加要件なし",
        },
      ];
    },
    note: "社会保険の扶養は別居の場合、被扶養者の年収が仕送り額未満であることも必要です。",
  },

  /* 141 */
  "catalog-141": {
    title: "教育費シミュレーター",
    lead: "進路の組み合わせから幼稚園から大学卒業までの教育費総額を試算します。",
    fields: [
      selectField("kindergarten", "幼稚園", "public", [
        { value: "public", label: "公立（3年）" },
        { value: "private", label: "私立（3年）" },
      ]),
      selectField("elementary", "小学校", "public", [
        { value: "public", label: "公立" },
        { value: "private", label: "私立" },
      ]),
      selectField("junior", "中学校", "public", [
        { value: "public", label: "公立" },
        { value: "private", label: "私立" },
      ]),
      selectField("high", "高校", "public", [
        { value: "public", label: "公立" },
        { value: "private", label: "私立" },
      ]),
      selectField("university", "大学", "nationalLiberal", [
        { value: "none", label: "進学しない" },
        { value: "nationalLiberal", label: "国公立（自宅）" },
        { value: "nationalAway", label: "国公立（下宿）" },
        { value: "privateLiberal", label: "私立文系（自宅）" },
        { value: "privateScience", label: "私立理系（自宅）" },
        { value: "privateAway", label: "私立（下宿）" },
      ]),
    ],
    compute: (i) => {
      // 文部科学省「子供の学習費調査」等をもとにした年間総額×年数
      const costs = {
        kindergarten: { public: 165_000 * 3, private: 308_000 * 3 },
        elementary: { public: 336_000 * 6, private: 1_827_000 * 6 },
        junior: { public: 542_000 * 3, private: 1_560_000 * 3 },
        high: { public: 597_000 * 3, private: 1_030_000 * 3 },
        university: {
          none: 0,
          nationalLiberal: 2_500_000,
          nationalAway: 5_400_000,
          privateLiberal: 4_100_000,
          privateScience: 5_500_000,
          privateAway: 7_800_000,
        },
      };
      const k =
        costs.kindergarten[i.raw("kindergarten") as "public" | "private"];
      const e = costs.elementary[i.raw("elementary") as "public" | "private"];
      const j = costs.junior[i.raw("junior") as "public" | "private"];
      const h = costs.high[i.raw("high") as "public" | "private"];
      const u =
        costs.university[i.raw("university") as keyof typeof costs.university];
      const total = k + e + j + h + u;
      const years = i.raw("university") === "none" ? 15 : 19;
      return [
        { label: "教育費の総額", value: yen(total), primary: true },
        { label: "幼稚園（3年）", value: yen(k) },
        { label: "小学校（6年）", value: yen(e) },
        { label: "中学校（3年）", value: yen(j) },
        { label: "高校（3年）", value: yen(h) },
        ...(u > 0 ? [{ label: "大学（4年）", value: yen(u) }] : []),
        {
          label: "月あたりの平均負担",
          value: yen(total / (years * 12)),
          note: `${years}年間で均した場合`,
        },
        {
          label: "大学費用を18年で積み立てる場合",
          value: u > 0 ? `${yen(u / (18 * 12))} / 月` : "—",
        },
      ];
    },
    note: "学習費（授業料・給食費・学校外活動費）を含む目安です。私立は学校による差が大きくなります。",
  },

  /* 142 */
  "catalog-142": {
    title: "大学費用積立計算",
    lead: "目標額までの毎月の積立額を、運用利回りを考慮して計算します。",
    fields: [
      moneyField("target", "目標額", "5000000"),
      dateField("birth", "子どもの生年月日", toIso(addMonths(new Date(), -12))),
      countField("enrollAge", "進学する年齢", "18", "歳"),
      moneyField("current", "現在の貯蓄額", "500000"),
      rateField("rate", "想定利回り（年）", "3.0"),
      moneyField("allowance", "積立に回す児童手当（月）", "10000"),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      if (!birth) return needDate;
      const goalDate = addMonths(birth, i.int("enrollAge") * 12);
      const months = Math.max(
        1,
        calendarDiff(new Date(), goalDate).totalMonths,
      );
      const r = i.num("rate") / 100 / 12;
      const currentFuture = i.num("current") * Math.pow(1 + r, months);
      const needed = Math.max(0, i.num("target") - currentFuture);
      const factor = r === 0 ? months : (Math.pow(1 + r, months) - 1) / r;
      const monthly = needed / factor;
      const allowanceMonths = Math.min(months, 18 * 12);
      const allowanceFuture = i.num("allowance") * allowanceMonths;
      const selfMonthly = Math.max(0, monthly - i.num("allowance"));
      return [
        { label: "毎月の積立額", value: yen(monthly), primary: true },
        {
          label: "児童手当以外に必要な額（月）",
          value: yen(selfMonthly),
          note: `児童手当から ${yen(i.num("allowance"))} を充当`,
        },
        {
          label: "積立期間",
          value: `${Math.floor(months / 12)}年${months % 12}ヶ月`,
        },
        { label: "目標時期", value: formatDate(goalDate) },
        { label: "現在の貯蓄の将来価値", value: yen(currentFuture) },
        { label: "積立元本の合計", value: yen(monthly * months) },
        {
          label: "運用益",
          value: yen(
            Math.max(0, i.num("target") - monthly * months - i.num("current")),
          ),
        },
        {
          label: "児童手当をすべて貯めた場合",
          value: yen(allowanceFuture),
          note: "18歳まで貯め続けた元本の合計",
        },
      ];
    },
    note: "利回りは保証されるものではありません。学資保険・NISA・預貯金など手段によりリスクが異なります。",
  },

  /* 143 */
  "catalog-143": {
    title: "子どもの貯蓄計算",
    lead: "児童手当とお祝い金を貯めた場合の合計額を計算します。",
    fields: [
      moneyField("allowanceMonthly", "毎月貯める児童手当", "10000"),
      countField("allowanceYears", "児童手当を貯める年数", "18", "年"),
      moneyField("gift", "お祝い金・お年玉（年間）", "30000"),
      moneyField("extra", "追加で毎月積み立てる額", "5000"),
      rateField("rate", "想定利回り（年）", "0.5"),
      countField("years", "積立期間", "18", "年"),
    ],
    compute: (i) => {
      const months = i.int("years") * 12;
      const r = i.num("rate") / 100 / 12;
      const factor = (m: number) =>
        r === 0 ? m : (Math.pow(1 + r, m) - 1) / r;
      const allowanceMonths = Math.min(months, i.int("allowanceYears") * 12);
      const allowance = i.num("allowanceMonthly") * factor(allowanceMonths);
      const extra = i.num("extra") * factor(months);
      const gift = (i.num("gift") / 12) * factor(months);
      const total = allowance + extra + gift;
      const principal =
        i.num("allowanceMonthly") * allowanceMonths +
        i.num("extra") * months +
        i.num("gift") * i.int("years");
      return [
        { label: "積立の合計額", value: yen(total), primary: true },
        { label: "元本の合計", value: yen(principal) },
        { label: "運用益", value: yen(total - principal) },
        { label: "児童手当からの積立", value: yen(allowance) },
        { label: "毎月の追加積立", value: yen(extra) },
        { label: "お祝い金・お年玉", value: yen(gift) },
        {
          label: "毎月の積立合計",
          value: yen(
            i.num("allowanceMonthly") + i.num("extra") + i.num("gift") / 12,
          ),
        },
      ];
    },
    note: "子ども名義の口座に入れた資金は、年110万円を超えると贈与税の対象になる場合があります。",
  },

  /* 144 */
  "catalog-144": {
    title: "家族手取り計算",
    lead: "夫婦それぞれの年収から世帯の手取り額と実効税率を計算します。",
    fields: [
      moneyField("income1", "1人目の年収", "5000000"),
      moneyField("income2", "2人目の年収", "3000000"),
      countField("dependents", "扶養する子どもの人数（16歳以上）", "0", "人"),
      selectField("care", "介護保険（40〜64歳）", "no", [
        { value: "no", label: "2人とも対象外" },
        { value: "one", label: "1人が対象" },
        { value: "both", label: "2人とも対象" },
      ]),
    ],
    compute: (i) => {
      const care = i.raw("care");
      const a = salaryBreakdown(i.num("income1"), {
        over40: care === "both" || care === "one",
        dependents: i.int("dependents"),
      });
      const b = salaryBreakdown(i.num("income2"), {
        over40: care === "both",
      });
      const gross = a.revenue + b.revenue;
      const net = a.netAnnual + b.netAnnual;
      return [
        { label: "世帯の手取り年収", value: yen(net), primary: true },
        { label: "月あたりの手取り", value: yen(net / 12) },
        { label: "世帯の額面年収", value: yen(gross) },
        { label: "1人目の手取り", value: yen(a.netAnnual) },
        { label: "2人目の手取り", value: yen(b.netAnnual) },
        {
          label: "社会保険料の合計",
          value: yen(a.socialInsurance + b.socialInsurance),
        },
        {
          label: "所得税・住民税の合計",
          value: yen(a.incomeTax + a.residentTax + b.incomeTax + b.residentTax),
        },
        {
          label: "実効負担率",
          value: pct(gross ? ((gross - net) / gross) * 100 : 0, 1),
        },
      ];
    },
    note: "配偶者控除・各種所得控除は考慮していない概算です。",
  },

  /* 145 */
  "catalog-145": {
    title: "世帯年収計算",
    lead: "世帯全員の収入を合計し、手取りと世帯年収の分布上の位置を確認します。",
    fields: [
      moneyField("main", "主たる生計者の年収", "5000000"),
      moneyField("spouse", "配偶者の年収", "2000000"),
      moneyField("otherIncome", "その他の収入（副業・年金など）", "0"),
      countField("household", "世帯人数", "3", "人"),
    ],
    compute: (i) => {
      const gross = i.num("main") + i.num("spouse") + i.num("otherIncome");
      const a = salaryBreakdown(i.num("main"));
      const b = salaryBreakdown(i.num("spouse"));
      const net = a.netAnnual + b.netAnnual + i.num("otherIncome") * 0.8;
      const household = Math.max(1, i.int("household"));
      // 等価可処分所得（世帯人数の平方根で割る）
      const equivalent = net / Math.sqrt(household);
      const position =
        gross >= 10_000_000
          ? "上位約12％"
          : gross >= 8_000_000
            ? "上位約25％"
            : gross >= 6_000_000
              ? "上位約40％"
              : gross >= 4_000_000
                ? "中央値付近"
                : "中央値を下回る水準";
      return [
        { label: "世帯年収（額面）", value: yen(gross), primary: true },
        { label: "世帯の手取り年収", value: yen(net) },
        { label: "月あたりの手取り", value: yen(net / 12) },
        { label: "1人あたりの年収", value: yen(gross / household) },
        {
          label: "等価可処分所得",
          value: yen(equivalent),
          note: "世帯人数の平方根で割った、生活水準の比較指標",
        },
        {
          label: "世帯年収の分布上の位置",
          value: position,
          note: "厚生労働省 国民生活基礎調査の分布をもとにした目安",
        },
        {
          label: "無理のない住居費（手取りの25％）",
          value: `${yen(net / 12 / 4)} / 月`,
        },
      ];
    },
  },
};
