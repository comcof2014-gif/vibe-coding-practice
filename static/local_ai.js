(function () {
    const state = {
        status: null,
        polling: null,
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
        const firstSection = promptView.querySelector('section');
        const panel = document.createElement('section');
        panel.id = 'local-ai-panel';
        panel.className = 'bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200';
        panel.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-start gap-4">
                <div class="lg:w-[280px] shrink-0">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <h3 class="font-bold text-stone-800">로컬 AI 추천 엔진</h3>
                        <span id="local-ai-badge" class="text-[11px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">대기</span>
                    </div>
                    <div class="h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                        <div id="local-ai-progress" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width:0%"></div>
                    </div>
                    <div id="local-ai-phase" class="text-xs text-stone-500 leading-relaxed">로컬 AI 상태를 확인하는 중입니다.</div>
                    <div id="local-ai-warning" class="hidden mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"></div>
                </div>
                <div class="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div class="lg:col-span-7">
                        <label class="block text-xs font-bold text-stone-600 mb-1">만들고 싶은 산출물</label>
                        <textarea id="local-ai-input" class="w-full border border-stone-300 rounded-md p-3 h-24 resize-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="예: 구축 아파트 고객에게 보낼 무상점검 알림톡과 전화 스크립트가 필요해요."></textarea>
                    </div>
                    <div class="lg:col-span-5 flex flex-col">
                        <button id="local-ai-match-btn" class="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">로컬 AI로 추천</button>
                        <button id="local-ai-use-current-btn" class="mt-2 px-4 py-2 bg-white text-stone-700 border border-stone-300 rounded-md text-sm font-semibold hover:bg-stone-50 transition-colors">현재 입력으로 추천</button>
                        <div id="local-ai-result" class="mt-3 flex-grow text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-md p-3 min-h-[72px]">추천 결과가 여기에 표시됩니다.</div>
                    </div>
                </div>
            </div>
        `;
        if (firstSection) firstSection.insertAdjacentElement('afterend', panel);
        else promptView.prepend(panel);

        byId('local-ai-match-btn').addEventListener('click', runMatch);
        byId('local-ai-use-current-btn').addEventListener('click', () => {
            byId('local-ai-input').value = collectPromptContext();
            runMatch();
        });
    }

    function receiveStatus(status) {
        state.status = status || {};
        const progress = Math.max(0, Math.min(100, Number(state.status.progress || 0)));
        const badge = byId('local-ai-badge');
        const bar = byId('local-ai-progress');
        const phase = byId('local-ai-phase');
        const warning = byId('local-ai-warning');
        const matchBtn = byId('local-ai-match-btn');
        if (!badge || !bar || !phase) return;

        bar.style.width = `${progress}%`;
        phase.textContent = state.status.phase || '로컬 AI 상태 확인 중';
        if (state.status.model_dir) {
            phase.textContent += ` · 저장 위치: ${state.status.model_dir}`;
        }

        if (state.status.ready) {
            badge.textContent = '준비 완료';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200';
            if (matchBtn) matchBtn.disabled = false;
        } else if (state.status.state === 'error') {
            badge.textContent = '오류';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200';
            if (matchBtn) matchBtn.disabled = true;
        } else {
            badge.textContent = '준비 중';
            badge.className = 'text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200';
            if (matchBtn) matchBtn.disabled = true;
        }

        if (warning) {
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
        const ready = state.status && (state.status.ready || state.status.state === 'error');
        if (!ready) state.polling = setTimeout(pollStatus, 1200);
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

    function collectPromptContext() {
        const chunks = [];
        const title = byId('p-promptTitle');
        const summary = byId('p-promptSummary');
        if (title && title.textContent.trim()) chunks.push(title.textContent.trim());
        if (summary && summary.textContent.trim()) chunks.push(summary.textContent.trim());
        document.querySelectorAll('#p-common-fields input, #p-common-fields textarea, #p-specific-fields input, #p-specific-fields textarea')
            .forEach(el => {
                const value = (el.value || '').trim();
                if (value) chunks.push(value);
            });
        return chunks.join('\n');
    }

    async function runMatch() {
        const input = byId('local-ai-input');
        const result = byId('local-ai-result');
        if (!input || !result) return;
        const text = input.value.trim() || collectPromptContext();
        if (!text) {
            result.innerHTML = '<span class="text-amber-700 font-semibold">추천할 내용을 먼저 입력하세요.</span>';
            return;
        }
        result.innerHTML = '<span class="text-stone-500">로컬 모델로 비교 중입니다.</span>';
        try {
            const res = await fetch('/api/ai/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, top_k: 3 }),
            });
            if (res.status === 409) {
                const data = await res.json();
                if (data.detail && data.detail.status) receiveStatus(data.detail.status);
                result.innerHTML = '<span class="text-amber-700 font-semibold">모델 준비가 끝나면 다시 추천할 수 있습니다.</span>';
                return;
            }
            if (!res.ok) throw new Error('match failed');
            const data = await res.json();
            renderMatch(data);
            selectPrompt(data.best.id);
        } catch {
            result.innerHTML = '<span class="text-red-600 font-semibold">추천 중 오류가 발생했습니다.</span>';
        }
    }

    function renderMatch(data) {
        const result = byId('local-ai-result');
        if (!result || !data || !data.best) return;
        const rows = (data.matches || []).map(item => `
            <div class="flex items-center justify-between gap-2 text-xs py-1 border-t border-stone-200 first:border-t-0">
                <span class="font-semibold text-stone-700">${esc(item.title)}</span>
                <span class="font-mono text-emerald-700">${esc(item.score)}</span>
            </div>
        `).join('');
        result.innerHTML = `
            <div class="font-bold text-stone-900 mb-1">${esc(data.best.title)}</div>
            <div class="text-xs text-stone-500 mb-2">가장 가까운 프롬프트로 자동 이동했습니다.</div>
            <div class="bg-white border border-stone-200 rounded p-2">${rows}</div>
        `;
        showToastLocal('로컬 AI 추천이 적용되었습니다.');
    }

    function selectPrompt(id) {
        try {
            if (typeof PROMPTS === 'undefined' || typeof p_render !== 'function') return;
            const idx = PROMPTS.findIndex(item => item.id === id);
            if (idx < 0) return;
            p_current = idx;
            p_progress = 0;
            p_render();
        } catch {
            const tabButtons = document.querySelectorAll('#p-tabs button');
            tabButtons.forEach(btn => {
                if (btn.textContent.includes(id)) btn.click();
            });
        }
    }

    window.DealerDashboardAI = {
        receiveStatus,
        startEngine,
        runMatch,
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectPanel();
        startEngine();
    });
})();
