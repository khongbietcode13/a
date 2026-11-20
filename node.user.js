// ==UserScript==
// @name         Traffic Task Bridge Client
// @namespace    http://tampermonkey.net/
// @version      9.2.1
// @description  Bridge gửi link về Node.js
// @author       You
// @match        https://app.trafficviet.vn/s/*
// @match        https://system.traffichub.vn/s/*
// @connect      localhost
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    const PROFILE_ID = "23";
    const NODE_SERVER = "http://127.0.0.1:3000";
    const currentUrl = window.location.href;

    // 1. Tạo ô giao diện ghim ở góc TRÁI bên TRÊN
    const overlay = document.createElement('div');
    overlay.style.cssText = [
        'position: fixed',
        'top: 15px',
        'left: 15px',
        'z-index: 9999999',
        'padding: 10px 16px',
        'background: rgba(15, 23, 42, 0.95)',
        'color: #ffffff',
        'border-radius: 8px',
        'font-family: Arial, sans-serif',
        'font-size: 13px',
        'font-weight: bold',
        'border: 2px solid #38bdf8',
        'box-shadow: 0 4px 12px rgba(0,0,0,0.3)',
        'transition: all 0.3s ease'
    ].join(';');
    overlay.innerHTML = `⏳ P-${PROFILE_ID}: Đang gửi hàng đợi...`;
    document.body.appendChild(overlay);

    // Hàm đổi giao diện sang màu xanh lá "OK" khi nhận tín hiệu từ Node.js
    function setStatusOK() {
        overlay.style.background = '#16a34a'; // Xanh lá đậm
        overlay.style.borderColor = '#86efac'; // Viền xanh sáng
        overlay.style.fontSize = '15px';
        overlay.innerHTML = `✅ P-${PROFILE_ID}: OK`;
    }

    // 2. Đăng ký task và bắt đầu lắng nghe tín hiệu
    if (currentUrl.includes('/s/') && !currentUrl.includes('meganote')) {
        GM_xmlhttpRequest({
            method: "POST",
            url: `${NODE_SERVER}/api/register-task`,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                profileId: PROFILE_ID,
                targetUrl: currentUrl
            }),
            onload: function (res) {
                overlay.innerHTML = `🔄 P-${PROFILE_ID}: Đang quét tuần tự...`;
                startPollingStatus();
            },
            onerror: function (err) {
                overlay.style.background = '#dc2626';
                overlay.style.borderColor = '#fca5a5';
                overlay.innerHTML = `❌ P-${PROFILE_ID}: Lỗi kết nối Server`;
                console.error(`[Profile ${PROFILE_ID}] LỖI GỬI REQUEST:`, err);
            }
        });
    }

    // 3. Hỏi thăm Node.js mỗi 2 giây xem đã quét ra nhiệm vụ chưa
    function startPollingStatus() {
        const pollTimer = setInterval(() => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `${NODE_SERVER}/api/check-status/${PROFILE_ID}`,
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data.status === 'OK') {
                            clearInterval(pollTimer); // Dừng hỏi khi đã xong
                            setStatusOK();
                        }
                    } catch (e) {}
                }
            });
        }, 2000);
    }
})();
