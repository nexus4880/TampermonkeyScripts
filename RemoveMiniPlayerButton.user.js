// ==UserScript==
// @name         Remove MiniPlayer Button
// @namespace    http://tampermonkey.net/
// @version      2025-10-22
// @description  Removes the miniplayer button from the context menu on YouTube
// @author       nexus4880
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function bindCallbacks() {
        const secondButton = document.querySelector("div.ytp-menuitem:nth-child(2) > div:nth-child(2)");
        if (secondButton?.textContent == "Miniplayer") {
            secondButton.parentNode.remove();
        }
    }

    const config = { attributes: true, childList: true, subtree: true };
    const observer = new MutationObserver(bindCallbacks);
    observer.observe(document, config);
})();
