// Pure money model for Snowball. No DOM: the game and tests/econ.test.mjs share it.
// Numbers are in thousands of dollars ($k) to keep labels short.

export const START_AGE = 22;
export const END_AGE = 67;
export const GROWTH = 0.06;   // long-run average yearly return of a diversified index fund, not a promise
export const DEBT_APR = 0.24; // typical credit card APR

export function newLife() {
  return { age: START_AGE, savings: 0, debt: 0, contribution: 3, joy: 0, interestPaid: 0, mood: 1, wants: [], log: [] };
}

// One year passes: savings grow, debt grows, the yearly contribution pays debt first.
export function tickYear(s) {
  s.savings *= 1 + GROWTH;
  s.interestPaid += s.debt * DEBT_APR;
  s.debt *= 1 + DEBT_APR;
  let pay = s.contribution;
  if (s.debt > 0) {
    const toDebt = Math.min(pay, s.debt);
    s.debt -= toDebt;
    pay -= toDebt;
  }
  s.savings += pay;
  s.mood = Math.max(0, s.mood - 0.12); // a year without treats wears you down
  s.age += 1;
  return s;
}

// Spending on something you want: comes out of savings, overflow becomes card debt.
export function spend(s, cost, label, kind = 'want') {
  const fromSavings = Math.min(cost, s.savings);
  s.savings -= fromSavings;
  s.debt += cost - fromSavings;
  if (kind === 'want') {
    s.joy += cost;
    s.mood = 1;
    s.wants.push({ label, cost, age: s.age });
  }
  s.log.push({ label, cost, age: s.age, kind, borrowed: cost - fromSavings });
  return s;
}

export function raise(s, amount) {
  s.contribution += amount;
  return s;
}

// What a purchase made at `age` would have grown to by END_AGE if it had stayed invested.
export function futureValue(cost, age) {
  return cost * Math.pow(1 + GROWTH, END_AGE - age);
}

// Lifetime joy = treats enjoyed along the way + what is left to live on at the end.
export function score(s) {
  return Math.round(s.joy + s.savings - s.debt);
}

// The receipt shown at retirement: the want that cost the most in future money.
export function priciestWant(s) {
  let best = null;
  for (const w of s.wants) {
    const fv = futureValue(w.cost, w.age);
    if (!best || fv > best.fv) best = { ...w, fv };
  }
  return best;
}
