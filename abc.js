```javascript
// ==UserScript==
// @name         Auto Scroll and Click Target Button
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Tự động cuộn xuống và click vào nút tương ứng nếu xuất hiện trên trang
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Các selector cần tìm, ưu tiên từ trên xuống dưới
    const selectors = [
        '.trade-btn-clf-container',
        '.trade-btn-clf',
        '.trade-d-btn-container',
        '.trade-d-btn',
        '#trade-btn-clf__content',
        '#trade-d-btn__content'
    ];

    let clicked = false;

    function findTarget() {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);

                if (element) {
                    return element;
                }
            } catch (error) {
                console.error(
                    '[Tampermonkey] Selector lỗi:',
                    selector,
                    error
                );
            }
        }

        return null;
    }

    function clickTarget(element) {
        if (!element || clicked) {
            return;
        }

        clicked = true;

        console.log(
            '[Tampermonkey] Đã tìm thấy:',
            element
        );

        // Cuộn tới nút
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // Chờ cuộn xong rồi click
        setTimeout(() => {
            // Click thông thường
            element.click();

            // Click mô phỏng
            element.dispatchEvent(
                new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                })
            );

            console.log(
                '[Tampermonkey] Đã click nút!'
            );
        }, 800);
    }

    function findAndClick() {
        if (clicked) {
            return true;
        }

        const target = findTarget();

        if (target) {
            clickTarget(target);
            return true;
        }

        return false;
    }

    // Kiểm tra ngay lập tức
    findAndClick();

    // Kiểm tra mỗi 500ms
    const interval = setInterval(() => {
        if (findAndClick()) {
            clearInterval(interval);
        }
    }, 500);

    // Dừng sau 20 giây nếu không tìm thấy
    setTimeout(() => {
        clearInterval(interval);

        if (!clicked) {
            console.log(
                '[Tampermonkey] Không tìm thấy nút sau 20 giây.'
            );
        }
    }, 20000);

})();
```
