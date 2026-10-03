// ==UserScript==
// @name         Gtraffic Auto Copy + Auto Open
// @namespace    http://tampermonkey.net/
// @version      7.0
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

        // domain kiểu betilive4d.net
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
    // TÌM LINK
    // ==============================
    function scanPage() {

        removeUnselectable();


        // --------------------------------
        // Cách 1: selector box cũ
        // --------------------------------
        const boxes = document.querySelectorAll(`
            div.bg-slate-50.border.border-slate-300.flex.items-center.justify-between,
            div.bg-slate-50.border.border-slate-300.border-l-4.flex.items-center.justify-between
        `);

        boxes.forEach(box => {
            processBox(box);
        });


        // --------------------------------
        // Cách 2: tìm mọi div có text là domain
        // --------------------------------
        const allDivs = document.querySelectorAll('div');

        allDivs.forEach(div => {

            // Bỏ qua div có quá nhiều phần tử con
            // để tránh lấy nhầm cả khối hướng dẫn
            if (div.children.length > 2) {
                return;
            }

            const text = (
                div.innerText ||
                div.textContent ||
                ''
            ).trim();

            if (!isValidLink(text)) {
                return;
            }

            processBox(div);
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
    }, 1000);

})();
