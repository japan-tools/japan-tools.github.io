import {
  addBusinessDays,
  countBusinessDays,
  holidayName,
  holidaysOf,
  isBusinessDay,
} from "./holidays";
import {
  addDays,
  addMonths,
  ageAt,
  calendarDiff,
  diffDays,
  formatDate,
  gradeLabel,
  japaneseEra,
  schoolGrade,
  toIso,
  weekdayName,
  zodiacOf,
} from "./dateUtils";
import {
  countField,
  dateField,
  days as fmtDays,
  num,
  selectField,
  timeField,
  type CalculatorSpec,
} from "./types";

const todayIso = () => toIso(new Date());
const needDate = [
  { label: "日付を選択してください", value: "—", primary: true },
];

/** 期間の内訳（週数・営業日など）を共通で返す */
function periodRows(from: Date, to: Date) {
  const total = Math.abs(diffDays(from, to));
  const counts = countBusinessDays(from, to);
  return [
    { label: "週数", value: `${num(Math.floor(total / 7))}週${total % 7}日` },
    { label: "土日祝を除いた日数", value: fmtDays(counts.business) },
    { label: "土日の日数", value: fmtDays(counts.weekend) },
    { label: "祝日（土日以外）の日数", value: fmtDays(counts.holiday) },
  ];
}

export const dateCalculators: Record<string, CalculatorSpec> = {
  /* 106 */
  "catalog-106": {
    title: "年齢計算",
    lead: "生年月日から満年齢・数え年・和暦・干支をまとめて確認します。",
    fields: [
      dateField("birth", "生年月日", "1990-01-01"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      const base = i.date("base");
      if (!birth || !base) return needDate;
      const d = calendarDiff(birth, base);
      const total = diffDays(birth, base);
      const counted = base.getFullYear() - birth.getFullYear() + 1;
      const nextBirthday = new Date(
        base.getFullYear(),
        birth.getMonth(),
        birth.getDate(),
      );
      if (nextBirthday < base) nextBirthday.setFullYear(base.getFullYear() + 1);
      const zodiac = zodiacOf(birth.getFullYear());
      return [
        { label: "満年齢", value: `${d.years}歳`, primary: true },
        {
          label: "詳しい年齢",
          value: `${d.years}歳${d.months}ヶ月${d.days}日`,
        },
        { label: "数え年", value: `${counted}歳` },
        { label: "生まれてからの日数", value: fmtDays(total) },
        { label: "生年月日の和暦", value: japaneseEra(birth) },
        { label: "干支", value: `${zodiac.sign}（${zodiac.animal}）` },
        {
          label: "次の誕生日",
          value: formatDate(nextBirthday),
          note: `あと${diffDays(base, nextBirthday)}日`,
        },
      ];
    },
  },

  /* 107 */
  "catalog-107": {
    title: "満年齢計算",
    lead: "基準日時点の満年齢と、各種制度の年齢要件を確認します。",
    fields: [
      dateField("birth", "生年月日", "1990-01-01"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      const base = i.date("base");
      if (!birth || !base) return needDate;
      const age = ageAt(birth, base);
      const yearAt = (target: number) => {
        const date = new Date(birth);
        date.setFullYear(birth.getFullYear() + target);
        return formatDate(date);
      };
      return [
        { label: "満年齢", value: `${age}歳`, primary: true },
        {
          label: "年齢が加算される日",
          value: "誕生日の前日（年齢計算に関する法律）",
          note: "学年の区切りが4月1日生まれまでとなる理由です",
        },
        { label: "20歳になる日（成人）", value: yearAt(20) },
        { label: "40歳（介護保険第2号被保険者）", value: yearAt(40) },
        { label: "60歳（年金繰上げ受給開始可能）", value: yearAt(60) },
        { label: "65歳（老齢年金の受給開始）", value: yearAt(65) },
        { label: "75歳（後期高齢者医療制度）", value: yearAt(75) },
      ];
    },
  },

  /* 108 */
  "catalog-108": {
    title: "数え年計算",
    lead: "満年齢と数え年を比較し、七五三・厄年などの節目を確認します。",
    fields: [
      dateField("birth", "生年月日", "1990-01-01"),
      dateField("base", "基準日", todayIso()),
      selectField("gender", "性別（厄年の判定用）", "male", [
        { value: "male", label: "男性" },
        { value: "female", label: "女性" },
      ]),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      const base = i.date("base");
      if (!birth || !base) return needDate;
      const age = ageAt(birth, base);
      const counted = base.getFullYear() - birth.getFullYear() + 1;
      const maleYaku = [25, 42, 61];
      const femaleYaku = [19, 33, 37, 61];
      const list = i.raw("gender") === "male" ? maleYaku : femaleYaku;
      const isYaku = list.includes(counted);
      const isMae = list.includes(counted + 1);
      const isAto = list.includes(counted - 1);
      const nextYaku = list.find((y) => y > counted);
      return [
        { label: "数え年", value: `${counted}歳`, primary: true },
        { label: "満年齢", value: `${age}歳` },
        {
          label: "数え年の考え方",
          value: "生まれた年を1歳とし、元日ごとに1歳加える",
        },
        {
          label: "厄年の判定",
          value: isYaku
            ? "本厄です"
            : isMae
              ? "前厄です"
              : isAto
                ? "後厄です"
                : "厄年ではありません",
          note:
            i.raw("gender") === "male"
              ? "男性の本厄は数え25・42・61歳"
              : "女性の本厄は数え19・33・37・61歳",
        },
        {
          label: "次の本厄",
          value: nextYaku
            ? `数え${nextYaku}歳（${base.getFullYear() + (nextYaku - counted)}年）`
            : "—",
        },
        {
          label: "七五三の年",
          value: `3歳：${birth.getFullYear() + 2}年／5歳：${birth.getFullYear() + 4}年／7歳：${birth.getFullYear() + 6}年`,
          note: "数え年で祝う場合",
        },
      ];
    },
  },

  /* 109 */
  "catalog-109": {
    title: "生年月日から学年計算",
    lead: "生年月日から現在の学年と同学年の生まれ年を判定します。",
    fields: [
      dateField("birth", "生年月日", "2015-05-10"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      const base = i.date("base");
      if (!birth || !base) return needDate;
      const { grade, cohortYear, schoolYear } = schoolGrade(birth, base);
      const early =
        birth.getMonth() < 3 ||
        (birth.getMonth() === 3 && birth.getDate() === 1);
      return [
        { label: "現在の学年", value: gradeLabel(grade), primary: true },
        { label: "満年齢", value: `${ageAt(birth, base)}歳` },
        {
          label: "同学年の範囲",
          value: `${cohortYear}年4月2日 〜 ${cohortYear + 1}年4月1日生まれ`,
        },
        {
          label: "早生まれかどうか",
          value: early ? "早生まれです" : "早生まれではありません",
        },
        { label: "現在の年度", value: `${schoolYear}年度` },
        {
          label: "小学校入学",
          value: `${cohortYear + 6}年4月（${cohortYear + 6}年度）`,
        },
        {
          label: "高校卒業",
          value: `${cohortYear + 18}年3月`,
        },
      ];
    },
    note: "4月1日生まれは前の学年に含まれます（年齢は誕生日の前日に加算されるため）。",
  },

  /* 110 */
  "catalog-110": {
    title: "入学年度計算",
    lead: "生年月日から各学校段階の入学年月を計算します。",
    fields: [dateField("birth", "生年月日", "2020-08-15")],
    compute: (i) => {
      const birth = i.date("birth");
      if (!birth) return needDate;
      const { cohortYear } = schoolGrade(birth, birth);
      const row = (label: string, offset: number) => ({
        label,
        value: `${cohortYear + offset}年4月`,
        note: japaneseEra(new Date(cohortYear + offset, 3, 1)),
      });
      return [
        {
          label: "小学校の入学",
          value: `${cohortYear + 6}年4月`,
          primary: true,
          note: japaneseEra(new Date(cohortYear + 6, 3, 1)),
        },
        row("保育園・幼稚園（年少）", 4),
        row("幼稚園（年中）", 5),
        row("中学校の入学", 12),
        row("高校の入学", 15),
        row("大学の入学（現役）", 18),
        {
          label: "同学年の範囲",
          value: `${cohortYear}年4月2日 〜 ${cohortYear + 1}年4月1日生まれ`,
        },
      ];
    },
  },

  /* 111 */
  "catalog-111": {
    title: "卒業年度計算",
    lead: "生年月日から各学校段階の卒業年月を計算します。",
    fields: [
      dateField("birth", "生年月日", "2010-08-15"),
      selectField("path", "進路", "university", [
        { value: "highschool", label: "高校卒業まで" },
        { value: "university", label: "大学（4年制）まで" },
        { value: "juniorCollege", label: "短大・専門（2年）まで" },
      ]),
    ],
    compute: (i) => {
      const birth = i.date("birth");
      if (!birth) return needDate;
      const { cohortYear } = schoolGrade(birth, birth);
      const path = i.raw("path");
      const finalYear =
        path === "highschool"
          ? cohortYear + 18
          : path === "juniorCollege"
            ? cohortYear + 20
            : cohortYear + 22;
      const row = (label: string, offset: number) => ({
        label,
        value: `${cohortYear + offset}年3月`,
        note: japaneseEra(new Date(cohortYear + offset, 2, 1)),
      });
      return [
        {
          label: "最終学歴の卒業",
          value: `${finalYear}年3月`,
          primary: true,
          note: `${japaneseEra(new Date(finalYear, 2, 1))}／新卒入社は${finalYear}年4月`,
        },
        row("小学校の卒業", 12),
        row("中学校の卒業", 15),
        row("高校の卒業", 18),
        ...(path !== "highschool"
          ? [
              row(
                path === "juniorCollege" ? "短大・専門の卒業" : "大学の卒業",
                path === "juniorCollege" ? 20 : 22,
              ),
            ]
          : []),
        {
          label: "就職活動の本格化",
          value: `${finalYear - 1}年3月〜`,
          note: "卒業前年の3月に広報活動解禁",
        },
      ];
    },
  },

  /* 112 */
  "catalog-112": {
    title: "入社からの勤続期間",
    lead: "入社日から基準日までの勤続期間を年・月・日で計算します。",
    fields: [
      dateField("joined", "入社日", "2020-04-01"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const joined = i.date("joined");
      const base = i.date("base");
      if (!joined || !base) return needDate;
      const d = calendarDiff(joined, base);
      const total = diffDays(joined, base);
      const anniversary = new Date(
        base.getFullYear(),
        joined.getMonth(),
        joined.getDate(),
      );
      if (anniversary < base) anniversary.setFullYear(base.getFullYear() + 1);
      return [
        {
          label: "勤続期間",
          value: `${d.years}年${d.months}ヶ月${d.days}日`,
          primary: true,
        },
        { label: "通算月数", value: `${d.totalMonths}ヶ月` },
        { label: "通算日数", value: fmtDays(total) },
        ...periodRows(joined, base),
        {
          label: "次の入社記念日",
          value: formatDate(anniversary),
          note: `勤続${d.years + 1}年（あと${diffDays(base, anniversary)}日）`,
        },
      ];
    },
  },

  /* 113 */
  "catalog-113": {
    title: "結婚からの経過日数",
    lead: "結婚記念日からの経過日数と、記念日の名称・次の節目を確認します。",
    fields: [
      dateField("wedding", "結婚した日", "2020-06-06"),
      dateField("base", "基準日", todayIso()),
    ],
    compute: (i) => {
      const wedding = i.date("wedding");
      const base = i.date("base");
      if (!wedding || !base) return needDate;
      const d = calendarDiff(wedding, base);
      const total = diffDays(wedding, base);
      const names: Record<number, string> = {
        1: "紙婚式",
        5: "木婚式",
        10: "錫婚式",
        15: "水晶婚式",
        20: "磁器婚式",
        25: "銀婚式",
        30: "真珠婚式",
        35: "珊瑚婚式",
        40: "ルビー婚式",
        45: "サファイア婚式",
        50: "金婚式",
        60: "ダイヤモンド婚式",
      };
      const milestones = Object.keys(names)
        .map(Number)
        .sort((a, b) => a - b);
      const nextMilestone = milestones.find((y) => y > d.years);
      const anniversary = new Date(
        base.getFullYear(),
        wedding.getMonth(),
        wedding.getDate(),
      );
      if (anniversary < base) anniversary.setFullYear(base.getFullYear() + 1);
      const nextDate = nextMilestone
        ? new Date(
            wedding.getFullYear() + nextMilestone,
            wedding.getMonth(),
            wedding.getDate(),
          )
        : null;
      return [
        { label: "結婚してからの日数", value: fmtDays(total), primary: true },
        { label: "経過期間", value: `${d.years}年${d.months}ヶ月${d.days}日` },
        {
          label: "今年の結婚記念日",
          value: formatDate(anniversary),
          note: `あと${diffDays(base, anniversary)}日`,
        },
        {
          label: `${d.years}年目の記念日`,
          value: names[d.years] ?? "—",
        },
        ...(nextMilestone && nextDate
          ? [
              {
                label: "次の節目",
                value: `${nextMilestone}年目 ${names[nextMilestone]}`,
                note: `${formatDate(nextDate)}（あと${diffDays(base, nextDate)}日）`,
              },
            ]
          : []),
        { label: "10,000日目", value: formatDate(addDays(wedding, 10_000)) },
      ];
    },
  },

  /* 114 */
  "catalog-114": {
    title: "指定日までの日数",
    lead: "今日から指定した日までの残り日数をカウントダウンします。",
    fields: [
      dateField("base", "起算日", todayIso()),
      dateField("target", "目標の日", `${new Date().getFullYear() + 1}-01-01`),
    ],
    compute: (i) => {
      const base = i.date("base");
      const target = i.date("target");
      if (!base || !target) return needDate;
      const total = diffDays(base, target);
      const d = calendarDiff(base, target);
      return [
        {
          label: total >= 0 ? "残り日数" : "経過した日数",
          value: fmtDays(Math.abs(total)),
          primary: true,
          note: formatDate(target),
        },
        { label: "期間", value: `${d.years}年${d.months}ヶ月${d.days}日` },
        ...periodRows(base, target),
        { label: "曜日", value: weekdayName(target) },
        {
          label: "祝日かどうか",
          value: holidayName(target) ?? "祝日ではありません",
        },
      ];
    },
  },

  /* 115 */
  "catalog-115": {
    title: "指定日からの日数",
    lead: "指定した日から今日までの経過日数を計算します。",
    fields: [
      dateField("from", "起算日", "2020-01-01"),
      dateField("base", "基準日", todayIso()),
      selectField("countStart", "起算日の数え方", "exclude", [
        { value: "exclude", label: "起算日を含めない（初日不算入）" },
        { value: "include", label: "起算日を含める" },
      ]),
    ],
    compute: (i) => {
      const from = i.date("from");
      const base = i.date("base");
      if (!from || !base) return needDate;
      const raw = diffDays(from, base);
      const total = i.raw("countStart") === "include" ? raw + 1 : raw;
      const d = calendarDiff(from, base);
      return [
        { label: "経過日数", value: fmtDays(total), primary: true },
        { label: "経過期間", value: `${d.years}年${d.months}ヶ月${d.days}日` },
        { label: "経過月数", value: `${d.totalMonths}ヶ月` },
        ...periodRows(from, base),
        { label: "起算日", value: formatDate(from) },
      ];
    },
    note: "法律上の期間計算では初日不算入が原則です（民法140条）。",
  },

  /* 116 */
  "catalog-116": {
    title: "何日前計算",
    lead: "基準日からさかのぼった日付を求めます。",
    fields: [
      dateField("base", "基準日", todayIso()),
      countField("days", "さかのぼる日数", "30", "日"),
      selectField("mode", "数え方", "calendar", [
        { value: "calendar", label: "暦日（土日祝を含む）" },
        { value: "business", label: "営業日（土日祝を除く）" },
      ]),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const amount = i.int("days");
      const result =
        i.raw("mode") === "business"
          ? addBusinessDays(base, -amount)
          : addDays(base, -amount);
      return [
        { label: `${amount}日前`, value: formatDate(result), primary: true },
        { label: "曜日", value: weekdayName(result) },
        { label: "和暦", value: japaneseEra(result) },
        { label: "祝日", value: holidayName(result) ?? "祝日ではありません" },
        { label: "7日前", value: formatDate(addDays(base, -7)) },
        { label: "30日前", value: formatDate(addDays(base, -30)) },
        { label: "100日前", value: formatDate(addDays(base, -100)) },
      ];
    },
  },

  /* 117 */
  "catalog-117": {
    title: "何日後計算",
    lead: "基準日から指定した日数後の日付を求めます。",
    fields: [
      dateField("base", "基準日", todayIso()),
      countField("days", "加算する日数", "30", "日"),
      selectField("mode", "数え方", "calendar", [
        { value: "calendar", label: "暦日（土日祝を含む）" },
        { value: "business", label: "営業日（土日祝を除く）" },
      ]),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const amount = i.int("days");
      const result =
        i.raw("mode") === "business"
          ? addBusinessDays(base, amount)
          : addDays(base, amount);
      return [
        { label: `${amount}日後`, value: formatDate(result), primary: true },
        { label: "曜日", value: weekdayName(result) },
        { label: "和暦", value: japaneseEra(result) },
        { label: "祝日", value: holidayName(result) ?? "祝日ではありません" },
        { label: "7日後", value: formatDate(addDays(base, 7)) },
        { label: "30日後", value: formatDate(addDays(base, 30)) },
        { label: "100日後", value: formatDate(addDays(base, 100)) },
      ];
    },
  },

  /* 118 */
  "catalog-118": {
    title: "何週間後計算",
    lead: "基準日から指定した週数後の日付を求めます（曜日は変わりません）。",
    fields: [
      dateField("base", "基準日", todayIso()),
      countField("weeks", "加算する週数", "4", "週"),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const weeks = i.int("weeks");
      const result = addDays(base, weeks * 7);
      return [
        { label: `${weeks}週間後`, value: formatDate(result), primary: true },
        { label: "日数に換算", value: fmtDays(weeks * 7) },
        { label: "曜日", value: `${weekdayName(result)}（基準日と同じ）` },
        { label: "1週間後", value: formatDate(addDays(base, 7)) },
        { label: "4週間後", value: formatDate(addDays(base, 28)) },
        { label: "12週間後", value: formatDate(addDays(base, 84)) },
        { label: "祝日", value: holidayName(result) ?? "祝日ではありません" },
      ];
    },
  },

  /* 119 */
  "catalog-119": {
    title: "何ヶ月後計算",
    lead: "基準日から指定した月数後の日付を求めます（月末は自動調整）。",
    fields: [
      dateField("base", "基準日", todayIso()),
      countField("months", "加算する月数", "3", "ヶ月"),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const months = i.int("months");
      const result = addMonths(base, months);
      const adjusted = result.getDate() !== base.getDate();
      return [
        { label: `${months}ヶ月後`, value: formatDate(result), primary: true },
        { label: "日数に換算", value: fmtDays(diffDays(base, result)) },
        { label: "曜日", value: weekdayName(result) },
        {
          label: "日付の調整",
          value: adjusted ? "応当日がないため月末に調整しました" : "調整なし",
        },
        { label: "1ヶ月後", value: formatDate(addMonths(base, 1)) },
        { label: "6ヶ月後", value: formatDate(addMonths(base, 6)) },
        { label: "12ヶ月後", value: formatDate(addMonths(base, 12)) },
      ];
    },
  },

  /* 120 */
  "catalog-120": {
    title: "何年後計算",
    lead: "基準日から指定した年数後の日付と和暦を求めます。",
    fields: [
      dateField("base", "基準日", todayIso()),
      countField("years", "加算する年数", "10", "年"),
    ],
    compute: (i) => {
      const base = i.date("base");
      if (!base) return needDate;
      const years = i.int("years");
      const result = addMonths(base, years * 12);
      return [
        { label: `${years}年後`, value: formatDate(result), primary: true },
        { label: "和暦", value: japaneseEra(result) },
        { label: "日数に換算", value: fmtDays(diffDays(base, result)) },
        { label: "曜日", value: weekdayName(result) },
        {
          label: "干支",
          value: (() => {
            const z = zodiacOf(result.getFullYear());
            return `${z.sign}（${z.animal}）`;
          })(),
        },
        { label: "5年後", value: formatDate(addMonths(base, 60)) },
        { label: "20年後", value: formatDate(addMonths(base, 240)) },
      ];
    },
  },

  /* 121 */
  "catalog-121": {
    title: "日付差計算",
    lead: "2つの日付の差を日数・週数・月数・営業日で計算します。",
    fields: [
      dateField("from", "開始日", todayIso()),
      dateField("to", "終了日", `${new Date().getFullYear() + 1}-01-01`),
    ],
    compute: (i) => {
      const from = i.date("from");
      const to = i.date("to");
      if (!from || !to) return needDate;
      const total = Math.abs(diffDays(from, to));
      const d = calendarDiff(from, to);
      return [
        { label: "日数の差", value: fmtDays(total), primary: true },
        { label: "期間", value: `${d.years}年${d.months}ヶ月${d.days}日` },
        { label: "月数", value: `${d.totalMonths}ヶ月` },
        ...periodRows(from, to),
        {
          label: "時間・分に換算",
          value: `${num(total * 24)}時間 / ${num(total * 24 * 60)}分`,
        },
      ];
    },
  },

  /* 122 */
  "catalog-122": {
    title: "営業日計算",
    lead: "期間内の営業日数を、土日祝を除いて正確に数えます。",
    fields: [
      dateField("from", "開始日", todayIso()),
      dateField("to", "終了日", `${new Date().getFullYear()}-12-31`),
      selectField("holiday", "祝日の扱い", "exclude", [
        { value: "exclude", label: "祝日を除く" },
        { value: "include", label: "祝日も営業日に数える" },
      ]),
    ],
    compute: (i) => {
      const from = i.date("from");
      const to = i.date("to");
      if (!from || !to) return needDate;
      const counts = countBusinessDays(from, to, {
        excludeHolidays: i.raw("holiday") === "exclude",
      });
      return [
        {
          label: "営業日数",
          value: `${num(counts.business)}営業日`,
          primary: true,
        },
        { label: "期間の総日数", value: fmtDays(counts.total) },
        { label: "土日", value: fmtDays(counts.weekend) },
        { label: "祝日（土日以外）", value: fmtDays(counts.holiday) },
        {
          label: "休日の合計",
          value: fmtDays(counts.weekend + counts.holiday),
        },
        {
          label: "開始日は営業日か",
          value: isBusinessDay(from) ? "営業日です" : "休日です",
        },
        {
          label: "終了日は営業日か",
          value: isBusinessDay(to) ? "営業日です" : "休日です",
        },
      ];
    },
    note: "国民の祝日・振替休日・国民の休日を自動判定しています（会社独自の休日は含みません）。",
  },

  /* 123 */
  "catalog-123": {
    title: "土日祝除外日数計算",
    lead: "期間内の稼働日と休日の内訳を確認し、祝日の一覧も表示します。",
    fields: [
      dateField("from", "開始日", todayIso()),
      dateField("to", "終了日", `${new Date().getFullYear()}-12-31`),
    ],
    compute: (i) => {
      const from = i.date("from");
      const to = i.date("to");
      if (!from || !to) return needDate;
      const [start, end] = from <= to ? [from, to] : [to, from];
      const counts = countBusinessDays(start, end);
      const list: string[] = [];
      for (
        let year = start.getFullYear();
        year <= end.getFullYear();
        year += 1
      ) {
        for (const [dateKey, name] of holidaysOf(year)) {
          const [y, m, d] = dateKey.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          if (date >= start && date <= end) list.push(`${m}/${d} ${name}`);
        }
      }
      return [
        { label: "稼働日数", value: fmtDays(counts.business), primary: true },
        { label: "期間の総日数", value: fmtDays(counts.total) },
        {
          label: "休日の合計",
          value: fmtDays(counts.total - counts.business),
        },
        { label: "土日", value: fmtDays(counts.weekend) },
        { label: "祝日（土日と重ならない分）", value: fmtDays(counts.holiday) },
        {
          label: "稼働率",
          value: counts.total
            ? `${num((counts.business / counts.total) * 100, 1)}%`
            : "—",
        },
        {
          label: "期間内の祝日",
          value: list.length ? `${list.length}日` : "なし",
          note: list.slice(0, 20).join("、") || undefined,
        },
      ];
    },
  },

  /* 124 */
  "catalog-124": {
    title: "タイムゾーン変換",
    lead: "日本時間を世界の主要都市の現地時間に変換します。",
    fields: [
      dateField("date", "日付（日本時間）", todayIso()),
      timeField("time", "時刻（日本時間）", "09:00"),
      selectField("zone", "変換先のタイムゾーン", "America/New_York", [
        { value: "UTC", label: "UTC（協定世界時）" },
        { value: "America/New_York", label: "ニューヨーク" },
        { value: "America/Los_Angeles", label: "ロサンゼルス" },
        { value: "Europe/London", label: "ロンドン" },
        { value: "Europe/Paris", label: "パリ・ベルリン" },
        { value: "Asia/Shanghai", label: "北京・上海" },
        { value: "Asia/Singapore", label: "シンガポール" },
        { value: "Asia/Kolkata", label: "インド" },
        { value: "Australia/Sydney", label: "シドニー" },
        { value: "Asia/Dubai", label: "ドバイ" },
      ]),
    ],
    compute: (i) => {
      const date = i.date("date");
      if (!date) return needDate;
      const minutes = i.minutes("time");
      // 入力は日本時間（UTC+9）として解釈する
      const utc = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        Math.floor(minutes / 60) - 9,
        minutes % 60,
      );
      const instant = new Date(utc);
      const format = (zone: string) =>
        new Intl.DateTimeFormat("ja-JP", {
          timeZone: zone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
        }).format(instant);
      const zone = i.raw("zone");
      const offsetOf = (tz: string) => {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          timeZoneName: "shortOffset",
        }).formatToParts(instant);
        return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      };
      return [
        { label: "変換後の現地時間", value: format(zone), primary: true },
        { label: "日本時間", value: format("Asia/Tokyo") },
        { label: "UTC", value: format("UTC") },
        { label: "時差", value: `${offsetOf(zone)}（日本は UTC+9）` },
        { label: "ニューヨーク", value: format("America/New_York") },
        { label: "ロンドン", value: format("Europe/London") },
        { label: "シンガポール", value: format("Asia/Singapore") },
      ];
    },
    note: "サマータイム（夏時間）は自動的に考慮されます。",
  },

  /* 125 */
  "catalog-125": {
    title: "日本時間変換",
    lead: "海外の現地時間を日本時間（JST）に変換します。",
    fields: [
      dateField("date", "現地の日付", todayIso()),
      timeField("time", "現地の時刻", "09:00"),
      selectField("zone", "現地のタイムゾーン", "America/Los_Angeles", [
        { value: "UTC", label: "UTC（協定世界時）" },
        { value: "America/New_York", label: "ニューヨーク" },
        { value: "America/Los_Angeles", label: "ロサンゼルス" },
        { value: "Europe/London", label: "ロンドン" },
        { value: "Europe/Paris", label: "パリ・ベルリン" },
        { value: "Asia/Shanghai", label: "北京・上海" },
        { value: "Asia/Singapore", label: "シンガポール" },
        { value: "Asia/Kolkata", label: "インド" },
        { value: "Australia/Sydney", label: "シドニー" },
        { value: "Asia/Dubai", label: "ドバイ" },
      ]),
    ],
    compute: (i) => {
      const date = i.date("date");
      if (!date) return needDate;
      const minutes = i.minutes("time");
      const zone = i.raw("zone");
      // 指定タイムゾーンでの壁時計時刻からUTCを逆算する
      const guess = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        Math.floor(minutes / 60),
        minutes % 60,
      );
      const zoned = new Date(
        new Date(guess).toLocaleString("en-US", { timeZone: zone }),
      );
      const utcRef = new Date(
        new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }),
      );
      const offset = zoned.getTime() - utcRef.getTime();
      const instant = new Date(guess - offset);
      const format = (tz: string) =>
        new Intl.DateTimeFormat("ja-JP", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
        }).format(instant);
      return [
        {
          label: "日本時間（JST）",
          value: format("Asia/Tokyo"),
          primary: true,
        },
        { label: "入力した現地時間", value: format(zone) },
        { label: "UTC", value: format("UTC") },
        {
          label: "時差",
          value: `${num(-offset / 3_600_000, 1)}時間（日本との差は ${num(9 + offset / 3_600_000, 1)}時間）`,
        },
        {
          label: "日本での曜日",
          value: new Intl.DateTimeFormat("ja-JP", {
            timeZone: "Asia/Tokyo",
            weekday: "long",
          }).format(instant),
        },
      ];
    },
    note: "サマータイム（夏時間）は自動的に考慮されます。",
  },
};
