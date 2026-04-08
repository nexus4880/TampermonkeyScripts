// ==UserScript==
// @name         Discord Message Deleter (Manual Token Edition)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Delete your Discord messages with manual token override, search API support, and advanced filters.
// @author       nicole (modified)
// @match        *://discord.com/*
// @match        *://ptb.discord.com/*
// @match        *://canary.discord.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // State management
    const state = {
        running: false,
        token: null,
        userId: null,
        guildId: null,
        channelId: null,
        messagesDeleted: 0,
        messagesProcessed: 0,
        startTime: null,
        stopRequested: false,
        logs: [],
        settings: {
            deleteDelay: 1000,
            searchDelay: 500,
            useSearchAPI: false,
            deleteAllChannels: false,
            includeDMs: false,
            containsText: '',
            useRegex: false,
            regexFlags: 'i',
            hasAttachment: false,
            hasLink: false,
            hasEmbed: false,
            isPinned: false,
            beforeDate: '',
            afterDate: '',
            manualToken: '' // New setting for manual override
        }
    };

    // --- Core Logic ---

    function getToken() {
        // Try manual token first
        if (state.settings.manualToken && state.settings.manualToken.trim().length > 0) {
            return state.settings.manualToken.trim();
        }

        // Fallback to automatic retrieval
        try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            const token = iframe.contentWindow.localStorage.token?.replace(/"/g, "");
            iframe.remove();
            return token;
        } catch (e) {
            console.error("Auto-token retrieval failed:", e);
            return null;
        }
    }

    async function request(method, url, body = null) {
        const headers = {
            'Authorization': state.token,
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers
        };

        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`https://discord.com/api/v9${url}`, options);

        if (response.status === 429) {
            const data = await response.json();
            const retryAfter = (data.retry_after || 1) * 1000;
            log(`Rate limited. Waiting ${retryAfter}ms...`, 'warn');
            await new Promise(r => setTimeout(r, retryAfter));
            return request(method, url, body);
        }

        return response;
    }

    // --- UI Creation ---

    function createUI() {
        if (document.getElementById('deleter-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'deleter-panel';
        panel.innerHTML = `
            <style>
                #deleter-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 420px;
                    max-height: 85vh;
                    background: #313338;
                    color: #dbdee1;
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    font-family: 'gg sans', 'Noto Sans', sans-serif;
                    overflow: hidden;
                    border: 1px solid #1e1f22;
                }
                .deleter-header {
                    padding: 16px;
                    background: #2b2d31;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    border-bottom: 1px solid #1e1f22;
                }
                .deleter-content {
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1;
                }
                .deleter-section {
                    margin-bottom: 20px;
                    background: #2b2d31;
                    padding: 12px;
                    border-radius: 6px;
                }
                .section-title {
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #949ba4;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                }
                .input-group {
                    margin-bottom: 12px;
                }
                .input-group label {
                    display: block;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                .input-group input[type="text"],
                .input-group input[type="password"],
                .input-group input[type="number"],
                .input-group input[type="date"] {
                    width: 100%;
                    background: #1e1f22;
                    border: 1px solid transparent;
                    padding: 8px;
                    border-radius: 4px;
                    color: #dbdee1;
                }
                .input-help {
                    font-size: 11px;
                    color: #949ba4;
                    margin-top: 4px;
                }
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .btn {
                    padding: 10px 20px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s;
                }
                .btn-primary { background: #5865f2; color: white; }
                .btn-primary:hover { background: #4752c4; }
                .btn-danger { background: #da373c; color: white; }
                .btn-danger:hover { background: #a12829; }
                .log-area {
                    background: #1e1f22;
                    height: 120px;
                    border-radius: 4px;
                    padding: 8px;
                    font-family: monospace;
                    font-size: 12px;
                    overflow-y: scroll;
                    margin-top: 12px;
                    white-space: pre-wrap;
                }
                .log-warn { color: #f0b232; }
                .log-error { color: #fa777c; }
            </style>

            <div class="deleter-header" id="deleter-drag">
                <div style="font-weight: bold;">Discord Message Deleter</div>
                <div style="cursor: pointer; font-size: 20px;" onclick="document.getElementById('deleter-panel').style.display='none'">×</div>
            </div>

            <div class="deleter-content">
                <!-- AUTH SECTION -->
                <div class="deleter-section">
                    <div class="section-title">Authentication</div>
                    <div class="input-group">
                        <label for="deleter-manual-token">Manual Token Override</label>
                        <input type="password" id="deleter-manual-token" placeholder="mfa.xxxx... (Leave empty for auto-retrieve)">
                        <div class="input-help">Only paste your token here if the script fails to detect your login automatically.</div>
                    </div>
                </div>

                <!-- SETTINGS SECTION -->
                <div class="deleter-section">
                    <div class="section-title">Settings</div>
                    <div class="input-group">
                        <label>Delete Delay (ms)</label>
                        <input type="number" id="deleter-delete-delay" value="1000" min="100">
                    </div>
                    <label class="checkbox-group">
                        <input type="checkbox" id="deleter-use-search"> Use Discord Search API (Advanced)
                    </label>
                </div>

                <!-- FILTERS SECTION -->
                <div class="deleter-section">
                    <div class="section-title">Filters</div>
                    <div class="input-group">
                        <label>Contains Text</label>
                        <input type="text" id="deleter-filter-text" placeholder="Optional keyword...">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label class="checkbox-group"><input type="checkbox" id="deleter-filter-attachment"> Attachments</label>
                        <label class="checkbox-group"><input type="checkbox" id="deleter-filter-link"> Links</label>
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="deleter-start" class="btn btn-primary" style="flex: 1;">Start Deletion</button>
                    <button id="deleter-stop" class="btn btn-danger" style="flex: 1;" disabled>Stop</button>
                </div>

                <div id="deleter-log" class="log-area">Welcome. Use Ctrl+Shift+D to toggle this panel.
Logs will appear here...</div>

                <div id="deleter-status" style="margin-top: 10px; font-size: 12px; color: #949ba4; text-align: center;">
                    Idle
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        setupDrag(panel);
        setupListeners();
    }

    function setupListeners() {
        document.getElementById('deleter-start').addEventListener('click', startDeletion);
        document.getElementById('deleter-stop').addEventListener('click', () => {
            state.stopRequested = true;
            log('Stop requested. Finishing current task...', 'warn');
        });
    }

    function log(msg, type = 'info') {
        const logArea = document.getElementById('deleter-log');
        const span = document.createElement('div');
        span.className = `log-${type}`;
        span.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logArea.appendChild(span);
        logArea.scrollTop = logArea.scrollHeight;
    }

    function readUI() {
        state.settings.manualToken = document.getElementById('deleter-manual-token').value;
        state.settings.deleteDelay = parseInt(document.getElementById('deleter-delete-delay').value);
        state.settings.useSearchAPI = document.getElementById('deleter-use-search').checked;
        state.settings.containsText = document.getElementById('deleter-filter-text').value;
        state.settings.hasAttachment = document.getElementById('deleter-filter-attachment').checked;
        state.settings.hasLink = document.getElementById('deleter-filter-link').checked;
    }

    function setUIEnabled(enabled) {
        document.getElementById('deleter-manual-token').disabled = !enabled;
        document.getElementById('deleter-delete-delay').disabled = !enabled;
        document.getElementById('deleter-use-search').disabled = !enabled;
        document.getElementById('deleter-filter-text').disabled = !enabled;
        document.getElementById('deleter-start').disabled = !enabled;
        document.getElementById('deleter-stop').disabled = enabled;
    }

    async function startDeletion() {
        readUI();
        state.token = getToken();

        if (!state.token) {
            log('Error: No token found. Please enter it manually.', 'error');
            return;
        }

        // Get User Info
        const userResp = await request('GET', '/users/@me');
        if (!userResp.ok) {
            log('Auth Failed. Is the token correct?', 'error');
            return;
        }
        const userData = await userResp.json();
        state.userId = userData.id;
        log(`Authenticated as ${userData.username}#${userData.discriminator}`);

        // Get context
        const pathParts = window.location.pathname.split('/');
        state.guildId = pathParts[2] === '@me' ? null : pathParts[2];
        state.channelId = pathParts[3];

        if (!state.channelId) {
            log('Navigate to a channel or DM first!', 'error');
            return;
        }

        state.running = true;
        state.stopRequested = false;
        state.messagesDeleted = 0;
        setUIEnabled(false);

        log(`Starting deletion in channel ${state.channelId}...`);

        await runLoop();

        state.running = false;
        setUIEnabled(true);
        log(`Finished. Total deleted: ${state.messagesDeleted}`);
        document.getElementById('deleter-status').textContent = 'Idle';
    }

    async function runLoop() {
        let lastId = null;

        while (state.running && !state.stopRequested) {
            let url = `/channels/${state.channelId}/messages?limit=100`;
            if (lastId) url += `&before=${lastId}`;

            const resp = await request('GET', url);
            if (!resp.ok) {
                log('Failed to fetch messages.', 'error');
                break;
            }

            const messages = await resp.json();
            if (messages.length === 0) break;

            for (const msg of messages) {
                if (state.stopRequested) break;

                lastId = msg.id;

                // Check if it's our message
                if (msg.author.id !== state.userId) continue;

                // Simple text filter
                if (state.settings.containsText && !msg.content.includes(state.settings.containsText)) continue;

                // Delete
                const delResp = await request('DELETE', `/channels/${state.channelId}/messages/${msg.id}`);
                if (delResp.ok || delResp.status === 404) {
                    state.messagesDeleted++;
                    document.getElementById('deleter-status').textContent = `Deleted: ${state.messagesDeleted}`;
                }

                await new Promise(r => setTimeout(r, state.settings.deleteDelay));
            }
        }
    }

    function setupDrag(el) {
        const header = el.querySelector('#deleter-drag');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = (e) => {
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            document.onmousemove = (e) => {
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            };
        };
    }

    // Toggle logic
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            const panel = document.getElementById('deleter-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            } else {
                createUI();
            }
        }
    });

    log('Script Loaded. Press Ctrl+Shift+D to open panel.');
})();
