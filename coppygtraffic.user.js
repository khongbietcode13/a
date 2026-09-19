// ==UserScript==
// @name         Enable Text Selection for Gtraffic
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Cho phép bôi đen và copy văn bản trên direct.gtraffic.io
// @author       You
// @match        https://direct.gtraffic.io/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Cho phép bôi đen bằng CSS
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
    `;

    document.head.appendChild(style);

    // Xóa class chặn bôi đen
    function removeUnselectable() {
        document.querySelectorAll('.unselectable').forEach(function (el) {
            el.classList.remove('unselectable');
        });
    }

    // Chạy lần đầu
    removeUnselectable();

    // Theo dõi nội dung được tải động
    const observer = new MutationObserver(function () {
        removeUnselectable();
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

})();
