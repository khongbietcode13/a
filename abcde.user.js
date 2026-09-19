// ==UserScript==
// @name         gtraffic
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động cuộn xuống và click vào nút tương ứng nếu xuất hiện trên trang
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách các selector cần tìm kiếm (ưu tiên từ trên xuống dưới)
    const selectors = [
        '.trade-btn-clf-container',
        '.trade-btn-clf',
        '.trade-d-btn-container',
        '.trade-d-btn',
        '#trade-btn-clf__content',
        '#trade-d-btn__content'
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
