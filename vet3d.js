// ביקור תלת-ממדי אצל הוטרינרית - סצנת WebGL אמיתית (Three.js) עם גרירת חפצים למקומם.
// נכנס דרך startVet3D(container) ומחזיר פונקציית ניקוי. מסתמך על speak/sfx/tone/noise/floaty/confettiBurst/toast/el/STATE/saveState/LS_KEY מ-app.js
function startVet3D(root){
 if(typeof THREE==='undefined'){root.appendChild(el('p','screen-sub','התלת-ממד לא נטען. נסי לרענן'));return null}
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true})}catch(e){
  root.appendChild(el('p','screen-sub','המכשיר הזה לא תומך במשחק התלת-ממדי'));return null}
 const W=()=>root.clientWidth,H=()=>root.clientHeight;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 renderer.setSize(W(),H());
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.domElement.className='vet3d-canvas';
 root.appendChild(renderer.domElement);

 const scene=new THREE.Scene();
 scene.background=new THREE.Color('#7fd2b6');
 scene.fog=new THREE.Fog('#7fd2b6',16,32);

 const camera=new THREE.PerspectiveCamera(40,W()/H(),.1,60);
 const camBase=new THREE.Vector3(0,2.45,6.2);
 // נקודת המבט משתנה לפי שלב - המצלמה מכוונת תשומת לב לדמות או למטרה הרלוונטית
 const lookCur=new THREE.Vector3(0,1.6,.15),lookTarget=new THREE.Vector3(0,1.6,.15);
 let parF=.55;
 function fitCam(){const a=W()/H();
  if(a<.75){camBase.set(0,2.6,9.4);camera.fov=52;parF=.3}
  else if(a<1.1){camBase.set(0,2.5,7.6);camera.fov=46;parF=.45}
  else{camBase.set(0,2.45,6.2);camera.fov=40;parF=.55}
  camera.aspect=a;camera.updateProjectionMatrix()}
 fitCam();
 camera.position.copy(camBase);camera.lookAt(lookCur);

 // תאורה: שמש חמה + מילוי רך
 const hemi=new THREE.HemisphereLight('#fff7ea','#d9b8a0',.55);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff1da',1.15);
 sun.position.set(3.6,6.5,4.2);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;
 sun.shadow.camera.top=7;sun.shadow.camera.bottom=-3;sun.shadow.camera.far=20;sun.shadow.bias=-.0004;
 scene.add(sun);
 const fill=new THREE.DirectionalLight('#cfe4ff',.25);fill.position.set(-4.5,3,2.5);scene.add(fill);

 function mat(c,r){return new THREE.MeshStandardMaterial({color:c,roughness:r==null?.85:r,metalness:0})}
 function box(w,h,d,c,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}
 function ball(r,c,x,y,z,parent,sx,sy,sz){const m=new THREE.Mesh(new THREE.SphereGeometry(r,28,22),mat(c));
  m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}
 function cyl(rt,rb,h,c,x,y,z,parent,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||24),mat(c));
  m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}

 // --- החדר ---
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,26),mat('#c97f36',.95));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const wallB=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#f3bd76',.95));
 wallB.position.set(0,5,-4.4);wallB.receiveShadow=true;scene.add(wallB);
 const wallL=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#94dcb0',.95));
 wallL.rotation.y=Math.PI/2;wallL.position.set(-6.5,5,0);wallL.receiveShadow=true;scene.add(wallL);
 const wallR=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#94dcb0',.95));
 wallR.rotation.y=-Math.PI/2;wallR.position.set(6.5,5,0);wallR.receiveShadow=true;scene.add(wallR);
 box(26,.22,.12,'#ffffff',0,.11,-4.34); // פנל תחתון
 const rug=cyl(2.3,2.3,.03,'#ff8fb0',0,.015,1.3,scene,40);rug.receiveShadow=true;
 cyl(1.7,1.7,.032,'#ffb3cd',0,.016,1.3,scene,40);

 // חלון עם שמש
 const winG=new THREE.Group();winG.position.set(-2.4,3,-4.34);scene.add(winG);
 box(1.7,1.9,.1,'#ffffff',0,0,0,winG);
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.6),new THREE.MeshStandardMaterial({color:'#bfe6f5',roughness:.3,emissive:'#9fd4ee',emissiveIntensity:.55}));
 glass.position.z=.06;winG.add(glass);
 box(.08,1.6,.04,'#ffffff',0,0,.08,winG);box(1.4,.08,.04,'#ffffff',0,0,.08,winG);
 const sunBall=ball(.28,'#fff3c4',-0.3,0.35,.05,winG);sunBall.material.emissive=new THREE.Color('#ffe89a');sunBall.material.emissiveIntensity=.9;sunBall.castShadow=false;

 // מדף עם בקבוקונים ועציץ
 const shelf=new THREE.Group();shelf.position.set(2.5,2.35,-4.3);scene.add(shelf);
 box(2,.09,.45,'#ffffff',0,0,0,shelf);
 const bottleCols=['#8fd0f5','#ffb3c7','#b8e6b0'];
 bottleCols.forEach((c,i)=>{const b=cyl(.09,.09,.3,c,-.6+i*.45,.2,0,shelf);ball(.09,c,-.6+i*.45,.38,0,shelf)});
 const pot=cyl(.13,.1,.22,'#e08e5a',.75,.12,0,shelf);
 ball(.22,'#7ec87e',.75,.4,0,shelf,1,.85,1);

 // תמונות עם טביעות כפות (ציור וקטורי על קנבס - לא תלוי בגופן אימוג'י)
 function pawTexture(){const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,128,128);g.fillStyle='#c77dbb';
  g.beginPath();g.ellipse(64,80,22,18,0,0,7);g.fill();
  [[38,50],[58,40],[80,40],[98,52]].forEach(p=>{g.beginPath();g.ellipse(p[0],p[1],9,11,0,0,7);g.fill()});
  const t=new THREE.CanvasTexture(cv);return t}
 [[-4.2,3.4],[3.9,3.6]].forEach(p=>{const fr=box(.95,.95,.07,'#ffffff',p[0],p[1],-4.35);
  const pic=new THREE.Mesh(new THREE.PlaneGeometry(.75,.75),new THREE.MeshBasicMaterial({map:pawTexture()}));
  pic.position.set(p[0],p[1],-4.3);scene.add(pic)});

 // שולחן הבדיקה
 box(2.7,.16,1.6,'#ffffff',0,.95,0); // משטח
 box(2.45,.14,1.4,'#5cb8e6',0,1.06,0); // כרית
 box(2.2,.85,1.1,'#e8eef5',0,.47,0); // ארון
 box(.5,.06,.06,'#9fb2c2',-.5,.55,.58);box(.5,.06,.06,'#9fb2c2',.5,.55,.58); // ידיות
 // מגש הכלים
 const trayY=.78;
 box(3.4,.1,.85,'#ffffff',0,trayY-.05,2.05);
 box(3.2,.05,.7,'#ff9fc8',0,trayY+.01,2.05);
 box(3.5,.06,.95,'#dfe9f2',0,trayY-.13,2.05);

 // --- רקס הכלבלב ---
 const rex=new THREE.Group();rex.position.set(0,1.13,-.15);scene.add(rex);
 const FUR='#eda651',FUR_D='#d18a3e',CREAM='#fff4e0';
 const bodyG=new THREE.Group();rex.add(bodyG);
 const body=ball(.42,FUR,0,.55,-.06,bodyG,.95,1.08,.92);
 ball(.3,CREAM,0,.52,.24,bodyG,.82,.95,.5); // בטן בהירה
 ball(.3,FUR,-.27,.26,-.04,bodyG,1,.8,1.05);ball(.3,FUR,.27,.26,-.04,bodyG,1,.8,1.05); // ירכיים
 const legL=cyl(.085,.095,.42,FUR,-.17,.28,.26,bodyG),legR=cyl(.085,.095,.42,FUR,.17,.28,.26,bodyG);
 ball(.11,CREAM,-.17,.07,.33,bodyG);ball(.11,CREAM,.17,.07,.33,bodyG); // כפות
 const headG=new THREE.Group();headG.position.set(0,1.22,.05);rex.add(headG);
 ball(.34,FUR,0,0,0,headG,1,.93,.93);
 ball(.17,CREAM,0,-.08,.27,headG,1,.78,.95); // חרטום
 const nose=ball(.055,'#4a3232',0,-.045,.42,headG);nose.material.roughness=.4;
 const eyeL=ball(.05,'#38251f',-.13,.06,.27,headG),eyeR=ball(.05,'#38251f',.13,.06,.27,headG);
 eyeL.material.roughness=eyeR.material.roughness=.25;
 ball(.017,'#ffffff',-.115,.08,.31,headG).castShadow=false;ball(.017,'#ffffff',.145,.08,.31,headG).castShadow=false;
 const cheekL=ball(.045,'#f7a8a0',-.25,-.05,.2,headG,1,.8,.4);cheekL.castShadow=false;
 const cheekR=ball(.045,'#f7a8a0',.25,-.05,.2,headG,1,.8,.4);cheekR.castShadow=false;
 const earL=ball(.15,FUR_D,-.31,.16,-.02,headG,.62,1.35,.6),earR=ball(.15,FUR_D,.31,.16,-.02,headG,.62,1.35,.6);
 earL.rotation.z=1.05;earR.rotation.z=-1.05;earL.rotation.x=earR.rotation.x=-.15;
 const tail=new THREE.Mesh(new THREE.TorusGeometry(.2,.065,14,22,2.1),mat(FUR_D));
 tail.position.set(0,.6,-.42);tail.rotation.set(.5,.3,0);tail.castShadow=true;rex.add(tail);
 // שריטה + פלסטר (מוסתר)
 const scratch=new THREE.Group();scratch.position.set(-.36,.55,.13);scratch.rotation.set(0,-.7,.4);rex.add(scratch);
 const sc1=box(.13,.028,.015,'#e0655f',0,0,0,scratch),sc2=box(.028,.13,.015,'#e0655f',0,0,0,scratch);
 sc1.castShadow=sc2.castShadow=false;
 const plaster=new THREE.Group();plaster.position.copy(scratch.position);plaster.rotation.copy(scratch.rotation);plaster.visible=false;rex.add(plaster);
 box(.17,.17,.02,'#ffe4c2',0,0,0,plaster);box(.09,.09,.025,'#f7b98d',0,0,.003,plaster);

 // קערת האוכל על השטיח, קדימה-ימינה ליד מקום העצם - גלויה במלואה גם בנייד וגם במסך רחב, לא מוסתרת על ידי המגש
 const bowlG=new THREE.Group();bowlG.position.set(2.15,0,2.0);scene.add(bowlG);
 const bowlProf=[];for(let i=0;i<=8;i++){const t=i/8;bowlProf.push(new THREE.Vector2(.12+.3*Math.sin(t*1.45),.3*t))}
 const bowl=new THREE.Mesh(new THREE.LatheGeometry(bowlProf,26),mat('#e0556e',.6));
 bowl.castShadow=bowl.receiveShadow=true;bowlG.add(bowl);
 ball(.26,'#b5825a',0,.1,0,bowlG,1,.35,1); // מזון

 // --- הכלים על המגש ---
 function boneMesh(){const g=new THREE.Group();const c=mat('#f9db96',.55);
  const mid=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.3,14),c);mid.rotation.z=Math.PI/2;mid.castShadow=true;g.add(mid);
  [[-.15,.05],[-.15,-.05],[.15,.05],[.15,-.05]].forEach(p=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),c);
   s.position.set(p[0],p[1],0);s.castShadow=true;g.add(s)});
  return g}
 function stethoMesh(){const g=new THREE.Group();const tube=mat('#1f6f80',.5),metal=mat('#cfd9e0',.3);
  const arc=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,12,22,Math.PI),tube);arc.rotation.z=Math.PI;arc.castShadow=true;g.add(arc);
  const hose=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.3,10),tube);hose.position.set(0,-.24,0);hose.castShadow=true;g.add(hose);
  const chest=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.05,20),metal);chest.position.set(0,-.42,0);chest.castShadow=true;g.add(chest);
  const mem=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.02,18),mat('#8fa3ad',.4));mem.position.set(0,-.455,0);g.add(mem);
  [[-.16,.02],[.16,.02]].forEach(p=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),metal);e.position.set(p[0],p[1]+.02,0);g.add(e)});
  return g}
 function thermoMesh(){const g=new THREE.Group();
  const bodyM=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.34,14),mat('#ffffff',.35));bodyM.castShadow=true;g.add(bodyM);
  const cap1=new THREE.Mesh(new THREE.SphereGeometry(.045,14,10),mat('#ffffff',.35));cap1.position.y=.17;g.add(cap1);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.055,14,10),mat('#e04444',.35));bulb.position.y=-.19;bulb.castShadow=true;g.add(bulb);
  const line=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.2,8),mat('#e04444',.4));line.position.y=.05;g.add(line);
  return g}
 function bandageMesh(){const g=new THREE.Group();
  const roll=new THREE.Mesh(new THREE.TorusGeometry(.09,.05,14,22),mat('#f2a24e',.7));roll.rotation.x=Math.PI/2;roll.castShadow=true;g.add(roll);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.24,.02,.1),mat('#f2a24e',.7));strip.position.set(.18,-.04,0);strip.castShadow=true;g.add(strip);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(.1,.024,.06),mat('#ef8f52',.7));pad.position.set(.14,-.03,0);g.add(pad);
  return g}
 // חץ ורוד מעל הכלי הפעיל - הרמז הוא על הכלי האמיתי עצמו, לא בועה צפה שנראית כמו פריט לגרירה
 function arrowTexture(){const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.beginPath();g.moveTo(64,110);g.lineTo(20,60);g.lineTo(44,60);g.lineTo(44,20);g.lineTo(84,20);g.lineTo(84,60);g.lineTo(108,60);g.closePath();
  g.fillStyle='#ff5d8f';g.strokeStyle='#ffffff';g.lineWidth=11;g.lineJoin='round';g.stroke();g.fill();
  return new THREE.CanvasTexture(cv)}
 // כף יד מונפשת שמדגימה ליטוף בשלב הראשון
 function handTexture(){const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.fillStyle='#ff9fbd';g.strokeStyle='#d16a92';g.lineWidth=5; // שרוול מאחורי הכף
  g.beginPath();g.roundRect(34,84,60,26,8);g.fill();g.stroke();
  g.fillStyle='#ffffff';g.strokeStyle='#c98a4a';g.lineWidth=5;g.lineJoin='round';g.lineCap='round';
  [45,59,73,87].forEach(x=>{g.beginPath();g.ellipse(x,36,8.5,16,0,0,7);g.fill();g.stroke()}); // אצבעות
  g.beginPath();g.ellipse(66,64,26,26,0,0,7);g.fill();g.stroke(); // כף
  g.beginPath();g.ellipse(35,66,9,14,-.55,0,7);g.fill();g.stroke(); // אגודל
  return new THREE.CanvasTexture(cv)}

 const tools={};
 const toolDefs=[
  {id:'stetho',x:-1.05,mk:stethoMesh,col:'#63b8e8',name:'סטטוסקופ'},
  {id:'thermo',x:-.35,mk:thermoMesh,col:'#ff9d9d',name:'מדחום'},
  {id:'bandage',x:.35,mk:bandageMesh,col:'#ffcf6e',name:'פלסטר'},
  {id:'bone',x:1.05,mk:boneMesh,col:'#9fdd7a',name:'עצם'}];
 const arrowTex=arrowTexture();
 toolDefs.forEach(d=>{
  const ped=cyl(.26,.3,.09,'#ccd6e2',d.x,trayY+.09,2.05); // מעמד ניטרלי; נצבע בצבע הכלי רק כשהוא פעיל
  const grp=new THREE.Group();grp.position.set(d.x,trayY+.32,2.05);scene.add(grp);
  const m=d.mk();grp.add(m);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshBasicMaterial({visible:false}));grp.add(proxy);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(.3,24),new THREE.MeshBasicMaterial({color:'#ffd54a',transparent:true,opacity:.65,depthTest:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=-.185;halo.visible=false;halo.raycast=()=>{};grp.add(halo);
  const arrow=new THREE.Mesh(new THREE.PlaneGeometry(.36,.36),new THREE.MeshBasicMaterial({map:arrowTex,transparent:true,depthTest:false}));
  arrow.position.set(0,.62,0);arrow.visible=false;arrow.renderOrder=6;arrow.raycast=()=>{};grp.add(arrow);
  grp.traverse(o=>{if(o.isMesh){o.userData.toolId=d.id;o.userData.baseColor=o.material.color.clone()}});
  tools[d.id]={grp,home:grp.position.clone(),ped,active:false,dragging:false,arrow,halo}});

 // טבעות מטרה זוהרות
 function targetRing(){const g=new THREE.Group();
  const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,10,32),
  new THREE.MeshBasicMaterial({color:'#ffbf00',transparent:true,opacity:1,depthTest:false}));
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.17,24),
  new THREE.MeshBasicMaterial({color:'#ffdf6e',transparent:true,opacity:.3,depthTest:false}));
  g.add(r);g.add(disc);g.renderOrder=5;g.visible=false;g.userData.base=1;
  g.traverse(o=>o.raycast=()=>{});scene.add(g);return g}
 const rings={heart:targetRing(),head:targetRing(),scratch:targetRing(),bowl:targetRing()};
 function ringAt(ring,pos,faceCam){ring.position.copy(pos);ring.visible=true;
  if(faceCam)ring.lookAt(camera.position);else ring.rotation.x=-Math.PI/2}
 function hideRings(){Object.values(rings).forEach(r=>r.visible=false)}
 function worldPos(obj){const v=new THREE.Vector3();obj.getWorldPosition(v);return v}

 // יד הליטוף המונפשת
 const handHint=new THREE.Sprite(new THREE.SpriteMaterial({map:handTexture(),transparent:true,depthTest:false}));
 handHint.scale.set(.75,.75,1);handHint.renderOrder=7;handHint.visible=false;handHint.raycast=()=>{};scene.add(handHint);

 // ניצוצות תלת-ממדיים
 const sparks=[];
 function sparkleBurst(pos,n,cols){for(let i=0;i<(n||12);i++){
  const s=ball(.035+Math.random()*.03,(cols||['#ffd54a','#ff8fb3','#a5e6a0','#7ec8e3'])[i%4],pos.x,pos.y,pos.z);
  s.castShadow=false;const a=Math.random()*6.28,b=Math.random()*3.14;
  sparks.push({m:s,v:new THREE.Vector3(Math.sin(b)*Math.cos(a),Math.abs(Math.cos(b))+.6,Math.sin(b)*Math.sin(a)).multiplyScalar(1.4+Math.random()),life:1})}}

 // טווינים פשוטים
 const tweens=[];
 function tw(get,set,dur,ease,done){tweens.push({t:0,dur,set,ease:ease||(k=>1-Math.pow(1-k,3)),done})}
 function twPos(obj,to,dur,ease,done){const from=obj.position.clone();tw(0,k=>obj.position.lerpVectors(from,to,k),dur,ease,done)}
 function twScale(obj,to,dur,done){const from=obj.scale.clone();tw(0,k=>obj.scale.set(from.x+(to-from.x)*k,from.y+(to-from.y)*k,from.z+(to-from.z)*k),dur,null,done)}

 // צלילים מיוחדים לסצנה
 function heartbeat(){tone(85,.16,'sine',.22);tone(75,.2,'sine',.2,.22)}
 function yip(){tone(760,.09,'triangle',.14);tone(980,.12,'triangle',.14,.11)}
 function chomp(){noise(.06,.3);setTimeout(()=>noise(.06,.3),160)}

 // ממשק על-דמיון: הוראה + התקדמות
 const PAW_SVG='<svg viewBox="0 0 100 100" width="1em" height="1em" style="display:block"><g fill="currentColor"><ellipse cx="50" cy="70" rx="25" ry="19"/><ellipse cx="22" cy="44" rx="10" ry="13"/><ellipse cx="42" cy="33" rx="10" ry="13"/><ellipse cx="61" cy="33" rx="10" ry="13"/><ellipse cx="80" cy="46" rx="10" ry="13"/></g></svg>';
 const SPK_SVG='<svg viewBox="0 0 100 100" width="1.05em" height="1.05em" style="display:block"><g fill="currentColor"><path d="M14 40 h18 l22 -20 v60 l-22 -20 h-18 z"/><path d="M63 38 q13 12 0 24" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M73 27 q21 23 0 46" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/></g></svg>';
 const hud=el('div','vet3d-hud');
 const instrBox=el('div','instr vet3d-instr','<span></span>');
 const instrTxt=instrBox.querySelector('span');
 const rep=el('button','',SPK_SVG);rep.setAttribute('aria-label','שמע שוב');instrBox.appendChild(rep);
 const paws=el('div','vet3d-paws');
 for(let i=0;i<5;i++)paws.appendChild(el('span','paw',PAW_SVG));
 hud.appendChild(paws);hud.appendChild(instrBox);root.appendChild(hud);
 let curInstr='';
 rep.onclick=()=>{if(curInstr)vetSpeak(curInstr)};
 function setPaws(n){[...paws.children].forEach((p,i)=>p.classList.toggle('on',i<n))}

 // --- דיבור: שורת הוראות ממתינה לסוף המשפט הנוכחי בלי לחתוך אותו,
 //     כדי שהמעברים יהיו מהירים (השלב מתקדם מיד) בלי לאבד הקראה חיונית ---
 let spkEpoch=0,spkBusy=false,spkPending=null,dead=false;
 function vetSpeak(txt,onEnd){spkEpoch++;const ep=spkEpoch;
  if(!txt){spkBusy=false;if(onEnd)onEnd();return}
  spkBusy=true;
  speak(txt,()=>{if(ep!==spkEpoch)return;spkBusy=false;if(onEnd)onEnd();
   if(spkPending!=null){const p=spkPending;spkPending=null;vetSpeak(p)}})}
 function sayStageInstr(display,spoken){curInstr=display;instrTxt.textContent=display;const s=spoken||display;
  if(spkBusy)spkPending=s;else{spkPending=null;vetSpeak(s)}}

 // --- מצב המשחק ---
 const STAGES=['pet','stetho','thermo','bandage','bone','done'];
 let stage=0,pets=0,finished=false;
 const stageInstr={
  pet:'רקס הכלבלב נשרט במשחק. קודם נלטף אותו כדי שירגע',
  stetho:'גררי את הסטטוסקופ אל הלב של רקס',
  thermo:'עכשיו גררי את המדחום אל המצח של רקס',
  bandage:'גררי את הפלסטר אל השריטה',
  bone:'רקס רעב אחרי הטיפול! גררי את העצם אל הקערה'};
 // מוקד מבט לכל שלב - מסגר את הדמות והמטרה יחד בלי שהמטרה נחתכת או מוסתרת
 const stageLook={pet:[0,1.6,.15],stetho:[0,1.55,.3],thermo:[0,1.85,.1],bandage:[-.35,1.6,.15],bone:[1.3,1.0,1.0],done:[0,1.78,.2]};
 function activeToolId(){const s=STAGES[stage];return(s==='stetho'||s==='thermo'||s==='bandage'||s==='bone')?s:null}
 const GRAY=new THREE.Color('#9aa2ad');
 function updateTools(){toolDefs.forEach(d=>{const t=tools[d.id],on=d.id===activeToolId();
  t.active=on;
  t.grp.traverse(o=>{if(o.isMesh&&o!==t.halo&&o!==t.arrow){o.material.transparent=false;o.material.opacity=1;
   o.material.color.copy(o.userData.baseColor);if(!on)o.material.color.lerp(GRAY,.3)}});
  t.ped.material.color.set(on?d.col:'#ccd6e2');
  t.halo.visible=on})}
 function updateRing(){hideRings();const s=STAGES[stage];
  if(s==='stetho')ringAt(rings.heart,worldPos(body).add(new THREE.Vector3(-.1,.15,.45)),true);
  else if(s==='thermo')ringAt(rings.head,worldPos(headG).add(new THREE.Vector3(0,.18,.3)),true);
  else if(s==='bandage')ringAt(rings.scratch,worldPos(scratch).add(new THREE.Vector3(-.06,0,.12)),true);
  else if(s==='bone'){ringAt(rings.bowl,worldPos(bowlG).add(new THREE.Vector3(0,.42,0)),false);rings.bowl.userData.base=1.4}
  else rings.bowl.userData.base=1}
 function updateLook(){const L=stageLook[STAGES[stage]]||stageLook.pet;lookTarget.set(L[0],L[1],L[2])}
 function gotoStage(i){stage=i;setPaws(Math.min(i,5));updateTools();updateRing();updateLook();
  const s=STAGES[stage];if(stageInstr[s])sayStageInstr(stageInstr[s])}

 // גרירה
 const ray=new THREE.Raycaster(),ptr=new THREE.Vector2(),dragPlane=new THREE.Plane(),dragOff=new THREE.Vector3();
 let dragTool=null,draggingOnPet=false,lastPet=null,petDist=0;
 function setPtr(e){const r=renderer.domElement.getBoundingClientRect();
  ptr.x=((e.clientX-r.left)/r.width)*2-1;ptr.y=-((e.clientY-r.top)/r.height)*2+1}
 function pickTool(e){setPtr(e);ray.setFromCamera(ptr,camera);
  for(const d of toolDefs){const hit=ray.intersectObject(tools[d.id].grp,true);
   if(hit.length)return tools[d.id]}
  return null}
 function pickRex(e){setPtr(e);ray.setFromCamera(ptr,camera);return ray.intersectObject(rex,true).length>0}
 const cvs=renderer.domElement;
 cvs.style.touchAction='none';
 cvs.addEventListener('pointerdown',e=>{
  if(finished)return;
  const t=pickTool(e);
  if(t){
   if(!t.active){sfx('tick');vetSpeak(curInstr);tw(0,k=>{t.grp.rotation.z=Math.sin(k*Math.PI*3)*.12*(1-k)},.5);return}
   dragTool=t;t.dragging=true;draggingOnPet=false;
   setPtr(e);ray.setFromCamera(ptr,camera);
   dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0,1).applyQuaternion(camera.quaternion),t.grp.position);
   const hit=new THREE.Vector3();ray.ray.intersectPlane(dragPlane,hit);dragOff.copy(t.grp.position).sub(hit);
   twScale(t.grp,1.18,.15);sfx('tick');updateRing();
   try{cvs.setPointerCapture(e.pointerId)}catch(_){}
   return}
  // מצב ליטוף: כל מגע שלא על כלי - המרחק נצבר רק כשהאצבע עוברת על רקס
  draggingOnPet=true;lastPet={x:e.clientX,y:e.clientY};
  if(pickRex(e))tw(0,k=>{const s=1+Math.sin(k*Math.PI)*.05;headG.scale.set(s,s,s)},.3); // משוב מגע עדין
  try{cvs.setPointerCapture(e.pointerId)}catch(_){}});
 cvs.addEventListener('pointermove',e=>{
  if(dragTool){setPtr(e);ray.setFromCamera(ptr,camera);
   const hit=new THREE.Vector3();
   if(ray.ray.intersectPlane(dragPlane,hit)){hit.add(dragOff);
    hit.x=Math.max(-2.4,Math.min(2.4,hit.x));hit.y=Math.max(.5,Math.min(3,hit.y));hit.z=Math.max(-1.5,Math.min(2.6,hit.z));
    dragTool.grp.position.lerp(hit,.55);
    dragTool.grp.rotation.z=(Math.random()-.5)*.02}}
  else if(draggingOnPet&&lastPet){
   const d=Math.hypot(e.clientX-lastPet.x,e.clientY-lastPet.y);lastPet={x:e.clientX,y:e.clientY};
   const hitRex=pickRex(e);
   if(!hitRex)return;
   petDist+=d;
   if(petDist>55){petDist=0;floaty('💛');sfx('tick');
    tailWagBoost=1;
    if(STAGES[stage]==='pet'){pets++;
     if(pets===1)vetSpeak('אחת');
     else if(pets===2)vetSpeak('שתיים');
     else if(pets>=3){draggingOnPet=false;
      vetSpeak('שלוש! רקס רגוע ומוכן לבדיקה');
      setTimeout(()=>gotoStage(1),700)}}}}});
 function pxDist(e,wp){const r=renderer.domElement.getBoundingClientRect();const p=wp.clone().project(camera);
  const px=r.left+(p.x+1)/2*r.width,py=r.top+(1-p.y)/2*r.height;return Math.hypot(e.clientX-px,e.clientY-py)}
 function endDrag(e){
  if(dragTool){const t=dragTool;dragTool=null;t.dragging=false;twScale(t.grp,1,.2);
   const s=STAGES[stage];let ok=false,targetPos=null;
   if(s==='stetho'&&t===tools.stetho){targetPos=worldPos(body).add(new THREE.Vector3(-.1,.12,.42));ok=pxDist(e,targetPos)<150}
   else if(s==='thermo'&&t===tools.thermo){targetPos=worldPos(headG).add(new THREE.Vector3(0,.15,.28));ok=pxDist(e,targetPos)<160}
   else if(s==='bandage'&&t===tools.bandage){targetPos=worldPos(scratch);ok=pxDist(e,targetPos)<160}
   else if(s==='bone'&&t===tools.bone){targetPos=worldPos(bowlG).add(new THREE.Vector3(0,.3,0));ok=pxDist(e,targetPos)<160}
   if(ok)dropSuccess(t,s,targetPos);
   else{vetSpeak('זה לא המקום. גררי למעגל הזוהר');toast('זה לא המקום. גררי למעגל הזוהר');
    twPos(t.grp,t.home,.5,k=>1-Math.pow(1-k,4))}
  }
  draggingOnPet=false;lastPet=null}
 cvs.addEventListener('pointerup',endDrag);
 cvs.addEventListener('pointercancel',endDrag);

 function dropSuccess(t,s,targetPos){
  sparkleBurst(targetPos,14);sfx('sparkle');
  if(s==='stetho'){
   twPos(t.grp,targetPos,.35,null,()=>{
    heartbeat();const hb=setInterval(heartbeat,650);
    let n=0;const beat=setInterval(()=>{twScale(headG,1.03,.12,()=>twScale(headG,1,.15));if(++n>3)clearInterval(beat)},650);
    vetSpeak('שומעים את הלב! הוא פועם חזק');
    setTimeout(()=>{clearInterval(hb);twPos(t.grp,t.home,.5,null,()=>gotoStage(2))},1600)})}
  else if(s==='thermo'){
   twPos(t.grp,targetPos,.35,null,()=>{
    curInstr='בודקים את החום...';instrTxt.textContent=curInstr;
    setTimeout(()=>{sfx('good');vetSpeak('החום בסדר גמור!');
     twPos(t.grp,t.home,.5);setTimeout(()=>gotoStage(3),900)},1300)})}
  else if(s==='bandage'){
   twPos(t.grp,targetPos,.3,null,()=>{
    t.grp.visible=false;plaster.visible=true;scratch.visible=false;
    sparkleBurst(worldPos(plaster),10);
    vetSpeak('הפלסטר על השריטה! כבר יהיה טוב');
    setTimeout(()=>gotoStage(4),800)})}
  else if(s==='bone'){
   twPos(t.grp,targetPos,.4,null,()=>{
    t.grp.visible=false;ball(.16,'#f9db96',0,.22,0,bowlG,1,.6,1);
    chomp();setTimeout(chomp,500);tailWagBoost=2;
    tw(0,k=>{headG.rotation.x=.35*Math.abs(Math.sin(k*Math.PI*3))},1.4,null,()=>{headG.rotation.x=0});
    vetSpeak('טעים! רקס אוהב את העצם');
    setTimeout(()=>finish(),900)})}}

 function finish(){finished=true;stage=5;hideRings();setPaws(5);updateTools();updateLook();
  twPos(rex,new THREE.Vector3(0,1.35,-.15),.28,k=>1-Math.pow(1-k,3),()=>twPos(rex,new THREE.Vector3(0,1.13,-.15),.35));
  yip();setTimeout(yip,350);tailWagBoost=3;
  sparkleBurst(worldPos(headG),18);confettiBurst(16);
  // שמירת ההתקדמות דרך STATE/saveState המשותפים - כך שמירה רגילה של האפליקציה (השתקה, פעילות קלאסית) לא דורסת את הביקורים
  try{const raw=JSON.parse(localStorage.getItem(LS_KEY))||{};
   const cur=Math.max((raw.vet3d&&raw.vet3d.visits)||0,(STATE.vet3d&&STATE.vet3d.visits)||0);
   STATE.vet3d=Object.assign({},raw.vet3d,STATE.vet3d,{visits:cur+1});saveState()}catch(e){}
  sayStageInstr('רקס מרגיש הרבה יותר טוב!','רקס מרגיש הרבה יותר טוב! כל הכבוד רונה!');
  const again=el('button','big-btn vet3d-again','<svg viewBox="0 0 100 100" width="1em" height="1em" style="display:inline-block;vertical-align:-2px"><g fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"><path d="M78 50 a28 28 0 1 1 -10 -21"/><path d="M71 11 v20 h-20"/></g></svg> שחקי שוב');
  again.onclick=()=>{cleanup();root.innerHTML='';startVet3DInto(root)};
  instrBox.appendChild(again)}

 // פרטים זעירים של חיים: אבק מרחף
 const dustG=new THREE.BufferGeometry();const dustN=40;const dustPos=new Float32Array(dustN*3);
 for(let i=0;i<dustN;i++){dustPos[i*3]=(Math.random()-.5)*9;dustPos[i*3+1]=.5+Math.random()*4;dustPos[i*3+2]=-3+Math.random()*6}
 dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
 const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:'#ffffff',size:.05,transparent:true,opacity:.5}));
 dust.raycast=()=>{};scene.add(dust);

 // לולאת אנימציה
 let raf=0,tailWagBoost=0,blinkT=2,earT=4;
 const clock=new THREE.Clock();let parX=0,parY=0;
 function onPar(e){parX=(e.clientX/innerWidth-.5);parY=(e.clientY/innerHeight-.5)}
 addEventListener('pointermove',onPar);
 function anim(){
  if(dead)return;raf=requestAnimationFrame(anim);
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  // נשימה
  const br=1+Math.sin(t*2.2)*.02;bodyG.scale.set(br,1+Math.sin(t*2.2)*.028,br);
  headG.position.y=1.22+Math.sin(t*2.2)*.012;
  // מצמוץ
  blinkT-=dt;if(blinkT<0){blinkT=2.4+Math.random()*2.5;
   tw(0,k=>{const down=k<.5?k*2:(1-k)*2;eyeL.scale.y=eyeR.scale.y=Math.max(.08,1-down*.92)},.22)}
  // זנב
  tailWagBoost=Math.max(0,tailWagBoost-dt*.4);
  tail.rotation.y=.3+Math.sin(t*(2.5+tailWagBoost*7))*(.25+tailWagBoost*.25);
  // אוזניים
  earT-=dt;if(earT<0){earT=3+Math.random()*4;
   const e=Math.random()<.5?earL:earR;tw(0,k=>{e.rotation.z=(e===earL?1.05:-1.05)+Math.sin(k*Math.PI)*.2},.4)}
  // כלי פעיל קופץ בקלות + חץ מונפש מעליו
  toolDefs.forEach(d=>{const tl=tools[d.id];
   if(tl.active&&!tl.dragging&&tl.grp.visible){tl.grp.position.y=tl.home.y+Math.sin(t*3.2)*.045;
    const p=1+Math.sin(t*3.2)*.03;tl.grp.scale.set(p,p,p)}
   tl.arrow.visible=tl.active&&!tl.dragging&&tl.grp.visible;
   if(tl.arrow.visible){tl.arrow.position.y=.62+Math.sin(t*3.2)*.06;tl.arrow.lookAt(camera.position)}});
  // יד הליטוף: מחליקה מצד לצד על גופו של רקס כל עוד אנחנו בשלב הליטוף
  handHint.visible=!finished&&STAGES[stage]==='pet';
  if(handHint.visible){const hx=Math.sin(t*2.4)*.5;
   handHint.position.set(hx,1.78+Math.sin(t*4.8)*.03,.55);
   handHint.material.rotation=Math.sin(t*2.4)*.28;
   handHint.material.opacity=.75+Math.abs(Math.sin(t*2.4))*.25}
  // טבעות פועמות
  Object.values(rings).forEach(r=>{if(r.visible){const p=(r.userData.base||1)*(1+Math.sin(t*4)*.13);r.scale.set(p,p,p)}});
  toolDefs.forEach(d=>{const h=tools[d.id].halo;if(h.visible){const p=1+Math.sin(t*3.2)*.18;h.scale.set(p,p,p);h.material.opacity=.45+Math.sin(t*3.2)*.25}});
  // ניצוצות
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.life-=dt*1.3;
   s.m.position.addScaledVector(s.v,dt);s.v.y-=dt*2.2;s.m.scale.multiplyScalar(1-dt*1.1);
   if(s.life<=0){scene.remove(s.m);sparks.splice(i,1)}}
  // אבק
  const dp=dust.geometry.attributes.position;
  for(let i=0;i<dustN;i++){dp.array[i*3+1]+=dt*.06;if(dp.array[i*3+1]>4.6)dp.array[i*3+1]=.4}
  dp.needsUpdate=true;
  // טווינים
  for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;const k=Math.min(1,w.t/w.dur);
   w.set(w.ease(k));if(k>=1){tweens.splice(i,1);if(w.done)w.done()}}
  // מצלמה: מוקד משתנה לפי שלב + נדנוד עדין + פרלקסה
  lookCur.lerp(lookTarget,Math.min(1,dt*3.5));
  camera.position.x=camBase.x+Math.sin(t*.4)*.06+parX*parF;
  camera.position.y=camBase.y+Math.sin(t*.53)*.04-parY*parF*.55;
  camera.lookAt(lookCur);
  renderer.render(scene,camera)}
 anim();

 function onResize(){if(!root.isConnected)return;renderer.setSize(W(),H());fitCam()}
 addEventListener('resize',onResize);

 function cleanup(){dead=true;spkEpoch++;cancelAnimationFrame(raf);removeEventListener('resize',onResize);
  removeEventListener('pointermove',onPar);
  hideRings();try{renderer.dispose()}catch(e){}
  try{renderer.forceContextLoss&&renderer.forceContextLoss()}catch(e){}
  if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement)}
 root._cleanup3d=cleanup;
 root._vet3d={tools,rings,rex,headG,body,scratch,bowlG,camera,renderer,THREE,STAGES,getStage:()=>stage};

 // פתיחה
 gotoStage(0);
 return cleanup;
}
function startVet3DInto(root){const c=startVet3D(root);window.__scene3dCleanup=c||null}
