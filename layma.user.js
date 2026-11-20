// ==UserScript==
// @name         Layma.net - Cua so chay script phu
// @namespace    http://tampermonkey.net/
// @version      3.2
// @match        *://*.layma.net/*
// @match        *://layma.net/*
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/layma.user.js
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/layma.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Nếu đang ở bên trong khung phụ (?run_script=1) thì dừng lại, không tạo thêm cửa sổ lồng nhau
    if (window.top !== window.self || window.location.search.includes('run_script=1')) return;

    // Gắn tham số ?run_script=1 vào URL để Tampermonkey nhận diện riêng biệt cho khung phụ
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('run_script', '1');
    const subFrameUrl = urlObj.toString();

    // 1. Tạo khung cửa sổ nổi nhỏ gọn hơn ở góc dưới bên phải (310x320)
    const widget = document.createElement('div');
    widget.id = 'layma-script-mini-window';
    widget.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 310px;
        height: 320px;
        background: #ffffff;
        border: 2px solid #2563eb;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
    `;

    // 2. Thanh tiêu đề kéo thả & thu gọn
    const header = document.createElement('div');
    header.style.cssText = `
        background: #2563eb;
        color: #ffffff;
        padding: 6px 10px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
    `;
    header.innerHTML = `
        <span>Cửa sổ Script phụ</span>
        <div style="display:flex; gap:5px;">
            <button id="reload-sub-ui" title="Tải lại khung này" style="background:#1d4ed8; color:#fff; border:none; border-radius:4px; padding:2px 7px; cursor:pointer; font-size:11px;">↻</button>
            <button id="toggle-sub-ui" style="background:#ef4444; color:#fff; border:none; border-radius:4px; padding:2px 7px; cursor:pointer; font-size:11px;">Thu gọn</button>
        </div>
    `;

    // 3. Khung iframe tải đường dẫn có gắn ?run_script=1
    const iframe = document.createElement('iframe');
    iframe.src = subFrameUrl;
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        flex-grow: 1;
        background: #fff;
    `;

    widget.appendChild(header);
    widget.appendChild(iframe);
    document.body.appendChild(widget);

    // 4. Nút tải lại
    document.getElementById('reload-sub-ui').onclick = () => {
        iframe.src = subFrameUrl;
    };

    // 5. Nút Thu gọn / Mở rộng
    const toggleBtn = document.getElementById('toggle-sub-ui');
    let isMinimized = false;
    toggleBtn.onclick = () => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            iframe.style.display = 'none';
            widget.style.height = '32px';
            widget.style.width = '195px';
            widget.style.resize = 'none';
            toggleBtn.innerText = 'Mở rộng';
            toggleBtn.style.background = '#10b981';
        } else {
            iframe.style.display = 'block';
            widget.style.height = '320px';
            widget.style.width = '310px';
            widget.style.resize = 'both';
            toggleBtn.innerText = 'Thu gọn';
            toggleBtn.style.background = '#ef4444';
        }
    };

    // 6. Kéo thả cửa sổ
    let isDragging = false, offsetX, offsetY;
    header.onmousedown = (e) => {
        if (e.target === toggleBtn || e.target.id === 'reload-sub-ui') return;
        isDragging = true;
        offsetX = e.clientX - widget.getBoundingClientRect().left;
        offsetY = e.clientY - widget.getBoundingClientRect().top;
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        widget.style.left = (e.clientX - offsetX) + 'px';
        widget.style.top = (e.clientY - offsetY) + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
    };
    document.onmouseup = () => { isDragging = false; };
})();
