// ==UserScript==
// @name         VietUser Auto Start Task & Google Search
// @namespace    https://vietuser.com/
// @version      2.2
// @description  Tự động bấm Bắt đầu nhiệm vụ -> Tự động copy từ khóa -> Tự mở tab Google Tìm Kiếm.
// @author       Antigravity
// @match        https://vietuser.com/r/*
// @grant        GM_openInTab
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // 1. Tự động kiểm tra và bấm nút "Bắt đầu nhiệm vụ"
    function checkAndStartTask() {
        const startBtn = document.querySelector('#continue-link');
        
        // Nếu tìm thấy nút và nút đang không bị ẩn/vô hiệu hóa
        if (startBtn && startBtn.offsetWidth > 0 && !startBtn.disabled) {
            console.log('[Auto-Task] Tìm thấy nút Bắt đầu nhiệm vụ. Đang kích hoạt...');
            
            // Cuộn mượt tới nút
            startBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Đợi 1 giây rồi bấm
            setTimeout(() => {
                startBtn.click();
            }, 1000);
            return true;
        }
        return false;
    }

    // 2. Tự động lấy từ khóa và mở tab Google Tìm Kiếm
    let isSearchOpened = false;
    function checkAndSearchGoogle() {
        if (isSearchOpened) return;

        const copyBtn = document.querySelector('.guide-copy');
        const keywordInput = document.querySelector('.guide-keyword');

        // Khi giao diện Bước 1 & Bước 2 xuất hiện (có chứa từ khóa)
        if (keywordInput && keywordInput.value && keywordInput.value.trim().length > 0) {
            isSearchOpened = true;
            const keyword = keywordInput.value.trim();
            console.log('[Auto-Task] Đã tìm thấy từ khóa:', keyword);

            // Tự động bấm nút "Sao chép" trên màn hình (để kích hoạt event nếu web yêu cầu)
            if (copyBtn) {
                copyBtn.click();
            }

            // Tạo link tìm kiếm trực tiếp trên Google
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;

            console.log('[Auto-Task] Đang mở Google tìm kiếm từ khóa ở tab mới...');
            
            // Mở tab Google Tìm Kiếm mới (active: true để tự nhảy sang tab đó)
            GM_openInTab(googleSearchUrl, { active: true, insert: true });
        }
    }

    // Quét giao diện mỗi 800ms
    setInterval(() => {
        // Ưu tiên chạy bước 1 nếu nút bấm xuất hiện
        const started = checkAndStartTask();
        
        // Nếu bước 1 đã xong/không có nút bấm nữa, chuyển sang kiểm tra bước 2 (Google Search)
        if (!started) {
            checkAndSearchGoogle();
        }
    }, 800);

})();
