// ==UserScript==
// @name         Auto Close Ads - CryptoLinkForEarn
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Tự động đóng quảng cáo CryptoLinkForEarn
// @author       You
// @match        https://cryptolinkforearn.com/*
// @match        https://*.cryptolinkforearn.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    function clickX(svg) {
        console.log('[AutoClose] FOUND X:', svg);

        // 1. Gọi onclick nếu có
        if (typeof svg.onclick === 'function') {
            try {
                svg.onclick();
            } catch (e) {}
        }

        // 2. Pointer events
        try {
            svg.dispatchEvent(new PointerEvent('pointerover', {
                bubbles: true,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));

            svg.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
                button: 0
            }));

            svg.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
                button: 0
            }));
        } catch (e) {}

        // 3. Mouse events
        try {
            svg.dispatchEvent(new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
            }));

            svg.dispatchEvent(new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
            }));

            svg.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
            }));
        } catch (e) {}

        // 4. Native click
        try {
            svg.click();
        } catch (e) {}

        // 5. Click parent
        if (svg.parentElement) {
            try {
                svg.parentElement.click();

                svg.parentElement.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0
                }));
            } catch (e) {}
        }
    }

    function findAndClose() {
        const svgs = document.querySelectorAll('svg');

        svgs.forEach(svg => {
            const style = getComputedStyle(svg);

            const viewBox = svg.getAttribute('viewBox');

            // Đúng SVG nút X trong ảnh
            const isX =
                viewBox === '-0 -960 960 960' ||
                viewBox === '0 -960 960 960';

            const isAdClose =
                style.position === 'absolute' &&
                style.cursor === 'pointer' &&
                style.zIndex === '1000000';

            if (isX && isAdClose) {
                clickX(svg);
            }
        });
    }

    // Chạy liên tục
    setInterval(findAndClose, 100);

    // Theo dõi khi quảng cáo xuất hiện
    function startObserver() {
        if (!document.documentElement) return;

        const observer = new MutationObserver(() => {
            findAndClose();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        findAndClose();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }

})();
