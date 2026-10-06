// ==UserScript==
// @name          gtraffic
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Tự động cuộn xuống và click vào nút tương ứng nếu xuất hiện trên trang
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách các selector cần tìm kiếm (ưu tiên từ trên xuống dưới)
    const selectors = [
        // --- GIỮ NGUYÊN CÁC NÚT CŨ CỦA BẠN (KHÔNG XÓA) ---
        '.trade-btn-clf-container',
        '.trade-btn-clf',
        '.trade-d-btn-container',
        '.trade-d-btn',
        '#trade-btn-clf__content',
        '#trade-d-btn__content',
        '.trade-btn-container',
        '.trade-btn',
        '#avt-btn',
        '#trade-btn_arrow',
        '#trade-btn__content',
        
        // --- THÊM CÁC NÚT MỚI TỪ ẢNH ---
        // Các selector này được tìm thấy từ hình ảnh cấu trúc HTML
        '.gtr2-trade-btn-container', // Container chính của nút trong ảnh
        '.gtr2-trade-btn',           // Lớp cho chính phần tử nút (svg)
        '#gtr2-avt-btn',             // ID cụ thể của nút svg
        '#gtr2-trade-btn_arrow',     // Phần mũi tên bên trong nút
        '#gtr2-trade-btn__content',   // Phần nội dung (chữ) bên trong nút
        '#gtr2-logo-svg-us'         // Selector dự phòng khác cho nút
    ];

    function findAndClickTarget() {
        let targetElement = null;

        // Lặp qua các selector để tìm phần tử xuất hiện trên trang
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                targetElement = el;
                break;
            }
        }

        if (targetElement) {
            console.log('[Tampermonkey] Đã tìm thấy nút:', targetElement);

            // 1. Cuộn smooth đến vị trí của nút
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 2. Chờ một khoảng thời gian ngắn để quá trình cuộn hoàn tất rồi click
            setTimeout(() => {
                targetElement.click();

                // Trường hợp nút là dạng SVG hoặc nằm lót bên dưới, kích hoạt sự kiện click mô phỏng
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                targetElement.dispatchEvent(clickEvent);

                console.log('[Tampermonkey] Đã thực hiện click thành công!');
            }, 800); // 800ms chờ cuộn trang

            return true;
        }
        return false;
    }

    // Lặp lại việc kiểm tra vì một số trang web tải nút bằng AJAX/JavaScript chậm
    let attempts = 0;
    const maxAttempts = 20; // Thử tối đa 20 lần (tương đương 10 giây)
    
    const interval = setInterval(() => {
        attempts++;
        const success = findAndClickTarget();

        if (success || attempts >= maxAttempts) {
            clearInterval(interval);
        }
    }, 500);

})();
