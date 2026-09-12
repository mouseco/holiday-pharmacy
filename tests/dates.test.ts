import { expect, it } from 'vitest';
import { fmtMonthDay, fmtTime, holidayLabel, todayKey, weekday } from '@/lib/dates';

it('요일과 명절 라벨', () => {
  expect(weekday('20260925')).toBe('금');
  expect(weekday('20260927')).toBe('일');
  expect(holidayLabel('20260925')).toBe('추석');
  expect(holidayLabel('20260924')).toBeNull();
  expect(fmtMonthDay('20260924')).toBe('9/24');
});
it('시간 문자열 축약', () => {
  expect(fmtTime('09:00~13:00')).toBe('9:00–13:00');
  expect(fmtTime('응급실운영')).toBe('응급실 24시간');
  expect(fmtTime('상시')).toBe('상시');
});
it('todayKey', () => {
  expect(todayKey(new Date(2026, 8, 25))).toBe('20260925');
});
