// ==UserScript==
// @name         YouTube Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hijacks the download button on YouTube and makes it so that whenever you click the download button you will be taken to your downloader
// @author       nexus4880
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

const WEBSITE_URL = "https://[REDACTED]/[REDACTED].php?videoId=";

(function() {
    'use strict';

    function onDownloadButtonPressed() {
        const videoId = (new URLSearchParams(window.location.search)).get('v');
        if (!videoId) {
            return alert("Failed to get videoId");
        }

        window.open(WEBSITE_URL + videoId);
    }

    function hijackDownloadButton() {
        const downloadButton = document.querySelector("#flexible-item-buttons > ytd-download-button-renderer > ytd-button-renderer > yt-button-shape > button");
        if (!downloadButton) {
            return;
        }

        downloadButton.onclick = onDownloadButtonPressed;
    }

    const observer = new MutationObserver(hijackDownloadButton);
    observer.observe(document.body, { childList: true, subtree: true });
})();
