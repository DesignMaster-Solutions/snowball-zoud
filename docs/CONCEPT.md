# Snowball: concept doc / initial game design document

Zoud GameLab entry by Design Master Solutions LLC. Theme: Make FinLit Fun.
Play: https://designmaster-solutions.github.io/snowball-zoud/

## One line

Ski a whole working life, 22 to 67, pushing your savings snowball downhill: it grows on its own, treats take a bite,
storms you cannot dodge show why an emergency fund matters.

## Who it is for

Young adults (16-30) getting their first salary, and the teachers and programs that want to talk money with them
without a lecture. One run takes about 3 minutes, so it fits a class, a commute or a waiting room.

## The learning goal, as mechanics

| Idea | How the player feels it (no text, no quiz) |
|---|---|
| Compound growth | The ball grows 6% a year by itself and gets bigger faster the bigger it is |
| Start early | The same saving habit started later ends with a visibly smaller ball |
| Emergency fund | Storms (car repair, medical bill, job loss, roof leak, vet bill) cannot be dodged; savings absorb them |
| High-interest debt | What savings cannot cover goes on a card at 24%; the card drags the ball (slower steering) and eats the yearly saving first |
| Balance | Mood falls every year without a treat; at zero you burn out and splurge $3k with no joy |
| Timing of spending | Joy from a treat depends on how worn down you are, not on its price |
| Enough is a goal | Security counts up to a $300k nest egg (about $12k/yr at the 4% rule) and nothing past it |

The first three rows of the slope are a tutorial played, not read: a blue flag (skills raise your yearly saving),
a gold gate (a $1k concert: joy now, a smaller snowball) and a storm (a $2k car repair the savings pay for).

## Core loop

1. Steer left and right (arrows, A/D or touch).
2. Gold gates = treats from a pool of everyday wants (concert, phone, trip, car, wedding party, remodel).
3. Blue flags = skills that raise the yearly contribution.
4. Storms arrive at random and hit everyone.
5. Every row is one year: savings grow, debt grows, the contribution pays debt first, mood drops.
6. At 67: score = joy + security, and a receipt of your priciest treat in future money
   ("Beach vacation at 25: $4k then, $46k at 67; the same trip at 60: $6k").

## Why this score

Measured in `tests/econ.test.mjs`: never treating scores 400, a treat every few years 590-740, treating every year 138.
The best play is neither hoarding nor spending: it is a plan with room for life. That is the lesson.

## Honesty of the numbers

6% is a long-run average for a diversified index fund, not a promise. 24% is a typical card APR. The money model is
one file (`econ.js`, no DOM) with tests that check it teaches true things.

## Where it goes with funding

See `docs/BUDGET.md`: mobile release, Arabic and English with dirham amounts, a classroom mode with a 10-minute
lesson plan, original art and sound, and playtests with real learners.

## Team and tools

Design Master Solutions LLC (USA), a software and design studio. HTML5 canvas and plain JavaScript, no engine,
runs in any browser. Code written with an AI assistant (Claude); design, balance and testing by us.
