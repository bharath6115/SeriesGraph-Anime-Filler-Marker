// ==UserScript==
// @name          SeriesGraph - Filler Tracker
// @namespace     http://tampermonkey.net/
// @version       2.1.0
// @description   Show the filler episodes using different color.
// @author        bubluwu
// @match         https://seriesgraph.com/*
// @grant         GM_xmlhttpRequest
// @connect       www.animefillerlist.com
// ==/UserScript==

(async function() {
    'use strict';

    let fillerSet = new Set();
    let currAnime = "";

    const toSkewerCase = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

    function coverFiller(rectEl, episodeNumber) {
        const rect = rectEl.getBoundingClientRect();
        const left = rect.left + window.scrollX;
        const top = rect.top + window.scrollY;
        const div = document.createElement('div');
        //todo: can check for changes in such a way that if the cover's top and left dont align with the rect's top and left then we have to remark.

        div.dataset.left = left;
        div.dataset.top = top;
        div.dataset.episodeNumber = episodeNumber;

        div.className = 'filler-overlay';

        Object.assign(div.style, {
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.40)',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: '10',
            boxSizing: 'border-box',
            border: '3px solid white',
            borderRadius: "5px",
            pointerEvents: 'none'
        });

        document.body.appendChild(div);
    }

    async function fetchFillerEpisodes() {
        const segments = window.location.pathname.split('/').filter(Boolean);
        if (segments.length !== 2) return;

        const titleEl = document.querySelector(".rt-Heading");
        if (!titleEl) return;

        const animeName = titleEl.innerText;
        if (animeName === currAnime) return;

        const slug = toSkewerCase(animeName);
        const url = `https://www.animefillerlist.com/shows/${slug}`;

        console.log("Fetching filler data from:", url);

        try {
            const html = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,

                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(res.responseText);
                        } else {
                            reject(new Error(`HTTP ${res.status}`));
                        }
                    },

                    onerror: (err) => {
                        reject(new Error("GM_xmlhttpRequest failed"));
                    }
                });
            });

            const doc = new DOMParser().parseFromString(html, "text/html");

            const fillerEpisodes = [];

            doc.querySelectorAll("div.filler span.Label").forEach(label => {

                if (label.textContent.trim() !== "Filler Episodes:") return;
                const text = label.nextElementSibling?.textContent.trim();

                if (!text) return;

                text.split(",").forEach(ep => {
                    ep = ep.trim();

                    if (ep.includes("-")) {
                        const [start, end] = ep.split("-").map(Number);

                        if (!Number.isNaN(start) && !Number.isNaN(end)) {
                            for (let i = start; i <= end; i++) {
                                fillerEpisodes.push(i);
                            }
                        }
                    } else {
                        const episode = Number(ep);

                        if (!Number.isNaN(episode)) {
                            fillerEpisodes.push(episode);
                        }
                    }
                });
            });

            fillerSet = new Set(fillerEpisodes);
            currAnime = animeName;

            console.log("Fetched new data for:", animeName);
            console.log(
                "Filler episodes: [" + fillerSet.size + "]",
                ...fillerSet
            );

            markFiller();

        } catch (e) {
            console.error("Failed to fetch fillers:", e);
        }
    }

    function markFiller() {
        const eps = document.querySelectorAll("rect");
        document.querySelectorAll('.filler-overlay').forEach(el => el.remove());

        if(fillerSet.size === 0) return;

        eps.forEach((ep, i) => {
            if (fillerSet.has(i + 1)) {
                coverFiller(ep, i+1);
            }
        });
    }

    //Function to show or hide fillers, re-mark fillers
    const insertFillerControlButtons = () => {

        if (document.getElementById("filler-toggle-container") || document.getElementById("remark-fillers-button")) return;
        const parent = document.querySelector(".rt-Flex.rt-r-ai-center.rt-r-gap-2.rt-r-mb-4");
        if (!parent) return;

        // 1. Create Container
        const container = document.createElement("div");
        container.id = "filler-toggle-container";
        container.className = "rt-Flex rt-r-ai-center rt-r-gap-2 rt-r-ml-2";

        // 2. Label
        const span = document.createElement("span");
        span.className = "rt-Text rt-r-size-2";
        span.style.cssText = "cursor: pointer; user-select: none;";
        span.innerText = "Mark Fillers";

        // 3. Switch Button
        const button = document.createElement("button");
        button.type = "button";
        button.role = "switch";
        button.value = "on";
        button.className = "rt-reset rt-SwitchRoot rt-r-size-2 rt-variant-surface rt-high-contrast";

        button.setAttribute("aria-checked", "true");
        button.setAttribute("data-state", "checked");
        button.setAttribute("data-accent-color", "gray");

        // 4. Switch Thumb
        const thumb = document.createElement("span");
        thumb.className = "rt-SwitchThumb rt-high-contrast";
        thumb.setAttribute("data-state", "checked");

        // 5. Toggling
        const toggleState = () => {
            const isChecked = button.getAttribute("data-state") === "checked";
            const newState = isChecked ? "unchecked" : "checked";

            button.setAttribute("data-state", newState);
            button.setAttribute("aria-checked", isChecked ? "false" : "true");
            thumb.setAttribute("data-state", newState);

            // Trigger your script's visibility logic
            const overlays = document.querySelectorAll('.filler-overlay');
            overlays.forEach(el => {el.style.visibility = isChecked ? 'hidden' : 'visible'});
        };

        button.onclick = toggleState;
        span.onclick = toggleState;

        button.appendChild(thumb);
        container.appendChild(span);
        container.appendChild(button);
        parent.appendChild(container);

        //6. Create the Remark filler button
        const remarkFillerButton = document.createElement("button");
        remarkFillerButton.id = "remark-fillers-button";
        remarkFillerButton.className = "rt-reset rt-BaseButton rt-variant-surface rt-high-contrast rt-Button rt-r-size-2";
        remarkFillerButton.style.cssText = "cursor: pointer; margin-left: 8px; white-space: nowrap;";
        remarkFillerButton.innerText = "Remark Fillers";

        remarkFillerButton.onclick = () => markFiller();
        parent.appendChild(remarkFillerButton);
    };

    //add the remark button each time
    const fillerControlAutoAppender = new MutationObserver((mutationsList, observer) => insertFillerControlButtons());
    fillerControlAutoAppender.observe(document.body, {childList: true, subtree: true });

    //SHOW FILLERS EVERY TIME BY DEFAULT
    let lastUrl = location.href;
    let lastSelectionText = "";

    const observer = new MutationObserver(() => {
        const currentUrl = location.href;

        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            fillerSet = new Set(); // Reset
            currAnime = ""; // Reset
            fetchFillerEpisodes();
        }

        //To detect the scrollArea changes (layout only, not public/seriesgraph ratings)
        const selectTriggerInner = document.querySelectorAll(".rt-SelectTriggerInner")[1];
        if (selectTriggerInner) {
            const currentText = selectTriggerInner.innerText;
            if (currentText !== lastSelectionText) {
                lastSelectionText = currentText;
                console.log("Dropdown changed to:", currentText);
                markFiller();
            }
        }

        //Elevate the tooltips so they appear on top of the marked episodes
        const tooltips = document.querySelectorAll('[role="tooltip"], [data-radix-popper-content-wrapper], .rt-TooltipContent');
        tooltips.forEach(tip => {
            if (tip.style.zIndex !== '1000000') {
                tip.style.zIndex = '1000000';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial calls
    fetchFillerEpisodes();
    setTimeout(markFiller,500); //might be redundant but atp idgaf
    window.addEventListener('resize', markFiller);
})();
