// ==UserScript==
// @name         Auto Scroll Up Down
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động cuộn lên xuống
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let running = false;
    let direction = 1;
    let speed = 2;
    let timer = null;

    function scrollPage() {
        if (!running) return;

        window.scrollBy(0, direction * speed);

        const current = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (current >= max - 2) {
            direction = -1;
        }

        if (current <= 2) {
            direction = 1;
        }
    }

    function start() {
        if (timer) clearInterval(timer);
        timer = setInterval(scrollPage, 50);
    }

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 's') {
            running = !running;

            if (running) {
                start();
                console.log('Auto Scroll: ON');
            } else {
                clearInterval(timer);
                timer = null;
                console.log('Auto Scroll: OFF');
            }
        }

        if (e.altKey && e.key === 'ArrowUp') {
            speed = Math.min(speed + 1, 30);
            console.log('Speed:', speed);
        }

        if (e.altKey && e.key === 'ArrowDown') {
            speed = Math.max(speed - 1, 1);
            console.log('Speed:', speed);
        }
    });

})();
