import * as E from './econ.js';

const W = 960, H = 600, BALL_Y = 470;
const YEAR_PX = 260;          // slope distance that equals one year of life
const SPEED = 170;            // px per second, so a year is ~1.5 s and a life ~70 s
const params = new URLSearchParams(location.search);
const AUTO = params.has('autoplay');

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let scale = 1;
function fit() {
  scale = Math.min(innerWidth / W, innerHeight / H);
  cv.width = W * devicePixelRatio * scale; cv.height = H * devicePixelRatio * scale;
  cv.style.width = W * scale + 'px'; cv.style.height = H * scale + 'px';
  ctx.setTransform(devicePixelRatio * scale, 0, 0, devicePixelRatio * scale, 0, 0);
}
addEventListener('resize', fit); fit();

const WANTS = [
  ['Concert', 1], ['New phone', 1.2], ['Weekend trip', 2], ['Dinner out', 0.5], ['Gaming PC', 2.5],
  ['Beach vacation', 4], ['Sneakers', 0.4], ['New car', 8], ['Wedding party', 6], ['Kitchen remodel', 5],
];
const STORMS = [['Car repair', 2], ['Medical bill', 3], ['Job loss', 6], ['Roof leak', 4], ['Vet bill', 1.5]];

let st, life, objs, dist, nextYearAt, toasts, flakes, phase, steerX, keys = {};

function reset() {
  life = E.newLife(); objs = []; toasts = []; dist = 0; nextYearAt = YEAR_PX;
  steerX = W / 2; phase = 'title';
  flakes = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2 }));
  st = { x: W / 2, spawnAt: 120, stormYears: 0 };
}
reset();

// Content arrives in rows. Wants and skills sit in lanes you can steer into or around; storms span the slope.
function spawnRow(y) {
  const lanes = [W * 0.2, W * 0.5, W * 0.8].sort(() => Math.random() - 0.5);
  const yearsLeft = E.END_AGE - life.age;
  if (yearsLeft > 1 && st.stormYears >= 4 && Math.random() < 0.45) {
    const [label, cost] = STORMS[Math.floor(Math.random() * STORMS.length)];
    objs.push({ kind: 'storm', y, label, cost, hit: false });
    st.stormYears = 0;
    return;
  }
  const [label, cost] = WANTS[Math.floor(Math.random() * WANTS.length)];
  objs.push({ kind: 'want', x: lanes[0], y, label, cost, w: 170, hit: false });
  if (Math.random() < 0.3) objs.push({ kind: 'skill', x: lanes[1], y: y - 40, label: 'Learn a skill', amt: 0.5, w: 70, hit: false });
}

function toast(text, color) { toasts.push({ text, color, t: 0 }); }

function ballR() { return 14 + Math.sqrt(Math.max(0, life.savings)) * 3.2; }

function money(k) {
  const v = Math.abs(k);
  const s = v >= 1000 ? (v / 1000).toFixed(2) + 'M' : v >= 10 ? v.toFixed(0) + 'k' : v.toFixed(1) + 'k';
  return (k < 0 ? '-$' : '$') + s;
}

function update(dt) {
  if (phase !== 'play') return;
  const step = SPEED * dt;
  dist += step;
  for (const f of flakes) { f.y += step * (0.6 + f.r * 0.3); if (f.y > H) { f.y = -5; f.x = Math.random() * W; } }

  // Steering: pointer target, arrow keys, or the attract-mode pilot.
  if (keys.ArrowLeft || keys.a) steerX -= 520 * dt;
  if (keys.ArrowRight || keys.d) steerX += 520 * dt;
  if (AUTO) steerX = pilot();
  steerX = Math.max(60, Math.min(W - 60, steerX));
  const drag = life.debt > 0 ? 0.35 : 1; // debt is a weight: the ball answers slower
  st.x += (steerX - st.x) * Math.min(1, dt * 6 * drag);

  if (dist >= st.spawnAt) { spawnRow(-60); st.spawnAt += YEAR_PX * 0.75; }
  for (const o of objs) o.y += step;

  const r = ballR();
  for (const o of objs) {
    if (o.hit) continue;
    if (o.kind === 'storm' && o.y >= BALL_Y) {
      o.hit = true;
      const before = life.savings;
      E.spend(life, o.cost, o.label, 'emergency');
      const borrowed = o.cost - Math.min(o.cost, before);
      toast(borrowed > 0 ? `${o.label} ${money(o.cost)}: ${money(borrowed)} on the card at 24%` : `${o.label} ${money(o.cost)}: covered by savings`, borrowed > 0 ? '#ff6b6b' : '#9be7a4');
    } else if (o.kind !== 'storm' && Math.abs(o.y - BALL_Y) < r && Math.abs(o.x - st.x) < o.w / 2 + r * 0.6) {
      o.hit = true;
      if (o.kind === 'want') { const j = E.treatJoy(life.mood); E.spend(life, o.cost, o.label); toast(`${o.label} ${money(-o.cost)}  +${j} joy`, '#ffd166'); }
      else { E.raise(life, o.amt); toast(`New skill: saving ${money(life.contribution)}/yr`, '#7cc6ff'); }
    }
  }
  objs = objs.filter(o => o.y < H + 80);

  if (dist >= nextYearAt) {
    nextYearAt += YEAR_PX;
    E.tickYear(life);
    st.stormYears++;
    if (life.mood <= 0) { E.spend(life, 3, 'Burnout splurge', 'burnout'); toast('Burnout! You splurged $3k and it did not even help', '#ff9f43'); }
    if (life.age >= E.END_AGE) { phase = 'end'; objs = []; }
  }
  for (const t of toasts) t.t += dt;
  toasts = toasts.filter(t => t.t < 2.6);
}

// Attract mode: treat yourself when mood runs low, catch skills, otherwise stay away from wants.
function pilot() {
  const ahead = objs.filter(o => !o.hit && o.kind !== 'storm' && o.y < BALL_Y && o.y > BALL_Y - 260);
  const want = ahead.find(o => o.kind === 'want');
  const skill = ahead.find(o => o.kind === 'skill');
  if (skill) return skill.x;
  if (want && life.mood < 0.45 && want.cost <= Math.max(1, life.savings * 0.3)) return want.x;
  const lanes = [W * 0.2, W * 0.5, W * 0.8];
  const free = lanes.filter(x => !ahead.some(o => o.kind === 'want' && Math.abs(o.x - x) < 120));
  return free.length ? free.reduce((a, b) => Math.abs(a - st.x) < Math.abs(b - st.x) ? a : b) : st.x;
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const gray = 1 - life.mood;
  g.addColorStop(0, `hsl(205,${45 - gray * 30}%,${88 - gray * 10}%)`);
  g.addColorStop(1, `hsl(205,${30 - gray * 20}%,${97 - gray * 8}%)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // ski tracks / year markers
  ctx.strokeStyle = 'rgba(40,70,100,0.12)'; ctx.lineWidth = 2;
  const off = dist % YEAR_PX;
  for (let y = off - YEAR_PX; y < H; y += YEAR_PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const f of flakes) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }

  for (const o of objs) {
    if (o.kind === 'storm') {
      ctx.fillStyle = o.hit ? 'rgba(80,90,110,0.15)' : 'rgba(60,70,95,0.55)';
      ctx.fillRect(0, o.y - 28, W, 56);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(`STORM  ${o.label}  ${money(o.cost)}  (can't dodge this one)`, W / 2, o.y + 8);
    } else if (o.kind === 'want') {
      if (o.hit) continue;
      ctx.fillStyle = '#ffd166'; roundRect(o.x - o.w / 2, o.y - 22, o.w, 44, 10); ctx.fill();
      ctx.fillStyle = '#3d2c00'; ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(`${o.label} ${money(o.cost)}`, o.x, o.y + 6);
    } else if (!o.hit) {
      ctx.fillStyle = '#7cc6ff'; ctx.beginPath(); ctx.arc(o.x, o.y, 22, 0, 7); ctx.fill();
      ctx.fillStyle = '#05314f'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('+skill', o.x, o.y + 5);
    }
  }

  // the snowball, with a red chain when there is debt
  const r = ballR();
  if (life.debt > 0) {
    ctx.strokeStyle = '#d64545'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(st.x, BALL_Y); ctx.lineTo(st.x, H); ctx.stroke(); ctx.setLineDash([]);
  }
  const bg = ctx.createRadialGradient(st.x - r / 3, BALL_Y - r / 3, r / 5, st.x, BALL_Y, r);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#c9dcec');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(st.x, BALL_Y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#18324a'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(money(life.savings), st.x, BALL_Y + 5);

  hud();
  ctx.textAlign = 'center';
  toasts.forEach((t, i) => {
    ctx.globalAlpha = Math.min(1, 2.6 - t.t);
    ctx.fillStyle = 'rgba(14,26,36,0.8)'; roundRect(W / 2 - 290, 70 + i * 40, 580, 32, 8); ctx.fill();
    ctx.fillStyle = t.color; ctx.font = 'bold 16px system-ui'; ctx.fillText(t.text, W / 2, 92 + i * 40);
    ctx.globalAlpha = 1;
  });
  if (phase === 'title') titleCard();
  if (phase === 'end') endCard();
}

function hud() {
  ctx.fillStyle = 'rgba(14,26,36,0.82)'; ctx.fillRect(0, 0, W, 50);
  ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'left';
  const items = [
    [`Age ${life.age}`, '#fff'], [`Savings ${money(life.savings)}`, '#e8f4ff'],
    [`Saving ${money(life.contribution)}/yr`, '#7cc6ff'], [`Card debt ${money(life.debt)}`, life.debt > 0 ? '#ff6b6b' : '#8aa'],
    [`Joy ${Math.round(life.joy)}`, '#ffd166'],
  ];
  let x = 18;
  for (const [t, c] of items) { ctx.fillStyle = c; ctx.fillText(t, x, 32); x += ctx.measureText(t).width + 30; }
  ctx.fillStyle = '#334'; ctx.fillRect(W - 150, 18, 130, 14);
  ctx.fillStyle = life.mood > 0.35 ? '#ffd166' : '#ff9f43'; ctx.fillRect(W - 150, 18, 130 * life.mood, 14);
  ctx.fillStyle = '#ccd'; ctx.font = '12px system-ui'; ctx.fillText('mood', W - 192, 30);
}

function panel(lines, foot) {
  ctx.fillStyle = 'rgba(14,26,36,0.9)'; roundRect(130, 90, W - 260, H - 170, 18); ctx.fill();
  ctx.textAlign = 'center';
  let y = 150;
  for (const [t, size, c] of lines) { ctx.fillStyle = c || '#e8f4ff'; ctx.font = `${size >= 30 ? 'bold ' : ''}${size}px system-ui`; ctx.fillText(t, W / 2, y); y += size + 16; }
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 20px system-ui'; ctx.fillText(foot, W / 2, H - 110);
}

function titleCard() {
  panel([
    ['SNOWBALL', 54, '#fff'],
    ['Your savings roll downhill from age 22 to 67. Money left alone grows 6% a year.', 18],
    ['Steer into gold treats to stay happy. Each one comes out of the snowball,', 18],
    ['and a treat brings more joy when your mood is low, whatever it costs.', 18],
    ['Catch blue skills to save more each year. Storms hit everyone:', 18],
    ['savings cover them, or the rest goes on a card at 24%.', 18],
    [`Score = joy along the way + reaching a ${money(E.GOAL)} nest egg at 67. Past the goal, money adds nothing.`, 17, '#ffd166'],
  ], 'Tap, click or press space to start · drag or arrows to steer');
}

function endCard() {
  const p = E.priciestWant(life);
  const lines = [
    ['Retired at 67', 40, '#fff'],
    [`Score ${E.score(life)}   (joy ${Math.round(life.joy)} + security ${E.security(life)})`, 22, '#ffd166'],
    [`Nest egg ${money(life.savings - life.debt)} of a ${money(E.GOAL)} goal${life.savings - life.debt > E.GOAL * 1.3 ? ': you could have enjoyed more' : ''}`, 18, '#e8f4ff'],
    [`Card interest you paid: ${money(life.interestPaid)}`, 18, life.interestPaid > 0 ? '#ff6b6b' : '#9be7a4'],
  ];
  if (p) lines.push([`Your priciest treat: ${p.label} at ${p.age} cost ${money(p.cost)} then,`, 18],
    [`${money(p.fv)} of money at 67. Same treat at 60: ${money(E.futureValue(p.cost, 60))}.`, 18, '#7cc6ff']);
  lines.push(['Early money has the most years to grow. Late treats are cheap, early debt is expensive.', 16, '#bcd']);
  panel(lines, 'Tap to live it again');
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function start() { if (phase === 'title') phase = 'play'; else if (phase === 'end') { reset(); phase = 'play'; } }
cv.addEventListener('pointerdown', e => { start(); steerX = e.offsetX / scale; });
cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') steerX = e.offsetX / scale; });
addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ' || e.key === 'Enter') start(); });
addEventListener('keyup', e => { keys[e.key] = false; });
if (AUTO) setTimeout(start, 1500);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
