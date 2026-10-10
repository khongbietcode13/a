// ==UserScript==
// @name         gtraffic
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Quét xuyên iframe, tự động bắt mã và copy
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Chỉ tạo giao diện ở trang chính (tránh tạo ô đỏ nhỏ xíu bên trong iframe)
    const isTopWindow = window === window.top;

    const selectors = [
        '.trade-btn-clf-container', '.trade-btn-clf',
        '.trade-d-btn-container', '.trade-d-btn',
        '#trade-btn-clf__content', '#trade-d-btn__content',
        '.trade-btn-container', '.trade-btn',
        '#avt-btn', '#trade-btn_arrow', '#trade-btn__content',
        '.gtr2-trade-btn-container', '.gtr2-trade-btn',
        '#gtr2-avt-btn', '#gtr2-trade-btn_arrow',
        '#gtr2-trade-btn__content', '#gtr2-logo-svg-us'
    ];

    const codeSelectors = [
        '#gtr2-copy-code',
        '#copy-code',
        '[id*="copy-code"]',
        '[class*="copy-code"]'
    ];

    let currentCode = '';

    function createStatusBox() {
        if (!isTopWindow) return null;
        let box = document.getElementById('gtraffic-status-box');
        if (!box) {
            box = document.createElement('div');
            box.id = 'gtraffic-status-box';
            Object.assign(box.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ff4d4f',
                color: '#ffffff',
                padding: '18px 25px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                zIndex: '999999',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                minWidth: '250px',
                border: '3px solid #ffffff',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease'
            });

            box.innerHTML = `
                <div style="font-size: 13px; font-weight: bold; opacity: 0.9; margin-bottom: 6px; letter-spacing: 1px;">GTRAFFIC STATUS</div>
                <div id="gtraffic-content" style="font-size: 20px; font-weight: bold;">Đang tìm nút...</div>
                <div id="gtraffic-code-box" style="margin-top: 10px;"></div>
            `;

            box.onclick = () => {
                if (currentCode) copyToClipboard(currentCode);
            };

            document.body.appendChild(box);
        }
        return box;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const box = document.getElementById('gtraffic-status-box');
            const codeBtn = document.getElementById('gtraffic-btn-inner');
            if (box) box.style.backgroundColor = '#52c41a';
            if (codeBtn) codeBtn.innerText = '✓ ĐÃ COPY MÃ!';
            setTimeout(() => {
                if (box) box.style.backgroundColor = '#ff4d4f';
                if (codeBtn) codeBtn.innerText = text;
            }, 1500);
        });
    }

    function updateStatus(statusText, code = '') {
        if (!isTopWindow) return;
        createStatusBox();
        const contentEl = document.getElementById('gtraffic-content');
        const codeBoxEl = document.getElementById('gtraffic-code-box');

        if (code && code !== currentCode) {
            currentCode = code;
            if (contentEl) contentEl.innerText = 'CLICK ĐỂ COPY MÃ!';
            codeBoxEl.innerHTML = `
                <div id="gtraffic-btn-inner" style="
                    background: #ffffff; color: #ff4d4f; font-size: 24px; font-weight: 800;
                    padding: 10px 15px; border-radius: 10px; margin-top: 8px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2); letter-spacing: 1px;
                ">${code}</div>
            `;
        } else if (!currentCode && contentEl) {
            contentEl.innerText = statusText;
        }
    }

    // Hàm quét mã an toàn qua cả trang chính và các iframe
    function getCodeFromAnywhere() {
        // 1. Quét trang chính
        for (const selector of codeSelectors) {
            const el = document.querySelector(selector);
            if (el && (el.innerText || el.textContent).trim().length >= 4) {
                return (el.innerText || el.textContent).trim();
            }
        }
        // 2. Quét xuyên các iframe
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                if (iframeDoc) {
                    for (const selector of codeSelectors) {
                        const el = iframeDoc.querySelector(selector);
                        if (el && (el.innerText || el.textContent).trim().length >= 4) {
                            return (el.innerText || el.textContent).trim();
                        }
                    }
                }
            } catch (e) {
                // Bỏ qua nếu iframe bị chặn bảo mật (Cross-origin)
            }
        }
        return null;
    }

    function startMonitoring() {
        setInterval(() => {
            // Liên tục tìm code
            const foundCode = getCodeFromAnywhere();
            if (foundCode) {
                updateStatus('', foundCode);
                return;
            }

            // Nếu chưa có code, tìm số giây
            if (!currentCode) {
                let foundSec = '';
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        const text = el.innerText || el.textContent || '';
                        const match = text.match(/\d+/);
                        if (match) {
                            foundSec = parseInt(match[0], 10);
                            break;
                        }
                    }
                }
                if (foundSec !== '') {
                    updateStatus('Đang đếm: ' + foundSec + 's');
                }
            }
        }, 300);
    }

    function findAndClickTarget() {
        if (!isTopWindow) return false;
        let targetElement = null;
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                targetElement = el;
                break;
            }
        }

        if (targetElement) {
            updateStatus('Đã thấy nút! Đang cuộn...');
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                targetElement.click();
                const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                targetElement.dispatchEvent(clickEvent);
                updateStatus('Đã click! Chờ đếm giây...');
            }, 800);
            return true;
        }
        return false;
    }

    // Nếu là trang chính thì bắt đầu click và đếm
    if (isTopWindow) {
        startMonitoring();
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (findAndClickTarget() || attempts >= 20) clearInterval(interval);
        }, 500);
    }
})();
