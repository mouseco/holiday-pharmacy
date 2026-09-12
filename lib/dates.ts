/** 연휴 날짜(YYYYMMDD)의 표시 유틸 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 명절 당일 라벨. 데이터에 없는 정보라 연도별로 유지 */
const HOLIDAY_LABELS: Record<string, string> = {
  '20260925': '추석',
  '20270915': '추석',
};

export function toDate(yyyymmdd: string): Date {
  return new Date(Number(yyyymmdd.slice(0, 4)), Number(yyyymmdd.slice(4, 6)) - 1, Number(yyyymmdd.slice(6, 8)));
}

/** "9/25" */
export function fmtMonthDay(yyyymmdd: string): string {
  return `${Number(yyyymmdd.slice(4, 6))}/${Number(yyyymmdd.slice(6, 8))}`;
}

/** "금" */
export function weekday(yyyymmdd: string): string {
  return WEEKDAYS[toDate(yyyymmdd).getDay()];
}

/** "추석" 등 명절 라벨, 없으면 null */
export function holidayLabel(yyyymmdd: string): string | null {
  return HOLIDAY_LABELS[yyyymmdd] ?? null;
}

/** "09:00~13:00" → "9:00–13:00", "응급실운영" → "응급실 24시간" */
export function fmtTime(time: string): string {
  const m = time.match(/^(\d{2}):(\d{2})~(\d{2}):(\d{2})$/);
  if (m) return `${Number(m[1])}:${m[2]}–${Number(m[3])}:${m[4]}`;
  if (time.includes('응급실')) return '응급실 24시간';
  return time;
}

/** 오늘 날짜를 YYYYMMDD 로 */
export function todayKey(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;
}
