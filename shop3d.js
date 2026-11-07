// shop3d.js — חנות תלת-ממדית: רשימת קניות → מיון למדפים → ספירה לשקית → תשלום בקופה (+עודף ברמה 4).
// נבנה על world3d.js. כיסוי פעילויות shop: find, shelfsort, count, change, bigchange — רמות 1-4 (כמו roles.js).
// התקדמות: saveProgress('shop3d', {visits, stars}) בלבד. רמה מ-STATE.unlocked.shop.
function startShop3D(root) {
  const w = startWorld3D(root, { bg: '#e3f2fd' });
  if (!w) return null;
  const { THREE, scene } = w;
  const P = W3D_PALETTE;

  const lvl = Math.min(4, (typeof STATE !== 'undefined' && STATE.unlocked && STATE.unlocked.shop) || 1);
  const eff = Math.min(3, lvl); // עוצמת תוכן מדרגת 1-3; רמה 4 מוסיפה bigchange
  const prog = w.getProgress('shop3d') || { visits: 0, stars: 0 };

  // ---------- החנות ----------
  w.buildRoom({ floor: '#b7e4c7', wallA: '#d7f0e0', wallB: '#fff3c9' });
  // מדפים אחוריים
  w.box(6.4, .12, .9, '#8d6e63', 0, .55, -3.3);
  w.box(6.4, .12, .9, '#8d6e63', 0, 1.25, -3.3);
  w.box(6.4, .12, .9, '#8d6e63', 0, 1.95, -3.3);
  w.box(.15, 2.1, .9, '#6d4c41', -3.2, 1.05, -3.3);
  w.box(.15, 2.1, .9, '#6d4c41', 3.2, 1.05, -3.3);
  // מקרר (למוצרי חלב/משקאות)
  const fridgeG = w.group(-2.2, 0, 1.2);
  w.box(1.5, 2.2, 1, '#e3f2fd', 0, 1.1, 0, fridgeG);
  w.box(1.54, .05, 1.04, '#b0bec5', 0, 1.15, 0, fridgeG);
  // דלפק קופה + קופה
  w.box(2.2, .85, 1, '#a1887f', 2.1, .42, -1.6);
  w.box(2.3, .1, 1.1, '#fdf6ee', 2.1, .9, -1.6);
  const register = w.group(2.1, .95, -1.6);
  w.box(.7, .45, .5, '#546e7a', 0, .22, 0, register);
  w.box(.5, .3, .06, '#4fc3f7', 0, .5, .2, register);
  // עגלת קניות
  const cart = w.group(-1.4, 0, 2.4);
  w.box(.9, .5, .6, '#ef5350', 0, .75, 0, cart);
  w.box(.8, .06, .5, '#c62828', 0, .5, 0, cart);
  [[-.35, -.22], [.35, -.22], [-.35, .22], [.35, .22]].forEach(p => w.cyl(.09, .09, .06, '#455a64', p[0], .35, p[1], cart));
  const cartHandle = w.cyl(.04, .04, .7, '#78909c', -.5, 1.0, 0, cart); cartHandle.rotation.z = .5;
  // שקית
  const bag = w.group(1.4, 0, 2.4);
  w.box(.55, .6, .4, '#c98d4b', 0, .3, 0, bag);
  w.box(.5, .08, .35, '#8d5a2b', 0, .62, 0, bag);
  // הלקוחה — דמות מסתובבת בין ביקורים (צבע משתנה)
  const CUST_COLORS = ['#b57edc', '#f4a460', '#90caf9', '#a5d6a7', '#f48fb1', '#ffe082'];
  const custColor = CUST_COLORS[prog.visits % CUST_COLORS.length];
  const cust = w.group(3.4, 0, -.2);
  w.ball(.55, custColor, 0, .95, 0, cust, 1, 1.15, 1);
  w.ball(.42, custColor, 0, 1.85, 0, cust);
  w.ball(.13, custColor, -.3, 2.2, 0, cust); w.ball(.13, custColor, .3, 2.2, 0, cust);
  w.ball(.06, '#3e2723', -.16, 1.92, .38, cust); w.ball(.06, '#3e2723', .16, 1.92, .38, cust);
  w.ball(.08, '#f8bbd0', 0, 1.74, .38, cust, 1, .6, .8);
  w.noRay(cust);

  // ---------- דגמי מוצרים (עותק מקומי — לא לגעת ב-chef3d בזמן ההקפאה) ----------
  function itemModel(kind, parent) {
    const g = w.group(0, 0, 0, parent);
    const M = {
      tomato: () => { w.ball(.16, '#e53935', 0, .16, 0, g); w.cyl(.03, .05, .05, '#43a047', 0, .33, 0, g) },
      cucumber: () => { const c = w.cyl(.09, .09, .44, '#43a047', 0, .1, 0, g); c.rotation.z = Math.PI / 2 },
      carrot: () => { const c = w.cyl(.04, .13, .5, '#ef6c00', 0, .24, 0, g); [-.05, 0, .05].forEach(x => w.ball(.06, '#43a047', x, .52, 0, g, .7, 1.2, .7)) },
      lettuce: () => { w.ball(.19, '#7cb342', 0, .18, 0, g, 1, .8, 1); w.ball(.13, '#9ccc65', 0, .24, 0, g, 1, .7, 1) },
      bread: () => { w.box(.36, .2, .24, '#d7a86e', 0, .1, 0, g); w.ball(.18, '#e3bd8d', 0, .2, 0, g, 1, .5, .68) },
      cheese: () => { const c = w.box(.3, .1, .3, '#ffca28', 0, .05, 0, g); c.rotation.y = .6 },
      egg: () => w.ball(.15, '#fff8e1', 0, .16, 0, g, 1, 1.38, 1),
      banana: () => { const b = w.ball(.09, '#ffeb3b', 0, .1, 0, g, 2.6, 1, 1); b.rotation.z = .5 },
      strawberry: () => { w.ball(.14, '#e53935', 0, .14, 0, g, 1, 1.1, 1); w.ball(.05, '#43a047', 0, .29, 0, g, 1, .4, 1) },
      apple: () => { w.ball(.16, '#e53935', 0, .16, 0, g); w.cyl(.015, .015, .1, '#6d4c41', 0, .34, 0, g) },
      orange: () => w.ball(.15, '#fb8c00', 0, .15, 0, g),
      milk: () => { w.box(.2, .36, .2, '#eceff1', 0, .18, 0, g); w.box(.2, .09, .2, '#4fc3f7', 0, .4, 0, g) },
      juice: () => { w.box(.2, .34, .2, '#ffb74d', 0, .17, 0, g); w.box(.2, .07, .2, '#e65100', 0, .37, 0, g) },
      fish: () => { const b = w.ball(.14, '#78909c', 0, .14, 0, g, 1.8, 1, .6); w.ball(.08, '#78909c', -.25, .14, 0, g, 1, 1, .4) },
      cake: () => { w.cyl(.18, .18, .16, '#f48fb1', 0, .08, 0, g); w.cyl(.19, .19, .05, '#fff', 0, .18, 0, g); w.ball(.05, '#e53935', 0, .23, 0, g) },
      cookie: () => { w.cyl(.16, .16, .06, '#a1703a', 0, .03, 0, g); w.ball(.03, '#5d4037', .05, .07, .05, g); w.ball(.03, '#5d4037', -.06, .07, -.03, g) }
    };
    (M[kind] || M.apple)(); return g;
  }

  // מוצרים: שם (מפתח הקראה קיים) וקטגוריה למיון
  const GOODS = [
    { k: 'apple', n: 'תפוח', cat: 'veg' }, { k: 'orange', n: 'תפוז', cat: 'veg' },
    { k: 'banana', n: 'בננה', cat: 'veg' }, { k: 'strawberry', n: 'תות', cat: 'veg' },
    { k: 'carrot', n: 'גזר', cat: 'veg' }, { k: 'tomato', n: 'עגבנייה', cat: 'veg' },
    { k: 'cucumber', n: 'מלפפון', cat: 'veg' }, { k: 'lettuce', n: 'חסה', cat: 'veg' },
    { k: 'milk', n: 'חלב', cat: 'cool' }, { k: 'juice', n: 'מיץ', cat: 'cool' },
    { k: 'cheese', n: 'גבינה', cat: 'cool' }, { k: 'egg', n: 'ביצה', cat: 'cool' },
    { k: 'fish', n: 'דג', cat: 'cool' },
    { k: 'bread', n: 'לחם', cat: 'bakery' }, { k: 'cookie', n: 'עוגייה', cat: 'bakery' }, { k: 'cake', n: 'עוגה', cat: 'bakery' }
  ];
  const NUM_WORDS = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש'];
  const CUST_LINES = ['קניות לחג!', 'רשימה ארוכה יותר הפעם.', 'שוב אני עם העגלה!', 'קונה לכל הלהקה!', 'צריך הרבה גזרים!', 'קניות של לילה!'];

  // ---------- ניהול שלבים ----------
  const STAGES = ['find', 'shelfsort', 'count', 'pay', 'done'];
  let stage = 0;
  w.progressInit(4);
  const CAMS = [ // נכתב לדסקטופ; הנייד מקבל ריווח אוטומטי (כלל 15)
    { p: [0, 2.7, 6.4], l: [0, 1.2, -1.2] },  // find: מדפים+עגלה
    { p: [0, 2.7, 6.2], l: [0, 1.1, 0.6] },   // shelfsort: שני מדפי המיון
    { p: [0, 2.6, 6.4], l: [0, 1.0, 1.6] },   // count: שקית+פריטים
    { p: [0.5, 2.9, 7.0], l: [0.6, 0.9, 0.2] },  // pay: קופה+ערימת מטבעות בפריים
    { p: [0, 2.5, 6.4], l: [0, 1.3, 0] }      // done
  ];
  function setStage(i) {
    stage = i;
    const c = CAMS[i]; if (c) w.flyTo(c.p[0], c.p[1], c.p[2], c.l[0], c.l[1], c.l[2]);
    ticks.length = 0;
    [stageFind, stageShelfsort, stageCount, stagePay, stageDone][i]();
  }
  function clearGroup(arr) { arr.forEach(o => { o.parent && o.parent.remove(o) }); arr.length = 0 }
  let stageObjs = [], stageDrags = [], stageTargets = [];
  function cleanupStage() {
    clearGroup(stageObjs);
    stageDrags.forEach(d => { const i = draggables.indexOf(d); if (i >= 0) draggables.splice(i, 1) });
    stageTargets.forEach(t => { if (t.ring) t.ring.visible = false; const i = targets.indexOf(t); if (i >= 0) targets.splice(i, 1) }); // כלל 17: אין טבעות רפאים
    stageDrags = []; stageTargets = [];
  }
  const draggables = w._drags, targets = w._tgts;
  function shuffled(a) { return a.slice().sort(() => Math.random() - .5) }
  // פיזור פריטים על המדף התחתון — מרווח מהקצוות (כלל 14)
  function shelfRow(items, y, z, parent) {
    const maxC = Math.min(items.length, 5);
    items.forEach((g, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      g.position.set((col - (maxC - 1) / 2) * .62, y - row * .62, z);
    });
  }

  // ---------- שלב 0: רשימת קניות → עגלה ----------
  function stageFind() {
    cleanupStage();
    const need = shuffled(GOODS).slice(0, 1 + eff);
    const decoys = shuffled(GOODS.filter(g => !need.includes(g))).slice(0, eff);
    const items = shuffled(need.concat(decoys));
    const custLine = CUST_LINES[prog.visits % CUST_LINES.length];
    w.banner('מה ברשימה? גררי לעגלה', null);
    speak(custLine, () => speak('גררי את הפריטים מהרשימה לעגלה'));
    let got = 0;
    const placed = items.map((g, i) => {
      const it = itemModel(g.k, scene); it.scale.setScalar(1.2); stageObjs.push(it);
      const needed = need.includes(g);
      const dr = w.makeDraggable(it, {
        proxyR: .3, onPick: () => { sfx('tick'); speak(g.n) },
        onMiss: () => speak('זה לא הפריט הנכון. נסי שוב!')
      });
      dr.userData = { kind: g.k, needed };
      stageDrags.push(dr);
      return it;
    });
    shelfRow(placed, 1.35, -3.15);
    const tgt = w.addDropTarget(cart, {
      radiusPx: 150, ringR: .6, ringPos: new THREE.Vector3(0, 1.1, 0), ringRot: { x: Math.PI / 2 },
      onDrop: (d) => {
        if (d.userData.needed) {
          got++; sfx('good'); speak(NUM_WORDS[got - 1] || '' + got);
          d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
          if (got >= need.length) {
            speak('כל הכבוד רונה!');
            w.progressStep(); setTimeout(() => setStage(1), 1600);
          }
        } else {
          sfx('oops'); speak('זה לא הפריט הנכון. נסי שוב!'); d.grp.position.copy(d.home);
        }
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- שלב 1: מיון סחורה למדפים ----------
  function stageShelfsort() {
    cleanupStage();
    w.banner('מייני: ירקות ופירות למדף הירוק, שאר למקרר', null);
    speak('מייני את הסחורה למדפים הנכונים');
    const withBakery = eff >= 2; // קטגוריית מאפייה מרמה 2 — כמו משחק ה-2D (3 קטגוריות)
    const veg = shuffled(GOODS.filter(g => g.cat === 'veg')).slice(0, withBakery ? 2 : 2 + Math.floor(eff / 2));
    const cool = shuffled(GOODS.filter(g => g.cat === 'cool')).slice(0, withBakery ? 2 : 2 + Math.ceil(eff / 2));
    const bake = withBakery ? shuffled(GOODS.filter(g => g.cat === 'bakery')).slice(0, 2) : [];
    const items = shuffled(veg.concat(cool, bake));
    // מדף ירוק (ימין) + מקרר (שמאל) + מדף מאפייה חום (אמצע, מרמה 2) כמטרות
    const shelfGreen = w.group(1.6, 0, 1.4); stageObjs.push(shelfGreen);
    w.box(1.3, .08, .7, '#43a047', 0, .95, 0, shelfGreen);
    w.box(.12, .95, .7, '#2e7d32', -.6, .48, 0, shelfGreen); w.box(.12, .95, .7, '#2e7d32', .6, .48, 0, shelfGreen);
    const shelfBakery = w.group(0, 0, 1.4);
    if (withBakery) {
      stageObjs.push(shelfBakery);
      w.box(1.3, .08, .7, '#a1703a', 0, .95, 0, shelfBakery);
      w.box(.12, .95, .7, '#6d4c41', -.6, .48, 0, shelfBakery); w.box(.12, .95, .7, '#6d4c41', .6, .48, 0, shelfBakery);
    }
    const placed = items.map(g => {
      const it = itemModel(g.k, scene); it.scale.setScalar(1.2); stageObjs.push(it);
      const dr = w.makeDraggable(it, { proxyR: .3, onPick: () => { sfx('tick'); speak(g.n) } });
      dr.userData = { kind: g.k, cat: g.cat };
      stageDrags.push(dr);
      return it;
    });
    shelfRow(placed, .5, 2.6);
    let left = items.length;
    const catTargets = [[shelfGreen, 'veg'], [fridgeG, 'cool']];
    if (withBakery) catTargets.push([shelfBakery, 'bakery']);
    catTargets.forEach(([obj, cat]) => {
      const t = w.addDropTarget(obj, {
        radiusPx: 140, ringR: .55, ringPos: new THREE.Vector3(0, 1.3, 0), ringRot: { x: Math.PI / 2 },
        accepts: () => true,
        onDrop: (d) => {
          if (d.userData.cat === cat) {
            left--; sfx('good'); speak('נכון!');
            d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
            if (left <= 0) {
              speak('כל הכבוד רונה!');
              w.progressStep(); setTimeout(() => setStage(2), 1600);
            }
          } else { sfx('oops'); speak('זה לא הפריט הנכון. נסי שוב!'); d.grp.position.copy(d.home) }
        }
      });
      stageTargets.push(t);
    });
    stageTargets.forEach(t => { t.ring.visible = true });
  }

  // ---------- שלב 2: ספירה לשקית ----------
  function stageCount() {
    cleanupStage();
    const n = 2 + eff; // 3-5
    w.banner('כמה פריטים? ספרי איתי!', null);
    speak('גררי את הפריטים לשקית וספרי בקול');
    const kinds = shuffled(GOODS).slice(0, Math.min(n, GOODS.length));
    const placed = kinds.map(g => {
      const it = itemModel(g.k, scene); it.scale.setScalar(1.2); stageObjs.push(it);
      const dr = w.makeDraggable(it, { proxyR: .3, onPick: () => { sfx('tick'); speak(g.n) } });
      dr.userData = { kind: g.k };
      stageDrags.push(dr);
      return it;
    });
    shelfRow(placed, .55, 2.7);
    let got = 0;
    const tgt = w.addDropTarget(bag, {
      radiusPx: 150, ringR: .5, ringPos: new THREE.Vector3(0, .75, 0), ringRot: { x: Math.PI / 2 },
      onDrop: (d) => {
        got++; sfx('good'); speak(NUM_WORDS[got - 1] || '' + got);
        d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
        if (got >= n) {
          speak('כל הכבוד רונה!');
          w.progressStep(); setTimeout(() => setStage(3), 1600);
        }
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- שלב 3: תשלום בקופה (ועודף ברמה 4) ----------
  function stagePay() {
    cleanupStage();
    const price = 2 + eff; // 3-5 מטבעות
    const big = lvl >= 4;   // bigchange: גם עודף
    w.banner(big ? 'משלמים ונותנים עודף!' : 'משלמים בקופה!', null);
    speak('עכשיו משלמים בקופה! גררי את המטבעות');
    // ערימת מטבעות על הדלפק הקדמי
    const nCoins = price + (eff >= 2 ? 1 : 0); // ברמה גבוהה מטבע נוסף לבחירה
    for (let i = 0; i < nCoins; i++) {
      const coin = w.group(-.8 + i * .42, .92, 2.4); stageObjs.push(coin); // ריכוך — הרחק מקצה המסך (כלל 14)
      w.cyl(.14, .14, .04, '#ffd54f', 0, 0, 0, coin);
      w.cyl(.1, .1, .05, '#ffca28', 0, 0, 0, coin);
      const dr = w.makeDraggable(coin, { proxyR: .24, onPick: () => sfx('tick') });
      dr.userData = { coin: true };
      stageDrags.push(dr);
    }
    let paid = 0, change = 0; const needChange = big ? 2 : 0;
    const tgt = w.addDropTarget(register, {
      radiusPx: 150, ringR: .5, ringPos: new THREE.Vector3(0, .55, 0),
      onDrop: (d) => {
        if (paid < price) {
          paid++; sfx('good'); speak(NUM_WORDS[paid - 1] || '' + paid);
          d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
          if (paid >= price) {
            if (needChange) {
              speak('ועכשיו תני את העודף ללקוחה');
              // מטבעות עודף על הקופה — לגרור ללקוחה
              for (let i = 0; i < needChange; i++) {
                const ch = w.group(1.7 + i * .5, 1.0, -1.2); stageObjs.push(ch);
                w.cyl(.14, .14, .04, '#ffd54f', 0, 0, 0, ch);
                const d2 = w.makeDraggable(ch, { proxyR: .24, onPick: () => sfx('tick') });
                d2.userData = { change: true };
                stageDrags.push(d2);
              }
              tgt.ring.visible = false; tgtCust.ring.visible = true;
            } else {
              w.progressStep(); setTimeout(() => setStage(4), 1600);
            }
          }
        }
      }
    });
    const tgtCust = w.addDropTarget(cust, {
      radiusPx: 150, ringR: .6, ringPos: new THREE.Vector3(0, 1.4, 0),
      onDrop: (d) => {
        if (!d.userData.change) { sfx('oops'); d.grp.position.copy(d.home); return }
        change++; sfx('good'); speak(NUM_WORDS[change - 1] || '' + change);
        d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
        if (change >= needChange) { w.progressStep(); setTimeout(() => setStage(4), 1600) }
      }
    });
    stageTargets.push(tgt, tgtCust);
    tgt.ring.visible = true; tgtCust.ring.visible = false;
  }

  // ---------- שלב 4: סיום ----------
  function stageDone() {
    cleanupStage();
    const p = w.getProgress('shop3d') || { visits: 0, stars: 0 };
    p.visits++; p.stars++;
    w.saveProgress('shop3d', p);
    w.banner('כל הכבוד! סיימת!', null);
    w.endPanel('הלקוחה מאושרת! את מוכרת אלופה!', 'שחקי שוב', () => location.reload());
    speak('הלקוחה מאושרת! את מוכרת אלופה!');
  }

  const ticks = [];
  const origOnTick = w.onTick;
  w.onTick = (fn) => ticks.push(fn);
  const pump = () => { ticks.forEach(fn => fn((performance.now()) / 1000)) };
  origOnTick(pump);

  setStage(0);
  w.getStage = () => stage;
  w.STAGES = STAGES;
  return w.dispose.bind(w);
}
