// ==UserScript==
// @name         Auto Get Code & Auto Step 2
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Auto Step 2 + Auto Get Code
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let processing = false;
    let step2Done = false;
    let codeClicked = false;

    // =========================================================
    // TÌM NÚT LẤY MÃ
    // =========================================================
    function findCodeButton() {

        // Cách 1: tìm button chứa icon icon-x64.png
        const buttons = document.querySelectorAll('button');

        for (const btn of buttons) {

            if (!isVisible(btn)) continue;

            // Kiểm tra text
            const text = normalizeText(btn.innerText);

            if (
                text.includes('LẤY MÃ') ||
                text.includes('LAY MA') ||
                text.includes('LÃY MÃ')
            ) {
                return btn;
            }

            // Kiểm tra icon
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

        // Cách 2: tìm span rồi lấy button cha
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

        const text = normalizeText(
            document.body.innerText
        );

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

            if (!href || text.length < 10) {
                continue;
            }

            if (href.startsWith('#')) {
                continue;
            }

            if (href.startsWith('javascript:')) {
                continue;
            }

            // Chỉ click link cùng domain
            if (a.hostname && a.hostname !== host) {
                continue;
            }

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

        if (step2Done || processing) {
            return;
        }

        const article = findArticle();

        if (!article) {
            console.log('[Auto] Chưa tìm thấy bài viết...');
            return;
        }

        processing = true;

        console.log(
            '[Auto] Tìm thấy bài viết:',
            article.innerText.trim()
        );

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

        if (processing) {
            return;
        }

        const btn = findCodeButton();

        if (!btn) {
            console.log('[Auto] Chưa tìm thấy LẤY MÃ...');
            return;
        }

        console.log(
            '[Auto] ĐÃ TÌM THẤY NÚT LẤY MÃ:',
            btn
        );

        processing = true;

        btn.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });

        // Đợi scroll + DOM ổn định
        setTimeout(() => {

            if (!document.contains(btn)) {
                processing = false;
                return;
            }

            const r = btn.getBoundingClientRect();

            console.log(
                '[Auto] Button:',
                'top=', r.top,
                'bottom=', r.bottom,
                'height=', r.height
            );

            // Nếu chưa nằm trong viewport
            if (
                r.top < 0 ||
                r.bottom > window.innerHeight
            ) {

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

            // Focus
            btn.focus();

            // Pointer events
            btn.dispatchEvent(new PointerEvent('pointerover', {
                bubbles: true,
                cancelable: true,
                view: window,
                pointerType: 'mouse'
            }));

            btn.dispatchEvent(new PointerEvent('pointerenter', {
                bubbles: true,
                cancelable: true,
                view: window,
                pointerType: 'mouse'
            }));

            btn.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                view: window,
                pointerType: 'mouse',
                button: 0,
                buttons: 1
            }));

            btn.dispatchEvent(new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
            }));

            btn.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                view: window,
                pointerType: 'mouse',
                button: 0
            }));

            btn.dispatchEvent(new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
            }));

            // Native click
            btn.click();

            console.log('[Auto] >>> ĐÃ CLICK LẤY MÃ <<<');

        } catch (e) {

            console.error(
                '[Auto] Lỗi khi click:',
                e
            );

        }

        // QUAN TRỌNG:
        // Không đặt clicked = true ngay lập tức.
        // Cho phép kiểm tra lại nếu trang không phản ứng.

        setTimeout(() => {

            const stillThere = findCodeButton();

            if (stillThere) {

                console.log(
                    '[Auto] Nút LẤY MÃ vẫn còn -> sẽ thử lại'
                );

                processing = false;

            } else {

                console.log(
                    '[Auto] Nút LẤY MÃ đã biến mất / trang đã phản ứng'
                );

                codeClicked = true;
                processing = false;
            }

        }, 1500);
    }


    // =========================================================
    // CLICK AN TOÀN
    // =========================================================
    function realClick(el) {

        try {
            el.focus();
        } catch (e) {}

        try {
            el.click();
        } catch (e) {

            el.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                })
            );
        }
    }


    // =========================================================
    // MAIN
    // =========================================================
    function process() {

        // Step 2 ưu tiên
        if (isStep2()) {

            console.log('[Auto] Đang ở STEP 2');

            doStep2();

            return;
        }

        // Không còn Step 2 -> Lấy mã
        if (!codeClicked) {

            console.log('[Auto] Không còn Step 2 -> tìm LẤY MÃ');

            doGetCode();
        }
    }


    // Chạy lần đầu
    setTimeout(process, 1500);

    // Kiểm tra định kỳ
    setInterval(process, 2000);


    // =========================================================
    // THEO DÕI DOM
    // =========================================================
    const observer = new MutationObserver(() => {

        if (!processing) {
            process();
        }

    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });


    console.log('[Auto] Script v4.0 đã chạy');

})();
