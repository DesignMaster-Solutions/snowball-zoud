// node tests/econ.test.mjs — checks the money model teaches true things.
import assert from 'node:assert/strict';
import * as E from '../econ.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg}: ${a} != ${b}`);

// Compound growth: $1k left alone for 10 years at 6% = $1.79k.
{
  const s = E.newLife();
  s.savings = 1; s.contribution = 0;
  for (let i = 0; i < 10; i++) E.tickYear(s);
  close(s.savings, 1.7908, 'compound growth');
}

// Starting early wins: saving $3k/yr from 22 beats the same from 32, by far more than the extra $30k put in.
{
  const run = (startAge) => {
    const s = E.newLife();
    while (s.age < E.END_AGE) { s.contribution = s.age >= startAge ? 3 : 0; E.tickYear(s); }
    return s.savings;
  };
  const early = run(22), late = run(32);
  assert.ok(early - late > 30 * 2, `early ${early} vs late ${late}`);
}

// Card debt: the contribution pays debt first, and debt grows at 24%.
{
  const s = E.newLife();
  E.spend(s, 5, 'Car repair', 'emergency');
  assert.equal(s.debt, 5);
  assert.equal(s.joy, 0, 'emergencies are not joy');
  E.tickYear(s); // 5 * 1.24 = 6.2, minus 3 paid
  close(s.debt, 3.2, 'debt after one year');
  close(s.savings, 0, 'nothing saved while in debt');
  close(s.interestPaid, 1.2, 'interest tracked');
}

// Wants come from savings first, the overflow is borrowed, and they refill mood.
{
  const s = E.newLife();
  s.savings = 2; s.mood = 0.1;
  E.spend(s, 3, 'Trip');
  close(s.savings, 0, 'savings used');
  close(s.debt, 1, 'overflow borrowed');
  assert.equal(s.mood, 1);
  assert.equal(s.log[0].borrowed, 1);
}

// The retirement receipt points at the early purchase, priced in future money.
{
  const s = E.newLife();
  s.savings = 10;
  s.age = 25; E.spend(s, 3, 'Trip');
  s.age = 60; E.spend(s, 3, 'Phone');
  const p = E.priciestWant(s);
  assert.equal(p.label, 'Trip');
  close(p.fv, 3 * Math.pow(1.06, 42), 'future value');
}

console.log('econ ok');
