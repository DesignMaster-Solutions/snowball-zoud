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

// Joy comes from the moment, not the price tag: a cheap treat when you are worn down beats a pricey one when you are fine.
{
  const a = E.newLife(); a.savings = 20; a.mood = 1; E.spend(a, 8, 'New car');
  const b = E.newLife(); b.savings = 20; b.mood = 0.1; E.spend(b, 0.4, 'Sneakers');
  assert.ok(b.joy > a.joy, `low-mood sneakers ${b.joy} should beat full-mood car ${a.joy}`);
  const c = E.newLife(); c.savings = 20; c.mood = 0.1; E.spend(c, 8, 'New car');
  assert.equal(c.joy, b.joy, 'same moment, same joy, whatever it costs');
}

// A burnout splurge costs money and brings no joy.
{
  const s = E.newLife(); s.savings = 5; s.mood = 0;
  E.spend(s, 3, 'Burnout splurge', 'burnout');
  assert.equal(s.joy, 0);
  close(s.savings, 2, 'burnout still costs');
  assert.ok(s.mood > 0 && s.mood < 1, 'burnout only half recovers mood');
}

// Security counts up to the retirement goal; money hoarded past it adds nothing, debt at the end costs.
{
  const at = (net) => { const s = E.newLife(); s.savings = Math.max(0, net); s.debt = Math.max(0, -net); return E.score(s); };
  assert.equal(at(E.GOAL), E.SECURITY_POINTS);
  assert.equal(at(E.GOAL * 2), E.SECURITY_POINTS, 'past the goal is unused money');
  assert.equal(at(E.GOAL / 2), E.SECURITY_POINTS / 2);
  assert.ok(at(-20) < 0, 'retiring in debt is negative');
}

// The balance the game is built on: a few well-timed treats + reaching the goal beats both extremes.
{
  const life = (treatEvery, cost) => {
    const s = E.newLife();
    while (s.age < E.END_AGE) {
      if (treatEvery && s.age % treatEvery === 0) E.spend(s, cost, 'Treat');
      E.tickYear(s);
      if (s.mood <= 0) E.spend(s, 3, 'Burnout splurge', 'burnout');
    }
    return E.score(s);
  };
  const miser = life(0), balanced = life(5, 1), spender = life(1, 4);
  assert.ok(balanced > miser, `balanced ${balanced} vs miser ${miser}`);
  assert.ok(balanced > spender, `balanced ${balanced} vs spender ${spender}`);
}

// Life stages: temptations and storms change with age, and every age maps to a stage.
{
  assert.equal(E.stageAt(22).name, 'First job');
  assert.equal(E.stageAt(40).name, 'Family years');
  assert.equal(E.stageAt(66).name, 'Almost there');
  const young = E.stageAt(22).wants.map(w => w[0]), old = E.stageAt(60).wants.map(w => w[0]);
  assert.ok(!young.includes('Cruise') && old.includes('Cruise'), 'wants follow the age');
  for (const s of E.STAGES) for (const [, c] of [...s.wants, ...s.storms]) assert.ok(c > 0 && c < 10, `${s.name} cost ${c}`);
}
