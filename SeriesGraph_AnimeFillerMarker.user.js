// ==UserScript==
// @name          SeriesGraph - Filler Tracker
// @namespace     http://tampermonkey.net/
// @version       1.2
// @description   Show the filler episodes using different color.
// @author        You
// @match         https://seriesgraph.com/*
// @grant         none
// ==/UserScript==

(async function() {
    'use strict';

    let fillerSet = new Set();
    let currAnime = "";

    const toSkewerCase = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

    function coverFiller(rectEl) {
        const rect = rectEl.getBoundingClientRect();
        const div = document.createElement('div');
        Object.assign(div.style, {
            position: 'absolute',
            left: `${rect.left + window.scrollX}px`,
            top: `${rect.top + window.scrollY}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.40)',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: '10',
            boxSizing: 'border-box',
            border: '3px solid white',
            borderRadius: "5px",
            pointerEvents: 'none'
        });
        div.className = 'filler-overlay';
        document.body.appendChild(div);
    }

    async function fetchFillerEpisodes() {

        const segments = window.location.pathname.split('/').filter(Boolean);
        if (segments.length != 2) return;

        const titleEl = document.querySelector(".rt-Heading");
        if (!titleEl) return;

        const animeName = titleEl.innerText;
        if (animeName === currAnime) return;

        try {
            const res = await fetch(`https://filler-list.chaiwala-anime.workers.dev/${toSkewerCase(animeName)}`);
            const { fillerEpisodes } = await res.json();

            fillerSet = new Set(fillerEpisodes.map(Number));
            currAnime = animeName;

            console.log("Fetched new data for:", animeName);
            console.log("Filler episodes:", ...fillerSet);
            markFiller();
        } catch (e) {
            console.error("Failed to fetch fillers:", e);
        }
    }

    function markFiller() {

        if(fillerSet.size === 0) return;

        const eps = document.querySelectorAll("rect");
        document.querySelectorAll('.filler-overlay').forEach(el => el.remove());

        eps.forEach((ep, i) => {
            if (fillerSet.has(i + 1)) {
                coverFiller(ep);
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

            if (document.querySelectorAll("rect").length > 0) {
                markFiller();
            }
        }

        //To detect the scrollArea changes
        const selectTriggerInner = document.querySelector(".rt-SelectTriggerInner");
        if (selectTriggerInner) {
            const currentText = selectTriggerInner.children[0].children[0].innerText;
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
    setTimeout(()=>markFiller(),500); //might be redundant but atp idgaf
    window.addEventListener('resize', markFiller);
})();
