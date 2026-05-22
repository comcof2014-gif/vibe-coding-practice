(function () {
    const state = {
        settings: null,
        status: null,
        busy: false,
        lastPrompt: '',
        searchOnline: false,
    };

    const $ = id => document.getElementById(id);
    const esc = value => String(value || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[c]));

    function toast(message) {
        if (typeof showToast === 'function') showToast(message);
        else console.log(message);
    }

    async function json(res) {
        const text = await res.text();
        if (!text) return {};
        try { return JSON.parse(text); }
        catch { return { detail: text.slice(0, 500) }; }
    }

    function messageOf(data, fallback) {
        const detail = data && data.detail;
        if (detail && typeof detail === 'object') return detail.message || fallback;
        if (typeof detail === 'string') return detail;
        return (data && data.message) || fallback;
    }

    function currentPrompt() {
        try {
            if (typeof PROMPTS === 'undefined') return null;
            if (typeof p_current === 'undefined') return PROMPTS[0];
            return PROMPTS[p_current] || PROMPTS[0];
        } catch {
            return null;
        }
    }

    function promptData(prompt) {
        try {
            if (typeof p_getDataFor === 'function') return p_getDataFor(prompt);
        } catch {
            // Fall through to DOM scan.
        }
        const out = {};
        document.querySelectorAll('#p-common-fields input, #p-common-fields textarea, #p-specific-fields input, #p-specific-fields textarea').forEach(el => {
            const label = el.closest('.space-y-1')?.querySelector('label')?.textContent?.trim() || el.id || '입력';
            const value = (el.value || '').trim();
            if (value) out[label] = value;
        });
        return out;
    }

    function basePrompt(prompt) {
        try {
            if (typeof p_hydratedPrompt === 'function') return p_hydratedPrompt(prompt);
        } catch {
            // Keep raw prompt fallback.
        }
        return String((prompt && prompt.prompt) || '');
    }

    function setPromptText(text) {
        const el = $('p-promptText');
        if (!el) return;
        if ('value' in el) el.value = text;
        else el.textContent = text;
    }

    function disableRolling() {
        try {
            if (typeof p_paused !== 'undefined') p_paused = true;
            if (typeof p_timer !== 'undefined' && p_timer) clearInterval(p_timer);
        } catch {
            // Older builds may not expose these globals.
        }
        $('p-pauseBtn')?.remove();
        const bar = $('p-bar');
        if (bar && bar.parentElement) bar.parentElement.remove();
        const counter = $('p-counter');
        if (counter) counter.textContent = '수동 선택';
        const heading = $('p-carouselPanel')?.querySelector('h3');
        if (heading) heading.textContent = '2. 프롬프트 보강 작업실';
    }

    function removeCrossMarkedText() {
        document.querySelectorAll('button, span, a, div').forEach(el => {
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text || text.length > 80) return;
            if (text.includes('GPT API') || text.includes('정적 데모')) el.remove();
        });
    }

    function modelOptions() {
        const models = state.settings?.supported_models || [
            { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
            { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        ];
        const selected = state.settings?.model || 'gemini-2.5-flash-lite';
        return models.map(m => `<option value="${esc(m.id)}" ${m.id === selected ? 'selected' : ''}>${esc(m.label || m.id)}</option>`).join('');
    }

    function ensurePromptPanel() {
        const view = $('view-prompt');
        if (!view) return;
        document.querySelectorAll('#local-ai-panel, #online-ai-panel').forEach(el => el.remove());
        const panel = document.createElement('section');
        panel.id = 'online-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200';
        panel.innerHTML = `
            <div class="flex flex-col xl:flex-row xl:items-start gap-4">
                <div class="xl:w-[340px] shrink-0">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <h3 class="font-bold text-stone-800">온라인 AI 프롬프트 보강기</h3>
                        <span id="online-ai-badge" class="text-[11px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">대기</span>
                    </div>
                    <div class="h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                        <div id="online-ai-progress" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width:0%"></div>
                    </div>
                    <div id="online-ai-phase" class="text-xs text-stone-500 leading-relaxed">Gemini 온라인 AI 상태를 확인하고 있습니다.</div>
                    <div id="online-ai-warning" class="hidden mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"></div>
                </div>
                <div class="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-2">
                        <input id="online-ai-key" type="password" class="md:col-span-5 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Gemini API 키">
                        <select id="online-ai-model" class="md:col-span-3 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">${modelOptions()}</select>
                        <button id="online-ai-save-btn" class="md:col-span-2 px-3 py-2 bg-stone-900 text-white rounded-md text-sm font-bold hover:bg-stone-700">AI 저장</button>
                        <button id="online-ai-clear-btn" class="md:col-span-2 px-3 py-2 bg-white text-stone-700 border border-stone-300 rounded-md text-sm font-semibold hover:bg-stone-50">키 삭제</button>
                        <div class="md:col-span-12">
                            <label class="block text-xs font-bold text-stone-600 mb-1 mt-1">현재 프롬프트에 추가 반영할 요청</label>
                            <textarea id="online-ai-extra" class="w-full border border-stone-300 rounded-md p-3 h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="예: 해피콜을 조금 더 완벽하게 할 수 있도록 영어 멘트를 섞어줘."></textarea>
                        </div>
                    </div>
                    <div class="lg:col-span-4 flex flex-col">
                        <button id="online-ai-generate-btn" class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">현재 프롬프트 보강</button>
                        <button id="online-ai-sample-btn" class="mt-2 px-4 py-2 bg-white text-stone-700 border border-stone-300 rounded-md text-sm font-semibold hover:bg-stone-50 transition-colors">예시 채우고 보강</button>
                        <div id="online-ai-result" class="mt-3 flex-grow text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-md p-3 min-h-[56px]">무료 Gemini API 키를 저장하면 온라인 AI가 빠르게 보강합니다.</div>
                    </div>
                </div>
            </div>
        `;
        const first = view.querySelector('section');
        if (first) first.insertAdjacentElement('afterend', panel);
        else view.prepend(panel);
        $('online-ai-save-btn')?.addEventListener('click', saveSettings);
        $('online-ai-clear-btn')?.addEventListener('click', clearKey);
        $('online-ai-generate-btn')?.addEventListener('click', improvePrompt);
        $('online-ai-sample-btn')?.addEventListener('click', () => {
            if (typeof p_sample === 'function') p_sample();
            improvePrompt();
        });
    }

    function ensureResultPanels() {
        const out = $('p-outputText');
        const section = out && out.closest('section');
        if (section) {
            const h = section.querySelector('h3');
            if (h) h.textContent = '3. 온라인 AI 프롬프트 보강 결과';
        }
        if (!$('online-ai-applied-panel') && section) {
            const panel = document.createElement('section');
            panel.id = 'online-ai-applied-panel';
            panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200 lg:col-span-3';
            panel.innerHTML = `
                <div class="flex items-center justify-between gap-3 mb-3">
                    <h3 class="font-bold text-stone-800">4. 온라인 AI 실제 적용 결과</h3>
                    <button id="online-ai-run-btn" class="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">결과 다시 생성</button>
                </div>
                <div id="online-ai-applied-result" class="border border-stone-200 rounded-lg p-4 bg-stone-50 text-sm text-stone-600 min-h-[160px] leading-relaxed">
                    3번에서 보강된 프롬프트를 실제 입력값에 적용한 결과가 이곳에 표시됩니다.
                </div>
            `;
            section.insertAdjacentElement('afterend', panel);
            $('online-ai-run-btn')?.addEventListener('click', () => runPrompt(currentPrompt(), state.lastPrompt || basePrompt(currentPrompt())));
        }
    }

    function renderWaiting() {
        const prompt = currentPrompt();
        const out = $('p-outputText');
        if (!out) return;
        out.innerHTML = `
            <div class="space-y-4">
                <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                    <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">프롬프트 보강 대기</div>
                    <h4 class="font-bold text-stone-800 mb-2">${esc(prompt?.title || '프롬프트')}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed">Gemini API 키를 저장하고 보강 요청을 누르면, 현재 입력값에 맞게 2번 프롬프트 본문이 바뀝니다.</p>
                </div>
                <div class="bg-white border border-stone-200 p-4 rounded-lg text-sm text-stone-600">
                    3번에는 보강된 프롬프트, 4번에는 그 프롬프트를 실제로 적용한 결과가 표시됩니다.
                </div>
            </div>
        `;
    }

    function receiveStatus(status) {
        state.status = status || {};
        const ready = !!state.status.ready;
        const badge = $('online-ai-badge');
        const bar = $('online-ai-progress');
        const phase = $('online-ai-phase');
        const warning = $('online-ai-warning');
        const button = $('online-ai-generate-btn');
        if (bar) bar.style.width = `${ready ? 100 : 0}%`;
        if (phase) phase.textContent = state.status.phase || 'Gemini 온라인 AI 상태 확인 중';
        if (button) button.disabled = !ready || state.busy;
        if (!badge) return;
        if (ready) {
            badge.textContent = state.busy ? '실행 중' : '준비 완료';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200';
            warning?.classList.add('hidden');
        } else {
            badge.textContent = '키 필요';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200';
            if (warning) {
                warning.textContent = 'Google AI Studio에서 무료 Gemini API 키를 발급받아 저장해 주세요.';
                warning.classList.remove('hidden');
            }
        }
    }

    async function loadSettings() {
        try {
            const res = await fetch('/api/ai/settings');
            if (res.ok) {
                state.settings = await json(res);
                const select = $('online-ai-model');
                if (select) select.innerHTML = modelOptions();
            }
        } catch {
            // Status check will show the useful message.
        }
        try {
            const res = await fetch('/api/ai/status');
            if (res.ok) receiveStatus(await json(res));
        } catch {
            receiveStatus({ ready: false, phase: '온라인 AI 상태 확인 실패' });
        }
    }

    async function saveSettings() {
        const apiKey = ($('online-ai-key')?.value || '').trim();
        const model = ($('online-ai-model')?.value || 'gemini-2.5-flash-lite').trim();
        const result = $('online-ai-result');
        if (!apiKey && !state.settings?.api_key_present) {
            if (result) result.textContent = 'Gemini API 키를 입력해 주세요.';
            return;
        }
        try {
            const res = await fetch('/api/ai/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey, model }),
            });
            const data = await json(res);
            if (!res.ok) throw new Error(messageOf(data, 'AI 설정 저장 실패'));
            state.settings = data.settings;
            receiveStatus(data.ai || {});
            const key = $('online-ai-key');
            if (key) key.value = '';
            if (result) result.textContent = `${data.settings.model} 설정을 저장했습니다.`;
            toast('온라인 AI 설정을 저장했습니다.');
        } catch (err) {
            if (result) result.textContent = `저장 실패: ${err.message || err}`;
        }
    }

    async function clearKey() {
        try {
            const res = await fetch('/api/ai/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clear_api_key: true, model: $('online-ai-model')?.value || '' }),
            });
            const data = await json(res);
            if (!res.ok) throw new Error(messageOf(data, '키 삭제 실패'));
            state.settings = data.settings;
            receiveStatus(data.ai || {});
            const result = $('online-ai-result');
            if (result) result.textContent = 'Gemini API 키를 삭제했습니다.';
        } catch (err) {
            const result = $('online-ai-result');
            if (result) result.textContent = `키 삭제 실패: ${err.message || err}`;
        }
    }

    function improvePayload(prompt) {
        return {
            prompt_id: prompt?.id || '',
            title: prompt?.title || '',
            summary: String(prompt?.summary || '').slice(0, 1000),
            base_prompt: basePrompt(prompt).slice(0, 12000),
            inputs: promptData(prompt),
            extra_request: ($('online-ai-extra')?.value || '').trim().slice(0, 1200),
        };
    }

    async function improvePrompt() {
        const prompt = currentPrompt();
        const result = $('online-ai-result');
        if (!prompt) {
            if (result) result.textContent = '현재 프롬프트 정보를 찾지 못했습니다.';
            return;
        }
        state.busy = true;
        receiveStatus(state.status || {});
        if (result) result.textContent = '온라인 AI가 현재 프롬프트를 보강하고 있습니다.';
        try {
            const res = await fetch('/api/ai/improve-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(improvePayload(prompt)),
            });
            const data = await json(res);
            if (!res.ok) throw new Error(messageOf(data, '프롬프트 보강 실패'));
            state.lastPrompt = data.text || '';
            setPromptText(state.lastPrompt);
            const out = $('p-outputText');
            if (out) out.innerHTML = `
                <div class="space-y-4">
                    <div class="border border-emerald-200 bg-emerald-50 p-4 rounded-lg">
                        <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">보강된 프롬프트</div>
                        <h4 class="font-bold text-stone-800 mb-2">${esc(prompt.title)}</h4>
                        <p class="text-xs text-stone-600 leading-relaxed">${esc(data.model || 'Gemini')}가 현재 입력값과 요청을 반영했습니다.</p>
                    </div>
                    <pre class="bg-white border border-stone-200 p-4 rounded-lg whitespace-pre-wrap break-words text-xs leading-relaxed font-mono text-stone-800">${esc(state.lastPrompt)}</pre>
                </div>
            `;
            if (result) result.textContent = '보강 완료. 이어서 4번 결과를 생성합니다.';
            await runPrompt(prompt, state.lastPrompt);
        } catch (err) {
            if (result) result.textContent = `보강 실패: ${err.message || err}`;
        } finally {
            state.busy = false;
            receiveStatus(state.status || {});
        }
    }

    async function runPrompt(prompt, promptText) {
        if (!prompt || !promptText) return;
        const applied = $('online-ai-applied-result');
        if (applied) applied.textContent = '온라인 AI가 보강된 프롬프트를 실제 입력값에 적용하고 있습니다.';
        try {
            const res = await fetch('/api/ai/run-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt_id: prompt.id || '',
                    title: prompt.title || '',
                    prompt_text: promptText,
                    inputs: promptData(prompt),
                    extra_request: ($('online-ai-extra')?.value || '').trim().slice(0, 1200),
                }),
            });
            const data = await json(res);
            if (!res.ok) throw new Error(messageOf(data, '결과 생성 실패'));
            if (applied) applied.innerHTML = `
                <div class="text-xs font-bold text-emerald-700 mb-2">${esc(data.model || 'Gemini')} 실제 적용 결과</div>
                <pre class="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-stone-800">${esc(data.text || '')}</pre>
            `;
        } catch (err) {
            if (applied) applied.textContent = `결과 생성 실패: ${err.message || err}`;
        }
    }

    function ensureCalendarPanel() {
        const view = $('view-calendar');
        if (!view || $('calendar-ai-panel')) return;
        const panel = document.createElement('section');
        panel.id = 'calendar-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200 mb-4';
        panel.innerHTML = `
            <h3 class="font-bold text-stone-800 mb-2">신뢰 사이트 월간 일정 검색</h3>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input id="calendar-ai-query" class="md:col-span-7 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="예: 국가공휴일 설정, 평택 지역행사, 보일러 박람회 일정">
                <input id="calendar-ai-region" class="md:col-span-3 border border-stone-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="지역">
                <button id="calendar-ai-search-btn" class="md:col-span-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">검색 후 등록</button>
            </div>
            <div id="calendar-ai-result" class="mt-2 text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-md p-2 min-h-[36px]">인터넷 연결과 신뢰 사이트 접근 가능 여부를 확인하고 있습니다.</div>
        `;
        const first = view.querySelector('section');
        if (first) first.insertAdjacentElement('afterend', panel);
        else view.prepend(panel);
        $('calendar-ai-search-btn')?.addEventListener('click', runCalendarSearch);
        refreshCalendarSearchStatus();
    }

    async function refreshCalendarSearchStatus() {
        const result = $('calendar-ai-result');
        const button = $('calendar-ai-search-btn');
        if (button) button.disabled = true;
        try {
            const res = await fetch('/api/calendar/search-status');
            const data = await json(res);
            state.searchOnline = !!data.internet_available;
            if (button) button.disabled = !state.searchOnline;
            if (result) result.textContent = state.searchOnline
                ? '인터넷 연결 확인 완료. 정부·지자체·공공 관광 데이터 등 신뢰 사이트에서 날짜 근거가 있는 일정만 등록합니다.'
                : '인터넷 연결이 없어 일정 검색 기능을 비활성화했습니다.';
        } catch {
            state.searchOnline = false;
            if (result) result.textContent = '인터넷 상태를 확인하지 못해 검색 기능을 비활성화했습니다.';
        }
    }

    function calendarCursor() {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        try {
            if (typeof calYear !== 'undefined') year = calYear;
            if (typeof calMonth !== 'undefined') month = calMonth + 1;
        } catch {
            // Use current month.
        }
        return { year, month };
    }

    async function runCalendarSearch() {
        const query = ($('calendar-ai-query')?.value || '').trim();
        const region = ($('calendar-ai-region')?.value || '').trim();
        const result = $('calendar-ai-result');
        if (!query) {
            if (result) result.textContent = '검색할 일정 주제를 입력해 주세요.';
            return;
        }
        if (!state.searchOnline) {
            await refreshCalendarSearchStatus();
            if (!state.searchOnline) return;
        }
        const { year, month } = calendarCursor();
        const button = $('calendar-ai-search-btn');
        if (button) button.disabled = true;
        if (result) result.textContent = `${year}년 ${month}월 신뢰 사이트 일정과 날짜 근거를 검색하고 있습니다.`;
        try {
            const res = await fetch('/api/calendar/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, region, year, month, max_results: 6, trusted_only: true }),
            });
            const data = await json(res);
            if (!res.ok) throw new Error(messageOf(data, '일정 검색 실패'));
            const created = data.created || [];
            const sources = data.sources || [];
            if (result) {
                result.innerHTML = `
                    <div class="font-semibold text-stone-700">${esc(data.message || '검색을 완료했습니다.')}</div>
                    <div class="mt-1">${created.length ? created.map(item => `${esc(item.date)} · ${esc(item.title)}`).join('<br>') : '등록된 일정이 없습니다. 명확한 날짜 근거가 없으면 임의로 등록하지 않습니다.'}</div>
                    <div class="mt-1 text-stone-400">${sources.length ? `확인 소스 ${sources.length}건 · ${sources.slice(0, 2).map(s => esc(s.title || s.url)).join(' / ')}` : '신뢰 소스를 찾지 못했습니다.'}</div>
                `;
            }
            if (created.length) {
                if (typeof loadCalendar === 'function') await loadCalendar();
                else if (typeof renderCalendar === 'function') renderCalendar();
            }
        } catch (err) {
            if (result) result.textContent = `일정 검색 중 오류가 발생했습니다: ${err.message || err}`;
        } finally {
            if (button) button.disabled = !state.searchOnline;
        }
    }

    function installOverrides() {
        disableRolling();
        removeCrossMarkedText();
        ensurePromptPanel();
        ensureResultPanels();
        ensureCalendarPanel();
        renderWaiting();
        window.p_renderDemo = function () {
            disableRolling();
            removeCrossMarkedText();
            ensureResultPanels();
            renderWaiting();
        };
        const view = $('view-prompt');
        if (view) {
            view.addEventListener('click', () => setTimeout(() => {
                disableRolling();
                removeCrossMarkedText();
                ensureResultPanels();
            }, 50));
            view.addEventListener('input', () => setTimeout(renderWaiting, 120));
        }
        loadSettings();
    }

    window.DealerDashboardOnlineAI = {
        installOverrides,
        improvePrompt,
        runPrompt,
        refreshCalendarSearchStatus,
        runCalendarSearch,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installOverrides);
    } else {
        installOverrides();
    }
})();
