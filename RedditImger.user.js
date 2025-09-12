// ==UserScript==
// @name         Reddit Imger
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Replace comments that contain <image> tags with actual <img> tags
// @author       nexus4880
// @match        https://www.reddit.com/r/*/comments/*/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function processComments() {
        const comments = document.querySelectorAll(".md");
        comments.forEach(comment => {
            const imageLinks = Array.from(comment.querySelectorAll('a[href]')).filter(link => link.innerText.toLowerCase().trim() === "<image>");
            imageLinks.forEach(link => {
                const imageUrl = link.href;
                const imageElement = document.createElement('img');
                imageElement.src = imageUrl;
                imageElement.alt = `Failed to load ${imageUrl}`;
                link.parentNode.replaceChild(imageElement, link);
            });
        });
    }

    const observer = new MutationObserver(processComments);
    observer.observe(document.body, { childList: true, subtree: true });
})();
