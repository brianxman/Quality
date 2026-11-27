/*
 * FishboneDiagram.jsx  -  draws the fish.
 *
 * This component is "presentational": it receives ready-made coordinates from
 * layout.js and just turns them into SVG shapes. It holds no data of its own.
 *
 * SVG in one minute: <svg viewBox="0 0 1200 640"> defines a 1200x640 canvas that
 * scales to fit its container. Inside it, <line>, <rect>, and <text> place things
 * at x/y coordinates. React can render SVG tags exactly like HTML tags.
 */
import { VIEW, SPINE, HEAD, wrapText } from '../layout.js';

export default function FishboneDiagram({
  effect,
  layout,
  selectedId,
  onSelectBranch,
  onEditTitle,
  onEditCause,
  onEditEffect,
}) {
  // Wrap the problem statement into up to 4 short lines inside the head box.
  const effectLines = wrapText(effect, 20, 4);
  const lineHeight = 22;
  const firstY = HEAD.y + HEAD.h / 2 - ((Math.max(effectLines.length, 1) - 1) * lineHeight) / 2 + 12;

  return (
    <div className="diagram-scroll">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label="Fishbone cause and effect diagram"
        className="fishbone"
      >
        {/* ---- 1. The spine: the long horizontal backbone ---- */}
        <line
          x1={SPINE.startX}
          y1={SPINE.y}
          x2={SPINE.endX}
          y2={SPINE.y}
          className="spine"
        />

        {/* ---- 2. One group <g> per branch ---- */}
        {layout.map((b) => {
          const selected = b.id === selectedId;
          return (
            <g key={b.id} className={`branch ${selected ? 'selected' : ''}`} style={{ '--branch-color': b.color }}>
              {/* Invisible, extra-thick copy of the diagonal: a big touch target for fingers. */}
              <line
                x1={b.outer.x}
                y1={b.outer.y}
                x2={b.attach.x}
                y2={b.attach.y}
                className="branch-hit"
                onClick={() => onSelectBranch(b.id)}
              />
              {/* The visible diagonal bone. */}
              <line
                x1={b.outer.x}
                y1={b.outer.y}
                x2={b.attach.x}
                y2={b.attach.y}
                className="branch-line"
              />

              {/* Category label (a coloured box). Tap to rename. */}
              <g className="label" onClick={() => onEditTitle(b.id)}>
                <rect
                  x={b.labelBox.x}
                  y={b.labelBox.y}
                  width={b.labelBox.w}
                  height={b.labelBox.h}
                  rx="8"
                  className="label-box"
                />
                <text
                  x={b.labelBox.x + b.labelBox.w / 2}
                  y={b.labelBox.y + b.labelBox.h / 2 + 5}
                  textAnchor="middle"
                  className="label-text"
                >
                  {b.title || 'Untitled'}
                </text>
              </g>

              {/* Causes: a short horizontal line with text sitting on it. Tap to edit. */}
              {b.causes.map((c) => (
                <g key={c.id} className="cause" onClick={() => onEditCause(b.id, c.id)}>
                  {/* Transparent rectangle = bigger tap area than the text alone. */}
                  <rect
                    x={c.line.x1}
                    y={c.line.y1 - 26}
                    width={b.causeLen}
                    height={30}
                    className="cause-hit"
                  />
                  <line x1={c.line.x1} y1={c.line.y1} x2={c.line.x2} y2={c.line.y2} className="cause-line" />
                  <text x={c.line.x1 + 4} y={c.line.y1 - 7} className="cause-text">
                    {c.text || '…'}
                    {/* <title> shows the full text on hover, and is read by screen readers. */}
                    <title>{c.fullText}</title>
                  </text>
                </g>
              ))}
            </g>
          );
        })}

        {/* ---- 3. The head: the problem / effect ---- */}
        <g className="head" onClick={onEditEffect}>
          <rect x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} rx="14" className="head-box" />
          <text x={HEAD.x + HEAD.w / 2} y={HEAD.y + 24} textAnchor="middle" className="head-caption">
            PROBLEM / EFFECT
          </text>
          {effectLines.length === 0 ? (
            <text x={HEAD.x + HEAD.w / 2} y={HEAD.y + HEAD.h / 2 + 12} textAnchor="middle" className="head-placeholder">
              Tap to describe
              <tspan x={HEAD.x + HEAD.w / 2} dy="22">
                the problem
              </tspan>
            </text>
          ) : (
            effectLines.map((line, i) => (
              <text
                key={i}
                x={HEAD.x + HEAD.w / 2}
                y={firstY + i * lineHeight}
                textAnchor="middle"
                className="head-text"
              >
                {line}
              </text>
            ))
          )}
        </g>
      </svg>
    </div>
  );
}
