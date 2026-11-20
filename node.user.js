// ==UserScript==
// @name         Traffic Task Bridge Client
// @namespace    http://tampermonkey.net/
// @version      10.2
// @description  Bridge gửi link về Node.js tuần tự & nhận tín hiệu OK
// @author       You
// @match        https://app.trafficviet.vn/s/*
// @match        https://system.traffichub.vn/s/*
// @updateURL    https://raw.githubusercontent.com/khongbietcode13/a/main/node.user.js
// @downloadURL  https://raw.githubusercontent.com/khongbietcode13/a/main/node.user.js
// @connect      localhost
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const NODE_SERVER = "http://127.0.0.1:3000";
    const currentUrl = window.location.href;

    // Lấy PROFILE_ID đã lưu riêng trên từng trình duyệt (nếu chưa có thì hỏi 1 lần duy nhất)
    let PROFILE_ID = GM_getValue("SAVED_PROFILE_ID", "");
    if (!PROFILE_ID) {
        const inputId = prompt("Nhập số PROFILE_ID cho trình duyệt này (ví dụ: 1, 2, 23...):", "1");
        if (inputId && inputId.trim() !== "") {
            PROFILE_ID = inputId.trim();
            GM_setValue("SAVED_PROFILE_ID", PROFILE_ID);
        } else {
            PROFILE_ID = "UNKNOWN";
        }
    }

    // 1. Tạo ô giao diện ghim ở góc TRÁI bên TRÊN
    const overlay = document.createElement('div');
    overlay.title = "Bấm vào đây để đổi số Profile";
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
        'cursor: pointer',
        'transition: all 0.3s ease'
    ].join(';');
    overlay.innerHTML = `⏳ P-${PROFILE_ID}: Đang gửi hàng đợi...`;
    document.body.appendChild(overlay);

    // Cho phép bấm vào ô góc trái để đổi nhanh PROFILE_ID nếu nhập nhầm
    overlay.addEventListener('click', () => {
        const newId = prompt("Đổi số PROFILE_ID mới cho trình duyệt này:", PROFILE_ID);
        if (newId && newId.trim() !== "") {
            GM_setValue("SAVED_PROFILE_ID", newId.trim());
            location.reload();
        }
    });

    // Hàm đổi giao diện sang màu xanh lá "OK" khi nhận tín hiệu từ Node.js
    function setStatusOK() {
        overlay.style.background = '#16a34a';
        overlay.style.borderColor = '#86efac';
        overlay.style.fontSize = '15px';
        overlay.innerHTML = `✅ P-${PROFILE_ID}: OK`;
    }

    // 2. Đăng ký task và bắt đầu lắng nghe tín hiệu
    if (currentUrl.includes('/s/') && !currentUrl.includes('meganote') && PROFILE_ID !== "UNKNOWN") {
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
                            clearInterval(pollTimer);
                            setStatusOK();
                        }
                    } catch (e) {}
                }
            });
        }, 2000);
    }
})();
