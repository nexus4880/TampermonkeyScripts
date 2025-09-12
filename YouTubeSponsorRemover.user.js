// ==UserScript==
// @name         YouTube Sponsor Remover
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes sponsored listings on YouTube
// @author       nexus4880
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeSponsoredElements() {
        const sponsoredElements = document.querySelectorAll("ytd-ad-slot-renderer");
        for (const element of sponsoredElements) {
            element.remove();
        }
    }

    const observer = new MutationObserver(removeSponsoredElements);
    observer.observe(document.body, { childList: true, subtree: true });
})();
