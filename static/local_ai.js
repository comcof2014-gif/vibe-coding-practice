(function () {
    const state = {
        status: null,
        polling: null,
        generating: false,
        searchOnline: false,
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
        if (typeof showToast === 'function') showToast(message);
        else console.log(message);
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

    function getBasePromptText(prompt) {
        try {
            if (typeof p_hydratedPrompt === 'function') return p_hydratedPrompt(prompt);
        } catch {
            // Use raw prompt below.
        }
        return String((prompt && prompt.prompt) || '');
    }

    function setPromptText(text) {
        const el = byId('p-promptText');
        if (!el) return;
        if ('value' in el) el.value = text;
        else el.textContent = text;
    }

    function makePromptPayload(prompt) {
        return {
            prompt_id: prompt.id || '',
            title: prompt.title || '',
            summary: String(prompt.summary || '').slice(0, 1000),
            base_prompt: getBasePromptText(prompt).slice(0, 12000),
            inputs: compactInputs(getPromptInputs(prompt)),
            extra_request: (byId('local-ai-extra')?.value || '').trim().slice(0, 1200),
        };
    }

    function disablePromptRolling() {
        try {
            if (typeof p_paused !== 'undefined') p_paused = true;
            if (typeof p_timer !== 'undefined' && p_timer) clearInterval(p_timer);
        } catch {
            // Ignore older browsers.
        }
        const pause = byId('p-pauseBtn');
        if (pause) pause.remove();
        const bar = byId('p-bar');
        if (bar && bar.parentElement) bar.parentElement.remove();
        const counter = byId('p-counter');
        if (counter) counter.textContent = '수동 선택';
        const heading = byId('p-carouselPanel')?.querySelector('h3');
        if (heading) heading.textContent = '2. 프롬프트 보강 작업실';
        const promptView = byId('view-prompt');
        const title = promptView?.querySelector('h2');
        if (title) title.textContent = 'AI 프롬프트 스튜디오';
    }

    function relabelOutputPanel() {
        const out = byId('p-outputText');
        const section = out && out.closest('section');
        if (!section) return;
        const heading = section.querySelector('h3');
        if (heading) heading.textContent = '3. 로컬 AI 프롬프트 보강 결과';
        const info = section.children && section.children[1];
        if (info) {
            info.innerHTML = `
                <div class="flex items-center gap-2 mb-1 text-stone-800 font-semibold">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> 오프라인 로컬 AI 보강 모드
                </div>
                선택한 프롬프트에 현장 입력값과 추가 요청을 반영해, 2번 프롬프트 본문을 직접 수정합니다.
            `;
        }
    }

    function renderPromptWaiting(prompt) {
        const out = byId('p-outputText');
        if (!out) return;
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">프롬프트 보강 대기</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt?.title || '프롬프트')}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">왼쪽 입력값과 아래 보강 요청을 작성한 뒤 버튼을 누르면, 로컬 AI가 2번 프롬프트 본문을 수정합니다.</p>
                </div>
                <div class="bg-white border border-stone-200 p-4 rounded-lg text-sm text-stone-600">
                    고정 예시 문구는 더 이상 자동으로 출력하지 않습니다. 이 영역에는 로컬 AI가 실제로 보강한 프롬프트만 표시됩니다.
                </div>
            </div>
        `;
    }

    function renderImprovedPrompt(prompt, text, data) {
        const out = byId('p-outputText');
        if (!out) return;
        const model = data && (data.model_file || data.model || '로컬 AI');
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">보강된 프롬프트</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt.title)}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">${esc(model)} · 현재 입력과 요청을 반영해 2번 프롬프트를 수정했습니다.</p>
                </div>
                <pre class="bg-white border border-stone-200 p-4 rounded-lg whitespace-pre-wrap break-words text-xs leading-relaxed font-mono text-stone-800">${esc(text || '보강된 프롬프트가 없습니다.')}</pre>
            </div>
        `;
    }

    function injectPromptImproverPanel() {
        if (byId('local-ai-panel')) return;
        const promptView = byId('view-prompt');
        if (!promptView) return;
        relabelOutputPanel();
        disablePromptRolling();

        const firstSection = promptView.querySelector('section');
        const panel = document.createElement('section');
        panel.id = 'local-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200';
        panel.innerHTML = `
            <div class="flex flex-col xl:flex-row xl:items-start gap-4">
                <div class="xl:w-[320px] shrink-0">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <h3 class="font-bold text-stone-800">로컬 AI 프롬프트 보강기</h3>
                        <span id="local-ai-badge" class="text-[11px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">대기</span>
                    </div>
                    <div class="h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                        <div id="local-ai-progress" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width:0%"></div>
                    </div>
                    <div id="local-ai-phase" class="text-xs text-stone-500 leading-relaxed">로컬 AI 모델 상태를 확인하는 중입니다.</div>
                    <div id="local-ai-warning" class="hidden mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"></div>
                </div>
                <div class="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div class="lg:col-span-8">
                        <label class="block text-xs font-bold text-stone-600 mb-1">현재 프롬프트에 추가 반영할 요청</label>
                        <textarea id="local-ai-extra" class="w-full border border-stone-300 rounded-md p-3 h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="예: 클린 CS 매뉴얼을 확실히 깨끗하고 정갈한 기사 응대 매뉴얼처럼 보이게 보강해줘."></textarea>
                    </div>
                    <div class="lg:col-span-4 flex flex-col">
                        <button id="local-ai-generate-btn" class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">현재 프롬프트 보강</button>
                        <button id="local-ai-sample-btn" class="mt-2 px-4 py-2 bg-white text-stone-700 border border-stone-300 rounded-md text-sm font-semibold hover:bg-stone-50 transition-colors">예시 채우고 보강</button>
                        <div id="local-ai-result" class="mt-3 flex-grow text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-md p-3 min-h-[56px]">선택된 프롬프트 자체를 보강합니다. 오른쪽 산출물 예시를 만드는 기능이 아닙니다.</div>
                    </div>
                </div>
            </div>
        `;
        if (firstSection) firstSection.insertAdjacentElement('afterend', panel);
        else promptView.prepend(panel);

        byId('local-ai-generate-btn')?.addEventListener('click', improveCurrentPrompt);
        byId('local-ai-sample-btn')?.addEventListener('click', () => {
            if (typeof p_sample === 'function') p_sample();
            improveCurrentPrompt();
        });
    }

    function receiveStatus(status) {
        state.status = status || {};
        const progress = Math.max(0, Math.min(100, Number(state.status.progress || 0)));
        const badge = byId('local-ai-badge');
        const bar = byId('local-ai-progress');
        const phase = byId('local-ai-phase');
        const warning = byId('local-ai-warning');
        const button = byId('local-ai-generate-btn');
        if (!badge || !bar || !phase) return;

        bar.style.width = `${progress}%`;
        phase.textContent = state.status.phase || '로컬 AI 상태 확인 중';
        if (state.status.model_file) phase.textContent += ` · ${state.status.model_file}`;
        if (state.status.model_size_mb) phase.textContent += ` · ${state.status.model_size_mb}MB`;

        if (state.status.ready) {
            badge.textContent = state.status.state === 'generating' ? '보강 중' : '준비 완료';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200';
            if (button) button.disabled = state.generating;
            if (warning) warning.classList.add('hidden');
        } else if (state.status.state === 'error') {
            badge.textContent = '오류';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200';
            if (button) button.disabled = true;
            if (warning) {
                warning.textContent = state.status.error || '로컬 AI 모델을 실행하지 못했습니다. EXE를 새로 빌드해 주세요.';
                warning.classList.remove('hidden');
            }
        } else {
            badge.textContent = '준비 중';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200';
            if (button) button.disabled = true;
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

    async function improveCurrentPrompt() {
        const prompt = getCurrentPrompt();
        const result = byId('local-ai-result');
        const button = byId('local-ai-generate-btn');
        if (!prompt) {
            if (result) result.textContent = '현재 프롬프트 정보를 찾지 못했습니다.';
            return;
        }
        if (!state.status || !state.status.ready) {
            if (result) result.textContent = '로컬 AI 준비가 끝난 뒤 다시 눌러 주세요.';
            startEngine();
            return;
        }

        state.generating = true;
        if (button) button.disabled = true;
        if (result) result.textContent = '로컬 AI가 현재 프롬프트를 보강하고 있습니다.';
        try {
            const res = await fetch('/api/ai/improve-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(makePromptPayload(prompt)),
            });
            const data = await res.json();
            if (res.status === 409) {
                if (data.detail && data.detail.status) receiveStatus(data.detail.status);
                throw new Error(data.detail?.message || '로컬 AI가 아직 준비되지 않았습니다.');
            }
            if (!res.ok) throw new Error(data.detail || '프롬프트 보강 실패');
            const improved = data.text || '';
            setPromptText(improved);
            renderImprovedPrompt(prompt, improved, data);
            if (result) result.textContent = `${data.model_file || 'SmolLM2'}가 현재 프롬프트를 보강했습니다.`;
            showToastLocal('프롬프트가 보강되었습니다.');
        } catch (err) {
            if (result) result.textContent = `보강 실패: ${err.message || err}`;
            showToastLocal('프롬프트 보강에 실패했습니다.');
        } finally {
            state.generating = false;
            if (button && state.status && state.status.ready) button.disabled = false;
            pollStatus();
        }
    }

    function installPromptOverrides() {
        if (window.__dealerPromptImproveInstalled) return;
        window.__dealerPromptImproveInstalled = true;
        const originalDemo = window.p_renderDemo;
        window.p_renderDemo = function (prompt) {
            if (typeof originalDemo === 'function') {
                // Keep compatibility but replace visible demo with the new prompt-improvement waiting state.
            }
            renderPromptWaiting(prompt || getCurrentPrompt());
            disablePromptRolling();
        };
        const promptView = byId('view-prompt');
        if (promptView) {
            promptView.addEventListener('click', () => setTimeout(disablePromptRolling, 50));
            promptView.addEventListener('input', () => setTimeout(() => renderPromptWaiting(getCurrentPrompt()), 120));
        }
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
                    <h3 class="font-bold text-stone-800 mb-2">신뢰 사이트 월간 일정 검색</h3>
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <input id="calendar-ai-query" class="md:col-span-7 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="예: 국가공휴일 설정, 5월 대체공휴일, 지역 축제 일정">
                        <input id="calendar-ai-region" class="md:col-span-3 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="지역">
                        <button id="calendar-ai-search-btn" class="md:col-span-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">검색 후 등록</button>
                    </div>
                    <div id="calendar-ai-result" class="mt-2 text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-md p-2 min-h-[36px]">인터넷 연결과 신뢰 사이트 접근 가능 여부를 확인하고 있습니다.</div>
                </div>
            </div>
        `;
        const firstSection = calendarView.querySelector('section');
        if (firstSection) firstSection.insertAdjacentElement('afterend', panel);
        else calendarView.prepend(panel);
        byId('calendar-ai-search-btn')?.addEventListener('click', runCalendarTrustedSearch);
        refreshCalendarSearchStatus();
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

    async function refreshCalendarSearchStatus() {
        const result = byId('calendar-ai-result');
        const button = byId('calendar-ai-search-btn');
        if (button) button.disabled = true;
        try {
            const res = await fetch('/api/calendar/search-status');
            const data = await res.json();
            state.searchOnline = !!data.internet_available;
            if (button) button.disabled = !state.searchOnline;
            if (result) {
                result.textContent = state.searchOnline
                    ? '인터넷 연결 확인 완료. 정부/공공/공휴일 데이터 등 신뢰 사이트 중심으로 검색합니다.'
                    : '인터넷 연결이 없어 일정 검색 기능이 비활성화되었습니다.';
            }
        } catch {
            state.searchOnline = false;
            if (button) button.disabled = true;
            if (result) result.textContent = '인터넷 상태를 확인하지 못해 검색 기능을 비활성화했습니다.';
        }
    }

    async function runCalendarTrustedSearch() {
        const queryInput = byId('calendar-ai-query');
        const regionInput = byId('calendar-ai-region');
        const result = byId('calendar-ai-result');
        const button = byId('calendar-ai-search-btn');
        const query = (queryInput?.value || '').trim();
        if (!query) {
            if (result) result.textContent = '검색할 일정 주제를 입력해 주세요.';
            return;
        }
        if (!state.searchOnline) {
            await refreshCalendarSearchStatus();
            if (!state.searchOnline) return;
        }
        const { year, month } = getCalendarCursor();
        if (button) button.disabled = true;
        if (result) result.textContent = `${year}년 ${month}월 신뢰 사이트 일정을 검색하고 있습니다.`;
        try {
            const res = await fetch('/api/calendar/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    region: (regionInput?.value || '').trim(),
                    year,
                    month,
                    max_results: 6,
                    trusted_only: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail?.message || data.detail || '일정 검색 실패');
            const created = data.created || [];
            const sources = data.sources || [];
            if (result) {
                result.innerHTML = `
                    <div class="font-semibold text-stone-700">${esc(data.message || '검색을 완료했습니다.')}</div>
                    <div class="mt-1">${created.length ? created.map(item => `${esc(item.date)} · ${esc(item.title)}`).join('<br>') : '등록된 일정이 없습니다.'}</div>
                    <div class="mt-1 text-stone-400">${sources.length ? `확인 소스 ${sources.length}건: ${sources.slice(0, 2).map(s => esc(s.title || s.url)).join(' / ')}` : '신뢰 소스를 찾지 못했습니다.'}</div>
                `;
            }
            if (typeof loadCalendar === 'function') await loadCalendar();
            else if (typeof renderCalendar === 'function') renderCalendar();
            showToastLocal('신뢰 사이트 일정이 캘린더에 반영되었습니다.');
        } catch (err) {
            if (result) result.textContent = `일정 검색 중 오류가 발생했습니다: ${err.message || err}`;
            showToastLocal('일정 검색에 실패했습니다.');
        } finally {
            if (button) button.disabled = !state.searchOnline;
        }
    }

    window.DealerDashboardAI = {
        receiveStatus,
        startEngine,
        improveCurrentPrompt,
        refreshCalendarSearchStatus,
        runCalendarTrustedSearch,
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectPromptImproverPanel();
        injectCalendarAiPanel();
        installPromptOverrides();
        renderPromptWaiting(getCurrentPrompt());
        startEngine();
    });
})();
