// ==UserScript==
// @name          SeriesGraph - Filler Tracker
// @namespace     http://tampermonkey.net/
// @version       2025-12-27
// @description   Show the filler episodes by overlaying boxes over them.
// @author        You
// @match         https://seriesgraph.com/*
// @grant         none
// ==/UserScript==

//NOTE: USING TAMPERMONKEY IN THIS CASE

(async function() {
    'use strict';

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

    async function markFiller() {

        const segments = window.location.pathname.split('/').filter(Boolean);
        if (segments.length != 2) return;

        const titleEl = document.querySelector(".rt-Heading");
        const res = await fetch(`https://filler-list.chaiwala-anime.workers.dev/${toSkewerCase(titleEl.innerText)}`);
        const { fillerEpisodes } = await res.json();
        const fillerSet = new Set(fillerEpisodes.map(Number));

        console.log(...fillerSet);

        const eps = document.querySelectorAll("rect");
        document.querySelectorAll('.filler-overlay').forEach(el => el.remove());

        eps.forEach((ep, i) => {
            if (fillerSet.has(i + 1)) {
                coverFiller(ep);
            }
        });
    }

    //Function to create and insert the re-mark button
    const insertRemarkButton = () => {
        if (document.getElementById("remark-fillers-button")) return;

        const button = document.createElement("button");
        button.id = "remark-fillers-button";
        button.className = "rt-reset rt-BaseButton rt-variant-surface rt-high-contrast rt-Button rt-r-size-2";
        button.style.cssText = "cursor: pointer; margin-left: 8px; white-space: nowrap;";
        button.innerText = "Remark Fillers";

        button.onclick = () => markFiller();
        document.querySelector(".rt-Flex.rt-r-ai-center.rt-r-gap-2.rt-r-mb-4").appendChild(button);
    };

    //Function to show or hide fillers (Same style as current ones in SeriesGraph)
    const insertFillerToggleButton = () => {

        if (document.getElementById("filler-toggle-container")) return;
        const parent = document.querySelector(".rt-Flex.rt-r-ai-center.rt-r-gap-2.rt-r-mb-4");
        if (!parent) return;

        const container = document.createElement("div");
        container.id = "filler-toggle-container";
        container.className = "rt-Flex rt-r-ai-center rt-r-gap-2 rt-r-ml-2";

        const span = document.createElement("span");
        span.className = "rt-Text rt-r-size-2";
        span.style.cssText = "cursor: pointer; user-select: none;";
        span.innerText = "Show Fillers";

        const button = document.createElement("button");
        button.type = "button";
        button.role = "switch";
        button.value = "on";
        button.className = "rt-reset rt-SwitchRoot rt-r-size-2 rt-variant-surface rt-high-contrast";

        button.setAttribute("aria-checked", "true");
        button.setAttribute("data-state", "checked");
        button.setAttribute("data-accent-color", "gray");

        const thumb = document.createElement("span");
        thumb.className = "rt-SwitchThumb rt-high-contrast";
        thumb.setAttribute("data-state", "checked");

        const toggleState = () => {
            const isChecked = button.getAttribute("data-state") === "checked";
            const newState = isChecked ? "unchecked" : "checked";

            button.setAttribute("data-state", newState);
            button.setAttribute("aria-checked", isChecked ? "false" : "true");
            thumb.setAttribute("data-state", newState);

            const overlays = document.querySelectorAll('.filler-overlay');
            overlays.forEach(el => {el.style.visibility = isChecked ? 'hidden' : 'visible'});
        };

        button.onclick = toggleState;
        span.onclick = toggleState;

        button.appendChild(thumb);
        container.appendChild(span);
        container.appendChild(button);
        parent.appendChild(container);
    };

    //add the remark button each time
    const remarker = new MutationObserver((mutationsList, observer) => {
        insertFillerToggleButton();
        insertRemarkButton();
        //Whenever layout changes, reapply the fillers
        const LayoutStyleButtons = document.querySelectorAll(".rt-Button.TVGraph_view-toggle__D0R39");
        LayoutStyleButtons.forEach(button => button.addEventListener("click",markFiller));
    });
    remarker.observe(document.body, {childList: true, subtree: true });

    //SHOW FILLERS EVERY TIME BY DEFAULT
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
        const currentUrl = location.href;

        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            if (document.querySelectorAll("rect").length > 0) {
                markFiller();
            }
        }

        const tooltips = document.querySelectorAll('[role="tooltip"], [data-radix-popper-content-wrapper], .rt-TooltipContent');
        tooltips.forEach(tip => {
            if (tip.style.zIndex !== '1000000') {
                tip.style.zIndex = '1000000';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial calls
    setTimeout(()=>markFiller(),200);
    window.addEventListener('resize', markFiller);
})();
