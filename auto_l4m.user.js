// ==UserScript==
// @name         Link4M Auto Helper (Auto Copy + Paste Link4M)
// @namespace    link4m-auto-helper
// @version      1.3.0
// @description  Tu dong lay ma Link4M, copy + dong tab va tu dan vao o Nhap ma tren link4m.org
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        window.close
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;

    const isLink4mPage = /(^|\.)link4m\.(org|net|co|com|app)$/i.test(location.hostname);

    // =========================================================================
    // PHAN 1: TRANG LINK4M.ORG -> NHAN MA & TU DONG DAN VAO O "NHAP MA"
    // =========================================================================

    if (isLink4mPage) {
        let lastFocusedAt = Date.now();
        let lastFilledCode = '';

        window.addEventListener('focus', () => {
            lastFocusedAt = Date.now();
            tryFillLatestCode();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                lastFocusedAt = Date.now();
                tryFillLatestCode();
            }
        });

        function findCodeInput() {
            return (
                document.querySelector('#main-form input[name="password"]') ||
                document.querySelector('input.password[placeholder*="Nhập mã"]') ||
                document.querySelector('input[placeholder*="Nhập mã"]')
            );
        }

        function fillInputValue(input, code) {
            input.focus();
            input.value = code;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Highlight vien xanh de bao hieu da dan thanh cong
            input.style.border = '2px solid #28a745';
            input.style.backgroundColor = '#e8f5e9';
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function tryFillLatestCode() {
            const payload = GM_getValue('l4m_latest_payload', null);
            if (!payload || !payload.code || payload.used) return;
            if (payload.code === lastFilledCode) return;

            // Chi nhan ma moi duoc copy trong vong 30 giay gan nhat
            if (Date.now() - payload.ts > 30000) return;

            const input = findCodeInput();
            if (!input) return;

            // Uu tien tab dang hien thi (tab gan nhat vua duoc chuyen ve sau khi dong tab lay ma)
            if (document.hidden) return;

            lastFilledCode = payload.code;
            GM_setValue('l4m_latest_payload', {
                ...payload,
                used: true
            });

            fillInputValue(input, payload.code);
        }

        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener('l4m_latest_payload', function (name, oldVal, newVal) {
                if (newVal && !newVal.used) {
                    // Cho 150ms de trinh duyet kip chuyen focus ve tab link4m gan nhat sau window.close()
                    setTimeout(tryFillLatestCode, 150);
                }
            });
        }

        setInterval(tryFillLatestCode, 500);
        return;
    }

    // =========================================================================
    // PHAN 2: TRANG NHIEM VU -> LAY MA, BAM COPY & DONG TAB
    // =========================================================================

    const STATE_KEY = '__l4m_helper_step2__';
    let clickedGetCode = false;
    let clickedArticleLink = false;
    let scrolledStep2 = false;
    let scrollDirection = -1;
    let scrollInterval = null;
    let extractedCode = null;
    let uiBox = null;
    let uiText = null;
    let uiSub = null;

    function createCenterUI() {
        if (uiBox) return;

        const style = document.createElement('style');
        style.textContent = `
            #l4m-orange-box {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 2147483647;
                min-width: 290px;
                max-width: 90vw;
                padding: 18px 26px;
                border-radius: 14px;
                background: #ff6b00;
                border: 3px solid #fff3e0;
                box-shadow: 0 12px 35px rgba(255, 107, 0, 0.55);
                color: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
                text-align: center;
                user-select: none;
                transition: transform 0.15s ease, background 0.2s ease;
            }
            #l4m-orange-box.ready {
                background: #e65100;
                cursor: pointer;
                animation: l4m-pulse 1.2s infinite;
            }
            #l4m-orange-box.ready:hover {
                transform: translate(-50%, -50%) scale(1.04);
                background: #ff7b00;
            }
            #l4m-orange-title {
                font-size: 20px;
                font-weight: 800;
                letter-spacing: 0.5px;
                line-height: 1.3;
            }
            #l4m-orange-sub {
                margin-top: 6px;
                font-size: 13px;
                opacity: 0.95;
            }
            @keyframes l4m-pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.75); }
                70% { box-shadow: 0 0 0 18px rgba(255, 107, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 107, 0, 0); }
            }
        `;
        document.head.appendChild(style);

        uiBox = document.createElement('div');
        uiBox.id = 'l4m-orange-box';
        uiBox.innerHTML = `
            <div id="l4m-orange-title">⏳ Đang khởi tạo...</div>
            <div id="l4m-orange-sub">Link4M Auto Helper</div>
        `;
        document.body.appendChild(uiBox);

        uiText = uiBox.querySelector('#l4m-orange-title');
        uiSub = uiBox.querySelector('#l4m-orange-sub');

        uiBox.addEventListener('click', function () {
            if (!extractedCode) return;
            copyPasteAndClose(extractedCode);
        });
    }

    function updateUI(title, sub, isReady = false) {
        createCenterUI();
        uiText.textContent = title;
        uiSub.textContent = sub;
        if (isReady) {
            uiBox.classList.add('ready');
        } else {
            uiBox.classList.remove('ready');
        }
    }

    function copyPasteAndClose(code) {
        // 1. Luu vao bo nho tam trinh duyet
        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(code, 'text');
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).catch(() => {});
            }
        } catch (e) {}

        // 2. Gui ma sang tab link4m.org gan nhat
        GM_setValue('l4m_latest_payload', {
            code: code,
            ts: Date.now(),
            used: false
        });

        sessionStorage.removeItem(STATE_KEY);
        updateUI(`✅ ĐÃ COPY: ${code}`, 'Đang đóng tab & tự dán sang Link4M...', true);

        setTimeout(() => {
            window.close();
        }, 250);
    }

    // ==============================
    // AUTO CUON LEN XUONG TU TU (TH1)
    // ==============================

    function startSlowScroll() {
        if (scrollInterval) return;

        scrollInterval = setInterval(() => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll <= 0) return;

            const currentY = window.scrollY;
            if (currentY <= 120) {
                scrollDirection = 1;
            } else if (currentY >= maxScroll - 80) {
                scrollDirection = -1;
            }

            window.scrollBy({
                top: scrollDirection * 95,
                behavior: 'smooth'
            });
        }, 700);
    }

    function stopSlowScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    // ==============================
    // TIM NUT "LAY MA" & WIDGET
    // ==============================

    function findGetCodeButton() {
        const candidates = document.querySelectorAll('button, div[style*="rgb(237, 28, 36)"], div[style*="#ed1c24"]');
        for (const el of candidates) {
            const txt = (el.innerText || el.textContent || '').trim();
            if (/^(?:L4M\s*)?LẤY MÃ$/i.test(txt)) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return el;
                }
            }
        }
        return null;
    }

    function getWidgetContainer() {
        const whaton = document.querySelector('.whatoncode, .whatoncode-wrapper');
        if (whaton) return { type: 'TH1', el: whaton };

        const dataClickDiv = document.querySelector('div[data-click="true"], div[data-time]');
        if (dataClickDiv) return { type: 'TH2', el: dataClickDiv };

        return null;
    }

    // ==============================
    // CLICK RANDOM LINK BAI VIET
    // ==============================

    function clickRandomInternalLink() {
        if (clickedArticleLink) return;

        const currentOrigin = location.origin;
        const currentHref = location.href.split('#')[0];

        const allLinks = Array.from(document.querySelectorAll('a[href]')).filter(a => {
            const href = a.getAttribute('href') || '';
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return false;
            }

            try {
                const url = new URL(a.href, currentOrigin);
                if (url.origin !== currentOrigin) return false;
                if (url.href.split('#')[0] === currentHref) return false;
                if (url.pathname === '/' || url.pathname === '') return false;
                if (/wp-login|wp-admin|feed|cart|checkout|account/i.test(url.pathname)) return false;

                const rect = a.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            } catch {
                return false;
            }
        });

        const articleLinks = allLinks.filter(a => {
            const path = new URL(a.href).pathname;
            return path.split('/').filter(Boolean).length >= 1 && (a.innerText || '').trim().length >= 8;
        });

        const pool = articleLinks.length > 0 ? articleLinks : allLinks;
        if (!pool.length) {
            updateUI('⚠️ Không tìm thấy link bài viết', 'Hãy bấm tay 1 link bất kỳ trên trang', false);
            return;
        }

        clickedArticleLink = true;
        stopSlowScroll();
        sessionStorage.setItem(STATE_KEY, '1');

        const chosen = pool[Math.floor(Math.random() * pool.length)];
        updateUI('🔗 Đang chuyển sang bài viết...', (chosen.innerText || chosen.href).trim().slice(0, 45), false);

        setTimeout(() => {
            chosen.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                chosen.click();
                setTimeout(() => {
                    if (location.href.split('#')[0] === currentHref) {
                        location.href = chosen.href;
                    }
                }, 800);
            }, 400);
        }, 500);
    }

    // ==============================
    // VONG LAP XU LY CHINH
    // ==============================

    function mainTick() {
        if (extractedCode) return;

        const widgetInfo = getWidgetContainer();
        const bodyText = widgetInfo ? (widgetInfo.el.innerText || '') : '';

        // Buoc A: Phat hien ma -> hien nut bam mau cam
        const codeMatch = bodyText.match(/Mã(?:\s*KM)?\s*:\s*([A-Za-z0-9_-]{4,})/i);
        if (codeMatch && codeMatch[1]) {
            stopSlowScroll();
            sessionStorage.removeItem(STATE_KEY);
            extractedCode = codeMatch[1].trim();
            updateUI(
                `📋 MÃ: ${extractedCode}`,
                '👆 BẤM ĐỂ COPY, ĐÓNG TAB & TỰ DÁN VÀO LINK4M',
                true
            );
            return;
        }

        // Buoc B: Het vong 1 -> bam random bai viet
        if (/click vào link bất kỳ/i.test(bodyText)) {
            stopSlowScroll();
            updateUI('🔄 Hết vòng 1/2', 'Đang tự động mở 1 bài viết ngẫu nhiên...', false);
            clickRandomInternalLink();
            return;
        }

        // Buoc C: Dang dem nguoc
        const waitMatch = bodyText.match(/(?:Vui lòng chờ|Lấy mã sau|Chờ)\s*(\d+\s*s?(?:\s*\(\d+\/\d+\))?)/i)
            || bodyText.match(/(\d+\s*s\s*\(\d+\/\d+\))/i);

        if (waitMatch) {
            sessionStorage.removeItem(STATE_KEY);
            const timeText = waitMatch[1].trim();
            const needScroll = (widgetInfo && widgetInfo.type === 'TH1') || /kéo lên/i.test(bodyText);

            if (needScroll) {
                startSlowScroll();
                updateUI(`⏳ Đang chờ: ${timeText}`, 'TH1: Tự động cuộn lên xuống từ từ...', false);
            } else {
                stopSlowScroll();
                updateUI(`⏳ Đang chờ: ${timeText}`, 'TH2: Đứng yên chờ đếm ngược...', false);
            }
            return;
        }

        // Buoc D: Tim nut "LẤY MÃ"
        if (!clickedGetCode) {
            const btn = findGetCodeButton();
            if (btn) {
                clickedGetCode = true;
                sessionStorage.removeItem(STATE_KEY);
                updateUI('🎯 Đã thấy nút LẤY MÃ', 'Đang cuộn xuống và tự động bấm...', false);
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    btn.click();
                }, 600);
                return;
            }

            if (sessionStorage.getItem(STATE_KEY) === '1' && !scrolledStep2) {
                scrolledStep2 = true;
                updateUI('⬇️ Đang cuộn xuống cuối bài...', 'Tìm nút LẤY MÃ vòng 2/2...', false);
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }

    setInterval(mainTick, 500);
})();
