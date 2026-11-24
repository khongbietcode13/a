// ==UserScript==
// @name         Link999 Saver & Auto Close Tab
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Lưu link999.app / link999.win góc trái trên cùng và tự đóng tab linkhuongdan.online khi click
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        window.close
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const currentHost = window.location.hostname;

    // 1. TỰ ĐỘNG LƯU LINK KHI TRUY CẬP link999.app/* HOẶC link999.win/*
    if (/^https?:\/\/(www\.)?link999\.(app|win)\/.+/i.test(currentUrl)) {
        GM_setValue('saved_link999', currentUrl);
        GM_setValue('last_active_time', Date.now());
    }

    // 2. XỬ LÝ TỰ XÓA KHI ĐÓNG TRÌNH DUYỆT (Kiểm tra phiên làm việc)
    // Nếu mở trình duyệt mới hoàn toàn (không có tab nào giữ session), xóa link cũ
    const lastActive = GM_getValue('last_active_time', 0);
    if (Date.now() - lastActive > 1000 * 60 * 60 * 6) { // Reset nếu tắt trình duyệt quá 6 tiếng
        GM_deleteValue('saved_link999');
    }
    setInterval(() => {
        if (GM_getValue('saved_link999', '')) {
            GM_setValue('last_active_time', Date.now());
        }
    }, 5000);

    // 3. LẮNG NGHE LỆNH ĐÓNG TAB CHO linkhuongdan.online
    if (currentHost.includes('linkhuongdan.online')) {
        GM_addValueChangeListener('close_huongdan_trigger', function(name, oldVal, newVal, remote) {
            if (remote && newVal) {
                window.close();
                // Dự phòng nếu trình duyệt chặn window.close()
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 200);
            }
        });
    }

    // 4. TẠO GIAO DIỆN GÓC TRÁI TRÊN CÙNG (NỀN ĐEN CHỮ XANH LÁ)
    // Không hiển thị trong các iframe nhỏ (quảng cáo)
    if (window.top !== window.self) return;

    const box = document.createElement('div');
    box.id = 'tm-link999-box';
    Object.assign(box.style, {
        position: 'fixed',
        top: '6px',
        left: '6px',
        zIndex: '2147483647',
        backgroundColor: '#000000',
        color: '#00ff00',
        border: '1px solid #00ff00',
        borderRadius: '4px',
        padding: '3px 7px',
        fontSize: '11px',
        fontFamily: 'monospace',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.6)',
        maxWidth: '240px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'none',
        userSelect: 'none'
    });

    function updateUI(url) {
        if (url) {
            box.style.display = 'block';
            box.textContent = '🔗 ' + url.replace(/^https?:\/\//, '');
            box.title = 'Click để mở link và đóng tab linkhuongdan.online:\n' + url;
        } else {
            box.style.display = 'none';
        }
    }

    // Hiển thị link đang lưu ngay khi tải trang
    updateUI(GM_getValue('saved_link999', ''));

    // Cập nhật giao diện theo thời gian thực ở tất cả các tab nếu có link mới
    GM_addValueChangeListener('saved_link999', function(name, oldVal, newVal) {
        updateUI(newVal);
    });

    // 5. SỰ KIỆN KHI CLICK VÀO Ô GIAO DIỆN
    box.addEventListener('click', function() {
        const targetUrl = GM_getValue('saved_link999', '');
        if (!targetUrl) return;

        // Phát tín hiệu sang tất cả tab đang mở để đóng linkhuongdan.online
        GM_setValue('close_huongdan_trigger', Date.now());

        // Nếu đang ở chính tab linkhuongdan.online thì chuyển hướng hoặc tự đóng
        if (currentHost.includes('linkhuongdan.online')) {
            window.open(targetUrl, '_blank');
            window.close();
        } else {
            window.open(targetUrl, '_blank');
        }
    });

    document.body.appendChild(box);
})();
