// ==UserScript==
// @name         InstantDeleteRedditComments
// @namespace    http://tampermonkey.net/
// @version      2025-09-30
// @description  bypass the confirmation when deleting comments on your user page
// @author       nexus4880
// @match        https://www.reddit.com/user/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

const delay = ms => new Promise(res => setTimeout(res, ms));

(function() {
    'use strict';

    function bindCallbacks() {
        const buttons = document.querySelectorAll(".togglebutton");
        for (const button of buttons) {
            if (button.outerText != "delete") {
                continue;
            }

            button.onclick = async () => {
                toggle(button);

                // Give it time to do the animation and create the confirmation buttons.
                await delay(500);

                // Pass the "yes" confirmation button into change_state. It worked with just button, but I'd rather emulate what they do.
                let confirmButton = button.parentElement.parentElement.children[2].children[0];
                if (!confirmButton) {
                    alert("Failed to delete, confirm button missing?");
                    return;
                }

                // This handles actually deleting.
                change_state(confirmButton, "del", hide_thing, undefined, null);
            };
        }
    }

    // Don't know which one I actually need, don't really care.
    const config = { attributes: true, childList: true, subtree: true };
    const observer = new MutationObserver(bindCallbacks);
    observer.observe(document, config);
})();
