// ==UserScript==
// @name         Auto Click Link Gốc - Link999
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động ấn nút Link Gốc trên link999.win / link999.app
// @author       You
// @match        https://link999.win/*
// @match        https://*.link999.win/*
// @match        https://link999.app/*
// @match        https://*.link999.app/*
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/link_goc_link999.user.js
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/link_goc_link999.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let isClicked = false;

    function autoClickLinkGoc() {
        if (isClicked) return;

        // Tìm thẻ a.btn.btn-primary hoặc thẻ a bên trong form#link-view
        const links = document.querySelectorAll('#link-view a.btn.btn-primary, a.btn.btn-primary');

        for (const link of links) {
            const text = link.textContent.trim().toLowerCase();
            const href = link.getAttribute('href') || '';

            // Kiểm tra đúng chữ "Link Gốc" và có đường dẫn hợp lệ
            if (text.includes('link gốc') && href && href !== '#' && !href.startsWith('javascript:')) {
                const style = getComputedStyle(link);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && link.offsetParent !== null;

                if (isVisible) {
                    isClicked = true;
                    console.log('[AutoLinkGoc] Đã tìm thấy Link Gốc:', link.href);

                    setTimeout(() => {
                        link.click();
                        // Dự phòng nếu sự kiện click bị chặn thì chuyển hướng trực tiếp
                        setTimeout(() => {
                            if (window.location.href.includes('link999')) {
                                window.location.href = link.href;
                            }
                        }, 500);
                    }, 150);
                    return;
                }
            }
        }
    }

    // Chạy kiểm tra ngay khi tải trang, lặp lại mỗi 200ms và theo dõi thay đổi DOM
    autoClickLinkGoc();
    setInterval(autoClickLinkGoc, 200);

    const observer = new MutationObserver(autoClickLinkGoc);
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }
})();
