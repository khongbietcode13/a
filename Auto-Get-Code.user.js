// ==UserScript==
// @name         Auto Get Code & Auto Step 2 (Toggle Alt+Z)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Bật/Tắt tự động Step 2 & Lấy mã bằng phím tắt Alt + Z
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let isEnabled = false; // Mặc định TẮT
    let processing = false;
    let step2Done = false;
    let codeClicked = false;

    // =========================================================
    // HIỂN THỊ THÔNG BÁO (NOTIFICATION)
    // =========================================================
    function showNotification(message, isBgGreen = true) {
        let toast = document.getElementById('auto-script-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'auto-script-toast';
            toast.style.position = 'fixed';
            toast.style.top = '20px';
            toast.style.right = '20px';
            toast.style.padding = '10px 16px';
            toast.style.borderRadius = '8px';
            toast.style.color = '#fff';
            toast.style.fontWeight = 'bold';
            toast.style.fontSize = '14px';
            toast.style.zIndex = '999999';
            toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            toast.style.transition = 'all 0.3s ease';
            toast.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(toast);
        }

        toast.style.backgroundColor = isBgGreen ? '#2e7d32' : '#c62828';
        toast.innerText = message;
        toast.style.display = 'block';
        toast.style.opacity = '1';

        // Tự động ẩn thông báo sau 2.5 giây
        setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.style.display = 'none';
                }, 300);
            }
        }, 2500);
    }

    // =========================================================
    // LẮNG NGHE PHÍM TẮT ALT + Z
    // =========================================================
    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
            isEnabled = !isEnabled;
            
            if (isEnabled) {
                showNotification('⚡ Auto Script: ĐÃ BẬT', true);
                console.log('[Auto] Script được BẬT bằng Alt + Z');
                process(); // Chạy ngay khi vừa bật
            } else {
                showNotification('⛔ Auto Script: ĐÃ TẮT', false);
                console.log('[Auto] Script được TẮT bằng Alt + Z');
            }
        }
    });

    // =========================================================
    // TÌM NÚT LẤY MÃ
    // =========================================================
    function findCodeButton() {
        const buttons = document.querySelectorAll('button');

        for (const btn of buttons) {
            if (!isVisible(btn)) continue;

            const text = normalizeText(btn.innerText);

            if (
                text.includes('LẤY MÃ') ||
                text.includes('LAY MA') ||
                text.includes('LÃY MÃ')
            ) {
                return btn;
            }

            const img = btn.querySelector('img');
            if (img) {
                const src = img.src || '';
                if (
                    src.includes('icon-x64.png') ||
                    src.includes('/icons/icon-x64')
                ) {
                    return btn;
                }
            }
        }

        const spans = document.querySelectorAll('button span');
        for (const span of spans) {
            if (!isVisible(span)) continue;

            const text = normalizeText(span.innerText);
            if (
                text.includes('LẤY MÃ') ||
                text.includes('LAY MA') ||
                text.includes('LÃY MÃ')
            ) {
                const btn = span.closest('button');
                if (btn && isVisible(btn)) {
                    return btn;
                }
            }
        }

        return null;
    }

    // =========================================================
    // CHUẨN HÓA TEXT
    // =========================================================
    function normalizeText(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    // =========================================================
    // KIỂM TRA HIỂN THỊ
    // =========================================================
    function isVisible(el) {
        if (!el || !document.contains(el)) {
            return false;
        }

        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        return (
            r.width > 0 &&
            r.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }

    // =========================================================
    // KIỂM TRA STEP 2
    // =========================================================
    function isStep2() {
        const text = normalizeText(document.body.innerText);

        return (
            text.includes('VUI LÒNG CLICK VÀO LINK BẤT KỲ') ||
            text.includes('CLICK VÀO 1 BÀI VIẾT') ||
            text.includes('CLICK VÀO LINK BẤT KỲ') ||
            text.includes('CLICK VÀO MỘT BÀI VIẾT')
        );
    }

    // =========================================================
    // TÌM BÀI VIẾT
    // =========================================================
    function findArticle() {
        const links = document.querySelectorAll('a[href]');
        const host = location.hostname;

        for (const a of links) {
            if (!isVisible(a)) continue;

            const text = (a.innerText || '').trim();
            const href = a.getAttribute('href');

            if (!href || text.length < 10) continue;
            if (href.startsWith('#') || href.startsWith('javascript:')) continue;

            // Chỉ click link cùng domain
            if (a.hostname && a.hostname !== host) continue;

            const lower = text.toLowerCase();
            if (
                lower.includes('trang chủ') ||
                lower.includes('đăng nhập') ||
                lower.includes('đăng ký') ||
                lower.includes('liên hệ')
            ) {
                continue;
            }

            return a;
        }

        return null;
    }

    // =========================================================
    // STEP 2
    // =========================================================
    function doStep2() {
        if (step2Done || processing) return;

        const article = findArticle();

        if (!article) {
            console.log('[Auto] Chưa tìm thấy bài viết...');
            return;
        }

        processing = true;

        console.log('[Auto] Tìm thấy bài viết:', article.innerText.trim());

        article.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        setTimeout(() => {
            if (!document.contains(article)) {
                processing = false;
                return;
            }

            console.log('[Auto] CLICK BÀI VIẾT');
            realClick(article);

            step2Done = true;
            processing = false;
        }, 1200);
    }

    // =========================================================
    // CLICK NÚT LẤY MÃ
    // =========================================================
    function doGetCode() {
        if (processing) return;

        const btn = findCodeButton();

        if (!btn) {
            console.log('[Auto] Chưa tìm thấy LẤY MÃ...');
            return;
        }

        console.log('[Auto] ĐÃ TÌM THẤY NÚT LẤY MÃ:', btn);
        processing = true;

        btn.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });

        setTimeout(() => {
            if (!document.contains(btn)) {
                processing = false;
                return;
            }

            const r = btn.getBoundingClientRect();

            if (r.top < 0 || r.bottom > window.innerHeight) {
                btn.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'
                });

                setTimeout(() => {
                    clickCodeButton(btn);
                }, 500);
            } else {
                clickCodeButton(btn);
            }
        }, 1000);
    }

    // =========================================================
    // CLICK THỰC TẾ
    // =========================================================
    function clickCodeButton(btn) {
        if (!document.contains(btn)) {
            processing = false;
            return;
        }

        console.log('[Auto] >>> ĐANG CLICK LẤY MÃ <<<');

        try {
            btn.focus();

            btn.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, cancelable: true, view: window, pointerType: 'mouse' }));
            btn.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, cancelable: true, view: window, pointerType: 'mouse' }));
            btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0, buttons: 1 }));
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 }));
            btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0 }));

            btn.click();
            console.log('[Auto] >>> ĐÃ CLICK LẤY MÃ <<<');
        } catch (e) {
            console.error('[Auto] Lỗi khi click:', e);
        }

        setTimeout(() => {
            const stillThere = findCodeButton();

            if (stillThere) {
                console.log('[Auto] Nút LẤY MÃ vẫn còn -> sẽ thử lại');
                processing = false;
            } else {
                console.log('[Auto] Nút LẤY MÃ đã biến mất / trang đã phản ứng');
                codeClicked = true;
                processing = false;
            }
        }, 1500);
    }

    // =========================================================
    // CLICK AN TOÀN
    // =========================================================
    function realClick(el) {
        try { el.focus(); } catch (e) {}
        try {
            el.click();
        } catch (e) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
    }

    // =========================================================
    // MAIN
    // =========================================================
    function process() {
        // Chỉ chạy nếu tính năng đang BẬT
        if (!isEnabled) return;

        if (isStep2()) {
            console.log('[Auto] Đang ở STEP 2');
            doStep2();
            return;
        }

        if (!codeClicked) {
            console.log('[Auto] Không còn Step 2 -> tìm LẤY MÃ');
            doGetCode();
        }
    }

    // Kiểm tra định kỳ
    setInterval(process, 2000);

    // Theo dõi thay đổi DOM
    const observer = new MutationObserver(() => {
        if (isEnabled && !processing) {
            process();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('[Auto] Script v4.1 đã sẵn sàng! Nhấn Alt + Z để Bật/Tắt.');
})();
