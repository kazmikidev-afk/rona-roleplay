// vet3d2.js — מרפאת חיות תלת-ממדית מתסרגת: כל ביקור חיה ותרחיש אחרים (לא רקס קבוע).
// נבנה על world3d.js בשלד המוכח של dentist3d.js. כיסוי פעילויות vet: pet/stetho/temp/bandage/furscrub/feed/diagnose — רמות 1-4 (כמו roles.js).
// התקדמות: prog3d בלבד (STATE.vet3d2 בשלב המועמד; הקלאסי ו-vet3d הקיים לא נגעים). הלקוח/תרחיש מסתובב לפי visits בתוך רמת התלת-ממד.
// לקחים מיושמים: home בפיזור סופי, נחיתה נראית, עוגני מטרה בגובה הפעולה, רמזי-תמונה ללא-קוראים, כל חריץ בפריים במובייל (כללים 4,25-28).
function startVet3D2(root) {
  const w = startWorld3D(root, { bg: '#d9f0e2' });
  if (!w) return null;
  const { THREE, scene } = w;

  // מסלול prog3d נפרד: STATE.vet3d2 — לא נוגע ב-STATE.vet3d של הסצנה החיה הנבדקת (שימור וט קיים עד אישור מועמד)
  const prog = w.getProgress('vet3d2') || { visits: 0, stars: 0, lvl: 1 };
  const lvl = Math.min(4, prog.lvl || 1);
  const eff = Math.min(3, lvl); // תקרת קושי 3 מכוונת (כלל 23)
  const VROLE = (typeof ROLES !== 'undefined') && ROLES.find(r => r.id === 'vet');
  const CUSTS = VROLE ? VROLE.levels[lvl - 1] : [{ c: ['🐶', 'רקס הכלב'], say: 'נשרטתי במהלך משחק!', a: [['bandage', 1], ['feed', 1], ['furscrub', 1]] }];
  const cust = CUSTS[prog.visits % CUSTS.length];
  const ACTS = cust.a.map(x => x[0]);
  const DIFF = {}; cust.a.forEach(x => DIFF[x[0]] = x[1]);
  // ליטוף-הרגעה: רק לרקס ורק כשיש שריטה (הקליפ ספציפי לו — החלטת מיין)
  if (cust.c[1] === 'רקס הכלב' && ACTS.includes('bandage')) ACTS.unshift('pet');

  // ---------- החיה: בונה פרמטרי אחד לכל המינים ----------
  const ANIMALS = {
    'רקס הכלב': { key: 'dog', c: '#a07548', c2: '#6d4c41', size: 1, ears: 'flop', tail: 'up', muzzle: .16, food: 'bone' },
    'לולה החתולה': { key: 'cat', c: '#9e9e9e', c2: '#616161', size: .88, ears: 'point', tail: 'long', muzzle: .12, food: 'fish' },
    'דני הארנב': { key: 'rabbit', c: '#d7ccc0', c2: '#b8a89a', size: .82, ears: 'long', tail: 'pom', muzzle: .1, food: 'carrot' },
    'טדי הצב': { key: 'turtle', c: '#558b2f', c2: '#33691e', size: .85, ears: 'none', shell: true, muzzle: .08, food: 'leaf' },
    'פיפי התוכי': { key: 'parrot', c: '#039be5', c2: '#01579b', size: .58, ears: 'none', beak: true, tail: 'feather', food: 'seeds' },
    "ששי הג'ירפה": { key: 'giraffe', c: '#e89b3f', c2: '#8d5a1e', size: 1.05, ears: 'ossi', neck: .85, spots: true, muzzle: .14, food: 'leaves' },
    'ממי הקופית': { key: 'monkey', c: '#8d6e63', c2: '#6d4c41', size: .85, ears: 'round', tail: 'curly', face: '#c8b6b0', muzzle: .12, food: 'banana' },
    'פילי הפיל': { key: 'elephant', c: '#78909c', c2: '#546e7a', size: 1.18, ears: 'big', trunk: true, muzzle: .1, food: 'salad' }
  };
  const A = ANIMALS[cust.c[1]] || ANIMALS['רקס הכלב'];
  const S = A.size;

  // ---------- המרפאה ----------
  w.buildRoom({ floor: '#a8d5ba', wallA: '#e8f6ee', wallB: '#cfe9d8' });
  // שולחן בדיקה מרכזי
  w.box(2.6, .16, 1.5, '#ffffff', 0, .92, -0.5);
  w.box(2.4, .12, 1.35, '#5cb8e6', 0, 1.02, -0.5);
  w.box(2.1, .8, 1.05, '#e8eef5', 0, .45, -0.5);
  // מגש כלים מימין (בפריים מובייל — לקח מ-dentist, כלל 27)
  const tray = w.group(1.3, 0, 0.9);
  w.box(1.5, .08, .8, '#ffffff', 0, .92, 0, tray);
  w.box(1.4, .05, .7, '#ffc1d9', 0, .965, 0, tray);
  [[-.65, -.3], [.65, -.3], [-.65, .3], [.65, .3]].forEach(p => w.cyl(.04, .04, .9, '#90a4ae', p[0], .45, p[1], tray));
  w.noRay(tray);
  // קערת אוכל משמאל-קדמה (מטרת feed)
  const bowl = w.group(-1.2, 0, 2.0);
  w.cyl(.42, .3, .3, '#ef5350', 0, .15, 0, bowl);
  w.cyl(.36, .36, .06, '#c62828', 0, .3, 0, bowl);
  const bowlAnchor = w.group(-1.2, .5, 2.0); w.noRay(bowlAnchor);
  w.noRay(bowl);
  // מדף בקבוקונים + עציץ (דקור רחוק)
  w.box(1.6, .08, .4, '#ffffff', 2.6, 2.3, -4.2);
  ['#8fd0f5', '#ffb3c7', '#b8e6b0'].forEach((c, i) => { const b = w.cyl(.09, .09, .3, c, 2.1 + i * .45, 2.5, -4.2); w.ball(.09, c, 2.1 + i * .45, 2.68, -4.2) });
  const pot2 = w.group(-2.7, 0, -3.6); w.cyl(.2, .15, .36, '#e08e5a', 0, .18, 0, pot2); w.ball(.36, '#66bb6a', 0, .62, 0, pot2, 1, .9, 1); w.noRay(pot2);

  // ---------- מודל החיה ----------
  // anchors: פונקציות מיקום עולמי לאינטראקציות (לב, מצח, שריטות, פרווה)
  const animal = w.group(0, 1.06, -0.5);
  const headG = w.group(0, (A.neck ? 1.15 + A.neck : .92) * S, .12, animal);
  const bodyG = w.group(0, .38 * S, 0, animal);
  {
    // גוף יושב
    w.ball(.4 * S, A.c, 0, 0, 0, bodyG, 1, 1.08, .88);
    w.ball(.3 * S, A.c2, 0, -.02 * S, .16 * S, bodyG, .8, .85, .6); // בטן/חזה בהיר
    if (A.shell) { const sh = w.ball(.46 * S, A.c2, 0, .1 * S, -.16 * S, bodyG, 1, .9, .8); sh.material.roughness = .95 }
    if (A.spots) [[-.18, .15, .3], [.15, .3, .22], [0, -.1, .34]].forEach(p => w.ball(.07 * S, A.c2, p[0] * S, p[1] * S, p[2] * S, bodyG, 1, 1, .5));
    // רגליים קדמיות
    w.ball(.13 * S, A.c, -.2 * S, -.3 * S, .22 * S, bodyG, .8, 1.1, .8);
    w.ball(.13 * S, A.c, .2 * S, -.3 * S, .22 * S, bodyG, .8, 1.1, .8);
    // זנב
    if (A.tail === 'up') { const t = w.cyl(.05 * S, .03 * S, .4 * S, A.c2, 0, .05 * S, -.42 * S, bodyG); t.rotation.x = -.8 }
    if (A.tail === 'long') { const t = w.cyl(.035 * S, .02 * S, .55 * S, A.c, 0, -.1 * S, -.45 * S, bodyG); t.rotation.x = -1.2 }
    if (A.tail === 'pom') w.ball(.09 * S, '#ffffff', 0, -.15 * S, -.4 * S, bodyG);
    if (A.tail === 'feather') { const t = w.box(.1 * S, .5 * S, .04 * S, A.c2, 0, .05 * S, -.4 * S, bodyG); t.rotation.x = .7 }
    if (A.tail === 'curly') { const t = w.cyl(.03 * S, .02 * S, .45 * S, A.c2, 0, 0, -.42 * S, bodyG); t.rotation.x = -.6 }
    // צוואר (ג'ירפה)
    if (A.neck) { const nL = 2 * ((.48 + A.neck) * S - A.neck / 2); const n = w.cyl(.11 * S, .14 * S, nL, A.c, 0, .55 * S + A.neck / 2, .05, animal); if (A.spots) { w.ball(.05 * S, A.c2, .08 * S, .7 * S + A.neck / 2, .14, animal); w.ball(.045 * S, A.c2, -.09 * S, .9 * S + A.neck / 2, .12, animal); w.ball(.045 * S, A.c2, .02 * S, 1.05 * S + A.neck / 2, .13, animal) } }
  }
  {
    // ראש
    w.ball(.3 * S, A.c, 0, 0, 0, headG, 1, .95, .9);
    if (A.face) w.ball(.2 * S, A.face, 0, -.04 * S, .14 * S, headG, .9, .8, .6); // פרצוף קופית
    if (A.trunk) { const t = w.cyl(.07 * S, .05 * S, .5 * S, A.c, 0, -.2 * S, .26 * S, headG); t.rotation.x = .5; w.ball(.055 * S, A.c, 0, -.42 * S, .32 * S, headG) }
    else if (A.beak) { const b = w.cyl(.01 * S, .09 * S, .18 * S, '#ff9800', 0, -.03 * S, .3 * S, headG); b.rotation.x = Math.PI / 2 }
    else { const mz = w.ball(A.muzzle * S, A.c2, 0, -.08 * S, .24 * S, headG, 1.1, .8, .9); w.ball(.035 * S, '#3e2723', 0, -.04 * S, .33 * S, headG) } // חרטום+אף
    // עיניים
    w.ball(.055 * S, '#3e2723', -.13 * S, .08 * S, .24 * S, headG);
    w.ball(.055 * S, '#3e2723', .13 * S, .08 * S, .24 * S, headG);
    // אוזניים לפי סוג
    const E = A.ears;
    if (E === 'flop') { const l = w.ball(.11 * S, A.c2, -.24 * S, .16 * S, 0, headG, .6, 1.5, .7); l.rotation.z = .5; const r = w.ball(.11 * S, A.c2, .24 * S, .16 * S, 0, headG, .6, 1.5, .7); r.rotation.z = -.5 }
    if (E === 'point') { w.cyl(.01 * S, .1 * S, .22 * S, A.c, -.17 * S, .3 * S, 0, headG).rotation.z = .25; w.cyl(.01 * S, .1 * S, .22 * S, A.c, .17 * S, .3 * S, 0, headG).rotation.z = -.25 }
    if (E === 'long') { const l = w.ball(.08 * S, A.c, -.12 * S, .4 * S, 0, headG, .55, 2.6, .7); const r = w.ball(.08 * S, A.c, .12 * S, .4 * S, 0, headG, .55, 2.6, .7); w.ball(.045 * S, '#f8bbd0', -.12 * S, .4 * S, .04 * S, headG, .4, 2.2, .5); w.ball(.045 * S, '#f8bbd0', .12 * S, .4 * S, .04 * S, headG, .4, 2.2, .5) }
    if (E === 'ossi') { [-.1, .1].forEach(x => { w.cyl(.025 * S, .025 * S, .22 * S, A.c2, x * S, .4 * S, 0, headG); w.ball(.045 * S, A.c2, x * S, .52 * S, 0, headG) }); w.ball(.05 * S, A.c, -.24 * S, .1 * S, 0, headG); w.ball(.05 * S, A.c, .24 * S, .1 * S, 0, headG) }
    if (E === 'big') { const l = w.ball(.17 * S, A.c2, -.28 * S, .06 * S, -.02 * S, headG, .5, 1.2, .9); const r = w.ball(.17 * S, A.c2, .28 * S, .06 * S, -.02 * S, headG, .5, 1.2, .9) }
    if (E === 'round') { w.ball(.08 * S, A.c2, -.26 * S, .1 * S, 0, headG); w.ball(.08 * S, A.c2, .26 * S, .1 * S, 0, headG) }
  }
  w.noRay(animal); // דקור; אינטראקציה רק דרך פרוקסים
  const wp = (o) => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v };
  const heartAt = () => { const v = new THREE.Vector3(0, .42 * S, .34 * S); return bodyG.localToWorld(v) };
  const foreheadAt = () => { const v = new THREE.Vector3(0, .14 * S, .26 * S); return headG.localToWorld(v) };
  const furAt = () => { const v = new THREE.Vector3(0, .62 * S, -.05 * S); return bodyG.localToWorld(v) };

  // ---------- מודלי כלים/אוכל ----------
  function stethoModel() { const g = w.group(0, 0, 0); const t = w.cyl(.02, .02, .3, '#455a64', 0, 0, 0, g); t.rotation.z = Math.PI / 2; w.cyl(.09, .09, .04, '#78909c', .18, 0, 0, g).rotation.z = Math.PI / 2; w.ball(.05, '#90a4ae', -.18, 0, 0, g); return g }
  function thermoModel() { const g = w.group(0, 0, 0); w.box(.05, .05, .3, '#eceff1', 0, 0, 0, g); w.ball(.045, '#ef5350', 0, 0, .17, g); return g }
  function plasterModel(col) { const g = w.group(0, 0, 0); w.box(.22, .02, .09, col || '#ffb74d', 0, 0, 0, g); w.box(.08, .024, .07, '#fff3e0', 0, 0, 0, g); return g }
  function brushModel() { const g = w.group(0, 0, 0); w.box(.06, .05, .34, '#8d6e63', 0, 0, 0, g); w.box(.16, .08, .12, '#a1887f', 0, .02, .14, g); return g }
  function foodModel(kind) {
    const g = w.group(0, 0, 0);
    if (kind === 'bone') { w.box(.06, .05, .3, '#fafafa', 0, 0, 0, g); w.ball(.07, '#fafafa', 0, 0, .16, g); w.ball(.07, '#fafafa', 0, 0, -.16, g) }
    else if (kind === 'fish') { w.ball(.12, '#78909c', 0, 0, 0, g, 1.4, .7, .7); const t = w.cyl(.01, .09, .14, '#607d8b', 0, 0, -.2, g); t.rotation.x = Math.PI / 2 }
    else if (kind === 'carrot') { const c = w.cyl(.015, .06, .3, '#fb8c00', 0, 0, 0, g); c.rotation.x = Math.PI / 2; w.ball(.05, '#66bb6a', 0, .02, -.17, g, 1, 1.4, 1) }
    else if (kind === 'leaf') w.ball(.11, '#66bb6a', 0, 0, 0, g, 1.3, .3, .9)
    else if (kind === 'seeds') { [[0, 0, 0], [.05, .02, .04], [-.05, .02, .03], [0, .04, -.04]].forEach(p => w.ball(.035, '#d7a86e', p[0], p[1], p[2], g)) }
    else if (kind === 'leaves') { [[0, 0, 0], [.07, .03, .02], [-.06, .04, -.03]].forEach(p => w.ball(.08, '#7cb342', p[0], p[1], p[2], g, 1.2, .35, .8)) }
    else if (kind === 'banana') { const t = new THREE.Mesh(new THREE.TorusGeometry(.14, .045, 10, 14, Math.PI * 1.1), new THREE.MeshStandardMaterial({ color: '#ffee58', roughness: .8 })); t.rotation.z = -.4; g.add(t) }
    else if (kind === 'salad') { w.ball(.13, '#aed581', 0, 0, 0, g, 1.2, .6, 1.2); w.ball(.06, '#ef5350', .06, .06, .03, g); w.ball(.06, '#fff176', -.06, .05, -.02, g) }
    return g;
  }

  // ---------- תשתית שלבים (שלד dentist3d) ----------
  const CAMS = {
    wide: { p: [0, 2.4, 6.0], l: [0, 1.3, 0] },
    table: { p: [0.7, 2.4, 5.0], l: [0.2, 1.25, -0.3] }, // הורחב — מגש הכלים בפריים ב-390 וב-1100 (נמדד)
    heart: { p: [1.1, 2.6, 5.2], l: [0.3, 1.25, -0.2] }, // הורחב — הכלי על המגש בפריים ב-390 וב-1100 (נמדד)
    head: { p: [1.0, 2.8, 5.0], l: [0.2, 1.95, -0.2] }, // הורחב — כמו heart
    body: { p: [0.9, 2.1, 2.8], l: [0, 1.35, -0.4] },
    bowl: { p: [0.6, 3.3, 8.0], l: [-0.25, 0.75, 1.1] } // רחב — קערה+טבעת ושורת האוכל בפריים ב-390 וב-1100 (נמדד)
  };
  // גובה ראש החיה בעולם — חיות גבוהות (ג'ירפה/פיל) צריכות מצלמת head גבוהה יותר
  scene.updateMatrixWorld(true);
  const headWY = wp(headG).y, bodyWY = heartAt().y;
  CAMS.head.l[1] = Math.max(CAMS.head.l[1], headWY);
  CAMS.head.p[1] = Math.max(CAMS.head.p[1], headWY + .35);
  CAMS.heart.l[1] = Math.max(CAMS.heart.l[1], bodyWY);
  CAMS.heart.p[1] = Math.max(CAMS.heart.p[1], bodyWY + .6);
  if (A.neck) { CAMS.body.p = [1.2, 2.9, 4.4]; CAMS.body.l[1] = Math.min(headWY, 2.2) } // ג'ירפה: גם הראש בפריים במצלמת הגוף
  let stage = 0, stageObjs = [], stageDrags = [], stageTargets = [], stageRubs = [], stageTweens = [], stageDom = [];
  const draggables = w._drags, targets = w._tgts, rubs = w._rubs;
  function clearGroup(arr) { arr.forEach(o => { o.parent && o.parent.remove(o) }); arr.length = 0 }
  function cleanupStage() {
    stageDom.forEach(e => e.remove()); stageDom.length = 0;
    clearGroup(stageObjs);
    stageDrags.forEach(d => { const i = draggables.indexOf(d); if (i >= 0) draggables.splice(i, 1) });
    stageTargets.forEach(t => { if (t.ring) t.ring.visible = false; const i = targets.indexOf(t); if (i >= 0) targets.splice(i, 1) });
    stageRubs.forEach(r => { const i = rubs.indexOf(r); if (i >= 0) rubs.splice(i, 1) });
    stageDrags = []; stageTargets = []; stageRubs = []; stageTweens = [];
    scratchMeshes.forEach(s => s.visible = false);
    dirtMeshes.forEach(d => { d.visible = false; d.scale.setScalar(1) });
  }
  function shuffled(a) { return a.slice().sort(() => Math.random() - .5) }
  function fly(name) { const c = CAMS[name]; w.flyTo(c.p[0], c.p[1], c.p[2], c.l[0], c.l[1], c.l[2]) }
  function tw(dur, set, done) { const t0 = performance.now(); stageTweens.push({ t0, dur, set, done }) }
  w.onTick(() => {
    const now = performance.now();
    for (let i = stageTweens.length - 1; i >= 0; i--) {
      const k = Math.min(1, (now - stageTweens[i].t0) / stageTweens[i].dur);
      stageTweens[i].set(1 - Math.pow(1 - k, 3));
      if (k >= 1) { const d = stageTweens[i].done; stageTweens.splice(i, 1); d && d() }
    }
  });
  function nextStage() { w.progressStep(); setTimeout(() => setStage(stage + 1), 1500) } // כלל 9

  // כתמי שריטה וכתמי לכלוך — נוצרים פעם אחת על הגוף, מוסתרים בין שלבים
  const scratchMeshes = [], dirtMeshes = [];
  [[-.2, .3, .3], [.18, .18, .33], [0, .5, .28]].forEach(p => {
    const s = w.ball(.07 * S, '#e57373', p[0] * S, p[1] * S, p[2] * S, bodyG, 1, 1, .4); s.visible = false; scratchMeshes.push(s);
  });
  [[.15, .5, .25], [-.14, .55, .2], [0, .68, .05]].forEach(p => {
    const d = w.ball(.09 * S, '#8d6e63', p[0] * S, p[1] * S, p[2] * S, bodyG, 1, .6, .6); d.visible = false; dirtMeshes.push(d);
  });

  // ---------- pet: ליטוף מרגיע (רקס בלבד) ----------
  function stagePet(diff) {
    cleanupStage(); fly('table');
    w.banner('לטפי את רקס בעדינות', null);
    speak('רקס הכלבלב נשרט במשחק. קודם נלטף אותו כדי שירגע');
    const proxy = w.group(0, 0, 0); proxy.position.copy(furAt()); stageObjs.push(proxy);
    const rub = w.registerRub(proxy, {
      needed: 600, radiusPx: 170,
      onProgress: (k) => { if (Math.random() < .12) sfx('tick') },
      onDone: () => { sfx('sparkle'); speak('שלוש! רקס רגוע ומוכן לבדיקה'); nextStage() }
    });
    stageRubs.push(rub);
  }

  // ---------- stetho: האזנה ללב ----------
  function stageStetho(diff) {
    cleanupStage(); fly('heart');
    w.banner('בודקים את הלב', null);
    speak('שימי את הסטטוסקופ על הלב');
    const n = Math.min(diff, 3); let got = 0;
    const m = stethoModel(); m.position.set(1.3, 1.05, 0.9); scene.add(m); stageObjs.push(m);
    const dr = w.makeDraggable(m, { proxyR: .3, onPick: () => { sfx('tick'); speak('סטטוסקופ') } });
    stageDrags.push(dr);
    const anchor = w.group(0, 0, 0); anchor.position.copy(heartAt()); scene.add(anchor); stageObjs.push(anchor); w.noRay(anchor);
    const tgt = w.addDropTarget(anchor, {
      radiusPx: 150, ringR: .22, ringPos: new THREE.Vector3(0, 0, 0),
      onDrop: (d) => {
        got++; sfx('good'); speak('מקשיבים ללב');
        d.grp.position.copy(d.home);
        tw(1200, k => { const s = 1 + Math.sin(k * Math.PI * 4) * .06; bodyG.scale.set(s, s, s) });
        if (got >= n) { speak('שומעים את הלב! הוא פועם חזק'); nextStage() }
        else speak('עכשיו על הלב!');
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- temp: מדידת חום ----------
  function stageTemp(diff) {
    cleanupStage(); fly('head');
    w.banner('מודדים חום', null);
    speak('החזיקי את המדחום על המצח');
    const m = thermoModel(); m.position.set(1.3, 1.05, 0.9); scene.add(m); stageObjs.push(m);
    const dr = w.makeDraggable(m, { proxyR: .3, onPick: () => { sfx('tick'); speak('מדחום') } });
    stageDrags.push(dr);
    const anchor = w.group(0, 0, 0); anchor.position.copy(foreheadAt()); scene.add(anchor); stageObjs.push(anchor); w.noRay(anchor);
    let hold = null;
    const tgt = w.addDropTarget(anchor, {
      radiusPx: 150, ringR: .2, ringPos: new THREE.Vector3(0, 0, 0),
      onDrop: (d) => {
        d.active = false; sfx('good'); speak('בודקים את החום...');
        d.grp.position.copy(anchor.position); d.grp.position.y -= .1; // נשאר על המצח — נחיתה נראית
        tw(1800 + 600 * (diff - 1), k => { if (Math.random() < .1) sfx('tick') }, () => { speak('החום בסדר גמור!'); nextStage() });
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- bandage: פלסטר על שריטה ----------
  function stageBandage(diff) {
    cleanupStage(); fly('body');
    w.banner('שמים פלסטר', null);
    speak('שימי פלסטר צבעוני על השריטה');
    const n = Math.min(1 + diff, 3);
    const spots = shuffled(scratchMeshes).slice(0, n);
    spots.forEach(s => s.visible = true);
    const COLS = ['#ffb74d', '#f48fb1', '#81d4fa'];
    let left = n;
    spots.forEach((spot, i) => {
      const pm = plasterModel(COLS[i % 3]);
      pm.position.set(0.85, 1.05, 0.6 + i * .28); // טור יחיד על המגש — x=1.55 יצא מהפריים ב-1100 וב-390 (כלל 27)
      scene.add(pm); stageObjs.push(pm);
      const dr = w.makeDraggable(pm, { proxyR: .3, onPick: () => { sfx('tick'); speak('פלסטר') } });
      stageDrags.push(dr);
      const anchor = w.group(0, 0, 0); anchor.position.copy(wp(spot)); scene.add(anchor); stageObjs.push(anchor); w.noRay(anchor);
      const tgt = w.addDropTarget(anchor, {
        radiusPx: 130, ringR: .18, ringPos: new THREE.Vector3(0, 0, 0),
        onDrop: (d) => {
          left--; sfx('good'); d.active = false;
          d.grp.position.copy(anchor.position); d.grp.position.z += .05; // נדבק על הכתם — נשאר גלוי
          spot.visible = false;
          speak(left > 0 ? 'נכון!' : 'הפלסטר על השריטה! כבר יהיה טוב');
          if (left <= 0) nextStage();
        }
      });
      stageTargets.push(tgt); tgt.ring.visible = true;
    });
  }

  // ---------- furscrub: הברשת פרווה ----------
  function stageFurscrub(diff) {
    cleanupStage(); fly('body');
    w.banner('מברישים את הפרווה', null);
    speak('הברישי את הפרווה עד שהיא נקייה ומבריקה');
    dirtMeshes.forEach(d => d.visible = true);
    const proxy = w.group(0, 0, 0); proxy.position.copy(furAt()); stageObjs.push(proxy);
    const rub = w.registerRub(proxy, {
      needed: 500 + 300 * (diff - 1), radiusPx: 170,
      onProgress: (k) => {
        dirtMeshes.forEach(d => { const s = Math.max(.01, 1 - k); d.scale.setScalar(s) });
        if (Math.random() < .12) sfx('tick');
      },
      onDone: () => {
        sfx('sparkle'); speak('הפרווה נקייה ומבריקה!');
        tw(600, k => { const s = 1 + Math.sin(k * Math.PI) * .04; animal.scale.set(s, s, s) });
        nextStage();
      }
    });
    stageRubs.push(rub);
  }

  // ---------- feed: האכלה בקערה ----------
  function stageFeed(diff) {
    cleanupStage(); fly('bowl');
    w.banner('מה אוכלים?', null);
    speak(A.food === 'bone' ? 'רקס רעב אחרי הטיפול! גררי את העצם אל הקערה' : 'היא רעבה אחרי הטיפול! גררי את האוכל אל הקערה');
    const n = Math.min(diff, 3);
    let left = n;
    for (let i = 0; i < n; i++) {
      const f = foodModel(A.food);
      f.position.set(0.5 + i * .2, 1.05, 0.88); // שורה מרווחת — טור z קרס חזותית לפריט אחד
      scene.add(f); stageObjs.push(f);
      const dr = w.makeDraggable(f, { proxyR: .3, onPick: () => { sfx('tick') } });
      stageDrags.push(dr);
    }
    const tgt = w.addDropTarget(bowlAnchor, {
      radiusPx: 150, ringR: .34, ringParent: bowl, ringPos: new THREE.Vector3(0, .32, 0), ringRot: { x: Math.PI / 2 },
      onDrop: (d) => {
        left--; sfx('good'); d.active = false;
        d.grp.position.set(bowl.position.x + (left % 2 ? .12 : -.12), .38, bowl.position.z + (left % 2 ? -.06 : .06));
        d.grp.scale.setScalar(.7); // נוחת בתוך הקערה — נראה
        speak(left > 0 ? 'נכון!' : (A.food === 'bone' ? 'טעים! רקס אוהב את העצם' : 'יאמי! כל הכבוד'));
        if (left <= 0) nextStage();
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- diagnose: בחירת הכלי הנכון לתלונה ----------
  function stageDiagnose(diff) {
    cleanupStage(); fly('table');
    w.banner('מה עושים קודם בבדיקה?', null);
    speak('מה עושים קודם בבדיקה?');
    const TOOL_FOR = { bandage: 'plaster', temp: 'thermo', stetho: 'stetho', furscrub: 'brush', feed: 'food' };
    const nextAct = ACTS[stage + 1];
    const correct = TOOL_FOR[nextAct] || 'stetho';
    const ALL = [
      { id: 'stetho', mk: stethoModel, n: 'סטטוסקופ' },
      { id: 'thermo', mk: thermoModel, n: 'מדחום' },
      { id: 'plaster', mk: () => plasterModel(), n: 'פלסטר' },
      { id: 'brush', mk: brushModel, n: 'מברשת' },
      { id: 'food', mk: () => foodModel(A.food), n: 'אוכל' }
    ];
    const corrDef = ALL.find(d => d.id === correct);
    const defs = shuffled([corrDef, ...shuffled(ALL.filter(d => d.id !== correct)).slice(0, 2)]); // הכלי הנכון תמיד על המגש
    defs.forEach((d, i) => {
      const m = d.mk(); m.position.set(0.35 + i * .4, 1.05, 0.85); // שורה עם ריווח — טור z קרס לכ-20px והבחירה נתפסה על הכלי הלא נכון
      scene.add(m); stageObjs.push(m);
      const dr = w.makeDraggable(m, { proxyR: .3, onPick: () => { sfx('tick'); speak(d.n) } });
      dr.userData = { tool: d.id };
      stageDrags.push(dr);
    });
    const anchor = w.group(0, 0, 0); anchor.position.copy(furAt()); scene.add(anchor); stageObjs.push(anchor); w.noRay(anchor);
    const tgt = w.addDropTarget(anchor, {
      radiusPx: 160, ringR: .3, ringPos: new THREE.Vector3(0, 0, 0),
      onDrop: (d) => {
        if (d.userData.tool === correct) {
          sfx('good'); speak('סדר בדיקה נכון! יודעים מה לעשות');
          d.active = false; d.grp.position.copy(d.home);
          nextStage();
        } else { sfx('oops'); speak('זה לא הפריט הנכון. נסי שוב!'); d.grp.position.copy(d.home) }
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- סיום ביקור ----------
  let visitCounted = false;
  function stageDone() {
    cleanupStage(); fly('wide');
    let r = null;
    if (!visitCounted && typeof STATE !== 'undefined') { // completeVisit ידני ל-vet3d2 (prog3d קשור ל-role+'3d' = המסלול החי)
      const p = w.getProgress('vet3d2') || { visits: 0, stars: 0, lvl: 1 };
      const maxL = VROLE ? VROLE.levels.length : 4;
      const nl = Math.min(maxL, (p.lvl || 1) + 1);
      r = { lvl: nl, newLevel: nl > (p.lvl || 1) };
      STATE.vet3d2 = { visits: (p.visits || 0) + 1, stars: (p.stars || 0) + 1, lvl: r.newLevel ? nl : (p.lvl || 1) };
      saveState();
    }
    visitCounted = true;
    w.banner(r && r.newLevel ? 'רמה ' + r.lvl + ' נפתחה!' : 'כל הכבוד! סיימת!', null);
    w.endPanel(cust.c[1] + ' מרגיש/ה הרבה יותר טוב!', 'ביקור חדש', () => { w.dispose(); startVet3D2(root); }); // ביקור חדש במקום — כמו dentist (reload החזיר ללובי)
    speak('עזרת ל' + cust.c[1] + '! כל הכבוד רונה!', () => { if (r && r.newLevel) speak('רמה ' + r.lvl + ' נפתחה!') });
  }

  // ---------- מנוע שלבים ----------
  const BUILDERS = { pet: stagePet, stetho: stageStetho, temp: stageTemp, bandage: stageBandage, furscrub: stageFurscrub, feed: stageFeed, diagnose: stageDiagnose };
  function setStage(i) {
    stage = i;
    if (i >= ACTS.length) { stageDone(); return }
    BUILDERS[ACTS[i]](DIFF[ACTS[i]] || 1);
  }
  w.progressInit(ACTS.length);

  // פתיחה
  fly('wide');
  w.banner(cust.c[1] + ' במרפאה!', null);
  const devJump = new URLSearchParams(location.search).get('vetstage');
  if (devJump !== null) setStage(+devJump);
  else speak(cust.say, () => setStage(0));
  w.getStage = () => stage;
  w.ACTS = ACTS;
  return w.dispose.bind(w);
}
function startVet3D2Into(root) { const c = startVet3D2(root); window.__scene3dCleanup = c || null }
