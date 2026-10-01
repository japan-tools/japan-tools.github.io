/** 日本の国民の祝日（1980年〜2099年）を判定するユーティリティ */

const DAY_MS = 86_400_000;

function nthMonday(year: number, month: number, nth: number) {
  const first = new Date(year, month - 1, 1);
  const offset = (8 - first.getDay()) % 7;
  return new Date(year, month - 1, 1 + offset + (nth - 1) * 7);
}

function vernalEquinox(year: number) {
  const day = Math.floor(
    20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
  return new Date(year, 2, day);
}

function autumnalEquinox(year: number) {
  const day = Math.floor(
    23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
  return new Date(year, 8, day);
}

const key = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const cache = new Map<number, Map<string, string>>();

/** その年の祝日一覧（振替休日・国民の休日を含む） */
export function holidaysOf(year: number): Map<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const base: [Date, string][] = [
    [new Date(year, 0, 1), "元日"],
    [nthMonday(year, 1, 2), "成人の日"],
    [new Date(year, 1, 11), "建国記念の日"],
    [vernalEquinox(year), "春分の日"],
    [new Date(year, 3, 29), "昭和の日"],
    [new Date(year, 4, 3), "憲法記念日"],
    [new Date(year, 4, 4), "みどりの日"],
    [new Date(year, 4, 5), "こどもの日"],
    [nthMonday(year, 7, 3), "海の日"],
    [new Date(year, 7, 11), "山の日"],
    [nthMonday(year, 9, 3), "敬老の日"],
    [autumnalEquinox(year), "秋分の日"],
    [nthMonday(year, 10, 2), "スポーツの日"],
    [new Date(year, 10, 3), "文化の日"],
    [new Date(year, 10, 23), "勤労感謝の日"],
  ];
  if (year >= 2020) base.push([new Date(year, 1, 23), "天皇誕生日"]);
  else if (year >= 1989) base.push([new Date(year, 11, 23), "天皇誕生日"]);

  const map = new Map<string, string>();
  for (const [date, name] of base) map.set(key(date), name);

  // 振替休日：日曜と重なった場合、直後の平日を休日にする
  for (const [date] of base) {
    if (date.getDay() !== 0) continue;
    const substitute = new Date(date);
    do {
      substitute.setDate(substitute.getDate() + 1);
    } while (map.has(key(substitute)));
    map.set(key(substitute), "振替休日");
  }

  // 国民の休日：祝日に挟まれた平日
  const sorted = [...base].sort((a, b) => a[0].getTime() - b[0].getTime());
  for (const [date] of sorted) {
    const middle = new Date(date.getTime() + DAY_MS);
    const next = new Date(date.getTime() + 2 * DAY_MS);
    if (
      map.has(key(next)) &&
      !map.has(key(middle)) &&
      middle.getDay() !== 0 &&
      middle.getDay() !== 6
    ) {
      map.set(key(middle), "国民の休日");
    }
  }

  cache.set(year, map);
  return map;
}

export function holidayName(date: Date): string | null {
  return holidaysOf(date.getFullYear()).get(key(date)) ?? null;
}

export function isHoliday(date: Date): boolean {
  return holidayName(date) !== null;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** 土日祝を除いた営業日か */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/** 期間内の営業日数（両端を含む） */
export function countBusinessDays(
  from: Date,
  to: Date,
  options: { excludeHolidays?: boolean } = {},
) {
  const excludeHolidays = options.excludeHolidays ?? true;
  let start = new Date(from);
  let end = new Date(to);
  if (start > end) [start, end] = [end, start];
  let business = 0;
  let weekend = 0;
  let holiday = 0;
  let total = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    total += 1;
    const weekendDay = isWeekend(cursor);
    const holidayDay = isHoliday(cursor);
    if (weekendDay) weekend += 1;
    else if (holidayDay) holiday += 1;
    if (!weekendDay && (!excludeHolidays || !holidayDay)) business += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return { business, weekend, holiday, total };
}

/** 指定日から営業日ベースでn日後を求める */
export function addBusinessDays(from: Date, amount: number): Date {
  const result = new Date(from);
  const step = amount >= 0 ? 1 : -1;
  let remaining = Math.abs(amount);
  while (remaining > 0) {
    result.setDate(result.getDate() + step);
    if (isBusinessDay(result)) remaining -= 1;
  }
  return result;
}
