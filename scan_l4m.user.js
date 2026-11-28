// ==UserScript==
// @name         Link4m - Green OCR Scanner (Auto-Scan)
// @namespace    link4m-image-scanner
// @version      1.4.0
// @description  Tu dong quet anh huong dan link4m.net voi bo loc tang net OCR
// @match        *://link4m.net/*
// @match        *://*.link4m.net/*
// @match        *://link4m.org/*
// @match        *://*.link4m.org/*
// @match        *://link4m.co/*
// @match        *://*.link4m.co/*
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @grant        GM_xmlhttpRequest
// @connect      link4m.net
// @connect      *.link4m.net
// @connect      link4m.org
// @connect      *.link4m.org
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;
    if (window.__L4M_IMAGE_SCANNER__) return;
    window.__L4M_IMAGE_SCANNER__ = true;

    let worker = null;
    let foundLinks = new Set();
    let scannedImageURLs = new Set();
    let busy = false;
    let pendingAutoScan = false;
    let autoScanEnabled = localStorage.getItem('l4m_auto_scan') !== 'false';
    let debounceTimer = null;

    // ==============================
    // GIAO DIEN
    // ==============================

    const style = document.createElement('style');
    style.id = 'l4m-scanner-style';
    style.textContent = `
        #l4m-scanner {
            position: fixed !important;
            top: 15px;
            right: 15px;
            z-index: 2147483647 !important;
            font-family: Consolas, monospace;
            color: #39ff14;
            user-select: none;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        #l4m-panel {
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
            text-align: left;
        }

        #l4m-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 2px 10px;
            margin-bottom: 8px;
            border-bottom: 1px solid #267c20;
            cursor: move;
            font-weight: bold;
            letter-spacing: 1px;
        }

        #l4m-auto-toggle {
            background: #102810;
            color: #39ff14;
            border: 1px solid #39ff14;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 11px;
            font-family: Consolas, monospace;
            font-weight: bold;
            cursor: pointer;
        }

        #l4m-auto-toggle.off {
            background: #1a1a1a;
            color: #777;
            border-color: #555;
        }

        #l4m-status {
            margin: 8px 0 10px;
            color: #39ff14;
            overflow-wrap: anywhere;
        }

        .l4m-item {
            background: #0b160b;
            border: 1px solid #1c5718;
            padding: 10px;
            margin-top: 7px;
            border-radius: 5px;
            overflow-wrap: anywhere;
        }

        .l4m-link {
            display: block;
            color: #39ff14;
            font-size: 13px;
            text-decoration: none;
            cursor: pointer;
            font-weight: bold;
        }

        .l4m-link:hover {
            color: #b0ff9b;
            text-decoration: underline;
            text-shadow: 0 0 6px #39ff14;
        }

        .l4m-hint {
            display: block;
            color: #7abf70;
            font-size: 10px;
            margin-top: 6px;
        }

        .l4m-btn {
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

        .l4m-btn:hover {
            background: #1b4817;
            box-shadow: 0 0 8px #39ff1460;
        }

        #l4m-panel::-webkit-scrollbar {
            width: 5px;
        }

        #l4m-panel::-webkit-scrollbar-track {
            background: #050805;
        }

        #l4m-panel::-webkit-scrollbar-thumb {
            background: #267c20;
            border-radius: 5px;
        }
    `;

    const box = document.createElement('div');
    box.id = 'l4m-scanner';
    box.innerHTML = `
        <div id="l4m-panel">
            <div id="l4m-header">
                <span>◈ LINK4M SCANNER</span>
                <button id="l4m-auto-toggle" title="Bật/Tắt tự động quét">
                    ${autoScanEnabled ? '● AUTO: ON' : '○ AUTO: OFF'}
                </button>
            </div>
            <div id="l4m-status">> INITIALIZING...</div>
            <div id="l4m-results"></div>
            <div style="margin-top:12px">
                <button class="l4m-btn" id="l4m-rescan">↻ QUÉT LẠI</button>
            </div>
        </div>
    `;

    function ensureMounted() {
        const root = document.documentElement || document.body;
        if (!root) return;

        if (!document.getElementById('l4m-scanner-style')) {
            (document.head || root).appendChild(style);
        }
        if (!document.getElementById('l4m-scanner')) {
            root.appendChild(box);
        }
    }

    ensureMounted();

    const status = box.querySelector('#l4m-status');
    const results = box.querySelector('#l4m-results');
    const header = box.querySelector('#l4m-header');
    const autoToggleBtn = box.querySelector('#l4m-auto-toggle');

    if (!autoScanEnabled) {
        autoToggleBtn.classList.add('off');
    }

    autoToggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        autoScanEnabled = !autoScanEnabled;
        localStorage.setItem('l4m_auto_scan', String(autoScanEnabled));

        if (autoScanEnabled) {
            autoToggleBtn.textContent = '● AUTO: ON';
            autoToggleBtn.classList.remove('off');
            scheduleAutoScan(200);
        } else {
            autoToggleBtn.textContent = '○ AUTO: OFF';
            autoToggleBtn.classList.add('off');
        }
    });

    // ==============================
    // KEO THA GIAO DIEN
    // ==============================

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', function (e) {
        if (e.button !== 0 || e.target === autoToggleBtn) return;

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

        box.style.left = Math.max(0, Math.min(e.clientX - offsetX, maxX)) + 'px';
        box.style.top = Math.max(0, Math.min(e.clientY - offsetY, maxY)) + 'px';
    });

    document.addEventListener('mouseup', function () {
        dragging = false;
    });

    // ==============================
    // CHI LAY ANH CHUA LINK4M.NET
    // ==============================

    function getImageURL(img) {
        return img.currentSrc ||
            img.dataset.src ||
            img.dataset.lazySrc ||
            img.getAttribute('data-original') ||
            img.getAttribute('src') ||
            '';
    }

    function findTargetImages(onlyUnscanned = false) {
        const allL4mImages = Array.from(
            document.querySelectorAll('img[src*="link4m.net"], img[data-src*="link4m.net"]')
        ).filter(img => {
            const src = getImageURL(img);
            return src && !src.startsWith('data:image') && src.includes('link4m.net');
        });

        let targetImages = allL4mImages.filter(img => {
            const h = img.naturalHeight || img.clientHeight || 0;
            if (h > 240) return false;
            return true;
        });

        if (!targetImages.length && allL4mImages.length > 0) {
            targetImages = [allL4mImages[0]];
        }

        if (onlyUnscanned) {
            targetImages = targetImages.filter(img => !scannedImageURLs.has(getImageURL(img)));
        }

        return targetImages;
    }

    // ==============================
    // TAI ANH & TIEN XU LY TANG NET
    // ==============================

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    Referer: location.href
                },
                responseType: 'blob',
                timeout: 30000,
                onload(response) {
                    if (response.status === 200) {
                        resolve(response.response);
                    } else {
                        reject(new Error('HTTP ' + response.status));
                    }
                },
                onerror: reject,
                ontimeout: reject
            });
        });
    }

    function preprocessForOCR(blob) {
        return new Promise((resolve, reject) => {
            const objURL = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = function () {
                URL.revokeObjectURL(objURL);

                const scale = 3;
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;

                // 1. Cat phan nua tren (noi chua dong URL nho cua ket qua Google) va phong to 3.5x
                const cropH = Math.max(40, Math.floor(h * 0.55));
                const topCanvas = document.createElement('canvas');
                topCanvas.width = Math.floor(w * 3.5);
                topCanvas.height = Math.floor(cropH * 3.5);
                const topCtx = topCanvas.getContext('2d');
                topCtx.fillStyle = '#ffffff';
                topCtx.fillRect(0, 0, topCanvas.width, topCanvas.height);
                topCtx.filter = 'grayscale(100%) contrast(210%) brightness(105%)';
                topCtx.drawImage(
                    img,
                    0, 0, w, cropH,
                    0, 0, topCanvas.width, topCanvas.height
                );

                // 2. Ban phong to 3x toan bo anh
                const fullCanvas = document.createElement('canvas');
                fullCanvas.width = w * scale;
                fullCanvas.height = h * scale;
                const fullCtx = fullCanvas.getContext('2d');
                fullCtx.fillStyle = '#ffffff';
                fullCtx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
                fullCtx.filter = 'grayscale(100%) contrast(180%)';
                fullCtx.drawImage(img, 0, 0, fullCanvas.width, fullCanvas.height);

                resolve([topCanvas, fullCanvas]);
            };

            img.onerror = function (err) {
                URL.revokeObjectURL(objURL);
                reject(err);
            };

            img.src = objURL;
        });
    }

    // ==============================
    // TRICH XUAT & CHUAN HOA URL
    // ==============================

    function extractURLs(text) {
        // Xoa email va noi lai cac dau cham bi tach do khoang trang OCR
        const cleanedText = text
            .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ')
            .replace(/https?:\/\/\s+/gi, 'https://')
            .replace(/([a-z0-9-])\s*\.\s*([a-z]{2,})/gi, '$1.$2');

        const regex =
            /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?/gi;

        return (cleanedText.match(regex) || []).map(value =>
            value.replace(/[.,;!?)}\]]+$/g, '')
        );
    }

    const IGNORED_DOMAINS = new Set([
        'link4m.net',
        'link4m.org',
        'link4m.co',
        'google.com',
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'facebook.com',
        'youtube.com',
        't.me'
    ]);

    function normalizeURL(value) {
        try {
            let url = value.trim();
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
            const parts = host.split('.');

            if (parts.length < 2) return null;
            if (parts[0].length < 2 || parts[parts.length - 1].length < 2) {
                return null;
            }

            if (
                host === location.hostname ||
                IGNORED_DOMAINS.has(host) ||
                host.endsWith('.link4m.net') ||
                host.endsWith('.link4m.org') ||
                host.endsWith('.google.com')
            ) {
                return null;
            }

            return parsed.origin + '/';
        } catch {
            return null;
        }
    }

    function searchLink(url) {
        const searchURL =
            'https://www.google.com/search?q=' + encodeURIComponent(url);
        window.open(searchURL, '_blank', 'noopener,noreferrer');
    }

    function render() {
        results.innerHTML = '';

        foundLinks.forEach(url => {
            const item = document.createElement('div');
            item.className = 'l4m-item';

            const link = document.createElement('a');
            link.className = 'l4m-link';
            link.textContent = '↗ ' + url;
            link.href = '#';
            link.title = 'Tìm kiếm trên Google';

            link.onclick = function (e) {
                e.preventDefault();
                searchLink(url);
            };

            const hint = document.createElement('small');
            hint.className = 'l4m-hint';
            hint.textContent = '[ CLICK TO SEARCH GOOGLE ]';

            item.append(link, hint);
            results.appendChild(item);
        });

        status.textContent = '> FOUND: ' + foundLinks.size + ' LINK(S)';
    }

    function waitForImage(img) {
        return new Promise(resolve => {
            if (img.complete && img.naturalWidth > 0) {
                resolve(true);
                return;
            }

            const timer = setTimeout(() => resolve(false), 10000);

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

    async function scanTargetImages(forceReset = false) {
        ensureMounted();

        if (busy) {
            if (!forceReset) pendingAutoScan = true;
            return;
        }

        busy = true;
        pendingAutoScan = false;

        if (forceReset) {
            foundLinks.clear();
            scannedImageURLs.clear();
            results.innerHTML = '';
        }

        try {
            const images = findTargetImages(!forceReset);

            if (!images.length) {
                if (foundLinks.size === 0) {
                    status.textContent = autoScanEnabled
                        ? '> AUTO-SCAN: WAITING FOR LINK4M IMG...'
                        : '> NO LINK4M IMAGES FOUND';
                }
                return;
            }

            status.textContent = '> FOUND ' + images.length + ' LINK4M IMG(S)';

            if (!worker) {
                status.textContent = '> LOADING OCR ENGINE...';
                worker = await Tesseract.createWorker('eng');
            }

            let scanned = 0;

            for (const img of images) {
                scanned++;
                status.textContent = '> SCANNING IMAGE ' + scanned + '/' + images.length;

                await waitForImage(img);

                const imageURL = getImageURL(img);
                if (!imageURL) continue;

                scannedImageURLs.add(imageURL);

                if (img.naturalHeight && img.naturalHeight > 240 && images.length > 1) {
                    continue;
                }

                try {
                    const blob = await loadImage(imageURL);
                    const canvases = await preprocessForOCR(blob);

                    for (const canvas of canvases) {
                        const result = await worker.recognize(canvas);
                        const text = result.data.text || '';

                        extractURLs(text).forEach(value => {
                            const url = normalizeURL(value);
                            if (url) {
                                foundLinks.add(url);
                            }
                        });

                        if (foundLinks.size > 0) {
                            render();
                            break;
                        }
                    }
                } catch (error) {
                    console.warn('[L4M] Cannot scan image:', imageURL, error);
                }
            }

            render();

            if (!foundLinks.size) {
                status.textContent = autoScanEnabled
                    ? '> NO URL YET - WATCHING DOM...'
                    : '> SCAN COMPLETED - NO URL FOUND';
            } else {
                status.textContent = '> COMPLETED - FOUND ' + foundLinks.size + ' URL(S)';
            }
        } catch (error) {
            console.error('[L4M Scanner]', error);
            status.textContent = '> ERROR: ' + error.message;
        } finally {
            busy = false;
            if (pendingAutoScan && autoScanEnabled) {
                scheduleAutoScan(300);
            }
        }
    }

    // ==============================
    // THEO DOI DOM & GIU GIAO DIEN
    // ==============================

    function scheduleAutoScan(delay = 500) {
        if (!autoScanEnabled) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            scanTargetImages(false);
        }, delay);
    }

    function startAutoWatcher() {
        const target = document.documentElement || document.body;
        if (!target) return;

        const observer = new MutationObserver((mutations) => {
            ensureMounted();
            if (!autoScanEnabled) return;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (node.tagName === 'IMG' || node.querySelector?.('img')) {
                                scheduleAutoScan(400);
                                return;
                            }
                        }
                    }
                } else if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
                    scheduleAutoScan(400);
                    return;
                }
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-lazy-src']
        });

        setInterval(() => {
            ensureMounted();
            if (!autoScanEnabled || busy) return;
            if (findTargetImages(true).length > 0) {
                scanTargetImages(false);
            }
        }, 1500);
    }

    box.querySelector('#l4m-rescan').onclick = function () {
        scanTargetImages(true);
    };

    function init() {
        ensureMounted();
        startAutoWatcher();
        if (autoScanEnabled) {
            scanTargetImages(false);
        } else {
            status.textContent = '> AUTO-SCAN OFF (CLICK QUÉT LẠI)';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
