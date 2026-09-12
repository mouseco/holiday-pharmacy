import { describe, expect, it } from 'vitest';
import { parseFacilitiesXml } from '@/lib/parse';

const ok = `<?xml version="1.0" encoding="UTF-8"?>
<response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header>
<body><items>
<item><hpid>A1</hpid><dutyName>서울의원</dutyName><dutyAddr>서울특별시 종로구 1</dutyAddr><dutyTel1>02-111-1111</dutyTel1>
<dutyDiv>C</dutyDiv><dutyDivNam>의원</dutyDivNam><wgs84Lat>37.5</wgs84Lat><wgs84Lon>127.0</wgs84Lon>
<dutyDay1>20260924</dutyDay1><dutyDaytime1>09:00~13:00</dutyDaytime1><dutyDay2>20260925</dutyDay2><dutyDaytime2>09:00~18:00</dutyDaytime2>
<dutyDay3></dutyDay3><dutyDayEtc>점심 12~13시 휴진</dutyDayEtc></item>
<item><hpid>P1</hpid><dutyName>종로약국</dutyName><dutyAddr>서울특별시 종로구 2</dutyAddr><dutyTel1>02-222-2222</dutyTel1>
<dutyDiv>E</dutyDiv><dutyDivNam>약국</dutyDivNam><wgs84Lat>37.51</wgs84Lat><wgs84Lon>127.01</wgs84Lon>
<dutyDay1>20260925</dutyDay1><dutyDaytime1>10:00~17:00</dutyDaytime1></item>
<item><hpid>X1</hpid><dutyName>좌표없음</dutyName><dutyDivNam>의원</dutyDivNam></item>
</items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>2</totalCount></body></response>`;

const single = `<response><header><resultCode>00</resultCode></header><body><items>
<item><hpid>S1</hpid><dutyName>단일</dutyName><dutyDivNam>병원</dutyDivNam><wgs84Lat>35</wgs84Lat><wgs84Lon>129</wgs84Lon></item>
</items><totalCount>1</totalCount></body></response>`;

const empty = `<response><header><resultCode>00</resultCode></header><body><items/><totalCount>0</totalCount></body></response>`;

const keyError = `<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>
<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>`;

describe('parseFacilitiesXml', () => {
  it('item 목록을 Facility로 변환하고 좌표 없는 항목은 제외한다', () => {
    const { items, totalCount } = parseFacilitiesXml(ok);
    expect(totalCount).toBe(2);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'A1', name: '서울의원', type: 'hospital', divName: '의원',
      addr: '서울특별시 종로구 1', tel: '02-111-1111', lat: 37.5, lng: 127.0,
      schedule: [{ date: '20260924', time: '09:00~13:00' }, { date: '20260925', time: '09:00~18:00' }],
      note: '점심 12~13시 휴진',
    });
    expect(items[1].type).toBe('pharmacy');
    expect(items[1].note).toBeUndefined();
  });
  it('item이 하나여도 배열로 처리한다', () => {
    expect(parseFacilitiesXml(single).items).toHaveLength(1);
  });
  it('빈 items는 빈 배열', () => {
    expect(parseFacilitiesXml(empty)).toEqual({ items: [], totalCount: 0 });
  });
  it('인증 오류 응답이면 throw', () => {
    expect(() => parseFacilitiesXml(keyError)).toThrow(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
  });
});
