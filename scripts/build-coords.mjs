// 전국 병의원·약국의 hpid → [lat, lng] 인덱스를 data/coords.json 으로 저장한다.
// 실행: node scripts/build-coords.mjs  (DATA_GO_KR_KEY 는 .env.local 또는 환경변수)
import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const root = path.resolve(import.meta.dirname, '..');
loadEnvLocal(path.join(root, '.env.local'));
const key = process.env.DATA_GO_KR_KEY;
if (!key) throw new Error('DATA_GO_KR_KEY 가 없습니다');

const SOURCES = [
  { name: '병의원', url: 'https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire' },
  { name: '약국', url: 'https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire' },
];
const PAGE_SIZE = 5000;
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

const index = {};
let calls = 0;
for (const src of SOURCES) {
  let total = Infinity;
  for (let pageNo = 1; (pageNo - 1) * PAGE_SIZE < total; pageNo++) {
    const u = new URL(src.url);
    u.searchParams.set('serviceKey', key);
    u.searchParams.set('numOfRows', String(PAGE_SIZE));
    u.searchParams.set('pageNo', String(pageNo));
    const res = await fetch(u);
    calls++;
    if (!res.ok) throw new Error(`${src.name} p${pageNo}: HTTP ${res.status}`);
    const doc = parser.parse(await res.text());
    const err = doc?.OpenAPI_ServiceResponse?.cmmMsgHeader;
    if (err) throw new Error(`${src.name} p${pageNo}: ${err.returnAuthMsg ?? err.errMsg}`);
    const body = doc?.response?.body;
    if (!body) throw new Error(`${src.name} p${pageNo}: body 없음 (${doc?.response?.header?.resultMsg})`);
    total = Number(body.totalCount ?? 0);
    const item = body.items?.item;
    const list = item == null ? [] : Array.isArray(item) ? item : [item];
    let added = 0;
    for (const r of list) {
      const lat = Number(r.wgs84Lat), lng = Number(r.wgs84Lon);
      if (!r.hpid || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0) continue;
      index[r.hpid] = [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
      added++;
    }
    console.log(`${src.name} p${pageNo}: ${list.length}건 (좌표 ${added}) / total ${total}`);
    if (list.length === 0) break;
  }
}

const out = path.join(root, 'data', 'coords.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index), 'utf8');
console.log(`완료: ${Object.keys(index).length}건 → ${path.relative(root, out)} (API 호출 ${calls}회, ${(fs.statSync(out).size / 1e6).toFixed(1)}MB)`);

function loadEnvLocal(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0 || line.startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = line.slice(i + 1).trim().replace(/^"|"$/g, '');
  }
}
