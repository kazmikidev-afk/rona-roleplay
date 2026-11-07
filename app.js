// עולם התפקידים של רונה — מנוע ראשי
const LS_KEY='ronaRoleplay.v1';
let STATE={unlocked:{},done:{},badges:{},choices:{},fresh:{},muted:false};
function loadState(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s)STATE=Object.assign(STATE,s)}catch(e){}}
function saveState(){try{const prev=JSON.parse(localStorage.getItem(LS_KEY));
 // שומרים גם שדות לא מוכרים שנכתבו לאחסון (למשל vet3d.visits או סצנות עתידיות) - אחרת שמירה רגילה דורסת אותם
 localStorage.setItem(LS_KEY,JSON.stringify(prev&&typeof prev==='object'&&!Array.isArray(prev)?Object.assign({},prev,STATE):STATE))}catch(e){}}
loadState();

// --- מסלול תלת-ממד נפרד (החלטת מורה 7.11): ביקורים פותחים רמות תלת-ממד חדשות בלבד ---
// לא נוגע ב-done/badges/unlocked הקלאסיים. מבנה: STATE[role+'3d']={visits,stars,lvl}
window.prog3d={
 get(role){const p=(typeof STATE!=='undefined'&&STATE[role+'3d'])||null;return p?{visits:p.visits||0,stars:p.stars||0,lvl:p.lvl||1}:{visits:0,stars:0,lvl:1}},
 completeVisit(role){
  const key=role+'3d';const p=window.prog3d.get(role);
  p.visits++;p.stars++;
  const NL=(ROLES.find(r=>r.id===role)||{levels:[1]}).levels.length;
  let newLevel=false;
  if(p.lvl<NL){p.lvl++;newLevel=true}
  STATE[key]={visits:p.visits,stars:p.stars,lvl:p.lvl};saveState();
  return {visits:p.visits,stars:p.stars,lvl:p.lvl,newLevel}}
};
// מיגרציה: אם רמה סוימה לפני שנוספו רמות חדשות, פותחים את הבאה אוטומטית
function normalizeState(){if(typeof ROLES==='undefined')return;ROLES.forEach(r=>{const NL=r.levels.length;let u=STATE.unlocked[r.id]||1;
 while(u<NL&&(STATE.done[r.id]||{})[u]&&r.levels[u-1].every((_,i)=>STATE.done[r.id][u][i]))u++;
 STATE.unlocked[r.id]=u});saveState()}
normalizeState();

// --- קול והקראה ---
let heVoice=null;
function pickVoice(){const vs=speechSynthesis.getVoices();heVoice=vs.find(v=>v.lang&&v.lang.startsWith('he'))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
// הקראה: מנגנים קובץ קול מוכן מראש (voice-manifest.js), וכך ההוראות נשמעות בכל מכשיר -
// גם כשלדפדפן אין קול עברי מובנה. אם חסרה הקלטה, נופלים חזרה לקול הדפדפן.
// then מופעל כשהמשפט (או רצף המשפטים) נגמר, או אחרי זמן בטיחות, כדי שהמעבר למסך הבא לא יקטע את המשפט באמצע
// נגן אחד משותף: אחרי שהמקש הראשון של הילדה פותח את הניגון, גם קטעים רצופים
// (שמגיעים בלי מגע נוסף, למשל שורת תג + "רמה נפתחה") ממשיכים להתנגן באותו נגן
let player=null;
function stopSpeak(){if('speechSynthesis' in window)try{speechSynthesis.cancel()}catch(e){}
 if(player){try{player.pause()}catch(e){}}}
function ttsSay(t,go){if(!('speechSynthesis' in window)){if(go)setTimeout(go,500);return}
 try{speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(t);u.lang='he-IL';if(heVoice)u.voice=heVoice;u.rate=.95;u.pitch=1.05;
 if(go){u.onend=go;u.onerror=go;setTimeout(go,Math.min(9000,1400+t.length*170))}
 speechSynthesis.speak(u)}catch(e){if(go)go()}}
function speak(t,then){const go=then?once(then):null;stopSpeak();
 if(STATE.muted){if(go)setTimeout(go,500);return}
 const segs=[].concat(t).filter(s=>s);if(!segs.length){if(go)setTimeout(go,300);return}
 const playAt=i=>{if(i>=segs.length){if(go)go();return}
  const s=segs[i],nxt=once(()=>playAt(i+1)),src=(typeof VOICE_CLIPS!=='undefined')&&VOICE_CLIPS[s];
  if(!src){ttsSay(s,nxt);return}
  if(!player)player=new Audio();
  const a=player;let tm=null;
  const fin=()=>{if(tm){clearTimeout(tm);tm=null};nxt()};
  a.onended=fin;
  a.onerror=()=>{if(tm){clearTimeout(tm);tm=null};ttsSay(s,nxt)};
  const kick=()=>{if(!tm)tm=setTimeout(fin,Math.min(12000,1600+s.length*200))};
  a.src=src;
  let pr=null;try{pr=a.play()}catch(e){}
  if(pr&&pr.then){pr.then(kick).catch(err=>{if(tm){clearTimeout(tm);tm=null}
   // חסימת autoplay לפני המגע הראשון (ברכת הפתיחה): מדלגים על המשפט והזרימה ממשיכה -
   // כך שהחסימה הראשונה לא תקועה ולא מונעת את ההוראות שיבואו אחרי המקש הראשון
   if(err&&err.name==='NotAllowedError')nxt();else ttsSay(s,nxt)})}
  else kick()};
 playAt(0)}
// רמז לילדה: גם בקול וגם על המסך (למקרה שאין קול עברי במכשיר)
function sayHint(t){speak(t);if(t)toast(t)}
let AC=null;function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type,g,when){if(STATE.muted)return;try{const c=ac(),o=c.createOscillator(),v=c.createGain();o.type=type||'sine';o.frequency.value=f;
 v.gain.setValueAtTime(g||.12,c.currentTime+(when||0));v.gain.exponentialRampToValueAtTime(.001,c.currentTime+(when||0)+d);
 o.connect(v);v.connect(c.destination);o.start(c.currentTime+(when||0));o.stop(c.currentTime+(when||0)+d)}catch(e){}}
function noise(d,g){if(STATE.muted)return;try{const c=ac(),b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),ch=b.getChannelData(0);
 for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);
 const s=c.createBufferSource(),v=c.createGain();s.buffer=b;v.gain.value=g||.15;s.connect(v);v.connect(c.destination);s.start()}catch(e){}}
const NOTES=[523,587,659,784];
function sfx(n){if(STATE.muted)return;
 if(n==='tick')tone(660,.07,'square',.06);
 else if(n==='good'){tone(523,.12);tone(784,.18,'sine',.12,.1)}
 else if(n==='oops')tone(220,.22,'sine',.08);
 else if(n==='sparkle'){[523,659,784,1047].forEach((f,i)=>tone(f,.14,'sine',.1,i*.08))}
 else if(n==='applause')noise(1.1,.2);
 else if(n==='chop')noise(.08,.25);
 else if(n.startsWith('note'))tone(NOTES[(+n.slice(4)-1)%4],.3,'triangle',.14)}
function toggleMute(){STATE.muted=!STATE.muted;saveState();document.getElementById('btn-sound').textContent=STATE.muted?'🔇':'🔊';if(STATE.muted)stopSpeak()}

// --- אפקטים ---
function confettiBurst(n){const em=['🎉','⭐','✨','🌟','💛','💜'];for(let i=0;i<n;i++){const s=el('span','confetti',em[i%em.length]);
 s.style.left=(5+Math.random()*90)+'vw';s.style.animationDuration=(1.2+Math.random()*1.4)+'s';s.style.fontSize=(18+Math.random()*20)+'px';
 document.body.appendChild(s);setTimeout(()=>s.remove(),2800)}}
function floaty(e){const s=el('span','float-heart',e);s.style.left=(40+Math.random()*20)+'vw';s.style.top='45vh';document.body.appendChild(s);setTimeout(()=>s.remove(),1500)}
function toast(t){const tt=document.getElementById('toast');tt.textContent=t;tt.classList.remove('hidden');clearTimeout(tt._t);tt._t=setTimeout(()=>tt.classList.add('hidden'),3200)}

// --- ניווט ---
const screenEl=document.getElementById('screen'),backBtn=document.getElementById('btn-back'),titleEl=document.getElementById('top-title');
let navStack=[];
function setTitle(t){titleEl.textContent=t}
function show(fn,title,push=true){if(typeof window.__scene3dCleanup==='function'){try{window.__scene3dCleanup()}catch(e){}window.__scene3dCleanup=null}
 if(push&&show._cur)navStack.push(show._cur);show._cur={fn,title};
 screenEl.innerHTML='';setTitle(title);backBtn.classList.toggle('hidden',navStack.length===0);fn(screenEl);screenEl.scrollTop=0}
function goBack(){const p=navStack.pop();if(p){show._cur=null;show(p.fn,p.title,false)}}
backBtn.onclick=()=>{speak('');goBack()};
document.getElementById('btn-sound').onclick=toggleMute;
document.getElementById('btn-parents').onclick=()=>{sfx('tick');parentGate()};

// --- מסך בית ---
function homeScreen(sc){
 sc.appendChild(el('h1','screen-title','באיזה תפקיד נשחק היום?'));
 sc.appendChild(el('p','screen-sub','בחרי תפקיד, עזרי לדמויות, ואספי תגים!'));
 const grid=el('div','grid-roles');
 ROLES.forEach(r=>{const b=el('button','role-card');b.style.background=r.grad;
  const earned=(STATE.badges[r.id]||[]).filter(Boolean).length;
  b.innerHTML=`<div class="re">${r.emoji}</div><div class="rn">${r.name}</div><div class="rs">${'⭐'.repeat(earned)}${'☆'.repeat(r.levels.length-earned)}</div>`;
  if(r.id==='vet'){b.style.position='relative';b.appendChild(el('div','vet3d-ribbon','✨ תלת-ממד'))}
  b.onclick=()=>{sfx('tick');show(roleScreen.bind(null,r),r.name)};grid.appendChild(b)});
 sc.appendChild(grid);
 const foot=el('div','home-foot');
 const badges=el('button','pill-btn','🏅 התגים שלי');badges.onclick=()=>{sfx('tick');show(badgesScreen,'התגים שלי')};foot.appendChild(badges);
 const inst=el('button','pill-btn primary','📱 הוסף לדף הבית');inst.onclick=installClick;foot.appendChild(inst);
 sc.appendChild(foot);
 sc.appendChild(el('div','footer-note','המשחק עובד גם בלי אינטרנט · הקראה נשמרת במכשיר אחרי שמנגנים אותה פעם ראשונה · ההתקדמות נשמרת במכשיר'));
}

// --- מסך תפקיד: רמות + דמויות ---
function roleScreen(role,sc){
 sc.appendChild(el('h1','screen-title',role.emoji+' '+role.name));
 sc.appendChild(el('p','screen-sub',role.intro));speak(role.intro);
 const unl=STATE.unlocked[role.id]||1;
 const lvlRow=el('div','lvl-row');
 for(let l=1;l<=role.levels.length;l++){const locked=l>unl;
  const isFresh=(STATE.fresh||{})[role.id]===l;
  const b=el('button','lvl-btn'+(locked?' locked':''),`<span>${locked?'🔒':''} רמה ${l}${isFresh?' ✨':''}</span><span>${'⭐'.repeat(l)}</span>`);
  b.onclick=()=>{if(locked){sfx('oops');speak('קודם משלימים את הרמה הקודמת');toast('משלימים קודם את רמה '+(l-1));return}
   if(isFresh){delete STATE.fresh[role.id];saveState()}
   sfx('tick');show(levelScreen.bind(null,role,l),role.name+' · רמה '+l)};lvlRow.appendChild(b)}
 if(role.id==='vet'){const v=(STATE.vet3d2&&STATE.vet3d2.visits)||0; // כניסה רגילה: vet3d2 מחליף את vet3d (ההנדלר/התקדמות של vet3d נשמרים)
  const c3=el('button','vet3d-card','<span class="v3emoji">🐾</span><span class="v3txt">✨ מרפאת חיות תלת-ממדית · רמה '+Math.min((STATE.vet3d2&&STATE.vet3d2.lvl)||1,role.levels.length)+'</span>');
  if(v>0)c3.appendChild(el('span','v3visits','🐾'.repeat(Math.min(v,5))+(v>5?' ×'+v:'')));
  c3.onclick=()=>{sfx('tick');openVet3D2()};sc.appendChild(c3)}
 if(role.id==='chef'){const v=(STATE.chef3d&&STATE.chef3d.visits)||0;
  const c4=el('button','vet3d-card','<span class="v3emoji">🍳</span><span class="v3txt">✨ מטבח תלת-ממדי · רמה '+Math.min((window.prog3d?prog3d.get('chef').lvl:unl),role.levels.length)+'</span>');
  if(v>0)c4.appendChild(el('span','v3visits','🐾'.repeat(Math.min(v,5))+(v>5?' ×'+v:'')));
  c4.onclick=()=>{sfx('tick');openChef3D()};sc.appendChild(c4)}
 if(role.id==='shop'){const v=(STATE.shop3d&&STATE.shop3d.visits)||0;
  const c5=el('button','vet3d-card','<span class="v3emoji">🛒</span><span class="v3txt">✨ חנות תלת-ממדית · רמה '+Math.min((window.prog3d?prog3d.get('shop').lvl:unl),role.levels.length)+'</span>');
  if(v>0)c5.appendChild(el('span','v3visits','🐾'.repeat(Math.min(v,5))+(v>5?' ×'+v:'')));
  c5.onclick=()=>{sfx('tick');openShop3D()};sc.appendChild(c5)}
 if(role.id==='dentist'){const v=(STATE.dentist3d&&STATE.dentist3d.visits)||0;
  const c6=el('button','vet3d-card','<span class="v3emoji">🦷</span><span class="v3txt">✨ מרפאת שיניים בתלת-ממד · רמה '+Math.min((window.prog3d?prog3d.get('dentist').lvl:unl),role.levels.length)+'</span>');
  if(v>0)c6.appendChild(el('span','v3visits','🐾'.repeat(Math.min(v,5))+(v>5?' ×'+v:'')));
  c6.onclick=()=>{sfx('tick');openDentist3D()};sc.appendChild(c6)}
 sc.appendChild(lvlRow);
 const done=(STATE.done[role.id]||{})[unl]||{};
 const doneCount=Object.keys(done).length;
 sc.appendChild(el('p','screen-sub',`ברמה ${unl}: עזרת ל-${doneCount} מתוך ${role.levels[unl-1].length} דמויות`));
 const chars=el('div','char-row');
 role.levels[unl-1].forEach((ch,i)=>{const d=done[i];
  const b=el('button','char-card',`${d?'<span class="done-mark">✔️</span>':''}<div class="ce">${ch.c[0]}</div><div class="cn">${ch.c[1]}</div>`);
  b.onclick=()=>{sfx('tick');runVisit(role,unl,i)};chars.appendChild(b)});
 sc.appendChild(chars);
}
function levelScreen(role,lvl,sc){
 sc.appendChild(el('h1','screen-title',role.emoji+' רמה '+lvl));
 sc.appendChild(el('p','screen-sub','למי נעזור הפעם?'));speak('למי נעזור הפעם? בחרי דמות');
 const done=(STATE.done[role.id]||{})[lvl]||{};
 const chars=el('div','char-row');
 role.levels[lvl-1].forEach((ch,i)=>{const d=done[i];
  const b=el('button','char-card',`${d?'<span class="done-mark">✔️</span>':''}<div class="ce">${ch.c[0]}</div><div class="cn">${ch.c[1]}</div>`);
  b.onclick=()=>{sfx('tick');runVisit(role,lvl,i)};chars.appendChild(b)});
 sc.appendChild(chars);
}

// --- ביקור אצל דמות ---
const INSTR={toolpick:'בחרי מברשת ומשחה כדי לנקות את השיניים',brush:'צחצחי במעגלים קטנים עד שהשיניים מנצנצות',patch:'שימי טלאי קסם צבעוני על הנקודה החולה',wobbly:'געי בעדינות בשן המתנדנדת',snacksort:'מייני: מה טוב לשיניים ומה רק קצת?',story:'בחרי איך הסיפור ממשיך',share:'חלקי לכולם שווה בשווה',dayorder:'סדרי את לוח היום של הגן',simon:'חזרי על התנועות של שיר המעבר',gallery:'תלי כל ציור במסגרת המתאימה',find:'מצאי על המדפים את מה שברשימה',count:'ספרי בקול והכניסי לתיק',change:'החזירי ללקוח את העודף הנכון',shelfsort:'סדרי את הסחורה על המדפים הנכונים',dressup:'בחרי תלבושת ותאורה לבמה',picksong:'בחרי איזה שיר נשיר בהופעה',rhythm:'מקישים כשהאור עובר באזור הזהב!',stetho:'שימי את הסטטוסקופ על הלב',bandage:'שימי פלסטר צבעוני על השריטה',temp:'החזיקי את המדחום על המצח',feed:'מה האוכל הנכון בשביל החיה?',furscrub:'הברישי את הפרווה עד שהיא נקייה ומבריקה',recipe:'בחרי מה מכינים היום במטבח',gather:'אספי את המרכיבים מהמדף',steps:'עשי את שלבי ההכנה בסדר הנכון',chop:'קצצי את הירקות לתוך הקערה',serve:'קשטי את הצלחת והגישי בחיוך',foodsort:'מייני: אוכל של כל יום או של פעמים מיוחדות',
teethcount:'ספרי בקול את השיניים הגדולות!',diagnose:'מה עושים קודם בבדיקה? סדרי את השלבים',duet:'שירו צמד! מקישים כשהאור עובר באזור הזהב!',bigchange:'הפעם משלמים עם 20 מטבעות! החזירי את העודף הנכון',freestyle:'בני מנה משלך: בחרי אוכל ושתייה'};

const KID='רונה';
const DISH_STEPS={salad:[{e:'🚿',n:'שוטפים'},{e:'🔪',n:'קוצצים'},{e:'🥣',n:'מערבבים'},{e:'🍽️',n:'מגישים'}],
sandwich:[{e:'🍞',n:'לוקחים לחם'},{e:'🥑',n:'שמים מילוי'},{e:'🥪',n:'סוגרים את הכריך'},{e:'😋',n:'מגישים'}],
shake:[{e:'🍌',n:'שמים פירות'},{e:'💧',n:'מוסיפים מים'},{e:'🌀',n:'טוחנים'},{e:'🥤',n:'מוזגים'}],
pizza:[{e:'🖐️',n:'מרדדים בצק'},{e:'🍅',n:'מורחים רוטב'},{e:'🧅',n:'מפזרים ירקות'},{e:'🔥',n:'אופים'}]};

function paramsFor(type,lvl,ctx){
 const ch=ctx.char;
 switch(type){
  case 'toolpick':{const opts=[{e:'🪥',n:'מברשת',good:true},{e:'🧴',n:'משחה',good:true},{e:'🥄',n:'כף'},{e:'🪮',n:'מסרק'},{e:'🖍️',n:'צבע'}];
   return{need:2,options:opts.slice(0,1+lvl*2>3?2+lvl:3),hint:'מברשת ומשחה מנקות שיניים',doneSay:'יופי! יש מברשת ומשחה'}}
  case 'brush':return{emoji:'🦷',doneEmoji:'✨',goal:12+lvl*12,countTo:2+lvl*2,doneSay:'השיניים נקיות ומנצנצות!'};
  case 'furscrub':return{emoji:ch.c[0],doneEmoji:ch.c[0],goal:10+lvl*10,countTo:2+lvl*2,doneSay:'הפרווה נקייה ומבריקה!'};
  case 'patch':return{tool:`<span class="light-dot" style="background:${STATE.choices.patchColor||'#ffd54a'};width:46px;height:46px"></span>`,target:'🦷💫',doneEmoji:'🦷✨',decoys:['🧽','🧴'],spots:lvl>=3?2:1,pickSay:'עכשיו על הנקודה!',doneSay:'הטלאי במקום! השן תהיה בריאה'};
  case 'bandage':return{tool:`<span class="light-dot" style="background:${STATE.choices.bandageColor||'#ff8fb3'};width:46px;height:46px;border-radius:12px"></span>`,target:ch.c[0]+'❗',doneEmoji:ch.c[0]+'🩹',decoys:['🧴','🪮'],spots:1,pickSay:'עכשיו על השריטה!',doneSay:'הפלסטר על השריטה! כבר יהיה טוב'};
  case 'stetho':return{tool:'🩺',target:ch.c[0]+'❤️',doneEmoji:ch.c[0]+'💓',decoys:['🩹','🌡️'],spots:1,pickSay:'עכשיו על הלב!',doneSay:'שומעים את הלב! הוא פועם חזק'};
  case 'snacksort':{const n=[0,4,6,8][lvl];const goods=sample(SNACKS_GOOD,n/2).map(e=>({e,bin:'good'})),bads=sample(SNACKS_BAD,n/2).map(e=>({e,bin:'bad'}));
   return{bins:[{id:'good',e:'😁',n:'טוב לשיניים'},{id:'bad',e:'😬',n:'רק קצת'}],items:goods.concat(bads),hint:'פירות וירקות טובים לשיניים',doneSay:'מיון מושלם! השיניים שמחות'}}
  case 'foodsort':{const n=[0,4,6,8][lvl];const goods=sample(['🍎','🥪','🍐','🥚','🥕','🍌'],n/2).map(e=>({e,bin:'every'})),bads=sample(['🍕','🍰','🥤','🍟','🍩','🍬'],n/2).map(e=>({e,bin:'some'}));
   return{bins:[{id:'every',e:'💪',n:'כל יום'},{id:'some',e:'🎉',n:'לפעמים'}],items:goods.concat(bads),hint:'אוכל בריא אוכלים כל יום',doneSay:'מיון יפה! אוכל של כל יום נותן כוח'}}
  case 'story':return{points:lvl,story:sample(STORY_SETS,1)[0]};
  case 'teethcount':return{n:[0,4,6,7][lvl],item:'🦷',bag:'😁',doneSay:'ספרת את כל השיניים!'};
  case 'diagnose':return{cards:DIAG_STEPS,hint:'מה עושים קודם בבדיקה?',doneSay:'סדר בדיקה נכון! יודעים מה לעשות'};
  case 'bigchange':return{price:[0,12,14,15][lvl],paid:20};
  case 'freestyle':return{groups:[{key:'dish',q:'מה מכינים?',opts:CHEF_DISHES.map(d=>({e:d.e,n:d.n,v:d.id}))},
   {key:'drink',q:'ומה שותים?',opts:DRINKS.map(d=>({e:d.e,n:d.n,v:d.e}))}]};
  case 'duet':{const song=SONGS.find(s=>s.id===STATE.choices.song);
   return{beats:[0,4,6,8][lvl],speed:2.2+lvl*.6,stage:{costume:STATE.choices.costume,lights:STATE.choices.lights,song:song?song.n:null,partner:sample(['🐦','🐊','🐒','🐘'],1)[0]}}}
  case 'share':return{total:[0,4,6,8][lvl],kids:1+lvl,item:'🖍️',kidEmojis:['👧','👦','🧒','👧🏽']};
  case 'dayorder':return{cards:DAY_CARDS.slice(0,2+lvl),hint:'מה עושים קודם בבוקר?',doneSay:'סדר מושלם! ככה נראה היום בגן'};
  case 'simon':return{seq:sample(SIMON_MOVES,4).slice(0,1+lvl)};
  case 'gallery':{const n=2+lvl;const fr=GALLERY_FRAMES.slice(0,n);
   return{bins:fr.map((f,i)=>({id:'f'+i,e:f.f,n:''})),items:fr.map((f,i)=>({e:f.d,bin:'f'+i})),hint:'כל ציור מתאים לצורה שלו',doneSay:'תערוכה מהממת! כל ציור במסגרת שלו'}}
  case 'find':{const n=[0,3,5,7][lvl];const list=sample(SHOP_ITEMS,n);const others=SHOP_ITEMS.filter(x=>!list.includes(x));
   return{list,pool:list.concat(sample(others,Math.min(others.length,n+3))),doneSay:'מצאת את כל הרשימה!'}}
  case 'gather':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   const n=[0,3,5,7][lvl];const list=dish.ing.slice(0,n);
   const others=SHOP_ITEMS.filter(x=>!list.includes(x));
   return{list,pool:list.concat(sample(others,Math.min(others.length,n+3)))}}
  case 'count':return{n:[0,3,5,7][lvl],item:sample(['🍎','🍞','🫐','🥕'],1)[0],bag:'🛍️',doneSay:'ספרת נכון! הכל בתיק'};
  case 'change':return{price:[0,8,7,5+Math.floor(Math.random()*2)][lvl]};
  case 'shelfsort':{const nb=Math.min(1+lvl,3);const cats=SHOP_CATS.slice(0,nb);
   const items=[];cats.forEach(c=>sample(c.items,[0,2,2,3][lvl]).forEach(e=>items.push({e,bin:c.id})));
   return{bins:cats.map(c=>({id:c.id,e:c.e,n:c.n})),items,doneSay:'המדפים מסודרים! החנות נראית נהדר'}}
  case 'dressup':return{groups:[{key:'costume',q:'איזו תלבושת לבמה?',opts:COSTUMES.map(c=>({e:c.e,n:c.n,v:c.e}))},
   {key:'lights',q:'איזה צבע תאורה?',opts:LIGHTS.map(c=>({c:c.c,n:c.n,v:c.c}))}]};
  case 'picksong':return{groups:[{key:'song',q:'איזה שיר נשיר?',opts:SONGS.map(s=>({e:s.e,n:s.n,v:s.id}))}]};
  case 'steps':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   const all=DISH_STEPS[dish.id]||DISH_STEPS.salad;
   return{cards:all.slice(0,Math.min(all.length,2+lvl)),hint:'מה עושים קודם?',doneSay:'סדר נכון! בדיוק ככה מכינים'}}
  case 'recipe':return{groups:[{key:'dish',q:'מה מכינים היום?',opts:CHEF_DISHES.map(d=>({e:d.e,n:d.n,v:d.id}))}]};
  case 'serve':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   return{dish:dish.e,options:[{e:'😊',n:'חיוכים',v:'😊'},{e:'😍',n:'לבבות',v:'😍'},{e:'⭐',n:'כוכבים',v:'⭐'}]}}
  case 'rhythm':{const song=SONGS.find(s=>s.id===STATE.choices.song);
   return{beats:[0,4,6,8][lvl],speed:2.2+lvl*.6,stage:{costume:STATE.choices.costume,lights:STATE.choices.lights,song:song?song.n:null}}}
  case 'chop':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   return{n:[0,3,5,6][lvl],veggies:dish.ing}}
  case 'feed':{const right=ANIMAL_FOOD[ch.c[0]]||'🍎';const wrong=sample(Object.values(ANIMAL_FOOD).filter(f=>f!==right),2+lvl);
   return{need:1,options:shuffle([{e:right,good:true}].concat(wrong.map(e=>({e})))),hint:'לכל חיה יש אוכל שמתאים לה',doneSay:'טעים! זה בדיוק האוכל בשבילה'}}
  case 'temp':return{};
  case 'wobbly':return{};
 }return{}}

function runVisit(role,lvl,ci){
 const ch=role.levels[lvl-1][ci];let ai=0;
 const visitTitle=role.name+' · '+ch.c[1];
 const baseDepth=navStack.length;
 const intro=(sc)=>{sc.appendChild(el('h1','screen-title',role.emoji+' '+role.name));
  const st=el('div','char-stage',`<div class="ce">${ch.c[0]}</div><div class="csay">"${ch.say}"</div>`);sc.appendChild(st);
  speak(ch.c[1]+': '+ch.say);
  const b=el('button','big-btn','בואי נעזור! 💪');b.onclick=()=>{sfx('tick');next()};const cc=el('div','center-col');cc.appendChild(b);sc.appendChild(cc)};
 const next=()=>{if(ai>=ch.a.length){reward();return}
  const [type,alvl]=ch.a[ai];ai++;
  show(sc=>{ // מסך פעולה
   const wrap=el('div','game-wrap');
   wrap.appendChild(el('div','char-stage',`<div class="ce">${ch.c[0]}</div><div class="csay">${ch.c[1]}</div>`));
   const instr=el('div','instr',`<span>${INSTR[type]||''}</span>`);
   const rep=el('button','','🔊');rep.setAttribute('aria-label','שמע שוב');rep.onclick=()=>speak(INSTR[type]||'');instr.appendChild(rep);wrap.appendChild(instr);
   const area=el('div','play-area');wrap.appendChild(area);sc.appendChild(wrap);
   // זרימות מיוחדות: בחירת צבע ראשונה לפני טלאי/פלסטר, בחירת מנה לפני איסוף.
   // כשיש בחירה כזאת, השאלה שלה מוקראת במקום ההוראה (שתוקרא אחרי הבחירה) - כך אחת לא חותכת את השנייה
   const preChoice=(type==='patch'&&!STATE.choices.patchColor)||(type==='bandage'&&!STATE.choices.bandageColor)||(type==='gather'&&!STATE.choices.dish);
   if(!preChoice)speak(INSTR[type]||'');
   const runEngine=()=>GAMES[engineType(type)].run(area,paramsFor(type,alvl,{role,char:ch}),once(()=>{sfx('good');next()}));
   if(type==='patch'&&!STATE.choices.patchColor){GAMES.choiceSave.run(area,{groups:[{key:'patchColor',q:'איזה צבע טלאי קסם?',opts:PATCHES.map(c=>({c:c.c,n:c.n,v:c.c}))}]},()=>{area.innerHTML='';speak(INSTR.patch);runEngine()});return}
   if(type==='bandage'&&!STATE.choices.bandageColor){GAMES.choiceSave.run(area,{groups:[{key:'bandageColor',q:'איזה צבע פלסטר?',opts:BANDAGES.map(c=>({c:c.c,n:c.n,v:c.c}))}]},()=>{area.innerHTML='';speak(INSTR.bandage);runEngine()});return}
   if(type==='gather'&&!STATE.choices.dish){GAMES.choiceSave.run(area,{groups:[{key:'dish',q:'קודם בוחרים מנה!',opts:CHEF_DISHES.map(d=>({e:d.e,n:d.n,v:d.id}))}]},()=>{area.innerHTML='';speak(INSTR.gather);runEngine()});return}
   runEngine();
  },visitTitle,false)};
 const reward=()=>{ // פרס בסוף ביקור
  STATE.done[role.id]=STATE.done[role.id]||{};STATE.done[role.id][lvl]=STATE.done[role.id][lvl]||{};
  STATE.done[role.id][lvl][ci]=true;
  const lvlDone=role.levels[lvl-1].every((_,i)=>STATE.done[role.id][lvl][i]);
  let newBadge=false;
  if(lvlDone&&!(STATE.badges[role.id]||[])[lvl-1]){STATE.badges[role.id]=STATE.badges[role.id]||[];STATE.badges[role.id][lvl-1]=true;newBadge=true;
   if(lvl<role.levels.length)STATE.unlocked[role.id]=Math.max(STATE.unlocked[role.id]||1,lvl+1);else STATE.unlocked[role.id]=role.levels.length}
  saveState();
  show(sc=>{const cc=el('center-col'.replace('$',''),'center-col');sc.appendChild(cc);
   cc.appendChild(el('h1','screen-title',newBadge?'🏅 תג חדש!':'⭐ כל הכבוד!'));
   cc.appendChild(el('div','reward-stars',newBadge?role.emoji:'⭐'));
   const totalBadges=Object.values(STATE.badges).flat().filter(Boolean).length;
  const allBadges=ROLES.reduce((s,r)=>s+r.levels.length,0);
  let line=newBadge?`השלמת את רמה ${lvl} וקיבלת ${role.badge}!`:`עזרת ל${ch.c[1]}! כל הכבוד ${KID}!`;
  if(newBadge&&totalBadges===allBadges)line=`כל התגים באוסף! ${KID}, את אלופת התפקידים!`;
  else if(newBadge&&totalBadges%6===0)line+=` יש לך כבר ${totalBadges} תגים!`;
   cc.appendChild(el('p','screen-sub',line));sfx(newBadge?'applause':'sparkle');confettiBurst(newBadge?18:10);
   // ההקראה מחולקת למשפטים נפרדים כדי שכל אחד ימצא את ההקלטה המוכנה שלו
   const segs=[];
   if(newBadge){if(totalBadges===allBadges)segs.push(`כל התגים באוסף! ${KID}, את אלופת התפקידים!`);
    else{segs.push(`השלמת את רמה ${lvl} וקיבלת ${role.badge}!`);if(totalBadges%6===0)segs.push(`יש לך כבר ${totalBadges} תגים!`)}}
   else segs.push(`עזרת ל${ch.c[1]}! כל הכבוד ${KID}!`);
   if(newBadge&&lvl<role.levels.length){cc.appendChild(el('p','screen-sub',`רמה ${lvl+1} נפתחה!`));segs.push(`רמה ${lvl+1} נפתחה!`)}
   speak(segs);
   if(newBadge&&lvl<role.levels.length)STATE.fresh[role.id]=lvl+1;
   const b=el('button','big-btn','המשך ▶');const shownAt=Date.now();b.onclick=()=>{if(Date.now()-shownAt<800)return;sfx('tick');navStack.length=baseDepth;show._cur=null;show(levelScreen.bind(null,role,lvl),role.name+' · רמה '+lvl)};cc.appendChild(b);
  },visitTitle,false)};
 show(intro,visitTitle);
}
function engineType(t){return({toolpick:'pick',feed:'pick',brush:'scrub',furscrub:'scrub',patch:'dragOne',bandage:'dragOne',stetho:'dragOne',snacksort:'sort',shelfsort:'sort',foodsort:'sort',gallery:'sort',count:'countTap',dayorder:'order',steps:'order',simon:'simon',story:'story',dressup:'choiceSave',picksong:'choiceSave',recipe:'choiceSave',serve:'serve',rhythm:'rhythm',change:'change',share:'share',temp:'temp',wobbly:'wobbly',chop:'chop',find:'find',gather:'find',teethcount:'countTap',diagnose:'order',duet:'rhythm',bigchange:'change',freestyle:'choiceSave'})[t]||t}

// --- ביקור תלת-ממדי אצל הוטרינרית ---
function openVet3D(){
 show(sc=>{const wrap=el('div','vet3d-wrap');sc.appendChild(wrap);startVet3DInto(wrap)},'מרפאת החיות בתלת-ממד');
}

function openChef3D(){
 show(sc=>{const wrap=el('div','vet3d-wrap');sc.appendChild(wrap);window.__scene3dCleanup=startChef3D(wrap)},'המטבח התלת-ממדי');
}

function openShop3D(){
 show(sc=>{const wrap=el('div','vet3d-wrap');sc.appendChild(wrap);window.__scene3dCleanup=startShop3D(wrap)},'החנות התלת-ממדית');
}

function openDentist3D(){
 show(sc=>{const wrap=el('div','vet3d-wrap');sc.appendChild(wrap);window.__scene3dCleanup=startDentist3D(wrap)},'מרפאת השיניים בתלת-ממד');
}

function openVet3D2(){
 show(sc=>{const wrap=el('div','vet3d-wrap');sc.appendChild(wrap);window.__scene3dCleanup=startVet3D2(wrap)},'מרפאת החיות התלת-ממדית החדשה');
}

// --- תגים ---
function badgesScreen(sc){
 sc.appendChild(el('h1','screen-title','🏅 התגים שלי'));
 const grid=el('div','badge-grid');
 ROLES.forEach(r=>{const b=(STATE.badges[r.id]||[]);
  for(let l=0;l<r.levels.length;l++){const got=b[l];
   grid.appendChild(el('div','badge-cell',`<div class="be${got?'':' locked'}">${got?r.emoji:'🏅'}</div><div class="bn">${r.emoji} ${r.name}<br>רמה ${l+1}</div>`))}});
 sc.appendChild(grid);
 const cc=el('div','row-btns');const h=el('button','pill-btn','🏠 לבית');h.onclick=()=>show(homeScreen,'עולם התפקידים של רונה');cc.appendChild(h);sc.appendChild(cc);
 const total=Object.values(STATE.badges).flat().filter(Boolean).length;
 speak(total?`יש לך ${total} תגים! כל הכבוד ${KID}`:'עוד אין תגים. בואי נשחק ונרוויח!')}

// --- פינת הורים ---
// שער הורים: שאלת חיבור פשוטה למבוגר, בלי הקראה
function parentGate(){const a=4+Math.floor(Math.random()*5),b=3+Math.floor(Math.random()*6),ans=a+b;
 const opts=shuffle([ans,ans+1,ans-1,ans+2]);
 show(sc=>{sc.appendChild(el('h1','screen-title','פינה להורים 👪'));
  sc.appendChild(el('p','screen-sub','המסך הזה מיועד למבוגרים. כדי להיכנס, פתרו:'));
  const cc=el('div','center-col');
  cc.appendChild(el('div','gate-q',`${a} + ${b} = ?`));
  const row=el('div','opt-row');
  opts.forEach(o=>{const bt=el('button','opt-btn',''+o);row.appendChild(bt);
   bt.onclick=()=>{if(o===ans){sfx('good');show(parentsScreen,'להורים')}
    else{sfx('oops');toast('לא נכון');show(homeScreen,'עולם התפקידים של רונה')}}});
  cc.appendChild(row);sc.appendChild(cc)},'להורים')}
function parentsScreen(sc){
 const p=el('div','parent-panel');
 p.innerHTML=`<h3>על המשחק</h3>
 <div>משחק דמיון חינוכי לגיל הגן: רונה בוחרת תפקיד, פוגשת דמויות ומבצעת עבורן פעולות. בלי רכישות, בלי פרסומות, בלי מעקב. ההתקדמות נשמרת במכשיר בלבד.</div>
 <h3>היגיינת הפה במשחק</h3>
 <div>המשחק הוא משחק דמיון וחינוך להרגלים, לא הדרכה רפואית. סתימות ועקירות מוצגות כדמיון עדין בלבד (טלאי קסם, שן חלבית שנושרת לבד).</div>
 <ul>
 <li>צחצוח פעמיים ביום, בבוקר ובערב לפני השינה, עם משחת שיניים המכילה פלואוריד (משרד הבריאות).</li>
 <li>בגילאי 2-6: כמות משחה בגודל גרגר אפונה, משחה עם 1000ppm פלואוריד (מדעת).</li>
 <li>ילדים צעירים לא מצחצחים יעיל לבד - מבוגר מסייע ומשגיח (AAPD).</li>
 <li>משך צחצוח מומלץ: כשתי דקות (AAPD, KidsHealth).</li>
 <li>ילדי גן זכאים לבדיקת שיניים שנתית והדרכת צחצוח במסגרת שירותי הבריאות בגן (משרד הבריאות).</li>
 </ul>
 <h3>מקורות</h3>
 <ul>
 <li><a href="https://me.health.gov.il/parenting/raising-children/early-childhood-care/dental-and-oral-health/dental-health/" target="_blank" rel="noopener">משרד הבריאות - בריאות השן בגיל הרך</a></li>
 <li><a href="https://me.health.gov.il/parenting/learn-more/growth-and-development/school-health-services/" target="_blank" rel="noopener">משרד הבריאות - שירותי בריאות בגן</a></li>
 <li><a href="https://www.midaat.org.il/articles/health-and-sickness/fluoride-therapy-infants/" target="_blank" rel="noopener">מדעת - פלואוריד לילדים</a></li>
 <li><a href="https://www.aapd.org/resources/parent/faq/" target="_blank" rel="noopener">AAPD - שאלות נפוצות להורים</a></li>
 <li><a href="https://kidshealth.org/en/parents/healthy.html" target="_blank" rel="noopener">KidsHealth - שמירה על שיניים בריאות</a></li>
 </ul>
 <h3>האוכל במשחק</h3>
 <div>הבישול, הקניות והחטיפים במשחק הם משחק דמיון בלבד - לא המלצה תזונתית ולא הנחיית בטיחות. במשפחה עם אלרגיות או הגבלות אוכל, ההנחיות הרפואיות שלכם תמיד קודמות למה שרואים במשחק.</div>
 <h3>גיבוי ההתקדמות</h3>
 <div>כדי לשמור את התגים והבחירות של רונה (או להעביר למכשיר אחר): לוחצים "ייצוא" ושומרים את הקובץ. לשחזור: "ייבוא" ובוחרים את הקובץ. מומלץ לייצא מדי פעם.</div>`;
 sc.appendChild(p);
 const row=el('div','row-btns');
 const ex=el('button','pill-btn primary','💾 ייצוא התקדמות');ex.onclick=exportState;row.appendChild(ex);
 const im=el('button','pill-btn','📥 ייבוא התקדמות');im.onclick=()=>document.getElementById('import-file').click();row.appendChild(im);
 const inp=document.createElement('input');inp.type='file';inp.id='import-file';inp.accept='application/json';inp.style.display='none';
 inp.onchange=importState;row.appendChild(inp);
 sc.appendChild(row);
}
function exportState(){try{const blob=new Blob([JSON.stringify(STATE,null,1)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rona-roleplay-backup.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('הגיבוי ירד למכשיר')}catch(e){toast('הייצוא לא הצליח')}}
function importState(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const s=JSON.parse(r.result);if(!s||typeof s!=='object')throw 0;
  STATE=Object.assign({unlocked:{},done:{},badges:{},choices:{},fresh:{},muted:false},s);saveState();toast('ההתקדמות שוחזרה!');show(homeScreen,'עולם התפקידים של רונה')}
 catch(e){toast('הקובץ לא תקין')}};r.readAsText(f)}

// --- הוספה למסך הבית ---
let deferredInstall=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
function installClick(){sfx('tick');
 if(deferredInstall){deferredInstall.prompt();deferredInstall.userChoice.then(c=>{if(c.outcome==='accepted')toast('נהדר! האפליקציה על מסך הבית');deferredInstall=null});return}
 toast('בכרום: תפריט ⋮ ← "הוספה למסך הבית"');speak('בתפריט של כרום בוחרים הוספה למסך הבית')}

// --- Service worker ---
if('serviceWorker' in navigator){
 navigator.serviceWorker.register('sw.js');
 let reloaded=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;location.reload()});
}

// התחלה
show(homeScreen,'עולם התפקידים של רונה',false);
setTimeout(()=>{if(!navStack.length)speak('היי רונה! באיזה תפקיד נשחק היום?')},600);
