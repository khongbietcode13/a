// ==UserScript==
// @name         Traffic Task Bridge Client
// @namespace    http://tampermonkey.net/
// @version      9.2
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
    const NODE_SERVER = "http://127.0.0.1:3000"; // Đổi localhost thành 127.0.0.1 cho ổn định
    const currentUrl = window.location.href;

    console.log("🚀 Script Bridge đã load trên trang:", currentUrl);

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
                console.log(`[Profile ${PROFILE_ID}] RESP:`, res.responseText);
            },
            onerror: function (err) {
                console.error(`[Profile ${PROFILE_ID}] LỖI GỬI REQUEST:`, err);
            }
        });
    }

    // Giao diện hiển thị
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:10px 14px;background:rgba(15,23,42,0.95);color:#fff;border-radius:8px;font-size:12px;border:1px solid #38bdf8;';
    overlay.innerHTML = `⚡ <b>PROFILE ${PROFILE_ID}</b>: Đã kích hoạt Bridge!`;
    document.body.appendChild(overlay);
})();
