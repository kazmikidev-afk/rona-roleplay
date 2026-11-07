// chef3d.js — מטבח תלת-ממדי: הזמנה → איסוף מרכיבים → קיצוץ → שלבי הכנה → הגשה → מיון.
// נבנה על world3d.js. כיסוי פעילויות chef: recipe/freestyle, gather, chop, steps, serve, foodsort.
// התקדמות: saveProgress('chef3d', {visits, stars}) בלבד. רמה מ-STATE.unlocked.chef.
function startChef3D(root) {
  const w = startWorld3D(root, { bg: '#ffe3ec' });
  if (!w) return null;
  const { THREE, scene } = w;
  const P = W3D_PALETTE;

  const lvl = Math.min(3, (typeof STATE !== 'undefined' && STATE.unlocked && STATE.unlocked.chef) || 1);
  const prog = w.getProgress('chef3d') || { visits: 0, stars: 0 };

  // ---------- המטבח ----------
  w.buildRoom({ floor: '#e8a558', wallA: '#ffd9a0', wallB: '#b7e4c7' });
  // שיש אחורי + כיריים + כיור
  w.box(6.4, .9, .9, '#8d6e63', 0, .45, -3.3);           // ארונות
  w.box(6.6, .12, 1.05, '#fdf6ee', 0, .96, -3.3);        // משטח
  const stove = w.group(1.9, 1.05, -3.3);
  w.box(1.1, .06, .8, '#37474f', 0, 0, 0, stove);
  [[-.25, -.18], [.25, -.18], [-.25, .18], [.25, .18]].forEach(p => w.cyl(.14, .14, .03, '#263238', p[0], .05, p[1], stove));
  const pot = w.cyl(.3, .28, .3, '#e05b4b', 0, .25, 0, stove);
  const sink = w.group(-1.9, 1.02, -3.3);
  w.box(1, .08, .7, '#90a4ae', 0, 0, 0, sink);
  w.box(.8, .06, .5, '#4fc3f7', 0, .01, 0, sink);         // מים
  w.cyl(.04, .04, .5, '#78909c', -.35, .3, -.2, sink);    // ברז
  w.cyl(.04, .04, .3, '#78909c', -.15, .5, -.2, sink).rotation.z = Math.PI / 2;
  // מקרר
  const fridge = w.group(-4.4, 0, -3);
  w.box(1.3, 2.6, 1.1, '#e3f2fd', 0, 1.3, 0, fridge);
  w.box(.06, .5, .08, '#90a4ae', .5, 1.5, .58, fridge);
  w.box(1.34, .04, 1.14, '#b0bec5', 0, 1.55, 0, fridge);
  // שיש קדמי (שטח עבודה) + קרש
  w.box(5.2, .8, 1.2, '#a1887f', 0, .4, 2.1);
  w.box(5.4, .1, 1.35, '#fdf6ee', 0, .85, 2.1);
  const board = w.group(-1.2, .93, 2.1);
  w.box(1.1, .05, .8, '#d7a86e', 0, 0, 0, board);
  // סל איסוף
  const basket = w.group(1.4, .95, 2.1);
  w.cyl(.42, .32, .35, '#c98d4b', 0, .17, 0, basket);
  w.cyl(.36, .36, .04, '#8d5a2b', 0, .3, 0, basket);
  // חלון הזמנות
  const ticket = w.group(0, 2.6, -4.25);
  w.box(1.5, 1, .1, '#fff', 0, 0, 0, ticket);
  w.box(1.3, .25, .12, '#ff5e8a', 0, .4, 0, ticket);
  // שולחן לקוח
  const tableG = w.group(3.6, 0, 1.2);
  w.cyl(.8, .8, .08, '#f5e0c8', 0, .85, 0, tableG);
  w.cyl(.09, .12, .85, '#8d6e63', 0, .42, 0, tableG);
  // הלקוחה — דובונית חמודה
  const cust = w.group(3.6, 0, -.1);
  const cBody = w.ball(.55, '#b57edc', 0, .95, 0, cust, 1, 1.15, 1);
  const cHead = w.ball(.42, '#c79bee', 0, 1.85, 0, cust);
  w.ball(.13, '#c79bee', -.3, 2.2, 0, cust); w.ball(.13, '#c79bee', .3, 2.2, 0, cust);
  w.ball(.09, '#8e5fb8', -.3, 2.2, .06, cust); w.ball(.09, '#8e5fb8', .3, 2.2, .06, cust);
  w.ball(.06, '#3e2723', -.16, 1.92, .38, cust); w.ball(.06, '#3e2723', .16, 1.92, .38, cust);
  w.ball(.08, '#f8bbd0', 0, 1.74, .38, cust, 1, .6, .8);
  w.noRay(cust);

  // ---------- ספריית מרכיבים/מנות כדגמים תלת-ממדיים ----------
  function vegModel(kind, parent) {
    const g = w.group(0, 0, 0, parent);
    const M = {
      tomato: () => { w.ball(.16, '#e53935', 0, .16, 0, g); w.cyl(.03, .05, .05, '#43a047', 0, .33, 0, g) },
      cucumber: () => { const c = w.cyl(.09, .09, .44, '#43a047', 0, .1, 0, g); c.rotation.z = Math.PI / 2 },
      carrot: () => { const c = w.cyl(.03, .1, .42, '#fb8c00', 0, .2, 0, g); w.ball(.07, '#66bb6a', 0, .44, 0, g, 1, .5, 1) },
      corn: () => { w.ball(.1, '#fdd835', -.07, .12, 0, g, 1, 1.6, 1); w.ball(.1, '#ffee58', .07, .12, 0, g, 1, 1.6, 1) },
      lettuce: () => { w.ball(.19, '#7cb342', 0, .18, 0, g, 1, .8, 1); w.ball(.13, '#9ccc65', 0, .24, 0, g, 1, .7, 1) },
      bread: () => { w.box(.36, .2, .24, '#d7a86e', 0, .1, 0, g); w.ball(.18, '#e3bd8d', 0, .2, 0, g, 1, .5, .68) },
      cheese: () => { const c = w.box(.3, .1, .3, '#ffca28', 0, .05, 0, g); c.rotation.y = .6 },
      egg: () => w.ball(.13, '#fff8e1', 0, .13, 0, g, 1, 1.2, 1),
      banana: () => { const b = w.ball(.09, '#ffeb3b', 0, .1, 0, g, 2.6, 1, 1); b.rotation.z = .5 },
      strawberry: () => { w.ball(.14, '#e53935', 0, .14, 0, g, 1, 1.1, 1); w.ball(.05, '#43a047', 0, .29, 0, g, 1, .4, 1) },
      apple: () => { w.ball(.16, '#e53935', 0, .16, 0, g); w.cyl(.015, .015, .1, '#6d4c41', 0, .34, 0, g) },
      orange: () => w.ball(.15, '#fb8c00', 0, .15, 0, g),
      milk: () => { w.box(.2, .36, .2, '#eceff1', 0, .18, 0, g); w.box(.2, .09, .2, '#4fc3f7', 0, .4, 0, g) },
      juice: () => { w.box(.2, .34, .2, '#ffb74d', 0, .17, 0, g); w.box(.2, .07, .2, '#e65100', 0, .37, 0, g) },
      candy: () => { w.ball(.12, '#ec407a', 0, .12, 0, g); w.ball(.04, '#f8bbd0', .14, .12, 0, g, 1, 1, 1); w.ball(.04, '#f8bbd0', -.14, .12, 0, g) },
      cookie: () => { w.cyl(.16, .16, .06, '#a1703a', 0, .03, 0, g); w.ball(.03, '#5d4037', .05, .07, .05, g); w.ball(.03, '#5d4037', -.06, .07, -.03, g) },
      fries: () => { w.box(.2, .18, .14, '#e53935', 0, .09, 0, g); for (let i = 0; i < 4; i++) w.box(.035, .2, .035, '#fdd835', -.06 + i * .04, .24, 0, g) },
      cake: () => { w.cyl(.18, .18, .16, '#f48fb1', 0, .08, 0, g); w.cyl(.19, .19, .05, '#fff', 0, .18, 0, g); w.ball(.05, '#e53935', 0, .23, 0, g) },
      pizza: () => { const p = w.cyl(.3, .3, .05, '#f0c989', 0, .03, 0, g); w.cyl(.26, .26, .06, '#e53935', 0, .035, 0, g); [[.1, .1], [-.12, .05], [.02, -.13]].forEach(q => w.cyl(.05, .05, .07, '#ffca28', q[0], .03, q[1], g)) },
      salad: () => { w.cyl(.24, .16, .16, '#eceff1', 0, .08, 0, g); w.ball(.1, '#7cb342', -.06, .2, 0, g, 1, .6, 1); w.ball(.08, '#e53935', .09, .18, .05, g); w.ball(.07, '#fb8c00', 0, .19, -.08, g) },
      sandwich: () => { w.box(.34, .07, .26, '#e3bd8d', 0, .05, 0, g); w.box(.32, .05, .24, '#7cb342', 0, .11, 0, g); w.box(.34, .07, .26, '#e3bd8d', 0, .17, 0, g) },
      shake: () => { w.cyl(.12, .09, .34, '#f8bbd0', 0, .17, 0, g); w.cyl(.11, .11, .05, '#ec407a', 0, .36, 0, g); const s = w.cyl(.02, .02, .3, '#4fc3f7', .05, .45, 0, g); s.rotation.z = .3 }
    };
    (M[kind] || M.apple)(); return g;
  }

  const DISHES = [
    { id: 'salad', name: 'סלט צבעוני', ings: ['tomato', 'cucumber', 'carrot', 'lettuce'] },
    { id: 'sandwich', name: 'כריך', ings: ['bread', 'cheese', 'tomato', 'lettuce'] },
    { id: 'shake', name: 'שייק פירות', ings: ['banana', 'strawberry', 'apple', 'milk'] },
    { id: 'pizza', name: 'פיצת ירקות', ings: ['bread', 'cheese', 'tomato', 'corn'] }
  ];
  const DECOYS = ['orange', 'egg', 'cookie', 'corn', 'apple', 'cucumber'];
  const SORT_POOL = [
    { k: 'apple', good: true }, { k: 'carrot', good: true }, { k: 'milk', good: true }, { k: 'egg', good: true },
    { k: 'candy', good: false }, { k: 'cookie', good: false }, { k: 'fries', good: false }, { k: 'cake', good: false }];

  // ---------- ניהול שלבים ----------
  const STAGES = ['recipe', 'gather', 'chop', 'steps', 'serve', 'sort', 'done'];
  let stage = 0;
  const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
  w.progressInit(6);

  function setStage(i) {
    stage = i;
    ticks.length = 0;
    [stageRecipe, stageGather, stageChop, stageSteps, stageServe, stageSort, stageDone][i]();
  }
  function clearGroup(arr) { arr.forEach(o => { o.parent && o.parent.remove(o) }); arr.length = 0 }

  // כלי/חפצים נגררים כלליים
  let stageObjs = [], stageDrags = [], stageTargets = [];
  function cleanupStage() {
    clearGroup(stageObjs);
    stageDrags.forEach(d => { const i = draggables.indexOf(d); if (i >= 0) draggables.splice(i, 1) });
    stageTargets.forEach(t => { const i = targets.indexOf(t); if (i >= 0) targets.splice(i, 1) });
    stageDrags = []; stageTargets = [];
  }
  const draggables = w._drags, targets = w._tgts;

  // ---------- שלב 0: בחירת מנה ----------
  function stageRecipe() {
    cleanupStage();
    w.banner('בחרי מה מכינים היום במטבח', null);
    speak('בחרי מה מכינים היום במטבח', () => speak('הלקוחה ביקשה ' + dish.name + '!'));
    const stand = w.group(-2.2, 0, 1.2); stageObjs.push(stand);
    w.box(2.6, .8, .9, '#8d6e63', 0, .4, 0, stand);
    w.box(2.8, .1, 1, '#fdf6ee', 0, .85, 0, stand);
    DISHES.forEach((d, i) => {
      const plate = w.group(-.95 + i * .63, .95, 0, stand);
      w.cyl(.26, .2, .05, '#ffffff', 0, 0, 0, plate);
      vegModel(d.id, plate);
      const dr = w.makeDraggable(plate, {
        proxyR: .34, onPick: () => speak(d.name)
      });
      stageDrags.push(dr);
    });
    const tgt = w.addDropTarget(ticket, {
      radiusPx: 170, ringR: .42, ringPos: new THREE.Vector3(0, 0, .15),
      accepts: () => true,
      onDrop: (d) => {
        const idx = stageDrags.indexOf(d);
        if (DISHES[idx] && DISHES[idx].id === dish.id) {
          sfx('good'); speak('יופי! בחרת נכון'); d.grp.visible = false;
          w.progressStep(); setTimeout(() => setStage(1), 1600);
        } else {
          sfx('oops'); speak('הלקוחה ביקשה מנה אחרת. נסי שוב!');
          d.grp.position.copy(d.home);
        }
      }
    });
    stageTargets.push(tgt);
    tgt.ring.visible = true;
  }

  // ---------- שלב 1: איסוף מרכיבים ----------
  function stageGather() {
    cleanupStage();
    w.banner('אספי את המרכיבים מהמדף', null);
    speak('אספי את המרכיבים מהמדף', () => speak(dish.name));
    const shelf = w.group(0, 0, 1.2); stageObjs.push(shelf);
    w.box(5.6, .1, .8, '#a1887f', 0, .5, 0, shelf);
    w.box(5.6, .1, .8, '#a1887f', 0, 1.25, 0, shelf);
    const need = dish.ings.slice(0, 2 + lvl);
    const decoys = DECOYS.filter(k => !need.includes(k)).slice(0, lvl);
    const items = need.concat(decoys).sort(() => Math.random() - .5);
    let got = 0;
    items.forEach((k, i) => {
      const row = i < 4 ? 1.35 : .6, col = (i % 4) - 1.5;
      const it = vegModel(k, shelf); it.position.set(col * 1.15, row, 0);
      const needed = need.includes(k);
      const dr = w.makeDraggable(it, {
        proxyR: .3, onPick: () => sfx('tick'),
        onMiss: needed ? null : () => speak('זה לא במתכון. נסי שוב!')
      });
      dr.userData = { kind: k, needed };
      stageDrags.push(dr);
    });
    const tgt = w.addDropTarget(basket, {
      radiusPx: 150, ringR: .5, ringPos: new THREE.Vector3(0, .42, 0),
      ringRot: { x: Math.PI / 2 },
      onDrop: (d) => {
        if (d.userData.needed) {
          got++; sfx('good'); speak('' + got);
          d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
        } else {
          sfx('oops'); speak('זה לא במתכון. נסי שוב!'); d.grp.position.copy(d.home);
        }
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
    // פיפ אחד לשלב שלם:
    const wait = setInterval(() => {
      if (got >= need.length) {
        clearInterval(wait);
        speak('כל המרכיבים בסל! יפה מאוד!');
        w.progressStep(); setTimeout(() => setStage(2), 1600);
      }
    }, 300);
  }

  // ---------- שלב 2: קיצוץ ----------
  function stageChop() {
    cleanupStage();
    w.banner('קוצצים', null);
    speak('קוצצים', () => speak('קצצי את הירקות על הקרש'));
    const items = dish.ings.slice(0, 2 + lvl);
    let chopped = 0;
    const rubs = [];
    items.forEach((k, i) => {
      const it = vegModel(k, scene); it.position.set(-1.6 + i * .8, .95, 2.1); stageObjs.push(it);
      const r = w.registerRub(it, {
        needed: 260, radiusPx: 90,
        onProgress: (p) => { it.scale.setScalar(1 - p * .4); it.rotation.y += .1; sfx('tick') },
        onDone: () => {
          chopped++; sfx('good'); speak('' + chopped);
          it.visible = false;
          if (chopped >= items.length) {
            speak('יופי! בחרת נכון'); // generic praise exists; use exact existing clip
            w.progressStep(); setTimeout(() => setStage(3), 1400);
          }
        }
      });
      rubs.push(r);
    });
  }

  // ---------- שלב 3: שלבי הכנה בסדר ----------
  function stageSteps() {
    cleanupStage();
    w.banner('מכינים בסדר הנכון!', null);
    speak('מכינים בסדר הנכון!');
    const bowl = w.group(0, .95, 2.1); stageObjs.push(bowl);
    w.cyl(.3, .2, .2, '#eceff1', 0, .1, 0, bowl);
    dish.ings.slice(0, 2 + lvl).forEach((k, i) => { const v = vegModel(k, bowl); v.scale.setScalar(.55); v.position.set(-.12 + i * .12, .18, 0) });
    const dr = w.makeDraggable(bowl, { proxyR: .42, onPick: () => sfx('tick') });
    stageDrags.push(dr);
    const order = [
      { obj: sink, say: 'שוטפים ידיים וירקות' },
      { obj: stove, say: 'אופים או מבשלים' },
      { obj: tableG, say: 'קשטי את הצלחת והגישי בחיוך' }];
    let step = 0;
    setTimeout(() => speak(order[0].say), 2200);
    const tgts = order.map((o, i) => {
      const t = w.addDropTarget(o.obj, {
        radiusPx: 160, ringR: .5, ringPos: new THREE.Vector3(0, .5, 0), ringRot: { x: Math.PI / 2 },
        accepts: () => true,
        onDrop: (d) => {
          if (i === step) {
            step++; sfx('good');
            t.ring.material.color.set(P.ringOk);
            if (step < order.length) speak(order[step].say);
            else {
              speak('יופי! בחרת נכון');
              w.progressStep(); setTimeout(() => setStage(4), 1400);
            }
          } else {
            sfx('oops'); speak('מה בא קודם?'); d.grp.position.copy(d.home);
          }
        }
      });
      t.ring.visible = i === 0;
      stageTargets.push(t);
      return t;
    });
    // מראים את הטבעת של התחנה הנוכחית בלבד
    w.onTick(() => { tgts.forEach((t, i) => t.ring.visible = (i === step)) });
  }

  // ---------- שלב 4: הגשה ----------
  function stageServe() {
    cleanupStage();
    w.banner('המנה מוכנה! הגישי ללקוחה', 'קשטי את הצלחת והגישי בחיוך');
    const plate = w.group(0, .95, 2.1); stageObjs.push(plate);
    w.cyl(.34, .26, .06, '#ffffff', 0, .03, 0, plate);
    vegModel(dish.id, plate);
    const dr = w.makeDraggable(plate, { proxyR: .4, onPick: () => sfx('tick'), onMiss: () => speak('הלקוחה מחכה ליד השולחן!') });
    stageDrags.push(dr);
    const tgt = w.addDropTarget(tableG, {
      radiusPx: 170, ringR: .85, ringPos: new THREE.Vector3(0, .95, 0), ringRot: { x: Math.PI / 2 },
      onDrop: (d) => {
        sfx('good'); d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
        if (typeof confettiBurst === 'function') confettiBurst();
        // שמחת הלקוחה
        w.onTick((t) => { cust.position.y = Math.abs(Math.sin(t * 6)) * .18 });
        speak('הלקוחה מאושרת! את שפית אלופה!');
        w.progressStep(); setTimeout(() => setStage(5), 2000);
      }
    });
    stageTargets.push(tgt); tgt.ring.visible = true;
  }

  // ---------- שלב 5: מיון ----------
  function stageSort() {
    cleanupStage();
    w.banner('מייני: אוכל של כל יום או של פעמים מיוחדות');
    const n = 2 + lvl * 2;
    const goods = SORT_POOL.filter(s => s.good), bads = SORT_POOL.filter(s => !s.good);
    const items = [];
    for (let i = 0; i < n / 2; i++) { items.push(goods[i % goods.length]); items.push(bads[i % bads.length]) }
    items.sort(() => Math.random() - .5);
    const binG = w.group(-2.6, 0, 2.1), binB = w.group(2.6, 0, 2.1);
    stageObjs.push(binG, binB);
    w.cyl(.45, .35, .5, '#43a047', 0, .95, 0, binG);
    w.cyl(.45, .35, .5, '#ef6c00', 0, .95, 0, binB);
    let left = items.length;
    items.forEach((s, i) => {
      const it = vegModel(s.k, scene); it.position.set(-1.75 + i * .7, .95, 2.75); stageObjs.push(it);
      const dr = w.makeDraggable(it, { proxyR: .28, onPick: () => sfx('tick'), onMiss: () => speak('זה לא המקום. נסי סל אחר') });
      dr.userData = { good: s.good };
      stageDrags.push(dr);
    });
    [[binG, true], [binB, false]].forEach(([bin, isGood]) => {
      const t = w.addDropTarget(bin, {
        radiusPx: 150, ringR: .55, ringPos: new THREE.Vector3(0, 1.25, 0), ringRot: { x: Math.PI / 2 },
        accepts: () => true,
        onDrop: (d) => {
          if (d.userData.good === isGood) {
            left--; sfx('good'); speak('נכון!');
            d.grp.position.set(0, 0, 0); d.grp.scale.setScalar(.01); d.active = false;
            if (left <= 0) {
              speak('מיון יפה! אוכל של כל יום נותן כוח');
              w.progressStep(); setTimeout(() => setStage(6), 1600);
            }
          } else { sfx('oops'); speak('זה לא המקום. נסי סל אחר'); d.grp.position.copy(d.home) }
        }
      });
      stageTargets.push(t);
    });
  }

  // ---------- שלב 6: סיום ----------
  function stageDone() {
    cleanupStage();
    const p = w.getProgress('chef3d') || { visits: 0, stars: 0 };
    p.visits++; p.stars++;
    w.saveProgress('chef3d', p);
    w.banner('כל הכבוד! סיימת!', null);
    w.endPanel('הלקוחה מאושרת! את שפית אלופה!', 'שחקי שוב', () => location.reload());
    speak('הלקוחה מאושרת! את שפית אלופה!');
  }

  const ticks = [];
  const origOnTick = w.onTick;
  w.onTick = (fn) => ticks.push(fn);
  // צריך שהטיקים שלנו ירוצו במנוע — נרשום אותם למנוע בפועל
  const pump = () => { ticks.forEach(fn => fn((performance.now()) / 1000)) };
  origOnTick(pump);

  setStage(0);
  w.getStage = () => stage;
  w.STAGES = STAGES;
  w._dishId = dish.id; // debug ל-e2e
  return w.dispose.bind(w);
}
