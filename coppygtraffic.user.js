// ==UserScript==
// @name         Gtraffic Text Selection + Fixed Copy
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Cho phép bôi đen và thêm nút Copy cố định bên cạnh ô chữ
// @author       You
// @match        https://direct.gtraffic.io/*
// @match        https://gtraffic.io/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ==============================
    // CHO PHÉP BÔI ĐEN
    // ==============================

    const style = document.createElement('style');

    style.textContent = `
        *,
        *::before,
        *::after {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }

        .gt-copy-container {
            position: relative !important;
        }

        .gt-copy-btn {
            position: absolute !important;
            left: calc(100% + 8px) !important;
            top: 50% !important;
            transform: translateY(-50%) !important;

            z-index: 999999 !important;

            padding: 4px 9px !important;

            border: 1px solid #cccccc !important;
            border-radius: 4px !important;

            background: white !important;
            color: #333 !important;

            font-size: 11px !important;
            font-family: Arial, sans-serif !important;

            cursor: pointer !important;

            white-space: nowrap !important;

            box-shadow: 0 1px 4px rgba(0,0,0,0.20) !important;
        }

        .gt-copy-btn:hover {
            background: #eeeeee !important;
        }

        .gt-copy-btn.copied {
            background: #e4f7e4 !important;
            color: green !important;
        }
    `;

    document.head.appendChild(style);


    // ==============================
    // XÓA CLASS CHẶN BÔI ĐEN
    // ==============================

    function removeUnselectable() {

        document.querySelectorAll('.unselectable').forEach(function (el) {
            el.classList.remove('unselectable');
        });

    }


    // ==============================
    // COPY TEXT
    // ==============================

    function copyText(text, button) {

        if (!text) return;

        navigator.clipboard.writeText(text)
            .then(function () {

                button.textContent = '✓ Copied';
                button.classList.add('copied');

                setTimeout(function () {
                    button.textContent = '📋 Copy';
                    button.classList.remove('copied');
                }, 1000);

            })
            .catch(function () {

                const textarea = document.createElement('textarea');

                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';

                document.body.appendChild(textarea);

                textarea.focus();
                textarea.select();

                document.execCommand('copy');

                textarea.remove();

                button.textContent = '✓ Copied';
                button.classList.add('copied');

                setTimeout(function () {
                    button.textContent = '📋 Copy';
                    button.classList.remove('copied');
                }, 1000);

            });

    }


    // ==============================
    // LẤY TEXT CỦA Ô
    // ==============================

    function getBoxText(box) {

        // Tạo bản clone để không lấy chữ của nút Copy
        const clone = box.cloneNode(true);

        const button = clone.querySelector('.gt-copy-btn');

        if (button) {
            button.remove();
        }

        return (clone.innerText || clone.textContent || '').trim();
    }


    // ==============================
    // THÊM NÚT COPY
    // ==============================

    function addCopyButtons() {

        removeUnselectable();

        // Bắt cả 2 kiểu giao diện
        const boxes = document.querySelectorAll(`
            div.bg-slate-50.border.border-slate-300.flex.items-center.justify-between,
            div.bg-slate-50.border.border-slate-300.border-l-4.flex.items-center.justify-between
        `);


        boxes.forEach(function (box) {

            // Đã có nút thì không thêm lại
            if (box.querySelector('.gt-copy-btn')) {
                return;
            }


            // Chỉ xử lý các ô có text
            const text = getBoxText(box);

            if (!text) {
                return;
            }


            // Đặt container làm mốc cho nút
            box.classList.add('gt-copy-container');


            // ==========================
            // TẠO NÚT
            // ==========================

            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'gt-copy-btn';
            button.textContent = '📋 Copy';


            // ==========================
            // CLICK COPY
            // ==========================

            button.addEventListener('click', function (e) {

                e.preventDefault();
                e.stopPropagation();

                const textToCopy = getBoxText(box);

                copyText(textToCopy, button);

            });


            box.appendChild(button);

        });

    }


    // ==============================
    // CHẠY LẦN ĐẦU
    // ==============================

    addCopyButtons();


    // ==============================
    // THEO DÕI TRANG LOAD ĐỘNG
    // ==============================

    const observer = new MutationObserver(function () {

        addCopyButtons();

    });


    if (document.body) {

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

    }

})();
