type Props = { fetched: string | null };

const SOURCES = [
  {
    name: '전국 명절 비상 진료기관 정보 조회 서비스',
    role: '연휴 진료 여부·시간',
    href: 'https://www.data.go.kr/data/15000480/openapi.do',
  },
  {
    name: '전국 병·의원 찾기 서비스',
    role: '병의원 위치 좌표',
    href: 'https://www.data.go.kr/data/15000736/openapi.do',
  },
  {
    name: '전국 약국 정보 조회 서비스',
    role: '약국 위치 좌표',
    href: 'https://www.data.go.kr/data/15000576/openapi.do',
  },
];

const link = 'underline decoration-line underline-offset-2 hover:text-ink';

export default function SiteFooter({ fetched }: Props) {
  return (
    <footer className="mt-14 border-t border-line pt-8 text-[13px] leading-relaxed text-mute">
      <div className="grid gap-8 md:grid-cols-3">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">데이터 출처</h2>
          <p>국립중앙의료원 중앙응급의료센터가 공공데이터포털(data.go.kr)에 공개한 Open API를 사용합니다.</p>
          <ul className="mt-2 space-y-1">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" className={link}>{s.name}</a>
                <span className="ml-1 text-mute/80">— {s.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            지도: <a href="https://map.kakao.com" target="_blank" rel="noreferrer" className={link}>카카오맵</a>.
            자료는 6시간마다 갱신되며{fetched ? `, 현재 표시 중인 자료는 ${fetched} 기준입니다` : ''}.
            공공데이터는 공공데이터포털의 이용허락 범위(공공누리·CC0) 안에서 사용합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">이용 시 유의사항</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>진료 시간은 기관 사정으로 바뀔 수 있습니다. 방문 전에 반드시 전화로 확인하세요.</li>
            <li>이 사이트는 공공데이터를 그대로 보여주는 참고용 서비스이며, 정보의 정확성과 진료 가능 여부를 보증하지 않습니다.</li>
            <li>기관 위치는 좌표 자료 기준이라 실제 출입구와 다를 수 있습니다. 길찾기는 카카오맵으로 연결됩니다.</li>
            <li>응급 상황에는 즉시 <a href="tel:119" className={`${link} font-semibold text-ink`}>119</a>에 연락하세요.
              연휴 진료기관 안내는 <a href="tel:129" className={link}>129</a>(보건복지상담센터) 또는{' '}
              <a href="https://www.e-gen.or.kr" target="_blank" rel="noreferrer" className={link}>응급의료포털 E-Gen</a>에서도 확인할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">위치 정보와 제작</h2>
          <p>
            현재 위치는 기기의 위치 권한을 허용한 경우에만 브라우저 안에서 거리 계산에 쓰이며, 서버로 전송하거나 저장하지 않습니다.
            서버에는 선택한 시·도 이름만 전달됩니다.
          </p>
          <p className="mt-2">
            제작: mouseco (개인 제작, 비영리). 오류 제보나 문의는{' '}
            <a href="mailto:mouseco1212@gmail.com" className={link}>mouseco1212@gmail.com</a>으로 보내주세요.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} mouseco. 이 사이트는 국립중앙의료원·보건복지부·카카오와 관련이 없는 개인 프로젝트입니다.</p>
        </section>
      </div>
    </footer>
  );
}
