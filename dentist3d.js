// dentist3d.js — מרפאת שיניים תלת-ממדית: בחירת כלים → צחצוח → שן מתנדנדת → מיון חטיפים → טלאי → ספירת שיניים.
// נבנה על world3d.js. כיסוי פעילויות dentist: toolpick, brush, wobbly, snacksort, patch, teethcount — רמות 1-4 (כמו roles.js).
// התקדמות: prog3d בלבד (STATE.dentist3d). הקלאסי לא נגע. הלקוח/תרחיש מסתובב לפי visits בתוך רמת התלת-ממד.
// לקחים מהחנות שיושמו מראש: home נקבע בפיזור סופי לפני makeDraggable, פריט נכון נוחת ונראה (לא נעלם),
// סלי מיון עם דוגמת-פריט ללא-קוראים, מטרות עם עוגן בגובה הפעולה, הקשות דרך מטרה-עצמית (בלי oops).
function startDentist3D(root) {
  const w = startWorld3D(root, { bg: '#d9f2f5' });
  if (!w) return null;
  const { THREE, scene } = w;

  const lvl = Math.min(4, (typeof prog3d !== 'undefined' ? prog3d.get('dentist').lvl : 1)); // רמת תלת-ממד נפרדת
  const eff = Math.min(3, lvl); // תקרת קושי 3 מכוונת (כלל 23); רמה 4 = יותר לקוחות/וריאציות
  const prog = w.getProgress('dentist3d') || { visits: 0, stars: 0 };
  const DROLE = (typeof ROLES !== 'undefined') && ROLES.find(r => r.id === 'dentist');
  const CUSTS = DROLE ? DROLE.levels[lvl - 1] : [{ c: ['🐱', 'לולה החתולה'], say: 'יש לי שן חלבית מתנדנדת!', a: [['toolpick', 1], ['brush', 1], ['wobbly', 1]] }];
  const cust = CUSTS[prog.visits % CUSTS.length];
  const ACTS = cust.a.map(x => x[0]); // רצף הפעילויות של הביקור — כמו הקלאסי
  const DIFF = {}; cust.a.forEach(x => DIFF[x[0]] = x[1]);

  // ---------- המרפאה ----------
  w.buildRoom({ floor: '#9fd8e8', wallA: '#e3f6fa', wallB: '#c9ead9' });
  // כיסא טיפולים שמן
  const chair = w.group(0, 0, -0.7);
  w.box(1.1, .35, 2.0, '#4aa8e0', 0, .55, 0, chair);           // בסיס
  w.box(1.0, .12, 1.9, '#8ed0f5', 0, .78, 0, chair);           // כרית
  const back = w.box(1.0, 1.1, .14, '#4aa8e0', 0, 1.25, -0.95, chair); back.rotation.x = -.5; // משענת נטויה
  w.box(.9, .25, .3, '#8ed0f5', 0, 1.62, -1.13, chair);        // משענת ראש
  w.box(1.3, .18, .6, '#357a9e', 0, .32, 0, chair);            // בסיס תחתון
  // מנורת מרפאה
  const lamp = w.group(-1.9, 0, -0.9);
  w.cyl(.06, .08, 2.6, '#78909c', 0, 1.3, 0, lamp);
  const lampArm = w.cyl(.05, .05, 1.1, '#78909c', .45, 2.55, 0, lamp); lampArm.rotation.z = 1.1;
  const lampHead = w.ball(.22, '#fff9c4', .9, 2.7, 0, lamp, 1.3, .8, 1.3); lampHead.material.emissive = new THREE.Color('#fff3a0'); lampHead.material.emissiveIntensity = .5;
  // שידת כלים + כיור
  w.box(1.2, .9, .6, '#eceff1', -2.3, .45, -2.6);
  w.box(1.3, .08, .7, '#ffffff', -2.3, .95, -2.6);
  w.cyl(.3, .25, .12, '#b3e5fc', -2.3, 1.02, -2.6);
  // פוסטר שן מחייכת (קנבס — לא תלוי גופן)
  function toothPoster() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#4fc3f7'; g.fillRect(0, 0, 128, 14); g.fillRect(0, 114, 128, 14);
    g.fillStyle = '#fafafa'; g.strokeStyle = '#90a4ae'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(34, 30); g.quadraticCurveTo(64, 14, 94, 30); g.quadraticCurveTo(106, 62, 88, 104);
    g.quadraticCurveTo(78, 112, 72, 96); g.quadraticCurveTo(64, 88, 56, 96); g.quadraticCurveTo(50, 112, 40, 104);
    g.quadraticCurveTo(22, 62, 34, 30); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#37474f';
    g.beginPath(); g.arc(52, 52, 4, 0, 7); g.fill(); g.beginPath(); g.arc(76, 52, 4, 0, 7); g.fill();
    g.strokeStyle = '#37474f'; g.lineWidth = 3.5; g.beginPath(); g.arc(64, 60, 12, .4, Math.PI - .4); g.stroke();
    return new THREE.CanvasTexture(cv);
  }
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: toothPoster() }));
  poster.position.set(2.6, 3.1, -4.34); scene.add(poster); w.noRay(poster);
  // עציץ
  const pot = w.group(2.9, 0, -3.6); w.cyl(.22, .16, .4, '#e08e5a', 0, .2, 0, pot); w.ball(.4, '#66bb6a', 0, .68, 0, pot, 1, .9, 1); w.noRay(pot);

  // ---------- המטופלת (דמות מסתובבת — צבע לפי ביקור) ----------
  const CUST_COLORS = ['#f4a460', '#b57edc', '#90caf9', '#a5d6a7', '#f48fb1', '#ffe082', '#ffab91'];
  const pcol = CUST_COLORS[prog.visits % CUST_COLORS.length];
  const patient = w.group(0, 0, -0.55);
  w.ball(.48, pcol, 0, 1.05, -.15, patient, 1, 1.05, .9);       // גוף יושב
  w.ball(.16, pcol, -.42, 1.0, -.05, patient, .7, 1.2, .7);     // זרועות
  w.ball(.16, pcol, .42, 1.0, -.05, patient, .7, 1.2, .7);
  const headG = w.group(0, 1.78, .02, patient);
  w.ball(.5, pcol, 0, 0, -.04, headG, 1, .95, .92);
  w.ball(.12, pcol, -.3, .42, -.05, headG); w.ball(.12, pcol, .3, .42, -.05, headG); // אוזניים
  w.ball(.06, '#3e2723', -.17, .12, .42, headG); w.ball(.06, '#3e2723', .17, .12, .42, headG); // עיניים
  w.ball(.05, '#f8bbd0', -.3, -.05, .35, headG, 1, .7, .5); w.ball(.05, '#f8bbd0', .3, -.05, .35, headG, 1, .7, .5); // לחיים
  // הפה הפתוח — מרכז האינטראקציה
  const mouth = w.ball(.24, '#7f2f42', 0, -.18, .34, headG, 1.15, .8, .5); mouth.material.roughness = .6;
  const TEETH = []; // {m, base:Color, row}
  for (let k = 0; k < 4; k++) {
    const tu = w.box(.085, .1, .07, '#fdfdf8', -.15 + k * .1, -.065, .44, headG); tu.rotation.x = .12;
    const tl = w.box(.085, .1, .07, '#fdfdf8', -.15 + k * .1, -.3, .42, headG); tl.rotation.x = -.12;
    TEETH.push({ m: tu, row: 'u' }, { m: tl, row: 'l' });
  }
  TEETH.forEach(t => { t.base = t.m.material.color.clone(); t.m.castShadow = false });
  w.noRay(patient); // הדמות דקור; אינטראקציה רק דרך פרוקסים ייעודיים

  // ---------- מגש כלים (ימין) ----------
  const tray = w.group(1.3, 0, 0.9); // מרכז-ימין: כל הכלים בפריים גם במובייל (נמצא ב-e2e)
  w.box(1.5, .08, .8, '#ffffff', 0, .92, 0, tray);
  w.box(1.4, .05, .7, '#b2dfdb', 0, .965, 0, tray);
  [[-.65, -.3], [.65, -.3], [-.65, .3], [.65, .3]].forEach(p => w.cyl(.04, .04, .9, '#90a4ae', p[0], .45, p[1], tray));
  w.noRay(tray);

  // כוס שטיפה — מטרת הכלים ב-toolpick, עוגן בגובה הפתח (לקח עגלה מהחנות)
  const cup = w.group(-1.55, 0, 0.5);
  w.cyl(.16, .12, .3, '#4fc3f7', 0, 1.05, 0, cup);
  w.cyl(.13, .13, .03, '#b3e5fc', 0, 1.19, 0, cup);
  const cupAnchor = w.group(-1.55, 1.28, 0.5); w.noRay(cupAnchor);
  w.noRay(cup);

  // ---------- דגמי כלים/פריטים ----------
  function brushModel() { // מברשת שיניים
    const g = w.group(0, 0, 0);
    const h = w.box(.06, .05, .42, '#ef5350', 0, 0, 0, g); h.castShadow = true;
    w.box(.09, .06, .14, '#ef5350', 0, .01, .26, g);
    for (let i = 0; i < 3; i++) w.box(.07, .05, .03, '#eceff1', 0, .05, .21 + i * .045, g);
    return g;
  }
  function pasteModel() { // משחת שיניים
    const g = w.group(0, 0, 0);
    w.cyl(.07, .08, .3, '#4fc3f7', 0, .15, 0, g);
    w.cyl(.04, .04, .07, '#eceff1', 0, .34, 0, g);
    w.box(.09, .12, .02, '#ffffff', 0, .16, .075, g);
    return g;
  }
  function spoonModel() {
    const g = w.group(0, 0, 0);
    w.cyl(.025, .025, .34, '#cfd8dc', 0, .17, 0, g);
    w.ball(.07, '#eceff1', 0, .38, 0, g, 1, 1.3, .5);
    return g;
  }
  function combModel() {
    const g = w.group(0, 0, 0);
    w.box(.3, .06, .05, '#ab47bc', 0, .12, 0, g);
    for (let i = 0; i < 5; i++) w.box(.03, .1, .04, '#ab47bc', -.12 + i * .06, .03, 0, g);
    return g;
  }
  function crayonModel() {
    const g = w.group(0, 0, 0);
    w.cyl(.045, .045, .3, '#ffb300', 0, .15, 0, g);
    w.cyl(.0, .045, .08, '#ff8f00', 0, .34, 0, g);
    return g;
  }
  function patchModel(col) { // טלאי קסם — עיגול צבעוני עם לב
    const g = w.group(0, 0, 0);
    const d = w.cyl(.11, .11, .03, col || '#ffd54f', 0, 0, 0, g); d.rotation.x = Math.PI / 2;
    const h = w.ball(.045, '#ffffff', 0, 0, .025, g, 1, 1, .4);
    return g;
  }
  function snackModel(kind) {
    const g = w.group(0, 0, 0);
    const M = {
      apple: () => { w.ball(.15, '#e53935', 0, .15, 0, g); w.cyl(.015, .015, .1, '#6d4c41', 0, .32, 0, g) },
      carrot: () => { const c = w.cyl(.04, .12, .45, '#ef6c00', 0, .22, 0, g); [-.05, 0, .05].forEach(x => w.ball(.06, '#43a047', x, .47, 0, g, .7, 1.2, .7)) },
      milk: () => { w.box(.2, .34, .2, '#eceff1', 0, .17, 0, g); w.box(.2, .09, .2, '#4fc3f7', 0, .38, 0, g) },
      cheese: () => { const c = w.box(.3, .1, .3, '#ffca28', 0, .05, 0, g); c.rotation.y = .6 },
      cookie: () => { w.cyl(.16, .16, .06, '#a1703a', 0, .03, 0, g); w.ball(.03, '#5d4037', .05, .07, .05, g); w.ball(.03, '#5d4037', -.06, .07, -.03, g) },
      cake: () => { w.cyl(.17, .17, .15, '#f48fb1', 0, .08, 0, g); w.cyl(.18, .18, .05, '#fff', 0, .17, 0, g); w.ball(.05, '#e53935', 0, .22, 0, g) },
      juice: () => { w.box(.19, .32, .19, '#ffb74d', 0, .16, 0, g); w.box(.19, .06, .19, '#e65100', 0, .35, 0, g) }
    };
    (M[kind] || M.apple)(); return g;
  }

  // ---------- ניהול שלבים ----------
  const NUM_WORDS = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה'];
  const CAMS = { // נכתב לדסקטופ; נייד מקבל ריווח אוטומטי (כלל 15)
    wide: { p: [0, 2.4, 6.6], l: [0, 1.3, -0.3] },
    tray: { p: [0.7, 2.3, 6.2], l: [0.6, 1.15, 0.5] },
    mouth: { p: [0, 2.0, 2.4], l: [0, 1.68, -0.45] },
    snack: { p: [0, 2.3, 7.4], l: [0, 0.8, 2.3] }
  };
  let stage = 0, visitCounted = false;
  const stageDom = [];
  let stageObjs = [], stageDrags = [], stageTargets = [], stageRubs = [], stageTweens = [];
  const draggables = w._drags, targets = w._tgts, rubs = w._rubs;
  function clearGroup(arr) { arr.forEach(o => { o.parent && o.parent.remove(o) }); arr.length = 0 }
  function cleanupStage() {
    stageDom.forEach(e => e.remove()); stageDom.length = 0;
    clearGroup(stageObjs);
    stageDrags.forEach(d => { const i = draggables.indexOf(d); if (i >= 0) draggables.splice(i, 1) });
    stageTargets.forEach(t => { if (t.ring) t.ring.visible = false; const i = targets.indexOf(t); if (i >= 0) targets.splice(i, 1) }); // כלל 17
    stageRubs.forEach(r => { const i = rubs.indexOf(r); if (i >= 0) rubs.splice(i, 1) });
    stageDrags = []; stageTargets = []; stageRubs = []; stageTweens = [];
    TEETH.forEach(t => { t.m.material.color.copy(t.base); t.m.material.emissive = new THREE.Color('#000000'); t.m.material.emissiveIntensity = 0; t.m.visible = true; t.m.scale.set(1, 1, 1); t.m.rotation.z = 0 });
  }
  function shuffled(a) { return a.slice().sort(() => Math.random() - .5) }
  // הקשה על שן: הגריר חייב להיות ילד ישיר של scene — world3d לוכד z מיקום מקומי למישור הגרירה,
  // ולשן (ילדית headG) z מקומי ≠ עולמי, מה שמעיף את הנראות בזמן גרירה (פגם שנמצא ב-e2e).
  function tapProxy(toothMesh, onTap, radiusPx) {
    const wp = new THREE.Vector3(); toothMesh.getWorldPosition(wp);
    const proxy = w.group(wp.x, wp.y, wp.z); stageObjs.push(proxy);
    const dr = w.makeDraggable(proxy, { proxyR: .3, onPick: () => sfx('tick') }); // home = מיקום עולמי סופי
    stageDrags.push(dr);
    const selfT = w.addDropTarget(toothMesh, {
      radiusPx: radiusPx || 85, ring: false,
      onDrop: (d) => { d.grp.position.copy(d.home); onTap(d) }
    });
    stageTargets.push(selfT);
    return dr;
  }
  function fly(name) { const c = CAMS[name]; w.flyTo(c.p[0], c.p[1], c.p[2], c.l[0], c.l[1], c.l[2]) }
  function tw(dur, set, done) { const t0 = performance.now(); stageTweens.push({ t0, dur, set, done }); }
  w.onTick(() => { // משאבת טווינים של הסצנה
    const now = performance.now();
    for (let i = stageTweens.length - 1; i >= 0; i--) {
      const k = Math.min(1, (now - stageTweens[i].t0) / stageTweens[i].dur);
      stageTweens[i].set(1 - Math.pow(1 - k, 3));
      if (k >= 1) { const d = stageTweens[i].done; stageTweens.splice(i, 1); d && d(); }
    }
  });
  function nextStage() { w.progressStep(); setTimeout(() => setStage(stage + 1), 1500) } // כלל 9: טיימר, לא אודיו
  // מיקום נחיתה נראה ליד הכוס למכשיר שנבחר נכון (לקח: משוב נכון מתמשך)
  let landedTools = 0;

  // ---------- toolpick: בחירת מברשת ומשחה ----------
  function stageToolpick(diff) {
    cleanupStage(); fly('tray');
    w.banner('מה צריך לצחצח שיניים?', null);
    speak('בחרי מברשת ומשחה כדי לנקות את השיניים');
    const defs = [
      { id: 'brush', n: 'מברשת', good: true, mk: brushModel },
      { id: 'paste', n: 'משחה', good: true, mk: pasteModel },
      { id: 'spoon', n: 'כף', good: false, mk: spoonModel },
      { id: 'comb', n: 'מסרק', good: false, mk: combModel },
      { id: 'crayon', n: 'צבע', good: false, mk: crayonModel }
    ].slice(0, 3 + Math.min(diff, 2)); // רמה 1: 3 כלים, רמה 2: 4, רמה 3: 5
    const row = shuffled(defs);
    let got = 0; const need = row.filter(d => d.good).length;
    row.forEach((d, i) => {
      const m = d.mk(); m.position.set(-0.5 + i * (1.0 / Math.max(1, row.length - 1)) * 1.0 + 0.0, 1.05, 0);
      m.position.x = (i - (row.length - 1) / 2) * .27; // צפוף יותר — כל החריצים נראים במובייל
      tray.add(m); stageObjs.push(m);
      const dr = w.makeDraggable(m, { proxyR: .3, onPick: () => { sfx('tick'); speak(d.n) } }); // home = מיקום סופי (נוצר אחרי פיזור)
      dr.userData = { tool: d.id, good: d.good };
      stageDrags.push(dr);
    });
    const tgt = w.addDropTarget(cupAnchor, {
      radiusPx: 150, ringR: .3, ringParent: cup, ringPos: new THREE.Vector3(0, 1.3, 0),
      onDrop: (d) => {
        if (d.userData.good) {
          got++; sfx('good'); speak('נכון!');
          d.active = false;
          // נחיתה נראית: הכלי נשען על שידת הכלים — נשאר בסצנה
          const m = d.grp; tray.remove(m); scene.add(m); stageObjs.push(m);
          m.position.set(-2.15 + (landedTools % 2) * .35, 1.15, -2.5 + Math.floor(landedTools / 2) * .25); landedTools++;
          if (got >= need) { speak('יופי! יש מברשת ומשחה'); nextStage(); }
        } else { sfx('oops'); speak('זה לא הפריט הנכון. נסי שוב!'); d.grp.position.copy(d.home) }
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- brush: צחצוח במחוות על הפה ----------
  function stageBrush(diff) {
    cleanupStage(); fly('mouth');
    w.banner('צחצחי את השיניים!', null);
    speak('צחצחי במעגלים קטנים עד שהשיניים מנצנצות');
    const proxy = w.ball(.45, '#ffffff', 0, -.15, .35, headG); proxy.material.visible = false; stageObjs.push(proxy);
    const needed = 500 + 300 * (diff - 1);
    const rub = w.registerRub(proxy, {
      needed, radiusPx: 170,
      onProgress: (k) => {
        TEETH.forEach(t => { t.m.material.color.copy(t.base).lerp(new THREE.Color('#ffffff'), k * .5); t.m.material.emissive = new THREE.Color('#fffde7'); t.m.material.emissiveIntensity = k * .45 });
        if (Math.random() < .12) sfx('tick');
      },
      onDone: () => {
        sfx('sparkle'); speak('השיניים נקיות ומנצנצות!');
        TEETH.forEach((t, i) => tw(300 + i * 60, k => { const s = 1 + Math.sin(k * Math.PI) * .25; t.m.scale.set(s, s, s) }));
        nextStage();
      }
    });
    stageRubs.push(rub);
  }

  // ---------- wobbly: שן מתנדנדת (3 נגיעות עדינות) ----------
  function stageWobbly(diff) {
    cleanupStage(); fly('mouth');
    w.banner('איזו שן מתנדנדת?', null);
    speak('געי בעדינות בשן המתנדנדת');
    const tooth = TEETH[1].m; // שן קדמית עליונה
    tooth.material.color.set('#e8e2d4');
    const wigState = { taps: 0, done: false };
    w.onTick(t => { if (!wigState.done) tooth.rotation.z = Math.sin(t * 6) * (.12 + wigState.taps * .1) });
    // הקשה = גרירה זעירה למטרה-עצמית דרך פרוקסי ברמת-scene (בלי צליל oops)
    const wdr = tapProxy(tooth, (d) => {
      wigState.taps++; speak(NUM_WORDS[wigState.taps - 1]);
      if (wigState.taps >= 3) {
        wigState.done = true; d.active = false;
        const p0 = tooth.position.clone();
        tw(900, k => { tooth.position.y = p0.y - k * .8; tooth.rotation.z = k * 1.2; const s = 1 - k * .6; tooth.scale.set(s, s, s) }, () => {
          tooth.visible = false;
          sfx('good'); speak('השן נשרה לבד! היא הייתה מוכנה לצאת');
          nextStage();
        });
      }
    }, 90);
    wdr.userData = { wobbly: true };
  }

  // ---------- snacksort: מיון חטיפים לבריא/רק-קצת ----------
  function stageSnacksort(diff) {
    cleanupStage(); fly('snack');
    w.banner('מה טוב לשיניים?', null);
    speak('מייני: מה טוב לשיניים ומה רק קצת?');
    // סלים עם דוגמת פריט בולטת — קריא ללא-קוראים (לקח מהמיון בחנות)
    const binGood = w.group(-1.05, 0, 2.5), binJunk = w.group(1.05, 0, 2.5); // בתוך פריים המובייל
    [[binGood, '#43a047', 'apple'], [binJunk, '#8e24aa', 'cookie']].forEach(([b, c, cue]) => {
      w.cyl(.42, .3, .55, c, 0, .28, 0, b);
      w.cyl(.44, .44, .07, c, 0, .58, 0, b);
      const cueM = snackModel(cue); cueM.position.set(0, .85, 0); cueM.scale.setScalar(.8); b.add(cueM); w.noRay(cueM);
      stageObjs.push(b);
    });
    const goodPool = shuffled(['apple', 'carrot', 'milk', 'cheese']), junkPool = shuffled(['cookie', 'cake', 'juice']);
    const n = [0, 4, 6, 8][diff]; // כמו הקלאסי
    const pick = [];
    for (let i = 0; i < n; i++) pick.push(i % 2 === 0 ? { k: goodPool[(i / 2 | 0) % goodPool.length], good: true } : { k: junkPool[((i - 1) / 2 | 0) % junkPool.length], good: false });
    const items = shuffled(pick);
    const NAMES = { apple: 'תפוח', carrot: 'גזר', milk: 'חלב', cheese: 'גבינה', cookie: 'עוגייה', cake: 'עוגה', juice: 'מיץ' };
    let left = items.length;
    const landed = { good: 0, junk: 0 };
    items.forEach((it, i) => {
      const m = snackModel(it.k); m.scale.setScalar(1.15);
      // שורה קדמית לפני הסלים — עד 4 ברוחב; שורה שנייה מוגבהת (לא מאחורה — חפיפה בהיטל שובשה בחירה, נמצא ב-e2e)
      const back = i >= 4;
      m.position.set(((i % 4) - Math.min(items.length, 4) / 2 + .5) * .5, back ? 1.5 : .95, back ? 3.35 : 3.45);
      scene.add(m); stageObjs.push(m);
      const dr = w.makeDraggable(m, { proxyR: .3, onPick: () => { sfx('tick'); speak(NAMES[it.k]) } }); // home = מיקום סופי
      dr.userData = { snack: it.k, good: it.good };
      stageDrags.push(dr);
    });
    [[binGood, true], [binJunk, false]].forEach(([bin, isGood]) => {
      const anchor = w.group(0, 0, 0); anchor.position.set(bin.position.x, .75, bin.position.z); scene.add(anchor); stageObjs.push(anchor); w.noRay(anchor);
      const t = w.addDropTarget(anchor, {
        radiusPx: 160, ringR: .5, ringParent: bin, ringPos: new THREE.Vector3(0, .72, 0), ringRot: { x: Math.PI / 2 },
        accepts: () => true,
        onDrop: (d) => {
          if (d.userData.good === isGood) {
            left--; sfx('good'); speak('נכון!');
            d.active = false;
            const key = isGood ? 'good' : 'junk', c = landed[key]++;
            d.grp.position.set(bin.position.x + (c % 2 ? .13 : -.13), .62 + Math.floor(c / 2) * .12, bin.position.z + (c % 2 ? -.1 : .1));
            d.grp.scale.setScalar(.75);
            if (left <= 0) { speak('מיון מושלם! השיניים שמחות'); nextStage(); }
          } else { sfx('oops'); speak('זה לא הפריט הנכון. נסי שוב!'); d.grp.position.copy(d.home) }
        }
      });
      stageTargets.push(t); t.ring.visible = true;
    });
  }

  // ---------- patch: טלאי קסם על הנקודה החולה ----------
  function stagePatch(diff) {
    cleanupStage(); fly('mouth');
    w.banner('איפה הנקודה החולה?', null);
    speak('שימי טלאי קסם צבעוני על הנקודה החולה');
    const nSpots = diff >= 3 ? 2 : 1;
    const spotTeeth = shuffled(TEETH.slice()).slice(0, nSpots);
    const spots = spotTeeth.map((t, i) => {
      t.m.material.color.set('#efe6d8');
      const s = w.ball(.05, '#e0556e', 0, 0, .05, t.m); s.castShadow = false; // נקודה אדומה על השן
      return { tooth: t.m, dot: s, done: false };
    });
    let left = nSpots;
    spots.forEach((sp, i) => {
      const pm = patchModel(i ? '#f48fb1' : '#ffd54f');
      pm.position.set((i === 0 ? -0.45 : 0.45), 1.15, 0.2); // בתוך פריים מצלמת הפה — אומת בהקרנה (331-769, ~650)
      scene.add(pm); stageObjs.push(pm);
      const dr = w.makeDraggable(pm, { proxyR: .3, onPick: () => sfx('tick') }); // home = מיקום סופי
      dr.userData = { patch: i };
      stageDrags.push(dr);
      const anchor = w.group(0, 0, 0); sp.tooth.add(anchor); anchor.position.set(0, 0, .08); w.noRay(anchor);
      const t = w.addDropTarget(anchor, {
        radiusPx: 120, ringR: .14, ringPos: new THREE.Vector3(0, 0, .09),
        accepts: (d) => d.userData.patch === i,
        onDrop: (d) => {
          d.active = false; left--;
          const p = new THREE.Vector3(); sp.tooth.getWorldPosition(p);
          d.grp.position.set(0, 0, .09); sp.tooth.add(d.grp); // נדבק לשן — נשאר נראה
          sp.dot.visible = false; sp.tooth.material.color.copy(sp.tooth.material.color); sp.tooth.material.color.set('#fdfdf8');
          sfx('sparkle'); speak('הטלאי במקום! השן תהיה בריאה');
          if (left <= 0) nextStage();
        }
      });
      stageTargets.push(t); t.ring.visible = true;
    });
  }

  // ---------- teethcount: ספירת שיניים בהקשה ----------
  function stageTeethcount(diff) {
    cleanupStage(); fly('mouth');
    const n = [0, 4, 6, 7][diff]; // כמו הקלאסי
    w.banner('כמה שיניים יש?', null);
    speak('ספרי בקול את השיניים הגדולות!');
    let counted = 0;
    const countable = TEETH.slice(0, n);
    countable.forEach((t) => {
      const state = { counted: false };
      const dr = tapProxy(t.m, () => {
        if (state.counted) return;
        state.counted = true; counted++;
        t.m.material.emissive = new THREE.Color('#ffd54a'); t.m.material.emissiveIntensity = .8;
        sfx('good'); speak('' + counted); // ספירה בספרות — כמו countTap הקלאסי
        tw(350, k => { const s = 1 + Math.sin(k * Math.PI) * .3; t.m.scale.set(s, s, s) });
        if (counted >= n) { speak('ספרת את כל השיניים!'); nextStage(); }
      });
      dr.userData = { tooth: true, get counted() { return state.counted } };
    });
  }

  // ---------- סיום ביקור ----------
  function stageDone() {
    cleanupStage(); fly('wide');
    const r = (!visitCounted && typeof prog3d !== 'undefined') ? prog3d.completeVisit('dentist') : null;
    visitCounted = true;
    w.banner(r && r.newLevel ? 'רמה ' + r.lvl + ' נפתחה!' : 'כל הכבוד! סיימת!', null);
    w.endPanel('החיוך של ' + cust.c[1] + ' נקי ובריא!', 'ביקור חדש', () => location.reload());
    speak('כל הכבוד רונה!', () => { if (r && r.newLevel) speak('רמה ' + r.lvl + ' נפתחה!') });
  }

  // ---------- מנוע שלבים ----------
  const BUILDERS = { toolpick: stageToolpick, brush: stageBrush, wobbly: stageWobbly, snacksort: stageSnacksort, patch: stagePatch, teethcount: stageTeethcount };
  function setStage(i) {
    stage = i;
    if (i >= ACTS.length) { stageDone(); return }
    BUILDERS[ACTS[i]](DIFF[ACTS[i]] || 1);
  }
  w.progressInit(ACTS.length);

  // פתיחה: פניה לדמות + המשפט שלה (כמו הקלאסי)
  fly('wide');
  w.banner(cust.c[1] + ' במרפאה!', null);
  // פרמטר dev לבדיקות e2e: ?dentiststage=N מדלג לשלב (בלי הקראת פתיחה שתדרוס את הקפיצה)
  const devJump = new URLSearchParams(location.search).get('dentiststage');
  if (devJump !== null) setStage(+devJump);
  else speak(cust.say, () => setStage(0));
  w.getStage = () => stage;
  w.ACTS = ACTS;
  return w.dispose.bind(w);
}
function startDentist3DInto(root) { const c = startDentist3D(root); window.__scene3dCleanup = c || null }
