// ==UserScript==
// @name         Auto Click Lấy Link Gtraffic
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động click nút Lấy Link trên gtraffic.io và direct.gtraffic.io trafficso1.com
// @match        https://gtraffic.io/*
// @match        https://direct.gtraffic.io/*
// @match        https://trafficso1.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function autoClick() {
        const links = document.querySelectorAll('a');

        for (const link of links) {
            const text = link.textContent.trim().toUpperCase();

            if (text === 'LẤY LINK') {
                console.log('Đã tự động click LẤY LINK');
                link.click();
                return;
            }
        }
    }

    setInterval(autoClick, 500);
})();
