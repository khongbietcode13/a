// ==UserScript==
// @name         TrafficViet Shortlink Auto Bypass & Initial Continue
// @namespace    https://trafficviet.vn/
// @version      1.0.4
// @description  Tự động bypass nhiệm vụ TrafficViet, đếm ngược qua API widget, tự động bấm Tiếp tục ở trang đầu, tự reload khi xuất hiện giao diện nhiệm vụ và điền mã xác nhận.
// @author       Antigravity Engineering
// @match        https://app.trafficviet.vn/s/*
// @match        https://*.trafficviet.vn/s/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // STYLES FOR FLOATING BYPASS PANEL
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        #th-bypass-panel {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 380px;
            max-width: calc(100vw - 32px);
            background: #0f172a;
            color: #f8fafc;
            border: 1px solid #334155;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            z-index: 9999999;
            overflow: hidden;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #th-bypass-panel.minimized {
            width: auto;
            border-radius: 30px;
        }
        #th-bypass-panel.minimized #th-body {
            display: none;
        }
        #th-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #334155;
            cursor: pointer;
            user-select: none;
        }
        #th-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            color: #38bdf8;
        }
        #th-title svg {
            width: 18px;
            height: 18px;
            fill: #38bdf8;
        }
        .th-btn-icon {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: color 0.15s, background 0.15s;
        }
        .th-btn-icon:hover {
            color: #f8fafc;
            background: #334155;
        }
        #th-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .th-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .th-label {
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .th-input {
            width: 100%;
            box-sizing: border-box;
            background: #1e293b;
            border: 1px solid #475569;
            color: #f8fafc;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
        }
        .th-input:focus {
            border-color: #38bdf8;
        }
        .th-btn-primary {
            background: linear-gradient(135deg, #0284c7, #2563eb);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: opacity 0.15s, transform 0.1s;
        }
        .th-btn-primary:hover:not(:disabled) {
            opacity: 0.95;
            transform: translateY(-1px);
        }
        .th-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #th-progress-container {
            display: none;
            background: #1e293b;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #334155;
        }
        #th-progress-bar-bg {
            width: 100%;
            height: 8px;
            background: #334155;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }
        #th-progress-bar-fill {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #38bdf8, #3b82f6);
            transition: width 1s linear;
        }
        #th-code-box {
            display: none;
            background: #064e3b;
            border: 1px solid #059669;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        #th-code-display {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #34d399;
            user-select: all;
            margin: 4px 0 8px 0;
        }
        #th-log-area {
            background: #020617;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            color: #94a3b8;
            max-height: 110px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .th-checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #94a3b8;
            cursor: pointer;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // ==========================================
    // UI COMPONENT
    // ==========================================
    const panel = document.createElement('div');
    panel.id = 'th-bypass-panel';
    panel.innerHTML = `
        <div id="th-header">
            <div id="th-title">
                <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                TrafficViet Bypass
            </div>
            <button class="th-btn-icon" id="th-toggle-min" title="Thu nhỏ / Mở rộng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
        </div>
        <div id="th-body">
            <div class="th-form-group">
                <div class="th-label">
                    <span>Link web nhiệm vụ:</span>
                    <a href="javascript:void(0)" id="th-auto-detect" style="color: #38bdf8; text-decoration: none;">[Tự tìm link]</a>
                </div>
                <input type="text" class="th-input" id="th-target-url" placeholder="https://example.com/bai-viet-nhiem-vu/">
            </div>

            <div style="display: flex; gap: 8px;">
                <button class="th-btn-primary" id="th-btn-start" style="flex: 1;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Bắt đầu Bypass (60s)
                </button>
            </div>

            <label class="th-checkbox-label">
                <input type="checkbox" id="th-auto-submit" checked>
                Tự động điền mã & mở khóa link gốc
            </label>

            <div id="th-progress-container">
                <div style="display:
