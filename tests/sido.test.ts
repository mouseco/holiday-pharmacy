import { expect, it } from 'vitest';
import { SIDO_LIST, toApiSido } from '@/lib/sido';

it('17개 시도', () => { expect(SIDO_LIST).toHaveLength(17); });
it('카카오 표기를 API 표기로 매핑', () => {
  expect(toApiSido('서울특별시')).toBe('서울특별시');
  expect(toApiSido('강원특별자치도')).toBe('강원특별자치도');
  expect(toApiSido('전북특별자치도')).toBe('전북특별자치도');
  expect(toApiSido('서울')).toBe('서울특별시');
  expect(toApiSido('알수없음')).toBeNull();
});
