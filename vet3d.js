// ביקור תלת-ממדי אצל הוטרינרית - סצנת WebGL אמיתית (Three.js) עם גרירת חפצים למקומם.
// נכנס דרך startVet3D(container) ומחזיר פונקציית ניקוי. מסתמך על speak/sfx/tone/noise/ac/floaty/confettiBurst/el מ-app.js
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
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
 renderer.domElement.className='vet3d-canvas';
 root.appendChild(renderer.domElement);

 const scene=new THREE.Scene();
 scene.background=new THREE.Color('#a9e2cb');
 scene.fog=new THREE.Fog('#a9e2cb',14,30);

 const camera=new THREE.PerspectiveCamera(40,W()/H(),.1,60);
 const camBase=new THREE.Vector3(0,2.45,6.2),camLook=new THREE.Vector3(0,1.35,0);
 function fitCam(){const a=W()/H();
  if(a<.75){camBase.set(0,2.7,8.6);camera.fov=48}
  else if(a<1.1){camBase.set(0,2.55,7.4);camera.fov=44}
  else{camBase.set(0,2.45,6.2);camera.fov=40}
  camera.aspect=a;camera.updateProjectionMatrix()}
 fitCam();
 camera.position.copy(camBase);camera.lookAt(camLook);

 // תאורה: שמש חמה + מילוי רך
 const hemi=new THREE.HemisphereLight('#fff7ea','#d9b8a0',.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff1da',1.3);
 sun.position.set(3.6,6.5,4.2);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;
 sun.shadow.camera.top=7;sun.shadow.camera.bottom=-3;sun.shadow.camera.far=20;sun.shadow.bias=-.0004;
 scene.add(sun);
 const fill=new THREE.DirectionalLight('#cfe4ff',.28);fill.position.set(-4.5,3,2.5);scene.add(fill);

 function mat(c,r){return new THREE.MeshStandardMaterial({color:c,roughness:r==null?.85:r,metalness:0})}
 function box(w,h,d,c,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}
 function ball(r,c,x,y,z,parent,sx,sy,sz){const m=new THREE.Mesh(new THREE.SphereGeometry(r,28,22),mat(c));
  m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}
 function cyl(rt,rb,h,c,x,y,z,parent,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||24),mat(c));
  m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}

 // --- החדר ---
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,26),mat('#d99a58',.95));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const wallB=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#f5d9b8',.95));
 wallB.position.set(0,5,-4.4);wallB.receiveShadow=true;scene.add(wallB);
 const wallL=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#d2eedd',.95));
 wallL.rotation.y=Math.PI/2;wallL.position.set(-6.5,5,0);wallL.receiveShadow=true;scene.add(wallL);
 const wallR=new THREE.Mesh(new THREE.PlaneGeometry(26,10),mat('#d2eedd',.95));
 wallR.rotation.y=-Math.PI/2;wallR.position.set(6.5,5,0);wallR.receiveShadow=true;scene.add(wallR);
 box(26,.22,.12,'#ffffff',0,.11,-4.34); // פנל תחתון
 const rug=cyl(2.3,2.3,.03,'#ff9fbd',0,.015,1.3,scene,40);rug.receiveShadow=true;
 cyl(1.7,1.7,.032,'#ffc2d8',0,.016,1.3,scene,40);

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
 box(2.45,.14,1.4,'#6ec3e8',0,1.06,0); // כרית
 box(2.2,.85,1.1,'#e8eef5',0,.47,0); // ארון
 box(.5,.06,.06,'#9fb2c2',-.5,.55,.58);box(.5,.06,.06,'#9fb2c2',.5,.55,.58); // ידיות
 // מגש הכלים
 const trayY=.78;
 box(3.4,.1,.85,'#ffffff',0,trayY-.05,2.05);
 box(3.2,.05,.7,'#ffb9d4',0,trayY+.01,2.05);
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

 // קערת האוכל על הרצפה
 const bowlG=new THREE.Group();bowlG.position.set(1.55,0,1.35);scene.add(bowlG);
 const bowlProf=[];for(let i=0;i<=8;i++){const t=i/8;bowlProf.push(new THREE.Vector2(.12+.3*Math.sin(t*1.45),.3*t))}
 const bowl=new THREE.Mesh(new THREE.LatheGeometry(bowlProf,26),mat('#e0556e',.6));
 bowl.castShadow=bowl.receiveShadow=true;bowlG.add(bowl);
 ball(.26,'#b5825a',0,.1,0,bowlG,1,.35,1); // מזון

 // --- הכלים על המגש ---
 function boneMesh(){const g=new THREE.Group();const c=mat('#fff8ec',.6);
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
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.055,14,10),mat('#e05555',.35));bulb.position.y=-.19;bulb.castShadow=true;g.add(bulb);
  const line=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.2,8),mat('#e05555',.4));line.position.y=.05;g.add(line);
  return g}
 function bandageMesh(){const g=new THREE.Group();
  const roll=new THREE.Mesh(new THREE.TorusGeometry(.09,.05,14,22),mat('#f0c28a',.7));roll.rotation.x=Math.PI/2;roll.castShadow=true;g.add(roll);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.24,.02,.1),mat('#f0c28a',.7));strip.position.set(.18,-.04,0);strip.castShadow=true;g.add(strip);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(.1,.024,.06),mat('#f7b98d',.7));pad.position.set(.14,-.03,0);g.add(pad);
  return g}
 function iconTexture(kind){const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.fillStyle='#fff';g.beginPath();g.arc(64,64,58,0,7);g.fill();g.lineWidth=7;g.strokeStyle='#e3d7fa';g.stroke();
  g.fillStyle='#5b3d99';
  if(kind==='heart'){g.fillStyle='#e0556e';g.beginPath();g.moveTo(64,96);g.bezierCurveTo(18,62,36,18,64,42);g.bezierCurveTo(92,18,110,62,64,96);g.fill()}
  else if(kind==='temp'){g.fillStyle='#e05555';g.fillRect(58,30,12,52);g.beginPath();g.arc(64,88,15,0,7);g.fill();g.strokeStyle='#e05555';g.lineWidth=5;g.strokeRect(52,24,24,64)}
  else if(kind==='band'){g.fillStyle='#ffd9a8';g.save();g.translate(64,64);g.rotate(-.5);g.fillRect(-38,-14,76,28);g.fillStyle='#e0a06a';g.fillRect(-10,-14,20,28);g.restore()}
  else{g.fillStyle='#c9a0e8';g.fillRect(46,52,36,24);[[40,46],[40,82],[88,46],[88,82]].forEach(p=>{g.beginPath();g.arc(p[0],p[1],13,0,7);g.fill()})}
  return new THREE.CanvasTexture(cv)}

 const tools={};
 const toolDefs=[
  {id:'stetho',x:-1.2,mk:stethoMesh,icon:'heart',name:'סטטוסקופ'},
  {id:'thermo',x:-.4,mk:thermoMesh,icon:'temp',name:'מדחום'},
  {id:'bandage',x:.4,mk:bandageMesh,icon:'band',name:'פלסטר'},
  {id:'bone',x:1.2,mk:boneMesh,icon:'bone',name:'עצם'}];
 const pedCols=['#63b8e8','#ff9d9d','#ffcf6e','#9fdd7a'];
 toolDefs.forEach((d,di)=>{
  const ped=cyl(.26,.3,.09,pedCols[di],d.x,trayY+.09,2.05);
  const grp=new THREE.Group();grp.position.set(d.x,trayY+.32,2.05);scene.add(grp);
  const m=d.mk();grp.add(m);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshBasicMaterial({visible:false}));grp.add(proxy);
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),new THREE.MeshBasicMaterial({map:iconTexture(d.icon),transparent:true}));
  tag.position.set(0,.42,-.12);tag.raycast=()=>{};grp.add(tag);
  grp.traverse(o=>{if(o.isMesh)o.userData.toolId=d.id});
  tools[d.id]={grp,home:grp.position.clone(),active:false,dragging:false,icon:tag}});

 // טבעות מטרה זוהרות
 function targetRing(){const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,10,32),
  new THREE.MeshBasicMaterial({color:'#ffbf00',transparent:true,opacity:1,depthTest:false}));
  r.renderOrder=5;r.visible=false;r.userData.base=1;r.raycast=()=>{};scene.add(r);return r}
 const rings={heart:targetRing(),head:targetRing(),scratch:targetRing(),bowl:targetRing()};
 function ringAt(ring,pos,faceCam){ring.position.copy(pos);ring.visible=true;
  if(faceCam)ring.lookAt(camera.position);else ring.rotation.x=-Math.PI/2}
 function hideRings(){Object.values(rings).forEach(r=>r.visible=false)}
 function worldPos(obj){const v=new THREE.Vector3();obj.getWorldPosition(v);return v}

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
 const hud=el('div','vet3d-hud');
 const instrBox=el('div','instr vet3d-instr','<span></span>');
 const instrTxt=instrBox.querySelector('span');
 const rep=el('button','','🔊');rep.setAttribute('aria-label','שמע שוב');instrBox.appendChild(rep);
 const paws=el('div','vet3d-paws');
 for(let i=0;i<5;i++)paws.appendChild(el('span','paw','🐾'));
 hud.appendChild(paws);hud.appendChild(instrBox);root.appendChild(hud);
 let curInstr='';
 function setInstr(t,sayIt){curInstr=t;instrTxt.textContent=t;if(sayIt!==false)speak(t)}
 rep.onclick=()=>{if(curInstr)speak(curInstr)};
 function setPaws(n){[...paws.children].forEach((p,i)=>p.classList.toggle('on',i<n))}

 // --- מצב המשחק ---
 const STAGES=['pet','stetho','thermo','bandage','bone','done'];
 let stage=0,pets=0,finished=false;
 const stageInstr={
  pet:'רקס הכלבלב נשרט במשחק. קודם נלטף אותו כדי שירגע',
  stetho:'גררי את הסטטוסקופ אל הלב של רקס',
  thermo:'עכשיו גררי את המדחום אל המצח של רקס',
  bandage:'גררי את הפלסטר אל השריטה',
  bone:'רקס רעב אחרי הטיפול! גררי את העצם אל הקערה'};
 function activeToolId(){const s=STAGES[stage];return(s==='stetho'||s==='thermo'||s==='bandage'||s==='bone')?s:null}
 function updateTools(){toolDefs.forEach(d=>{const t=tools[d.id],on=d.id===activeToolId();
  t.active=on;
  t.grp.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=on?1:.45}})})}
 function updateRing(){hideRings();const s=STAGES[stage];
  if(s==='stetho')ringAt(rings.heart,worldPos(body).add(new THREE.Vector3(-.1,.15,.45)),true);
  else if(s==='thermo')ringAt(rings.head,worldPos(headG).add(new THREE.Vector3(0,.32,.2)),true);
  else if(s==='bandage')ringAt(rings.scratch,worldPos(scratch).add(new THREE.Vector3(-.06,0,.12)),true);
  else if(s==='bone'){ringAt(rings.bowl,worldPos(bowlG).add(new THREE.Vector3(0,.42,0)),false);rings.bowl.userData.base=1.4}
  else rings.bowl.userData.base=1}
 function gotoStage(i){stage=i;setPaws(Math.min(i,5));updateTools();updateRing();
  const s=STAGES[stage];if(stageInstr[s])setInstr(stageInstr[s])}

 // גרירה
 const ray=new THREE.Raycaster(),ptr=new THREE.Vector2(),dragPlane=new THREE.Plane(),dragOff=new THREE.Vector3();
 let dragTool=null,draggingOnPet=false,lastPet=null,petDist=0;
 const tmpV=new THREE.Vector3();
 function setPtr(e){const r=renderer.domElement.getBoundingClientRect();
  ptr.x=((e.clientX-r.left)/r.width)*2-1;ptr.y=-((e.clientY-r.top)/r.height)*2+1}
 function screenDist(a,b){const pa=a.clone().project(camera),pb=b.clone().project(camera);
  const r=renderer.domElement.getBoundingClientRect();
  const dx=(pa.x-pb.x)*r.width/2,dy=(pa.y-pb.y)*r.height/2;return Math.hypot(dx,dy)}
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
   if(!t.active){sfx('tick');speak(curInstr);tw(0,k=>{t.grp.rotation.z=Math.sin(k*Math.PI*3)*.12*(1-k)},.5);return}
   dragTool=t;t.dragging=true;draggingOnPet=false;
   setPtr(e);ray.setFromCamera(ptr,camera);
   dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0,1).applyQuaternion(camera.quaternion),t.grp.position);
   const hit=new THREE.Vector3();ray.ray.intersectPlane(dragPlane,hit);dragOff.copy(t.grp.position).sub(hit);
   twScale(t.grp,1.18,.15);sfx('tick');updateRing();
   try{cvs.setPointerCapture(e.pointerId)}catch(_){}
   return}
  // מצב ליטוף: כל מגע שלא על כלי - המרחק נצבר רק כשהאצבע עוברת על רקס
  draggingOnPet=true;lastPet={x:e.clientX,y:e.clientY};
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
     if(pets===1)speak('אחת');
     else if(pets===2)speak('שתיים');
     else if(pets>=3){draggingOnPet=false;
      speak('שלוש! רקס רגוע ומוכן לבדיקה',()=>gotoStage(1))}}}}});
 function pxDist(e,wp){const r=renderer.domElement.getBoundingClientRect();const p=wp.clone().project(camera);
  const px=r.left+(p.x+1)/2*r.width,py=r.top+(1-p.y)/2*r.height;return Math.hypot(e.clientX-px,e.clientY-py)}
 function endDrag(e){
  if(dragTool){const t=dragTool;dragTool=null;t.dragging=false;twScale(t.grp,1,.2);
   const s=STAGES[stage];let ok=false,targetPos=null;
   if(s==='stetho'&&t===tools.stetho){targetPos=worldPos(body).add(new THREE.Vector3(-.1,.12,.42));ok=pxDist(e,targetPos)<150}
   else if(s==='thermo'&&t===tools.thermo){targetPos=worldPos(headG).add(new THREE.Vector3(.05,.3,.28));ok=pxDist(e,targetPos)<150}
   else if(s==='bandage'&&t===tools.bandage){targetPos=worldPos(scratch);ok=pxDist(e,targetPos)<160}
   else if(s==='bone'&&t===tools.bone){targetPos=worldPos(bowlG).add(new THREE.Vector3(0,.3,0));ok=pxDist(e,targetPos)<160}
   if(ok)dropSuccess(t,s,targetPos);
   else{sayHint('זה לא המקום. גררי למעגל הזוהר');
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
    speak('שומעים את הלב! הוא פועם חזק',()=>{clearInterval(hb);
     twPos(t.grp,t.home,.5,null,()=>gotoStage(2))});
    let n=0;const beat=setInterval(()=>{twScale(headG,1.03,.12,()=>twScale(headG,1,.15));if(++n>5)clearInterval(beat)},650)})}
  else if(s==='thermo'){
   twPos(t.grp,targetPos,.35,null,()=>{
    setInstr('בודקים את החום...');
    setTimeout(()=>{sfx('good');speak('החום בסדר גמור!',()=>{twPos(t.grp,t.home,.5,null,()=>gotoStage(3))})},1400)})}
  else if(s==='bandage'){
   twPos(t.grp,targetPos,.3,null,()=>{
    t.grp.visible=false;plaster.visible=true;scratch.visible=false;
    sparkleBurst(worldPos(plaster),10);
    speak('הפלסטר על השריטה! כבר יהיה טוב',()=>gotoStage(4))})}
  else if(s==='bone'){
   twPos(t.grp,targetPos,.4,null,()=>{
    t.grp.visible=false;ball(.16,'#fff8ec',0,.22,0,bowlG,1,.6,1);
    chomp();setTimeout(chomp,500);tailWagBoost=2;
    tw(0,k=>{headG.rotation.x=.35*Math.abs(Math.sin(k*Math.PI*3))},1.4,null,()=>{headG.rotation.x=0});
    speak('טעים! רקס אוהב את העצם',()=>finish())})}}

 function finish(){finished=true;stage=5;hideRings();setPaws(5);
  twPos(rex,new THREE.Vector3(0,1.35,-.15),.28,k=>1-Math.pow(1-k,3),()=>twPos(rex,new THREE.Vector3(0,1.13,-.15),.35));
  yip();setTimeout(yip,350);tailWagBoost=3;
  sparkleBurst(worldPos(headG),18);confettiBurst(16);
  speak('רקס מרגיש הרבה יותר טוב! כל הכבוד רונה!');
  try{const s=JSON.parse(localStorage.getItem('ronaRoleplay.v1'))||{};s.vet3d={visits:((s.vet3d||{}).visits||0)+1};localStorage.setItem('ronaRoleplay.v1',JSON.stringify(s))}catch(e){}
  setInstr('רקס מרגיש הרבה יותר טוב!',false);
  const again=el('button','big-btn vet3d-again','🔁 שחקי שוב');
  again.onclick=()=>{cleanup();root.innerHTML='';startVet3DInto(root)};
  hud.appendChild(again)}

 // פרטים זעירים של חיים: אבק מרחף
 const dustG=new THREE.BufferGeometry();const dustN=40;const dustPos=new Float32Array(dustN*3);
 for(let i=0;i<dustN;i++){dustPos[i*3]=(Math.random()-.5)*9;dustPos[i*3+1]=.5+Math.random()*4;dustPos[i*3+2]=-3+Math.random()*6}
 dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
 const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:'#ffffff',size:.05,transparent:true,opacity:.5}));
 dust.raycast=()=>{};scene.add(dust);

 // לולאת אנימציה
 let raf=0,tailWagBoost=0,blinkT=2,earT=4,dead=false;
 const clock=new THREE.Clock();let parX=0,parY=0;
 addEventListener('pointermove',e=>{parX=(e.clientX/innerWidth-.5);parY=(e.clientY/innerHeight-.5)});
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
  // כלי פעיל קופץ בקלות
  toolDefs.forEach(d=>{const tl=tools[d.id];
   if(tl.active&&!tl.dragging&&tl.grp.visible){tl.grp.position.y=tl.home.y+Math.sin(t*3.2)*.045;
    const p=1+Math.sin(t*3.2)*.03;tl.grp.scale.set(p,p,p)}});
  // טבעות פועמות
  Object.values(rings).forEach(r=>{if(r.visible){const p=(r.userData.base||1)*(1+Math.sin(t*4)*.13);r.scale.set(p,p,p);r.material.opacity=.65+Math.sin(t*4)*.3}});
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
  // מצלמה: נדנוד עדין + פרלקסה
  camera.position.x=camBase.x+Math.sin(t*.4)*.06+parX*.55;
  camera.position.y=camBase.y+Math.sin(t*.53)*.04-parY*.3;
  camera.lookAt(camLook);
  renderer.render(scene,camera)}
 anim();

 function onResize(){if(!root.isConnected)return;renderer.setSize(W(),H());fitCam()}
 addEventListener('resize',onResize);

 function cleanup(){dead=true;cancelAnimationFrame(raf);removeEventListener('resize',onResize);
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
