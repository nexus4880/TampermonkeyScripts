// ==UserScript==
// @name         UC Signature Remover
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes signatures from posts/comments on unknowncheats
// @author       nexus4880
// @match        https://www.unknowncheats.me/forum/*.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=unknowncheats.me
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const sigs = document.querySelectorAll(".fixedsig");
    for (const sig of sigs) {
        sig.parentNode.remove();
    }
})();
