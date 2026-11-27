/*
 * storage.js  -  save the diagram on the device so it survives closing the app.
 *
 * We use localStorage: a small key/value store built into every browser and
 * into the iOS WebView. Everything stays on the iPad; nothing is sent anywhere.
 *
 * Browsers can refuse storage (private mode, full disk), so every call is
 * wrapped in try/catch. If saving fails, the app simply keeps working in memory.
 */
import { createInitialState, MAX_BRANCHES, MAX_CAUSES } from './state.js';

const KEY = 'fishbone-builder:v1';

/** Save the parts of the state worth keeping (not the temporary UI hints). */
export function saveState(state) {
  try {
    const { effect, branches, selectedId } = state;
    localStorage.setItem(KEY, JSON.stringify({ effect, branches, selectedId }));
  } catch {
    /* storage unavailable - ignore */
  }
}

/**
 * Load the saved diagram, or a fresh one if there is none.
 * Saved data is checked before use: never trust data you didn't just create.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const data = JSON.parse(raw);

    const isText = (v) => typeof v === 'string';
    const valid =
      isText(data.effect) &&
      Array.isArray(data.branches) &&
      data.branches.length >= 2 &&
      data.branches.length <= MAX_BRANCHES &&
      data.branches.every(
        (b) =>
          isText(b.id) &&
          isText(b.title) &&
          isText(b.color) &&
          Array.isArray(b.causes) &&
          b.causes.length <= MAX_CAUSES &&
          b.causes.every((c) => isText(c.id) && isText(c.text))
      );

    return valid ? { ...data, focusId: null } : createInitialState();
  } catch {
    return createInitialState(); // corrupt or missing data -> start clean
  }
}
