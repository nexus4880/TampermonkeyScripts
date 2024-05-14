// ==UserScript==
// @name         Reddit Promotion Remover
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes promoted posts from Reddit
// @author       nexus4880
// @match        https://www.reddit.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeSponsoredElements() {
        const sponsoredElements = document.querySelectorAll(".promoted");
        for (const element of sponsoredElements) {
            element.remove();
        }
    }

    // Watch for changes in the DOM
    const observer = new MutationObserver(removeSponsoredElements);
    observer.observe(document.body, { childList: true, subtree: true });
})();
