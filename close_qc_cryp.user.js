// ==UserScript==
// @name         Auto Close Ads - CryptoLinkForEarn
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Tự đóng quảng cáo, phím tắt Alt+1/2/3/4, hiển thị Limit và Tự động chuyển hướng trang chủ
// @author       You
// @match        https://cryptolinkforearn.com/*
// @match        https://*.cryptolinkforearn.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // 0. TỰ ĐỘNG CHUYỂN HƯỚNG SANG TRANG LINKS
    // ==========================================
    const currentUrl = window.location.href.split('?')[0].split('#')[0]; // Lấy url gốc, bỏ qua các query parameters nếu có
    if (currentUrl === 'https://cryptolinkforearn.com/' || currentUrl === 'https://cryptolinkforearn.com') {
        window.location.replace('https://cryptolinkforearn.com/links');
        return; // Dừng thực thi các code bên dưới để chờ trình duyệt chuyển hướng
    }

    // ==========================================
    // 1. TẠO Ô HIỂN THỊ LIMIT MÀU ĐỎ Ở GÓC DƯỚI BÊN PHẢI
    // ==========================================
    function createLimitWidget() {
        if (document.getElementById('task-limit-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'task-limit-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999999;
            background-color: rgba(220, 38, 38, 0.95);
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
            line-height: 1.5;
            border: 2px solid #ffffff;
        `;
        widget.innerHTML = `
            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase;">🔥 Tình trạng Limit</div>
            <div id="limit-system">System 6h,12h,18h có mã (Alt+1): --</div>
            <div id="limit-directtraffic">Direct Traffic (Alt+2): --</div>
            <div id="limit-vietuser">Vietuser (Alt+3): --</div>
            <div id="limit-apptraffic">AppTraffic (Alt+4): --</div>
        `;

        const appendWidget = () => {
            if (document.body && !document.getElementById('task-limit-widget')) {
                document.body.appendChild(widget);
            }
        };

        if (document.body) appendWidget();
        else document.addEventListener('DOMContentLoaded', appendWidget);
    }

    function getTaskLimit(taskName) {
        const headings = document.querySelectorAll('h5');
        for (const h5 of headings) {
            if (h5.textContent.trim().toLowerCase() === taskName.toLowerCase()) {
                const parentCard = h5.closest('div[id^="pcl-"]') || h5.parentElement.parentElement;
                if (parentCard) {
                    const limitEl = parentCard.querySelector('.limit-text') || parentCard.querySelector('p');
                    if (limitEl) {
                        return limitEl.textContent.trim(); // Ví dụ: "Limit: 2/2" hoặc "2/2"
                    }
                }
            }
        }
        return 'Không tìm thấy';
    }

    function updateLimitWidget() {
        createLimitWidget();

        const systemEl = document.getElementById('limit-system');
        const directTrafficEl = document.getElementById('limit-directtraffic');
        const vietuserEl = document.getElementById('limit-vietuser');
        const appTrafficEl = document.getElementById('limit-apptraffic');

        if (systemEl) systemEl.textContent = `System (Alt+1): ${getTaskLimit('System')}`;
        if (directTrafficEl) directTrafficEl.textContent = `Direct Traffic (Alt+2): ${getTaskLimit('Direct Traffic')}`;
        if (vietuserEl) vietuserEl.textContent = `Vietuser (Alt+3): ${getTaskLimit('Vietuser')}`;
        if (appTrafficEl) appTrafficEl.textContent = `AppTraffic (Alt+4): ${getTaskLimit('AppTraffic')}`;
    }

    // Cập nhật Limit liên tục mỗi 1 giây
    setInterval(updateLimitWidget, 1000);

    // ==========================================
    // 2. PHÍM TẮT MỞ LINK NHIỆM VỤ (ALT + 1, 2, 3, 4)
    // ==========================================
    function openTaskByName(taskName) {
        const headings = document.querySelectorAll('h5');

        for (const h5 of headings) {
            if (h5.textContent.trim().toLowerCase() === taskName.toLowerCase()) {
                const parentCard = h5.closest('div[id^="pcl-"]') || h5.parentElement.parentElement;

                if (parentCard) {
                    const link = parentCard.querySelector('a[href]');
                    if (link) {
                        console.log(`[AutoShortcut] Đã tìm thấy link cho ${taskName}:`, link.href);
                        window.open(link.href, '_blank');
                        return;
                    }
                }
            }
        }
        console.warn(`[AutoShortcut] Không tìm thấy nhiệm vụ nào có tên: "${taskName}"`);
    }

    window.addEventListener('keydown', function (e) {
        if (!e.altKey) return;

        if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
            e.preventDefault();
            openTaskByName('System 6h,12h,18h có mã');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
            e.preventDefault();
            openTaskByName('Direct Traffic');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
            e.preventDefault();
            openTaskByName('Vietuser');
        } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
            e.preventDefault();
            openTaskByName('AppTraffic');
        }
    });

    // ==========================================
    // 3. CODE TỰ ĐỘNG ĐÓNG QUẢNG CÁO 
    // ==========================================
    function clickX(svg) {
        console.log('[AutoClose] FOUND X:', svg);

        if (typeof svg.onclick === 'function') {
            try { svg.onclick(); } catch (e) {}
        }

        try {
            svg.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
            svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }));
            svg.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }));
        } catch (e) {}

        try {
            svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 }));
            svg.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0 }));
            svg.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 }));
        } catch (e) {}

        try { svg.click(); } catch (e) {}

        if (svg.parentElement) {
            try {
                svg.parentElement.click();
                svg.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 }));
            } catch (e) {}
        }
    }

    function findAndClose() {
        const svgs = document.querySelectorAll('svg');

        svgs.forEach(svg => {
            const style = getComputedStyle(svg);
            const viewBox = svg.getAttribute('viewBox');

            const isX = viewBox === '-0 -960 960 960' || viewBox === '0 -960 960 960';
            const isAdClose = style.position === 'absolute' && style.cursor === 'pointer' && style.zIndex === '1000000';

            if (isX && isAdClose) {
                clickX(svg);
            }
        });
    }

    setInterval(findAndClose, 100);

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
