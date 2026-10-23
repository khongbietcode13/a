// ==UserScript==
// @name         Gtraffic Auto Copy + Auto Open
// @namespace    http://tampermonkey.net/
// @version      8.4
// @description  Tự động copy và mở link Gtraffic (Bắt link siêu nhạy)
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

        // Kiểm tra định dạng URL hoặc Domain (vd: royalagromart.co.in)
        const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/i;
        return domainRegex.test(text);
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
        if (navigator.clipboard && navigator.clipboard.writeText) {
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
    // XỬ LÝ VÀ MỞ TAB
    // ==============================
    function processBox(box, text) {
        if (!box || box.dataset.gtProcessed === 'true') return;

        // Đánh dấu đã xử lý thành công
        box.dataset.gtProcessed = 'true';
        box.dataset.cleanText = text;
        box.classList.add('gt-clickable-box');

        // Lệnh Copy & Mở tab
        copyText(text);

        box.classList.add('gt-copied-anim');
        setTimeout(() => {
            box.classList.remove('gt-copied-anim');
        }, 500);

        console.log('[Gtraffic Auto Open Success]', text);
        openTab(text);
    }


    // ==============================
    // QUÉT BẮT TEXT DẠNG NÂNG CAO (TREEWALKER)
    // ==============================
    function scanPage() {
        removeUnselectable();

        // Sử dụng TreeWalker để duyệt TẤT CẢ các đoạn văn bản (Text Nodes) trên trang
        const walker = document.createTreeWalker(
            document.body || document.documentElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while ((node = walker.nextNode())) {
            let val = node.nodeValue ? node.nodeValue.trim() : '';

            // Nếu đoạn văn bản chứa dấu chấm (đặc trưng của domain)
            if (val.length > 4 && val.includes('.')) {
                // Tách theo dòng hoặc khoảng trắng đề phòng dính chữ khác
                let words = val.split(/\s+/);

                for (let word of words) {
                    // Xóa các ký tự thừa
                    word = word.replace(/^[^\w\/]+|[^\w\/]+$/g, '');

                    if (isValidLink(word)) {
                        let parentEl = node.parentElement;

                        // Tìm thẻ div/span chứa nó mà chưa được xử lý
                        let targetBox = parentEl.closest('div') || parentEl;

                        if (targetBox && targetBox.dataset.gtProcessed !== 'true') {
                            processBox(targetBox, word);
                            break;
                        }
                    }
                }
            }
        }
    }


    // ==============================
    // CLICK THỦ CÔNG
    // ==============================
    document.addEventListener('click', function (e) {
        let box = e.target.closest('.gt-clickable-box');
        if (!box) return;

        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        const text = box.dataset.cleanText || (box.innerText || box.textContent || '').trim();
        if (!isValidLink(text)) return;

        copyText(text);
        openTab(text);
    }, true);


    // ==============================
    // VÒNG LẶP THEO DÕI DOM
    // ==============================
    scanPage();

    let scanTimer = null;
    const observer = new MutationObserver(() => {
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = setTimeout(scanPage, 100);
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true // Lắng nghe cả khi chữ trong ô thay đổi
        });
    }

    setInterval(scanPage, 500);

})();
