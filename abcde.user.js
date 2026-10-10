// ==UserScript==
// @name         gtraffic auto full
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Tự động 100%: Tự đếm, tự copy, tự đóng tab, tự điền và ấn xác nhận
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        window.close
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // ---------------------------------------------------------
    // PHẦN 1: XỬ LÝ TRÊN TRANG GTRAFFIC (TRANG NHẬN MÃ)
    // ---------------------------------------------------------
    const isGtrafficDomain = window.location.hostname.includes('gtraffic.io');
    
    if (isGtrafficDomain) {
        console.log('[Tampermonkey] Đang chờ mã từ tab khác...');
        
        GM_addValueChangeListener("gtraffic_code", function(name, old_value, new_value, remote) {
            if (new_value && remote) {
                console.log('[Tampermonkey] Đã nhận được mã:', new_value);
                
                // Tìm ô nhập mã
                const inputElement = document.querySelector('input[placeholder="Nhập mã xác nhận"]');
                if (inputElement) {
                    inputElement.value = new_value;
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                    // Tìm nút và click
                    setTimeout(() => {
                        const buttons = document.querySelectorAll('button');
                        for (let btn of buttons) {
                            const text = (btn.innerText || btn.textContent || "").toLowerCase();
                            if (text.includes('nhập mã xác nhận')) {
                                btn.click();
                                console.log('[Tampermonkey] Đã click nút xác nhận!');
                                GM_setValue("gtraffic_code", ""); // Reset mã sau khi dùng
                                break;
                            }
                        }
                    }, 800); 
                }
            }
        });
        return; 
    }

    // ---------------------------------------------------------
    // PHẦN 2: XỬ LÝ TRÊN TRANG TÌM MÃ (TRANG GỬI MÃ)
    // ---------------------------------------------------------
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
        '#gtr2-copy-code', '#copy-code',
        '[id*="copy-code"]', '[class*="copy-code"]'
    ];

    let currentCode = '';

    function createStatusBox() {
        if (!isTopWindow) return null;
        let box = document.getElementById('gtraffic-status-box');
        if (!box) {
            box = document.createElement('div');
            box.id = 'gtraffic-status-box';
            Object.assign(box.style, {
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                backgroundColor: '#ff4d4f', color: '#ffffff', padding: '18px 25px',
                borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                zIndex: '999999', fontFamily: 'Arial, sans-serif', textAlign: 'center',
                minWidth: '250px', border: '3px solid #ffffff', cursor: 'pointer',
                userSelect: 'none', transition: 'all 0.2s ease'
            });

            box.innerHTML = `
                <div style="font-size: 13px; font-weight: bold; opacity: 0.9; margin-bottom: 6px; letter-spacing: 1px;">GTRAFFIC STATUS</div>
                <div id="gtraffic-content" style="font-size: 20px; font-weight: bold;">Đang tìm nút...</div>
                <div id="gtraffic-code-box" style="margin-top: 10px;"></div>
            `;
            
            // Giữ lại fallback bấm tay phòng trường hợp trình duyệt chặn auto-close
            box.onclick = () => {
                if (currentCode) {
                    GM_setValue("gtraffic_code", currentCode);
                    GM_setClipboard(currentCode);
                    window.close();
                }
            };

            document.body.appendChild(box);
        }
        return box;
    }

    function updateStatus(statusText, code = '') {
        if (!isTopWindow) return;
        const box = createStatusBox();
        const contentEl = document.getElementById('gtraffic-content');
        const codeBoxEl = document.getElementById('gtraffic-code-box');

        // NẾU TÌM THẤY MÃ VÀ LÀ MÃ MỚI
        if (code && code !== currentCode) {
            currentCode = code;
            
            // 1. Cập nhật giao diện
            if (contentEl) contentEl.innerText = 'ĐÃ LẤY MÃ XONG!';
            codeBoxEl.innerHTML = `
                <div id="gtraffic-btn-inner" style="
                    background: #ffffff; color: #ff4d4f; font-size: 24px; font-weight: 800;
                    padding: 10px 15px; border-radius: 10px; margin-top: 8px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2); letter-spacing: 1px;
                ">${code}</div>
            `;

            // 2. AUTO COPY & AUTO CHUYỂN TRANG
            GM_setClipboard(currentCode); // Auto copy vào khay nhớ tạm
            GM_setValue("gtraffic_code", currentCode); // Bắn tín hiệu sang tab Gtraffic
            
            // Đổi màu thông báo
            if (box) box.style.backgroundColor = '#52c41a';
            const btnInner = document.getElementById('gtraffic-btn-inner');
            if (btnInner) btnInner.innerText = '✓ ĐANG ĐÓNG TAB...';
            
            // Đợi 1.5s rồi tự đóng (để bạn nhìn thấy nó đã bắt được)
            setTimeout(() => {
                window.close();
            }, 1500);

        } else if (!currentCode && contentEl) {
            contentEl.innerText = statusText;
        }
    }

    function getCodeFromAnywhere() {
        for (const selector of codeSelectors) {
            const el = document.querySelector(selector);
            if (el && (el.innerText || el.textContent).trim().length >= 4) {
                return (el.innerText || el.textContent).trim();
            }
        }
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
            } catch (e) {}
        }
        return null;
    }

    function startMonitoring() {
        setInterval(() => {
            const foundCode = getCodeFromAnywhere();
            if (foundCode) {
                updateStatus('', foundCode);
                return;
            }
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

    if (isTopWindow) {
        startMonitoring();
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (findAndClickTarget() || attempts >= 20) clearInterval(interval);
        }, 500);
    }
})();
