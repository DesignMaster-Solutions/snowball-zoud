# Snowball

A financial literacy game for [Zoud GameLab](https://itch.io/jam/zoud-gamelab) (theme: Make FinLit Fun), by Design Master Solutions.

Play: https://designmaster-solutions.github.io/snowball-zoud/ (attract mode: `?autoplay`)

## The idea

Your savings are a snowball rolling down a mountain from age 22 to 67. Money left alone grows 6% a year, so the ball
gets bigger on its own, and faster the bigger it is. That is compound growth, felt instead of explained.

- **Gold treats** (a trip, a phone, a car) give joy, and each one comes out of the snowball.
- **Blue skills** raise how much you save every year.
- **Storms** (car repair, medical bill, job loss) cannot be dodged. Savings cover them; whatever savings cannot
  cover goes on a credit card at 24%, the card drags the ball (it steers slower) and your yearly saving pays the
  card first.
- **Mood** drops every year without a treat. At zero you burn out and splurge anyway: saving everything is not the
  answer either.

Score = joy enjoyed along the way + what is left at 67. At retirement the game prints a receipt of your priciest treat
in future money ("Beach vacation at 25: $4k then, $46k at 67; the same trip at 60: $6k").

## What players learn by playing

1. Money invested early has the most years to grow (the same habit started 10 years later ends far smaller).
2. An emergency fund is what keeps a storm from becoming high-interest debt.
3. Card debt grows faster than savings, and it eats the money you meant to save.
4. Balance: treats matter, and a late treat costs far less future money than an early one.

## Numbers

`econ.js` is the whole money model (no DOM) and `tests/econ.test.mjs` checks it teaches true things:
`node tests/econ.test.mjs`. 6% is a long-run average for a diversified index fund, not a promise; 24% is a typical
card APR.

## Built with

HTML5 canvas and plain JavaScript, no engine. Code written with an AI assistant (Claude), design and testing by us.
