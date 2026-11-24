// ==UserScript==
// @name         Auto Step & Shadow DOM Clicker (TrafficVip / Octo)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động xử lý các bước Lấy mã Step, Click bài viết ngẫu nhiên và ưu tiên Bấm vào đây để tiếp tục trong Shadow DOM
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Không chạy trong các iframe quảng cáo nhỏ
    if (window.top !== window.self) return;

    let isActionLocked = false;

    // Hàm duyệt xuyên qua toàn bộ Shadow DOM để tìm phần tử
    function queryAllDeep(selector, root = document) {
        let results = Array.from(root.querySelectorAll(selector));
        const allElements = root.querySelectorAll('*');
        for (const el of allElements) {
            if (el.shadowRoot) {
                results = results.concat(queryAllDeep(selector, el.shadowRoot));
            }
        }
        return results;
    }

    // Hàm giả lập click thật (Pointer + Mouse + Click) để vượt qua check bot
    function simulateRealClick(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const opts = {
            bubbles: true,
            cancelable: true,
            composed: true, // Quan trọng để xuyên qua Shadow DOM
            view: window,
            clientX: clientX,
            clientY: clientY,
            button: 0
        };

        try {
            el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            el.dispatchEvent(new PointerEvent('pointerup', { ...opts, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.dispatchEvent(new MouseEvent('click', opts));
            el.click();
        } catch (e) {
            el.click();
        }
    }

    // Hàm tìm một link bài viết ngẫu nhiên hợp lệ trên trang
    function getRandomArticleLink() {
        const currentOrigin = window.location.origin;
        const currentPath = window.location.pathname;
        const links = Array.from(document.querySelectorAll('a[href]'));

        const validLinks = links.filter(a => {
            // Bỏ qua link ẩn hoặc quá nhỏ
            const rect = a.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;

            const href = a.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return false;
            }

            try {
                const urlObj = new URL(a.href);
                // Chỉ lấy link cùng tên miền và khác trang hiện tại
                if (urlObj.origin !== currentOrigin) return false;
                if (urlObj.pathname === '/' || urlObj.pathname === currentPath) return false;

                // Loại trừ các trang hệ thống, chính sách, danh mục chung
                const lowerPath = urlObj.pathname.toLowerCase();
                const blacklist = ['/category/', '/tag/', '/author/', '/page/', 'lien-he', 'gioi-thieu', 'chinh-sach', 'dieu-khoan', 'dang-nhap', 'dang-ky', 'wp-admin', 'wp-login'];
                if (blacklist.some(word => lowerPath.includes(word))) return false;

                // Ưu tiên link có độ dài đường dẫn giống bài viết
                return urlObj.pathname.length > 5;
            } catch (e) {
                return false;
            }
        });

        if (validLinks.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * validLinks.length);
        return validLinks[randomIndex];
    }

    // Vòng lặp kiểm tra trạng thái nút bấm
    function processOctoButtons() {
        // Tìm tất cả span.octo-button-text (kể cả trong Shadow Root)
        const octoTexts = queryAllDeep('span.octo-button-text');
        if (octoTexts.length === 0) return;

        for (const span of octoTexts) {
            const text = span.textContent.trim().toUpperCase();
            // Tìm nút cha có thể click được (.octo-capsule-container)
            const clickableBtn = span.closest('.octo-capsule-container') || span.parentElement || span;

            // Kiểm tra nút có đang hiển thị trên màn hình không
            const style = getComputedStyle(clickableBtn);
            if (style.display === 'none' || style.visibility === 'hidden' || clickableBtn.offsetParent === null) {
                continue;
            }

            // ============================================================
            // ƯU TIÊN 1 (CAO NHẤT): "BẤM VÀO ĐÂY ĐỂ TIẾP TỤC" -> BẤM LUÔN
            // ============================================================
            if (text.includes('BẤM VÀO ĐÂY ĐỂ TIẾP TỤC')) {
                console.log('[AutoStep] Ưu tiên cao nhất: Bấm vào đây để tiếp tục!');
                simulateRealClick(clickableBtn);
                return; // Thoát vòng lặp ngay để ưu tiên lệnh này
            }

            // Nếu đang khóa thao tác (đang cuộn hoặc đang đợi delay click bài viết) thì bỏ qua các bước dưới
            if (isActionLocked) continue;

            // ============================================================
            // ƯU TIÊN 2: "LẤY MÃ STEP 1 / 2 / 3 / 4..." -> CUỘN XUỐNG & ẤN
            // ============================================================
            if (/LẤY MÃ STEP\s*\d+/i.test(text)) {
                isActionLocked = true;
                console.log('[AutoStep] Phát hiện:', text, '-> Đang cuộn xuống và click...');

                // Cuộn xuống cuối trang mượt mà
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });

                // Đợi 800ms cho cuộn xuống xong rồi bấm nút
                setTimeout(() => {
                    simulateRealClick(clickableBtn);
                    // Mở khóa sau 2.5s đề phòng cần bấm lại
                    setTimeout(() => { isActionLocked = false; }, 2500);
                }, 800);
                return;
            }

            // ============================================================
            // ƯU TIÊN 3: "CLICK BÀI VIẾT ĐỂ TIẾP TỤC..." -> RANDOM LINK BÀI VIẾT
            // ============================================================
            if (text.includes('CLICK BÀI VIẾT ĐỂ TIẾP TỤC')) {
                isActionLocked = true;
                console.log('[AutoStep] Phát hiện:', text, '-> Đang tìm bài viết ngẫu nhiên...');

                // Cuộn nhẹ xuống giữa trang để lộ các bài viết
                window.scrollTo({
                    top: document.body.scrollHeight * 0.4,
                    behavior: 'smooth'
                });

                // Delay 1.5 giây rồi click ngẫu nhiên 1 bài viết
                setTimeout(() => {
                    const randomArticle = getRandomArticleLink();
                    if (randomArticle) {
                        console.log('[AutoStep] Click bài viết ngẫu nhiên:', randomArticle.href);
                        randomArticle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            simulateRealClick(randomArticle);
                        }, 300);
                    } else {
                        console.warn('[AutoStep] Không tìm thấy link bài viết phù hợp trên trang.');
                    }
                    setTimeout(() => { isActionLocked = false; }, 4000);
                }, 1500);
                return;
            }
        }
    }

    // Quét liên tục mỗi 400ms để phản ứng tức thì khi nút đổi trạng thái
    setInterval(processOctoButtons, 400);

})();
