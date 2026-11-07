// עולם התפקידים של רונה — מנוע ראשי
const LS_KEY='ronaRoleplay.v1';
let STATE={unlocked:{},done:{},badges:{},choices:{},muted:false};
function loadState(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s)STATE=Object.assign(STATE,s)}catch(e){}}
function saveState(){try{localStorage.setItem(LS_KEY,JSON.stringify(STATE))}catch(e){}}
loadState();

// --- קול והקראה ---
let heVoice=null;
function pickVoice(){const vs=speechSynthesis.getVoices();heVoice=vs.find(v=>v.lang&&v.lang.startsWith('he'))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(t){if(STATE.muted||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(t);u.lang='he-IL';if(heVoice)u.voice=heVoice;u.rate=.95;u.pitch=1.05;speechSynthesis.speak(u)}catch(e){}}
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
function toggleMute(){STATE.muted=!STATE.muted;saveState();document.getElementById('btn-sound').textContent=STATE.muted?'🔇':'🔊';if(STATE.muted&&'speechSynthesis' in window)speechSynthesis.cancel()}

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
function show(fn,title,push=true){if(push&&show._cur)navStack.push(show._cur);show._cur={fn,title};
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
  b.innerHTML=`<div class="re">${r.emoji}</div><div class="rn">${r.name}</div><div class="rs">${'⭐'.repeat(earned)}${'☆'.repeat(3-earned)}</div>`;
  b.onclick=()=>{sfx('tick');speak(r.name);show(roleScreen.bind(null,r),r.name)};grid.appendChild(b)});
 sc.appendChild(grid);
 const foot=el('div','home-foot');
 const badges=el('button','pill-btn','🏅 התגים שלי');badges.onclick=()=>{sfx('tick');show(badgesScreen,'התגים שלי')};foot.appendChild(badges);
 const inst=el('button','pill-btn primary','📱 הוסף לדף הבית');inst.onclick=installClick;foot.appendChild(inst);
 sc.appendChild(foot);
 sc.appendChild(el('div','footer-note','עובד גם בלי אינטרנט · ההתקדמות נשמרת במכשיר'));
}

// --- מסך תפקיד: רמות + דמויות ---
function roleScreen(role,sc){
 sc.appendChild(el('h1','screen-title',role.emoji+' '+role.name));
 sc.appendChild(el('p','screen-sub',role.intro));speak(role.intro);
 const unl=STATE.unlocked[role.id]||1;
 const lvlRow=el('div','lvl-row');
 for(let l=1;l<=3;l++){const locked=l>unl;
  const b=el('button','lvl-btn'+(locked?' locked':''),`<span>${locked?'🔒':''} רמה ${l}</span><span>${'⭐'.repeat(l)}</span>`);
  b.onclick=()=>{if(locked){sfx('oops');speak('קודם משלימים את הרמה הקודמת');toast('משלימים קודם את רמה '+(l-1));return}
   sfx('tick');show(levelScreen.bind(null,role,l),role.name+' · רמה '+l)};lvlRow.appendChild(b)}
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
 sc.appendChild(el('p','screen-sub','למי נעזור הפעם?'));
 const done=(STATE.done[role.id]||{})[lvl]||{};
 const chars=el('div','char-row');
 role.levels[lvl-1].forEach((ch,i)=>{const d=done[i];
  const b=el('button','char-card',`${d?'<span class="done-mark">✔️</span>':''}<div class="ce">${ch.c[0]}</div><div class="cn">${ch.c[1]}</div>`);
  b.onclick=()=>{sfx('tick');runVisit(role,lvl,i)};chars.appendChild(b)});
 sc.appendChild(chars);
}

// --- ביקור אצל דמות ---
const INSTR={toolpick:'בחרי מברשת ומשחה כדי לנקות את השיניים',brush:'צחצחי במעגלים קטנים עד שהשיניים מנצנצות',patch:'שימי טלאי קסם צבעוני על הנקודה החולה',wobbly:'געי בעדינות בשן המתנדנדת',snacksort:'מייני: מה טוב לשיניים ומה רק קצת?',story:'בחרי איך הסיפור ממשיך',share:'חלקי לכולם שווה בשווה',dayorder:'סדרי את לוח היום של הגן',simon:'חזרי על התנועות של שיר המעבר',gallery:'תלי כל ציור במסגרת המתאימה',find:'מצאי על המדפים את מה שברשימה',count:'ספרי בקול והכניסי לתיק',change:'החזירי ללקוח את העודף הנכון',shelfsort:'סדרי את הסחורה על המדפים הנכונים',dressup:'בחרי תלבושת ותאורה לבמה',picksong:'בחרי איזה שיר נשיר בהופעה',rhythm:'מקישים כשהאור עובר באזור הזהב!',stetho:'שימי את הסטטוסקופ על הלב',bandage:'שימי פלסטר צבעוני על השריטה',temp:'החזיקי את המדחום על המצח',feed:'מה האוכל הנכון בשביל החיה?',furscrub:'הברישי את הפרווה עד שהיא נקייה ומבריקה',recipe:'בחרי מה מכינים היום במטבח',gather:'אספי את המרכיבים מהמדף',steps:'עשי את שלבי ההכנה בסדר הנכון',chop:'קצצי את הירקות לתוך הקערה',serve:'קשטי את הצלחת והגישי בחיוך',foodsort:'מייני: אוכל של כל יום או של פעמים מיוחדות'};

const DISH_STEPS={salad:[{e:'🚿',n:'שוטפים'},{e:'🔪',n:'קוצצים'},{e:'🥣',n:'מערבבים'},{e:'🍽️',n:'מגישים'}],
sandwich:[{e:'🍞',n:'לוקחים לחם'},{e:'🥑',n:'שמים מילוי'},{e:'🥪',n:'סוגרים את הכריך'},{e:'😋',n:'מגישים'}],
shake:[{e:'🍌',n:'שמים פירות'},{e:'💧',n:'מוסיפים מים'},{e:'🌀',n:'טוחנים'},{e:'🥤',n:'מוזגים'}],
pizza:[{e:'🖐️',n:'מרדדים בצק'},{e:'🍅',n:'מורחים רוטב'},{e:'🧅',n:'מפזרים ירקות'},{e:'🔥',n:'אופים'}]};

function paramsFor(type,lvl,ctx){
 const ch=ctx.char;
 switch(type){
  case 'toolpick':{const opts=[{e:'🪥',n:'מברשת',good:true},{e:'🧴',n:'משחה',good:true},{e:'🥄',n:'כף'},{e:'🪮',n:'מסרק'},{e:'🖍️',n:'צבע'}];
   return{need:2,options:opts.slice(0,1+lvl*2>3?2+lvl:3),hint:'מברשת ומשחה מנקות שיניים'}}
  case 'brush':return{emoji:'🦷',doneEmoji:'✨',goal:12+lvl*12,countTo:2+lvl*2};
  case 'furscrub':return{emoji:ch.c[0],doneEmoji:ch.c[0],goal:10+lvl*10,countTo:2+lvl*2};
  case 'patch':return{tool:`<span class="light-dot" style="background:${STATE.choices.patchColor||'#ffd54a'};width:46px;height:46px"></span>`,target:'🦷💫',doneEmoji:'🦷✨',decoys:['🧽','🧴'],spots:lvl>=3?2:1,pickSay:'עכשיו על הנקודה!'};
  case 'bandage':return{tool:`<span class="light-dot" style="background:${STATE.choices.bandageColor||'#ff8fb3'};width:46px;height:46px;border-radius:12px"></span>`,target:ch.c[0]+'❗',doneEmoji:ch.c[0]+'🩹',decoys:['🧴','🪮'],spots:1,pickSay:'עכשיו על השריטה!'};
  case 'stetho':return{tool:'🩺',target:ch.c[0]+'❤️',doneEmoji:ch.c[0]+'💓',decoys:['🩹','🌡️'],spots:1,pickSay:'עכשיו על הלב!'};
  case 'snacksort':{const n=[0,4,6,8][lvl];const goods=sample(SNACKS_GOOD,n/2).map(e=>({e,bin:'good'})),bads=sample(SNACKS_BAD,n/2).map(e=>({e,bin:'bad'}));
   return{bins:[{id:'good',e:'😁',n:'טוב לשיניים'},{id:'bad',e:'😬',n:'רק קצת'}],items:goods.concat(bads),hint:'פירות וירקות טובים לשיניים'}}
  case 'foodsort':{const n=[0,4,6,8][lvl];const goods=sample(['🍎','🥪','🍐','🥚','🥕','🍌'],n/2).map(e=>({e,bin:'every'})),bads=sample(['🍕','🍰','🥤','🍟','🍩','🍬'],n/2).map(e=>({e,bin:'some'}));
   return{bins:[{id:'every',e:'💪',n:'כל יום'},{id:'some',e:'🎉',n:'לפעמים'}],items:goods.concat(bads),hint:'אוכל בריא אוכלים כל יום'}}
  case 'story':return{points:lvl};
  case 'share':return{total:[0,4,6,8][lvl],kids:1+lvl,item:'🖍️',kidEmojis:['👧','👦','🧒','👧🏽']};
  case 'dayorder':return{cards:DAY_CARDS.slice(0,2+lvl),hint:'מה עושים קודם בבוקר?'};
  case 'simon':return{seq:sample(SIMON_MOVES,4).slice(0,1+lvl)};
  case 'gallery':{const n=2+lvl;const fr=GALLERY_FRAMES.slice(0,n);
   return{bins:fr.map((f,i)=>({id:'f'+i,e:f.f,n:''})),items:fr.map((f,i)=>({e:f.d,bin:'f'+i})),hint:'כל ציור מתאים לצורה שלו'}}
  case 'find':{const n=[0,3,5,7][lvl];const list=sample(SHOP_ITEMS,n);const others=SHOP_ITEMS.filter(x=>!list.includes(x));
   return{list,pool:list.concat(sample(others,Math.min(others.length,n+3)))}}
  case 'gather':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   const n=[0,3,5,7][lvl];const list=dish.ing.slice(0,n);
   const others=SHOP_ITEMS.filter(x=>!list.includes(x));
   return{list,pool:list.concat(sample(others,Math.min(others.length,n+3)))}}
  case 'count':return{n:[0,3,5,7][lvl],item:sample(['🍎','🍞','🫐','🥕'],1)[0],bag:'🛍️'};
  case 'change':return{price:[0,8,7,5+Math.floor(Math.random()*2)][lvl]};
  case 'shelfsort':{const nb=Math.min(1+lvl,3);const cats=SHOP_CATS.slice(0,nb);
   const items=[];cats.forEach(c=>sample(c.items,[0,2,2,3][lvl]).forEach(e=>items.push({e,bin:c.id})));
   return{bins:cats.map(c=>({id:c.id,e:c.e,n:c.n})),items}}
  case 'dressup':return{groups:[{key:'costume',q:'איזו תלבושת לבמה?',opts:COSTUMES.map(c=>({e:c,v:c}))},
   {key:'lights',q:'איזה צבע תאורה?',opts:LIGHTS.map(c=>({c:c.c,n:c.n,v:c.c}))}]};
  case 'picksong':return{groups:[{key:'song',q:'איזה שיר נשיר?',opts:SONGS.map(s=>({e:s.e,n:s.n,v:s.id}))}]};
  case 'steps':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   const all=DISH_STEPS[dish.id]||DISH_STEPS.salad;
   return{cards:all.slice(0,Math.min(all.length,2+lvl)),hint:'מה עושים קודם?'}}
  case 'recipe':return{groups:[{key:'dish',q:'מה מכינים היום?',opts:CHEF_DISHES.map(d=>({e:d.e,n:d.n,v:d.id}))}]};
  case 'serve':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   return{dish:dish.e,options:[{e:'😊',n:'חיוכים',v:'😊'},{e:'😍',n:'לבבות',v:'😍'},{e:'⭐',n:'כוכבים',v:'⭐'}]}}
  case 'rhythm':{const song=SONGS.find(s=>s.id===STATE.choices.song);
   return{beats:[0,4,6,8][lvl],speed:2.2+lvl*.6,stage:{costume:STATE.choices.costume,lights:STATE.choices.lights,song:song?song.n:null}}}
  case 'chop':{const dish=CHEF_DISHES.find(d=>d.id===STATE.choices.dish)||CHEF_DISHES[0];
   return{n:[0,3,5,6][lvl],veggies:dish.ing}}
  case 'feed':{const right=ANIMAL_FOOD[ch.c[0]]||'🍎';const wrong=sample(Object.values(ANIMAL_FOOD).filter(f=>f!==right),2+lvl);
   return{need:1,options:shuffle([{e:right,good:true}].concat(wrong.map(e=>({e})))),hint:'לכל חיה יש אוכל שמתאים לה'}}
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
   speak(INSTR[type]||'');
   const runEngine=()=>GAMES[engineType(type)].run(area,paramsFor(type,alvl,{role,char:ch}),once(()=>{sfx('good');next()}));
   // זרימות מיוחדות: בחירת צבע ראשונה לפני טלאי/פלסטר, בחירת מנה לפני איסוף
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
   if(lvl<3)STATE.unlocked[role.id]=Math.max(STATE.unlocked[role.id]||1,lvl+1);else STATE.unlocked[role.id]=3}
  saveState();
  show(sc=>{const cc=el('center-col'.replace('$',''),'center-col');sc.appendChild(cc);
   cc.appendChild(el('h1','screen-title',newBadge?'🏅 תג חדש!':'⭐ כל הכבוד!'));
   cc.appendChild(el('div','reward-stars',newBadge?'🏅':'⭐'));
   const line=newBadge?`השלמת את רמה ${lvl} וקיבלת ${role.badge}!`:`עזרת ל${ch.c[1]}! כל הכבוד!`;
   cc.appendChild(el('p','screen-sub',line));speak(line);sfx(newBadge?'applause':'sparkle');confettiBurst(newBadge?18:10);
   if(newBadge&&lvl<3)cc.appendChild(el('p','screen-sub',`רמה ${lvl+1} נפתחה!`));
   const b=el('button','big-btn','המשך ▶');b.onclick=()=>{sfx('tick');navStack.length=baseDepth;show._cur=null;show(levelScreen.bind(null,role,lvl),role.name+' · רמה '+lvl)};cc.appendChild(b);
  },visitTitle,false)};
 show(intro,visitTitle);
}
function engineType(t){return({toolpick:'pick',feed:'pick',brush:'scrub',furscrub:'scrub',patch:'dragOne',bandage:'dragOne',stetho:'dragOne',snacksort:'sort',shelfsort:'sort',foodsort:'sort',gallery:'sort',count:'countTap',dayorder:'order',steps:'order',simon:'simon',story:'story',dressup:'choiceSave',picksong:'choiceSave',recipe:'choiceSave',serve:'serve',rhythm:'rhythm',change:'change',share:'share',temp:'temp',wobbly:'wobbly',chop:'chop',find:'find',gather:'find'})[t]||t}

// --- תגים ---
function badgesScreen(sc){
 sc.appendChild(el('h1','screen-title','🏅 התגים שלי'));
 const grid=el('div','badge-grid');
 ROLES.forEach(r=>{const b=(STATE.badges[r.id]||[]);
  for(let l=0;l<3;l++){const got=b[l];
   grid.appendChild(el('div','badge-cell',`<div class="be${got?'':' locked'}">🏅</div><div class="bn">${r.emoji} ${r.name}<br>רמה ${l+1}</div>`))}});
 sc.appendChild(grid);
 const cc=el('div','row-btns');const h=el('button','pill-btn','🏠 לבית');h.onclick=()=>show(homeScreen,'עולם התפקידים של רונה');cc.appendChild(h);sc.appendChild(cc);
 const total=Object.values(STATE.badges).flat().filter(Boolean).length;
 speak(total?`יש לך ${total} תגים! כל הכבוד`:'עוד אין תגים. בואי נשחק ונרוויח!')}

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
  STATE=Object.assign({unlocked:{},done:{},badges:{},choices:{},muted:false},s);saveState();toast('ההתקדמות שוחזרה!');show(homeScreen,'עולם התפקידים של רונה')}
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
