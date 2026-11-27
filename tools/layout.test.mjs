/*
 * Automated tests. Run with:  npm test
 *
 * Uses Node's built-in test runner - no extra libraries. These tests check the
 * RULES of the app (limits, clearing, geometry) without needing a screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { layoutBranches, VIEW, LABEL, truncate, wrapText } from '../src/layout.js';
import { reducer, createInitialState, MAX_BRANCHES, MAX_CAUSES, MIN_BRANCHES } from '../src/state.js';

// Helper: apply a list of actions to a state, one after another.
const run = (state, ...actions) => actions.reduce(reducer, state);

test('starts with the six classic categories and no causes', () => {
  const s = createInitialState();
  assert.equal(s.branches.length, 6);
  assert.ok(s.branches.every((b) => b.causes.length === 0));
});

test('user can add exactly 3 extra branches, then it stops', () => {
  let s = createInitialState();
  for (let i = 0; i < 6; i++) s = reducer(s, { type: 'ADD_BRANCH' }); // try 6, only 3 should work
  assert.equal(s.branches.length, MAX_BRANCHES);
  assert.equal(MAX_BRANCHES, 9);
});

test('added branches get distinct colours', () => {
  let s = run(createInitialState(), { type: 'ADD_BRANCH' }, { type: 'ADD_BRANCH' }, { type: 'ADD_BRANCH' });
  assert.equal(new Set(s.branches.map((b) => b.color)).size, 9);
});

test('causes can be added, edited, removed, and are capped', () => {
  let s = createInitialState();
  const id = s.branches[0].id;
  for (let i = 0; i < MAX_CAUSES + 3; i++) s = reducer(s, { type: 'ADD_CAUSE', branchId: id });
  assert.equal(s.branches[0].causes.length, MAX_CAUSES);

  const cause = s.branches[0].causes[0];
  s = reducer(s, { type: 'SET_CAUSE', branchId: id, causeId: cause.id, value: 'Worn bearing' });
  assert.equal(s.branches[0].causes[0].text, 'Worn bearing');

  s = reducer(s, { type: 'REMOVE_CAUSE', branchId: id, causeId: cause.id });
  assert.equal(s.branches[0].causes.length, MAX_CAUSES - 1);
});

test('cannot remove branches below the minimum', () => {
  let s = createInitialState();
  for (let i = 0; i < 10; i++) s = reducer(s, { type: 'REMOVE_BRANCH', branchId: s.branches[0].id });
  assert.equal(s.branches.length, MIN_BRANCHES);
});

test('CLEAR wipes the problem, causes, and extra branches', () => {
  let s = createInitialState();
  s = run(
    s,
    { type: 'SET_EFFECT', value: 'Scrap rate too high' },
    { type: 'ADD_BRANCH' },
    { type: 'ADD_CAUSE', branchId: s.branches[0].id }
  );
  s = reducer(s, { type: 'CLEAR' });
  assert.equal(s.effect, '');
  assert.equal(s.branches.length, 6);
  assert.ok(s.branches.every((b) => b.causes.length === 0));
});

test('layout: every shape stays inside the canvas and labels never overlap', () => {
  // Try every branch count from 2 to 9, each with the maximum number of causes.
  for (let n = MIN_BRANCHES; n <= MAX_BRANCHES; n++) {
    let s = createInitialState();
    while (s.branches.length > n) s = reducer(s, { type: 'REMOVE_BRANCH', branchId: s.branches.at(-1).id });
    while (s.branches.length < n) s = reducer(s, { type: 'ADD_BRANCH' });
    s.branches.forEach((b) => {
      for (let i = 0; i < MAX_CAUSES; i++) s = reducer(s, { type: 'ADD_CAUSE', branchId: b.id });
    });

    const layout = layoutBranches(s.branches);

    for (const b of layout) {
      const { x, y, w, h } = b.labelBox;
      assert.ok(x >= 0 && x + w <= VIEW.width, `label x out of range (n=${n})`);
      assert.ok(y >= 0 && y + h <= VIEW.height, `label y out of range (n=${n})`);
      for (const c of b.causes) {
        assert.ok(c.line.x1 >= 0, `cause line off the left edge (n=${n})`);
        assert.ok(c.line.y1 > 0 && c.line.y1 < VIEW.height, `cause line off vertically (n=${n})`);
      }
    }

    // Neighbouring labels on the same side must not overlap horizontally.
    for (const side of ['top', 'bottom']) {
      const xs = layout.filter((b) => b.side === side).map((b) => b.labelBox.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= LABEL.w, `labels overlap (n=${n}, ${side})`);
    }
  }
});

test('text helpers', () => {
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('a very long cause description', 10).length, 10);
  assert.deepEqual(wrapText('Late customer deliveries', 14, 4), ['Late customer', 'deliveries']);
  assert.equal(wrapText('', 20, 4).length, 0);
});
