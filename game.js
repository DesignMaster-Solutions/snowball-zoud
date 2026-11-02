import * as E from './econ.js';
import * as A from './a11y.js';
import * as R from './region.js';

const W = 960, H = 600, SKIER_Y = 150; // top-down: you ski down, the slope scrolls up
const YEAR_PX = 260;          // slope distance that equals one year of life
const SPEED = 170;            // px per second, so a year is ~1.5 s and a life ~70 s
const params = new URLSearchParams(location.search);
const AUTO = params.has('autoplay');

// Accessibility settings: saved on the device, linkable with ?a11y=large,calm; chips on the title and pause cards.
let S = A.parseSettings(location.search, localStorage.getItem(A.STORAGE_KEY));
function setA11y(key) { S = A.toggle(S, key); try { localStorage.setItem(A.STORAGE_KEY, A.serialize(S)); } catch { /* private mode: keep it for this run */ } }
// Editions (global $, UAE in English, UAE in Arabic): same money model, the player's own money, words and life.
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* old browser */ }
let ED = R.edition(R.pickEdition(location.search, store.get(R.STORAGE_KEY), navigator.language, tz));
let ZAKAT = R.zakatOn(store.get(R.ZAKAT_KEY));
function applyLang() {
  document.documentElement.lang = ED.lang;
  document.title = ED.ar ? 'كرة الثلج: المال الذي تتركه ينمو' : 'Snowball: money left alone grows';
}
applyLang();
function setEdition(id) { ED = R.edition(id); store.set(R.STORAGE_KEY, id); if (life) life.apr = ED.apr; applyLang(); }
function setZakat() { ZAKAT = !ZAKAT; store.set(R.ZAKAT_KEY, ZAKAT ? 'on' : 'off'); }
const FAMILY = 'system-ui, "Segoe UI", "Noto Sans Arabic", "Geeza Pro", sans-serif';
const F = (px, mono) => `bold ${A.fontPx(px, S)}px ${mono ? 'ui-monospace, monospace' : FAMILY}`;
let paused = false, chipRects = [];
const PAUSE_BTN = { x: W - 58, y: H - 58, w: 44, h: 44 };
const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

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
const intro = () => [
  { kind: 'skill', label: ED.t('skill'), amt: 0.5, hint: ED.t('hintSkill') },
  { kind: 'want', label: ED.t('introWant'), cost: ED.introWantCost, hint: ED.t('hintWant') },
  { kind: 'storm', label: ED.t('introStorm'), cost: ED.introStormCost, hint: ED.t('hintStorm') },
];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

let st, life, objs, dist, nextYearAt, toasts, flakes, trees, trail, phase, steerX, keys = {};

function reset() {
  life = E.newLife(); life.apr = ED.apr; objs = []; toasts = []; dist = 0; nextYearAt = YEAR_PX;
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
  const teach = intro();
  if (st.intro < teach.length) {
    const o = { ...teach[st.intro++], x: W / 2, y, w: 170, hit: false };
    if (o.kind === 'skill') o.w = 90;
    if (o.kind === 'storm') st.stormYears = 0; // the taught storm counts, so a random one does not follow right behind
    objs.push(o);
    return;
  }
  const yearsLeft = E.END_AGE - life.age;
  if (yearsLeft > 1 && st.stormYears >= 4 && Math.random() < 0.45) {
    const [label, cost] = pick(ED.stageAt(life.age).storms);
    objs.push({ kind: 'storm', y, label, cost, hit: false });
    st.stormYears = 0;
    return;
  }
  const [label, cost] = pick(ED.stageAt(life.age).wants);
  objs.push({ kind: 'want', x: lanes[0], y, label, cost, w: 170, hit: false });
  if (Math.random() < 0.3) objs.push({ kind: 'skill', x: lanes[1], y: y + 40, label: ED.t('skill'), amt: 0.5, w: 70, hit: false });
  // An employer match (UAE: an end-of-service gratuity savings plan) is free money: rarer than a skill, worth more,
  // and only once you have a job that offers it.
  else if (life.age >= 25 && !st.matched && Math.random() < 0.2) objs.push({ kind: 'skill', match: true, x: lanes[1], y: y + 40, label: ED.t('match'), amt: 1.5, w: 110, hit: false });
}

// Pines line both edges of the run; they are scenery, not obstacles.
function sideTree(y) {
  const left = Math.random() < 0.5;
  return { x: left ? 15 + Math.random() * 70 : W - 85 + Math.random() * 70, y, s: 0.8 + Math.random() * 0.6 };
}

function toast(text, color) { toasts = [...toasts.slice(-1), { text: A.plain(text, S), color, t: 0 }]; } // two at most, above the skier

function ballR() { return 14 + Math.sqrt(Math.max(0, life.savings)) * 3.2; }
// The skier pushes the snowball downhill, so the ball sits just below and touches things first.
function ballY() { return SKIER_Y + 30 + ballR(); }

function money(k) { return ED.money(k); } // model units ($k) in the edition's currency and language

function update(dt) {
  if (phase !== 'play' || paused) return;
  const teaching = objs.some(o => o.hint && !o.hit && o.y > ballY() - 40); // slow the slope while a hint is up, so it can be read
  const step = SPEED * A.speedFactor(S) * dt * (teaching ? 0.4 : 1);
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
      toast(borrowed > 0 ? ED.t('stormBorrowed', { label: o.label, cost: money(o.cost), borrowed: money(borrowed) })
        : ED.t('stormCovered', { label: o.label, cost: money(o.cost) }), borrowed > 0 ? '#ff6b6b' : '#9be7a4');
    } else if (o.kind !== 'storm' && Math.abs(o.y - by) < r && Math.abs(o.x - st.x) < o.w / 2 + r * 0.6) {
      o.hit = true;
      if (o.kind === 'want') { blip([660, 880], 'triangle'); const j = E.treatJoy(life.mood); E.spend(life, o.cost, o.label); toast(ED.t('want', { label: o.label, cost: money(-o.cost), joy: j }), '#ffd166'); }
      else {
        blip([523, 659, 784]); E.raise(life, o.amt);
        if (o.match) { st.matched = true; toast(ED.t('matchToast', { c: money(life.contribution) }), '#7cc6ff'); }
        else toast(ED.t('skillToast', { c: money(life.contribution) }), '#7cc6ff');
      }
    }
  }
  objs = objs.filter(o => o.y > -80);

  if (dist >= nextYearAt) {
    nextYearAt += YEAR_PX;
    E.tickYear(life);
    st.stormYears++;
    // Zakat (UAE editions, unless the player turned it off): 2.5% of what you own once it reaches the nisab.
    if (ED.hasZakat && ZAKAT) {
      const paid = E.give(life, E.zakatDue(life, R.NISAB, R.ZAKAT_RATE));
      if (paid > 0 && !st.zakatShown) { st.zakatShown = true; toast(ED.t('zakatToast', { x: money(paid) }), '#9be7a4'); }
    }
    const stage = ED.stageAt(life.age);
    if (stage.from === life.age) toast(ED.t('stageToast', { age: life.age, stage: stage.name }), '#e0e7ff');
    if (life.mood <= 0) { blip([220, 165, 131], 'square', 0.25); E.spend(life, 3, 'Burnout splurge', 'burnout'); toast(ED.t('burnout', { x: money(3) }), '#ff9f43'); }
    if (life.age >= E.END_AGE) { phase = 'end'; objs = []; toasts = []; blip([523, 659, 784, 1047], 'sine', 0.4); if (rec) setTimeout(() => rec.state === 'recording' && rec.stop(), 7000); }
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
  ctx.direction = ED.rtl ? 'rtl' : 'ltr';
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
      ctx.fillStyle = o.hit ? 'rgba(80,90,110,0.15)' : S.contrast ? 'rgba(25,35,55,0.88)' : 'rgba(60,70,95,0.55)';
      ctx.fillRect(0, o.y - 28, W, 56);
      if (o.hit) continue; // the toast already told the story; the label would scroll under the HUD
      ctx.fillStyle = '#fff'; ctx.font = F(22); ctx.textAlign = 'center';
      ctx.fillText(ED.t('storm', { label: o.label, cost: money(o.cost) }), W / 2, o.y + 8);
    } else if (o.kind === 'want') {
      if (o.hit) continue;
      const text = `${o.label} ${money(o.cost)}`;
      ctx.font = ED.ar ? F(15) : F(15, true); ctx.textAlign = 'center';
      o.w = Math.max(170, ctx.measureText(text).width + 56); // the gate fits its label, and collisions use the same width
      flag(o.x - o.w / 2, o.y, '#f5b700'); flag(o.x + o.w / 2, o.y, '#f5b700');
      ctx.fillStyle = S.contrast ? '#ffd166' : 'rgba(255,209,102,0.9)'; roundRect(o.x - o.w / 2 + 12, o.y - 14, o.w - 24, 30, 4); ctx.fill();
      ctx.fillStyle = S.contrast ? '#000' : '#3d2c00'; ctx.fillText(text, o.x, o.y + 6);
    } else if (!o.hit) {
      flag(o.x - o.w / 2, o.y, '#2d8cf0'); flag(o.x + o.w / 2, o.y, '#2d8cf0');
      const tag = ED.t(o.match ? 'flagMatch' : 'flagSkill');
      ctx.font = ED.ar ? F(14) : F(13, true); ctx.textAlign = 'center';
      const tw = Math.max(72, ctx.measureText(tag).width + 16);
      if (S.contrast) { ctx.fillStyle = '#fff'; roundRect(o.x - tw / 2, o.y - 8, tw, 22, 6); ctx.fill(); } // a chip behind the label, so it reads on snow
      ctx.fillStyle = S.contrast ? '#000' : '#05314f';
      ctx.fillText(tag, o.x, o.y + 5);
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
  ctx.fillStyle = '#18324a'; ctx.font = F(15); ctx.textAlign = 'center';
  ctx.fillText(money(life.savings), st.x, BALL_Y + 5);

  for (const o of objs) if (o.hint && !o.hit && o.y < H - 20) hint(o);
  hud();
  if (phase === 'play') pauseBtn();
  ctx.textAlign = 'center';
  const th = A.fontPx(16, S) + 14; // toast box grows with the text
  toasts.forEach((t, i) => {
    ctx.globalAlpha = Math.min(1, 2.6 - t.t);
    ctx.font = F(16); const tw = Math.max(580, ctx.measureText(t.text).width + 40);
    ctx.fillStyle = S.contrast ? 'rgba(0,0,0,0.96)' : 'rgba(14,26,36,0.8)'; roundRect(W / 2 - tw / 2, 56 + i * (th + 6), tw, th, 8); ctx.fill();
    ctx.fillStyle = t.color; ctx.fillText(t.text, W / 2, 56 + i * (th + 6) + th / 2 + A.fontPx(16, S) * 0.36);
    ctx.globalAlpha = 1;
  });
  if (phase === 'title') titleCard();
  if (phase === 'end') endCard();
  if (phase === 'play' && paused) pauseCard();
}

function hint(o) {
  ctx.font = F(16); ctx.textAlign = 'center';
  const text = A.plain(o.hint, S), h = A.fontPx(16, S) + 12;
  const w = ctx.measureText(text).width + 28, y = o.y + (o.kind === 'storm' ? 44 : 30);
  ctx.fillStyle = S.contrast ? '#fff' : 'rgba(255,255,255,0.92)'; roundRect(W / 2 - w / 2, y, w, h, h / 2); ctx.fill();
  if (S.contrast) { ctx.strokeStyle = '#18324a'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = S.contrast ? '#0b1c2c' : '#18324a'; ctx.fillText(text, W / 2, y + h * 0.68);
}

function hud() {
  ctx.fillStyle = S.contrast ? 'rgba(0,0,0,0.94)' : 'rgba(14,26,36,0.82)'; ctx.fillRect(0, 0, W, 50);
  const items = [
    [ED.t('hudAge', { n: life.age }), '#fff'], [ED.t('hudSavings', { x: money(life.savings) }), '#e8f4ff'],
    [ED.t('hudSaving', { x: money(life.contribution) }), '#7cc6ff'], [A.plain(ED.t('hudDebt', { x: money(life.debt) }), S), life.debt > 0 ? '#ff6b6b' : '#8aa'],
    [ED.t('hudJoy', { n: Math.round(life.joy) }), '#ffd166'],
  ];
  // Dirhams and Arabic run longer than dollars: shrink the row until it clears the mood bar.
  let size = 17, gap = 30;
  for (;;) {
    ctx.font = F(size);
    const total = items.reduce((a, [t]) => a + ctx.measureText(t).width, 0) + gap * (items.length - 1);
    if (total <= W - 230 || size <= 11) break;
    size--; gap = Math.max(16, gap - 2);
  }
  ctx.textAlign = ED.rtl ? 'right' : 'left';
  let x = ED.rtl ? W - 18 : 18;
  for (const [t, c] of items) { ctx.fillStyle = c; ctx.fillText(t, x, 32); const w = ctx.measureText(t).width + gap; x += ED.rtl ? -w : w; }
  const bx = ED.rtl ? 20 : W - 150; // the mood bar sits at the far end of the reading direction
  ctx.fillStyle = '#334'; ctx.fillRect(bx, 18, 130, 14);
  ctx.fillStyle = life.mood > 0.35 ? '#ffd166' : '#ff9f43'; ctx.fillRect(ED.rtl ? bx + 130 * (1 - life.mood) : bx, 18, 130 * life.mood, 14);
  ctx.fillStyle = '#ccd'; ctx.font = `12px ${FAMILY}`; ctx.textAlign = ED.rtl ? 'left' : 'right';
  ctx.fillText(ED.t('mood'), ED.rtl ? bx + 138 : bx - 8, 30);
}

function panel(lines, foot, top = 130, gap = S.large ? 11 : 16, box = null) {
  ctx.fillStyle = S.contrast ? 'rgba(0,0,0,0.96)' : 'rgba(14,26,36,0.9)'; roundRect(130, 70, W - 260, H - 120, 18); ctx.fill();
  ctx.textAlign = 'center';
  let y = top;
  const fitFont = (text, px, bold) => { // a line never spills out of the card, whatever the language
    let p = px;
    do { ctx.font = `${bold ? 'bold ' : ''}${p}px ${FAMILY}`; } while (ctx.measureText(text).width > W - 300 && --p > 11);
  };
  let sizes = lines.map(([, size]) => A.fontPx(size, S));
  if (box) { // chips above and below (title card): shrink all lines together until they fit between the rows
    for (let f = 1; ; f -= 0.03) {
      const sz = sizes.map(v => Math.round(v * f)), first = box.top + Math.round(sz[0] * 0.95);
      if (first + sz.slice(0, -1).reduce((a, v) => a + v + gap, 0) <= box.bottom || f < 0.65) { sizes = sz; y = first; break; }
    }
  }
  lines.forEach(([t, size, c], i) => { const text = A.plain(t, S); ctx.fillStyle = c || '#e8f4ff'; fitFont(text, sizes[i], size >= 30); ctx.fillText(text, W / 2, y); y += sizes[i] + gap; });
  ctx.fillStyle = '#ffd166'; fitFont(foot, A.fontPx(20, S), true); ctx.fillText(foot, W / 2, H - 90);
}

// Accessibility toggles as a row of chips (box + label); the rects stay for taps, keys 1-5 do the same.
function chips(y) {
  ctx.textAlign = 'center'; ctx.font = `13px ${FAMILY}`; ctx.fillStyle = '#bcd'; ctx.fillText(ED.t('settings'), W / 2, y - 26);
  chipRow(y, A.KEYS.map(k => ({ k, t: ED.t('a11y_' + k), on: S[k] })));
}

// One row of checkbox chips, centred; in Arabic the box sits on the right and the label reads leftward.
function chipRow(y, items) {
  ctx.font = `bold 14px ${FAMILY}`;
  for (const it of items) it.w = ctx.measureText(it.t).width + 42;
  let x = W / 2 - (items.reduce((a, b) => a + b.w, 0) + (items.length - 1) * 8) / 2;
  for (const it of ED.rtl ? [...items].reverse() : items) { // Arabic reads from the right: the first chip sits rightmost
    const on = it.on, bx = ED.rtl ? x + it.w - 26 : x + 12;
    ctx.fillStyle = on ? '#ffd166' : 'rgba(255,255,255,0.14)'; roundRect(x, y - 15, it.w, 30, 15); ctx.fill();
    ctx.strokeStyle = on ? '#1b1b1b' : '#e8f4ff'; ctx.lineWidth = 2; ctx.strokeRect(bx, y - 7, 14, 14);
    if (on) { ctx.fillStyle = '#1b1b1b'; ctx.fillRect(bx + 3, y - 4, 8, 8); }
    ctx.fillStyle = on ? '#1b1b1b' : '#e8f4ff'; ctx.textAlign = ED.rtl ? 'right' : 'left';
    ctx.direction = /[\u0600-\u06FF]/.test(it.t) ? 'rtl' : 'ltr'; // "Global ($)" must not flip in the Arabic edition
    ctx.fillText(it.t, ED.rtl ? x + it.w - 32 : x + 32, y + 5);
    ctx.direction = ED.rtl ? 'rtl' : 'ltr';
    chipRects.push({ k: it.k, x, y: y - 15, w: it.w, h: 30 });
    x += it.w + 8;
  }
  ctx.textAlign = 'center';
}

// Edition chips (and Zakat, in the UAE editions): tap one, or L cycles editions and Z toggles zakat.
function editionChips(y) {
  const items = [{ k: 'ed:global', t: ED.t('edGlobal'), on: ED.id === 'global' }, { k: 'ed:uae', t: ED.t('edUae'), on: ED.id === 'uae' },
    { k: 'ed:uae-ar', t: ED.t('edUaeAr'), on: ED.id === 'uae-ar' }];
  if (ED.hasZakat) items.push({ k: 'zakat', t: ED.t('zakatChip'), on: ZAKAT });
  chipRow(y, items);
}

function pauseBtn() {
  ctx.fillStyle = S.contrast ? 'rgba(0,0,0,0.9)' : 'rgba(14,26,36,0.75)'; roundRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 11, 6, 22); ctx.fillRect(PAUSE_BTN.x + 25, PAUSE_BTN.y + 11, 6, 22);
}

function pauseCard() {
  chipRects = [];
  panel([[ED.t('paused'), 40, '#fff'], [ED.t('pausedSub'), 18, '#bcd']], ED.t('pausedFoot'));
  editionChips(250);
  chips(340);
}

function titleCard() {
  chipRects = [];
  const goal = money(E.GOAL);
  const lines = ED.uae ? [
    [ED.t('title'), 46, '#fff'], [ED.t('t1'), 18], [ED.t('t1b'), 18], [ED.t('t23'), 18], [ED.t('t4'), 18], [ED.t('t5'), 18],
    [ED.t('tZakat'), 18, '#9be7a4'], [ED.t('t67', { goal }), 18, '#ffd166'],
  ] : [
    [ED.t('title'), 46, '#fff'], [ED.t('t1'), 18], [ED.t('t2'), 18], [ED.t('t3'), 18], [ED.t('t4'), 18], [ED.t('t5'), 18],
    [ED.t('t6', { goal }), 18, '#ffd166'], [ED.t('t7'), 18, '#ffd166'],
  ];
  panel(lines, ED.t('titleFoot'), 160, S.large ? 10 : 14, { top: 116, bottom: 424 });
  editionChips(96);
  chips(470);
}

function endCard() {
  chipRects = [];
  const p = E.priciestWant(life);
  const nest = life.savings - life.debt;
  const lines = [
    [ED.t('endTitle'), 40, '#fff'],
    [ED.t('endScore', { s: E.score(life), j: Math.round(life.joy), sec: E.security(life) }), 22, '#ffd166'],
    [ED.t('endNest', { x: money(nest), goal: money(E.GOAL), more: nest + life.givenFV > E.GOAL * 1.3 ? ED.t('endMore') : '' }), 18, '#e8f4ff'],
    [ED.t('endCard', { x: money(life.interestPaid) }), 18, life.interestPaid > 0 ? '#ff6b6b' : '#9be7a4'],
  ];
  if (ED.hasZakat && life.given > 0) lines.push([ED.t('endZakat', { x: money(life.given) }), 18, '#9be7a4']);
  if (p) lines.push([ED.t('endPricey', { label: p.label, age: p.age, cost: money(p.cost) }), 18],
    [ED.t('endPricey2', { fv: money(p.fv), fv60: money(E.futureValue(p.cost, 60)) }), 18, '#7cc6ff']);
  lines.push([ED.t('endLesson'), 16, '#bcd']);
  panel(lines, ED.t('endFoot'));
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
  if (S.contrast) { ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); }
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
  if (!ac || S.mute) return;
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
  unlockAudio(); paused = false; if (phase === 'title') phase = 'play'; else if (phase === 'end') { reset(); phase = 'play'; } }
// Canvas coordinates from the client ones (offsetX is wrong for untrusted events under page zoom).
function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }
cv.addEventListener('pointerdown', e => {
  const [x, y] = pos(e);
  if (phase === 'play' && !paused && !AUTO && inRect(x, y, PAUSE_BTN)) { paused = true; return; }
  if (phase === 'title' || paused) {
    const c = chipRects.find(r => inRect(x, y, r));
    if (c) { if (c.k.startsWith('ed:')) setEdition(c.k.slice(3)); else if (c.k === 'zakat') setZakat(); else setA11y(c.k); return; }
  }
  if (paused) { paused = false; return; }
  start(); steerX = x;
});
cv.addEventListener('pointermove', e => { if (!paused && (e.buttons || e.pointerType === 'touch')) steerX = pos(e)[0]; });
addEventListener('keydown', e => {
  keys[e.key] = true;
  const n = Number(e.key);
  if (n >= 1 && n <= A.KEYS.length && (phase === 'title' || paused)) { setA11y(A.KEYS[n - 1]); return; }
  if ((e.key === 'l' || e.key === 'L') && (phase === 'title' || paused)) { setEdition(R.EDITIONS[(R.EDITIONS.indexOf(ED.id) + 1) % R.EDITIONS.length]); return; }
  if ((e.key === 'z' || e.key === 'Z') && ED.hasZakat && (phase === 'title' || paused)) { setZakat(); return; }
  if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && phase === 'play' && !AUTO) { paused = !paused; return; }
  if (e.key === ' ' || e.key === 'Enter') { if (paused) paused = false; else start(); }
});
addEventListener('keyup', e => { keys[e.key] = false; });
if (AUTO && !REC) setTimeout(start, 1500); // ?record waits for a tap: audio and the recorder need a user gesture

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
