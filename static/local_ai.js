(function () {
    const state = {
        status: null,
        polling: null,
        generating: false,
    };

    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function showToastLocal(message) {
        if (typeof showToast === 'function') {
            showToast(message);
            return;
        }
        console.log(message);
    }

    function injectPanel() {
        if (byId('local-ai-panel')) return;
        const promptView = byId('view-prompt');
        if (!promptView) return;
        relabelOutputPanel();

        const firstSection = promptView.querySelector('section');
        const panel = document.createElement('section');
        panel.id = 'local-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200';
        panel.innerHTML = `
            <div class="flex flex-col xl:flex-row xl:items-start gap-4">
                <div class="xl:w-[320px] shrink-0">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <h3 class="font-bold text-stone-800">로컬 AI 예시 생성기</h3>
                        <span id="local-ai-badge" class="text-[11px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">대기</span>
                    </div>
                    <div class="h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                        <div id="local-ai-progress" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width:0%"></div>
                    </div>
                    <div id="local-ai-phase" class="text-xs text-stone-500 leading-relaxed">SmolLM2 로컬 모델 상태를 확인하는 중입니다.</div>
                    <div id="local-ai-warning" class="hidden mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"></div>
                </div>
                <div class="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div class="lg:col-span-8">
                        <label class="block text-xs font-bold text-stone-600 mb-1">결과에 추가로 반영할 요청</label>
                        <textarea id="local-ai-extra" class="w-full border border-stone-300 rounded-md p-3 h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="예: 고객에게 바로 보낼 수 있는 알림톡 문구를 더 구체적으로 써 주세요."></textarea>
                    </div>
                    <div class="lg:col-span-4 flex flex-col">
                        <button id="local-ai-generate-btn" class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">로컬 AI 예시 생성</button>
                        <button id="local-ai-sample-btn" class="mt-2 px-4 py-2 bg-white text-stone-700 border border-stone-300 rounded-md text-sm font-semibold hover:bg-stone-50 transition-colors">예시 채우고 생성</button>
                        <div id="local-ai-result" class="mt-3 flex-grow text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-md p-3 min-h-[56px]">현재 선택한 프롬프트의 오른쪽 결과 화면을 로컬 AI가 작성합니다.</div>
                    </div>
                </div>
            </div>
        `;
        if (firstSection) firstSection.insertAdjacentElement('afterend', panel);
        else promptView.prepend(panel);

        byId('local-ai-generate-btn').addEventListener('click', generateDemo);
        byId('local-ai-sample-btn').addEventListener('click', () => {
            if (typeof p_sample === 'function') p_sample();
            generateDemo();
        });
    }

    function relabelOutputPanel() {
        const out = byId('p-outputText');
        const section = out && out.closest('section');
        if (!section) return;
        const heading = section.querySelector('h3');
        if (heading) heading.textContent = '3. 로컬 AI 예시 결과';
        const info = section.children && section.children[1];
        if (info) {
            info.innerHTML = `
                <div class="flex items-center gap-2 mb-1 text-stone-800 font-semibold">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> 오프라인 로컬 AI 모드
                </div>
                현재 선택한 프롬프트와 입력 정보를 바탕으로, EXE 안의 로컬 모델이 예시 결과를 작성합니다.
            `;
        }
    }

    function receiveStatus(status) {
        state.status = status || {};
        const progress = Math.max(0, Math.min(100, Number(state.status.progress || 0)));
        const badge = byId('local-ai-badge');
        const bar = byId('local-ai-progress');
        const phase = byId('local-ai-phase');
        const warning = byId('local-ai-warning');
        const generateBtn = byId('local-ai-generate-btn');
        if (!badge || !bar || !phase) return;

        bar.style.width = `${progress}%`;
        phase.textContent = state.status.phase || '로컬 AI 상태 확인 중';
        if (state.status.model_file) {
            phase.textContent += ` · ${state.status.model_file}`;
        }
        if (state.status.model_size_mb) {
            phase.textContent += ` · ${state.status.model_size_mb}MB`;
        }

        if (state.status.ready) {
            badge.textContent = state.status.state === 'generating' ? '생성 중' : '준비 완료';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200';
            if (generateBtn) generateBtn.disabled = state.generating;
        } else if (state.status.state === 'error') {
            badge.textContent = '오류';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200';
            if (generateBtn) generateBtn.disabled = state.generating;
            phase.textContent = `로컬 모델 실행 실패 · ${state.status.model_file || ''} · ${state.status.model_size_mb || '?'}MB`;
            if (warning) {
                warning.textContent = state.status.error || '모델 엔진을 불러오지 못했습니다. 기본 예시 생성은 계속 사용할 수 있습니다.';
                warning.classList.remove('hidden');
            }
        } else {
            badge.textContent = '준비 중';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200';
            if (generateBtn) generateBtn.disabled = true;
        }

        if (warning && state.status.state !== 'error') {
            if (state.status.size_warning) {
                warning.textContent = state.status.size_warning;
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
    }

    async function pollStatus() {
        try {
            const res = await fetch('/api/ai/status');
            if (res.ok) receiveStatus(await res.json());
        } catch {
            receiveStatus({ state: 'error', progress: 0, phase: '로컬 AI 상태 확인 실패', ready: false });
        }
        clearTimeout(state.polling);
        const done = state.status && (state.status.ready || state.status.state === 'error');
        if (!done || state.generating) state.polling = setTimeout(pollStatus, 1200);
    }

    async function startEngine() {
        try {
            const res = await fetch('/api/ai/start', { method: 'POST' });
            if (res.ok) receiveStatus(await res.json());
        } catch {
            receiveStatus({ state: 'error', progress: 0, phase: '로컬 AI 시작 실패', ready: false });
        }
        pollStatus();
    }

    function getCurrentPrompt() {
        try {
            if (typeof PROMPTS === 'undefined') return null;
            if (typeof p_current === 'undefined') return PROMPTS[0];
            return PROMPTS[p_current] || PROMPTS[0];
        } catch {
            return null;
        }
    }

    function getPromptInputs(prompt) {
        try {
            if (typeof p_getDataFor === 'function') return p_getDataFor(prompt);
        } catch {
            return {};
        }
        const data = {};
        document.querySelectorAll('#p-common-fields input, #p-common-fields textarea, #p-specific-fields input, #p-specific-fields textarea')
            .forEach(el => {
                const label = el.closest('.space-y-1')?.querySelector('label')?.textContent?.trim() || el.id || '입력';
                const value = (el.value || '').trim();
                if (value) data[label] = value;
            });
        return data;
    }

    function compactInputs(inputs) {
        const out = {};
        Object.entries(inputs || {}).forEach(([key, value]) => {
            const cleanKey = String(key || '').trim().slice(0, 80);
            const cleanValue = String(value || '').trim().slice(0, 650);
            if (cleanKey && cleanValue) out[cleanKey] = cleanValue;
        });
        return out;
    }

    function makePayload(prompt) {
        return {
            mode: 'demo',
            prompt_id: prompt.id || '',
            title: prompt.title || '',
            summary: String(prompt.summary || '').slice(0, 600),
            output_sections: (prompt.outputSections || []).slice(0, 8).map(item => String(item).slice(0, 100)),
            inputs: compactInputs(getPromptInputs(prompt)),
            extra_request: (byId('local-ai-extra')?.value || '').trim().slice(0, 700),
        };
    }

    function pausePromptRolling() {
        try {
            if (typeof p_paused !== 'undefined') p_paused = true;
            const btn = byId('p-pauseBtn');
            if (btn) btn.textContent = '▶ 롤링 재생';
        } catch {
            // no-op
        }
    }

    async function generateDemo() {
        const result = byId('local-ai-result');
        const button = byId('local-ai-generate-btn');
        const prompt = getCurrentPrompt();
        if (!prompt) {
            if (result) result.textContent = '현재 프롬프트 정보를 찾지 못했습니다.';
            return;
        }
        if (!state.status || (!state.status.ready && state.status.state !== 'error')) {
            if (result) result.textContent = '모델 준비가 끝난 뒤 다시 눌러 주세요.';
            startEngine();
            return;
        }

        pausePromptRolling();
        state.generating = true;
        if (button) button.disabled = true;
        if (result) result.textContent = '로컬 AI가 오른쪽 예시 결과를 작성하는 중입니다.';
        renderDemoShell(prompt);

        const payload = makePayload(prompt);
        renderAdaptivePromptStructure(prompt, payload);

        if (state.status && state.status.state === 'error' && !state.status.ready) {
            renderPreviewResult(prompt, payload);
            if (result) result.textContent = '로컬 모델 실행 오류가 있어 실전 예시 미리보기를 표시했습니다.';
            state.generating = false;
            if (button) button.disabled = false;
            return;
        }

        try {
            const res = await fetch('/api/ai/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.status === 409) {
                const data = await res.json();
                if (data.detail && data.detail.status) receiveStatus(data.detail.status);
                renderPreviewResult(prompt, payload);
                if (result) result.textContent = '모델 준비 전이라 실전 예시 미리보기를 표시했습니다.';
                return;
            }
            if (!res.ok) throw new Error('local generation failed');
            const data = await res.json();
            const text = data.text || data.output || '';
            renderDemoResult(prompt, text, data);
            if (result) result.textContent = `${data.model_file || 'SmolLM2'}로 예시 결과를 생성했습니다.`;
            showToastLocal('로컬 AI 예시 결과가 생성되었습니다.');
        } catch {
            renderPreviewResult(prompt, payload);
            if (result) result.textContent = '모델 생성 오류가 있어 실전 예시 미리보기를 표시했습니다.';
            showToastLocal('로컬 AI 생성 중 오류가 발생했습니다.');
        } finally {
            state.generating = false;
            if (button && state.status && state.status.ready) button.disabled = false;
            pollStatus();
        }
    }

    function installPreviewRenderer() {
        if (window.__dealerLocalPreviewInstalled) return;
        window.__dealerLocalPreviewInstalled = true;
        const original = window.p_renderDemo;
        window.p_renderDemo = function (prompt) {
            if (!prompt) {
                if (typeof original === 'function') original(prompt);
                return;
            }
            renderPreviewResult(prompt, {
                inputs: compactInputs(getPromptInputs(prompt)),
                output_sections: prompt.outputSections || [],
            });
        };
    }

    function getValue(inputs, keys, fallback) {
        for (const key of keys) {
            if (inputs && inputs[key]) return String(inputs[key]).trim();
        }
        return fallback;
    }

    function inputEntries(inputs, limit) {
        return Object.entries(inputs || {})
            .filter(([, value]) => String(value || '').trim())
            .slice(0, limit || 8);
    }

    function shortValue(value, max) {
        const clean = String(value || '').replace(/\s+/g, ' ').trim();
        const limit = max || 120;
        return clean.length > limit ? clean.slice(0, limit - 1) + '…' : clean;
    }

    function getBasePromptText(prompt) {
        try {
            if (typeof p_hydratedPrompt === 'function') return p_hydratedPrompt(prompt);
        } catch {
            // Fall through to raw prompt.
        }
        return String((prompt && prompt.prompt) || '');
    }

    function setPromptText(text) {
        const el = byId('p-promptText');
        if (!el) return;
        if ('value' in el) el.value = text;
        else el.textContent = text;
    }

    function buildAdaptivePromptText(prompt, payload) {
        const inputs = payload.inputs || {};
        const dealer = getValue(inputs, ['dealer', '대리점명'], '대리점명 미입력');
        const region = getValue(inputs, ['region', '담당 지역', '지역'], '지역 미입력');
        const customers = getValue(inputs, ['customers', '핵심 고객층', '고객층'], '고객층 미입력');
        const filled = inputEntries(inputs, 9)
            .filter(([key]) => !['dealer', 'region', 'customers'].includes(key))
            .map(([key, value]) => `- ${key}: ${shortValue(value, 120)}`)
            .join('\n') || '- 아직 전용 입력이 비어 있습니다. 비어 있는 값은 결과에서 [수정 필요]로 표시합니다.';
        const sections = (payload.output_sections || prompt.outputSections || [])
            .slice(0, 6)
            .map((item, index) => `${index + 1}. ${item}`)
            .join('\n') || '1. 바로 실행 가능한 결과 예시';
        const extra = payload.extra_request ? `\n\n[이번 생성에 추가 반영]\n${payload.extra_request}` : '';

        return `${getBasePromptText(prompt)}

[로컬 AI 현장 반영 구조]
- 대리점: ${dealer}
- 담당 지역: ${region}
- 핵심 고객층: ${customers}

[입력값에 따라 바뀌는 전용 변수]
${filled}

[결과를 만들 때 반드시 포함할 구조]
${sections}

[작성 방식]
- 일반적인 샘플이 아니라 위 대리점의 지역, 고객층, 직원 규모, 채널, KPI에 맞춘 사례로 작성합니다.
- 고객에게 바로 보낼 수 있는 한국어 문장, 직원이 읽을 수 있는 응대 멘트, 사장님이 볼 수 있는 표를 우선합니다.
- 입력값이 충분하면 숫자, 일정, 우선순위, 후속 액션까지 구체화합니다.
- 입력값이 부족하면 결과 안에 [수정 필요] 항목을 남기고 무엇을 채워야 하는지 표시합니다.${extra}`;
    }

    function renderAdaptivePromptStructure(prompt, payload) {
        if (!prompt) return;
        setPromptText(buildAdaptivePromptText(prompt, payload || makePayload(prompt)));
    }

    function refreshAdaptiveStudio(renderOutput) {
        const prompt = getCurrentPrompt();
        if (!prompt) return;
        const payload = makePayload(prompt);
        renderAdaptivePromptStructure(prompt, payload);
        if (renderOutput !== false) renderPreviewResult(prompt, payload);
    }

    function installAdaptiveStudio() {
        if (window.__dealerAdaptiveStudioInstalled) return;
        window.__dealerAdaptiveStudioInstalled = true;
        const promptView = byId('view-prompt');
        if (!promptView) return;
        let timer = null;
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(() => refreshAdaptiveStudio(true), 180);
        };
        promptView.addEventListener('input', schedule);
        promptView.addEventListener('click', () => setTimeout(() => refreshAdaptiveStudio(true), 80));
        setTimeout(() => refreshAdaptiveStudio(true), 120);
    }

    function buildPreviewText(prompt, payload) {
        const inputs = payload.inputs || {};
        const dealer = getValue(inputs, ['dealer', '대리점명'], '○○보일러 강동대리점');
        const region = getValue(inputs, ['region', '지역'], '서울 강동구 고덕동');
        const customers = getValue(inputs, ['customers', '핵심 고객층', '고객층'], '15년 이상 구축 아파트 거주자');
        const inputDigest = inputEntries(inputs, 7)
            .map(([key, value]) => `- ${key}: ${shortValue(value, 95)}`)
            .join('\n');
        const extraLine = payload.extra_request ? `\n추가 요청 반영: ${shortValue(payload.extra_request, 150)}\n` : '';
        if (prompt.id === 'competitor') {
            const competitors = getValue(inputs, ['mainCompetitors', '주요 경쟁사'], '○○가스, △△설비');
            const usp = getValue(inputs, ['ourUSP', '우리만의 USP'], '같은 단지 시공 50건 이상, 토요일 방문 가능, 점검 리포트 무료 제공');
            return `대상: ${dealer} / ${region}
고객층: ${customers}

경쟁사 비교 포인트: ${competitors}
${extraLine}

| 항목 | 우리 대리점 메시지 | 고객 이점 |
|---|---|---|
| 현장 경험 | ${usp.split('\n')[0]} | 집 구조를 이미 이해해 방문 시간이 짧습니다 |
| 사후관리 | 점검 리포트와 다음 점검일 제공 | 설치 후에도 관리받는 느낌을 줍니다 |
| 상담 방식 | 가격보다 안전·온수·소음 확인 우선 | 무리한 판매가 아닌 문제 해결로 느껴집니다 |

30초 응대 예시:
“고객님, 다른 곳도 비교해 보시는 게 당연합니다. 다만 보일러는 설치 당일 가격보다 설치 후 온수 안정, 배관 정리, 재방문 대응이 더 오래 남습니다. 저희는 ${region} 현장 경험을 기준으로 먼저 점검하고 필요한 경우에만 교체를 권합니다.”`;
        }
        if (prompt.id === 'call') {
            const target = getValue(inputs, ['targetCustomer', 'targetCustomers', '대상 고객'], '노후 보일러 사용 고객');
            return `대상: ${region} ${target}
대리점/고객층: ${dealer} / ${customers}
${extraLine}

알림톡 초안:
“안녕하세요, ${dealer}입니다. 최근 온수 지연, 난방 소음, 배관 누수 문의가 늘고 있습니다. 이번 주 ${region} 고객님을 대상으로 무상 안심점검을 진행합니다. 점검은 약 20분이며, 교체 권유보다 현재 상태 확인을 먼저 도와드립니다. 원하시는 방문 시간만 답장해 주세요.”

전화 첫 멘트:
“고객님, 판매 전화가 아니라 겨울 전 보일러 상태 확인 안내로 연락드렸습니다. 요즘 온수가 늦게 나오거나 소음이 늘어난 적 있으실까요?”

이번 주 목표: 발송 50명 → 응답 10명 → 예약 5명 → 점검 완료 4명`;
        }
        const section = (payload.output_sections || prompt.outputSections || ['실행 예시'])[0];
        return `대상: ${dealer} / ${region}
고객층: ${customers}
자료 초점: ${section}
${extraLine}

입력값 요약:
${inputDigest || '- 아직 입력값이 부족합니다. 예시 채우기를 누르면 대리점 환경이 더 선명하게 반영됩니다.'}

실전 예시:
이번 주에는 ${customers} 중에서 “바로 연락 가능한 고객 20명”만 먼저 뽑습니다. 첫 메시지는 판매보다 점검 중심으로 시작합니다. 예를 들어 “고객님, 이번 안내는 교체 권유가 아니라 겨울 전 안전 확인입니다. 온수 지연, 소음, 누수 흔적 중 하나라도 있으면 사진으로 먼저 확인해 드리겠습니다.”처럼 부담을 낮춥니다. ${region} 고객에게는 이동 동선과 방문 가능 시간을 먼저 제시하고, 상담 직원은 통화 뒤 CRM에 불편 키워드와 다음 연락일을 남깁니다.

간단 흐름도:
고객 분류 → 알림톡 발송 → 응답 고객 전화 → 방문 예약 → 점검 결과표 전달 → 리뷰 요청

이번 주 KPI는 응답 8건, 예약 4건, 리뷰 3건으로 작게 잡고 매일 오후 5시에 결과를 기록하세요. 결과가 좋으면 다음 주에는 같은 문구를 복사하지 말고, 반응이 높았던 고객층과 지역명을 넣어 알림톡 첫 문장을 바꿉니다.`;
    }

    function renderPreviewResult(prompt, payload) {
        const out = byId('p-outputText');
        if (!out) return;
        const text = buildPreviewText(prompt, payload || {});
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-sky-200 bg-sky-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-sky-800 uppercase tracking-wide mb-1">실전 예시 미리보기</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt.title)}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">선택한 프롬프트가 실제로 어떤 자료를 만들지 한 부분을 먼저 보여줍니다. 모델 준비가 끝나면 위 버튼으로 더 구체화할 수 있습니다.</p>
                </div>
                <div class="bg-white border border-stone-200 p-4 rounded-lg whitespace-pre-wrap break-words text-sm leading-relaxed">${esc(text)}</div>
            </div>
        `;
    }

    function renderDemoShell(prompt) {
        const out = byId('p-outputText');
        if (!out) return;
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">로컬 AI 생성 중</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt.title)}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">SmolLM2 로컬 모델이 현재 입력값을 읽고 예시 결과를 작성하고 있습니다.</p>
                </div>
                <div class="bg-white border border-stone-200 p-4 rounded-lg text-sm text-stone-600">잠시만 기다려 주세요.</div>
            </div>
        `;
    }

    function renderDemoResult(prompt, text, data) {
        const out = byId('p-outputText');
        if (!out) return;
        const model = data && (data.model_file || data.model || '로컬 AI');
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">로컬 AI 생성 결과</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt.title)}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">${esc(model)} · 외부 API 없이 생성됨</p>
                </div>
                <div class="bg-white border border-stone-200 p-4 rounded-lg whitespace-pre-wrap break-words text-sm leading-relaxed">${esc(text || '생성된 내용이 없습니다.')}</div>
            </div>
        `;
    }

    function injectCalendarAiPanel() {
        if (byId('calendar-ai-panel')) return;
        const calendarView = byId('view-calendar');
        if (!calendarView) return;
        const panel = document.createElement('section');
        panel.id = 'calendar-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200 mb-4';
        panel.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-end gap-3">
                <div class="flex-grow">
                    <h3 class="font-bold text-stone-800 mb-2">AI 월간 일정 검색</h3>
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <input id="calendar-ai-query" class="md:col-span-7 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="예: 보일러 지원사업, 지역 축제, 아파트 입주 일정">
                        <input id="calendar-ai-region" class="md:col-span-3 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="지역">
                        <button id="calendar-ai-search-btn" class="md:col-span-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">검색 후 등록</button>
                    </div>
                    <div id="calendar-ai-result" class="mt-2 text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-md p-2 min-h-[36px]">검색어를 입력하면 현재 보고 있는 월에 맞춰 일정 후보를 찾아 등록합니다.</div>
                </div>
            </div>
        `;
        const firstSection = calendarView.querySelector('section');
        if (firstSection) firstSection.insertAdjacentElement('afterend', panel);
        else calendarView.prepend(panel);

        const regionInput = byId('calendar-ai-region');
        const promptRegion = byId('p-region');
        if (regionInput && promptRegion && promptRegion.value) regionInput.value = promptRegion.value;
        byId('calendar-ai-search-btn')?.addEventListener('click', runCalendarAiSearch);
    }

    function getCalendarCursor() {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        try {
            if (typeof calYear !== 'undefined') year = calYear;
            if (typeof calMonth !== 'undefined') month = calMonth + 1;
        } catch {
            // Keep current month.
        }
        return { year, month };
    }

    async function runCalendarAiSearch() {
        const queryInput = byId('calendar-ai-query');
        const regionInput = byId('calendar-ai-region');
        const result = byId('calendar-ai-result');
        const button = byId('calendar-ai-search-btn');
        const query = (queryInput?.value || '').trim();
        if (!query) {
            if (result) result.textContent = '검색할 일정 주제를 입력해 주세요.';
            return;
        }
        const { year, month } = getCalendarCursor();
        if (button) button.disabled = true;
        if (result) result.textContent = `${year}년 ${month}월 일정 후보를 검색하고 있습니다.`;
        try {
            const res = await fetch('/api/calendar/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    region: (regionInput?.value || '').trim(),
                    year,
                    month,
                    max_results: 5,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'calendar ai search failed');
            const created = data.created || [];
            const sourceCount = (data.sources || []).length;
            if (result) {
                result.innerHTML = `
                    <div class="font-semibold text-stone-700">${esc(data.message || '일정을 등록했습니다.')}</div>
                    <div class="mt-1">${created.length ? created.map(item => `${esc(item.date)} · ${esc(item.title)}`).join('<br>') : '등록된 일정이 없습니다.'}</div>
                    <div class="mt-1 text-stone-400">검색 결과 ${sourceCount}건 참고${data.search_error ? ' · 검색 연결 실패 시 후보일로 대체' : ''}</div>
                `;
            }
            if (typeof loadCalendar === 'function') await loadCalendar();
            else if (typeof renderCalendar === 'function') renderCalendar();
            showToastLocal('AI 검색 일정이 캘린더에 반영되었습니다.');
        } catch (err) {
            if (result) result.textContent = `일정 검색 중 오류가 발생했습니다: ${err.message || err}`;
            showToastLocal('AI 일정 검색에 실패했습니다.');
        } finally {
            if (button) button.disabled = false;
        }
    }

    window.DealerDashboardAI = {
        receiveStatus,
        startEngine,
        generateDemo,
        refreshAdaptiveStudio,
        runCalendarAiSearch,
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectPanel();
        injectCalendarAiPanel();
        installPreviewRenderer();
        installAdaptiveStudio();
        refreshAdaptiveStudio(true);
        startEngine();
    });
})();
