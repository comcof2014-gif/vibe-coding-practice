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

const PROMPTS = [
    {
        id: "common",
        title: "공통 현장정보 입력 블록",
        tag: "기본 입력값",
        summary: "모든 산출물 앞에 붙이는 대리점 현장정보 템플릿입니다. (영문 지시 → 한국어 출력)",
        prompt: PROMPT_LANG_HEADER + `You are preparing the standardized [Our Dealer Field Profile] block that every downstream deliverable in this workflow will reference. This block captures who the dealer is, what their region looks like, and what problems they face.

[FIELD PROFILE BLOCK]

[Instructions for this step]
- Do not produce any sales deliverable yet. Confirm that the profile above is captured and ready to attach to subsequent prompts.
- If any field is empty or still shows [input], list those fields back to the owner so they fill them in first.
- Briefly reflect to the owner (in Korean, 3~5 lines) which characteristics of this profile will most likely steer the downstream outputs (e.g., 구축 아파트 비중, 고령자 가정, 토요일 방문 가능 여부 등).` + PROMPT_LANG_FOOTER
    },
    {
        id: "db",
        title: "고객 DB 분류표 생성",
        tag: "CRM / 리드등급",
        summary: "기존 고객 DB를 A/B/C 우선순위로 나누고, 무상점검·견적·예약 액션을 정리합니다.",
        prompt: PROMPT_LANG_HEADER + `You are a CRM consultant designing the off-season sales strategy for a Korean boiler dealer. Build a customized customer DB classification table using the dealer field profile below.

[FIELD PROFILE BLOCK]

[Objective]
During the summer off-season, classify the existing customer database to identify:
1) free inspection (무상점검) candidates,
2) high replacement-probability customers,
3) review collection candidates,
4) peak-season reservation (성수기 예약) candidates.

[Required Content]
- Years since installation (설치 경과연수).
- Recent AS history.
- Discomfort keywords: hot water delay, heating imbalance, noise, smell, leaks (온수 지연, 난방 편차, 소음, 냄새, 누수).
- Safety-sensitive households (고령자, 영유아, 환자 가정).
- Regional characteristics specific to this dealer's area (구축 아파트, 빌라, 상가).
- Customers eligible for review requests.
- Quote inquiries that did not convert.
- Peak-season reservation candidates.

[Output Format]
Produce a Korean-language table with exactly these columns:
| 타깃 고객군 | CRM 필터 조건 | 확인해야 할 핵심 컬럼 | 고객에게 할 액션 | 우선순위 등급 | 현장 맞춤 설명 | 추천 멘트 |

[Writing Guidelines]
- Tier customers into A / B / C priority.
- Reflect the specific region, customer segment, and field issues from the profile in every row.
- The owner must be able to copy this directly into a CRM or spreadsheet.
- Include short verbal scripts (in Korean) staff can read to customers.
- End the deliverable with a section titled "이번 주 바로 실행할 DB 추출 순서 5단계" listing 5 concrete steps.` + PROMPT_LANG_FOOTER
    },
    {
        id: "call",
        title: "알림톡·해피콜 스크립트 생성",
        tag: "문자 / 전화 대본",
        summary: "무상 안심점검 안내, 해피콜 1차 대본, 거절 대응 문구를 만듭니다.",
        prompt: PROMPT_LANG_HEADER + `You are a sales copywriter producing customer outreach scripts for a Korean boiler dealer. Build alimtalk (알림톡), happy-call (해피콜), and objection-handling scripts tailored to the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
Before the winter peak season, contact existing customers about a free safety inspection (무상 안심점검) and convert those contacts into visit reservations, quote consultations, and pre-season reservations.

[Required Deliverables]
1. Three alimtalk (알림톡) message variants:
   - Standard version
   - Aging-apartment (구축 아파트) resident version
   - Hot-water-complaint customer version
2. A first-call happy-call script with these stages:
   - Opening
   - Reference to past service history
   - Discomfort confirmation questions
   - Free inspection offer
   - Schedule proposal
   - Closing remarks
3. Objection-handling scripts for each of these customer responses:
   - "멀쩡해요." (It's fine.)
   - "돈 드나요?" (Does it cost?)
   - "바빠요." (I'm busy.)
   - "다음에요." (Next time.)
   - "가격만 알려주세요." (Just tell me the price.)
   - "가족이랑 상의할게요." (I'll discuss with family.)
   - "다른 데도 알아보고 있어요." (I'm checking other dealers.)
4. Follow-up text messages for:
   - Customers who missed the call
   - Customers without a confirmed schedule
   - Post-inspection customers who have not decided on a quote
   - Peak-season reservation nudges

[Writing Guidelines]
- Avoid sales-heavy tone. Add trust phrases: 강매 없음, 출장비 0원, 점검 결과만 안내 — but mark with [수정 필요] if these do not match the dealer's real policy.
- Embed the dealer's specific region, complex names, and customer pain points naturally.
- Keep alimtalk messages under 500 Korean characters each.
- Happy-call scripts must be in spoken Korean (구어체) so a staff member can read them aloud.

[Output Format]
1. 알림톡 3종
2. 해피콜 1차 대본 (단계별 표)
3. 거절 대응 표
4. 후속 문자 4종
5. 사장님이 수정해야 할 항목 체크리스트` + PROMPT_LANG_FOOTER
    },
    {
        id: "cs",
        title: "클린 CS 체크리스트 생성",
        tag: "현장 품질관리",
        summary: "기사 방문 품질을 표준화하고, 점검 방문을 리뷰·예약으로 연결합니다.",
        prompt: PROMPT_LANG_HEADER + `You are a field-service quality manager building the on-site CS (Customer Service) playbook for a Korean boiler dealer. Build a clean-CS (클린 CS) checklist using the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
Standardize technician visit quality to reduce customer complaints, and convert free inspection visits into reviews, repeat visits, and peak-season reservations.

[Required Sections]
Cover all 8 stages of a technician visit:
1. Before departure (출발 전)
2. Before calling the customer (고객 연락 전)
3. Just before arrival (방문 직전)
4. Entering the home (자택 진입)
5. During inspection (점검 중)
6. Result explanation (결과 설명)
7. Before leaving (퇴실 전)
8. After-visit recording (방문 후 기록)

[Required Items]
- Uniform / nameplate / employee ID
- Shoe covers, protective mats, trash bags, microfiber cloths
- Air quality meter or water test kit availability
- 10~20 minute pre-arrival call
- Re-explanation of visit purpose
- Photo consent before taking photos
- Discomfort keyword capture
- 3-tier result explanation: 정상 / 주의 / 조치필요
- Site cleanup
- Honest review request — only to satisfied customers
- CRM / reservation log entry

[Output Format]
Produce a Korean-language table:
| 구간 | O/X 체크항목 | 담당자 | 고객에게 보이는 행동 | 주의할 말 | 완료 후 기록 |

[Writing Guidelines]
- For equipment the dealer does NOT own (per the profile), suggest a "대체 행동" (substitute action). Example: 공기질 측정기 없음 → 환기 상태 / 곰팡이 / 습도 체감 확인으로 대체.
- Reflect CS pain points specific to this dealer's customer segments (고령자, 맞벌이, 임대인, etc.).
- Use short, action-oriented Korean sentences a technician can scan on-site.
- End with a 5-minute "기사 교육용 5분 브리핑 멘트" the owner can read aloud at morning huddle.` + PROMPT_LANG_FOOTER
    },
    {
        id: "bs",
        title: "하절기 안심점검표 생성",
        tag: "무상점검 / 증거화",
        summary: "보일러·환기·수질 점검을 고객에게 보여줄 수 있는 증거 중심으로 정리합니다.",
        prompt: PROMPT_LANG_HEADER + `You are a technical sales specialist designing the summer free-inspection program (하절기 무상점검) for a Korean boiler dealer. Build a summer B/S 안심점검표 using the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
On every summer inspection visit, leave the customer with visible evidence of the inspection, and convert routine inspection into pre-winter preventive maintenance, replacement consideration, and peak-season reservation.

[Required Inspection Zones]
1. 보일러 본체 (boiler body)
2. 배기통·연통 (flue / exhaust)
3. 온수 (hot water)
4. 난방 (heating)
5. 누수·부식 (leaks / corrosion)
6. 소음·진동 (noise / vibration)
7. 환기 (ventilation)
8. 공기질 (air quality)
9. 수질 (water quality)
10. 고객 생활 불편사항 (lifestyle discomfort items)

[Output Format]
Produce a Korean-language table:
| 구역 | 점검항목 | 점검 방법 | 고객에게 보여줄 증거 | 판정 기준 | 판정 결과 | 다음 액션 |

[Decision Tiers]
정상 / 주의 / 조치필요 / 교체검토

[Writing Guidelines]
- Include replacement-likelihood criteria by installation age (e.g., 4~6년: 예방관리, 7년 이상: 교체검토).
- Reflect dealer-area-specific issues from the profile (누수, 배기통, 온수 지연, 소음, 녹물, 냄새 등).
- Use a "예방점검" framing instead of scare tactics.
- If the dealer lacks air-quality meter or water-test kit, provide alternative inspection methods.
- After the table, add a "3분 결과 안내 멘트" (3-minute result-explanation script for technicians to read).
- After that, add follow-up actions per result tier. Example:
  정상 → 리뷰 요청 / 주의 → 9월 전 재점검 / 조치필요 → 견적 안내 / 교체검토 → 성수기 예약 제안` + PROMPT_LANG_FOOTER
    },
    {
        id: "upsell",
        title: "업세일링 3대 패키지 생성",
        tag: "패키지 / 객단가",
        summary: "가격 비교가 아니라 고객 문제 해결형 패키지로 상담 구조를 바꿉니다.",
        prompt: PROMPT_LANG_HEADER + `You are a sales strategist designing upsell packages and consultative scripts for a Korean boiler dealer. Build 3~5 customized upsell packages using the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
Stop customers from comparing on price alone. Convert each consultation into a problem-solving package recommendation that raises 객단가 (per-customer revenue) and reservation conversion.

[Base Package Direction — required]
1. 안심 케어 세트
   - Target: 7+ year users, repeat-AS customers, elderly households
2. 스마트 라이프 세트
   - Target: dual-income households, frequently-out homes, landlords
3. 온수 특화 세트
   - Target: hot-water-delay complaints, low pressure, rust/chlorine smell

Add 1~2 additional packages tailored to the profile (e.g., 구축 아파트 집중 세트, 임대인 관리 세트, 상가 영업중단 최소화 세트, 고령자 안전 세트).

[Output Format]
Produce a Korean-language table:
| 패키지명 | 구성 | 타깃 고객 | 고객 불편 포인트 | 제안 멘트 | 가격 설명 방식 | 후속 액션 |

[Writing Guidelines]
- Leave product names and prices as [제품명 입력], [가격 입력] for the owner to fill in later.
- Frame each package as "problem solving," not "cheap product."
- Embed regional field stories and real customer reactions from the profile.
- For each package, add an objection-handling script for when the customer declines.
- At the end, add "상담 시 패키지 선택 질문 7개" — seven diagnostic questions staff can ask the customer to choose the right package.` + PROMPT_LANG_FOOTER
    },
    {
        id: "marketing",
        title: "SNS/리뷰 캘린더 생성",
        tag: "4주 실행계획",
        summary: "지역 채널, 네이버 플레이스, 지역카페, 리뷰 요청을 4주 액션으로 정리합니다.",
        prompt: PROMPT_LANG_HEADER + `You are a local marketing manager designing the 4-week off-season acquisition plan for a Korean boiler dealer. Build a 4-week regional marketing / SNS / review calendar using the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
From May to August (off-season), grow free-inspection visits and simultaneously build Naver Place reviews, local-cafe responses (지역카페), apartment-complex bulletin board reach, and peak-season reservations.

[Required Channels]
1. 기존 고객 알림톡
2. 네이버 플레이스 공지
3. 지역카페 생활정보 글
4. 아파트 단지 게시판 / 엘리베이터 게시 협의
5. 방문 고객 QR 리뷰카드
6. 점검 후 리마인드 문자
7. 성수기 예약대장 정리

[Output Format]
Produce a Korean-language table covering Week 1 to Week 4:
| 주차 | 핵심 목표 | 실행 액션 | 사용할 문구/콘텐츠 | 담당자 | KPI | 주의사항 |

[Writing Guidelines]
- Reflect the dealer's region name, complex names, housing type, and customer segment in every row.
- Include 1 example Naver Place announcement (네이버 플레이스 공지문) in Korean.
- Include 1 example 지역카페 lifestyle-info post (지역카페 생활정보 글) in Korean.
- Include 1 short bulletin-board notice (아파트 게시판용 안내문) in Korean.
- Review requests must never look like coerced-positive reviews. Frame them as "솔직한 후기" requests to satisfied customers only.
- End the deliverable with "이번 달 마케팅 점검표" (this month's marketing audit checklist).` + PROMPT_LANG_FOOTER
    },
    {
        id: "reservation",
        title: "성수기 예약 대장 생성",
        tag: "예약관리 / 재콜",
        summary: "비수기 점검·견적·보류 고객을 9~12월 성수기 예약으로 전환하는 대장을 만듭니다.",
        prompt: PROMPT_LANG_HEADER + `You are a sales-operations consultant designing the peak-season reservation management system for a Korean boiler dealer. Build a peak-season reservation log (성수기 예약 대장) using the dealer profile below.

[FIELD PROFILE BLOCK]

[Objective]
Convert inspection, quote, and on-hold customers gathered in May~August into confirmed September~December installation / repair / replacement reservations.

[Required Management Columns]
- 예약ID
- 고객ID
- 고객명
- 연락처
- 주소 / 단지명
- 설치경과년수
- 현재 보일러 모델
- 리드등급
- 현재상태
- 보류사유
- 희망공사월
- 관심패키지
- B/S 점검 결과
- 주의항목수
- 조치필요수
- 다음컨택일
- 담당자
- 리뷰상태
- 최종결과
- 비고

[Status Vocabulary]
신규, 알림톡발송, 통화완료, 점검예약, 점검완료, 견적발송, 가족상담중, 타사비교중, 예약확정, 구매완료, 거절, 수신거부.

[Hold-Reason Vocabulary]
비용, 일정, 가족상담, 타사비교, 아직 정상작동, 임대인 승인 필요, 세입자 일정 미정.

[Output Format]
Produce a Korean-language table:
| 컬럼명 | 입력 예시 | 선택값 | 관리 목적 | 재콜 기준 | 담당자 메모 |

[Writing Guidelines]
- The structure must be directly copyable into Excel or Google Sheets.
- Define explicit A/B/C 리드등급 criteria.
- Define operational rules to prevent missing the 다음컨택일 (next-contact-date).
- Provide a re-call (재콜) script per hold-reason category.
- Tie KPIs to the targets in the dealer profile.
- End the deliverable with a Korean process flow titled "5월 알림톡 → 6월 무상점검 → 7월 리뷰·패키지 제안 → 8~9월 성수기 예약 확정".` + PROMPT_LANG_FOOTER
    },
    {
        id: "integrated",
        title: "7대 산출물 통합 생성",
        tag: "원클릭 전체 생성",
        summary: "개별 산출물을 한 번에 생성하는 통합 프롬프트입니다.",
        prompt: PROMPT_LANG_HEADER + `You are a senior consultant building the complete off-season sales toolkit for a Korean boiler dealer. Using the dealer profile below, produce the dealer's customized "비수기 보일러 영업 7대 실전 도구" in one pass.

[FIELD PROFILE BLOCK]

[Required Deliverables]
1. 고객 DB 분류표
2. 알림톡·해피콜 스크립트
3. 클린 CS 체크리스트
4. 하절기 B/S 안심점검표
5. 업세일링 3대 패키지
6. 지역 마케팅·SNS/리뷰 캘린더
7. 성수기 예약 대장

[Writing Principles for All 7 Deliverables]
- Every deliverable must reflect the dealer's region, customer segment, field issues, and strengths.
- Weave the owner's "현장 이야기" (field story) into scripts, KPI targets, and action items.
- No abstract strategy language. Use tables, scripts, and checklists that staff can execute today.
- Leave product names, prices, phone numbers, and complex names as [수정 필요] or [입력] placeholders for the owner.
- Avoid pressure-sales tone. Frame everything around 예방점검 · 안전 · 겨울 전 준비 · 솔직 후기 요청.

[Output Format]
- Number each deliverable (1 through 7) as a top-level section.
- Use tables, sample messages, phone scripts, checklists, and KPIs inside each section.
- End the entire output with a section titled "이번 주 바로 실행할 10가지 액션" — 10 concrete actions the owner can start tomorrow.` + PROMPT_LANG_FOOTER
    }
];

// Prompt State
let p_current = 0;
let p_paused = false;
let p_progress = 0;
const p_intervalMs = 8200;
let p_timer;
const p_fieldIds = ['dealer','region','customers','housing','issues','quotes','strengths','equipment','goals','story'];

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

    p_renderTabs();
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
    document.getElementById('p-generateBtn').onclick = p_generateDemo;
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

    p_fieldIds.forEach(id => {
        document.getElementById(`p-${id}`).addEventListener('input', () => {
            p_render();
            p_generateDemo();
        });
    });
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
function p_getData(){
    const data = {};
    p_fieldIds.forEach(id => data[id] = (document.getElementById(`p-${id}`).value || '').trim());
    return data;
}
function p_safe(v, fallback){ return v && v.length ? v : fallback; }
function p_lines(v){ return p_safe(v,'').split(/[\n,\/]+/).map(s=>s.trim()).filter(Boolean); }
function p_asBullets(v, fallback){
    const arr = p_lines(v);
    return (arr.length ? arr : fallback).map(x=>'   - '+x).join('\n');
}
function p_contextBlock(){
    const d = p_getData();
    return `[Our Dealer Field Profile]

1. Dealer name (대리점명): ${p_safe(d.dealer,'[input]')}
2. Service area (담당 지역): ${p_safe(d.region,'[input]')}
3. Primary customer segment (주요 고객층): ${p_safe(d.customers,'[input]')}
4. Primary housing types (주요 주거 형태): ${p_safe(d.housing,'[input]')}
5. Frequent field issues (자주 나오는 현장 문제):
${p_asBullets(d.issues,['[input]'])}
6. Common customer remarks (최근 고객이 많이 하는 말):
${p_asBullets(d.quotes,['[input]'])}
7. Our dealer's strengths (우리 대리점의 강점):
${p_asBullets(d.strengths,['[input]'])}
8. Equipment and services we have (보유 장비 및 서비스):
${p_asBullets(d.equipment,['[input]'])}
9. This month's targets (이번 달 목표): ${p_safe(d.goals,'[input]')}
10. Field story the owner wants to highlight (사장님이 꼭 넣고 싶은 현장 이야기):
   ${p_safe(d.story,'[input]')}`;
}
function p_hydratedPrompt(prompt){
    return prompt.prompt.replace('[FIELD PROFILE BLOCK]', p_contextBlock());
}

function p_renderTabs(){
    const tabsContainer = document.getElementById('p-tabs');
    tabsContainer.innerHTML = '';
    PROMPTS.forEach((p,i)=>{
        const b = document.createElement('button');
        b.className = `whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${i===p_current ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`;
        b.textContent = `${String(i+1).padStart(2,'0')} ${p.title.replace(' 생성','')}`;
        b.onclick = () => { p_current = i; p_progress = 0; p_render(); p_generateDemo(); };
        tabsContainer.appendChild(b);
    });
}

function p_render(){
    const p = PROMPTS[p_current];
    document.getElementById('p-promptTag').textContent = p.tag;
    document.getElementById('p-promptTitle').textContent = p.title;
    document.getElementById('p-promptSummary').textContent = p.summary;
    document.getElementById('p-promptText').textContent = p_hydratedPrompt(p);
    document.getElementById('p-counter').textContent = `${p_current+1} / ${PROMPTS.length}`;
    p_renderTabs();
}

function p_next(){ p_current = (p_current + 1) % PROMPTS.length; p_progress = 0; p_render(); p_generateDemo(); }
function p_prev(){ p_current = (p_current - 1 + PROMPTS.length) % PROMPTS.length; p_progress = 0; p_render(); p_generateDemo(); }

function p_tick(){
    if(p_paused || document.getElementById('view-prompt').classList.contains('hidden')) return;
    p_progress += 100 / (p_intervalMs / 200);
    if(p_progress >= 100){ p_next(); p_progress = 0; }
    document.getElementById('p-bar').style.width = p_progress + '%';
}

function showToast(msg='복사되었습니다.') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2000);
}

async function p_copyText(text){ await navigator.clipboard.writeText(text); showToast(); }

function p_sample(){
    const sampleData = {
        dealer:'○○보일러 강동대리점',
        region:'서울 강동구 고덕동, 명일동, 암사동',
        customers:'15년 이상 구축 아파트 거주자, 고령자 가정, 맞벌이 부부',
        housing:'구축 아파트와 빌라가 많음',
        issues:'온수 나오는 시간이 오래 걸림\n겨울철 난방 편차가 큼\n보일러 소음과 배기통 노후 문의가 많음',
        quotes:'아직 고장은 안 났어요.\n겨울에만 쓰는데 지금 점검해야 하나요?\n일단 가격만 알려주세요.',
        strengths:'같은 단지 시공 경험이 많음\n토요일 오전 방문 가능\n설치 후 사용법 설명과 체크콜 제공',
        equipment:'공기질 측정기 있음\n수질 간이키트 있음\nQR 리뷰카드 있음\n보양매트와 덧신 준비',
        goals:'무상점검 50건, 견적 20건, 성수기 예약 15건, 리뷰 10건',
        story:'작년 겨울 고덕동 구축 아파트에서 온수 지연과 난방 편차 문의가 많았다. 고객들은 고장 전 교체 필요성을 잘 못 느끼기 때문에 올해는 여름 무료점검으로 현재 상태를 보여주고 겨울 전 미리 예약을 잡는 방식으로 운영하고 싶다.'
    };
    Object.entries(sampleData).forEach(([k,v]) => document.getElementById(`p-${k}`).value = v);
    p_render(); p_generateDemo(); showToast('예시 데이터가 입력되었습니다.');
}

function p_clearForm(){
    p_fieldIds.forEach(id => document.getElementById(`p-${id}`).value='');
    p_render(); p_generateDemo(); showToast('입력값을 초기화했습니다.');
}

function d_common(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">🏢 대리점 현장정보 요약</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <p class="text-stone-500 text-xs font-bold mb-1">대리점명 / 지역</p>
                <p class="font-semibold text-sky-700">${p_safe(d.dealer,'미입력')} <br> <span class="text-stone-700 font-normal text-xs">📍 ${p_safe(d.region,'지역 미입력')}</span></p>
            </div>
            <div class="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <p class="text-stone-500 text-xs font-bold mb-1">주요 타겟</p>
                <p class="font-semibold text-stone-800">${p_safe(d.customers,'고객층 미입력')}</p>
                <p class="text-xs text-stone-600 mt-1">🏠 ${p_safe(d.housing,'주거 형태 미입력')}</p>
            </div>
        </div>
        <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
            <p class="text-blue-800 font-bold text-xs mb-1">🚨 주요 현장 문제</p>
            <ul class="list-disc pl-4 text-sm text-blue-900">${p_asBullets(d.issues,['미입력']).split('\n').map(l=>`<li>${l.replace('- ','')}</li>`).join('')}</ul>
        </div>
    </div>`;
}
function d_db(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">📊 고객 DB 분류 도표</h3>
        <div class="overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
            <table class="min-w-full divide-y divide-stone-200 text-sm text-left">
                <thead class="bg-stone-100 text-stone-600">
                    <tr><th class="px-3 py-2 font-semibold">등급</th><th class="px-3 py-2 font-semibold">타깃 고객군</th><th class="px-3 py-2 font-semibold">필터 조건</th><th class="px-3 py-2 font-semibold">추천 멘트</th></tr>
                </thead>
                <tbody class="divide-y divide-stone-200 bg-white">
                    <tr><td class="px-3 py-2"><span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-xs">A급</span></td><td class="px-3 py-2 font-semibold">교체 임박</td><td class="px-3 py-2 text-stone-600">설치 7년 이상, 잦은 AS</td><td class="px-3 py-2 italic text-xs">"급하게 바꾸기 전, 상태만 확인해드릴게요."</td></tr>
                    <tr><td class="px-3 py-2"><span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold text-xs">B급</span></td><td class="px-3 py-2 font-semibold">온수 불만</td><td class="px-3 py-2 text-stone-600">온수 지연, 온도 편차</td><td class="px-3 py-2 italic text-xs">"실제 불편하신 온수 문제부터 보겠습니다."</td></tr>
                    <tr><td class="px-3 py-2"><span class="bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold text-xs">C급</span></td><td class="px-3 py-2 font-semibold">가격 보류</td><td class="px-3 py-2 text-stone-600">견적 문의 후 미구매</td><td class="px-3 py-2 italic text-xs">"성수기 전 우선 연락 명단에 올려드릴까요?"</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}
function d_call(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">💬 스마트 해피콜 스크립트</h3>
        <div class="bg-stone-100 p-4 rounded-xl flex flex-col space-y-3">
            <div class="self-start max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-stone-200">
                <p class="text-xs font-bold text-stone-400 mb-1">상담원 (오프닝)</p>
                <p class="text-sm">"안녕하세요, ${p_safe(d.dealer,'○○대리점')}입니다. 지난 겨울 보일러 쓰시면서 <strong class="text-sky-600">${p_safe(d.issues,'불편하셨던 점')}</strong>은 없으셨나요?"</p>
            </div>
            <div class="self-end max-w-[80%] bg-sky-500 p-3 rounded-2xl rounded-tr-none shadow-sm text-white">
                <p class="text-xs font-bold text-sky-200 mb-1">고객 (거절 반응)</p>
                <p class="text-sm">"${p_safe(d.quotes,'아직 고장은 안 났어요. 멀쩡해요.')}"</p>
            </div>
            <div class="self-start max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-stone-200">
                <p class="text-xs font-bold text-emerald-500 mb-1">상담원 (대응/제안)</p>
                <p class="text-sm">"맞습니다! 그래서 고장 난 뒤가 아니라, 멀쩡할 때 겨울 전 상태만 출장비 없이 확인해드리는 <strong>무상 예방점검</strong> 기간입니다. 편하신 요일이 언제실까요?"</p>
            </div>
        </div>
    </div>`;
}
function d_cs(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">✨ 클린 CS 현장 체크리스트</h3>
        <div class="grid gap-3">
            <div class="flex items-center p-3 bg-white border border-stone-200 rounded-lg shadow-sm">
                <div class="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-3 text-xs">✔️</div>
                <div>
                    <p class="font-bold text-sm">출발 전 / 자택 진입</p>
                    <p class="text-xs text-stone-500">유니폼·덧신 착용 필수. 소속 및 방문 목적(${p_safe(d.dealer,'대리점')}) 명확히 고지</p>
                </div>
            </div>
            <div class="flex items-center p-3 bg-white border border-stone-200 rounded-lg shadow-sm">
                <div class="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-3 text-xs">✔️</div>
                <div>
                    <p class="font-bold text-sm">점검 중 (공감)</p>
                    <p class="text-xs text-stone-500">"${p_safe(d.issues,'온수·소음')}" 등 고객 불편 키워드 집중 경청 및 사진 촬영 전 동의</p>
                </div>
            </div>
            <div class="flex items-center p-3 bg-white border border-stone-200 rounded-lg shadow-sm">
                <div class="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-3 text-xs">✔️</div>
                <div>
                    <p class="font-bold text-sm">결과 설명 및 퇴실</p>
                    <p class="text-xs text-stone-500">정상/주의/조치 3단계 시각적 설명 후, 긍정 고객에게만 조심스럽게 리뷰 요청</p>
                </div>
            </div>
        </div>
    </div>`;
}
function d_bs(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">🔍 하절기 B/S 안심점검 도표</h3>
        <div class="overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
            <table class="min-w-full divide-y divide-stone-200 text-sm text-left">
                <thead class="bg-stone-50 text-stone-600">
                    <tr><th class="px-3 py-2 font-semibold">점검 구역</th><th class="px-3 py-2 font-semibold">고객 제시 증거</th><th class="px-3 py-2 font-semibold">판정 예시</th></tr>
                </thead>
                <tbody class="divide-y divide-stone-200 bg-white">
                    <tr>
                        <td class="px-3 py-2 font-semibold">보일러 본체</td><td class="px-3 py-2 text-stone-600">제조년월 라벨 사진</td>
                        <td class="px-3 py-2"><span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">교체검토</span> (7년↑)</td>
                    </tr>
                    <tr>
                        <td class="px-3 py-2 font-semibold">온수 / 난방</td><td class="px-3 py-2 text-stone-600">타이머 도달 시간, 열화상</td>
                        <td class="px-3 py-2"><span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">주의</span> (${p_safe(d.issues,'온수 지연')} 등)</td>
                    </tr>
                    <tr>
                        <td class="px-3 py-2 font-semibold">배기통 / 수질</td><td class="px-3 py-2 text-stone-600">이음새 사진, 채수 컵 비교</td>
                        <td class="px-3 py-2"><span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">정상</span> (문제 없음)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;
}
function d_upsell(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">🎁 업세일링 3대 패키지 카드</h3>
        <div class="grid grid-cols-1 gap-3">
            <div class="border-2 border-sky-400 bg-sky-50 rounded-xl p-4 shadow-sm relative">
                <div class="absolute -top-3 right-4 bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded shadow">BEST 추천</div>
                <h4 class="font-bold text-sky-900 text-base mb-1">🛡️ 안심 케어 세트</h4>
                <p class="text-xs text-sky-700 mb-2 font-semibold">타겟: 7년 이상, 고령자 가정</p>
                <p class="text-sm text-stone-700 mb-2">보일러 교체 + 배기/누수 정밀 점검 + 겨울철 우선 AS 보장</p>
                <p class="text-xs text-stone-500 italic">"고장 후 대응보다 예방이 중요합니다."</p>
            </div>
            <div class="border border-stone-200 bg-white rounded-xl p-4 shadow-sm">
                <h4 class="font-bold text-stone-800 text-base mb-1">📱 스마트 라이프 세트</h4>
                <p class="text-xs text-stone-500 mb-2 font-semibold">타겟: 맞벌이, 임대인</p>
                <p class="text-sm text-stone-700">보일러 교체 + 스마트 온도조절기 + 앱 연동 서비스</p>
            </div>
            <div class="border border-stone-200 bg-white rounded-xl p-4 shadow-sm">
                <h4 class="font-bold text-stone-800 text-base mb-1">💧 온수 특화 세트</h4>
                <p class="text-xs text-stone-500 mb-2 font-semibold">타겟: ${p_safe(d.issues,'온수 지연, 수압 불만')}</p>
                <p class="text-sm text-stone-700">보일러 교체 + 온수 출수/수질 점검 + 프리미엄 필터</p>
            </div>
        </div>
    </div>`;
}
function d_marketing(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">📅 4주 마케팅 실행 캘린더</h3>
        <div class="relative border-l-2 border-sky-200 ml-3 space-y-4 pb-4">
            <div class="relative pl-6">
                <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-500"></div>
                <h4 class="font-bold text-sm text-stone-800">1주차: 타겟 DB 추출 & 알림톡</h4>
                <p class="text-xs text-stone-600 mt-1">${p_safe(d.region,'담당 지역')} 고객 대상 무상점검 알림톡 발송 (목표: 100건)</p>
            </div>
            <div class="relative pl-6">
                <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-400"></div>
                <h4 class="font-bold text-sm text-stone-800">2주차: 방문 점검 & 리뷰 유도</h4>
                <p class="text-xs text-stone-600 mt-1">현장 방문 시 QR 리뷰카드 배포 및 리포트 제공</p>
            </div>
            <div class="relative pl-6">
                <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-300"></div>
                <h4 class="font-bold text-sm text-stone-800">3주차: 지역 커뮤니티 바이럴</h4>
                <p class="text-xs text-stone-600 mt-1">맘카페/당근마켓에 "${p_safe(d.issues,'온수 지연')} 체크법" 정보글 작성</p>
            </div>
            <div class="relative pl-6">
                <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-orange-400"></div>
                <h4 class="font-bold text-sm text-stone-800">4주차: 성수기 예약 락인 (Lock-in)</h4>
                <p class="text-xs text-stone-600 mt-1">보류 고객 대상 재콜 진행, 9~11월 우선예약 확정</p>
            </div>
        </div>
    </div>`;
}
function d_reservation(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">🗓️ 성수기 예약 대장 샘플</h3>
        <div class="overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
            <table class="min-w-full divide-y divide-stone-200 text-xs text-left whitespace-nowrap">
                <thead class="bg-stone-100 text-stone-600">
                    <tr><th class="px-2 py-2">고객명/단지</th><th class="px-2 py-2">현재 상태</th><th class="px-2 py-2">관심 패키지</th><th class="px-2 py-2">다음 컨택일</th></tr>
                </thead>
                <tbody class="divide-y divide-stone-200 bg-white">
                    <tr><td class="px-2 py-2 font-semibold">김*동 (${p_safe(d.region,'고덕동')} 래미안)</td><td class="px-2 py-2"><span class="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">점검완료/보류</span></td><td class="px-2 py-2">온수 특화</td><td class="px-2 py-2 text-red-600 font-bold">06-10 (재콜)</td></tr>
                    <tr><td class="px-2 py-2 font-semibold">이*수 (${p_safe(d.housing,'구축 빌라')})</td><td class="px-2 py-2"><span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">예약확정</span></td><td class="px-2 py-2">안심 케어</td><td class="px-2 py-2 text-stone-500">09-01 (설치)</td></tr>
                    <tr><td class="px-2 py-2 font-semibold">박*민 (상가)</td><td class="px-2 py-2"><span class="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">견적발송</span></td><td class="px-2 py-2">기본형</td><td class="px-2 py-2 text-stone-800">06-15 (확인)</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}
function d_integrated(d){
    return `
    <div class="space-y-4">
        <h3 class="text-lg font-bold text-stone-800 border-b pb-2">🎯 7대 실전 도구 통합 서머리</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="bg-white border border-stone-200 p-3 rounded-lg shadow-sm flex items-start gap-3">
                <div class="text-2xl mt-1">📊</div>
                <div><p class="font-bold text-stone-800">DB 분류 & 알림톡</p><p class="text-xs text-stone-500">${p_safe(d.region,'지역')} 7년 이상 고객 A등급 타겟팅 및 예약 유도 발송</p></div>
            </div>
            <div class="bg-white border border-stone-200 p-3 rounded-lg shadow-sm flex items-start gap-3">
                <div class="text-2xl mt-1">✨</div>
                <div><p class="font-bold text-stone-800">클린 CS & 안심점검</p><p class="text-xs text-stone-500">덧신 착용 필수, ${p_safe(d.issues,'온수/난방 문제')} 증거 기반 리포트 교부</p></div>
            </div>
            <div class="bg-white border border-stone-200 p-3 rounded-lg shadow-sm flex items-start gap-3">
                <div class="text-2xl mt-1">🎁</div>
                <div><p class="font-bold text-stone-800">업세일링 패키지</p><p class="text-xs text-stone-500">단순 가격 비교 방어. 고객 맞춤 3대 세트 역제안</p></div>
            </div>
            <div class="bg-white border border-stone-200 p-3 rounded-lg shadow-sm flex items-start gap-3">
                <div class="text-2xl mt-1">📅</div>
                <div><p class="font-bold text-stone-800">마케팅 & 예약 락인</p><p class="text-xs text-stone-500">리뷰 획득 후 9~12월 성수기 대장에 우선 등록 확정</p></div>
            </div>
        </div>
    </div>`;
}

function p_generateDemo(){
    const d = p_getData();
    const id = PROMPTS[p_current].id;
    const map = {common:d_common, db:d_db, call:d_call, cs:d_cs, bs:d_bs, upsell:d_upsell, marketing:d_marketing, reservation:d_reservation, integrated:d_integrated};
    document.getElementById('p-outputText').innerHTML = (map[id] || d_common)(d);
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
