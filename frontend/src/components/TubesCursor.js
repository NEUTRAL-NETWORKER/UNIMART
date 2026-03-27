/**
 * TubesCursor.js
 * Exact port of the original tube cursor (script.js from threejs-components demo).
 * Uses library default tube geometry — no count/radius/length overrides.
 * On click: randomises all colours completely.
 * No automatic colour cycling.
 * Active ONLY on the landing page.
 */

let tubeApp = null;

// ── Original colours from the demo script.js ────────────────────────────────
const INITIAL_COLORS       = ["#f967fb", "#53bc28", "#6958d5"];
const INITIAL_LIGHT_COLORS = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"];

// ── Public API ───────────────────────────────────────────────────────────────

export async function initTubesCursor(canvasEl) {
  if (!canvasEl) return;

  try {
    const { default: TubesCursor } = await import(
      "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
    );

    // Exact config from the original script.js — no extra overrides
    tubeApp = TubesCursor(canvasEl, {
      tubes: {
        colors: INITIAL_COLORS,
        lights: {
          intensity: 200,
          colors: INITIAL_LIGHT_COLORS,
        },
      },
    });

    // On click — randomise colours exactly as in the original script.js
    document.addEventListener("click", handleClick);

  } catch (e) {
    console.warn("TubesCursor failed to load:", e);
  }
}

export function destroyTubesCursor() {
  document.removeEventListener("click", handleClick);
  tubeApp = null;
}

// ── Exact randomColors function from original script.js ──────────────────────

function randomColors(count) {
  return new Array(count)
    .fill(0)
    .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"));
}

function handleClick() {
  if (!tubeApp) return;
  const colors       = randomColors(3);
  const lightsColors = randomColors(4);
  tubeApp.tubes.setColors(colors);
  tubeApp.tubes.setLightsColors(lightsColors);
}
