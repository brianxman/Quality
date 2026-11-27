/*
 * App.jsx  -  the top-level component. It owns the state and wires the pieces together.
 *
 *   App
 *   |-- header bar      (title, Add branch, Clear, Editor toggle)
 *   |-- FishboneDiagram (draws the fish as SVG; tap things to edit them)
 *   |-- EditorPanel     (text fields for the problem, branch titles, causes)
 *   `-- ConfirmDialog   (the "are you sure?" box for Clear)
 */
import { useEffect, useMemo, useReducer, useState } from 'react';
import FishboneDiagram from './components/FishboneDiagram.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import { reducer, MAX_BRANCHES } from './state.js';
import { loadState, saveState } from './storage.js';
import { layoutBranches } from './layout.js';

export default function App() {
  // useReducer(reducer, initialArg, init): the third argument runs ONCE at start,
  // so we load the saved diagram only on first render (not on every update).
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Pure UI state (not part of the diagram data):
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Auto-save whenever the diagram changes.
  useEffect(() => saveState(state), [state]);

  // Recompute the geometry only when the branches change (useMemo = cached result).
  const layout = useMemo(() => layoutBranches(state.branches), [state.branches]);

  const branchesLeft = MAX_BRANCHES - state.branches.length;

  // Tapping something on the diagram selects it AND asks the editor to focus the
  // matching text field. The editor must be visible for that to work, so open it.
  const selectOnDiagram = (branchId, focusId) => {
    setPanelOpen(true);
    dispatch({ type: 'SELECT', branchId, focusId });
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="logo" aria-hidden="true">
            &#x1F41F;
          </span>
          Fishbone Builder
        </h1>

        <div className="actions">
          <button
            className="btn"
            onClick={() => dispatch({ type: 'ADD_BRANCH' })}
            disabled={branchesLeft === 0}
            title="Add another category branch"
          >
            + Add branch{branchesLeft > 0 ? ` (${branchesLeft} left)` : ' (max)'}
          </button>

          <button className="btn" onClick={() => setPanelOpen((open) => !open)} aria-pressed={panelOpen}>
            {panelOpen ? 'Hide editor' : 'Show editor'}
          </button>

          <button className="btn btn-danger" onClick={() => setConfirmingClear(true)}>
            Clear diagram
          </button>
        </div>
      </header>

      <main className={`workspace ${panelOpen ? 'with-panel' : ''}`}>
        <section className="diagram-card" aria-label="Fishbone diagram">
          <FishboneDiagram
            effect={state.effect}
            layout={layout}
            selectedId={state.selectedId}
            onSelectBranch={(branchId) => selectOnDiagram(branchId, null)}
            onEditTitle={(branchId) => selectOnDiagram(branchId, branchId)}
            onEditCause={(branchId, causeId) => selectOnDiagram(branchId, causeId)}
            onEditEffect={() => selectOnDiagram(state.selectedId, 'effect')}
          />
        </section>

        {panelOpen && <EditorPanel state={state} dispatch={dispatch} />}
      </main>

      {confirmingClear && (
        <ConfirmDialog
          title="Clear the whole diagram?"
          message="This erases the problem statement, every cause, and any branches you added. It cannot be undone."
          confirmLabel="Clear everything"
          onCancel={() => setConfirmingClear(false)}
          onConfirm={() => {
            dispatch({ type: 'CLEAR' });
            setConfirmingClear(false);
          }}
        />
      )}
    </div>
  );
}
