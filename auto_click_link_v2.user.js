// ==UserScript==
// @name         Anonlink Auto Click Get Link
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động click nút Get Link / Xin chờ trên anonlink.co
// @author       You
// @match        https://anonlink.co/*
// @match        https://*.anonlink.co/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function autoClick() {
        // Tìm nút dựa trên class đặc trưng xuất hiện trong ảnh
        const btn = document.querySelector('a.get-link, a.btn-success');

        if (btn) {
            // Kiểm tra nếu nút đang khả dụng (không chứa class disabled)
            const isDisabled = btn.classList.contains('disabled') || btn.getAttribute('href') === 'javascript:void(0)';

            if (!isDisabled) {
                console.log('[AutoClick] Đã tìm thấy nút Get Link, đang tự động click...');
                btn.click();
            }
        }
    }

    // Chạy kiểm tra ngay khi nạp trang
    autoClick();

    // Lắng nghe sự thay đổi giao diện (khi đếm ngược xong nút từ disabled chuyển sang enabled)
    const observer = new MutationObserver(() => {
        autoClick();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'href']
    });
})();
