# Snowball

A financial literacy game for [Zoud GameLab](https://itch.io/jam/zoud-gamelab) (theme: Make FinLit Fun), by Design Master Solutions.

Play: https://designmaster-solutions.github.io/snowball-zoud/ (attract mode: `?autoplay`)

Gameplay video on YouTube: https://youtu.be/9qOFznEEHeY (84 s, build 0.3 with the life stages and the employer match, recorded from the game with `?autoplay&record`, which waits for a tap and POSTs one webm with sound to `/upload`; 4 s title card from a screenshot of the same build): [docs/gameplay-v3.mp4](docs/gameplay-v3.mp4). Previous 0.2 cut: https://youtu.be/YimCBSvBMxg

For the jury: [concept doc](docs/CONCEPT.md) ([PDF](docs/CONCEPT.pdf)) · [game budget](docs/BUDGET.md) ([PDF](docs/BUDGET.pdf)) · itch page: https://designmastersolutions.itch.io/snowball

## The idea

You ski down a mountain from age 22 to 67, seen from above, pushing your savings snowball ahead of you. Money left alone grows 6% a year, so the ball
gets bigger on its own, and faster the bigger it is. That is compound growth, felt instead of explained.

- **Gold gates** are treats (a trip, a phone, a car) give joy, and each one comes out of the snowball. Joy depends on timing,
  not price: a $400 treat when you are worn down beats an $8k car when you are fine.
- **Blue flags** are skills: they raise how much you save every year.
- **Storms** (car repair, medical bill, job loss) cannot be dodged. Savings cover them; whatever savings cannot
  cover goes on a credit card at 24%, the card drags the ball (it steers slower) and your yearly saving pays the
  card first.
- **Mood** drops every year without a treat. At zero you burn out and splurge $3k anyway, with no joy: saving everything is not the
  answer either.

Score = joy along the way + security: the nest egg counts up to a $300k goal (about $12k/yr at the 4% rule) and
nothing past it, so hoarding scores the same as just reaching enough, and retiring in card debt scores negative.
Measured in `tests/econ.test.mjs`: never treating 400, a treat every few years 590-740, treating every year 138. At retirement the game prints a receipt of your priciest treat
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

## Controls

Tap, click or press space to start. Drag, or use the arrow keys (A/D), to steer. P or Esc pauses; on touch, the pause
button sits in the bottom-right corner. No timer runs while paused, so the game can be read at any pace.

## Accessibility and inclusion

Settings live on the title card and on the pause card (tap a chip or press 1-5), are saved on the device, and can be
linked for a class or a jury: `?a11y=large,contrast,calm,plain,mute`.

- **Large text**: every label, hint, toast and card 30% bigger; boxes grow with the text.
- **High contrast**: solid dark boxes behind every text, black outlines on the flags, a white chip behind the skill
  labels on snow.
- **Calm speed**: the slope runs 30% slower (the money model is per year of life, so nothing about the lesson changes).
- **Plain words**: finance words swapped for everyday ones ("card debt" becomes "borrowed", "nest egg" becomes
  "retirement money", "on the card at 24%" becomes "borrowed at 24% a year"); numbers and facts stay the same.
- **Sound off**: the game never depends on audio. Every sound has a visual twin: a toast with the same fact, in a colour
  that also carries the meaning (red for borrowing, green for covered, gold for a treat, blue for a skill).
- Treats, skills and storms differ by shape and text, not only by colour: gold gates with a price, blue flags with
  "+skill", a grey band with "STORM". Mood is a bar in the HUD, not just the sky getting greyer.
- Keyboard, mouse and touch all play the whole game; the slope slows to 40% while a tutorial hint is on screen.
- `tests/a11y.test.mjs` checks the settings (parsing, saving, the plain-words swaps): `node tests/a11y.test.mjs`.

## Built with

HTML5 canvas and plain JavaScript, no engine. Code written with an AI assistant (Claude), design and testing by us.
