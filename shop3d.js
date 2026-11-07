// shop3d.js — חנות תלת-ממדית: רשימת קניות → מיון למדפים → ספירה לשקית → תשלום בקופה (+עודף ברמה 4).
// נבנה על world3d.js. כיסוי פעילויות shop: find, shelfsort, count, change, bigchange — רמות 1-4 (כמו roles.js).
// התקדמות: saveProgress('shop3d', {visits, stars}) בלבד. רמה מ-STATE.unlocked.shop.
function startShop3D(root) {
  const w = startWorld3D(root, { bg: '#e3f2fd' });
  if (!w) return null;
  const { THREE, scene } = w;
  const P = W3D_PALETTE;

  const lvl = Math.min(4, (typeof prog3d !== 'undefined' ? prog3d.get('shop').lvl : 1)); // רמת תלת-ממד נפרדת מהקלאסי
  const eff = Math.min(3, lvl); // עוצמת תוכן מדרגת 1-3; רמה 4 מוסיפה bigchange
  const prog = w.getProgress('shop3d') || { visits: 0, stars: 0 };

  // ---------- החנות ----------
  // קבוצות סטטיות: כל שלב מציג רק מה שצריך (אין חפצים שמסתירים פריט נדרש או יעד)
  w.buildRoom({ floor: '#b7e4c7', wallA: '#d7f0e0', wallB: '#fff3c9' });
  const shelvesG = w.group(0, 0, 0);
  w.box(6.4, .12, .9, '#8d6e63', 0, .55, -3.3, shelvesG);
  w.box(6.4, .12, .9, '#8d6e63', 0, 1.25, -3.3, shelvesG);
  w.box(6.4, .12, .9, '#8d6e63', 0, 1.95, -3.3, shelvesG);
  w.box(.15, 2.1, .9, '#6d4c41', -3.2, 1.05, -3.3, shelvesG);
  w.box(.15, 2.1, .9, '#6d4c41', 3.2, 1.05, -3.3, shelvesG);
  // מקרר (מטרת מיון "למקרר") - ממוקם לפי שלב
  const fridgeG = w.group(-1.6, 0, 0.9);
  w.box(1.5, 2.2, 1, '#e3f2fd', 0, 1.1, 0, fridgeG);
  w.box(1.54, .05, 1.04, '#b0bec5', 0, 1.15, 0, fridgeG);
  w.box(.08, .5, .08, '#90a4ae', .55, 1.4, .54, fridgeG);
  // דלפק קופה + קופה (ממוקם בשלב התשלום)
  const counterG = w.group(0, 0, 0);
  w.box(2.2, .85, 1, '#a1887f', 0, .42, 0, counterG);
  w.box(2.3, .1, 1.1, '#fdf6ee', 0, .9, 0, counterG);
  const register = w.group(0, .95, 0, counterG); register.scale.setScalar(1.3);
  w.box(.7, .45, .5, '#546e7a', 0, .22, 0, register);
  w.box(.5, .3, .06, '#4fc3f7', 0, .5, .2, register);
  // עגלת קניות
  const cartG = w.group(0.1, 0, 4.4); cartG.scale.setScalar(1.3);
  w.box(.9, .5, .6, '#ef5350', 0, .75, 0, cartG);
  w.box(.8, .06, .5, '#c62828', 0, .5, 0, cartG);
  [[-.35, -.22], [.35, -.22], [-.35, .22], [.35, .22]].forEach(p => w.cyl(.09, .09, .06, '#455a64', p[0], .35, p[1], cartG));
  const cartHandle = w.cyl(.04, .04, .7, '#78909c', -.5, 1.0, 0, cartG); cartHandle.rotation.z = .5;
  // שקית
  const bagG = w.group(0, 0, 0.9); bagG.scale.setScalar(1.7);
  w.box(.55, .6, .4, '#c98d4b', 0, .3, 0, bagG);
  w.box(.5, .08, .35, '#8d5a2b', 0, .62, 0, bagG);
  // הלקוחה
  const CUST_COLORS = ['#b57edc', '#f4a460', '#90caf9', '#a5d6a7', '#f48fb1', '#ffe082'];
  const custColor = CUST_COLORS[prog.visits % CUST_COLORS.length];
  const cust = w.group(2.0, 0, -1.2);
  w.ball(.55, custColor, 0, .95, 0, cust, 1, 1.15, 1);
  w.ball(.42, custColor, 0, 1.85, 0, cust);
  w.ball(.13, custColor, -.3, 2.2, 0, cust); w.ball(.13, custColor, .3, 2.2, 0, cust);
  w.ball(.06, '#3e2723', -.16, 1.92, .38, cust); w.ball(.06, '#3e2723', .16, 1.92, .38, cust);
  w.ball(.08, '#f8bbd0', 0, 1.74, .38, cust, 1, .6, .8);
  w.noRay(cust);
  [fridgeG, counterG, cartG, bagG, cust].forEach(g => { g.visible = false });
  function showOnly(list) { [shelvesG, fridgeG, counterG, cartG, bagG, cust].forEach(g => { g.visible = list.includes(g) }) }

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
      strawberry: () => { w.ball(.11, '#d81b60', 0, .13, 0, g, .9, 1.3, .9); w.ball(.05, '#43a047', 0, .28, 0, g, 1.4, .5, 1.4) }, // טיפה מאורכת + כובע — לא כדור כמו עגבנייה
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

  // אייקוני SVG לרשימת הקניות החזותית (רונה לא קוראת — הרשימה חייבת להיות בתמונות)
  const ICONS = {
    apple: '<circle cx="12" cy="13" r="7.5" fill="#e53935"/><path d="M12 6q0-3 2-4" stroke="#6d4c41" stroke-width="1.4" fill="none"/><ellipse cx="15" cy="4.5" rx="2.4" ry="1.3" fill="#43a047" transform="rotate(-20 15 4.5)"/>',
    orange: '<circle cx="12" cy="12" r="8" fill="#fb8c00"/><circle cx="12" cy="5.5" r="1.2" fill="#43a047"/>',
    banana: '<path d="M4 15q3 6 10 4.5T20 10l-2.5-1q-1 5-5.5 6T6.5 12.5Z" fill="#fdd835"/>',
    strawberry: '<path d="M12 21Q5.5 15.5 6 9.5Q7 5 12 5t6 4.5q.5 6-6 11.5Z" fill="#e53935"/><path d="M8.5 5.5 12 8l3.5-2.5L14 4h-4Z" fill="#43a047"/><circle cx="10" cy="12" r=".7" fill="#ffebee"/><circle cx="14" cy="13" r=".7" fill="#ffebee"/><circle cx="12" cy="16" r=".7" fill="#ffebee"/>',
    carrot: '<path d="M9 7h6l-3 14Z" fill="#ef6c00"/><path d="M12 7V3M10 7 8 3.5M14 7l2-3.5" stroke="#43a047" stroke-width="1.4"/>',
    tomato: '<circle cx="12" cy="13" r="7.5" fill="#e53935"/><path d="M12 5.5 13 8l2.5-.8-1.5 2 2 1.4-2.6.2.4 2.6-1.8-1.9-1.8 1.9.4-2.6-2.6-.2 2-1.4-1.5-2 2.5.8Z" fill="#43a047"/>',
    cucumber: '<rect x="4" y="9" width="16" height="7" rx="3.5" fill="#43a047" transform="rotate(-15 12 12)"/><circle cx="9" cy="11" r=".8" fill="#a5d6a7"/><circle cx="13" cy="12" r=".8" fill="#a5d6a7"/><circle cx="16" cy="10.5" r=".8" fill="#a5d6a7"/>',
    lettuce: '<circle cx="9" cy="13" r="5" fill="#7cb342"/><circle cx="15" cy="13" r="5" fill="#8bc34a"/><circle cx="12" cy="9.5" r="5" fill="#9ccc65"/>',
    milk: '<path d="M9 8h6v12H9Z" fill="#eceff1"/><path d="M9 8l1.5-4h3L15 8Z" fill="#90caf9"/><rect x="10.5" y="11" width="3" height="4" rx="1" fill="#90caf9"/>',
    juice: '<path d="M9 8h6v12H9Z" fill="#ffcc80"/><path d="M9 8l1.5-4h3L15 8Z" fill="#fb8c00"/><path d="M13 8l2-4" stroke="#e53935" stroke-width="1.2"/>',
    cheese: '<path d="M3 17 21 8v9H3Z" fill="#ffd54f"/><circle cx="14" cy="14" r="1.4" fill="#ffb300"/><circle cx="18" cy="13" r="1" fill="#ffb300"/><circle cx="9" cy="15.5" r="1.1" fill="#ffb300"/>',
    egg: '<ellipse cx="12" cy="12" rx="5.5" ry="7.5" fill="#fafafa" stroke="#d7ccc8" stroke-width="1"/>',
    fish: '<ellipse cx="10" cy="12" rx="6" ry="4" fill="#4fc3f7"/><path d="M15.5 12 21 8v8Z" fill="#29b6f6"/><circle cx="7" cy="11" r=".9" fill="#01579b"/>',
    bread: '<rect x="4" y="9" width="16" height="9" rx="4.5" fill="#a1703a"/><path d="M8 11q1.5 2 0 4M12.5 11q1.5 2 0 4M16.5 11q1 2 0 4" stroke="#6d4c41" stroke-width="1" fill="none"/>',
    cookie: '<circle cx="12" cy="12" r="8" fill="#8d6e63"/><circle cx="9" cy="10" r="1.3" fill="#4e342e"/><circle cx="14" cy="9" r="1.3" fill="#4e342e"/><circle cx="12" cy="14" r="1.3" fill="#4e342e"/><circle cx="15.5" cy="13.5" r="1" fill="#4e342e"/>',
    cake: '<path d="M6 20 8 10h8l2 10Z" fill="#f8bbd0"/><rect x="7.4" y="8" width="9.2" height="3" rx="1.5" fill="#fff8e1"/><circle cx="12" cy="6" r="1.6" fill="#e53935"/>'
  };
  const stageDom = []; // אלמנטי DOM של שלב - מנוקים בcleanupStage
  const NUM_WORDS = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש'];
  const CUST_LINES = ['קניות לחג!', 'רשימה ארוכה יותר הפעם.', 'שוב אני עם העגלה!', 'קונה לכל הלהקה!', 'צריך הרבה גזרים!', 'קניות של לילה!'];
  const WRONG = 'זה לא הפריט הנכון. נסי שוב!';
  const alive = () => !!(w.root && w.root.isConnected);

  // ---------- אודיו: קליפים מוקלטים בלבד (אין קול דפדפן). משוב מיידי מחליף משוב ישן, הוראות בתור ----------
  const sAudio = new Audio(); let sQ = [], sPlay = false, sTok = 0, sTimer = null, sCur = null;
  window.__shopMissing = [];
  function haltSpeech() { sTok++; sQ = []; sPlay = false; sCur = null; if (sTimer) { clearTimeout(sTimer); sTimer = null } try { sAudio.pause() } catch (e) {} }
  function sPump() {
    if (sPlay || !sQ.length) return;
    const it = sQ.shift(), my = sTok; sPlay = true; sCur = it; let fin = false;
    const done = () => { if (fin || my !== sTok) return; fin = true; if (sTimer) { clearTimeout(sTimer); sTimer = null } sPlay = false; sCur = null; if (it.then) it.then(); sPump() };
    const src = (typeof VOICE_CLIPS !== 'undefined') && VOICE_CLIPS[it.t];
    if (!src) { window.__shopMissing.push(it.t); sTimer = setTimeout(done, 300); return }
    if (typeof STATE !== 'undefined' && STATE.muted) { sTimer = setTimeout(done, 400); return }
    sAudio.onended = done; sAudio.onerror = () => { if (sTimer) clearTimeout(sTimer); sTimer = setTimeout(done, 300) };
    sAudio.src = src; sTimer = setTimeout(done, Math.min(9000, 2500 + it.t.length * 160));
    try { const pr = sAudio.play(); if (pr && pr.catch) pr.catch(() => { if (my === sTok) { if (sTimer) clearTimeout(sTimer); sTimer = setTimeout(done, 300) } }) } catch (e) {}
  }
  function speak(t, then) { if (sQ.length >= 4) sQ.splice(0, sQ.length - 3); sQ.push({ t, then, k: 'i' }); sPump() }
  function fb(t, then) {
    const keep = sQ.filter(x => x.k === 'i'), cur = sPlay ? sCur : null;
    haltSpeech(); if (cur && cur.k === 'i' && !cur.re) { cur.re = true; keep.unshift(cur) }
    sQ = [{ t, then, k: 'f' }].concat(keep); sPump();
  }
  function banner(text, say) {
    w.banner(text, null);
    const b = w.hud.querySelector('.w3d-banner .w3d-spk'); if (b) b.onclick = () => { if (say) fb(say) };
  }
  const _dispose = w.dispose;
  w.dispose = () => { haltSpeech(); _dispose() };

  if (!document.getElementById('shop-style')) {
    const st = document.createElement('style'); st.id = 'shop-style';
    st.textContent = '.shop-lbl{position:absolute;transform:translate(-50%,-100%);display:flex;gap:4px;padding:4px 7px;background:rgba(255,255,255,.95);border:3px solid #fb8c00;border-radius:14px;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.25)}'
      + '.shop-fx{position:absolute;transform:translate(-50%,-50%);pointer-events:none;animation:shopfx .9s ease-out forwards}@keyframes shopfx{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}25%{transform:translate(-50%,-50%) scale(1.25);opacity:1}100%{transform:translate(-50%,-80%) scale(1);opacity:0}}'
      + '.shop-cnt{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;background:rgba(255,255,255,.92);border-radius:14px;padding:7px 12px;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.2)}.shop-cnt span{width:18px;height:18px;border-radius:50%;border:3px solid #fb8c00;background:#fff}.shop-cnt span.on{background:#43a047;border-color:#2e7d32}';
    document.head.appendChild(st);
  }

  // ---------- ניהול שלבים ----------
  const STAGES = ['find', 'shelfsort', 'count', 'pay', 'done'];
  let stage = 0;
  w.progressInit(4);
  const CAMS = [ // דסקטופ; הנייד מקבל ריווח אוטומטי
    { p: [0, 3.0, 7.0], l: [-0.1, 0.9, 1.2] },   // find
    { p: [0, 3.0, 7.6], l: [0, 0.9, 1.3] },      // shelfsort
    { p: [0, 3.0, 7.0], l: [0, 0.9, 1.5] },      // count
    { p: [0, 3.0, 7.0], l: [0, 1.0, 1.1] },      // pay
    { p: [0, 2.5, 6.4], l: [0, 1.3, 0] }         // done
  ];
  function setStage(i) {
    haltSpeech(); stage = i;
    const c = CAMS[i]; if (c) w.flyTo(c.p[0], c.p[1], c.p[2], c.l[0], c.l[1], c.l[2]);
    ticks.length = 0; ticks.push(pinTick);
    [stageFind, stageShelfsort, stageCount, stagePay, stageDone][i]();
  }
  function clearGroup(arr) { arr.forEach(o => { o.parent && o.parent.remove(o) }); arr.length = 0 }
  let stageObjs = [], stageDrags = [], stageTargets = [], pins = [];
  function cleanupStage() {
    stageDom.forEach(e => e.remove()); stageDom.length = 0; pins = [];
    clearGroup(stageObjs);
    stageDrags.forEach(d => { const i = draggables.indexOf(d); if (i >= 0) draggables.splice(i, 1) });
    stageTargets.forEach(t => { if (t.ring) t.ring.visible = false; const i = targets.indexOf(t); if (i >= 0) targets.splice(i, 1) });
    stageDrags = []; stageTargets = [];
  }
  const draggables = w._drags, targets = w._tgts;
  function shuffled(a) { return a.slice().sort(() => Math.random() - .5) }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const pt = (x, y, z) => ({ getWorldPosition: v => v.set(x, y, z) });
  // כרטיס DOM הצמוד לנקודה בעולם
  function pin(elm, x, y, z) { w.hud.appendChild(elm); stageDom.push(elm); pins.push({ elm, o: pt(x, y, z) }); const sp = w.screenPos(pins[pins.length - 1].o); elm.style.left = sp.x + 'px'; elm.style.top = sp.y + 'px' }
  function pinTick() { pins.forEach(p => { const sp = w.screenPos(p.o); p.elm.style.left = sp.x + 'px'; p.elm.style.top = sp.y + 'px' }) }
  function icons(keys, color) {
    const d = document.createElement('div'); d.className = 'shop-lbl'; if (color) d.style.borderColor = color;
    d.innerHTML = keys.map(k => '<svg viewBox="0 0 24 24" width="30" height="30">' + ICONS[k] + '</svg>').join(''); return d;
  }
  // סימון משוב קצר ליד נקודה: v נכון / x טעות (נשאר גם אחרי שהפריט נחת בתוך היעד)
  function flash(x, y, z, ok) {
    const d = document.createElement('div'); d.className = 'shop-fx';
    d.innerHTML = ok ? '<svg viewBox="0 0 40 40" width="54" height="54"><circle cx="20" cy="20" r="18" fill="#43a047" stroke="#fff" stroke-width="3"/><path d="M11 21l6 6 12-13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 40 40" width="54" height="54"><circle cx="20" cy="20" r="18" fill="#e53935" stroke="#fff" stroke-width="3"/><path d="M13 13l14 14M27 13L13 27" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';
    const sp = w.screenPos(pt(x, y, z)); d.style.left = sp.x + 'px'; d.style.top = sp.y + 'px';
    w.hud.appendChild(d); setTimeout(() => d.remove(), 1000);
  }
  let cntEl = null;
  function dots(total) { if (cntEl) cntEl.remove(); cntEl = document.createElement('div'); cntEl.className = 'shop-cnt'; for (let i = 0; i < total; i++) cntEl.appendChild(document.createElement('span')); w.hud.appendChild(cntEl); stageDom.push(cntEl) }
  function dotsSet(n) { if (cntEl) [...cntEl.children].forEach((s, i) => s.className = i < n ? 'on' : '') }

  // יעד שחרור: העוגן יושב בדיוק במרכז הטבעת הנראית; רדיוס הקליטה נגזר מגודל הטבעת במסך (לא ממרכז על הרצפה)
  function mkTarget(x, y, z, o) {
    const anchor = w.group(x, y, z); stageObjs.push(anchor);
    const t = w.addDropTarget(anchor, { ringR: o.r, ringRot: o.flat ? { x: Math.PI / 2 } : null, onDrop: o.onDrop, accepts: o.accepts });
    t.ring.geometry.dispose(); t.ring.geometry = new THREE.TorusGeometry(o.r, .07, 12, 48); t.ring.material.color.set(o.color || '#ff6d00'); t.ring.visible = true;
    const edge = pt(x + o.r, y, z), ctr = pt(x, y, z);
    Object.defineProperty(t, 'radiusPx', { get() { const a = w.screenPos(ctr), b = w.screenPos(edge); return Math.max(52, Math.hypot(a.x - b.x, a.y - b.y) * 1.18 + 12) } });
    t.pos = V3(x, y, z); stageTargets.push(t); return t;
  }
  function bounceHome(d) {
    const g = d.grp, h = d.home.clone(), from = g.position.clone(), t0 = performance.now(); d.active = false;
    (function s() { const k = Math.min(1, (performance.now() - t0) / 400); g.position.lerpVectors(from, h, k); g.position.y += Math.sin(k * Math.PI) * .25; if (k < 1 && alive()) requestAnimationFrame(s); else { g.position.copy(h); d.active = true } })();
  }
  function wrong(d, t) {
    sfx('oops'); fb(WRONG); flash(t.pos.x, t.pos.y + .2, t.pos.z + .3, false); bounceHome(d);
  }
  // הפריט נשאר גלוי בתוך היעד (לא נעלם)
  function land(d, t, k, per, sc) {
    d.active = false; d.grp.scale.setScalar(sc || .7);
    const c = k % per, r = Math.floor(k / per);
    d.grp.position.set(t.pos.x + (c - (per - 1) / 2) * .26, t.pos.y - .12 - r * .02, t.pos.z + .1 + r * .2);
    flash(t.pos.x, t.pos.y + .3, t.pos.z + .3, true);
  }
  function grid(n, per, dx, y, zs) {
    const out = [];
    for (let i = 0; i < n; i++) { const r = Math.floor(i / per), c = i % per, cnt = Math.min(per, n - r * per); out.push(V3((c - (cnt - 1) / 2) * dx, y, zs[Math.min(r, zs.length - 1)])) }
    return out;
  }
  function placeAll(arr, spots) { arr.forEach((g, i) => { g.position.copy(spots[i]); }); stageDrags.forEach(d => d.home.copy(d.grp.position)) } // home נלכד אחרי הפיזור הסופי
  function mkItem(g, o) {
    const it = itemModel(g.k, scene); it.scale.setScalar(o.scale || 1.55); stageObjs.push(it);
    const dr = w.makeDraggable(it, { proxyR: .34, onPick: () => { sfx('tick'); fb(g.n) }, onMiss: () => { fb(WRONG) } });
    dr.userData = o.ud; stageDrags.push(dr); return it;
  }
  function praise(next) {
    let fired = false; const go = () => { if (!fired) { fired = true; setStage(next) } };
    speak('כל הכבוד רונה!', () => setTimeout(go, 400)); setTimeout(go, 6000);
  }

  // ---------- שלב 0: רשימת קניות → עגלה ----------
  function stageFind() {
    cleanupStage(); showOnly([shelvesG, cartG, cust]); cust.position.set(2.1, 0, -1.2);
    const need = shuffled(GOODS).slice(0, 1 + eff);
    const decoys = shuffled(GOODS.filter(g => !need.includes(g))).slice(0, eff);
    const items = shuffled(need.concat(decoys));
    banner('מה ברשימה? גררי לעגלה', 'גררי את הפריטים מהרשימה לעגלה');
    speak(CUST_LINES[prog.visits % CUST_LINES.length]); speak('גררי את הפריטים מהרשימה לעגלה');
    const listEl = document.createElement('div'); listEl.className = 'shop-list';
    need.forEach(g => {
      const chip = document.createElement('div'); chip.className = 'shop-chip'; chip.dataset.k = g.k;
      chip.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30">' + ICONS[g.k] + '</svg>'; listEl.appendChild(chip);
    });
    w.root.appendChild(listEl); stageDom.push(listEl);
    // דוכן תצוגה קדמי - הפריטים על משטח בהיר, לא מאחורי מקרר/דלפק
    const stall = w.group(0, 0, 0); stageObjs.push(stall);
    w.box(4.6, .7, 2.6, '#a1887f', 0, .35, .3, stall); w.box(4.8, .08, 2.7, '#fdf6ee', 0, .74, .3, stall);
    dots(need.length); let got = 0;
    items.forEach(g => mkItem(g, { ud: { kind: g.k, needed: need.includes(g) } }));
    const spots = grid(items.length, 4, .85, .78, [1.1, -.55]);
    placeAll(stageDrags.map(d => d.grp), spots);
    const cx = cartG.position.x, cz = cartG.position.z;
    const tgt = mkTarget(cx, 1.45, cz, { r: .78, flat: true, color: '#ff6d00',
      onDrop: (d, t) => {
        if (d.userData.needed) {
          sfx('good'); fb(NUM_WORDS[got] || '' + (got + 1)); land(d, t, got, 3, .6); got++; dotsSet(got);
          const chip = listEl.querySelector('[data-k="' + d.userData.kind + '"]:not(.got)'); if (chip) chip.classList.add('got');
          if (got >= need.length) { w.progressStep(); praise(1) }
        } else wrong(d, t);
      } });
  }

  // ---------- שלב 1: מיון סחורה למדפים ----------
  function stageShelfsort() {
    cleanupStage(); showOnly([shelvesG, fridgeG]);
    const withBakery = eff >= 2;
    banner(withBakery ? 'מייני: ירקות ופירות לירוק, מאפים לחום, שאר למקרר' : 'מייני: ירקות ופירות למדף הירוק, שאר למקרר', withBakery ? 'מייני: ירקות ופירות למדף הירוק, מאפים למדף החום, וכל השאר למקרר' : 'מייני את הסחורה למדפים הנכונים');
    speak(withBakery ? 'מייני: ירקות ופירות למדף הירוק, מאפים למדף החום, וכל השאר למקרר' : 'מייני את הסחורה למדפים הנכונים');
    const veg = shuffled(GOODS.filter(g => g.cat === 'veg')).slice(0, withBakery ? 2 : 2 + Math.floor(eff / 2));
    const cool = shuffled(GOODS.filter(g => g.cat === 'cool')).slice(0, withBakery ? 2 : 2 + Math.ceil(eff / 2));
    const bake = withBakery ? shuffled(GOODS.filter(g => g.cat === 'bakery')).slice(0, 2) : [];
    const items = shuffled(veg.concat(cool, bake));
    const xs = withBakery ? { cool: -1.5, bakery: 0, veg: 1.5 } : { cool: -1.0, veg: 1.0 };
    const TZ = .4;
    fridgeG.scale.setScalar(.8); fridgeG.position.set(xs.cool, 0, TZ);
    const crate = (x, c1, c2) => { const g = w.group(x, 0, TZ); stageObjs.push(g); w.box(1.25, .75, .8, c1, 0, .38, 0, g); w.box(1.31, .08, .86, c2, 0, .78, 0, g); return g };
    crate(xs.veg, '#43a047', '#2e7d32');
    if (withBakery) crate(xs.bakery, '#a1703a', '#6d4c41');
    const cats = [['cool', '#1e88e5', ['milk', 'cheese'], 1.0, .95, true], ['veg', '#2e7d32', ['apple', 'carrot'], 1.2, 0, false]].concat(withBakery ? [['bakery', '#ef6c00', ['bread', 'cake'], 1.2, 0, false]] : []);
    const left = { n: items.length }; const slot = {};
    cats.forEach(([cat, color, icn, y, zoff, vertical]) => {
      const z = TZ + (vertical ? .62 : 0) + zoff * 0;
      const t = mkTarget(xs[cat], y, z, { r: .58, flat: !vertical, color,
        onDrop: (d, tt) => {
          if (d.userData.cat === cat) {
            sfx('good'); fb('נכון!'); slot[cat] = (slot[cat] || 0); land(d, tt, slot[cat]++, 2, .55); left.n--; dotsSet(items.length - left.n);
            if (left.n <= 0) { w.progressStep(); praise(2) }
          } else wrong(d, tt);
        } });
      pin(icons(icn, color), xs[cat], y + (vertical ? .95 : .85), z);
    });
    dots(items.length);
    items.forEach(g => mkItem(g, { ud: { kind: g.k, cat: g.cat }, scale: 1.6 }));
    placeAll(stageDrags.map(d => d.grp), grid(items.length, 3, 1.1, .6, [2.6, 4.2]));
  }

  // ---------- שלב 2: ספירה לשקית ----------
  function stageCount() {
    cleanupStage(); showOnly([shelvesG, bagG, cust]); cust.position.set(2.2, 0, -1.2);
    const n = 2 + eff;
    banner('כמה פריטים? ספרי איתי!', 'גררי את הפריטים לשקית וספרי בקול');
    speak('גררי את הפריטים לשקית וספרי בקול');
    const kinds = shuffled(GOODS).slice(0, Math.min(n, GOODS.length));
    kinds.forEach(g => mkItem(g, { ud: { kind: g.k } }));
    placeAll(stageDrags.map(d => d.grp), grid(n, 3, 1.1, .6, [2.6, 4.2]));
    dots(n); let got = 0;
    mkTarget(bagG.position.x, 1.3, bagG.position.z, { r: .7, flat: true, color: '#ff6d00',
      onDrop: (d, t) => {
        sfx('good'); fb(NUM_WORDS[got] || '' + (got + 1)); land(d, t, got, 3, .55); got++; dotsSet(got);
        if (got >= n) { w.progressStep(); praise(3) }
      } });
  }

  // ---------- שלב 3: תשלום בקופה (ועודף ברמה 4) ----------
  function stagePay() {
    cleanupStage(); showOnly([shelvesG, counterG, cust]);
    counterG.position.set(-.6, 0, .2); cust.position.set(1.6, 0, .1);
    const price = 2 + eff, big = lvl >= 4;
    banner(big ? 'משלמים ונותנים עודף!' : 'משלמים בקופה!', 'עכשיו משלמים בקופה! גררי את המטבעות');
    speak('עכשיו משלמים בקופה! גררי את המטבעות');
    const tray = w.group(0, 0, 0); stageObjs.push(tray);
    w.box(3.4, .12, .9, '#8d6e63', 0, .5, 2.6, tray); w.box(3.3, .04, .8, '#fdf6ee', 0, .58, 2.6, tray);
    const nCoins = price + (eff >= 2 ? 1 : 0), needChange = big ? 2 : 0;
    const coins = [];
    const mkCoin = (change) => {
      const coin = w.group(0, .7, 2.6); stageObjs.push(coin); coin.scale.setScalar(1.5); coin.rotation.x = 1.0;
      w.cyl(.14, .14, .04, '#ffd54f', 0, 0, 0, coin); w.cyl(.1, .1, .05, '#ffca28', 0, 0, 0, coin);
      const dr = w.makeDraggable(coin, { proxyR: .26, onPick: () => sfx('tick'), onMiss: () => fb(WRONG) });
      dr.userData = change ? { change: true } : { coin: true }; stageDrags.push(dr); return coin;
    };
    for (let i = 0; i < nCoins; i++) coins.push(mkCoin(false));
    placeAll(coins, grid(nCoins, 7, .5, .72, [2.6]));
    let paid = 0, change = 0; dots(price + needChange);
    const rg = register.getWorldPosition(V3(0, 0, 0)); // מרכז הקופה הנראה
    const rz = counterG.position.z + .75, rx = counterG.position.x;
    const tgt = mkTarget(rx, 1.45, rz, { r: .62, color: '#ff6d00',
      onDrop: (d, t) => {
        if (paid >= price || !d.userData.coin) { wrong(d, t); return }
        paid++; sfx('good'); fb(NUM_WORDS[paid - 1] || '' + paid); land(d, t, paid - 1, 3, .8); dotsSet(paid);
        if (paid >= price) {
          if (needChange) {
            speak('ועכשיו תני את העודף ללקוחה');
            const ch = []; for (let i = 0; i < needChange; i++) ch.push(mkCoin(true));
            placeAll(ch, grid(needChange, 4, .6, .72, [2.6]).map(v => v));
            stageDrags.forEach(dd => dd.home.copy(dd.grp.position));
            tgt.ring.visible = false; tgtCust.ring.visible = true;
          } else { w.progressStep(); praise(4) }
        }
      } });
    const tgtCust = mkTarget(cust.position.x, 1.45, cust.position.z + .7, { r: .62, color: '#8e24aa',
      onDrop: (d, t) => {
        if (!d.userData.change) { wrong(d, t); return }
        sfx('good'); fb(NUM_WORDS[change] || '' + (change + 1)); land(d, t, change, 2, .8); change++; dotsSet(price + change);
        if (change >= needChange) { w.progressStep(); praise(4) }
      } });
    tgtCust.ring.visible = false;
  }

  // ---------- שלב 4: סיום ----------
  let visitCounted = false;
  function stageDone() {
    cleanupStage(); showOnly([shelvesG, cust]); cust.position.set(0, 0, 0);
    const r = (!visitCounted && typeof prog3d !== 'undefined') ? prog3d.completeVisit('shop') : null;
    visitCounted = true;
    banner(r && r.newLevel ? 'רמה ' + r.lvl + ' נפתחה!' : 'כל הכבוד! סיימת!', r && r.newLevel ? 'רמה ' + r.lvl + ' נפתחה!' : 'כל הכבוד! סיימת!');
    w.endPanel('הלקוחה מאושרת! את מוכרת אלופה!', 'שחקי שוב', () => location.reload());
    speak('הלקוחה מאושרת! את מוכרת אלופה!', () => { if (r && r.newLevel) speak('רמה ' + r.lvl + ' נפתחה!') });
  }

  const ticks = [];
  const origOnTick = w.onTick;
  w.onTick = (fn) => ticks.push(fn);
  const pump = () => { ticks.forEach(fn => fn((performance.now()) / 1000)) };
  origOnTick(pump);

  setStage(+(new URLSearchParams(location.search).get('shopstage') || 0)); // פרמטר dev לבדיקות e2e
  w.getStage = () => stage;
  w.STAGES = STAGES;
  return w.dispose.bind(w);
}
