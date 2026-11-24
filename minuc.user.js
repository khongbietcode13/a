// ==UserScript==
// @name         Auto Mission, Auto Confirm & Limit - Minuc.vn
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Hiển thị lượt còn lại, phím tắt Alt+1..8, tự động bấm Thực Hiện, Xác Nhận và OK khi Thành công trên minuc.vn
// @author       You
// @match        https://minuc.vn/*
// @match        https://*.minuc.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Danh sách phím tắt theo thứ tự Alt + 1 -> Alt + 8
    const TASKS = [
        { key: '1', name: 'Lấy Mã', id: 'limit-layma' },
        { key: '2', name: 'DirectG', id: 'limit-directg' },
        { key: '3', name: 'Link4M', id: 'limit-link4m' },
        { key: '4', name: 'Sitetop1', id: 'limit-sitetop1' },
        { key: '5', name: 'Sitetop2', id: 'limit-sitetop2' },
        { key: '6', name: 'TrafficHub', id: 'limit-traffichub' },
        { key: '7', name: 'TrafficViet', id: 'limit-trafficviet' },
        { key: '8', name: 'Link999W', id: 'limit-link999w' }
    ];

    // ==========================================
    // 1. TỰ ĐỘNG CLICK CÁC NÚT XÁC NHẬN & OK THÀNH CÔNG
    // ==========================================
    let clickedModalGo = false;
    let clickedConfirmMission = false;
    let clickedSuccessOk = false;

    function autoClickConfirmButtons() {
        // A. Nút "Thực Hiện" trong popup Sẵn sàng thực hiện! (#cmm-btn-go)
        const modal = document.getElementById('confirmMissionModal');
        const goBtn = document.getElementById('cmm-btn-go');

        if (modal && modal.classList.contains('show') && goBtn) {
            const style = getComputedStyle(goBtn);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && goBtn.offsetParent !== null;
            if (isVisible && !goBtn.disabled && !clickedModalGo) {
                clickedModalGo = true;
                setTimeout(() => {
                    goBtn.click();
                    setTimeout(() => { clickedModalGo = false; }, 2000);
                }, 150);
            }
        } else {
            clickedModalGo = false;
        }

        // B. Nút "Xác Nhận" ở trang confirm-mission (#confirmMissionBtn)
        const confirmBtn = document.getElementById('confirmMissionBtn');
        if (confirmBtn && !clickedConfirmMission) {
            const style = getComputedStyle(confirmBtn);
            const isReady = !confirmBtn.disabled &&
                            !confirmBtn.hasAttribute('disabled') &&
                            !confirmBtn.classList.contains('disabled') &&
                            style.pointerEvents !== 'none' &&
                            confirmBtn.offsetParent !== null;

            if (isReady) {
                clickedConfirmMission = true;
                setTimeout(() => {
                    confirmBtn.click();
                    setTimeout(() => { clickedConfirmMission = false; }, 3000);
                }, 100);
            }
        }

        // C. Nút "OK" (button.swal2-confirm) khi hiện thông báo "Thành công!"
        const swalPopup = document.querySelector('.swal2-popup');
        const okBtn = document.querySelector('button.swal2-confirm');
        if (swalPopup && okBtn && !clickedSuccessOk) {
            const popupText = swalPopup.textContent || '';
            const style = getComputedStyle(okBtn);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && okBtn.offsetParent !== null;

            if (isVisible && /thành công/i.test(popupText)) {
                clickedSuccessOk = true;
                setTimeout(() => {
                    okBtn.click();
                    setTimeout(() => { clickedSuccessOk = false; }, 2000);
                }, 150);
            }
        } else if (!swalPopup) {
            clickedSuccessOk = false;
        }
    }

    // Quét liên tục mỗi 150ms + theo dõi thay đổi DOM
    setInterval(autoClickConfirmButtons, 150);
    const observer = new MutationObserver(autoClickConfirmButtons);
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }

    // ==========================================
    // 2. TẠO Ô HIỂN THỊ LƯỢT CÒN LẠI (CHỈ HIỆN Ở TRANG NHIỆM VỤ)
    // ==========================================
    function createLimitWidget() {
        if (!document.querySelector('.card.mission')) return;
        if (document.getElementById('minuc-limit-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'minuc-limit-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999999;
            background-color: rgba(220, 38, 38, 0.95);
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            pointer-events: none;
            line-height: 1.5;
            border: 2px solid #ffffff;
        `;

        let rowsHtml = `<div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase;">🔥 Lượt Còn Lại</div>`;
        TASKS.forEach(t => {
            rowsHtml += `<div id="${t.id}">${t.name} (Alt+${t.key}): --</div>`;
        });
        widget.innerHTML = rowsHtml;

        if (document.body) {
            document.body.appendChild(widget);
        }
    }

    function findMissionCard(taskName) {
        const cards = document.querySelectorAll('.card.mission');
        const target = taskName.trim().toLowerCase();

        for (const card of cards) {
            const header = card.querySelector('.card-header');
            if (!header) continue;

            const titleEl = header.querySelector('.fw-bold, h5, h6, span, div');
            const headerText = (titleEl ? titleEl.textContent : header.textContent).trim().toLowerCase();

            if (headerText === target || headerText.startsWith(target + ' ') || headerText.includes(target)) {
                return card;
            }
        }
        return null;
    }

    function getTaskLimit(taskName) {
        const card = findMissionCard(taskName);
        if (!card) return 'Không có';

        const limitEl = card.querySelector('p.text-info.fw-bold');
        if (limitEl) {
            return limitEl.textContent.trim();
        }
        return '--';
    }

    function updateLimitWidget() {
        createLimitWidget();
        TASKS.forEach(t => {
            const el = document.getElementById(t.id);
            if (el) {
                el.textContent = `${t.name} (Alt+${t.key}): ${getTaskLimit(t.name)}`;
            }
        });
    }

    setInterval(updateLimitWidget, 1000);

    // ==========================================
    // 3. PHÍM TẮT MỞ NHIỆM VỤ (ALT + 1..8)
    // ==========================================
    function triggerMission(taskName) {
        const card = findMissionCard(taskName);
        if (!card) return;

        const claimBtn = card.querySelector('a.claim-mission');
        if (claimBtn) {
            claimBtn.click();
        }
    }

    window.addEventListener('keydown', function (e) {
        if (!e.altKey) return;

        let pressedNum = null;
        if (e.code && e.code.startsWith('Digit')) {
            pressedNum = e.code.replace('Digit', '');
        } else if (e.code && e.code.startsWith('Numpad')) {
            pressedNum = e.code.replace('Numpad', '');
        } else if (/^[1-8]$/.test(e.key)) {
            pressedNum = e.key;
        }

        if (!pressedNum) return;

        const matchedTask = TASKS.find(t => t.key === pressedNum);
        if (matchedTask) {
            e.preventDefault();
            triggerMission(matchedTask.name);
        }
    });

})();
