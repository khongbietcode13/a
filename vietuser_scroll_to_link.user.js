// ==UserScript==
// @name         VietUser Auto Copy Code & Auto Scroll To Button
// @namespace    https://vietuser.com/
// @version      2.3
// @description  Tự động cuộn tới nút lấy mã (không click), tự sao chép mã khi có, đóng tab và dán vào vietuser.com.
// @author       Antigravity
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.close
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const isVietUser = window.location.hostname.includes('vietuser.com');

    // ==================================================================
    // KHU VỰC 1: XỬ LÝ TRÊN TRANG VIETUSER.COM (TỰ DÁN & CUỘN XUỐNG CAPTCHA)
    // ==================================================================
    if (isVietUser) {
        setInterval(() => {
            const savedCode = GM_getValue('vu_copied_code', null);
            if (savedCode) {
                const codeInput = document.querySelector('#campaign-code');
                if (codeInput) {
                    // Dán mã vào ô nhập
                    codeInput.value = savedCode;
                    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    codeInput.dispatchEvent(new Event('change', { bubbles: true }));

                    // Xóa mã đã lưu trong bộ nhớ
                    GM_setValue('vu_copied_code', null);

                    // Cuộn mượt xuống dưới cùng trang web
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });

                    // Tự động nhảy con trỏ vào ô nhập Captcha nếu tìm thấy
                    const captchaInput = document.querySelector('input[placeholder*="kết quả"], input[name*="captcha"]');
                    if (captchaInput) {
                        setTimeout(() => captchaInput.focus(), 800);
                    }
                }
            }
        }, 800);
        return;
    }

    // ==================================================================
    // KHU VỰC 2: XỬ LÝ TRÊN TRANG LẤY MÃ
    // ==================================================================

    // Hàm lấy phần tử nút hoặc ô mã trong Shadow DOM hoặc DOM thường
    function getWidgetElements() {
        const customElements = document.querySelectorAll('seotop-campaign-check');
        for (const el of customElements) {
            if (el.shadowRoot) {
                const btn = el.shadowRoot.querySelector('#seotop-action');
                const input = el.shadowRoot.querySelector('.code input, input[aria-label*="Mã xác minh"]');
                return { btn, input, wrapper: el };
            }
        }
        const btn = document.querySelector('#seotop-action');
        const input = document.querySelector('.code input, input[aria-label*="Mã xác minh"]');
        return { btn, input, wrapper: btn };
    }

    // 1. Tính năng TỰ ĐỘNG CUỘN XUỐNG NÚT LẤY MÃ (Chỉ cuộn, không ấn)
    let hasScrolledToButton = false;
    function autoScrollToButton() {
        if (hasScrolledToButton) return;

        const { btn, wrapper } = getWidgetElements();
        const targetElement = wrapper || btn;

        if (targetElement) {
            hasScrolledToButton = true;
            console.log('[Auto-Scroll] Tìm thấy nút lấy mã, đang cuộn xuống...');
            
            // Cuộn mượt đưa nút bấm vào chính giữa màn hình
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 2. Tính năng TỰ ĐỘNG SAO CHÉP MÃ & ĐÓNG TAB (Khi mã xuất hiện)
    let isCodeSaved = false;
    function autoCopyAndClose() {
        if (isCodeSaved) return;

        const { input } = getWidgetElements();
        if (input && input.value && input.value.trim().length > 0) {
            const code = input.value.trim();
            isCodeSaved = true;
            console.log('[Auto-Copy] Đã tìm thấy mã:', code);

            // Lưu mã vào bộ nhớ tạm để gửi cho vietuser.com
            GM_setValue('vu_copied_code', code);

            // Thử đóng tab
            try {
                window.close();
            } catch (e) {
                console.log('Lỗi window.close chuẩn:', e);
            }

            // Phương án dự phòng: Chuyển hướng tab về thẳng vietuser nếu không tắt được tab
            setTimeout(() => {
                window.location.href = 'https://vietuser.com/';
            }, 500);
        }
    }

    // Vòng lặp kiểm tra liên tục mỗi 800ms
    setInterval(() => {
        autoScrollToButton(); // Tự cuộn màn hình xuống nút lấy mã
        autoCopyAndClose();   // Lấy mã khi mã xuất hiện
    }, 800);
})();
