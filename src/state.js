/*
 * state.js  -  the "data model" and the rules for changing it.
 *
 * React pattern used here: a REDUCER.
 *   A reducer is a plain function:  (currentState, action) => newState
 * The UI never edits state directly. It describes WHAT happened ("user typed in
 * cause #3") by dispatching an action, and the reducer decides the new state.
 * Benefits: all rules live in one place, they're easy to test, and React can
 * tell exactly what changed so it only redraws what it must.
 *
 * Shape of the state:
 * {
 *   effect:     "Late deliveries",              // the problem statement (fish head)
 *   branches: [ { id, title, color, causes: [ { id, text } ] } ],
 *   selectedId: "<branch id or null>",          // which branch is highlighted
 *   focusId:    "<id of the input to focus>",   // UI hint: "put the cursor here"
 * }
 */

// ---- Limits -----------------------------------------------------------------
export const DEFAULT_CATEGORIES = ['Machine', 'Method', 'Material', 'People', 'Measurement', 'Environment']; // the classic "6 M's"
export const MAX_EXTRA_BRANCHES = 3; // user may add up to 3 more branches
export const MAX_BRANCHES = DEFAULT_CATEGORIES.length + MAX_EXTRA_BRANCHES; // = 9
export const MIN_BRANCHES = 2; // keeps the diagram looking like a fish
export const MAX_CAUSES = 7; // per branch, so the text stays readable

// One colour per branch slot so categories are easy to tell apart.
// All are dark enough for white label text to be readable.
const PALETTE = ['#0f4c5c', '#7a1f5c', '#9a031e', '#b5541c', '#2a7f62', '#3d5a80', '#6b5b95', '#4f772d', '#8a5a16'];

// ---- Helpers ----------------------------------------------------------------
/** A short random id. Enough to tell items apart inside one diagram. */
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

/** Pick a colour that no existing branch is using (falls back to cycling). */
function nextColor(branches) {
  const used = new Set(branches.map((b) => b.color));
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[branches.length % PALETTE.length];
}

const makeBranch = (title, color) => ({ id: uid(), title, color, causes: [] });

/** A brand-new, empty diagram with the six classic categories. */
export function createInitialState() {
  return {
    effect: '',
    branches: DEFAULT_CATEGORIES.map((title, i) => makeBranch(title, PALETTE[i])),
    selectedId: null,
    focusId: null,
  };
}

/** Apply `change` to the one branch whose id matches; leave the others alone. */
const updateBranch = (state, branchId, change) => ({
  ...state,
  branches: state.branches.map((b) => (b.id === branchId ? change(b) : b)),
});

// ---- The reducer ------------------------------------------------------------
export function reducer(state, action) {
  switch (action.type) {
    case 'SET_EFFECT':
      return { ...state, effect: action.value };

    case 'SELECT':
      // focusId (optional) asks the editor panel to put the cursor in that field.
      return { ...state, selectedId: action.branchId, focusId: action.focusId ?? null };

    case 'FOCUS_DONE':
      // The panel tells us it has moved the cursor, so we clear the request.
      return state.focusId === null ? state : { ...state, focusId: null };

    case 'SET_TITLE':
      return updateBranch(state, action.branchId, (b) => ({ ...b, title: action.value }));

    case 'ADD_CAUSE': {
      const branch = state.branches.find((b) => b.id === action.branchId);
      if (!branch || branch.causes.length >= MAX_CAUSES) return state; // at the limit
      const cause = { id: uid(), text: '' };
      return {
        ...updateBranch(state, action.branchId, (b) => ({ ...b, causes: [...b.causes, cause] })),
        selectedId: action.branchId,
        focusId: cause.id, // jump the cursor into the new empty cause
      };
    }

    case 'SET_CAUSE':
      return updateBranch(state, action.branchId, (b) => ({
        ...b,
        causes: b.causes.map((c) => (c.id === action.causeId ? { ...c, text: action.value } : c)),
      }));

    case 'REMOVE_CAUSE':
      return updateBranch(state, action.branchId, (b) => ({
        ...b,
        causes: b.causes.filter((c) => c.id !== action.causeId),
      }));

    case 'ADD_BRANCH': {
      if (state.branches.length >= MAX_BRANCHES) return state; // 6 default + 3 extra
      const branch = makeBranch('New category', nextColor(state.branches));
      return { ...state, branches: [...state.branches, branch], selectedId: branch.id, focusId: branch.id };
    }

    case 'REMOVE_BRANCH': {
      if (state.branches.length <= MIN_BRANCHES) return state;
      return {
        ...state,
        branches: state.branches.filter((b) => b.id !== action.branchId),
        selectedId: state.selectedId === action.branchId ? null : state.selectedId,
      };
    }

    case 'CLEAR':
      // "Start over": the problem, all causes, and any added branches are wiped.
      return createInitialState();

    default:
      return state;
  }
}
