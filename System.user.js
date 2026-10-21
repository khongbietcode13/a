// ==UserScript==
// @name         TrafficHub Shortlink Auto Bypass & Code Claimer
// @namespace    https://traffichub.vn/
// @version      1.0.1
// @description  Tự động bypass nhiệm vụ TrafficHub, đếm ngược 60s qua API widget, nhận mã xác nhận chính xác và tự động mở khóa link gốc.
// @author       Antigravity Engineering
// @match        https://system.traffichub.vn/s/*
// @match        https://*.traffichub.vn/s/*
// @icon         https://traffic.vietify.vn/storage/tenants/favicons/78LfEC0L7Lh3TvEDoDD1UYvDOmIvpiZ2cW63FHlv.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // STYLES FOR FLOATING BYPASS PANEL
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        #th-bypass-panel {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 380px;
            max-width: calc(100vw - 32px);
            background: #0f172a;
            color: #f8fafc;
            border: 1px solid #334155;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            z-index: 9999999;
            overflow: hidden;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #th-bypass-panel.minimized {
            width: auto;
            border-radius: 30px;
        }
        #th-bypass-panel.minimized #th-body {
            display: none;
        }
        #th-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #334155;
            cursor: pointer;
            user-select: none;
        }
        #th-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            color: #38bdf8;
        }
        #th-title svg {
            width: 18px;
            height: 18px;
            fill: #38bdf8;
        }
        .th-btn-icon {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: color 0.15s, background 0.15s;
        }
        .th-btn-icon:hover {
            color: #f8fafc;
            background: #334155;
        }
        #th-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .th-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .th-label {
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .th-input {
            width: 100%;
            box-sizing: border-box;
            background: #1e293b;
            border: 1px solid #475569;
            color: #f8fafc;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
        }
        .th-input:focus {
            border-color: #38bdf8;
        }
        .th-btn-primary {
            background: linear-gradient(135deg, #0284c7, #2563eb);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: opacity 0.15s, transform 0.1s;
        }
        .th-btn-primary:hover:not(:disabled) {
            opacity: 0.95;
            transform: translateY(-1px);
        }
        .th-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #th-progress-container {
            display: none;
            background: #1e293b;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #334155;
        }
        #th-progress-bar-bg {
            width: 100%;
            height: 8px;
            background: #334155;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }
        #th-progress-bar-fill {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #38bdf8, #3b82f6);
            transition: width 1s linear;
        }
        #th-code-box {
            display: none;
            background: #064e3b;
            border: 1px solid #059669;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        #th-code-display {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #34d399;
            user-select: all;
            margin: 4px 0 8px 0;
        }
        #th-log-area {
            background: #020617;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            color: #94a3b8;
            max-height: 110px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .th-checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #94a3b8;
            cursor: pointer;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // ==========================================
    // UI COMPONENT
    // ==========================================
    const panel = document.createElement('div');
    panel.id = 'th-bypass-panel';
    panel.innerHTML = `
        <div id="th-header">
            <div id="th-title">
                <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                TrafficHub Bypass
            </div>
            <button class="th-btn-icon" id="th-toggle-min" title="Thu nhỏ / Mở rộng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
        </div>
        <div id="th-body">
            <div class="th-form-group">
                <div class="th-label">
                    <span>Link web nhiệm vụ:</span>
                    <a href="javascript:void(0)" id="th-auto-detect" style="color: #38bdf8; text-decoration: none;">[Tự tìm link]</a>
                </div>
                <input type="text" class="th-input" id="th-target-url" placeholder="https://example.com/bai-viet-nhiem-vu/">
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="th-btn-primary" id="th-btn-start" style="flex: 1;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Bắt đầu Bypass (60s)
                </button>
            </div>

            <label class="th-checkbox-label">
                <input type="checkbox" id="th-auto-submit" checked>
                Tự động điền mã & mở khóa link gốc
            </label>

            <div id="th-progress-container">
                <div style="display: flex; justify-content: space-between; font-weight: 600;">
                    <span id="th-progress-text">Đang chuẩn bị...</span>
                    <span id="th-time-text">60s</span>
                </div>
                <div id="th-progress-bar-bg">
                    <div id="th-progress-bar-fill"></div>
                </div>
            </div>

            <div id="th-code-box">
                <div style="font-size: 11px; color: #a7f3d0; text-transform: uppercase; font-weight: 600;">Mã xác nhận thành công:</div>
                <div id="th-code-display">------</div>
                <button class="th-btn-primary" id="th-btn-copy" style="width: 100%; padding: 6px; font-size: 12px; background: #059669;">
                    Sao chép mã
                </button>
            </div>

            <div class="th-form-group">
                <div class="th-label">Nhật ký hoạt động:</div>
                <div id="th-log-area">Sẵn sàng. Nhập link hoặc bấm "Tự tìm link".</div>
            </div>
        </div>
    `;
    (document.body || document.documentElement).appendChild(panel);

    // Elements
    const inputUrl = document.getElementById('th-target-url');
    const btnStart = document.getElementById('th-btn-start');
    const btnAutoDetect = document.getElementById('th-auto-detect');
    const btnCopy = document.getElementById('th-btn-copy');
    const btnToggleMin = document.getElementById('th-toggle-min');
    const progressContainer = document.getElementById('th-progress-container');
    const progressFill = document.getElementById('th-progress-bar-fill');
    const progressText = document.getElementById('th-progress-text');
    const timeText = document.getElementById('th-time-text');
    const codeBox = document.getElementById('th-code-box');
    const codeDisplay = document.getElementById('th-code-display');
    const logArea = document.getElementById('th-log-area');
    const chkAutoSubmit = document.getElementById('th-auto-submit');

    function log(msg) {
        const time = new Date().toLocaleTimeString();
        logArea.textContent += `[${time}] ${msg}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }

    // Toggle minimize
    btnToggleMin.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('minimized');
    });

    // Auto click nút "Tiếp tục" ở trang đầu tiên
    function autoClickFirstPageContinue() {
        const hasInput = document.querySelector('input[placeholder*="Nhập mã"], input[aria-label*="Mã"]');
        if (!hasInput) {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => {
                const txt = b.textContent.trim().toLowerCase();
                return (txt.includes('tiếp tục') || txt.includes('continue')) && b.id !== 'th-btn-start' && b.id !== 'th-btn-copy';
            });
            if (continueBtn && !continueBtn.disabled) {
                log('Phát hiện trang đầu, đang tự động bấm [Tiếp tục]...');
                continueBtn.click();
            }
        }
    }

    // Auto detect target URL from Inertia props on system.traffichub.vn
    function autoDetectUrl() {
        try {
            const dataPageEl = document.querySelector('[data-page]');
            if (dataPageEl) {
                const data = JSON.parse(dataPageEl.getAttribute('data-page'));
                if (data && data.props && data.props.job && data.props.job.url) {
                    inputUrl.value = data.props.job.url;
                    log(`Đã phát hiện web nhiệm vụ từ phiên hiện tại: ${data.props.job.url}`);
                    return true;
                }
            }
        } catch (e) {
            console.error(e);
        }

        // Try extracting from body text
        const matches = document.body.innerText.match(/https?:\/\/[^\s"'<>]+/g);
        if (matches) {
            const candidate = matches.find(u => !u.includes('traffichub.vn') && !u.includes('google.com') && !u.includes('vietify.vn'));
            if (candidate) {
                inputUrl.value = candidate;
                log(`Tìm thấy URL khả nghi trên trang: ${candidate}`);
                return true;
            }
        }

        log('Chưa tìm thấy link trong trang. Bạn có thể tự dán link vào ô.');
        return false;
    }

    btnAutoDetect.addEventListener('click', autoDetectUrl);

    // Initial check after load
    setTimeout(() => {
        autoClickFirstPageContinue();
        autoDetectUrl();
    }, 500);

    // HTTP Helper using GM_xmlhttpRequest or native fetch
    function httpGet(url, referer) {
        return new Promise((resolve, reject) => {
            const origin = referer ? new URL(referer).origin : 'https://system.traffichub.vn';
            const headers = {
                'User-Agent': navigator.userAgent,
                'Referer': referer || url,
                'Origin': origin,
                'Accept': 'application/json, text/plain, */*'
            };

            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: headers,
                    onload: function (res) {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(data);
                        } catch (err) {
                            reject(err);
                        }
                    },
                    onerror: function (err) {
                        reject(err);
                    }
                });
            } else {
                fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' })
                    .then(r => r.json())
                    .then(resolve)
                    .catch(reject);
            }
        });
    }

    // Call TrafficHub widget state API
    function callWidgetState(targetUrl, action) {
        const apiUrl = 'https://system.traffichub.vn/widget/state?u=' + encodeURIComponent(targetUrl) + '&action=' + action;
        return httpGet(apiUrl, targetUrl);
    }

    // Auto submit code into page input
    function submitCodeToPage(code) {
        log(`Đang tự động nhập mã [${code}] vào hệ thống...`);

        // Find input
        const input = document.querySelector('input[placeholder*="Nhập mã"], input[aria-label*="Mã"], input[type="text"]');
        if (!input) {
            log('Không tìm thấy ô nhập mã trên trang. Hãy sao chép mã và dán thủ công.');
            return;
        }

        // Use native setter for React / Vue / Inertia synthetic event dispatch
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, code);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        log('Đã điền mã vào ô nhập liệu.');

        // Find submit button
        setTimeout(() => {
            const form = input.closest('form');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            if (submitBtn && !submitBtn.disabled) {
                log('Đang bấm nút [Tiếp tục] để hoàn tất xác minh...');
                submitBtn.click();
            } else {
                log('Vui lòng bấm nút [Tiếp tục] để hoàn thành.');
            }
        }, 600);
    }

    // Main bypass execution
    let isRunning = false;
    async function runBypass() {
        const targetUrl = inputUrl.value.trim();
        if (!targetUrl) {
            alert('Vui lòng nhập link web nhiệm vụ trước khi bắt đầu!');
            inputUrl.focus();
            return;
        }

        isRunning = true;
        btnStart.disabled = true;
        progressContainer.style.display = 'block';
        codeBox.style.display = 'none';

        log(`Bắt đầu bypass cho: ${targetUrl}`);
        progressText.textContent = 'Khởi tạo widget state...';

        try {
            // 1. Info check
            const info = await callWidgetState(targetUrl, 'info');
            log(`Trạng thái ban đầu: ${info.status || 'idle'}`);
            const totalSeconds = info.onsite || 60;
            log(`Thời gian yêu cầu giữ trang: ${totalSeconds} giây`);

            // 2. Start timer on server
            log('Gửi lệnh [start] kích hoạt đồng hồ máy chủ...');
            const startResp = await callWidgetState(targetUrl, 'start');
            log(`Máy chủ xác nhận: ${startResp.status || 'counting'}`);

            // 3. Heartbeat countdown
            let remaining = totalSeconds;
            const startTime = Date.now();
            const endTime = startTime + (totalSeconds + 3) * 1000;

            const countdownInterval = setInterval(async () => {
                const now = Date.now();
                const leftMs = Math.max(0, endTime - now);
                const leftSec = Math.ceil(leftMs / 1000);
                
                timeText.textContent = `${leftSec}s`;
                const progressPct = Math.min(100, Math.round(((totalSeconds - leftSec) / totalSeconds) * 100));
                progressFill.style.width = `${progressPct}%`;
                progressText.textContent = `Đang duy trì phiên (${leftSec}s còn lại)...`;

                // Ping every ~5s
                if (leftSec % 5 === 0 && leftSec > 0) {
                    try {
                        await callWidgetState(targetUrl, 'ping');
                    } catch (e) {
                        // ignore heartbeat transient error
                    }
                }

                if (leftMs <= 0) {
                    clearInterval(countdownInterval);
                    progressText.textContent = 'Hết thời gian. Đang gọi API lấy mã...';
                    log('Hết thời gian đếm ngược. Đang lấy mã xác nhận...');
                    claimCode(targetUrl);
                }
            }, 1000);

        } catch (err) {
            log(`Lỗi trong quá trình khởi động: ${err.message || err}`);
            btnStart.disabled = false;
            isRunning = false;
        }
    }

    async function claimCode(targetUrl) {
        try {
            let resp = await callWidgetState(targetUrl, 'load');
            log(`Phản hồi lấy mã: status=${resp.status}, code=${resp.code || 'chưa có'}`);

            if (!resp.code && resp.status === 'counting') {
                log('Máy chủ cần thêm 2 giây bù trừ độ trễ mạng...');
                await new Promise(r => setTimeout(r, 2500));
                resp = await callWidgetState(targetUrl, 'load');
            }

            if (resp.code) {
                codeDisplay.textContent = resp.code;
                codeBox.style.display = 'block';
                progressText.textContent = 'Hoàn tất! Đã lấy mã thành công.';
                log(`ĐÃ NHẬN MÃ CHÍNH XÁC: ${resp.code}`);

                if (typeof GM_setClipboard !== 'undefined') {
                    GM_setClipboard(resp.code);
                    log('Đã tự động sao chép mã vào bộ nhớ tạm (Clipboard).');
                }

                if (chkAutoSubmit.checked) {
                    submitCodeToPage(resp.code);
                }
            } else {
                log('Không lấy được mã từ server. Vui lòng thử lại!');
            }
        } catch (err) {
            log(`Lỗi khi gọi API lấy mã: ${err.message || err}`);
        } finally {
            btnStart.disabled = false;
            isRunning = false;
        }
    }

    btnStart.addEventListener('click', runBypass);

    btnCopy.addEventListener('click', () => {
        const code = codeDisplay.textContent.trim();
        if (code && code !== '------') {
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(code);
            } else {
                navigator.clipboard.writeText(code);
            }
            btnCopy.textContent = '✓ Đã sao chép!';
            setTimeout(() => { btnCopy.textContent = 'Sao chép mã'; }, 2000);
        }
    });

})();
