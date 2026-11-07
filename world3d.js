// world3d.js — מנוע תלת-ממד משותף לכל סצנות העולם של רונה (Three.js r128, vendored).
// baseline איכות מחייב (BUILD3D.md): צבעים רוויים, כלי פעיל מלא+מונפש, רמז=חץ/זוהר על הכלי האמיתי,
// מטרות גלויות במלואן עם טבעת על המטרה, מסך סיום לא מכסה את הדמות, אייקוני SVG, הקראה בכל פעולה.
// תלוי ב-app.js: el, speak, sfx. כל סצנה: const w = startWorld3D(root, opts) ... w.dispose() ביציאה.

const W3D_PALETTE = {
  skyDay: '#8fd8f2', floorWarm: '#e8a558', wallA: '#ffd9a0', wallB: '#a8e6b0',
  ring: '#ffd32a', ringOk: '#5fdd6e', halo: '#ffe066',
  tray: '#ffffff', pedestal: ['#4aa8e0', '#f2708a', '#f5b83d', '#5fbf77', '#9b7ede', '#ff8c5a'],
  bannerBg: '#fff8e1', bannerBorder: '#ffb300', btnA: '#ff5e8a', btnB: '#ff9f43'
};

function startWorld3D(root, opts) {
  opts = opts || {};
  if (typeof THREE === 'undefined') { root.appendChild(el('p', 'screen-sub', 'התלת-ממד לא נטען. נסי לרענן')); return null }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }) } catch (e) {
    root.appendChild(el('p', 'screen-sub', 'המכשיר הזה לא תומך במשחק התלת-ממדי')); return null }

  const W = () => root.clientWidth, H = () => root.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.domElement.className = 'w3d-canvas';
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.bg || W3D_PALETTE.skyDay);
  scene.fog = new THREE.Fog(opts.bg || W3D_PALETTE.skyDay, 16, 34);

  const camera = new THREE.PerspectiveCamera(40, W() / H(), .1, 60);
  const camBase = new THREE.Vector3(0, 2.45, 6.2), camLook = new THREE.Vector3(0, 1.35, 0);
  function fitCam() {
    const a = W() / H();
    if (a < .75) { camBase.set(0, 2.7, 8.6); camera.fov = 48 }
    else if (a < 1.1) { camBase.set(0, 2.55, 7.4); camera.fov = 44 }
    else { camBase.set(0, 2.45, 6.2); camera.fov = 40 }
    camera.aspect = a; camera.updateProjectionMatrix();
  }
  fitCam();
  camera.position.copy(camBase); camera.lookAt(camLook);

  // תאורה מחוזקת (בסיס איכות §1)
  const hemi = new THREE.HemisphereLight('#fff7ea', '#c9a078', .65); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffedd0', 1.6);
  sun.position.set(3.6, 6.5, 4.2); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -3;
  sun.shadow.camera.far = 20; sun.shadow.bias = -.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#cfe4ff', .4); fill.position.set(-4.5, 3, 2.5); scene.add(fill);

  // --- עזרי גיאומטריה ---
  function mat(c, r) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? .8 : r, metalness: 0 }) }
  function box(w, h, d, c, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m }
  function ball(r, c, x, y, z, parent, sx, sy, sz) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 22), mat(c));
    m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m }
  function cyl(rt, rb, h, c, x, y, z, parent, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat(c));
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m }
  function group(x, y, z, parent) { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); (parent || scene).add(g); return g }
  // מונע פגיעות raycaster בעיטורים: לקרוא על כל mesh קישוטי
  function noRay(obj) { obj.traverse ? obj.traverse(o => { o.raycast = () => {} }) : obj.raycast = () => {} }

  // חדר בסיסי: רצפה+קירות; הסצנה מוסיפה תוכן משלה
  function buildRoom(o) {
    o = o || {};
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), mat(o.floor || W3D_PALETTE.floorWarm, .95));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor); noRay(floor);
    [[0, 5, -4.4, 0], [-6.5, 5, 0, Math.PI / 2], [6.5, 5, 0, -Math.PI / 2]].forEach((w, i) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), mat(i === 0 ? (o.wallA || W3D_PALETTE.wallA) : (o.wallB || W3D_PALETTE.wallB), .95));
      wall.position.set(w[0], w[1], w[2]); wall.rotation.y = w[3]; wall.receiveShadow = true; scene.add(wall); noRay(wall);
    });
  }

  // --- HUD (DOM מעל הקנבס; SVG בלבד) ---
  const hud = el('div', 'w3d-hud'); root.appendChild(hud);
  const SVG = {
    speaker: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 8a5 5 0 0 1 0 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    paw: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><ellipse cx="12" cy="15.5" rx="4.6" ry="3.8"/><ellipse cx="5.6" cy="10" rx="2" ry="2.6"/><ellipse cx="9.7" cy="7.6" rx="2" ry="2.6"/><ellipse cx="14.3" cy="7.6" rx="2" ry="2.6"/><ellipse cx="18.4" cy="10" rx="2" ry="2.6"/></svg>',
    again: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5V1L6 7l6 6V9a5.5 5.5 0 1 1-5.4 6.6l-2 .4A7.5 7.5 0 1 0 12 5z"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  let bannerEl = null;
  function banner(text, sayText) {
    if (bannerEl) bannerEl.remove();
    bannerEl = el('div', 'w3d-banner',
      '<button class="w3d-spk" aria-label="שמיעה">' + SVG.speaker + '</button><span>' + text + '</span>');
    bannerEl.querySelector('.w3d-spk').onclick = () => speak(sayText || text);
    hud.appendChild(bannerEl);
    if (sayText !== null) speak(sayText || text);
  }
  let progEl = null, progN = 0, progFilled = 0;
  function progressInit(n) {
    if (progEl) progEl.remove();
    progN = n; progFilled = 0;
    progEl = el('div', 'w3d-progress');
    for (let i = 0; i < n; i++) progEl.appendChild(el('span', 'w3d-pip', SVG.paw));
    hud.appendChild(progEl);
  }
  function progressStep() {
    if (!progEl || progFilled >= progN) return;
    progEl.children[progFilled].classList.add('on'); progFilled++;
  }
  // מסך סיום: צמוד לחלק העליון, לא מכסה את מרכז הסצנה (בסיס איכות §5)
  function endPanel(title, againText, onAgain) {
    const p = el('div', 'w3d-end',
      '<div class="w3d-end-title">' + title + '</div>' +
      '<button class="w3d-again">' + SVG.again + ' ' + (againText || 'שחקי שוב') + '</button>');
    p.querySelector('.w3d-again').onclick = onAgain;
    hud.appendChild(p); return p;
  }

  // --- גרירה: proxy sphere בלתי נראה סביב כל גריר; שחרור לפי מרחק-מסך למטרה ---
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const draggables = [], targets = [];
  function screenPos(obj) {
    const v = new THREE.Vector3(); obj.getWorldPosition(v); v.project(camera);
    return { x: (v.x * .5 + .5) * W(), y: (-v.y * .5 + .5) * H() };
  }
  function makeDraggable(grp, o) {
    o = o || {};
    const d = { grp, home: grp.position.clone(), active: o.active !== false, dragging: false, onPick: o.onPick, onDrop: o.onDrop, lift: o.lift == null ? .55 : o.lift };
    // proxy: פגיעה קלה גם באצבע קטנה
    const proxy = new THREE.Mesh(new THREE.SphereGeometry(o.proxyR || .42, 12, 10),
      new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.drag = d; grp.add(proxy);
    grp.userData.drag = d; draggables.push(d); return d;
  }
  function addDropTarget(obj3d, o) {
    o = o || {};
    const t = { obj: obj3d, radiusPx: o.radiusPx || 150, onDrop: o.onDrop, accepts: o.accepts };
    // טבעת זהב **על המטרה עצמה** (בסיס איכות §4)
    if (o.ring !== false) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(o.ringR || .3, .035, 12, 40),
        new THREE.MeshBasicMaterial({ color: W3D_PALETTE.ring }));
      ring.visible = false; t.ring = ring; (o.ringParent || obj3d).add(ring);
      if (o.ringPos) ring.position.copy(o.ringPos);
      if (o.ringRot) ring.rotation.set(o.ringRot.x || 0, o.ringRot.y || 0, o.ringRot.z || 0);
    }
    targets.push(t); return t;
  }
  function setActiveTool(d, on) {
    d.active = on;
    d.grp.traverse(m => { if (m.material && m.material.transparent) { m.material.opacity = on ? 1 : .8 } });
  }
  let dragCur = null, downPos = null;
  function setPtr(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  function planePoint(ev, z) {
    setPtr(ev); ray.setFromCamera(ptr, camera);
    dragPlane.constant = -z; const out = new THREE.Vector3();
    ray.ray.intersectPlane(dragPlane, out); return out;
  }
  renderer.domElement.addEventListener('pointerdown', ev => {
    setPtr(ev); ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(draggables.filter(d => d.active).map(d => d.grp), true);
    // מיפוי פגיעה לרשומת הגרירה דרך שרשרת האבות (ילדים מקוננים)
    let d = null;
    if (hits.length) { let o = hits[0].object; while (o && !d) { d = o.userData.drag || null; o = o.parent } }
    if (d) {
      dragCur = d; d.dragging = true; downPos = { x: ev.clientX, y: ev.clientY, z: d.grp.position.z };
      if (d.onPick) d.onPick(d);
    }
    rubs.forEach(r => r.down = true);
  });
  renderer.domElement.addEventListener('pointermove', ev => {
    if (dragCur) {
      const p = planePoint(ev, downPos.z);
      if (p) { dragCur.grp.position.x = p.x; dragCur.grp.position.y = Math.max(p.y, .2) + dragCur.lift * .3 }
    }
    // ליטוף: צבירת תנועה כשהמצביע חוצה את הדמות (בסיס: לא דורש pointerdown על הדמות)
    if (ev.buttons) rubs.forEach(r => {
      if (r.done || !r.down) return;
      const sp = screenPos(r.obj);
      const dx = ev.clientX - (renderer.domElement.getBoundingClientRect().left + sp.x);
      const dy = ev.clientY - (renderer.domElement.getBoundingClientRect().top + sp.y);
      if (Math.hypot(dx, dy) < (r.radiusPx || 130)) {
        if (r.last) {
          r.acc += Math.hypot(ev.clientX - r.last.x, ev.clientY - r.last.y);
          if (r.onProgress) r.onProgress(Math.min(1, r.acc / r.needed));
          if (r.acc >= r.needed) { r.done = true; r.onDone && r.onDone() }
        }
        r.last = { x: ev.clientX, y: ev.clientY };
      }
    });
  });
  addEventListener('pointerup', ev => {
    rubs.forEach(r => { r.down = false; r.last = null });
    if (!dragCur) return;
    const d = dragCur; dragCur = null; d.dragging = false;
    // שחרור: מרחק מסך בין נקודת השחרור לכל מטרה מתאימה
    let best = null, bestDist = 1e9;
    const rect = renderer.domElement.getBoundingClientRect();
    targets.forEach(t => {
      if (t.accepts && !t.accepts(d)) return;
      const sp = screenPos(t.obj);
      const dist = Math.hypot(ev.clientX - (rect.left + sp.x), ev.clientY - (rect.top + sp.y));
      if (dist < t.radiusPx && dist < bestDist) { best = t; bestDist = dist }
    });
    if (best) { (best.onDrop || d.onDrop || (() => {}))(d, best) }
    else { // החזרה הביתה ברכות
      const h = d.home, g = d.grp, t0 = performance.now();
      (function back() {
        const k = Math.min(1, (performance.now() - t0) / 350);
        g.position.lerpVectors(g.position.clone(), h, k); g.position.lerp(h, .35);
        if (k < 1 && g.position.distanceTo(h) > .02) requestAnimationFrame(back); else g.position.copy(h);
      })();
      sfx('oops');
      if (d.onMiss) d.onMiss(d);
    }
  });

  // ביטול מגע (מחוות מערכת/התראה/קצה מסך): אין pointerup, אז משחררים בלי יעד וללא קבלה - החפץ חוזר הביתה
  addEventListener('pointercancel', () => {
    rubs.forEach(r => { r.down = false; r.last = null });
    if (!dragCur) return;
    const d = dragCur; dragCur = null; d.dragging = false;
    const h = d.home, g = d.grp, t0 = performance.now();
    (function back() {
      const k = Math.min(1, (performance.now() - t0) / 350);
      g.position.lerp(h, .35);
      if (k < 1 && g.position.distanceTo(h) > .02) requestAnimationFrame(back); else g.position.copy(h);
    })();
  });

  // --- ליטוף ---
  const rubs = [];
  function registerRub(obj, o) {
    o = o || {};
    const r = { obj, needed: o.needed || 900, radiusPx: o.radiusPx || 130, acc: 0, done: false, down: false, last: null, onProgress: o.onProgress, onDone: o.onDone };
    rubs.push(r); return r;
  }

  // --- התקדמות: דרך STATE/saveState של האפליקציה בלבד (לא localStorage גולמי — נמחק בכתיבה-על). ---
  // loadState עושה Object.assign(STATE,s) ולכן מפתחות חדשים נשמרים. לקרוא/לכתוב רק דרך כאן.
  function getProgress(key) { return (typeof STATE !== 'undefined' && STATE[key]) || null }
  function saveProgress(key, value) {
    if (typeof STATE === 'undefined' || typeof saveState !== 'function') return;
    STATE[key] = value; saveState();
  }

  // --- לולאה וטיקים ---
  const ticks = [];
  function onTick(fn) { ticks.push(fn) }
  let alive = true, t0 = performance.now();
  (function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    const t = (performance.now() - t0) / 1000;
    ticks.forEach(fn => fn(t));
    renderer.render(scene, camera);
  })();
  const onRes = () => { renderer.setSize(W(), H()); fitCam(); camera.position.copy(camBase); camera.lookAt(camLook) };
  addEventListener('resize', onRes);

  // מוקד מצלמה לפי שלב (תבנית ה-fixer): מעבר חלק למיקום/מבט
  const flyT = { p: null, l: null };
  function flyTo(px, py, pz, lx, ly, lz) {
    flyT.p = new THREE.Vector3(px, py, pz); flyT.l = new THREE.Vector3(lx, ly, lz);
  }
  const _flyEff = new THREE.Vector3();
  onTick(() => {
    if (!flyT.p) return;
    // ריווח מצלמה לפי יחס מסך: בנייד צר אותו יעד נראה צר בהרבה -
    // מרחיקים את המצלמה מנקודת המבט כדי שהעצמים לא ייחתכו בקצוות
    const a = W() / H(), dolly = a < .75 ? 1.32 : (a < 1.1 ? 1.14 : 1);
    _flyEff.lerpVectors(flyT.l, flyT.p, dolly);
    camera.position.lerp(_flyEff, .35);
    camLook.lerp(flyT.l, .35);
    camera.lookAt(camLook);
  });

  const api = {
    THREE, scene, camera, renderer, root, hud, SVG,
    mat, box, ball, cyl, group, noRay, buildRoom,
    banner, progressInit, progressStep, endPanel,
    makeDraggable, addDropTarget, setActiveTool, registerRub, screenPos, onTick, getProgress, saveProgress,
    flyTo, camBase, camLook, _drags: draggables, _tgts: targets, _rubs: rubs,
    dispose() { alive = false; removeEventListener('resize', onRes); renderer.dispose(); root.innerHTML = '' }
  };
  root._world3d = api; // debug handle לבדיקות e2e
  return api;
}
