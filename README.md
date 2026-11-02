# Snowball

A financial literacy game for [Zoud GameLab](https://itch.io/jam/zoud-gamelab) (theme: Make FinLit Fun), by Design Master Solutions.

Play: https://designmaster-solutions.github.io/snowball-zoud/ (attract mode: `?autoplay`)

Gameplay video on YouTube: https://youtu.be/s3qtXGRBc7I (1:59, the submitted build 0.5: a full life in the Global edition, then the UAE edition in Arabic from 1:26; recorded from the game with `?autoplay&record&edition=global|uae-ar`, which waits for a tap and POSTs one webm with sound to `/upload`; 3 s title cards from screenshots of the same build): [docs/gameplay-v5.mp4](docs/gameplay-v5.mp4). Earlier cuts: 0.3 https://youtu.be/9qOFznEEHeY , 0.2 https://youtu.be/YimCBSvBMxg

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
Measured in `tests/econ.test.mjs`, saving $3k a year: never treating 400, a $1k treat every 2 to 5 years 593-740, a $1k treat every year 938, a $4k treat every year (more than you save) 138. At retirement the game prints a receipt of your priciest treat
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

## UAE edition and Arabic (النسخة الإماراتية بالعربية)

Three editions, one money model: **Global ($)**, **UAE (AED)** in English and **الإمارات (عربي)**, the UAE edition fully
in Arabic with a right-to-left layout (HUD, cards, chips and toasts read from the right). Pick one on the title or pause
card (tap a chip, or press L), or link it: `?edition=uae` / `?edition=uae-ar`. A device set to Arabic opens in Arabic, a
Gulf time zone opens the UAE edition; the choice is saved on the device.

What changes in the UAE editions, and why (all in `region.js`, checked by `tests/region.test.mjs`):

- **Dirhams.** Every amount is shown in AED at the 3.6725 peg; the goal is AED 1.1M at 67. The model still runs in one
  currency, so the balance and the lessons are the same in every edition.
- **Profit, not interest.** The snowball sits in a Sharia-compliant fund and grows about 6% a year from profit. Borrowing
  is still priced honestly: UAE cards charge about 3% a month, so a storm that savings cannot cover goes on the card at
  36% a year (the global edition uses 24%).
- **Zakat.** Once a year, 2.5% of what you own (savings minus debt) when it reaches the nisab, the value of 85 g of gold.
  The game fixes the nisab at AED 35k (the real figure moves with the gold price). Zakat leaves the snowball, but the score
  counts it at what it would have grown to by 67, so the money given still counts in your score. Players it does not apply to can turn
  the Zakat chip off (or press Z).
- **End-of-service gratuity.** The US "employer match" becomes a gratuity savings plan: the UAE's optional scheme (2023)
  where the employer invests your end-of-service money for you instead of paying it as a lump sum when you leave.
- **Gulf life.** Treats and storms are priced and named for the UAE: a weekend in Oman, desert camping gear, Eid shopping and
  Eidiya, a summer trip, a new SUV, a majlis makeover; storms such as the rent deposit and agent fee when you move, the rent
  increase at renewal, school fees rising, a medical bill outside insurance, an AC breakdown in August, job loss.

The Arabic text was drafted with an AI assistant and checked in the game on a real device; a review by a native speaker is
in the budget (`docs/BUDGET.md`, line 4) before any release outside the jam.

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

HTML5 canvas and plain JavaScript, no engine. Built with an AI coding agent (Claude) under the author's direction: the code, the Arabic text, and drafts of the design and documents. No AI images, music or voice.
