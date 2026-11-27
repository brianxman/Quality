/*
 * layout.js  -  PURE GEOMETRY for the fishbone diagram.
 *
 * "Pure" means: no React, no browser. Numbers in, numbers out. That makes this
 * file easy to unit-test (see tools/layout.test.mjs) and keeps the React
 * component free of math.
 *
 * Coordinate system: an SVG "viewBox" of 1200 x 640 units. The SVG scales to fit
 * the screen, so we never care about real pixels - only these units.
 *
 *            outer end of branch                        HEAD (the effect)
 *                 \  <- category label                +--------------+
 *      cause ----- \                                  |              |
 *      cause ------ \                                 |   problem    |
 *  ====================\==============================>              |
 *                       \                             +--------------+
 *                        (branches meet the spine at an angle)
 */

export const VIEW = { width: 1200, height: 640 };

// The horizontal "backbone" of the fish, ending at the head.
export const SPINE = { y: 320, startX: 40, endX: 962 };

// The head box that holds the problem statement ("effect").
export const HEAD = { x: 962, y: 250, w: 218, h: 140 };

// Every branch is a diagonal line: dx units across, dy units up (or down).
export const BRANCH = { dx: 120, dy: 240 };

// The category label box at the outer end of each branch.
export const LABEL = { w: 144, h: 36 };

// Rough width of one character at our SVG font size (16px). Used to decide
// how many characters fit on a cause line before we shorten with "...".
const CHAR_W = 8;

// Where branch attachment points sit along the spine.
const ATTACH_CENTER_X = 620; // the group of branches is centred here
const ATTACH_MAX_STEP = 240; // widest gap between neighbouring branches
const ATTACH_MIN_X = 310; // leftmost allowed attachment point
const ATTACH_MAX_X = 930; // rightmost allowed attachment point

// Length (in SVG units) of the short horizontal line each cause sits on.
const CAUSE_LEN_MIN = 96;
const CAUSE_LEN_MAX = 200;

/** Keep a number between a lower and upper limit. */
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Work out the x positions where `m` branches on ONE side of the spine attach.
 * Fewer branches -> wider spacing. More branches -> squeezed together (but never
 * wider than ATTACH_MAX_STEP, and always inside the allowed range).
 * Returns { xs: number[], step: number }.
 */
export function attachPositions(m) {
  if (m <= 0) return { xs: [], step: ATTACH_MAX_STEP };
  if (m === 1) return { xs: [ATTACH_CENTER_X], step: ATTACH_MAX_STEP };

  const step = Math.min(ATTACH_MAX_STEP, (ATTACH_MAX_X - ATTACH_MIN_X) / (m - 1));
  // Spread evenly, centred on ATTACH_CENTER_X.
  const xs = Array.from({ length: m }, (_, j) => ATTACH_CENTER_X + (j - (m - 1) / 2) * step);
  return { xs, step };
}

/** Shorten text with an ellipsis so it never runs past `max` characters. */
export function truncate(text, max) {
  const t = (text ?? '').trim();
  return t.length <= max ? t : t.slice(0, Math.max(1, max - 1)).trimEnd() + '…';
}

/**
 * Break text into at most `maxLines` lines of up to `maxChars` characters each,
 * splitting on spaces. Used for the problem statement inside the head box.
 */
export function wrapText(text, maxChars, maxLines) {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Too many lines? Keep the first ones and mark the last with an ellipsis.
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncate(kept[maxLines - 1] + ' …', maxChars);
    return kept.map((l) => truncate(l, maxChars));
  }
  return lines.map((l) => truncate(l, maxChars));
}

/**
 * The main function. Given the list of branches (each with a list of causes),
 * return everything the SVG needs to draw them: positions of the diagonal line,
 * the label box, and every cause line + its text.
 *
 * Branches alternate sides: 1st on top, 2nd on the bottom, 3rd on top, ...
 */
export function layoutBranches(branches) {
  // Split branch indexes into the top and bottom halves.
  const sides = { top: [], bottom: [] };
  branches.forEach((_, i) => (i % 2 === 0 ? sides.top : sides.bottom).push(i));

  const out = new Array(branches.length);

  for (const [side, indexes] of Object.entries(sides)) {
    const isTop = side === 'top';
    const { xs, step } = attachPositions(indexes.length);

    // How long each cause line can be before it would hit the neighbouring branch.
    const causeLen = clamp(step - 26, CAUSE_LEN_MIN, CAUSE_LEN_MAX);
    const maxChars = Math.max(6, Math.floor((causeLen - 8) / CHAR_W));

    indexes.forEach((branchIndex, j) => {
      const branch = branches[branchIndex];
      const attachX = xs[j];

      // Where the diagonal touches the spine, and where its far end is.
      const attach = { x: attachX, y: SPINE.y };
      const outer = {
        x: attachX - BRANCH.dx,
        y: isTop ? SPINE.y - BRANCH.dy : SPINE.y + BRANCH.dy,
      };

      // Category label box: sits just beyond the outer end of the branch.
      const labelBox = {
        x: outer.x - LABEL.w / 2,
        y: isTop ? outer.y - LABEL.h : outer.y,
        w: LABEL.w,
        h: LABEL.h,
      };

      // Space the causes evenly along the diagonal, nearest the spine first.
      const k = branch.causes.length;
      const causes = branch.causes.map((cause, i) => {
        const d = (i + 1) / (k + 1); // 0..1 = fraction of the way from spine to outer end
        const x = attachX - d * BRANCH.dx; // where the cause line meets the diagonal
        const y = isTop ? SPINE.y - d * BRANCH.dy : SPINE.y + d * BRANCH.dy;
        return {
          id: cause.id,
          fullText: cause.text,
          text: truncate(cause.text, maxChars),
          line: { x1: x - causeLen, y1: y, x2: x, y2: y },
        };
      });

      out[branchIndex] = {
        id: branch.id,
        side,
        color: branch.color,
        title: truncate(branch.title, 18),
        fullTitle: branch.title,
        attach,
        outer,
        labelBox,
        causeLen,
        maxChars,
        causes,
      };
    });
  }
  return out;
}
