import * as E from './econ.js';

const W = 960, H = 600, SKIER_Y = 150; // top-down: you ski down, the slope scrolls up
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

// The first three rows teach by doing: one of each, with a hint riding next to it.
const INTRO = [
  { kind: 'skill', label: 'Learn a skill', amt: 0.5, hint: 'Ski through blue flags: you save more every year' },
  { kind: 'want', label: 'Concert', cost: 1, hint: 'Gold gates are treats: joy now, a smaller snowball' },
  { kind: 'storm', label: 'Car repair', cost: 2, hint: 'Savings pay for storms. What they cannot pay goes on a card at 24%' },
];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

let st, life, objs, dist, nextYearAt, toasts, flakes, trees, trail, phase, steerX, keys = {};

function reset() {
  life = E.newLife(); objs = []; toasts = []; dist = 0; nextYearAt = YEAR_PX;
  steerX = W / 2; phase = 'title';
  flakes = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2 }));
  trees = Array.from({ length: 14 }, () => sideTree(Math.random() * H));
  trail = [];
  st = { x: W / 2, spawnAt: 120, stormYears: 0, intro: 0 };
}
reset();

// Content arrives in rows. Wants and skills sit in lanes you can steer into or around; storms span the slope.
function spawnRow(y) {
  const lanes = [W * 0.2, W * 0.5, W * 0.8].sort(() => Math.random() - 0.5);
  if (st.intro < INTRO.length) {
    const o = { ...INTRO[st.intro++], x: W / 2, y, w: 170, hit: false };
    if (o.kind === 'skill') o.w = 90;
    if (o.kind === 'storm') st.stormYears = 0; // the taught storm counts, so a random one does not follow right behind
    objs.push(o);
    return;
  }
  const yearsLeft = E.END_AGE - life.age;
  if (yearsLeft > 1 && st.stormYears >= 4 && Math.random() < 0.45) {
    const [label, cost] = pick(E.stageAt(life.age).storms);
    objs.push({ kind: 'storm', y, label, cost, hit: false });
    st.stormYears = 0;
    return;
  }
  const [label, cost] = pick(E.stageAt(life.age).wants);
  objs.push({ kind: 'want', x: lanes[0], y, label, cost, w: 170, hit: false });
  if (Math.random() < 0.3) objs.push({ kind: 'skill', x: lanes[1], y: y + 40, label: 'Learn a skill', amt: 0.5, w: 70, hit: false });
  // An employer match is free money: rarer than a skill, worth more, and only once you have a job that offers it.
  else if (life.age >= 25 && !st.matched && Math.random() < 0.2) objs.push({ kind: 'skill', x: lanes[1], y: y + 40, label: 'Employer match', amt: 1.5, w: 110, hit: false });
}

// Pines line both edges of the run; they are scenery, not obstacles.
function sideTree(y) {
  const left = Math.random() < 0.5;
  return { x: left ? 15 + Math.random() * 70 : W - 85 + Math.random() * 70, y, s: 0.8 + Math.random() * 0.6 };
}

function toast(text, color) { toasts = [...toasts.slice(-1), { text, color, t: 0 }]; } // two at most, above the skier

function ballR() { return 14 + Math.sqrt(Math.max(0, life.savings)) * 3.2; }
// The skier pushes the snowball downhill, so the ball sits just below and touches things first.
function ballY() { return SKIER_Y + 30 + ballR(); }

function money(k) {
  const v = Math.abs(k);
  const s = v >= 1000 ? (v / 1000).toFixed(2) + 'M' : v >= 10 ? v.toFixed(0) + 'k' : v.toFixed(1) + 'k';
  return (k < 0 ? '-$' : '$') + s;
}

function update(dt) {
  if (phase !== 'play') return;
  const teaching = objs.some(o => o.hint && !o.hit && o.y > ballY() - 40); // slow the slope while a hint is up, so it can be read
  const step = SPEED * dt * (teaching ? 0.4 : 1);
  dist += step;
  for (const f of flakes) { f.y -= step * (0.6 + f.r * 0.3); if (f.y < -5) { f.y = H + 5; f.x = Math.random() * W; } }
  for (const t of trees) { t.y -= step; if (t.y < -60) Object.assign(t, sideTree(H + 40 + Math.random() * 80)); }

  // Steering: pointer target, arrow keys, or the attract-mode pilot.
  if (keys.ArrowLeft || keys.a) steerX -= 520 * dt;
  if (keys.ArrowRight || keys.d) steerX += 520 * dt;
  if (AUTO) steerX = pilot();
  steerX = Math.max(60, Math.min(W - 60, steerX));
  const drag = life.debt > 0 ? 0.35 : 1; // debt is a weight: the ball answers slower
  st.x += (steerX - st.x) * Math.min(1, dt * 6 * drag);
  for (const p of trail) p.y -= step;
  trail.push({ x: st.x, y: SKIER_Y + 12 });
  trail = trail.filter(p => p.y > -10);

  if (dist >= st.spawnAt) { spawnRow(H + 60); st.spawnAt += YEAR_PX * 0.75; }
  for (const o of objs) o.y -= step;

  const r = ballR(), by = ballY();
  for (const o of objs) {
    if (o.hit) continue;
    if (o.kind === 'storm' && o.y <= by) {
      o.hit = true;
      const before = life.savings;
      E.spend(life, o.cost, o.label, 'emergency');
      const borrowed = o.cost - Math.min(o.cost, before);
      if (borrowed > 0) blip([196, 147], 'sawtooth', 0.3); else blip([392, 330], 'triangle');
      toast(borrowed > 0 ? `${o.label} ${money(o.cost)}: ${money(borrowed)} on the card at 24%` : `${o.label} ${money(o.cost)}: covered by savings`, borrowed > 0 ? '#ff6b6b' : '#9be7a4');
    } else if (o.kind !== 'storm' && Math.abs(o.y - by) < r && Math.abs(o.x - st.x) < o.w / 2 + r * 0.6) {
      o.hit = true;
      if (o.kind === 'want') { blip([660, 880], 'triangle'); const j = E.treatJoy(life.mood); E.spend(life, o.cost, o.label); toast(`${o.label} ${money(-o.cost)}  +${j} joy`, '#ffd166'); }
      else {
        blip([523, 659, 784]); E.raise(life, o.amt);
        if (o.label === 'Employer match') { st.matched = true; toast(`Employer match: free money, now saving ${money(life.contribution)}/yr`, '#7cc6ff'); }
        else toast(`New skill: saving ${money(life.contribution)}/yr`, '#7cc6ff');
      }
    }
  }
  objs = objs.filter(o => o.y > -80);

  if (dist >= nextYearAt) {
    nextYearAt += YEAR_PX;
    E.tickYear(life);
    st.stormYears++;
    const stage = E.stageAt(life.age);
    if (stage.from === life.age) toast(`Age ${life.age}: ${stage.name}`, '#e0e7ff');
    if (life.mood <= 0) { blip([220, 165, 131], 'square', 0.25); E.spend(life, 3, 'Burnout splurge', 'burnout'); toast('Burnout! You splurged $3k and it did not even help', '#ff9f43'); }
    if (life.age >= E.END_AGE) { phase = 'end'; objs = []; blip([523, 659, 784, 1047], 'sine', 0.4); if (rec) setTimeout(() => rec.state === 'recording' && rec.stop(), 7000); }
  }
  for (const t of toasts) t.t += dt;
  toasts = toasts.filter(t => t.t < 2.6);
}

// Attract mode: treat yourself when mood runs low, catch skills, otherwise stay away from wants.
function pilot() {
  const by = ballY();
  const ahead = objs.filter(o => !o.hit && o.kind !== 'storm' && o.y > by && o.y < by + 260);
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

  // year markers scroll up with the slope
  ctx.strokeStyle = 'rgba(40,70,100,0.12)'; ctx.lineWidth = 2;
  const off = YEAR_PX - (dist % YEAR_PX);
  for (let y = off; y < H + YEAR_PX; y += YEAR_PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // ski tracks left behind (above you)
  ctx.strokeStyle = 'rgba(120,150,180,0.35)'; ctx.lineWidth = 2;
  for (const d of [-6, 6]) {
    ctx.beginPath();
    trail.forEach((p, i) => i ? ctx.lineTo(p.x + d, p.y) : ctx.moveTo(p.x + d, p.y));
    ctx.stroke();
  }
  for (const t of trees) pine(t.x, t.y, t.s);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const f of flakes) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }

  for (const o of objs) {
    if (o.kind === 'storm') {
      ctx.fillStyle = o.hit ? 'rgba(80,90,110,0.15)' : 'rgba(60,70,95,0.55)';
      ctx.fillRect(0, o.y - 28, W, 56);
      if (o.hit) continue; // the toast already told the story; the label would scroll under the HUD
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(`STORM  ${o.label}  ${money(o.cost)}  (can't dodge this one)`, W / 2, o.y + 8);
    } else if (o.kind === 'want') {
      if (o.hit) continue;
      const text = `${o.label} ${money(o.cost)}`;
      ctx.font = 'bold 15px ui-monospace, monospace'; ctx.textAlign = 'center';
      o.w = Math.max(170, ctx.measureText(text).width + 56); // the gate fits its label, and collisions use the same width
      flag(o.x - o.w / 2, o.y, '#f5b700'); flag(o.x + o.w / 2, o.y, '#f5b700');
      ctx.fillStyle = 'rgba(255,209,102,0.9)'; roundRect(o.x - o.w / 2 + 12, o.y - 14, o.w - 24, 30, 4); ctx.fill();
      ctx.fillStyle = '#3d2c00'; ctx.fillText(text, o.x, o.y + 6);
    } else if (!o.hit) {
      flag(o.x - o.w / 2, o.y, '#2d8cf0'); flag(o.x + o.w / 2, o.y, '#2d8cf0');
      ctx.fillStyle = '#05314f'; ctx.font = 'bold 13px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText(o.label === 'Employer match' ? '+match' : '+skill', o.x, o.y + 5);
    }
  }

  // the skier pushing the snowball, with a red chain dragging behind when there is debt
  const r = ballR(), BALL_Y = ballY();
  if (life.debt > 0) {
    ctx.strokeStyle = '#d64545'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(st.x, SKIER_Y); ctx.lineTo(st.x, 50); ctx.stroke(); ctx.setLineDash([]);
  }
  skier(st.x, SKIER_Y, Math.max(-1, Math.min(1, (steerX - st.x) / 120)));
  const bg = ctx.createRadialGradient(st.x - r / 3, BALL_Y - r / 3, r / 5, st.x, BALL_Y, r);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#c9dcec');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(st.x, BALL_Y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#18324a'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(money(life.savings), st.x, BALL_Y + 5);

  for (const o of objs) if (o.hint && !o.hit && o.y < H - 20) hint(o);
  hud();
  ctx.textAlign = 'center';
  toasts.forEach((t, i) => {
    ctx.globalAlpha = Math.min(1, 2.6 - t.t);
    ctx.fillStyle = 'rgba(14,26,36,0.8)'; roundRect(W / 2 - 290, 56 + i * 36, 580, 30, 8); ctx.fill();
    ctx.fillStyle = t.color; ctx.font = 'bold 16px system-ui'; ctx.fillText(t.text, W / 2, 77 + i * 36);
    ctx.globalAlpha = 1;
  });
  if (phase === 'title') titleCard();
  if (phase === 'end') endCard();
}

function hint(o) {
  ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
  const w = ctx.measureText(o.hint).width + 28, y = o.y + (o.kind === 'storm' ? 44 : 30);
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(W / 2 - w / 2, y, w, 28, 14); ctx.fill();
  ctx.fillStyle = '#18324a'; ctx.fillText(o.hint, W / 2, y + 19);
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
    ['Ski from 22 down to 67, pushing your savings snowball. It grows 6% a year.', 18],
    ['Gold gates are treats: they keep you happy and come out of the snowball.', 18],
    ['A treat brings more joy when your mood is low, whatever it costs.', 18],
    ['Blue flags are skills: they raise what you save each year.', 18],
    ['Storms hit everyone: savings cover them, or the rest goes on a card at 24%.', 18],
    [`Score = joy along the way + reaching a ${money(E.GOAL)} nest egg at 67.`, 18, '#ffd166'],
    ['Past the goal, money adds nothing.', 18, '#ffd166'],
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

// Pixel sprites, drawn from rects on a 4 px grid so they stay crisp at any scale.
function px(x, y, cells, size, colors) {
  cells.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return;
    ctx.fillStyle = colors[c]; ctx.fillRect(Math.round(x + i * size), Math.round(y + j * size), size, size);
  }));
}

const PINE = ['...w...', '..wgw..', '..ggg..', '.wgggw.', '.ggggg.', 'wgggggw', 'ggggggg', '...t...', '...t...'];
function pine(x, y, s) { px(x - 14 * s, y - 36 * s, PINE, 4 * s, { g: '#2f6b3a', w: '#f4f8fb', t: '#6b4a2b' }); }

function flag(x, y, color) {
  ctx.fillStyle = '#555'; ctx.fillRect(x - 1, y - 26, 3, 40);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 2, y - 26); ctx.lineTo(x + 18, y - 19); ctx.lineTo(x + 2, y - 12); ctx.fill();
}

// Seen from above, heading down the screen: helmet, jacket, and skis that turn with the steering.
const SKIER = ['..hh..', '.hhhh.', '.ffff.', 'jjjjjj', 'ajjjja', 'ajjjja', '.pppp.', '.p..p.'];
function skier(x, y, lean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-lean * 0.35);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-11, -14, 4, 40); ctx.fillRect(7, -14, 4, 40);
  px(-12, -18, SKIER, 4, { h: '#1d3557', f: '#f1c27d', j: '#e63946', a: '#457b9d', p: '#2b2d42' });
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- sound: tiny WebAudio blips, no assets; the context opens on the first tap ----------
let ac = null, master = null;
function blip(freqs, type = 'sine', dur = 0.18) {
  if (!ac) return;
  const t0 = ac.currentTime;
  freqs.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.07;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  });
}

// ---------- ?record: canvas + sound in one webm, POSTed to /upload (the 2-minute gameplay video) ----------
const REC = params.has('record');
let rec = null;
function startRecording() {
  const dest = ac.createMediaStreamDestination();
  master.connect(dest);
  const stream = new MediaStream([...cv.captureStream(60).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const chunks = [];
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12e6 });
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => fetch('/upload', { method: 'POST', body: new Blob(chunks, { type: 'video/webm' }) })
    .then(r => { document.title = 'uploaded ' + r.status; });
  rec.start(1000);
}

function unlockAudio() {
  if (ac) return;
  ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0.25; master.connect(ac.destination);
  if (REC) startRecording();
}

function start() {
  if (REC && !ac) { unlockAudio(); setTimeout(() => { phase = 'play'; }, 4000); return; } // keep the title card in the video
  unlockAudio(); if (phase === 'title') phase = 'play'; else if (phase === 'end') { reset(); phase = 'play'; } }
cv.addEventListener('pointerdown', e => { start(); steerX = e.offsetX / scale; });
cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') steerX = e.offsetX / scale; });
addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ' || e.key === 'Enter') start(); });
addEventListener('keyup', e => { keys[e.key] = false; });
if (AUTO && !REC) setTimeout(start, 1500); // ?record waits for a tap: audio and the recorder need a user gesture

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
