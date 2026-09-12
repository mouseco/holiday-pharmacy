import { describe, expect, it } from 'vitest';
import { attachCoords, parseHolidayXml } from '@/lib/parse';

// 실제 명절 API 응답 형태: 좌표 없음, dutyDivName, dutyDayetc, 날짜는 YYYY-MM-DD
const ok = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header>
<body><items>
<item><dutyAddr>서울특별시 종로구 1</dutyAddr><dutyDay1>2026-09-24</dutyDay1><dutyDay2>2026-09-25</dutyDay2><dutyDay3>2026-09-26</dutyDay3>
<dutyDaytime1>09:00~13:00</dutyDaytime1><dutyDaytime2>09:00~18:00</dutyDaytime2>
<dutyDiv>C</dutyDiv><dutyDivName>의원</dutyDivName><dutyName>서울의원</dutyName><dutyTel1>02-111-1111</dutyTel1><hpid>A1</hpid><rnum>1</rnum>
<dutyDayetc>점심 12~13시 휴진</dutyDayetc></item>
<item><dutyAddr>서울특별시 종로구 2</dutyAddr><dutyDay1>2026-09-25</dutyDay1><dutyDaytime1>10:00~17:00</dutyDaytime1>
<dutyDiv>H</dutyDiv><dutyDivName>약국</dutyDivName><dutyName>종로약국</dutyName><dutyTel1>02-222-2222</dutyTel1><hpid>P1</hpid><rnum>2</rnum></item>
<item><dutyName>hpid없음</dutyName><dutyDivName>의원</dutyDivName></item>
</items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>2</totalCount></body></response>`;

const single = `<response><header><resultCode>00</resultCode></header><body><items>
<item><hpid>S1</hpid><dutyName>단일</dutyName><dutyDivName>병원</dutyDivName></item>
</items><totalCount>1</totalCount></body></response>`;

const empty = `<response><header><resultCode>00</resultCode></header><body><items/><totalCount>0</totalCount></body></response>`;

const keyError = `<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>
<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>`;

describe('parseHolidayXml', () => {
  it('item 목록을 HolidayItem으로 변환하고 hpid 없는 항목은 제외한다', () => {
    const { items, totalCount } = parseHolidayXml(ok);
    expect(totalCount).toBe(2);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'A1', name: '서울의원', type: 'hospital', divName: '의원',
      addr: '서울특별시 종로구 1', tel: '02-111-1111',
      // 시간이 없는 날짜(dutyDay3)도 유지, 날짜는 YYYYMMDD로 정규화
      schedule: [
        { date: '20260924', time: '09:00~13:00' },
        { date: '20260925', time: '09:00~18:00' },
        { date: '20260926', time: '' },
      ],
      note: '점심 12~13시 휴진',
    });
    expect(items[1].type).toBe('pharmacy');
    expect(items[1].note).toBeUndefined();
  });
  it('item이 하나여도 배열로 처리한다', () => {
    expect(parseHolidayXml(single).items).toHaveLength(1);
  });
  it('빈 items는 빈 배열', () => {
    expect(parseHolidayXml(empty)).toEqual({ items: [], totalCount: 0 });
  });
  it('인증 오류 응답이면 throw', () => {
    expect(() => parseHolidayXml(keyError)).toThrow(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
  });
});

describe('attachCoords', () => {
  it('인덱스에 있는 hpid만 좌표를 붙여 Facility로, 없는 것은 개수만 센다', () => {
    const { items } = parseHolidayXml(ok);
    const { facilities, missing } = attachCoords(items, { A1: [37.5, 127.0] });
    expect(facilities).toHaveLength(1);
    expect(facilities[0]).toMatchObject({ id: 'A1', lat: 37.5, lng: 127.0 });
    expect(missing).toBe(1);
  });
});
