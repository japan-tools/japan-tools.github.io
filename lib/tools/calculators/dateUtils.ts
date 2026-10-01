const DAY_MS = 86_400_000;

export const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const weekdayName = (date: Date) => `${WEEKDAYS[date.getDay()]}曜日`;

export const formatDate = (date: Date) =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${
    WEEKDAYS[date.getDay()]
  }）`;

export const diffDays = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);

export const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const addMonths = (date: Date, amount: number) => {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
};

/** 2つの日付の差を年・月・日に分解する */
export function calendarDiff(from: Date, to: Date) {
  const reversed = from > to;
  const [start, end] = reversed ? [to, from] : [from, to];
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months,
    reversed,
  };
}

/** 満年齢 */
export function ageAt(birth: Date, base: Date) {
  return calendarDiff(birth, base).years;
}

const ERAS: [name: string, start: Date][] = [
  ["令和", new Date(2019, 4, 1)],
  ["平成", new Date(1989, 0, 8)],
  ["昭和", new Date(1926, 11, 25)],
  ["大正", new Date(1912, 6, 30)],
  ["明治", new Date(1868, 0, 25)],
];

/** 西暦から和暦表記を求める */
export function japaneseEra(date: Date): string {
  const era = ERAS.find(([, start]) => date >= start);
  if (!era) return `${date.getFullYear()}年`;
  const year = date.getFullYear() - era[1].getFullYear() + 1;
  return `${era[0]}${year === 1 ? "元" : year}年`;
}

const ZODIAC = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];
const ZODIAC_ANIMAL = [
  "ねずみ",
  "うし",
  "とら",
  "うさぎ",
  "たつ",
  "み（へび）",
  "うま",
  "ひつじ",
  "さる",
  "とり",
  "いぬ",
  "いのしし",
];

export function zodiacOf(year: number) {
  const index = (((year - 4) % 12) + 12) % 12;
  return { sign: ZODIAC[index], animal: ZODIAC_ANIMAL[index] };
}

/**
 * 日本の学年を求める。4月2日〜翌年4月1日生まれが同学年。
 * 基準日時点での学年（小1=1 … 高3=12）を返す。0以下は未就学。
 */
export function schoolGrade(birth: Date, base: Date) {
  // 早生まれ（1/1〜4/1）は前年度扱い
  const cohortYear =
    birth.getMonth() > 2 || (birth.getMonth() === 3 && birth.getDate() >= 2)
      ? birth.getFullYear()
      : birth.getFullYear() - 1;
  // 基準日の年度（4月始まり）
  const schoolYear =
    base.getMonth() >= 3 ? base.getFullYear() : base.getFullYear() - 1;
  const grade = schoolYear - cohortYear - 5;
  return { grade, cohortYear, schoolYear };
}

export function gradeLabel(grade: number) {
  if (grade <= 0) return "未就学";
  if (grade <= 6) return `小学${grade}年生`;
  if (grade <= 9) return `中学${grade - 6}年生`;
  if (grade <= 12) return `高校${grade - 9}年生`;
  if (grade <= 16) return `大学${grade - 12}年生相当`;
  return "卒業後";
}
