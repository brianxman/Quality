/*
 * EditorPanel.jsx  -  the text-entry side of the app.
 *
 * Why a separate panel instead of typing directly on the diagram? Real <input>
 * elements give us the iPad on-screen keyboard, autocorrect, dictation, and
 * cursor handling for free. The diagram simply mirrors what's typed here.
 *
 * Two small components live in this file:
 *   TextField   - an <input> that can be told to grab keyboard focus
 *   BranchCard  - one category: its title, its causes, and its buttons
 */
import { useEffect, useRef } from 'react';
import { MAX_CAUSES, MIN_BRANCHES } from '../state.js';

/**
 * A text input with one extra trick: when `focusId` equals this field's `id`,
 * it moves the cursor into itself. That is how tapping a cause on the diagram
 * lands the user straight in the matching text box.
 */
function TextField({ id, focusId, onFocused, selectOnFocus, ...inputProps }) {
  const ref = useRef(null);

  useEffect(() => {
    if (focusId === id && ref.current) {
      ref.current.focus();
      if (selectOnFocus) ref.current.select(); // highlight text so typing replaces it
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      onFocused(); // tell the reducer the request has been handled
    }
    // Re-run whenever someone asks for focus on a (possibly different) field.
  }, [focusId, id, onFocused, selectOnFocus]);

  return <input ref={ref} {...inputProps} />;
}

function BranchCard({ branch, selected, focusId, dispatch, canRemove, onFocused }) {
  const cardRef = useRef(null);

  // When this branch becomes selected (e.g. tapped on the diagram), scroll it into view.
  useEffect(() => {
    if (selected && cardRef.current) cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const atCauseLimit = branch.causes.length >= MAX_CAUSES;

  return (
    <div
      ref={cardRef}
      className={`card ${selected ? 'open' : ''}`}
      style={{ '--branch-color': branch.color }}
    >
      {/* Header row: always visible. Tapping it selects (expands) the card. */}
      <div className="card-head" onClick={() => dispatch({ type: 'SELECT', branchId: branch.id })}>
        <span className="swatch" aria-hidden="true" />
        <TextField
          id={branch.id}
          focusId={focusId}
          onFocused={onFocused}
          selectOnFocus
          className="title-input"
          value={branch.title}
          placeholder="Category name"
          aria-label="Category name"
          maxLength={40}
          onFocus={() => dispatch({ type: 'SELECT', branchId: branch.id })}
          onChange={(e) => dispatch({ type: 'SET_TITLE', branchId: branch.id, value: e.target.value })}
        />
        <span className="count" aria-label={`${branch.causes.length} causes`}>
          {branch.causes.length}
        </span>
      </div>

      {/* Body: only shown for the selected card, which keeps the panel short. */}
      {selected && (
        <div className="card-body">
          {branch.causes.map((cause, i) => (
            <div className="cause-row" key={cause.id}>
              <TextField
                id={cause.id}
                focusId={focusId}
                onFocused={onFocused}
                value={cause.text}
                placeholder={`Cause ${i + 1}`}
                aria-label={`Cause ${i + 1} for ${branch.title}`}
                maxLength={80}
                onChange={(e) =>
                  dispatch({ type: 'SET_CAUSE', branchId: branch.id, causeId: cause.id, value: e.target.value })
                }
                // Pressing Return on the keyboard adds the next cause - fast data entry.
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cause.text.trim() && !atCauseLimit) {
                    e.preventDefault();
                    dispatch({ type: 'ADD_CAUSE', branchId: branch.id });
                  }
                }}
              />
              <button
                className="icon-btn"
                aria-label={`Remove cause ${i + 1}`}
                onClick={() => dispatch({ type: 'REMOVE_CAUSE', branchId: branch.id, causeId: cause.id })}
              >
                &times;
              </button>
            </div>
          ))}

          <div className="card-buttons">
            <button
              className="btn btn-small"
              disabled={atCauseLimit}
              onClick={() => dispatch({ type: 'ADD_CAUSE', branchId: branch.id })}
            >
              + Add cause{atCauseLimit ? ` (max ${MAX_CAUSES})` : ''}
            </button>

            {canRemove && (
              <button
                className="btn btn-small btn-ghost"
                onClick={() => dispatch({ type: 'REMOVE_BRANCH', branchId: branch.id })}
              >
                Remove branch
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPanel({ state, dispatch }) {
  // A stable function (not re-created every render) so the TextField effect doesn't re-fire needlessly.
  const onFocused = useRef(() => dispatch({ type: 'FOCUS_DONE' })).current;

  return (
    <aside className="panel" aria-label="Diagram editor">
      <label className="effect-field">
        <span className="field-label">Problem / effect</span>
        <TextField
          id="effect"
          focusId={state.focusId}
          onFocused={onFocused}
          value={state.effect}
          placeholder="e.g. Late customer deliveries"
          maxLength={90}
          onChange={(e) => dispatch({ type: 'SET_EFFECT', value: e.target.value })}
        />
      </label>

      <h2 className="field-label">Categories &amp; causes</h2>
      <p className="hint">Tap a category to open it. Press Return to add the next cause.</p>

      {state.branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          selected={branch.id === state.selectedId}
          focusId={state.focusId}
          dispatch={dispatch}
          canRemove={state.branches.length > MIN_BRANCHES}
          onFocused={onFocused}
        />
      ))}
    </aside>
  );
}
