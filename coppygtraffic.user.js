// ==UserScript==
// @name         Gtraffic Auto Copy + Auto Open
// @namespace    http://tampermonkey.net/
// @version      8.2
// @description  Tự động copy và mở link Gtraffic
// @author       You
// @match        https://direct.gtraffic.io/*
// @match        https://gtraffic.io/*
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/coppygtraffic.user.js
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/coppygtraffic.user.js
// @grant        GM_openInTab
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ==============================
    // CSS
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
    `;

    document.head.appendChild(style);


    // ==============================
    // XÓA UNSELECTABLE
    // ==============================
    function removeUnselectable() {
        document.querySelectorAll('.unselectable').forEach(el => {
            el.classList.remove('unselectable');
        });
    }


    // ==============================
    // KIỂM TRA CÓ PHẢI LINK KHÔNG
    // ==============================
    function isValidLink(text) {

        if (!text) return false;

        text = text.trim();

        // http://
        if (/^https?:\/\/\S+$/i.test(text)) {
            return true;
        }

        // domain kiểu betilive4d.net hoặc devamultishop.co.in
        if (/^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/i.test(text)) {
            return true;
        }

        return false;
    }


    // ==============================
    // CHUẨN HÓA LINK
    // ==============================
    function normalizeUrl(text) {

        text = text.trim();

        if (!/^https?:\/\//i.test(text)) {
            text = 'https://' + text;
        }

        return text;
    }


    // ==============================
    // COPY
    // ==============================
    function copyText(text) {

        if (navigator.clipboard &&
            navigator.clipboard.writeText) {

            navigator.clipboard.writeText(text).catch(() => {});

        } else {

            const textarea = document.createElement('textarea');

            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';

            document.body.appendChild(textarea);

            textarea.select();

            try {
                document.execCommand('copy');
            } catch (e) {}

            textarea.remove();
        }
    }


    // ==============================
    // MỞ TAB BẰNG TAMPERMONKEY
    // ==============================
    function openTab(text) {

        const url = normalizeUrl(text);

        try {

            GM_openInTab(url, {
                active: true,
                insert: true,
                setParent: true
            });

        } catch (error) {

            // Fallback
            const link = document.createElement('a');

            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            document.body.appendChild(link);

            link.click();

            link.remove();
        }
    }


    // ==============================
    // XỬ LÝ LINK
    // ==============================
    function processBox(box) {

        if (!box) return;

        // Đã xử lý
        if (box.dataset.gtProcessed === 'true') {
            return;
        }

        const text = (
            box.innerText ||
            box.textContent ||
            ''
        ).trim();

        // Không phải link
        if (!isValidLink(text)) {
            return;
        }

        // Đánh dấu ngay
        box.dataset.gtProcessed = 'true';

        box.classList.add('gt-clickable-box');


        // ==============================
        // COPY
        // ==============================
        copyText(text);


        // ==============================
        // HIỆU ỨNG
        // ==============================
        box.classList.add('gt-copied-anim');

        setTimeout(() => {
            box.classList.remove('gt-copied-anim');
        }, 500);


        // ==============================
        // TỰ MỞ TAB
        // ==============================
        console.log(
            '[Gtraffic Auto Open]',
            text
        );

        openTab(text);
    }


    // ==============================
    // TÌM LINK (ĐÃ CẬP NHẬT THEO DOM MỚI)
    // ==============================
    function scanPage() {

        removeUnselectable();

        // Quét tất cả thẻ span chứa domain và các div giao diện
        const elements = document.querySelectorAll('span.notranslate, span.break-all, div.bg-slate-50');

        elements.forEach(el => {
            const text = (el.innerText || el.textContent || '').trim();

            if (isValidLink(text)) {
                // Nếu tìm thấy ở thẻ span, lấy div cha của nó để gắn hiệu ứng cho đẹp
                const targetBox = el.tagName.toLowerCase() === 'span' ? (el.closest('div') || el) : el;
                processBox(targetBox);
            }
        });
    }


    // ==============================
    // CLICK THỦ CÔNG VẪN HOẠT ĐỘNG
    // ==============================
    document.addEventListener('click', function (e) {

        let box = e.target.closest('.gt-clickable-box');

        if (!box) {
            return;
        }

        const selection = window.getSelection();

        if (selection && selection.toString().length > 0) {
            return;
        }

        const text = (
            box.innerText ||
            box.textContent ||
            ''
        ).trim();

        if (!isValidLink(text)) {
            return;
        }

        copyText(text);
        openTab(text);

    }, true);


    // ==============================
    // CHẠY LẦN ĐẦU
    // ==============================
    scanPage();


    // ==============================
    // THEO DÕI AJAX / DOM
    // ==============================
    let scanTimer = null;

    const observer = new MutationObserver(() => {

        if (scanTimer) {
            clearTimeout(scanTimer);
        }

        scanTimer = setTimeout(() => {
            scanPage();
        }, 100);

    });


    if (document.body) {

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

    }


    // ==============================
    // QUÉT ĐỊNH KỲ
    // ==============================
    setInterval(() => {
        scanPage();
    }, 500);

})();
