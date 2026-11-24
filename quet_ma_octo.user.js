
// ==UserScript==
// @name         LinkHuongDan - Green OCR Scanner
// @namespace    linkhuongdan-image-scanner
// @version      2.4.0
// @description  Tu dong nhan dien anh bai viet va OCR URL
// @match        *://linkhuongdan.online/*
// @match        *://*.linkhuongdan.online/*
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/quet_ma_octo.user.js
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/quet_ma_octo.user.js
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @grant        GM_xmlhttpRequest
// @connect      linkhuongdan.online
// @connect      *.linkhuongdan.online
// ==/UserScript==

(function () {
    'use strict';

    if (window.__LHD_IMAGE_SCANNER__) return;
    window.__LHD_IMAGE_SCANNER__ = true;

    let worker = null;
    let foundLinks = new Set();
    let busy = false;

    // ==============================
    // GIAO DIEN
    // ==============================

    const style = document.createElement('style');

    style.textContent = `
        #lhd-scanner {
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 2147483647;
            font-family: Consolas, monospace;
            color: #39ff14;
            user-select: none;
        }

        #lhd-panel {
            display: block;
            width: 280px;
            max-height: 430px;
            overflow-y: auto;
            padding: 12px;
            border: 1px solid #39ff14;
            border-radius: 8px;
            background: #050805;
            color: #39ff14;
            box-shadow: 0 0 12px #39ff1460;
            font-size: 13px;
        }

        #lhd-header {
            display: flex;
            justify-content: space-between;
            padding: 4px 2px 10px;
            margin-bottom: 8px;
            border-bottom: 1px solid #267c20;
            cursor: move;
            font-weight: bold;
            letter-spacing: 1px;
        }

        #lhd-status {
            margin: 8px 0 10px;
            color: #39ff14;
            overflow-wrap: anywhere;
        }

        .lhd-item {
            background: #0b160b;
            border: 1px solid #1c5718;
            padding: 10px;
            margin-top: 7px;
            border-radius: 5px;
            overflow-wrap: anywhere;
        }

        .lhd-link {
            display: block;
            color: #39ff14;
            font-size: 13px;
            text-decoration: none;
            cursor: pointer;
            font-weight: bold;
        }

        .lhd-link:hover {
            color: #b0ff9b;
            text-decoration: underline;
            text-shadow: 0 0 6px #39ff14;
        }

        .lhd-hint {
            display: block;
            color: #7abf70;
            font-size: 10px;
            margin-top: 6px;
        }

        .lhd-btn {
            width: 100%;
            background: #102810;
            color: #39ff14;
            border: 1px solid #39ff14;
            padding: 8px 11px;
            border-radius: 5px;
            cursor: pointer;
            font-family: Consolas, monospace;
            font-weight: bold;
        }

        .lhd-btn:hover {
            background: #1b4817;
            box-shadow: 0 0 8px #39ff1460;
        }

        #lhd-panel::-webkit-scrollbar {
            width: 5px;
        }

        #lhd-panel::-webkit-scrollbar-track {
            background: #050805;
        }

        #lhd-panel::-webkit-scrollbar-thumb {
            background: #267c20;
            border-radius: 5px;
        }
    `;

    document.head.appendChild(style);

    const box = document.createElement('div');
    box.id = 'lhd-scanner';

    box.innerHTML = `
        <div id="lhd-panel">

            <div id="lhd-header">
                <span>◈ LINK SCANNER</span>
                <span>● LIVE</span>
            </div>

            <div id="lhd-status">
                > INITIALIZING...
            </div>

            <div id="lhd-results"></div>

            <div style="margin-top:12px">
                <button class="lhd-btn" id="lhd-rescan">
                    ↻ QUÉT LẠI
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(box);

    const status = document.getElementById('lhd-status');
    const results = document.getElementById('lhd-results');
    const header = document.getElementById('lhd-header');

    // ==============================
    // KE0 THA GIAO DIEN
    // ==============================

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;

        dragging = true;

        const rect = box.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        box.style.right = 'auto';
        box.style.left = rect.left + 'px';
        box.style.top = rect.top + 'px';

        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!dragging) return;

        const maxX = window.innerWidth - box.offsetWidth;
        const maxY = window.innerHeight - box.offsetHeight;

        box.style.left = Math.max(
            0,
            Math.min(e.clientX - offsetX, maxX)
        ) + 'px';

        box.style.top = Math.max(
            0,
            Math.min(e.clientY - offsetY, maxY)
        ) + 'px';
    });

    document.addEventListener('mouseup', function () {
        dragging = false;
    });

    // ==============================
    // TU DONG TIM ANH WORDPRESS
    // ==============================

    function findTargetImages() {

        const selectors = [
            '.entry-content img[class*="wp-image-"]',
            'article img[class*="wp-image-"]',
            '.post-content img[class*="wp-image-"]'
        ];

        let images = [];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(img => {
                if (!images.includes(img)) {
                    images.push(img);
                }
            });
        });

        // Loai bo anh qua nho
        images = images.filter(img => {
            const width = img.naturalWidth ||
                Number(img.getAttribute('width')) || 0;

            const height = img.naturalHeight ||
                Number(img.getAttribute('height')) || 0;

            if (width && width < 250) return false;
            if (height && height < 250) return false;

            return true;
        });

        return images;
    }

    // ==============================
    // LAY DUONG DAN ANH
    // ==============================

    function getImageURL(img) {

        return img.currentSrc ||
            img.dataset.src ||
            img.dataset.lazySrc ||
            img.getAttribute('data-original') ||
            img.getAttribute('src') ||
            '';
    }

    // ==============================
    // TAI ANH
    // ==============================

    function loadImage(url) {

        return new Promise((resolve, reject) => {

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                timeout: 30000,

                onload(response) {
                    if (response.status === 200) {
                        resolve(response.response);
                    } else {
                        reject(new Error(
                            'HTTP ' + response.status
                        ));
                    }
                },

                onerror: reject,
                ontimeout: reject
            });

        });
    }

    // ==============================
    // NHAN DIEN URL BANG OCR
    // ==============================

    function extractURLs(text) {

        const regex =
            /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?/gi;

        return (text.match(regex) || []).map(value =>
            value.replace(/[.,;!?)}\]]+$/g, '')
        );
    }

    function normalizeURL(value) {

        try {

            let url = value.trim();

            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const parsed = new URL(url);

            if (!parsed.hostname.includes('.')) return null;

            if (parsed.hostname === location.hostname) {
                return null;
            }

            return parsed.href;

        } catch {
            return null;
        }
    }

    // ==============================
    // MO GOOGLE SEARCH TAB MOI
    // ==============================

    function searchLink(url) {

        const searchURL =
            'https://www.google.com/search?q=' +
            encodeURIComponent(url);

        window.open(
            searchURL,
            '_blank',
            'noopener,noreferrer'
        );
    }

    // ==============================
    // HIEN THI KET QUA
    // ==============================

    function render() {

        results.innerHTML = '';

        foundLinks.forEach(url => {

            const item = document.createElement('div');
            item.className = 'lhd-item';

            const link = document.createElement('a');

            link.className = 'lhd-link';
            link.textContent = '↗ ' + url;
            link.href = '#';
            link.title = 'Tìm kiếm trên Google';

            link.onclick = function (e) {
                e.preventDefault();
                searchLink(url);
            };

            const hint = document.createElement('small');

            hint.className = 'lhd-hint';
            hint.textContent = '[ CLICK TO SEARCH GOOGLE ]';

            item.append(link, hint);
            results.appendChild(item);
        });

        status.textContent =
            '> FOUND: ' + foundLinks.size + ' LINK(S)';
    }

    // ==============================
    // CHO ANH TAI XONG
    // ==============================

    function waitForImage(img) {

        return new Promise(resolve => {

            if (img.complete && img.naturalWidth > 0) {
                resolve(true);
                return;
            }

            const timer = setTimeout(() => {
                resolve(false);
            }, 10000);

            img.addEventListener('load', () => {
                clearTimeout(timer);
                resolve(true);
            }, { once: true });

            img.addEventListener('error', () => {
                clearTimeout(timer);
                resolve(false);
            }, { once: true });

        });
    }

    // ==============================
    // QUET TAT CA ANH PHU HOP
    // ==============================

    async function scanTargetImages() {

        if (busy) return;

        busy = true;

        foundLinks.clear();
        results.innerHTML = '';

        try {

            status.textContent = '> FINDING ARTICLE IMAGES...';

            const images = findTargetImages();

            if (!images.length) {

                status.textContent =
                    '> NO WORDPRESS ARTICLE IMAGES FOUND';

                return;
            }

            status.textContent =
                '> FOUND ' + images.length + ' IMAGE(S)';

            if (!worker) {

                status.textContent = '> LOADING OCR ENGINE...';

                worker = await Tesseract.createWorker('eng');
            }

            let scanned = 0;

            for (const img of images) {

                scanned++;

                status.textContent =
                    '> SCANNING IMAGE ' +
                    scanned + '/' + images.length;

                await waitForImage(img);

                const imageURL = getImageURL(img);

                if (!imageURL) continue;

                try {

                    const blob = await loadImage(imageURL);

                    const result = await worker.recognize(blob);

                    const text = result.data.text || '';

                    extractURLs(text).forEach(value => {

                        const url = normalizeURL(value);

                        if (url) {
                            foundLinks.add(url);
                        }

                    });

                    // Cap nhat ket qua ngay sau moi anh
                    render();

                } catch (error) {

                    console.warn(
                        '[LHD] Cannot scan image:',
                        imageURL,
                        error
                    );

                }
            }

            render();

            if (!foundLinks.size) {

                status.textContent =
                    '> SCAN COMPLETED - NO URL FOUND';

            } else {

                status.textContent =
                    '> SCAN COMPLETED - FOUND ' +
                    foundLinks.size + ' URL(S)';
            }

        } catch (error) {

            console.error('[LHD Scanner]', error);

            status.textContent =
                '> ERROR: ' + error.message;

        } finally {

            busy = false;
        }
    }

    // ==============================
    // NUT QUET LAI
    // ==============================

    document.getElementById('lhd-rescan').onclick =
        scanTargetImages;

    // ==============================
    // KHOI DONG
    // ==============================

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            scanTargetImages,
            { once: true }
        );

    } else {

        scanTargetImages();

    }

})();
