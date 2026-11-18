// ==UserScript==
// @name         Auto Click Complete - Cryptolinkforearn
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Cuộn khung IconCaptcha vào giữa màn hình, click nút Xác Minh, Continue (kể cả trong iFrame) và Confirm & Claim
// @match        https://pub.cryptolinkforearn.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let verifyClicked = false;
    let continueClicked = false;
    let confirmClaimClicked = false;
    let captchaScrolled = false;

    // Hàm giả lập click mạnh mẽ hơn
    function triggerClick(el) {
        if (!el) return;
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            el.dispatchEvent(new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        });
    }

    // 0. TỰ ĐỘNG CUỘN KHUNG ICONCAPTCHA VÀO GIỮA MÀN HÌNH
    function autoScrollCaptcha() {
        if (captchaScrolled) return;

        // Tìm khung dialog của IconCaptcha (sử dụng *= để tránh bị lỗi khi chuỗi hash phía sau thay đổi)
        const captchaBox = document.querySelector('section[class*="IconCaptcha_dialog"]');
        if (captchaBox) {
            const style = getComputedStyle(captchaBox);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                console.log('[AutoClick] Cuộn khung IconCaptcha vào giữa màn hình');
                captchaScrolled = true;
                captchaBox.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }

    // 1. TÌM NÚT XÁC MINH
    function autoClickVerify() {
        if (verifyClicked) return;
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const text = (button.innerText || button.textContent || '').trim().toLowerCase();
            if ((text.includes('xác minh để tiếp tục') || text.includes('verify to continue')) && !button.disabled) {
                console.log('[AutoClick] Click nút Xác minh');
                verifyClicked = true;
                triggerClick(button);
                setTimeout(() => { verifyClicked = false; }, 3000);
                break;
            }
        }
    }

    // 2. TÌM NÚT CONTINUE (QUÉT CẢ IFRAME)
    function autoClickContinue() {
        if (continueClicked) return;

        // Tìm trong document chính và tất cả các iframe
        const docs = [document];
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                if (iframe.contentDocument) docs.push(iframe.contentDocument);
            } catch (e) {
                // Bỏ qua iframe khác domain (CORS)
            }
        });

        for (const doc of docs) {
            // Tìm nút Continue theo tên class chứa IconCaptcha_continue hoặc chứa text 'Continue'
            const btn = doc.querySelector('button[class*="IconCaptcha_continue"]') ||
                        Array.from(doc.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'continue');

            if (btn && !btn.disabled) {
                const style = getComputedStyle(btn);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    console.log('[AutoClick] Click nút Continue IconCaptcha');
                    continueClicked = true;
                    triggerClick(btn);
                    setTimeout(() => { continueClicked = false; }, 3000);
                    break;
                }
            }
        }
    }

    // 3. TÌM NÚT CONFIRM & CLAIM REWARD
    function autoClickConfirmClaim() {
        if (confirmClaimClicked) return;

        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const text = (button.innerText || button.textContent || '').trim().toLowerCase();
            if (text.includes('confirm & claim reward') && !button.disabled) {
                const style = getComputedStyle(button);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    console.log('[AutoClick] Click nút Confirm & Claim Reward');
                    confirmClaimClicked = true;
                    triggerClick(button);
                    setTimeout(() => { confirmClaimClicked = false; }, 3000);
                    break;
                }
            }
        }
    }

    // Tự động quét liên tục
    setInterval(() => {
        autoScrollCaptcha();
        autoClickVerify();
        autoClickContinue();
        autoClickConfirmClaim();
    }, 500);
})();
