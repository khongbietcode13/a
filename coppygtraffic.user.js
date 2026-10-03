// ==UserScript==
// @name         Gtraffic Click to Copy + Native Link Open
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Mở tab mới chuẩn trình duyệt
// @author       You
// @match        https://direct.gtraffic.io/*
// @match        https://gtraffic.io/*
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/coppygtraffic.user.js
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/coppygtraffic.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function () {
    'use strict';

    // ==============================
    // 1. CSS BÔI ĐEN + HOVER
    // ==============================
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }

        .gt-clickable-box {
            cursor: pointer !important;
            transition: background-color 0.2s, border-color 0.2s !important;
        }

        .gt-clickable-box:hover {
            background-color: #f0fdf4 !important;
            border-color: #22c55e !important;
        }

        .gt-copied-anim {
            background-color: #dcfce7 !important;
            outline: 2px solid #16a34a !important;
        }

        /* Đảm bảo thẻ a giả lập không làm hỏng giao diện */
        .gt-native-link {
            color: inherit !important;
            text-decoration: none !important;
            display: inline-block !important;
            width: 100% !important;
        }
    `;
    document.head.appendChild(style);

    // ==============================
    // 2. XÓA CLASS CHẶN BÔI ĐEN
    // ==============================
    function removeUnselectable() {
        document.querySelectorAll('.unselectable').forEach(el => {
            el.classList.remove('unselectable');
        });
    }

    // ==============================
    // 3. XỬ LÝ CLICK & COPY & CHUYỂN HUỚNG
    // ==============================
    function handleBoxClick(box, e) {
        // Nếu người dùng đang quét/bôi đen chữ thì giữ nguyên không nhảy tab
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            return;
        }

        const text = (box.innerText || box.textContent || '').trim();
        if (!text) return;

        // Copy văn bản
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }

        // Hiệu ứng nhấp nháy
        box.classList.add('gt-copied-anim');
        setTimeout(() => box.classList.remove('gt-copied-anim'), 400);

        // Chuẩn hóa URL
        let finalUrl = text;
        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        // Tạo thẻ <a> giả lập sự kiện Click gốc của trình duyệt
        const hiddenLink = document.createElement('a');
        hiddenLink.href = finalUrl;
        hiddenLink.target = '_blank';
        hiddenLink.rel = 'noopener noreferrer';
        
        document.body.appendChild(hiddenLink);
        
        // Kích hoạt click chuẩn trình duyệt (Browser Native Click Event)
        hiddenLink.click();
        
        hiddenLink.remove();
    }

    // ==============================
    // 4. GẮN SỰ KIỆN CHO CÁC Ô
    // ==============================
    function setupBoxes() {
        removeUnselectable();

        const boxes = document.querySelectorAll(`
            div.bg-slate-50.border.border-slate-300.flex.items-center.justify-between,
            div.bg-slate-50.border.border-slate-300.border-l-4.flex.items-center.justify-between
        `);

        boxes.forEach(box => {
            if (box.dataset.gtClickAdded === 'true') return;

            box.dataset.gtClickAdded = 'true';
            box.classList.add('gt-clickable-box');

            box.addEventListener('click', function (e) {
                handleBoxClick(box, e);
            });
        });
    }

    // ==============================
    // 5. THEO DÕI DOM DỘNG
    // ==============================
    setupBoxes();

    const observer = new MutationObserver(() => {
        setupBoxes();
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
