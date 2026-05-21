// --- 1. DASHBOARD DATA & LOGIC (Daily & Monthly) ---
let dailyData = [
    { phase: "1차 마감 (영업준비)", time: "08:30 ~ 09:00", items: [
        { id: "d1", title: "CS물품 세팅", desc: "부직포 덧신, 구강스프레이, 물티슈 등 개인별 재고 확인 및 보충", done: false },
        { id: "d2", title: "복장/차량 점검", desc: "유니폼 청결(탈취제) 확인 및 영업용 차량 실내외 쓰레기 비우기", done: false },
        { id: "d3", title: "DB 할당", desc: "금일 방문 타겟 DB (노후 보일러, AS이력 등) 추출 및 기사별 동선 배차", done: false }
    ]},
    { phase: "2차 마감 (아침조회)", time: "09:00 ~ 09:30", items: [
        { id: "d4", title: "롤플레잉", desc: "직원 2인 1조 '세트 상품(업세일링)' 제안 10분 스크립트 상황극 진행", done: false },
        { id: "d5", title: "목표 공유", desc: "금일 리뷰 획득 목표 건수 및 집중 타겟(예: 맞벌이 가구 등) 공유", done: false }
    ]},
    { phase: "3차 마감 (해피콜)", time: "09:30 ~ 10:30", items: [
        { id: "d6", title: "해피콜 (아웃바운드)", desc: "전일 미결정 및 부재중 고객 대상 2차 클로징 콜 (최소 10건)", done: false },
        { id: "d7", title: "알림톡 발송", desc: "타겟 DB 대상 안심점검/프로모션 안내 1차 AI 알림톡 템플릿 발송", done: false }
    ]},
    { phase: "4차 마감 (현장영업)", time: "10:30 ~ 16:30", items: [
        { id: "d8", title: "고객안심콜", desc: "방문 예정 고객에게 '10분 전 도착 및 청결 방문' 사전 안내 전화", done: false },
        { id: "d9", title: "안심점검 실시", desc: "방문 세대 '무상 안심점검' 실시 및 시각화 리포트(수질 등) 교부", done: false },
        { id: "d10", title: "세트 역제안", desc: "점검 결과를 바탕으로 단품 수리가 아닌 '스마트 라이프 세트' 역제안", done: false },
        { id: "d11", title: "리뷰 락인", desc: "서비스 만족 고객에게 즉각 리워드(커피 등) 지급 및 현장 리뷰 유도", done: false },
        { id: "d12", title: "제휴/홍보 방문", desc: "이동 동선 내 부동산, 인테리어 업체 1~2곳 방문(명함/음료 전달)", done: false }
    ]},
    { phase: "5차 마감 (마케팅)", time: "16:30 ~ 17:30", items: [
        { id: "d13", title: "온라인 홍보", desc: "당근마켓 비즈프로필 / 지역 맘카페에 정보성 글 및 우수 시공사례 업로드", done: false },
        { id: "d14", title: "대댓글 관리", desc: "전일 및 금일 작성된 네이버/당근마켓 리뷰에 정성스러운 대댓글 달기", done: false }
    ]},
    { phase: "6차 마감 (영업결산)", time: "17:30 ~ 17:50", items: [
        { id: "d15", title: "CRM 기록", desc: "금일 거절 고객 사유(예산, 가족상의 등) 엑셀 기록 / 휴면 DB 정리", done: false },
        { id: "d16", title: "예약대장 등록", desc: "'가을에 할게요' 미룬 고객 성수기 사전 예약 대장에 꼼꼼히 등록", done: false },
        { id: "d17", title: "실적 정산", desc: "금일 총 리뷰 획득 건수, 세트 상품 판매율 및 확정 예약 건수 카운트", done: false }
    ]},
    { phase: "최종 마감 (퇴근준비)", time: "17:50 ~ 18:00", items: [
        { id: "d18", title: "익일 준비", desc: "익일 사용할 공구 및 부품 재고 파악 후 부족분 발주/채워넣기", done: false },
        { id: "d19", title: "전원/정리", desc: "개인 자리 쓰레기통 비우기, 사무실 에어컨/컴퓨터/전등 전원 OFF 확인", done: false }
    ]}
];

let weeklyData = [
    { day: "월요일", phase: "농사 준비 & 아웃바운드", items: [
        { id: "w1", title: "타겟 DB 추출", desc: "7년 이상 노후 보일러 및 겨울 AS 2회 이상 고객 선별", done: false },
        { id: "w2", title: "안심점검 1차 AI 알림톡 발송", desc: "추출된 DB 대상 알림톡 발송", done: false },
        { id: "w3", title: "미결정 고객 리마인드 콜", desc: "지난주 미결정/부재중 고객 10명 콜", done: false }
    ]},
    { day: "화요일", phase: "현장 침투 & 마케팅 씨앗", items: [
        { id: "w4", title: "시각화 리포트 작성", desc: "방문 세대마다 수질/일산화탄소 측정 리포트", done: false },
        { id: "w5", title: "세트 역제안", desc: "단품 수리가 아닌 안심케어/스마트 세트 역제안", done: false },
        { id: "w6", title: "현장 리뷰 락인", desc: "서비스 만족 고객에게 즉각 리워드 지급 및 리뷰 유도", done: false }
    ]},
    { day: "수요일", phase: "관계망 형성 & 잠재고객", items: [
        { id: "w7", title: "온수 특화 세트 어필", desc: "여름 잦은 샤워 타겟 배관 점검 후 제안", done: false },
        { id: "w8", title: "관리사무소 유대 형성", desc: "주요 아파트 기전실장/소장 방문 (음료 전달)", done: false },
        { id: "w9", title: "CRM DB 세탁", desc: "결번/이사 간 주소 등 삭제 업데이트", done: false }
    ]},
    { day: "목요일", phase: "심화 영업 & 장벽 낮추기", items: [
        { id: "w10", title: "구독 서비스 전환 유도", desc: "목돈 부담 고객에게 초기비용 없는 구독 제안", done: false },
        { id: "w11", title: "숨은 불편 체크", desc: "보일러 점검 시 에어컨/환기청정기 슬쩍 확인", done: false },
        { id: "w12", title: "당근마켓 소식 발행", desc: "비즈프로필 단골 맺기 및 유용한 정보 발행", done: false }
    ]},
    { day: "금요일", phase: "주간 결산 & 주말 준비", items: [
        { id: "w13", title: "미결정 마무리 콜", desc: "이번 주 상담 고객 중 미결정자에게 결심 촉구 콜", done: false },
        { id: "w14", title: "ROI 대시보드 점검", desc: "이번 주 리뷰 달성 및 예약 건수 결산", done: false },
        { id: "w15", title: "성수기 예약 대장 업데이트", desc: "예약 대장 최신화 및 다음주 컨택 알람 세팅", done: false }
    ]},
    { day: "토요일", phase: "주말 틈새시장 공략", items: [
        { id: "w16", title: "맞벌이/1인가구 집중 방문", desc: "평일 부재중이었던 핵심 타겟 방문 점검", done: false },
        { id: "w17", title: "부동산 공실 무료 점검", desc: "당직 부동산 방문하여 공실 보일러 점검해주며 인맥 쌓기", done: false },
        { id: "w18", title: "금주 최종 결산 및 칼퇴근", desc: "누적 확정건수 카운트 후 공구함 정리", done: false }
    ]}
];

let monthlyData = {
    "5": {
        title: "5월: 준비 및 사전 탐색",
        desc: "본격적인 여름 비성수기를 앞두고, 농사지을 밭을 고르고 씨앗을 준비하는 달입니다.",
        categories: [
            { name: "마케팅/홍보 (Marketing)", items: ["최근 7년 이상 노후 보일러 설치 이력 고객 DB 엑셀 추출", "지난 겨울 AS 2회 이상 고위험군 DB 별도 분류 및 데이터 정제", "당근마켓 비즈프로필 점검 및 네이버 플레이스 정보 최신화"] },
            { name: "현장/서비스 (Service)", items: ["여름용 여벌 유니폼 점검 및 클린 CS 물품(탈취제, 덧신) 확보", "'여름철 안심점검' 1차 AI 알림톡 템플릿 세팅 및 순차 발송", "전 직원 업무용 차량 실내외 세차 및 노후 공구 교체"] },
            { name: "영업/예약 (Sales)", items: ["추출 타겟 리스트 영업 담당자 배분 및 120일 플랜 목표 공유", "안심점검 방문 시 제안할 '비수기 특별 세트' 견적서 양식 리뉴얼", "인근 대형 부동산, 인테리어 업체 리스트업 및 제휴 컨택 포인트 정리"] }
        ]
    },
    "6": {
        title: "6월: 구축 및 씨앗 뿌리기",
        desc: "정제된 타겟 고객과 세팅된 무기를 바탕으로 본격적인 온/오프라인 홍보를 시작합니다.",
        categories: [
            { name: "마케팅/홍보 (Marketing)", items: ["핵심 아파트 단지 게시판 및 엘리베이터(BIT) 광고 시작", "지역 당근마켓/맘카페에 상업적 홍보 제외 정보성 꿀팁 글 업로드", "현장 방문 시 즉시 사용할 리뷰 이벤트용 기프티콘 예산 배정"] },
            { name: "현장/서비스 (Service)", items: ["세팅된 '여름 안심점검' 1차 AI 알림톡 전체 타겟 100% 발송 완료", "알림톡 클릭/열람 고객(Hot DB) 48시간 내 점검 유도 해피콜 진행", "기사님 클린 CS (덧신, 탈취제) 100% 이행 여부 불시 점검"] },
            { name: "영업/예약 (Sales)", items: ["안심점검 예약 고객 대상 '스마트 라이프 세트' 견적서 사전 모바일 발송", "무상점검 완료 후 견적서 바탕 현장 업세일링 대면 브리핑 실시", "거절 고객 사유 일지 기록 및 직원 간 매주 피드백 진행"] }
        ]
    },
    "7": {
        title: "7월: 방문 및 경험 창출",
        desc: "폭염 속 쾌적한 B/S 점검으로 감동을 주고, 이를 온라인 리뷰 자산으로 전환합니다.",
        categories: [
            { name: "마케팅/홍보 (Marketing)", items: ["현장 리뷰 작성 시 즉각 리워드(기프티콘 등) 100% 지급 실행", "당근마켓/블로그에 '우수 점검 비포/애프터' 게시글 업로드 (바이럴)", "작성된 모든 네이버/당근 리뷰에 점장 명의 정성스러운 대댓글 달기"] },
            { name: "현장/서비스 (Service)", items: ["확보된 타겟 DB 대상 방문 점검 스케줄 풀가동 및 배차", "폭염 대비 사전 안심콜(청결 방문 강조) 및 시각화 점검 리포트 교부", "보일러 외 가스누출 탐지 시연 등 '플러스 알파' 서비스로 감동 유발"] },
            { name: "영업/예약 (Sales)", items: ["단품 교체 부담 고객 대상 '성수기 사전 예약 특별 단가' 제안 및 락인", "6월 세트 제안 보류 고객 대상 여름 한정 프로모션 명분 2차 해피콜", "점검 중 발견된 소모품 수리 현장 즉시 결제 유도로 비수기 운영비 확보"] }
        ]
    },
    "8": {
        title: "8월: 수확 및 겨울 예약 락인",
        desc: "비성수기 작전의 마지막 달. 가을/겨울 성수기 매출을 미리 확정 짓습니다.",
        categories: [
            { name: "마케팅/홍보 (Marketing)", items: ["누적된 베스트 리뷰를 '우리 동네 안심 대리점' 카드뉴스로 가공", "당근마켓 '가을 성수기 전 마지막 비수기 혜택' 소식 발행 및 푸시", "오프라인(아파트/BIT) 광고 콜 인입 성과 분석 및 가을 연장 여부 결정"] },
            { name: "현장/서비스 (Service)", items: ["1차 알림톡 미반응 고객 대상 '점검 마감 임박' 안내 2차 문자 발송", "폭염 CS(유니폼, 덧신) 최종 유지 및 서비스 피드백 취합(가을 매뉴얼화)"] },
            { name: "영업/예약 (Sales)", items: ["가을로 교체 미루던 고객 집중 컨택, '성수기 사전 예약 대장' 최종 등록", "단품 교체 고집 고객에게 무료 업그레이드 등 막바지 강력한 세트 딜 제안", "제휴처(부동산 등) 재방문하여 가을 이사철 소개 물량 선확보 딜 확정"] }
        ]
    }
};

// --- 2. PROMPT STUDIO DATA ---
const PROMPT_LANG_HEADER = `[CRITICAL OUTPUT LANGUAGE]
- Write the ENTIRE deliverable in Korean (한국어). This prompt is written in English so the model can reason more richly, but the audience is Korean boiler dealer owners and field staff who will execute the output directly.
- Keep Korean industry terms exactly as-is in the output: 대리점, 무상점검, 안심점검, 알림톡, 해피콜, 클린 CS, B/S, 성수기, 비수기, 객단가, 리뷰 락인, A/B/C 리드등급, 구축 아파트, 단지, 임대인, 세입자.
- Do not translate region names, complex names, brand names, or proper nouns that appear in [Our Dealer Field Profile]. Use them verbatim.
- The honorific tone for customer-facing scripts must follow Korean business politeness (해요체 with appropriate 존댓말). Internal staff scripts may use 합니다체.

`;

const PROMPT_LANG_FOOTER = `

[Final reminder]
- The final deliverable above must be in Korean. Do not output English sentences in the final deliverable except for unavoidable abbreviations (AI, KPI, CRM, B/S, QR).
- Tables, bullet lists, sample messages, and verbal scripts — all in Korean.
- If a section is missing input from [Our Dealer Field Profile], mark it as [수정 필요] in Korean instead of leaving it in English.`;

const COMMON_FIELDS = [
    { id: 'dealer',    label: '대리점명',     placeholder: '예: ○○보일러 강동대리점' },
    { id: 'region',    label: '담당 지역',     placeholder: '예: 서울 강동구 고덕동·명일동' },
    { id: 'customers', label: '핵심 고객층',   placeholder: '예: 15년 이상 구축 아파트 거주자, 고령자 가정' },
];

const COMMON_SAMPLE = {
    dealer: '○○보일러 강동대리점',
    region: '서울 강동구 고덕동, 명일동, 암사동',
    customers: '15년 이상 구축 아파트 거주자, 고령자 가정, 맞벌이 부부',
};

function _wrap(role, contextLabel, specificLines, body){
    return PROMPT_LANG_HEADER + 'You are ' + role + '.\n\n' +
        '[Our Dealer Context]\n' +
        '- Dealer (대리점명): {dealer}\n' +
        '- Service area (담당 지역): {region}\n' +
        '- Primary customer segment (주요 고객층): {customers}\n\n' +
        '[Specific Inputs for ' + contextLabel + ']\n' +
        specificLines + '\n\n' +
        body + PROMPT_LANG_FOOTER;
}

const PROMPTS = [
    {
        id: 'db',
        title: '고객 DB 분류표',
        tag: 'CRM · 리드등급',
        summary: '기존 고객 DB를 A/B/C 우선순위로 나누고 무상점검·견적·예약 액션을 정리합니다.',
        fields: [
            { id: 'dbSize', label: 'DB 규모', placeholder: '예: 약 1,200명' },
            { id: 'asKeywords', label: '최근 6개월 AS 키워드', placeholder: '온수 지연, 누수, 소음', type: 'textarea' },
            { id: 'segmentBreakdown', label: '세그먼트 비율', placeholder: '구축 아파트 60%, 빌라 30%, 상가 10%', type: 'textarea' },
        ],
        sample: { dbSize: '약 1,200명', asKeywords: '온수 지연\n난방 편차\n보일러 소음', segmentBreakdown: '구축 아파트 60%\n빌라 30%\n상가 10%' },
        outputSections: ['7개 컬럼 고객 분류표', 'A/B/C 우선순위 등급', '추천 멘트', '이번 주 DB 추출 5단계'],
        prompt: _wrap(
            'a CRM consultant designing the off-season sales strategy for a Korean boiler dealer',
            'Customer DB Classification',
            '- Database size: {dbSize}\n- Top 6-month AS keywords: {asKeywords}\n- Customer segment breakdown: {segmentBreakdown}',
            `[Objective]
During the summer off-season, classify the existing customer database into:
1) free inspection (무상점검) candidates, 2) high replacement-probability customers,
3) review collection candidates, 4) peak-season reservation (성수기 예약) candidates.

[Required Content]
- Years since installation, recent AS history, discomfort keywords (온수, 난방, 소음, 누수).
- Safety-sensitive households (고령자, 영유아, 환자 가정).
- Regional housing characteristics (구축 아파트, 빌라, 상가).
- Customers eligible for review requests and unconverted quote inquiries.

[Output Format]
Korean-language table:
| 타깃 고객군 | CRM 필터 조건 | 확인해야 할 핵심 컬럼 | 고객에게 할 액션 | 우선순위 등급 | 현장 맞춤 설명 | 추천 멘트 |

[Writing Guidelines]
- Tier customers A/B/C. Reflect this dealer's region, segments, and field issues in every row.
- The table must be copy-paste ready into CRM or Excel.
- End with section "이번 주 바로 실행할 DB 추출 순서 5단계".`
        )
    },
    {
        id: 'call',
        title: '알림톡·해피콜 스크립트',
        tag: '문자 · 전화 대본',
        summary: '무상 안심점검 안내, 해피콜 1차 대본, 거절 대응 문구를 만듭니다.',
        fields: [
            { id: 'toneStyle', label: '말투 톤', placeholder: '친근 / 공식 / 캐주얼' },
            { id: 'preferredChannels', label: '선호 채널', placeholder: '알림톡, 문자, 전화 (가능한 채널)' },
            { id: 'recentResponse', label: '최근 응답률', placeholder: '예: 알림톡 18%, 전화 24%' },
        ],
        sample: { toneStyle: '친근하면서도 신뢰감 있는 톤', preferredChannels: '알림톡 우선, 미응답 시 전화', recentResponse: '알림톡 응답률 12%, 통화 연결율 30%' },
        outputSections: ['알림톡 3종 (기본형/구축아파트/온수불만)', '해피콜 1차 대본 (6단계)', '거절 대응 표 7가지', '후속 문자 4종', '체크리스트'],
        prompt: _wrap(
            'a sales copywriter producing customer outreach scripts for a Korean boiler dealer',
            'Alimtalk / Happy-call Scripts',
            '- Preferred tone: {toneStyle}\n- Preferred channels: {preferredChannels}\n- Recent response rates: {recentResponse}',
            `[Objective]
Before the winter peak, contact existing customers for a free safety inspection (무상 안심점검) and convert into visit reservations, quote consultations, and pre-season reservations.

[Required Deliverables]
1. Three alimtalk (알림톡) variants: 기본형 / 구축 아파트 거주자형 / 온수 불만 고객형
2. Happy-call (해피콜) 1차 대본: 오프닝 / 과거 이용 이력 / 불편 확인 / 무상점검 안내 / 일정 제안 / 마무리
3. Objection scripts for: "멀쩡해요." "돈 드나요?" "바빠요." "다음에요." "가격만 알려주세요." "가족이랑 상의할게요." "다른 데도 알아보고 있어요."
4. Follow-up texts for: 부재 / 일정 미확정 / 견적 미결정 / 성수기 예약 유도

[Writing Guidelines]
- Avoid pushy tone. Add trust phrases: 강매 없음 / 출장비 0원 / 점검 결과만 안내 — mark [수정 필요] if dealer policy differs.
- Alimtalk under 500 Korean characters each.
- Happy-call must be spoken Korean (구어체) so staff can read aloud.

[Output Format]
1. 알림톡 3종  2. 해피콜 1차 대본 표  3. 거절 대응 표  4. 후속 문자 4종  5. 수정해야 할 항목 체크리스트`
        )
    },
    {
        id: 'cs',
        title: '클린 CS 매뉴얼',
        tag: '현장 품질관리',
        summary: '기사 방문 8단계 품질을 표준화하고 점검 방문을 리뷰·예약으로 연결합니다.',
        fields: [
            { id: 'staffCount', label: '기사 인원', placeholder: '예: 3명' },
            { id: 'equipmentList', label: '보유 장비', placeholder: '공기질 측정기, 수질키트, 보양매트 등', type: 'textarea' },
            { id: 'avgVisitTime', label: '평균 방문 시간', placeholder: '예: 1시간 20분' },
        ],
        sample: { staffCount: '3명', equipmentList: '공기질 측정기 있음\n수질 간이키트 있음\n보양매트·덧신·QR 리뷰카드 있음', avgVisitTime: '1시간 30분' },
        outputSections: ['8단계 체크리스트 표', '대체 행동 (장비 없을 시)', '5분 브리핑 멘트'],
        prompt: _wrap(
            'a field-service quality manager building the clean-CS playbook for a Korean boiler dealer',
            'Clean-CS Checklist',
            '- Technician count: {staffCount}\n- Equipment available: {equipmentList}\n- Average visit duration: {avgVisitTime}',
            `[Objective]
Standardize technician visit quality to reduce complaints, and convert free-inspection visits into reviews, repeat visits, and peak-season reservations.

[Required Sections]
1. 출발 전  2. 고객 연락 전  3. 방문 직전  4. 자택 진입  5. 점검 중
6. 결과 설명  7. 퇴실 전  8. 방문 후 기록

[Required Items]
유니폼·명찰·사원증, 덧신·보양매트·쓰레기봉투·극세사천, 공기질 측정기/수질키트 보유 여부, 10~20분 전 연락, 방문 목적 재안내, 사진 동의, 불편 키워드 확인, 정상/주의/조치필요 3단계 설명, 현장 정리, 솔직 리뷰 요청, CRM 기록.

[Output Format]
Korean table:
| 구간 | O/X 체크항목 | 담당자 | 고객에게 보이는 행동 | 주의할 말 | 완료 후 기록 |

[Writing Guidelines]
- For equipment the dealer does NOT own, provide a "대체 행동" (substitute action).
- Reflect this dealer's customer segments (고령자, 맞벌이, 임대인 등).
- End with "기사 교육용 5분 브리핑 멘트".`
        )
    },
    {
        id: 'bs',
        title: '하절기 B/S 안심점검표',
        tag: '무상점검 · 증거화',
        summary: '여름 무상점검 시 보여줄 증거 중심의 10구역 점검표.',
        fields: [
            { id: 'inspectionHours', label: '점검 가능 시간대', placeholder: '예: 평일 10-18시, 토 10-14시' },
            { id: 'inspectionTools', label: '점검 장비', placeholder: '공기질 측정기, 수질키트 등', type: 'textarea' },
            { id: 'avgInspectTime', label: '평균 점검 시간', placeholder: '예: 40분' },
        ],
        sample: { inspectionHours: '평일 09:30-18:00, 토 10:00-14:00', inspectionTools: '공기질 측정기\n수질 간이키트\n온도계·습도계', avgInspectTime: '40분' },
        outputSections: ['10구역 점검표', '판정 기준 4단계', '3분 결과 안내 멘트', '결과별 후속 액션'],
        prompt: _wrap(
            'a technical-sales specialist designing the summer free-inspection program (하절기 무상점검) for a Korean boiler dealer',
            'Summer B/S Inspection Checklist',
            '- Inspection hours: {inspectionHours}\n- Tools on hand: {inspectionTools}\n- Average inspection time: {avgInspectTime}',
            `[Objective]
Leave visible evidence at every summer inspection visit, converting routine inspection into pre-winter preventive maintenance, replacement consideration, and peak-season reservation.

[Required Inspection Zones]
1. 보일러 본체  2. 배기통·연통  3. 온수  4. 난방  5. 누수·부식
6. 소음·진동  7. 환기  8. 공기질  9. 수질  10. 고객 생활 불편사항

[Output Format]
Korean table:
| 구역 | 점검항목 | 점검 방법 | 고객에게 보여줄 증거 | 판정 기준 | 판정 결과 | 다음 액션 |

[Decision Tiers]
정상 / 주의 / 조치필요 / 교체검토

[Writing Guidelines]
- Include replacement-likelihood by installation age (4~6년 예방관리, 7년 이상 교체검토).
- Use "예방점검" framing, never scare tactics.
- If specific tools are missing, provide alternative inspection methods.
- Add "3분 결과 안내 멘트" after the table.
- Add per-tier follow-up actions: 정상 → 리뷰 요청 / 주의 → 9월 전 재점검 / 조치필요 → 견적 안내 / 교체검토 → 성수기 예약 제안.`
        )
    },
    {
        id: 'upsell',
        title: '업세일링 3대 패키지',
        tag: '패키지 · 객단가',
        summary: '가격 비교 회피용 문제 해결형 패키지 3~5종을 설계합니다.',
        fields: [
            { id: 'targetAvgRevenue', label: '객단가 목표', placeholder: '예: 평균 150만원' },
            { id: 'priceRange', label: '가격대 범위', placeholder: '예: 80~250만원' },
            { id: 'mainProducts', label: '주력 제품', placeholder: '제조사 및 모델군', type: 'textarea' },
        ],
        sample: { targetAvgRevenue: '평균 180만원', priceRange: '90~280만원', mainProducts: '경동나비엔 NCB 시리즈\n귀뚜라미 듀얼파워' },
        outputSections: ['패키지 5종 비교표', '제안 멘트', '가격 설명 방식', '거절 대응', '진단 질문 7개'],
        prompt: _wrap(
            'a sales strategist designing upsell packages for a Korean boiler dealer',
            'Upsell Packages',
            '- Target per-customer revenue (객단가): {targetAvgRevenue}\n- Price range: {priceRange}\n- Main product lineup: {mainProducts}',
            `[Objective]
Stop customers from comparing on price alone. Convert each consultation into a problem-solving package that raises 객단가 and reservation conversion.

[Required Base Packages]
1. 안심 케어 세트 — Target: 7+ year users, repeat-AS customers, 고령자 가정
2. 스마트 라이프 세트 — Target: 맞벌이, 외출 잦은 가정, 임대인
3. 온수 특화 세트 — Target: 온수 지연, 수압 불만, 녹물·염소 냄새 고객

Add 1~2 more packages tailored to this dealer (구축 아파트 집중, 임대인 관리, 상가 영업중단 최소화, 고령자 안전 등).

[Output Format]
Korean table:
| 패키지명 | 구성 | 타깃 고객 | 고객 불편 포인트 | 제안 멘트 | 가격 설명 방식 | 후속 액션 |

[Writing Guidelines]
- Leave product names/prices as [제품명 입력], [가격 입력] placeholders.
- Frame each package as "problem solving," not "cheap product".
- Add per-package objection-handling script.
- End with "상담 시 패키지 선택 질문 7개".`
        )
    },
    {
        id: 'marketing',
        title: 'SNS · 리뷰 4주 캘린더',
        tag: '4주 실행계획',
        summary: '네이버 플레이스, 지역카페, 단지 게시판, 리뷰 요청을 4주 액션으로 정리.',
        fields: [
            { id: 'channels', label: '운영 채널', placeholder: '네이버 플레이스, 지역카페, 인스타, 유튜브 등', type: 'textarea' },
            { id: 'contentTone', label: '콘텐츠 톤', placeholder: '예: 친근/정보형/전문가형' },
            { id: 'currentReviews', label: '현재 리뷰 수', placeholder: '예: 네이버 73건, 평점 4.7' },
        ],
        sample: { channels: '네이버 플레이스\n맘카페(고덕맘)\n인스타 @○○보일러강동', contentTone: '친근하면서 전문가 같은 톤', currentReviews: '네이버 73건/평점 4.7, 카카오 28건' },
        outputSections: ['4주 마케팅 캘린더', '네이버 플레이스 공지문 1개', '지역카페 글 1개', '아파트 게시판 안내문 1개', '월말 점검표'],
        prompt: _wrap(
            'a local marketing manager for a Korean boiler dealer',
            '4-Week SNS/Review Calendar',
            '- Active channels: {channels}\n- Content tone: {contentTone}\n- Current review counts: {currentReviews}',
            `[Objective]
During the May~August off-season, grow free-inspection visits while simultaneously building Naver Place reviews, local-cafe responses, complex bulletin reach, and peak-season reservations.

[Required Channels]
기존 고객 알림톡 / 네이버 플레이스 공지 / 지역카페 생활정보 글 / 아파트 단지 게시판 / 방문 QR 리뷰카드 / 점검 후 리마인드 문자 / 성수기 예약대장 정리.

[Output Format]
Korean table covering Week 1~4:
| 주차 | 핵심 목표 | 실행 액션 | 사용할 문구/콘텐츠 | 담당자 | KPI | 주의사항 |

[Writing Guidelines]
- Reflect this dealer's region, complex names, housing type, and customer segment.
- Include 1 example Naver Place 공지문, 1 example 지역카페 생활정보 글, 1 example 아파트 게시판 안내문 — all in Korean.
- Review requests must never look like coerced-positive reviews. Frame as "솔직한 후기" requests to satisfied customers.
- End with "이번 달 마케팅 점검표".`
        )
    },
    {
        id: 'reservation',
        title: '성수기 예약 대장',
        tag: '예약관리 · 재콜',
        summary: '비수기 점검·견적·보류 고객을 9~12월 성수기 예약으로 전환하는 대장.',
        fields: [
            { id: 'managementTool', label: '사용 도구', placeholder: '엑셀 / 구글시트 / CRM' },
            { id: 'avgLeadTime', label: '예약 평균 리드타임', placeholder: '예: 8주' },
            { id: 'peakMonths', label: '성수기 월', placeholder: '예: 10-12월' },
        ],
        sample: { managementTool: '구글시트 + 카카오톡 알림', avgLeadTime: '6~10주', peakMonths: '10~12월 (특히 11월)' },
        outputSections: ['20개 컬럼 대장 양식', 'A/B/C 리드등급 기준', '보류사유별 재콜 멘트', '5월~9월 운영 프로세스'],
        prompt: _wrap(
            'a sales-operations consultant designing the peak-season reservation management system',
            'Peak-Season Reservation Log (성수기 예약 대장)',
            '- Current tool: {managementTool}\n- Average lead time: {avgLeadTime}\n- Peak season months: {peakMonths}',
            `[Objective]
Convert inspection/quote/on-hold customers gathered May~August into confirmed September~December installation/repair/replacement reservations.

[Required Columns]
예약ID, 고객ID, 고객명, 연락처, 주소/단지명, 설치경과년수, 현재 보일러 모델, 리드등급, 현재상태, 보류사유, 희망공사월, 관심패키지, B/S 점검 결과, 주의항목수, 조치필요수, 다음컨택일, 담당자, 리뷰상태, 최종결과, 비고.

[Status Vocabulary]
신규, 알림톡발송, 통화완료, 점검예약, 점검완료, 견적발송, 가족상담중, 타사비교중, 예약확정, 구매완료, 거절, 수신거부.

[Hold-Reason Vocabulary]
비용, 일정, 가족상담, 타사비교, 아직 정상작동, 임대인 승인 필요, 세입자 일정 미정.

[Output Format]
Korean table:
| 컬럼명 | 입력 예시 | 선택값 | 관리 목적 | 재콜 기준 | 담당자 메모 |

[Writing Guidelines]
- Directly copyable into Excel/Google Sheets.
- Define explicit A/B/C 리드등급 criteria.
- Define rules to prevent missed 다음컨택일.
- Per-hold-reason 재콜 멘트.
- End with process flow "5월 알림톡 → 6월 무상점검 → 7월 리뷰·패키지 제안 → 8~9월 성수기 예약 확정".`
        )
    },
    {
        id: 'complex',
        title: '단지 공략 전략맵',
        tag: '타깃 단지 선정',
        summary: '후보 단지를 점수 매트릭스로 평가해 1~3순위 단지를 선정하고 진입 전술을 설계.',
        fields: [
            { id: 'candidateComplexes', label: '후보 단지 5개', placeholder: '고덕 그라시움\n명일 한양\n암사 동아', type: 'textarea' },
            { id: 'complexAttributes', label: '단지 특성', placeholder: '가구수 / 입주연도 / 평균 평수', type: 'textarea' },
            { id: 'pastInstalls', label: '과거 시공 이력', placeholder: '단지별 시공 건수', type: 'textarea' },
        ],
        sample: { candidateComplexes: '고덕 그라시움\n명일 한양\n암사 동아\n천호 우성\n둔촌 푸르지오', complexAttributes: '고덕 그라시움 4932세대 2019년식\n명일 한양 1342세대 2003년식\n암사 동아 1064세대 1999년식', pastInstalls: '고덕 그라시움 12건\n명일 한양 38건\n암사 동아 56건' },
        outputSections: ['단지별 점수 매트릭스', '1~3순위 단지 + 근거', '단지별 진입 전술', '8주 단지 공략 캘린더'],
        prompt: _wrap(
            'a territory strategist for a Korean boiler dealer',
            'Apartment Complex Targeting',
            '- Candidate complexes (up to 5): {candidateComplexes}\n- Complex attributes: {complexAttributes}\n- Past installation history per complex: {pastInstalls}',
            `[Objective]
Identify which 1~3 complexes this dealer should attack first this off-season, and design specific entry tactics per complex.

[Required Content]
- Score matrix weighted equally: 가구수, 입주연도, 우리 시공이력, 경쟁사 침투 강도.
- Top 3 ranking with explicit rationale (Korean).
- Per-complex entry tactic: 게시판 / 입주민 단톡 / 관리사무소 협의 / 인근 점포 제휴 / QR 리뷰 콜렉션 등.
- 8-week 단지 공략 캘린더.

[Output Format]
Three Korean tables:
| 단지명 | 가구수 | 입주연도 | 우리 시공 이력 | 경쟁 강도 | 종합 점수 | 우선순위 |
| 단지명 | 진입 전술 | 핵심 메시지 | 사용 채널 | 1주차 액션 | KPI |
| 주차 | 핵심 액션 | 담당자 | 산출물 |

[Writing Guidelines]
- Use the actual complex names and household counts from the inputs.
- Each tactic must be executable this week.
- End with "이번 주 바로 시작할 단지 공략 액션 7가지".`
        )
    },
    {
        id: 'competitor',
        title: '경쟁사 차별화 포지셔닝',
        tag: '메시지 · USP',
        summary: '경쟁사 강점·약점을 분석하고 우리만의 차별화 메시지와 응대 스크립트를 만듭니다.',
        fields: [
            { id: 'mainCompetitors', label: '주요 경쟁사', placeholder: '예: ○○가스, △△설비', type: 'textarea' },
            { id: 'competitorStrengths', label: '경쟁사 강점·약점', placeholder: '강점/약점을 적어주세요', type: 'textarea' },
            { id: 'ourUSP', label: '우리만의 USP', placeholder: '우리 대리점이 자신 있는 것', type: 'textarea' },
        ],
        sample: { mainCompetitors: '○○가스 강동지사\n△△설비 (개인 사업자)', competitorStrengths: '○○가스: 본사 브랜드 신뢰도 높음 / 가격 저렴 / 단지 시공 경험 적음\n△△설비: 빠른 출장 / 사후 관리 미흡', ourUSP: '같은 단지 시공 50건 이상\n토요일 방문 가능\n점검 리포트 무료 제공\n강매 없음' },
        outputSections: ['경쟁사 비교 매트릭스', '핵심 차별화 메시지 5종', '경쟁사 비교 시 응대 스크립트', '광고/리뷰 카피 5종'],
        prompt: _wrap(
            'a positioning strategist for a Korean boiler dealer',
            'Competitive Differentiation',
            '- Main competitors: {mainCompetitors}\n- Competitor strengths/weaknesses: {competitorStrengths}\n- Our USPs: {ourUSP}',
            `[Objective]
Identify the dealer's unique positioning vs. main competitors, and produce sales messages + customer-facing scripts that win the consultation when a customer says "다른 데도 알아보고 있어요".

[Required Content]
- Competitor comparison matrix: 가격대, 출장 속도, AS, 단지 시공 경험, 사장님 신뢰도, 사후 관리.
- 5 핵심 차별화 메시지 (one-liners, Korean).
- Customer-facing script for "다른 데도 알아보고 있어요" with 3 versions (가격 비교형 / AS 비교형 / 사장님 신뢰형).
- 5 광고/리뷰 카피 (Naver Place 공지, 지역카페 댓글, 알림톡 1줄, QR 리뷰카드 문구, 명함 뒷면).

[Output Format]
Korean tables and bullet lists.

[Writing Guidelines]
- Never disparage competitors directly. Position our strengths as customer benefit.
- All scripts in Korean honorifics (해요체).
- End with "고객이 '○○가스가 더 싸요'라고 할 때 30초 응답법".`
        )
    },
    {
        id: 'b2b',
        title: '상가·임대인 B2B 영업 확장',
        tag: 'B2B 플레이북',
        summary: '상가·임대인·대형 단지 관리사무소를 대상으로 한 B2B 확장 플레이북.',
        fields: [
            { id: 'targetCommercial', label: '타깃 상가 유형', placeholder: '예: 음식점, 미용실, 모텔, 학원' },
            { id: 'targetLandlords', label: '타깃 임대인 풀', placeholder: '예: 다세대 5호 이상 보유 임대인', type: 'textarea' },
            { id: 'b2bCurrentRatio', label: '현재 B2B 매출 비중', placeholder: '예: 약 12%' },
        ],
        sample: { targetCommercial: '음식점, 미용실, 모텔, 학원, 헬스장', targetLandlords: '다세대 5호 이상 보유 임대인\n오피스텔 관리회사\n원룸 건물주', b2bCurrentRatio: '약 15% (목표 30%)' },
        outputSections: ['타깃 B2B 세그먼트 5종', 'B2B 제안서 템플릿', '계약 단가표', '관리사무소 협의 스크립트', 'B2B 영업 12주 로드맵'],
        prompt: _wrap(
            'a B2B sales strategist expanding a Korean boiler dealer into commercial / landlord channels',
            'B2B Commercial / Landlord Expansion',
            '- Target commercial types: {targetCommercial}\n- Target landlord pool: {targetLandlords}\n- Current B2B revenue ratio: {b2bCurrentRatio}',
            `[Objective]
Expand into commercial tenants (상가) and landlord-owned multi-unit properties (다세대/오피스텔/원룸 건물주) to stabilize off-season revenue.

[Required Content]
- 5 B2B target segments with size estimates and pain points.
- B2B 제안서 1-page template (대상, 우리 강점, 가격 구조, 사후관리, 시공 후 보장).
- Contract unit-pricing table (호당 / 평당 / 월 정기 점검비).
- 관리사무소 협의 스크립트 (5분 미팅용).
- 12-week B2B sales roadmap.

[Output Format]
Korean tables, sample 제안서, sample scripts.

[Writing Guidelines]
- B2B contracts emphasize 영업중단 최소화, 정기 점검, 단가 안정.
- Include "임대인이 자주 묻는 5가지" objection-handling.
- End with "이번 주 만나야 할 B2B 타깃 5곳".`
        )
    },
    {
        id: 'kpi',
        title: '기사 KPI · 인센티브 설계',
        tag: '인사 · 동기부여',
        summary: '기사·직원의 KPI 지표와 인센티브 구조, 월말 평가 양식을 설계합니다.',
        fields: [
            { id: 'techCount', label: '기사 인원', placeholder: '예: 3명 (정직원 2 + 외주 1)' },
            { id: 'avgWage', label: '평균 임금', placeholder: '예: 정직원 월 320만원' },
            { id: 'existingIncentive', label: '기존 인센티브', placeholder: '현재 운영 중인 인센티브가 있다면', type: 'textarea' },
        ],
        sample: { techCount: '정직원 2명 + 외주 1명', avgWage: '정직원 320만원, 외주 건당 4만원', existingIncentive: '월 매출 3000만 초과 시 5% 보너스\n리뷰 1건당 5천원' },
        outputSections: ['KPI 지표 8개 (정의·산식·목표·가중치)', '인센티브 구조표', '월말 평가 양식', '동기부여 멘트 모음'],
        prompt: _wrap(
            'a sales-operations consultant designing field-staff KPI and incentive structure for a Korean boiler dealer',
            'Technician KPI & Incentive Design',
            '- Technician count: {techCount}\n- Average wage / contractor rate: {avgWage}\n- Existing incentive structure: {existingIncentive}',
            `[Objective]
Design 6~8 measurable KPIs for technicians and an incentive structure that motivates inspection completion, review collection, upsell, and CS quality.

[Required KPIs]
- 무상점검 완료율, 견적 전환율, 리뷰 획득율, 재방문 비율, CS 불만율, 패키지 업세일 건수, 성수기 예약 전환율, 평균 객단가.

[Output Format]
Korean tables:
| KPI 지표 | 정의 | 산식 | 월 목표 | 가중치 | 평가 방법 |
| 등급 | 조건 | 인센티브 | 비고 |
| 평가 항목 | 점수 | 코멘트 |

[Writing Guidelines]
- Avoid over-pressure tone — KPIs should feel achievable.
- Include peer-comparison style ("3명 중 1등 기사 보너스") AND absolute targets.
- Add "월말 1-1 면담 멘트 5종" for 사장님 → 기사.
- End with "이번 달 핵심 KPI 3개와 1개 보너스 캠페인".`
        )
    },
    {
        id: 'cashflow',
        title: '분기별 현금흐름·손익 시뮬레이션',
        tag: '재무 · 비수기 생존',
        summary: '월 매출/고정비/비수기 하락폭을 기반으로 분기별 현금흐름과 손익을 시뮬레이션.',
        fields: [
            { id: 'monthlyRevenue', label: '월 매출 평균', placeholder: '예: 4500만원' },
            { id: 'offSeasonDrop', label: '비수기 매출 하락폭', placeholder: '예: 성수기 대비 40% 감소' },
            { id: 'fixedCost', label: '월 고정비', placeholder: '예: 임차 200만, 인건비 1800만, 기타 300만', type: 'textarea' },
        ],
        sample: { monthlyRevenue: '평균 4800만원 (성수기 7500만, 비수기 2900만)', offSeasonDrop: '약 40~45% 감소', fixedCost: '임차 220만\n인건비 정직원 2명 640만\n외주비 평균 200만\n기타(차량, 보험, 통신) 280만' },
        outputSections: ['12개월 현금흐름 표', '분기별 손익 시뮬레이션', '비수기 자금 보강 옵션 5개', '월 단위 액션 캘린더'],
        prompt: _wrap(
            'a financial planner advising a Korean boiler dealer on off-season cash management',
            'Quarterly Cashflow & P&L Simulation',
            '- Monthly revenue (avg / peak / off): {monthlyRevenue}\n- Off-season revenue drop: {offSeasonDrop}\n- Monthly fixed costs: {fixedCost}',
            `[Objective]
Project the dealer's 12-month cashflow and quarterly P&L. Identify which months go negative, and propose concrete corrective actions before they hit.

[Required Content]
- 12-month cashflow table (월 매출 / 변동비 / 고정비 / 영업이익 / 누적 현금).
- Quarterly P&L summary with key ratios (영업이익률, BEP 도달월).
- 5 corrective options ranked by feasibility: 비수기 알림톡 캠페인, B2B 정기점검 계약, 외주 비중 조정, 단가 조정, 운영자금 대출 등.
- Month-by-month action calendar.

[Output Format]
Korean tables, simulated numbers based on the dealer's inputs.

[Writing Guidelines]
- Use Korean Won (만원 단위).
- All assumptions clearly stated.
- End with "이번 분기 사장님이 결정해야 할 재무 의사결정 3가지".`
        )
    },
    {
        id: 'vip',
        title: 'VIP 락인 · 추천 마케팅',
        tag: '리텐션 · 추천',
        summary: 'VIP 정의·혜택·추천 마케팅 흐름을 설계해 안정적인 매출 기반을 만듭니다.',
        fields: [
            { id: 'vipDefinition', label: 'VIP 정의', placeholder: '예: 3년 이상 거래 + 2회 이상 시공' },
            { id: 'vipCount', label: '현재 VIP 수', placeholder: '예: 약 80명' },
            { id: 'vipBenefits', label: '보유 혜택', placeholder: '있다면 적어주세요', type: 'textarea' },
        ],
        sample: { vipDefinition: '3년 이상 거래 + 2회 이상 시공 또는 단지 추천자', vipCount: '약 80명', vipBenefits: '연 1회 무상점검\n신제품 출시 시 5% 우선 할인' },
        outputSections: ['VIP 등급 정의 (Silver/Gold/Platinum)', 'VIP 전용 혜택 매트릭스', '추천 마케팅 룰', 'VIP 전용 알림톡 시즌별 3종', '리텐션 KPI'],
        prompt: _wrap(
            'a retention marketing consultant for a Korean boiler dealer',
            'VIP Lock-in & Referral Marketing',
            '- Current VIP definition: {vipDefinition}\n- Current VIP count: {vipCount}\n- Existing VIP benefits: {vipBenefits}',
            `[Objective]
Lock in high-value customers and turn them into referral engines that bring 1~2 new customers each per year.

[Required Content]
- VIP 등급 정의: Silver / Gold / Platinum with explicit qualification rules.
- VIP 전용 혜택 매트릭스 (점검 우선, 가족 할인, 단지 추천 보상 등).
- 추천 마케팅 룰 (1인 추천 → 시공 시 양측 보상).
- VIP 전용 알림톡 3종 (봄점검 / 여름안심 / 겨울예약).
- Retention KPIs (재구매율, 추천 건수, NPS).

[Output Format]
Korean tables and sample messages.

[Writing Guidelines]
- VIP 혜택은 가족/이웃까지 확장 가능하게 설계.
- 추천 보상은 현금보다 무상점검·연료비 지원 같은 서비스성 보상 위주.
- End with "이번 주 VIP 80명에게 보낼 알림톡 초안".`
        )
    },
    {
        id: 'unified',
        title: '고객 응대 통합 매뉴얼',
        tag: '응대 표준화',
        summary: '전화/문자/방문/AS를 모두 아우르는 통합 응대 매뉴얼.',
        fields: [
            { id: 'responseChannels', label: '응대 채널', placeholder: '예: 전화, 알림톡, 방문, AS 콜센터' },
            { id: 'staffSize', label: '직원 인원', placeholder: '예: 사장 1, 사무 1, 기사 3' },
            { id: 'existingManual', label: '현재 매뉴얼 유무', placeholder: '있으면 어떤 형태인지' },
        ],
        sample: { responseChannels: '전화, 카카오 알림톡, 문자, 방문, AS 콜', staffSize: '사장 1명 + 사무직 1명 + 기사 3명', existingManual: '엑셀 매크로 + 출력본 1장' },
        outputSections: ['채널별 응대 흐름도', '표준 응대 멘트 모음', '응대 시간 SLA', 'CRM 입력 규칙', '주간 응대 품질 점검표'],
        prompt: _wrap(
            'a customer-service operations consultant for a Korean boiler dealer',
            'Unified Customer Response Manual',
            '- Active response channels: {responseChannels}\n- Staff size: {staffSize}\n- Existing manual status: {existingManual}',
            `[Objective]
Standardize customer interactions across phone / text / visit / AS so any staff member gives a consistent, polite, and trackable response.

[Required Content]
- Channel-by-channel response flowchart (전화 / 알림톡 / 방문 / AS).
- Standardized verbal/written templates (Korean honorifics).
- Response-time SLAs (전화 3코 내, 알림톡 30분, AS 24시간 내).
- CRM input rules (필수 입력 항목, 후속 콘택 일정).
- Weekly response-quality audit checklist.

[Output Format]
Korean tables and sample templates.

[Writing Guidelines]
- Differentiate inbound vs outbound flows.
- Add "어려운 고객" 응대 5종 (감정 격앙, 무리한 환불 요구, 가격 협상 강요 등).
- End with "이번 주 직원 교육 30분 커리큘럼".`
        )
    },
    {
        id: 'integrated',
        title: '비수기 작전 통합 리포트',
        tag: '원클릭 통합',
        summary: '14개 영업 산출물을 우선순위 3개로 압축해 즉시 실행 가능한 통합 리포트.',
        fields: [
            { id: 'priorityOutputs', label: '우선 산출물 3개', placeholder: 'DB 분류표, B/S 점검표, 마케팅 캘린더', type: 'textarea' },
            { id: 'kpiGoals', label: '목표 KPI', placeholder: '무상점검 50건, 예약 15건, 리뷰 10건', type: 'textarea' },
            { id: 'timeline', label: '실행 기간', placeholder: '예: 5월 ~ 8월 (16주)' },
        ],
        sample: { priorityOutputs: '고객 DB 분류표\n알림톡·해피콜 스크립트\n하절기 B/S 안심점검표', kpiGoals: '무상점검 50건\n예약 15건\n리뷰 10건\n객단가 +20%', timeline: '5월 1주 ~ 8월 4주 (총 16주)' },
        outputSections: ['우선순위 3개 산출물 통합 요약', '16주 실행 캘린더', '주간 KPI 대시보드', '주차별 사장님 의사결정 포인트'],
        prompt: _wrap(
            'a senior consultant compiling an integrated off-season sales report for a Korean boiler dealer',
            'Integrated Off-Season Operations Report',
            '- Priority deliverables (3): {priorityOutputs}\n- KPI goals: {kpiGoals}\n- Execution timeline: {timeline}',
            `[Objective]
Compile the dealer's TOP 3 chosen deliverables into one integrated execution report that staff can run for the next 16 weeks.

[Required Content]
- Summary of each priority deliverable (1 page each, Korean).
- Combined 16-week 실행 캘린더 mapping all 3 deliverables.
- 주간 KPI 대시보드 (수치 + 신호등 색상).
- 주차별 사장님 의사결정 포인트 (e.g., 주차 4: B/S 결과 기반 패키지 가격 확정).

[Output Format]
Korean tables, weekly calendar, KPI dashboard mock.

[Writing Guidelines]
- All staff can execute without re-asking 사장님.
- Reflect the dealer's profile and the 3 chosen deliverables explicitly.
- End with "이번 주 사장님이 결정할 1가지 + 직원이 시작할 5가지".`
        )
    },
    {
        id: 'fortune',
        title: '🔮 오늘의 운세 (Easter Egg)',
        tag: '이스터에그',
        summary: '세계 각국의 점술 체계를 합친 재미용 운세 생성기. 영업과는 무관, 잠깐의 휴식용 🍀',
        fields: [
            { id: 'fortuneMethod', label: '운세 방법', placeholder: '예: 사주팔자 + 타로카드', type: 'textarea' },
            { id: 'userInfo', label: '본인 정보 (선택)', placeholder: '생년월일, 별자리, MBTI, 혈액형 등 (원하는 만큼)', type: 'textarea' },
            { id: 'fortuneTone', label: '톤', placeholder: '진지 / 유머러스 / 시적 / 밈/인터넷 감성' },
            { id: 'fortuneLength', label: '분량', placeholder: '짧게 (5줄) / 중간 (10줄) / 길게 (20줄)' },
        ],
        sample: { fortuneMethod: '동양 사주팔자\n타로카드', userInfo: '1992년 7월 14일생\n게자리 / INFP / O형', fortuneTone: '유머러스하지만 따뜻한 톤', fortuneLength: '중간 (10줄 내외)' },
        outputSections: ['🌟 전체 운', '💕 연애운', '💰 금전운', '🩺 건강운', '🔢 행운의 숫자', '🎨 행운의 색', '✨ 오늘의 한 줄'],
        prompt: PROMPT_LANG_HEADER + `You are a fortune teller who has studied divination systems from all over the world. Today, generate a daily fortune using ONLY the method(s) the user has specified.

[Available Methods]
- 서양 별자리 점성술 (Western astrology)
- 동양 사주팔자 (Korean four pillars)
- 타로카드 (Tarot)
- 오행 (Five elements)
- 혈액형 운세 (Blood type)
- 수비학 (Numerology)
- 켈트 드루이드 점술 (Celtic Druid)
- 북유럽 룬 점 (Norse runes)
- 중국 십이지 (Chinese zodiac)
- 인도 베다 점성술 (Vedic astrology)
- 이집트 별자리 (Egyptian zodiac)
- 마야 달력 점술 (Mayan calendar)
- 일본 오미쿠지 (Omikuji)
- 커피 찌꺼기 점 (Coffee grounds)
- I Ching / 주역 (I Ching)
- 손금 (Palmistry)
- 꿈 해몽 (Dream interpretation)
- MBTI 기반 운세 (MBTI fortune)
- AI 랜덤 카오스 운세 (AI random chaos)
- 밈/인터넷 감성 운세 (Meme/Internet vibe)

[User Inputs]
- Selected method(s): {fortuneMethod}
- User info (optional): {userInfo}
- Tone: {fortuneTone}
- Length: {fortuneLength}

[Output Rules]
1. MUST use ONLY the specified method(s). Do not mix in unspecified systems.
2. Naturally reflect the characteristic terminology, symbols, and aesthetic of the chosen method.
3. Follow the requested tone EXACTLY. "밈/인터넷 감성" should sound like a Korean Twitter/Reddit/디시인사이드 post; "진지" should sound like a serious oracle reading; "시적" should be lyrical; "유머러스" should make the reader smile.
4. Follow the requested length.
5. If multiple methods are chosen, weave them together but label which method each insight came from.

[Required Output Sections — all in Korean]
🌟 전체 운
💕 연애운
💰 금전운
🩺 건강운
🔢 행운의 숫자
🎨 행운의 색
✨ 오늘의 한 줄 (선택한 점술 방법의 분위기를 살린 마무리 한 문장)

이건 재미용 콘텐츠입니다. 너무 무겁지 않게, 보일러 대리점장 사장님이 잠깐 웃고 다시 영업하러 갈 수 있는 분량으로 작성해주세요.` + PROMPT_LANG_FOOTER
    }
]

// Prompt State
let p_current = 0;
let p_paused = false;
let p_progress = 0;
const p_intervalMs = 8200;
let p_timer;

// Core Dashboard State
let dailyChartInstance = null;
let weeklyChartInstance = null;
let monthlyChartInstance = null;

// --- 3. INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateElement.innerHTML = now.toLocaleDateString('ko-KR', options);

    renderDailyChecklist();
    initDailyChart();
    renderWeeklyChecklist();
    initWeeklyChart();
    initMonthlyChart();
    renderMonthlyContent("5");

    p_renderCommonFields();
    p_render();
    p_sample();
    p_timer = setInterval(p_tick, 200);

    document.getElementById('tab-calendar').addEventListener('click', (e) => switchTab('calendar', e.currentTarget));
    document.getElementById('tab-daily').addEventListener('click', (e) => switchTab('daily', e.currentTarget));
    document.getElementById('tab-weekly').addEventListener('click', (e) => switchTab('weekly', e.currentTarget));
    document.getElementById('tab-monthly').addEventListener('click', (e) => switchTab('monthly', e.currentTarget));
    document.getElementById('tab-prompt').addEventListener('click', (e) => switchTab('prompt', e.currentTarget));
    document.getElementById('tab-shortcut').addEventListener('click', (e) => switchTab('shortcut', e.currentTarget));

    const monthBtns = document.querySelectorAll('.month-btn');
    monthBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            monthBtns.forEach(b => {
                b.classList.remove('active', 'bg-sky-700', 'text-white');
                b.classList.add('bg-stone-200', 'text-stone-600');
            });
            const targetBtn = e.currentTarget;
            targetBtn.classList.remove('bg-stone-200', 'text-stone-600');
            targetBtn.classList.add('active', 'bg-sky-700', 'text-white');
            renderMonthlyContent(targetBtn.getAttribute('data-month'));
        });
    });

    document.getElementById('daily-checklist-container').addEventListener('change', (e) => {
        if(e.target.type === 'checkbox') {
            updateDailyState(e.target.id, e.target.checked);
        }
    });
    document.getElementById('weekly-checklist-container').addEventListener('change', (e) => {
        if(e.target.type === 'checkbox') {
            updateWeeklyState(e.target.id, e.target.checked);
        }
    });

    document.getElementById('p-nextBtn').onclick = p_next;
    document.getElementById('p-prevBtn').onclick = p_prev;
    document.getElementById('p-sampleBtnTop').onclick = p_sample;
    document.getElementById('p-clearBtn').onclick = p_clearForm;
    document.getElementById('p-generateBtn').onclick = () => p_render();
    document.getElementById('p-copyCurrentBtn').onclick = () => p_copyText(p_hydratedPrompt(PROMPTS[p_current]));
    document.getElementById('p-copyOutputBtn').onclick = () => p_copyText(document.getElementById('p-outputText').innerText);
    document.getElementById('p-copyAllBtn').onclick = () => p_copyText(PROMPTS.map((p,i)=>`# ${i+1}. ${p.title}\n\n${p.prompt}`).join('\n\n---\n\n'));
    document.getElementById('p-pauseBtn').onclick = (e) => {
        p_paused = !p_paused;
        e.currentTarget.textContent = p_paused ? '▶ 롤링 재생' : '⏸ 롤링 일시정지';
    };

    const carouselPanel = document.getElementById('p-carouselPanel');
    carouselPanel.addEventListener('mouseenter', () => p_paused = true);
    carouselPanel.addEventListener('mouseleave', () => {
        if(document.getElementById('p-pauseBtn').textContent.includes('일시정지')) p_paused = false;
    });

    p_renderCommonFields();
});

// --- 4. VIEW NAVIGATION LOGIC ---
function switchTab(tab, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'prompt-tab-btn');
    });

    if(tab === 'prompt') {
        element.classList.add('active', 'prompt-tab-btn');
    } else {
        element.classList.add('active');
    }

    document.getElementById('view-calendar').classList.add('hidden');
    document.getElementById('view-daily').classList.add('hidden');
    document.getElementById('view-weekly').classList.add('hidden');
    document.getElementById('view-monthly').classList.add('hidden');
    document.getElementById('view-prompt').classList.add('hidden');
    document.getElementById('view-shortcut').classList.add('hidden');

    document.getElementById(`view-${tab}`).classList.remove('hidden');
    document.getElementById(`view-${tab}`).classList.add('block');

    if (tab === 'shortcut') loadShortcuts();
    if (tab === 'calendar') loadCalendar();
}

// --- CUSTOM MODAL SYSTEM ---
window.Modal = {
    show: function(html) {
        document.getElementById('custom-modal-content').innerHTML = html;
        document.getElementById('custom-modal').classList.remove('hidden');
    },
    hide: function() {
        document.getElementById('custom-modal').classList.add('hidden');
    }
};

window.closeModal = function() { Modal.hide(); };

window.openDeleteConfirm = function(type, pIndex, iIndex, cIndex = null) {
    const html = `
        <h3 class="text-lg font-bold text-red-600 mb-2">삭제 확인</h3>
        <p class="text-sm text-stone-600 mb-6">해당 항목을 정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</p>
        <div class="flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 font-bold text-sm">취소</button>
            <button type="button" onclick="executeDelete('${type}', '${pIndex}', ${iIndex}, ${cIndex})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm">삭제</button>
        </div>
    `;
    Modal.show(html);
};

window.executeDelete = function(type, pIndex, iIndex, cIndex) {
    if(type === 'daily') { dailyData[pIndex].items.splice(iIndex, 1); renderDailyChecklist(); }
    else if(type === 'weekly') { weeklyData[pIndex].items.splice(iIndex, 1); renderWeeklyChecklist(); }
    else if(type === 'monthly') {
        const cat = monthlyData[pIndex].categories[cIndex];
        const arr = cat.items || cat['점검'];
        arr.splice(iIndex, 1);
        renderMonthlyContent(pIndex);
    }
    closeModal();
};

// --- 5. DAILY DASHBOARD LOGIC (Editable) ---
function renderDailyChecklist() {
    const container = document.getElementById('daily-checklist-container');
    let html = '';

    dailyData.forEach((phaseBlock, pIndex) => {
        html += `
            <div class="mb-6 last:mb-0">
                <div class="flex items-center justify-between mb-3 border-b border-stone-200 pb-1">
                    <h4 class="font-bold text-sky-800 text-lg flex items-center">
                        <span class="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded mr-2 border border-sky-200">${phaseBlock.time}</span>
                        ${phaseBlock.phase}
                    </h4>
                </div>
                <div class="space-y-2">
        `;

        phaseBlock.items.forEach((item, iIndex) => {
            html += `
                <div class="group flex items-start p-3 rounded-lg border border-stone-100 bg-white hover:bg-stone-50 transition-colors shadow-sm">
                    <div class="flex-shrink-0 mt-0.5">
                        <input type="checkbox" id="${item.id}" class="w-5 h-5 text-sky-600 rounded border-stone-300 focus:ring-sky-500 cursor-pointer" ${item.done ? 'checked' : ''}>
                    </div>
                    <div class="ml-3 flex-grow flex justify-between items-start">
                        <label for="${item.id}" class="flex-grow cursor-pointer block">
                            <p class="text-sm font-bold text-stone-800 ${item.done ? 'line-through text-stone-400' : ''}" id="title-${item.id}">${item.title}</p>
                            <p class="text-xs text-stone-500 mt-1 ${item.done ? 'opacity-50' : ''}" id="desc-${item.id}">${item.desc}</p>
                        </label>
                        <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                            <button type="button" onclick="openEditDailyModal(${pIndex}, ${iIndex})" class="text-stone-400 hover:text-sky-600 text-sm" title="수정">✏️</button>
                            <button type="button" onclick="openDeleteConfirm('daily', ${pIndex}, ${iIndex})" class="text-stone-400 hover:text-red-500 text-sm" title="삭제">❌</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `
                    <div class="text-right mt-2">
                        <button type="button" onclick="openEditDailyModal(${pIndex})" class="text-xs font-bold text-sky-600 hover:text-sky-800 px-2 py-1 rounded border border-dashed border-sky-300 hover:bg-sky-50 transition-colors">+ 항목 추가</button>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
    updateDailyChartAndCounter();
}

window.openEditDailyModal = function(pIndex, iIndex = null) {
    const isEdit = iIndex !== null;
    const item = isEdit ? dailyData[pIndex].items[iIndex] : { title: '', desc: '' };
    const html = `
        <h3 class="text-lg font-bold text-stone-800 mb-4">${isEdit ? '일일 업무 수정' : '새 일일 업무 추가'}</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-stone-600 mb-1">업무 제목 <span class="text-red-500">*</span></label>
                <input type="text" id="m-title" class="w-full border border-stone-300 rounded p-2 focus:ring-2 focus:ring-sky-500 outline-none" value="${item.title}" placeholder="예: 현장 정리 및 리뷰 요청">
            </div>
            <div>
                <label class="block text-xs font-bold text-stone-600 mb-1">상세 설명 (선택)</label>
                <textarea id="m-desc" class="w-full border border-stone-300 rounded p-2 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="상세 설명을 입력하세요">${item.desc}</textarea>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 font-bold text-sm">취소</button>
            <button type="button" onclick="saveDailyItem(${pIndex}, ${isEdit ? iIndex : 'null'})" class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold text-sm">저장</button>
        </div>
    `;
    Modal.show(html);
};

window.saveDailyItem = function(pIndex, iIndex) {
    const title = document.getElementById('m-title').value.trim();
    const desc = document.getElementById('m-desc').value.trim();
    if(!title) { document.getElementById('m-title').classList.add('border-red-500'); return; }
    if(iIndex === null) dailyData[pIndex].items.push({ id: 'd' + Date.now(), title, desc, done: false });
    else { dailyData[pIndex].items[iIndex].title = title; dailyData[pIndex].items[iIndex].desc = desc; }
    renderDailyChecklist(); closeModal();
};

function updateDailyState(id, isChecked) {
    dailyData.forEach(phase => {
        phase.items.forEach(item => {
            if (item.id === id) item.done = isChecked;
        });
    });

    const titleEl = document.getElementById(`title-${id}`);
    const descEl = document.getElementById(`desc-${id}`);
    if (isChecked) {
        titleEl.classList.add('line-through', 'text-stone-400');
        descEl.classList.add('opacity-50');
    } else {
        titleEl.classList.remove('line-through', 'text-stone-400');
        descEl.classList.remove('opacity-50');
    }
    updateDailyChartAndCounter();
}

function updateDailyChartAndCounter() {
    let total = 0;
    let doneCount = 0;
    dailyData.forEach(phase => {
        phase.items.forEach(item => {
            total++;
            if(item.done) doneCount++;
        });
    });

    document.getElementById('daily-counter').innerText = `${doneCount} / ${total} 완료`;
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
    document.getElementById('chart-percentage').innerText = `${percent}%`;

    if(dailyChartInstance) {
        dailyChartInstance.data.datasets[0].data = [doneCount, total - doneCount];
        if (percent === 100) {
             dailyChartInstance.data.datasets[0].backgroundColor = ['#16a34a', '#f5f5f4'];
        } else {
             dailyChartInstance.data.datasets[0].backgroundColor = ['#0284c7', '#f5f5f4'];
        }
        dailyChartInstance.update();
    }
}

function initDailyChart() {
    const ctx = document.getElementById('dailyProgressChart').getContext('2d');
    dailyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['완료', '미완료'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#0284c7', '#f5f5f4'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateScale: true, animateRotate: true }
        }
    });
}

// --- 5.5. WEEKLY DASHBOARD LOGIC (Editable) ---
function renderWeeklyChecklist() {
    const container = document.getElementById('weekly-checklist-container');
    let html = '';

    weeklyData.forEach((dayBlock, pIndex) => {
        html += `
            <div class="mb-6 last:mb-0">
                <div class="flex items-center justify-between mb-3 border-b border-stone-200 pb-1">
                    <h4 class="font-bold text-emerald-800 text-lg flex items-center">
                        <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded mr-2 border border-emerald-200">${dayBlock.day}</span>
                        ${dayBlock.phase}
                    </h4>
                </div>
                <div class="space-y-2">
        `;

        dayBlock.items.forEach((item, iIndex) => {
            html += `
                <div class="group flex items-start p-3 rounded-lg border border-stone-100 bg-white hover:bg-stone-50 transition-colors shadow-sm">
                    <div class="flex-shrink-0 mt-0.5">
                        <input type="checkbox" id="${item.id}" class="w-5 h-5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer" ${item.done ? 'checked' : ''}>
                    </div>
                    <div class="ml-3 flex-grow flex justify-between items-start">
                        <label for="${item.id}" class="flex-grow cursor-pointer block">
                            <p class="text-sm font-bold text-stone-800 ${item.done ? 'line-through text-stone-400' : ''}" id="wtitle-${item.id}">${item.title}</p>
                            <p class="text-xs text-stone-500 mt-1 ${item.done ? 'opacity-50' : ''}" id="wdesc-${item.id}">${item.desc}</p>
                        </label>
                        <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                            <button type="button" onclick="openEditWeeklyModal(${pIndex}, ${iIndex})" class="text-stone-400 hover:text-emerald-600 text-sm" title="수정">✏️</button>
                            <button type="button" onclick="openDeleteConfirm('weekly', ${pIndex}, ${iIndex})" class="text-stone-400 hover:text-red-500 text-sm" title="삭제">❌</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `
                    <div class="text-right mt-2">
                        <button type="button" onclick="openEditWeeklyModal(${pIndex})" class="text-xs font-bold text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded border border-dashed border-emerald-300 hover:bg-emerald-50 transition-colors">+ 항목 추가</button>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
    updateWeeklyChartAndCounter();
}

window.openEditWeeklyModal = function(pIndex, iIndex = null) {
    const isEdit = iIndex !== null;
    const item = isEdit ? weeklyData[pIndex].items[iIndex] : { title: '', desc: '' };
    const html = `
        <h3 class="text-lg font-bold text-stone-800 mb-4">${isEdit ? '주간 업무 수정' : '새 주간 업무 추가'}</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-stone-600 mb-1">업무 제목 <span class="text-red-500">*</span></label>
                <input type="text" id="m-title" class="w-full border border-stone-300 rounded p-2 focus:ring-2 focus:ring-sky-500 outline-none" value="${item.title}" placeholder="예: 맞벌이 타겟 방문">
            </div>
            <div>
                <label class="block text-xs font-bold text-stone-600 mb-1">상세 설명 (선택)</label>
                <textarea id="m-desc" class="w-full border border-stone-300 rounded p-2 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="상세 설명을 입력하세요">${item.desc}</textarea>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 font-bold text-sm">취소</button>
            <button type="button" onclick="saveWeeklyItem(${pIndex}, ${isEdit ? iIndex : 'null'})" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm">저장</button>
        </div>
    `;
    Modal.show(html);
};

window.saveWeeklyItem = function(pIndex, iIndex) {
    const title = document.getElementById('m-title').value.trim();
    const desc = document.getElementById('m-desc').value.trim();
    if(!title) { document.getElementById('m-title').classList.add('border-red-500'); return; }
    if(iIndex === null) weeklyData[pIndex].items.push({ id: 'w' + Date.now(), title, desc, done: false });
    else { weeklyData[pIndex].items[iIndex].title = title; weeklyData[pIndex].items[iIndex].desc = desc; }
    renderWeeklyChecklist(); closeModal();
};

function updateWeeklyState(id, isChecked) {
    weeklyData.forEach(day => {
        day.items.forEach(item => {
            if (item.id === id) item.done = isChecked;
        });
    });

    const titleEl = document.getElementById(`wtitle-${id}`);
    const descEl = document.getElementById(`wdesc-${id}`);
    if (isChecked) {
        titleEl.classList.add('line-through', 'text-stone-400');
        descEl.classList.add('opacity-50');
    } else {
        titleEl.classList.remove('line-through', 'text-stone-400');
        descEl.classList.remove('opacity-50');
    }
    updateWeeklyChartAndCounter();
}

function updateWeeklyChartAndCounter() {
    let total = 0;
    let doneCount = 0;
    weeklyData.forEach(day => {
        day.items.forEach(item => {
            total++;
            if(item.done) doneCount++;
        });
    });

    document.getElementById('weekly-counter').innerText = `${doneCount} / ${total} 완료`;
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
    document.getElementById('weekly-chart-percentage').innerText = `${percent}%`;

    if(weeklyChartInstance) {
        weeklyChartInstance.data.datasets[0].data = [doneCount, total - doneCount];
        if (percent === 100) {
             weeklyChartInstance.data.datasets[0].backgroundColor = ['#059669', '#f5f5f4'];
        } else {
             weeklyChartInstance.data.datasets[0].backgroundColor = ['#10b981', '#f5f5f4'];
        }
        weeklyChartInstance.update();
    }
}

function initWeeklyChart() {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['완료', '미완료'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#10b981', '#f5f5f4'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateScale: true, animateRotate: true }
        }
    });
}

// --- 6. MONTHLY DASHBOARD LOGIC (Editable) ---
function renderMonthlyContent(month) {
    const data = monthlyData[month];
    const container = document.getElementById('monthly-content-container');
    let html = `
        <div class="mb-6">
            <h3 class="text-2xl font-bold text-stone-800 mb-2">${data.title}</h3>
            <p class="text-stone-600">${data.desc}</p>
        </div>
        <div class="space-y-6">
    `;

    data.categories.forEach((cat, cIndex) => {
        let icon = '&#9642;';
        let headerColor = 'text-stone-700';
        if(cat.name.includes("마케팅")) { icon = '&#128227;'; headerColor = 'text-sky-700'; }
        if(cat.name.includes("현장")) { icon = '&#128736;'; headerColor = 'text-emerald-700'; }
        if(cat.name.includes("영업")) { icon = '&#128188;'; headerColor = 'text-orange-700'; }

        const itemsList = cat.items || cat['점검'] || [];
        html += `
            <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <h4 class="font-bold ${headerColor} mb-3 flex items-center">${icon} ${cat.name}</h4>
                <ul class="space-y-2">
        `;
        itemsList.forEach((item, iIndex) => {
            html += `
                <li class="group flex items-start justify-between text-sm text-stone-700 border-b border-stone-50 pb-1 last:border-0 hover:bg-stone-50 p-1 rounded transition-colors">
                    <div class="flex items-start">
                        <span class="text-sky-500 mr-2 font-bold mt-0.5">&#10003;</span>
                        <span>${item}</span>
                    </div>
                    <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                        <button type="button" onclick="openEditMonthlyModal('${month}', ${cIndex}, ${iIndex})" class="text-stone-400 hover:text-sky-600 text-sm" title="수정">✏️</button>
                        <button type="button" onclick="openDeleteConfirm('monthly', '${month}', ${iIndex}, ${cIndex})" class="text-stone-400 hover:text-red-500 text-sm" title="삭제">❌</button>
                    </div>
                </li>
            `;
        });
        html += `
                </ul>
                <div class="text-right mt-3">
                    <button type="button" onclick="openEditMonthlyModal('${month}', ${cIndex})" class="text-xs font-bold text-stone-500 hover:text-stone-800 px-2 py-1 rounded border border-dashed border-stone-300 hover:bg-stone-100 transition-colors">+ 항목 추가</button>
                </div>
            </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

window.openEditMonthlyModal = function(month, cIndex, iIndex = null) {
    const isEdit = iIndex !== null;
    const cat = monthlyData[month].categories[cIndex];
    const arr = cat.items || cat['점검'];
    const textVal = isEdit ? arr[iIndex] : '';

    const html = `
        <h3 class="text-lg font-bold text-stone-800 mb-4">${isEdit ? '핵심 과제 수정' : '새 핵심 과제 추가'}</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-stone-600 mb-1">과제 내용 <span class="text-red-500">*</span></label>
                <textarea id="m-text" class="w-full border border-stone-300 rounded p-2 h-24 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="수행할 핵심 과제를 입력하세요">${textVal}</textarea>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 font-bold text-sm">취소</button>
            <button type="button" onclick="saveMonthlyItem('${month}', ${cIndex}, ${isEdit ? iIndex : 'null'})" class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold text-sm">저장</button>
        </div>
    `;
    Modal.show(html);
};

window.saveMonthlyItem = function(month, cIndex, iIndex) {
    const text = document.getElementById('m-text').value.trim();
    if(!text) { document.getElementById('m-text').classList.add('border-red-500'); return; }
    const cat = monthlyData[month].categories[cIndex];
    const arr = cat.items || cat['점검'];
    if(iIndex === null) arr.push(text);
    else arr[iIndex] = text;
    renderMonthlyContent(month); closeModal();
};

function initMonthlyChart() {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['5월 (준비)', '6월 (구축)', '7월 (경험)', '8월 (락인)'],
            datasets: [
                { label: '마케팅/홍보 강도', data: [30, 60, 90, 100], backgroundColor: '#38bdf8', borderRadius: 4 },
                { label: '현장방문/견적제출', data: [20, 50, 100, 80], backgroundColor: '#34d399', borderRadius: 4 },
                { label: '성수기 사전예약', data: [5, 15, 40, 100], backgroundColor: '#fb923c', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: '#f5f5f4' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: "sans-serif" } } },
                tooltip: { callbacks: { label: function(context) { return ' ' + context.dataset.label + ': ' + context.raw + ' (지수)'; } } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
}

// --- 7. AI PROMPT STUDIO LOGIC ---
function p_safe(v, fallback){ return v && v.length ? v : fallback; }
function p_lines(v){ return p_safe(v,'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); }
function p_asBullets(v, fallback){
    const arr = p_lines(v);
    return (arr.length ? arr : fallback).map(x=>'   - '+x).join('\n');
}

// Returns a flat object of all field values: common + current prompt's specific fields.
function p_getDataFor(prompt){
    const data = {};
    for (const f of COMMON_FIELDS) {
        const el = document.getElementById('p-' + f.id);
        data[f.id] = el ? (el.value || '').trim() : '';
    }
    for (const f of (prompt && prompt.fields) || []) {
        const el = document.getElementById('p-' + f.id);
        data[f.id] = el ? (el.value || '').trim() : '';
    }
    return data;
}

function p_formatValue(v){
    if (!v || !v.length) return '[입력]';
    if (v.includes('\n')) {
        return v.split('\n').map(s=>s.trim()).filter(Boolean).join(' / ');
    }
    return v;
}

function p_hydratedPrompt(prompt){
    const data = p_getDataFor(prompt);
    return prompt.prompt.replace(/\{(\w+)\}/g, (_, k) => p_formatValue(data[k]));
}

// Render a single input field (label + input/textarea) and bind input listener.
function p_renderField(container, f, onChange){
    const wrap = document.createElement('div');
    wrap.className = 'space-y-1';
    const label = document.createElement('label');
    label.className = 'block font-bold text-stone-700 text-xs';
    label.textContent = f.label;
    wrap.appendChild(label);
    let input;
    if (f.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'w-full border border-stone-300 rounded-md p-2 h-16 resize-none focus:ring-2 focus:ring-sky-500 outline-none transition-shadow';
    } else {
        input = document.createElement('input');
        input.className = 'w-full border border-stone-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 outline-none transition-shadow';
    }
    input.id = 'p-' + f.id;
    input.placeholder = f.placeholder || '';
    if (f.id in p_inputCache) input.value = p_inputCache[f.id];
    input.addEventListener('input', () => {
        p_inputCache[f.id] = input.value;
        onChange();
    });
    wrap.appendChild(input);
    container.appendChild(wrap);
}

// Cache of all field values so values persist when switching prompts.
const p_inputCache = {};

function p_renderCommonFields(){
    const container = document.getElementById('p-common-fields');
    if (!container) return;
    container.innerHTML = '';
    for (const f of COMMON_FIELDS) {
        p_renderField(container, f, () => { p_updatePromptText(); });
    }
}

function p_renderSpecificFields(prompt){
    const container = document.getElementById('p-specific-fields');
    if (!container) return;
    container.innerHTML = '';
    const fields = (prompt && prompt.fields) || [];
    if (fields.length === 0) {
        container.innerHTML = '<p class="text-xs text-stone-400 italic">이 프롬프트는 공통 입력만 사용합니다.</p>';
        return;
    }
    for (const f of fields) {
        p_renderField(container, f, () => { p_updatePromptText(); });
    }
}

function p_updatePromptText(){
    const p = PROMPTS[p_current];
    const text = p_hydratedPrompt(p);
    const el = document.getElementById('p-promptText');
    if (el) el.textContent = text;
}

function p_renderTabs(){
    const tabsContainer = document.getElementById('p-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    PROMPTS.forEach((p,i)=>{
        const b = document.createElement('button');
        const isFortune = p.id === 'fortune';
        const active = i === p_current;
        const baseColor = isFortune
            ? (active ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100')
            : (active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100');
        b.className = `whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${baseColor}`;
        b.textContent = `${String(i+1).padStart(2,'0')} ${p.title.replace(' 생성','')}`;
        b.onclick = () => { p_current = i; p_progress = 0; p_render(); };
        tabsContainer.appendChild(b);
    });
}

function p_render(){
    const p = PROMPTS[p_current];
    document.getElementById('p-promptTag').textContent = p.tag;
    document.getElementById('p-promptTitle').textContent = p.title;
    document.getElementById('p-promptSummary').textContent = p.summary;
    document.getElementById('p-counter').textContent = `${p_current+1} / ${PROMPTS.length}`;
    p_renderSpecificFields(p);
    p_updatePromptText();
    p_renderTabs();
    p_renderDemo(p);
}

function p_next(){ p_current = (p_current + 1) % PROMPTS.length; p_progress = 0; p_render(); }
function p_prev(){ p_current = (p_current - 1 + PROMPTS.length) % PROMPTS.length; p_progress = 0; p_render(); }

function p_tick(){
    if(p_paused || document.getElementById('view-prompt').classList.contains('hidden')) return;
    p_progress += 100 / (p_intervalMs / 200);
    if(p_progress >= 100){ p_next(); p_progress = 0; }
    document.getElementById('p-bar').style.width = p_progress + '%';
}

function showToast(msg='복사되었습니다.') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2000);
}

async function p_copyText(text){ await navigator.clipboard.writeText(text); showToast(); }

function p_sample(){
    Object.entries(COMMON_SAMPLE).forEach(([k,v]) => {
        p_inputCache[k] = v;
        const el = document.getElementById('p-' + k);
        if (el) el.value = v;
    });
    const p = PROMPTS[p_current];
    Object.entries(p.sample || {}).forEach(([k,v]) => {
        p_inputCache[k] = v;
        const el = document.getElementById('p-' + k);
        if (el) el.value = v;
    });
    p_updatePromptText();
    p_renderDemo(p);
    showToast('예시 데이터가 입력되었습니다.');
}

function p_clearForm(){
    for (const f of COMMON_FIELDS) {
        delete p_inputCache[f.id];
        const el = document.getElementById('p-' + f.id);
        if (el) el.value = '';
    }
    const p = PROMPTS[p_current];
    for (const f of (p.fields || [])) {
        delete p_inputCache[f.id];
        const el = document.getElementById('p-' + f.id);
        if (el) el.value = '';
    }
    p_updatePromptText();
    p_renderDemo(p);
    showToast('입력값을 초기화했습니다.');
}

function _escHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function p_renderDemo(prompt){
    const out = document.getElementById('p-outputText');
    if (!out) return;
    const data = p_getDataFor(prompt);
    const dealerLine = data.dealer ? `<span class="font-bold text-sky-700">${_escHtml(data.dealer)}</span>` : '<span class="italic text-stone-400">대리점명 미입력</span>';
    const regionLine = data.region ? _escHtml(data.region) : '<span class="italic text-stone-400">지역 미입력</span>';
    const isFortune = prompt.id === 'fortune';
    const headerBg = isFortune ? 'bg-purple-50 border-purple-200' : 'bg-sky-50 border-sky-200';
    const headerText = isFortune ? 'text-purple-800' : 'text-sky-800';
    const sectionsHtml = (prompt.outputSections || []).map(s => `<li class="text-sm text-stone-700">${_escHtml(s)}</li>`).join('');
    const filledFields = (prompt.fields || []).filter(f => (data[f.id] || '').length > 0);
    const filledHtml = filledFields.length === 0
        ? '<p class="text-xs italic text-stone-400">아직 전용 입력이 비어 있습니다. 좌측 양식에 입력하거나 "예시 채우기"를 눌러보세요.</p>'
        : filledFields.map(f => `<div class="flex items-start gap-2 text-xs"><span class="font-bold text-amber-700 min-w-[80px]">${_escHtml(f.label)}</span><span class="text-stone-700 break-words">${_escHtml((data[f.id] || '').slice(0, 80))}${data[f.id] && data[f.id].length > 80 ? '…' : ''}</span></div>`).join('');

    out.innerHTML = `
        <div class="space-y-4">
            <div class="border ${headerBg} p-4 rounded-lg">
                <div class="text-[10px] font-bold ${headerText} uppercase tracking-wide mb-1">${isFortune ? '🔮 이스터에그' : '📋 예상 산출물 구조'}</div>
                <h4 class="font-bold text-stone-800 mb-2">${_escHtml(prompt.title)}</h4>
                <p class="text-xs text-stone-600 leading-relaxed">${_escHtml(prompt.summary)}</p>
            </div>

            <div class="bg-white border border-stone-200 p-3 rounded-lg">
                <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-2">현재 입력 미리보기</div>
                <div class="text-xs text-stone-700 mb-2">대리점: ${dealerLine} <span class="text-stone-400">·</span> 지역: ${regionLine}</div>
                <div class="space-y-1 border-t border-stone-100 pt-2">${filledHtml}</div>
            </div>

            <div class="bg-white border border-stone-200 p-3 rounded-lg">
                <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-2">예상 출력 구성 (한국어)</div>
                <ul class="list-disc pl-5 space-y-1">${sectionsHtml}</ul>
            </div>

            <div class="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 leading-relaxed">
                💡 우측 카드의 영문 프롬프트를 <span class="font-bold">"현재 복사"</span> 버튼으로 복사 → ChatGPT / Claude / Gemini에 붙여넣으면 한국어로 풍부한 결과가 출력됩니다.
            </div>
        </div>
    `;
}

// ============================================================
// NOTIFICATION SETTINGS (전역 알림 시각)
// ============================================================
let notifyTimesCache = [];
let notifyMessageCache = '';

async function loadNotifySettings() {
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('failed');
        const cfg = await res.json();
        notifyTimesCache = cfg.notification_times || [];
        notifyMessageCache = cfg.notification_message || '';
        renderNotifySummary();
    } catch (e) {
        document.getElementById('notify-times-summary').textContent = '알림 설정을 불러오지 못했습니다.';
    }
}

function renderNotifySummary() {
    const el = document.getElementById('notify-times-summary');
    if (!el) return;
    if (notifyTimesCache.length === 0) {
        el.innerHTML = '🔕 설정된 알림 시각이 없습니다. <span class="text-sky-700 font-semibold">오른쪽 버튼으로 추가하세요.</span>';
    } else {
        el.innerHTML = '🔔 알림 시각: ' + notifyTimesCache.map(t => `<span class="inline-block bg-sky-50 text-sky-700 border border-sky-200 rounded px-2 py-0.5 font-semibold mr-1">${t}</span>`).join('');
    }
}

function openNotifySettingsModal() {
    const times = [...notifyTimesCache];
    const renderList = () => times.map((t, i) => `
        <div class="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded px-3 py-2">
            <span class="text-sm font-mono font-bold text-stone-800 flex-grow">${t}</span>
            <button type="button" data-idx="${i}" class="notify-remove-btn text-stone-400 hover:text-red-500 text-sm">❌</button>
        </div>
    `).join('') || '<div class="text-xs text-stone-500">등록된 시각이 없습니다.</div>';

    const html = `
        <h3 class="text-lg font-bold text-stone-800 mb-1">⏰ 일일 알림 시각 설정</h3>
        <p class="text-xs text-stone-500 mb-4">설정한 시각에 Windows 알림으로 일일 체크리스트 확인을 알려드립니다.</p>
        <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar mb-4" id="notify-list">${renderList()}</div>
        <div class="flex items-end gap-2 mb-4">
            <div class="flex-grow">
                <label class="block text-xs font-bold text-stone-600 mb-1">새 알림 시각 추가</label>
                <input id="notify-new-time" type="time" class="w-full border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none">
            </div>
            <button type="button" id="notify-add-btn" class="px-3 py-2 bg-sky-100 text-sky-700 border border-sky-200 rounded text-sm font-bold hover:bg-sky-200">추가</button>
        </div>
        <div>
            <label class="block text-xs font-bold text-stone-600 mb-1">알림 메시지</label>
            <input id="notify-msg" maxlength="200" class="w-full border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none" value="${(notifyMessageCache || '').replace(/"/g,'&quot;')}" placeholder="오늘의 체크리스트를 확인하세요.">
        </div>
        <div id="notify-err" class="mt-3 text-xs text-red-600 hidden"></div>
        <div class="flex justify-end gap-2 mt-5">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded text-sm font-semibold hover:bg-stone-200">취소</button>
            <button type="button" id="notify-save-btn" class="px-4 py-2 bg-sky-600 text-white rounded text-sm font-bold hover:bg-sky-700">저장</button>
        </div>
    `;
    Modal.show(html);

    const refresh = () => {
        document.getElementById('notify-list').innerHTML = renderList();
        bindRemove();
    };
    const bindRemove = () => {
        document.querySelectorAll('.notify-remove-btn').forEach(btn => {
            btn.onclick = () => { times.splice(parseInt(btn.dataset.idx, 10), 1); refresh(); };
        });
    };
    bindRemove();

    document.getElementById('notify-add-btn').onclick = () => {
        const input = document.getElementById('notify-new-time');
        const v = input.value;
        if (!v) return;
        if (!times.includes(v)) {
            times.push(v);
            times.sort();
            refresh();
        }
        input.value = '';
    };

    document.getElementById('notify-save-btn').onclick = async () => {
        const err = document.getElementById('notify-err');
        err.classList.add('hidden');
        const message = document.getElementById('notify-msg').value.trim();
        try {
            const res = await fetch('/api/config/notifications', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ notification_times: times, notification_message: message })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail ? JSON.stringify(data.detail) : '저장 실패');
            }
            const cfg = await res.json();
            notifyTimesCache = cfg.notification_times || [];
            notifyMessageCache = cfg.notification_message || '';
            renderNotifySummary();
            closeModal();
            showToast('알림 설정이 저장되었습니다.');
        } catch (e) {
            err.textContent = '저장에 실패했습니다: ' + e.message;
            err.classList.remove('hidden');
        }
    };
}

// ============================================================
// SHORTCUTS (사이트 바로가기)
// ============================================================
let shortcutsCache = [];
let shortcutEditingId = null;

async function loadShortcuts() {
    try {
        const res = await fetch('/api/shortcuts');
        shortcutsCache = res.ok ? await res.json() : [];
    } catch {
        shortcutsCache = [];
    }
    renderShortcuts();
}

function renderShortcuts() {
    const grid = document.getElementById('shortcut-grid');
    const empty = document.getElementById('shortcut-empty');
    const count = document.getElementById('shortcut-count');
    if (!grid) return;
    count.textContent = `${shortcutsCache.length}개`;

    if (shortcutsCache.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    grid.innerHTML = shortcutsCache.map(s => {
        const safeName = s.name.replace(/</g, '&lt;');
        const safeUrl = s.url.replace(/</g, '&lt;');
        return `
        <div class="border border-stone-200 rounded-lg bg-white hover:border-sky-400 hover:shadow-md transition-all flex flex-col">
            <button type="button" data-action="open" data-id="${s.id}" class="text-left p-4 flex-grow">
                <div class="font-bold text-stone-800 truncate text-base mb-1">🔗 ${safeName}</div>
                <div class="text-xs text-stone-500 truncate">${safeUrl}</div>
            </button>
            <div class="border-t border-stone-100 flex">
                <button type="button" data-action="edit" data-id="${s.id}" class="flex-1 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">✏ 수정</button>
                <button type="button" data-action="delete" data-id="${s.id}" class="flex-1 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors border-l border-stone-100">🗑 삭제</button>
            </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('button[data-action]').forEach(btn => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        btn.onclick = () => {
            if (action === 'open') openShortcut(id);
            else if (action === 'edit') startEditShortcut(id);
            else if (action === 'delete') confirmDeleteShortcut(id);
        };
    });
}

async function openShortcut(id) {
    const item = shortcutsCache.find(s => s.id === id);
    if (!item) return;
    try {
        const res = await fetch('/api/open-url', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ url: item.url })
        });
        if (!res.ok) throw new Error('open failed');
        showToast(`🌐 ${item.name} 열기`);
    } catch {
        window.open(item.url, '_blank', 'noopener');
    }
}

function startEditShortcut(id) {
    const item = shortcutsCache.find(s => s.id === id);
    if (!item) return;
    shortcutEditingId = id;
    document.getElementById('shortcut-name').value = item.name;
    document.getElementById('shortcut-url').value = item.url;
    document.getElementById('shortcut-submit').textContent = '수정 저장';
    document.getElementById('shortcut-name').focus();
}

function resetShortcutForm() {
    shortcutEditingId = null;
    document.getElementById('shortcut-form').reset();
    document.getElementById('shortcut-submit').textContent = '추가';
    const err = document.getElementById('shortcut-form-error');
    err.classList.add('hidden');
    err.textContent = '';
}

function confirmDeleteShortcut(id) {
    const item = shortcutsCache.find(s => s.id === id);
    if (!item) return;
    const html = `
        <h3 class="text-lg font-bold text-red-600 mb-2">바로가기 삭제</h3>
        <p class="text-sm text-stone-600 mb-2"><span class="font-bold">${item.name.replace(/</g,'&lt;')}</span> 바로가기를 삭제하시겠습니까?</p>
        <p class="text-xs text-stone-500 mb-6 truncate">${item.url.replace(/</g,'&lt;')}</p>
        <div class="flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded text-sm font-semibold hover:bg-stone-200">취소</button>
            <button type="button" id="shortcut-delete-confirm" class="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700">삭제</button>
        </div>`;
    Modal.show(html);
    document.getElementById('shortcut-delete-confirm').onclick = async () => {
        await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
        closeModal();
        if (shortcutEditingId === id) resetShortcutForm();
        await loadShortcuts();
        showToast('삭제되었습니다.');
    };
}

async function submitShortcutForm(e) {
    e.preventDefault();
    const name = document.getElementById('shortcut-name').value.trim();
    const url = document.getElementById('shortcut-url').value.trim();
    const err = document.getElementById('shortcut-form-error');
    err.classList.add('hidden');

    try {
        const opts = {
            method: shortcutEditingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, url })
        };
        const endpoint = shortcutEditingId ? `/api/shortcuts/${shortcutEditingId}` : '/api/shortcuts';
        const res = await fetch(endpoint, opts);
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ') : (data.detail || '저장 실패');
            throw new Error(msg);
        }
        resetShortcutForm();
        await loadShortcuts();
        showToast('저장되었습니다.');
    } catch (ex) {
        err.textContent = ex.message;
        err.classList.remove('hidden');
    }
}

// ============================================================
// CALENDAR (월간 일정)
// ============================================================
const CAL_MAX_PER_DAY = 5;
const CAL_TITLE_MAX = 12;
let calEntries = [];
let calPresets = ['#0369a1', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#db2777', '#0d9488', '#57534e'];
let calYear, calMonth;

function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function loadCalendar() {
    if (calYear === undefined) {
        const now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
    }
    try {
        const [entriesRes, presetsRes] = await Promise.all([
            fetch('/api/calendar'),
            fetch('/api/calendar/presets'),
        ]);
        calEntries = entriesRes.ok ? await entriesRes.json() : [];
        if (presetsRes.ok) {
            const p = await presetsRes.json();
            if (Array.isArray(p.colors) && p.colors.length) calPresets = p.colors;
        }
    } catch {
        calEntries = [];
    }
    renderCalendar();
    renderCalLegend();
}

function renderCalLegend() {
    const el = document.getElementById('cal-legend');
    if (!el) return;
    el.innerHTML = calPresets.map(c => `
        <span class="inline-flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded-sm" style="background:${c}"></span>
            <span class="text-stone-500">${c}</span>
        </span>
    `).join('');
}

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-title');
    if (!grid || !title) return;

    title.textContent = `${calYear}년 ${calMonth + 1}월`;

    const first = new Date(calYear, calMonth, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const todayKey = ymd(new Date());

    const byDate = {};
    for (const e of calEntries) {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
    }

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) {
        const day = daysInPrev - firstWeekday + 1 + i;
        cells.push({ inMonth: false, day, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = ymd(new Date(calYear, calMonth, d));
        cells.push({ inMonth: true, day: d, date: dateKey, weekday: (firstWeekday + d - 1) % 7 });
    }
    while (cells.length % 7 !== 0) {
        const next = cells.length - firstWeekday - daysInMonth + 1;
        cells.push({ inMonth: false, day: next, date: null });
    }
    if (cells.length < 42) {
        let nx = cells[cells.length - 1].day + 1;
        while (cells.length < 42) { cells.push({ inMonth: false, day: nx++, date: null }); }
    }

    grid.innerHTML = cells.map((c, idx) => {
        const col = idx % 7;
        const dayColor = !c.inMonth ? 'text-stone-300'
                        : col === 0 ? 'text-red-500'
                        : col === 6 ? 'text-blue-500'
                        : 'text-stone-700';
        const isToday = c.inMonth && c.date === todayKey;
        const todayBadge = isToday
            ? '<span class="ml-1 text-[10px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded">오늘</span>'
            : '';
        const entries = c.inMonth ? (byDate[c.date] || []) : [];
        const lines = entries.slice(0, CAL_MAX_PER_DAY).map(e => `
            <div class="text-[11px] leading-tight truncate rounded px-1 py-0.5 font-semibold text-white" style="background:${escHtml(e.color)}" title="${escHtml(e.title)}">${escHtml(e.title)}</div>
        `).join('');
        const dataAttr = c.inMonth ? `data-date="${c.date}"` : '';
        const interactive = c.inMonth ? 'cursor-pointer hover:bg-sky-50' : 'bg-stone-50/60';
        const ring = isToday ? 'ring-2 ring-inset ring-sky-500' : '';
        return `
            <div class="cal-cell border-r border-b border-stone-200 p-1.5 h-[110px] flex flex-col gap-1 ${interactive} ${ring}" ${dataAttr}>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold ${dayColor}">${c.day}</span>
                    ${todayBadge}
                </div>
                <div class="flex flex-col gap-0.5 overflow-hidden">${lines}</div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => openCalDayModal(cell.dataset.date));
    });
}

function changeMonth(delta) {
    const d = new Date(calYear, calMonth + delta, 1);
    calYear = d.getFullYear();
    calMonth = d.getMonth();
    renderCalendar();
}

function gotoToday() {
    const n = new Date();
    calYear = n.getFullYear();
    calMonth = n.getMonth();
    renderCalendar();
}

function openCalDayModal(dateKey, editingId = null) {
    const entries = calEntries.filter(e => e.date === dateKey);
    const editing = editingId ? entries.find(e => e.id === editingId) : null;
    const remaining = CAL_MAX_PER_DAY - entries.length + (editing ? 1 : 0);
    const swatches = calPresets.map(c => `
        <button type="button" data-color="${c}" class="cal-swatch w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-stone-200 hover:scale-110 transition-transform" style="background:${c}" title="${c}"></button>
    `).join('');
    const listHtml = entries.length === 0
        ? '<p class="text-xs text-stone-500">등록된 일정이 없습니다.</p>'
        : entries.map(e => `
            <div class="flex items-center gap-2 p-2 border border-stone-200 rounded-md bg-stone-50">
                <span class="inline-block w-4 h-4 rounded-sm shrink-0" style="background:${escHtml(e.color)}"></span>
                <span class="flex-grow text-sm font-semibold text-stone-800 truncate">${escHtml(e.title)}</span>
                <button type="button" data-edit="${e.id}" class="cal-edit-btn text-xs px-2 py-1 bg-white text-stone-700 border border-stone-300 rounded hover:bg-stone-100">수정</button>
                <button type="button" data-del="${e.id}" class="cal-del-btn text-xs px-2 py-1 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50">삭제</button>
            </div>
        `).join('');

    const formDisabled = remaining <= 0 ? 'opacity-50 pointer-events-none' : '';
    const formTitle = editing ? '일정 수정' : '새 일정 추가';
    const submitLabel = editing ? '수정 저장' : (remaining <= 0 ? '추가 불가 (최대 5개)' : '추가');
    const presetActive = editing ? editing.color : calPresets[0];

    const dateLabel = (() => {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const wk = ['일','월','화','수','목','금','토'][dt.getDay()];
        return `${y}년 ${m}월 ${d}일 (${wk})`;
    })();

    const html = `
        <div class="flex items-start justify-between mb-3">
            <div>
                <h3 class="text-lg font-bold text-stone-800">${dateLabel}</h3>
                <p class="text-xs text-stone-500 mt-1">최대 ${CAL_MAX_PER_DAY}개 · 현재 ${entries.length}개 등록</p>
            </div>
            <button type="button" onclick="closeModal()" class="text-stone-400 hover:text-stone-700 text-xl leading-none">✕</button>
        </div>

        <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar mb-4">${listHtml}</div>

        <div class="border-t border-stone-200 pt-4 ${formDisabled}">
            <p class="text-sm font-bold text-stone-700 mb-2">${formTitle}</p>
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-stone-600 mb-1">제목 (최대 ${CAL_TITLE_MAX}자)</label>
                    <input id="cal-title-input" maxlength="${CAL_TITLE_MAX}" value="${editing ? escHtml(editing.title) : ''}" class="w-full border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="예: 방문 점검">
                    <div class="text-[11px] text-stone-400 mt-0.5"><span id="cal-title-count">0</span>/${CAL_TITLE_MAX}</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-stone-600 mb-1">색상</label>
                    <div class="flex items-center gap-2 flex-wrap" id="cal-swatches">${swatches}</div>
                    <input type="hidden" id="cal-color-input" value="${presetActive}">
                </div>
            </div>
            <div id="cal-form-err" class="mt-3 text-xs text-red-600 hidden"></div>
            <div class="flex justify-end gap-2 mt-4">
                ${editing ? '<button type="button" id="cal-form-cancel" class="px-4 py-2 bg-stone-100 text-stone-700 rounded text-sm font-semibold hover:bg-stone-200">취소</button>' : ''}
                <button type="button" id="cal-form-submit" class="px-4 py-2 bg-sky-600 text-white rounded text-sm font-bold hover:bg-sky-700 disabled:opacity-50" ${remaining <= 0 && !editing ? 'disabled' : ''}>${submitLabel}</button>
            </div>
        </div>
    `;
    Modal.show(html);

    const titleInput = document.getElementById('cal-title-input');
    const titleCount = document.getElementById('cal-title-count');
    const colorInput = document.getElementById('cal-color-input');
    const updateCount = () => { titleCount.textContent = String([...titleInput.value].length); };
    titleInput.addEventListener('input', updateCount);
    updateCount();

    const highlightSwatch = (color) => {
        document.querySelectorAll('.cal-swatch').forEach(s => {
            s.classList.toggle('ring-sky-600', s.dataset.color === color);
            s.classList.toggle('ring-2', s.dataset.color === color);
        });
    };
    highlightSwatch(presetActive);
    document.querySelectorAll('.cal-swatch').forEach(s => {
        s.addEventListener('click', () => {
            colorInput.value = s.dataset.color;
            highlightSwatch(s.dataset.color);
        });
    });

    document.querySelectorAll('.cal-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openCalDayModal(dateKey, btn.dataset.edit));
    });
    document.querySelectorAll('.cal-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.del;
            const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
            if (res.ok) {
                calEntries = calEntries.filter(e => e.id !== id);
                renderCalendar();
                openCalDayModal(dateKey);
                showToast('일정이 삭제되었습니다.');
            }
        });
    });

    const cancelBtn = document.getElementById('cal-form-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => openCalDayModal(dateKey));

    const submitBtn = document.getElementById('cal-form-submit');
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.addEventListener('click', async () => {
            const err = document.getElementById('cal-form-err');
            err.classList.add('hidden');
            const title = titleInput.value.trim();
            const color = colorInput.value;
            if (!title) {
                err.textContent = '제목을 입력하세요.';
                err.classList.remove('hidden');
                return;
            }
            if ([...title].length > CAL_TITLE_MAX) {
                err.textContent = `제목은 ${CAL_TITLE_MAX}자 이내로 입력하세요.`;
                err.classList.remove('hidden');
                return;
            }
            const payload = { date: dateKey, title, color };
            try {
                const opts = {
                    method: editing ? 'PUT' : 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload),
                };
                const endpoint = editing ? `/api/calendar/${editing.id}` : '/api/calendar';
                const res = await fetch(endpoint, opts);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    const msg = Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ') : (data.detail || '저장 실패');
                    throw new Error(msg);
                }
                const saved = await res.json();
                if (editing) {
                    calEntries = calEntries.map(e => e.id === editing.id ? saved : e);
                } else {
                    calEntries.push(saved);
                }
                renderCalendar();
                openCalDayModal(dateKey);
                showToast(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.');
            } catch (ex) {
                err.textContent = ex.message;
                err.classList.remove('hidden');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('notify-settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', openNotifySettingsModal);
    const form = document.getElementById('shortcut-form');
    if (form) form.addEventListener('submit', submitShortcutForm);
    loadNotifySettings();

    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const todayBtn = document.getElementById('cal-today');
    if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
    if (todayBtn) todayBtn.addEventListener('click', gotoToday);
    loadCalendar();
});
