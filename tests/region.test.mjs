// node tests/region.test.mjs — the UAE editions say true things in the player's own money and language.
import assert from 'node:assert/strict';
import * as E from '../econ.js';
import * as R from '../region.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg}: ${a} != ${b}`);
const g = R.edition('global'), u = R.edition('uae'), ar = R.edition('uae-ar');

// Money: the model works in $k; the UAE editions print dirhams at the fixed peg.
assert.equal(g.money(3), '$3.0k');
assert.equal(g.money(300), '$300k');
assert.equal(u.money(1), 'AED 3.7k');
assert.equal(u.money(300), 'AED 1.10M');
assert.equal(u.money(-2), '-AED 7.3k');
assert.equal(ar.money(1), '3.7 ألف درهم');
assert.equal(ar.money(300), '1.10 مليون درهم');

// Edition choice: the link wins, then the saved choice, then the device (Arabic -> Arabic UAE, Gulf time zone -> UAE).
assert.equal(R.pickEdition('?edition=uae-ar', 'global'), 'uae-ar');
assert.equal(R.pickEdition('', 'uae'), 'uae');
assert.equal(R.pickEdition('', null, 'ar-AE'), 'uae-ar');
assert.equal(R.pickEdition('', null, 'en-GB', 'Asia/Dubai'), 'uae');
assert.equal(R.pickEdition('?edition=nope', null, 'pt-BR', 'America/Sao_Paulo'), 'global');

// Nothing in the Arabic edition falls back to English: every line the global game shows has an Arabic version.
for (const [k, v] of Object.entries(R.STR)) {
  if (v.global || v.uae) assert.ok(v.ar, `missing Arabic for ${k}`);
}
for (const st of ar.stages) {
  for (const [label, cost] of [...st.wants, ...st.storms]) {
    assert.ok(/[؀-ۿ]/.test(label), `stage item not in Arabic: ${label}`);
    assert.ok(cost > 0, `cost of ${label}`);
  }
}
// The UAE life is priced in dirhams: a job loss is AED 22k, i.e. $5.99k in model units.
const jobLoss = u.stageAt(22).storms.find(([l]) => l === 'Job loss');
close(jobLoss[1] * R.AED_PER_USD, 22, 'job loss in AED');
assert.equal(ar.stageAt(40).name, 'سنوات العائلة');
assert.equal(g.stageAt(40).name, 'Family years');
assert.equal(ar.t('stageToast', { age: 32, stage: ar.stageAt(32).name }), 'العمر 32: سنوات العائلة');

// Zakat: nothing below the nisab, 2.5% of what you own (savings minus debt) at or above it.
{
  const s = E.newLife();
  s.savings = R.NISAB * 0.9;
  assert.equal(E.zakatDue(s, R.NISAB), 0, 'below nisab');
  s.savings = 20; s.debt = 2;
  close(E.zakatDue(s, R.NISAB), 18 * 0.025, '2.5% of net wealth');
}

// Giving never lowers the score: zakat paid at 30 counts at what it would have grown to by 67.
{
  const run = (pay) => {
    const s = E.newLife();
    s.contribution = 2;
    while (s.age < E.END_AGE) {
      E.tickYear(s);
      if (pay && s.age === 30) E.give(s, E.zakatDue(s, R.NISAB));
    }
    return s;
  };
  const kept = run(false), gave = run(true);
  assert.ok(gave.given > 0, 'zakat was due at 30');
  assert.ok(gave.savings < kept.savings, 'the snowball is smaller');
  close(gave.savings + gave.givenFV, kept.savings, 'given money is counted as if kept');
  assert.equal(E.security(gave), E.security(kept));
}

// UAE cards cost about 3% a month: AED 18.4k of debt (=$5k) grows 36% in a year before the contribution pays it down.
{
  const s = E.newLife(); s.apr = u.apr;
  E.spend(s, 5, 'Car repair', 'emergency');
  E.tickYear(s);
  close(s.debt, 5 * 1.36 - 3, 'UAE card after one year');
  close(s.interestPaid, 1.8, 'UAE card charges tracked');
}

console.log('region ok');
