# SeriesGraph: Anime Filler Marker

Ever used SeriesGraph to see the episode wise rating of an anime only to be disappointed by the straight 6's on some filler episodes? With this script, we can visually distinguish the filler episodes!

This is a Tampermonkey userscript that automatically highlights filler episodes on [SeriesGraph.com](https://seriesgraph.com) by overlaying them with a distinct visual marker (dimming + white border).

## ✨ Features

- **Automatic Highlighting:** Fetches filler data for the anime you're currently viewing.
- **Toggle Markers:** Show or hide filler markers using the **Mark Fillers** switch.
- **Remark Fillers:** Re-align markers if the graph layout changes.
- **Dynamic Updating:** Automatically detects navigation between different anime.
- **Responsive:** Recalculates marker positions when the browser window is resized.
- **Episode Selection Support:** Re-marks fillers when the graph selection changes.
- **Tooltip Support:** Keeps SeriesGraph tooltips visible above the filler markers.

## 🚀 Installation

1. Install the **Tampermonkey** extension for your browser ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)).
2. Open the `SeriesGraph_AnimeFillerMarker.user.js` file in this repository and click the **Raw** button.
3. Open the Tampermonkey dashboard and click the **Create a new script** button.<br/>
   <img width="321" height="353" alt="Tampermonkey create new script button" src="https://github.com/user-attachments/assets/4f82bded-a6ad-4dd1-80fa-b9ce1f0d5f92" />
4. Copy the code from the **Raw** page, paste it into the new script, and save it (Ctrl + S).
5. Navigate to any series on [SeriesGraph.com](https://seriesgraph.com/) to see it in action.

## 🛠️ How it Works

I built this script to act as a bridge between the rating charts on SeriesGraph and [Anime Filler List](https://www.animefillerlist.com/). Here is the behind-the-scenes "magic" that makes it happen:

### 1. Making sense of the Anime Title
When you open a series, the script grabs the anime title from the SeriesGraph page.
The `toSkewerCase` function cleans up the title—removing accents (like `é`), converting it to lowercase, removing special characters, and replacing spaces with hyphens so it can find the corresponding page on Anime Filler List.

### 2. Fetching the "Filler List"
The script sends a request directly to Anime Filler List using Tampermonkey's `GM_xmlhttpRequest`.
It then parses the returned HTML and looks for the **Filler Episodes** section.
Both individual episodes and episode ranges are supported. For example:
    10, 15, 20-25, 30
gets converted into:
    10, 15, 20, 21, 22, 23, 24, 25, 30

### 3. Finding the Bars on the Graph
This was the tricky part. SeriesGraph builds its charts using **SVG `<rect>` elements**.
The script finds these rectangles and uses their position in the list to determine which episode they represent.
It then checks whether each episode is present in the filler list.

### 4. The Filler Overlay
Instead of modifying SeriesGraph's actual SVG elements, the script creates a new, semi-transparent `div` and places it directly over each filler episode.
The overlay has a dark tint and a white border, making filler episodes easy to spot without interfering with the original graph.

### 5. Staying in Sync
SeriesGraph is dynamic, so the graph can move or change after the initial page load.
The script uses a `MutationObserver` to watch for changes and re-mark the fillers when necessary. It also listens for changes to the graph's selection and browser window resizing.
If the markers ever become misaligned, you can simply hit **Remark Fillers** to align them again.

## ⚠️ Known Issues / Limitations

* **Slug Matching:** The script relies on "skewer-case" titles (e.g., `naruto-shippuden`) to find the corresponding page on Anime Filler List. If the SeriesGraph title differs significantly from the Anime Filler List entry, the filler data may not load.

* **Anime Filler List Coverage:** The script relies on [Anime Filler List](https://www.animefillerlist.com/) for filler information. If an anime is missing from their database, no markers will appear.

* **Alignment (Positioning):** Because the markers are absolute-positioned overlays, they may occasionally become misaligned if the graph layout changes after the script runs.
    * **Fix:** Use the **"Remark Fillers"** button to re-sync the overlays with the current graph positions.

* **"BLOCKED BY CLIENT" error in console:** Some ad-blockers or browser extensions may block requests to Anime Filler List.
    * **Fix:** If this happens, try disabling the blocking rule for `www.animefillerlist.com` or whitelist the domain in your ad-blocker.
## 📸 Screenshots
### Bleach:
<img width="1188" height="897" alt="image" src="https://github.com/user-attachments/assets/798c300e-1ca0-46e7-ba46-99c0ecd3ce24" />

### Naruto Shippūden:
<img width="982" height="878" alt="image" src="https://github.com/user-attachments/assets/2e53dc79-8274-413f-9b40-5d9530191b0c" />


## 📜 License
MIT
