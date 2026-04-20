// ==UserScript==
// @name         YouTube Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Creates a download button on YouTube and makes it so that whenever you click the download button your ytdl:// protocol handler gets ran
// @author       nexus4880
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createDownloadButton() {
        // Create a plain div wrapper instead of ytd-button-renderer to avoid internal YouTube filtering
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'style-scope ytd-menu-renderer';
        btnWrapper.id = 'download-button-injected';
        btnWrapper.style.display = 'inline-flex';
        btnWrapper.style.alignItems = 'center';
        btnWrapper.style.justifyContent = 'center';

        // Create the button element
        const btn = document.createElement('button');
        // Standard YouTube classes for the rounded buttons
        btn.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading';

        // Force critical styles to ensure visibility
        btn.style.marginLeft = '8px';
        btn.style.marginRight = '8px';
        btn.style.padding = '0 16px';
        btn.style.height = '36px';
        btn.style.borderRadius = '18px';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Slight light gray for dark mode compatibility
        btn.style.color = '#f1f1f1';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';

        btn.setAttribute('aria-label', 'Download');

        // Create the icon container
        const iconDiv = document.createElement('div');
        iconDiv.className = 'yt-spec-button-shape-next__icon';
        iconDiv.style.width = '24px';
        iconDiv.style.height = '24px';
        iconDiv.style.marginRight = '6px';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';

        // Create the SVG safely
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('focusable', 'false');
        svg.style.pointerEvents = 'none';
        svg.style.display = 'block';
        svg.style.width = '24px';
        svg.style.height = '24px';
        svg.style.fill = 'currentColor';

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-4.9z');

        g.appendChild(path);
        svg.appendChild(g);
        iconDiv.appendChild(svg);

        // Create the text container
        const textSpan = document.createElement('span');
        textSpan.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap';
        textSpan.textContent = 'Download';
        textSpan.style.fontSize = '14px';
        textSpan.style.fontWeight = '500';
        textSpan.style.fontFamily = '"Roboto","Arial",sans-serif';

        // Assemble the button
        btn.appendChild(iconDiv);
        btn.appendChild(textSpan);
        btnWrapper.appendChild(btn);

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const videoUrl = window.location.href;
            window.location.href = "ytdl://" + videoUrl;
        };

        return btnWrapper;
    }

    let hasAlertedFailure = false;

    function injectButton() {
        if (document.getElementById('download-button-injected')) return;

        const containerSelectors = [
            '#top-level-buttons-computed',
            'ytd-menu-renderer.ytd-watch-metadata div#top-level-buttons-computed',
            '#actions-inner #menu ytd-menu-renderer #top-level-buttons-computed'
        ];

        let buttonContainer = null;

        for (const selector of containerSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                buttonContainer = el;
                break;
            }
        }

        // Fallback if specific container isn't found
        if (!buttonContainer) {
            const segmented = document.querySelector('ytd-segmented-like-dislike-button-renderer');
            if (segmented) {
                buttonContainer = segmented.parentElement;
            }
        }

        if (!buttonContainer) return;

        const shareSelectors = [
            'button[aria-label*="Share"]',
            'button[aria-label*="Teilen"]',
            'button[aria-label*="Compartir"]',
            'button[aria-label*="Partager"]',
            'ytd-button-renderer:nth-child(3)'
        ];

        let shareButtonRenderer = null;
        for (const selector of shareSelectors) {
            const btn = buttonContainer.querySelector(selector);
            if (btn) {
                shareButtonRenderer = btn.closest('ytd-button-renderer') || btn.parentElement;
                if (shareButtonRenderer) break;
            }
        }

        try {
            const newBtn = createDownloadButton();
            if (shareButtonRenderer && shareButtonRenderer.parentElement === buttonContainer) {
                buttonContainer.insertBefore(newBtn, shareButtonRenderer);
            } else {
                buttonContainer.appendChild(newBtn);
            }
        } catch (e) {
            alert('Injection Error: ' + e.message);
        }
    }

    // Polling and Mutation Observation
    let checkCount = 0;
    const initialLoadTimer = setInterval(() => {
        injectButton();
        checkCount++;
        if (checkCount > 30) clearInterval(initialLoadTimer);
    }, 1500);

    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('yt-navigate-finish', () => {
        hasAlertedFailure = false;
        injectButton();
    });

    injectButton();
})();
