// Editions of Snowball: the same money model (econ.js works in thousands of US dollars) told in the player's own
// money, words and life. No DOM: game.js and tests/region.test.mjs share it.
export const AED_PER_USD = 3.6725; // the UAE dirham has been pegged at 3.6725 per US dollar since 1997
export const EDITIONS = ['global', 'uae', 'uae-ar'];
export const STORAGE_KEY = 'snowball.edition';
export const ZAKAT_KEY = 'snowball.zakat';
export const ZAKAT_RATE = 0.025;
// Nisab = the value of 85 g of gold. It moves with the gold price; the game fixes it at AED 35k (model units: $k).
export const NISAB_AED_K = 35;
export const NISAB = NISAB_AED_K / AED_PER_USD;
export const UAE_CARD_APR = 0.36; // UAE bank cards charge about 3% a month or more; the global edition uses 24% a year
const GULF_TZ = ['Asia/Dubai', 'Asia/Muscat', 'Asia/Riyadh', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Kuwait'];

// Saved choice first, then ?edition= (a judge or teacher can link one), then the device: Arabic -> UAE in Arabic,
// a Gulf time zone -> UAE in English; everyone else gets the global edition.
export function pickEdition(search, stored, lang = '', tz = '') {
  const q = new URLSearchParams(search).get('edition');
  if (EDITIONS.includes(q)) return q;
  if (EDITIONS.includes(stored)) return stored;
  if (/^ar\b/i.test(lang)) return 'uae-ar';
  if (GULF_TZ.includes(tz)) return 'uae';
  return 'global';
}

// Zakat is on by default in the UAE editions; a player it does not apply to can turn it off (saved on the device).
export function zakatOn(stored) { return stored !== 'off'; }

// Life stages. Global costs are $k; UAE costs are AED k, priced for the Gulf and converted to model units below.
const GLOBAL_STAGES = [
  { from: 22, name: ['First job'], wants: [['Concert', 1], ['New phone', 1.2], ['Gaming PC', 2.5], ['Sneakers', 0.4], ['Weekend trip', 2], ['Dinner out', 0.5]],
    storms: [['Car repair', 2], ['Vet bill', 1.5], ['Job loss', 6]] },
  { from: 32, name: ['Family years'], wants: [['New car', 8], ['Wedding party', 6], ['Beach vacation', 4], ['Bigger TV', 1.5], ['Dinner out', 0.5]],
    storms: [['Medical bill', 3], ['Roof leak', 4], ['Job loss', 6], ['Car repair', 2]] },
  { from: 47, name: ['Peak earning'], wants: [['Kitchen remodel', 5], ['Kids\' college trip', 3], ['Boat', 9], ['Beach vacation', 4], ['Dinner out', 0.5]],
    storms: [['Medical bill', 3], ['Roof leak', 4], ['Parent care', 5]] },
  { from: 58, name: ['Almost there'], wants: [['Grandkids visit', 1.5], ['Cruise', 4], ['Golf clubs', 1], ['Dinner out', 0.5]],
    storms: [['Medical bill', 3], ['Dental work', 2.5], ['Roof leak', 4]] },
];
const UAE_STAGES = [
  { from: 22, name: ['First job', 'الوظيفة الأولى'],
    wants: [['Concert', 'حفلة موسيقية', 0.5], ['New phone', 'هاتف جديد', 4.4], ['Gaming PC', 'حاسوب ألعاب', 9], ['Sneakers', 'حذاء رياضي', 1.5],
      ['Weekend in Oman', 'عطلة قصيرة في عُمان', 2.5], ['Desert camping gear', 'عُدّة تخييم في الصحراء', 2], ['Dinner out', 'عشاء في مطعم', 0.4]],
    storms: [['Car repair', 'تصليح السيارة', 7], ['Rent deposit and agent fee', 'تأمين الإيجار وعمولة الوسيط', 8], ['Job loss', 'فقدان الوظيفة', 22]] },
  { from: 32, name: ['Family years', 'سنوات العائلة'],
    wants: [['New SUV', 'سيارة دفع رباعي جديدة', 30], ['Wedding party', 'حفل الزفاف', 25], ['Summer trip', 'رحلة الصيف', 15],
      ['Eid shopping and Eidiya', 'تسوق العيد والعيدية', 3], ['Bigger TV', 'تلفاز أكبر', 5.5], ['Dinner out', 'عشاء في مطعم', 0.4]],
    storms: [['Medical bill outside insurance', 'فاتورة علاج خارج التأمين', 11], ['Rent increase at renewal', 'زيادة الإيجار عند التجديد', 12],
      ['Job loss', 'فقدان الوظيفة', 22], ['School fees rise', 'ارتفاع الرسوم المدرسية', 10], ['Car repair', 'تصليح السيارة', 7]] },
  { from: 47, name: ['Peak earning', 'ذروة الدخل'],
    wants: [['Majlis makeover', 'تجديد المجلس', 18], ['Kids\' university trip', 'رحلة جامعية للأبناء', 11], ['Boat', 'قارب', 33],
      ['Summer trip', 'رحلة الصيف', 15], ['Dinner out', 'عشاء في مطعم', 0.4]],
    storms: [['Medical bill outside insurance', 'فاتورة علاج خارج التأمين', 11], ['AC breakdown in August', 'تعطّل المكيّف في أغسطس', 4],
      ['Parent care', 'رعاية الوالدين', 18]] },
  { from: 58, name: ['Almost there', 'على مشارف التقاعد'],
    wants: [['Grandkids visit', 'زيارة الأحفاد', 5.5], ['Cruise', 'رحلة بحرية', 15], ['Golf clubs', 'مضارب غولف', 3.7], ['Dinner out', 'عشاء في مطعم', 0.4]],
    storms: [['Medical bill outside insurance', 'فاتورة علاج خارج التأمين', 11], ['Dental work', 'علاج الأسنان', 9],
      ['AC breakdown in August', 'تعطّل المكيّف في أغسطس', 4]] },
];

// Every line the game shows. `uae` overrides `global` in both UAE editions; `ar` is the UAE edition in Arabic.
export const STR = {
  title: { global: 'SNOWBALL', ar: 'كرة الثلج' },
  edGlobal: { global: 'Global ($)', ar: 'Global ($)' },
  edUae: { global: 'UAE (AED)', ar: 'UAE (AED)' },
  edUaeAr: { global: 'الإمارات (عربي)', ar: 'الإمارات (عربي)' },
  zakatChip: { global: 'Zakat 2.5%', ar: 'الزكاة 2.5%' },
  t1: { global: 'Ski from 22 down to 67, pushing your savings snowball. It grows 6% a year.',
    uae: 'Ski from 22 down to 67, pushing your savings snowball.',
    ar: 'تتزلّج من عمر 22 حتى 67 وأنت تدفع كرة مدخراتك.' },
  t1b: { uae: 'It sits in a Sharia-compliant fund: about 6% a year from profit, not interest.',
    ar: 'هي مستثمرة في صندوق متوافق مع الشريعة: تنمو نحو 6% سنوياً من الأرباح، لا من الفوائد.' },
  t2: { global: 'Gold gates are treats: they keep you happy and come out of the snowball.',
    ar: 'البوابات الذهبية مكافآت: تُسعدك وتُخصم من كرة الثلج.' },
  t3: { global: 'A treat brings more joy when your mood is low, whatever it costs.',
    ar: 'المكافأة تُسعد أكثر حين يكون مزاجك منخفضاً، مهما كان ثمنها.' },
  t4: { global: 'Blue flags are skills: they raise what you save each year.',
    uae: 'Blue flags are skills and gratuity plans: they raise what you save each year.',
    ar: 'الأعلام الزرقاء مهارات وخطط مكافأة نهاية الخدمة: ترفع ما تدّخره كل سنة.' },
  t5: { global: 'Storms hit everyone: savings cover them, or the rest goes on a card at 24%.',
    uae: 'Storms hit everyone: savings cover them, or the rest goes on a card at ~3% a month.',
    ar: 'العواصف تصيب الجميع: المدخرات تغطّيها، وما يتبقّى يذهب إلى البطاقة بنحو 3% شهرياً.' },
  tZakat: { uae: 'Zakat: 2.5% a year on savings above the nisab, and it never lowers your score.',
    ar: 'الزكاة: 2.5% سنوياً على المدخرات فوق النصاب، ولا تُنقص نتيجتك أبداً.' },
  t6: { global: 'Score = joy along the way + reaching a {goal} nest egg at 67.',
    ar: 'النتيجة = السعادة على الطريق + بلوغ مدخرات تقاعد قدرها {goal} عند 67.' },
  t7: { global: 'Past the goal, money adds nothing.', ar: 'ما يزيد عن الهدف لا يضيف نقاطاً.' },
  titleFoot: { global: 'Tap, click or space to start · drag or arrows to steer · P pauses',
    ar: 'المس أو انقر أو اضغط المسافة للبدء · اسحب أو استخدم الأسهم للتوجيه · P للإيقاف' },
  settings: { global: 'Settings (tap a chip or press 1-5), saved on this device',
    ar: 'الإعدادات (المس خياراً أو اضغط 1-5)، تُحفظ على هذا الجهاز' },
  edition: { global: 'Edition (tap, or press L)', ar: 'النسخة (المس، أو اضغط L)' },
  a11y_large: { global: 'Large text', ar: 'نص كبير' },
  a11y_contrast: { global: 'High contrast', ar: 'تباين عالٍ' },
  a11y_calm: { global: 'Calm speed', ar: 'سرعة هادئة' },
  a11y_plain: { global: 'Plain words', ar: 'كلمات بسيطة' },
  a11y_mute: { global: 'Sound off', ar: 'بلا صوت' },
  skill: { global: 'Learn a skill', ar: 'تعلّم مهارة' },
  match: { global: 'Employer match', uae: 'Gratuity plan', ar: 'خطة مكافأة نهاية الخدمة' },
  flagSkill: { global: '+skill', ar: '+مهارة' },
  flagMatch: { global: '+match', uae: '+gratuity', ar: '+مكافأة' },
  hintSkill: { global: 'Ski through blue flags: you save more every year', ar: 'مُرّ عبر الأعلام الزرقاء: تدّخر أكثر كل سنة' },
  hintWant: { global: 'Gold gates are treats: joy now, a smaller snowball', ar: 'البوابات الذهبية مكافآت: سعادة الآن وكرة أصغر' },
  hintStorm: { global: 'Savings pay for storms. What they cannot pay goes on a card at 24%',
    uae: 'Savings pay for storms. What they cannot pay goes on a card at ~3% a month',
    ar: 'المدخرات تدفع ثمن العواصف، وما لا تغطّيه يذهب إلى البطاقة بنحو 3% شهرياً' },
  introWant: { global: 'Concert', ar: 'حفلة موسيقية' },
  introStorm: { global: 'Car accident', ar: 'حادث سيارة' },
  stormBorrowed: { global: '{label} {cost}: {borrowed} on the card at 24%', uae: '{label} {cost}: {borrowed} on the card at ~3% a month',
    ar: '{label} {cost}: {borrowed} على البطاقة بنحو 3% شهرياً' },
  stormCovered: { global: '{label} {cost}: covered by savings', ar: '{label} {cost}: غطّتها المدخرات' },
  want: { global: '{label} {cost}  +{joy} joy', ar: '{label} {cost}  +{joy} سعادة' },
  matchToast: { global: 'Employer match: free money, now saving {c}/yr',
    uae: 'Gratuity plan: your employer invests your end-of-service money, now saving {c}/yr',
    ar: 'خطة مكافأة نهاية الخدمة: صاحب العمل يستثمرها لك، وادّخارك الآن {c} سنوياً' },
  skillToast: { global: 'New skill: saving {c}/yr', ar: 'مهارة جديدة: ادّخارك الآن {c} سنوياً' },
  stageToast: { global: 'Age {age}: {stage}', ar: 'العمر {age}: {stage}' },
  burnout: { global: 'Burnout! You splurged {x} and it did not even help', ar: 'إرهاق! أنفقت {x} دون تخطيط ولم يُسعدك ذلك' },
  zakatToast: { uae: 'Zakat {x} given: 2.5% of your savings above the nisab', ar: 'أخرجت الزكاة {x}: 2.5% من مدخراتك فوق النصاب' },
  storm: { global: 'STORM  {label}  {cost}  (can\'t dodge this one)', ar: 'عاصفة  {label}  {cost}  (لا مفرّ منها)' },
  hudAge: { global: 'Age {n}', ar: 'العمر {n}' },
  hudSavings: { global: 'Savings {x}', ar: 'المدخرات {x}' },
  hudSaving: { global: 'Saving {x}/yr', ar: 'الادخار {x} سنوياً' },
  hudDebt: { global: 'Card debt {x}', ar: 'دين البطاقة {x}' },
  hudJoy: { global: 'Joy {n}', ar: 'السعادة {n}' },
  mood: { global: 'mood', ar: 'المزاج' },
  paused: { global: 'Paused', ar: 'إيقاف مؤقت' },
  pausedSub: { global: 'Settings also work here. P or Esc resumes.', ar: 'الإعدادات تعمل هنا أيضاً. P أو Esc للمتابعة.' },
  pausedFoot: { global: 'Tap anywhere else to continue', ar: 'المس أي مكان آخر للمتابعة' },
  endTitle: { global: 'Retired at 67', ar: 'تقاعدت عند 67' },
  endScore: { global: 'Score {s}   (joy {j} + security {sec})', ar: 'النتيجة {s}   (السعادة {j} + الأمان {sec})' },
  endNest: { global: 'Nest egg {x} of a {goal} goal{more}', ar: 'مدخرات التقاعد {x} من هدف {goal}{more}' },
  endMore: { global: ': you could have enjoyed more', ar: '، وكان بوسعك أن تستمتع أكثر' },
  endCard: { global: 'Card interest you paid: {x}', uae: 'Card charges you paid: {x}', ar: 'رسوم البطاقة التي دفعتها: {x}' },
  endZakat: { uae: 'Zakat given: {x} (counted in your score as if kept)',
    ar: 'الزكاة التي أخرجتها: {x} (محسوبة في نتيجتك كأنك احتفظت بها)' },
  t23: { uae: 'Gold gates are treats: more joy when your mood is low, paid from the snowball.',
    ar: 'البوابات الذهبية مكافآت: تُسعد أكثر حين يكون مزاجك منخفضاً، وتُدفع من كرة الثلج.' },
  t67: { uae: 'Score = joy along the way + reaching {goal} at 67 (more adds nothing).',
    ar: 'النتيجة = السعادة على الطريق + بلوغ {goal} عند 67 (وما زاد لا يُحتسب).' },
  endPricey: { global: 'Your priciest treat: {label} at {age} cost {cost} then,', ar: 'أغلى مكافأة: {label} في عمر {age} كلّفت {cost} حينها،' },
  endPricey2: { global: '{fv} of money at 67. Same treat at 60: {fv60}.', ar: 'أي {fv} عند 67. ونفس المكافأة في عمر 60: {fv60}.' },
  endLesson: { global: 'Early money has the most years to grow. Late treats are cheap, early debt is expensive.',
    ar: 'المال المبكر أمامه أطول وقت لينمو. المكافأة المتأخرة رخيصة، والدين المبكر مكلف.' },
  endFoot: { global: 'Tap to live it again', ar: 'المس لتعيشها من جديد' },
};

function fill(s, vars) { return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)); }

export function edition(id) {
  const uae = id === 'uae' || id === 'uae-ar', ar = id === 'uae-ar';
  const lang = ar ? 'ar' : 'en';
  const factor = uae ? AED_PER_USD : 1;
  const t = (key, vars = {}) => {
    const e = STR[key] || {};
    const s = ar ? e.ar : (uae && e.uae) || e.global;
    return fill(s ?? '', vars);
  };
  // money(k) takes model units ($k) and prints them in the edition's currency and language.
  const money = (k) => {
    const v = Math.abs(k) * factor, neg = k < 0 ? '-' : '';
    const n = v >= 1000 ? (v / 1000).toFixed(2) : v >= 10 ? v.toFixed(0) : v.toFixed(1);
    if (ar) return `${neg}${n} ${v >= 1000 ? 'مليون' : 'ألف'} درهم`;
    const unit = v >= 1000 ? 'M' : 'k';
    return uae ? `${neg}AED ${n}${unit}` : `${neg}$${n}${unit}`;
  };
  const stages = uae
    ? UAE_STAGES.map(s => ({ from: s.from, name: s.name[ar ? 1 : 0],
      wants: s.wants.map(([en, a, c]) => [ar ? a : en, c / AED_PER_USD]), storms: s.storms.map(([en, a, c]) => [ar ? a : en, c / AED_PER_USD]) }))
    : GLOBAL_STAGES.map(s => ({ ...s, name: s.name[0] }));
  const stageAt = (age) => { let st = stages[0]; for (const s of stages) if (age >= s.from) st = s; return st; };
  return { id, uae, ar, lang, rtl: ar, factor, t, money, stages, stageAt, apr: uae ? UAE_CARD_APR : undefined, hasZakat: uae,
    introWantCost: uae ? 0.5 / AED_PER_USD : 1, introStormCost: uae ? 45 / AED_PER_USD : 12 }; // bigger than anyone's savings at 25: every player meets the card once
}
