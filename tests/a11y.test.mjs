// node tests/a11y.test.mjs — the accessibility settings are pure and shared with the game.
import assert from 'node:assert/strict';
import * as A from '../a11y.js';

// Defaults: everything off.
{
  const s = A.parseSettings('', null);
  assert.deepEqual(s, { large: false, contrast: false, calm: false, plain: false, mute: false });
}

// What the player saved comes back; unknown keys are dropped, broken JSON is ignored.
{
  assert.equal(A.parseSettings('', '{"large":true,"junk":1}').large, true);
  assert.equal(A.parseSettings('', '{"large":true,"junk":1}').junk, undefined);
  assert.equal(A.parseSettings('', '{not json').calm, false);
}

// ?a11y=large,calm lets a judge link a mode; it adds to what was saved.
{
  const s = A.parseSettings('?autoplay&a11y=large,calm,nope', '{"mute":true}');
  assert.deepEqual(s, { large: true, contrast: false, calm: true, plain: false, mute: true });
}

// Large text scales fonts by 1.3 and rounds; calm speed is 30% slower.
{
  assert.equal(A.fontPx(16, { large: false }), 16);
  assert.equal(A.fontPx(16, { large: true }), 21);
  assert.equal(A.speedFactor({ calm: true }), 0.7);
  assert.equal(A.speedFactor({ calm: false }), 1);
}

// Plain words: the same fact in everyday language, numbers untouched; off = unchanged.
{
  const on = { plain: true }, off = { plain: false };
  assert.equal(A.plain('Car repair $2.0k: $1.5k on the card at 24%', on), 'Car repair $2.0k: $1.5k borrowed at 24% a year');
  assert.equal(A.plain('Card debt $0.0k', on), 'Borrowed $0.0k');
  assert.equal(A.plain('Score = joy along the way + reaching a $300k nest egg at 67.', on), 'Score = joy along the way + reaching $300k of retirement money at 67.');
  assert.equal(A.plain('Card debt $0.0k', off), 'Card debt $0.0k');
}

// Toggle flips one key and serialises for localStorage.
{
  const s = A.parseSettings('', null);
  const t = A.toggle(s, 'contrast');
  assert.equal(t.contrast, true);
  assert.equal(s.contrast, false, 'toggle does not mutate');
  assert.equal(JSON.parse(A.serialize(t)).contrast, true);
}

console.log('a11y ok');
