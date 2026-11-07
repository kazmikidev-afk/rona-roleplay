// מנועי משחק גנריים. כל מנוע: {p:(lvl,ctx)=>params, run:(area,params,done)}
function el(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function sample(a,n){return shuffle(a).slice(0,n)}

const GAMES={
// בחירת פריטים נכונים מתוך אפשרויות (כלי רופא, אוכל לחיה)
pick:{run:(area,p,done)=>{let left=p.need;const row=el('div','opt-row');area.appendChild(row);
 p.options.forEach(o=>{const b=el('button','opt-btn',o.e+(o.n?`<small>${o.n}</small>`:''));row.appendChild(b);
  b.onclick=()=>{if(o.good){b.classList.add('picked');b.disabled=true;sfx('good');left--;if(left<=0){setTimeout(done,450)}}else{sfx('oops');b.classList.add('hint');speak(p.hint||'נסי שוב');setTimeout(()=>b.classList.remove('hint'),1400)}}})}},
// שפשוף/צחצוח עם גרירת אצבע
scrub:{run:(area,p,done)=>{let prog=0;const goal=p.goal;
 const tgt=el('div','sparkle-goal',p.emoji);tgt.style.filter='grayscale(.8) brightness(.85)';area.appendChild(tgt);
 const track=el('div','progress-track'),fill=el('div','progress-fill');track.appendChild(fill);area.appendChild(track);
 let lastN=0;const on=ev=>{ev.preventDefault();prog=Math.min(goal,prog+1);const pc=prog/goal;fill.style.width=(pc*100)+'%';
  const n=Math.floor(pc*p.countTo);if(n>lastN){lastN=n;speak(''+n);sfx('tick')}
  tgt.style.filter=`grayscale(${.8*(1-pc)}) brightness(${.85+.35*pc})`;
  if(prog>=goal){tgt.style.transform='scale(1.15)';tgt.textContent=p.doneEmoji;sfx('sparkle');confettiBurst(8);setTimeout(done,700)}};
 tgt.style.touchAction='none';let down=false;
 tgt.addEventListener('pointerdown',e=>{down=true;on(e)});tgt.addEventListener('pointermove',e=>{if(down)on(e)});
 addEventListener('pointerup',()=>down=false,{once:false});
 area.addEventListener('pointerleave',()=>down=false)}},
// גרירה/הצבה של כלי על מטרה (טלאי, פלסטר, סטטוסקופ): מקש על הכלי ואז מקש על המטרה
dragOne:{run:(area,p,done)=>{let picked=false;let placed=0;
 const tgt=el('div','drop-target',p.target);area.appendChild(tgt);
 const row=el('div','opt-row');area.appendChild(row);
 const tool=el('button','opt-btn drag-item',p.tool);row.appendChild(tool);
 p.decoys.forEach(d=>{const b=el('button','opt-btn',d);row.appendChild(b);
  b.onclick=()=>{sfx('oops');b.classList.add('hint');setTimeout(()=>b.classList.remove('hint'),1200)}});
 tool.onclick=()=>{picked=!picked;tool.style.borderColor=picked?'#63c76a':'transparent';sfx('tick');if(picked)speak(p.pickSay||'עכשיו על המקום!')};
 tgt.onclick=()=>{if(!picked){sfx('oops');speak('קודם בוחרים את הכלי');return}
  placed++;if(placed>=p.spots){tgt.textContent=p.doneEmoji;tgt.classList.add('over');tool.style.display='none';sfx('good');confettiBurst(6);setTimeout(done,650)}
  else{sfx('good');speak('עוד אחד!')}}}},
// מיון לסלים
sort:{run:(area,p,done)=>{let items=shuffle(p.items);let sel=null;
 const binsRow=el('div','bin-row');area.appendChild(binsRow);
 const binEls={};p.bins.forEach(b=>{const be=el('div','bin',`<div class="bl">${b.e} ${b.n}</div><div class="bin-items"></div>`);binEls[b.id]=be;binsRow.appendChild(be);
  be.onclick=()=>{if(!sel)return;if(sel.bin===b.id){be.querySelector('.bin-items').appendChild(sel.el);sel.el.style.fontSize='clamp(20px,4vh,30px)';sfx('good');sel=null;left--;if(left<=0)setTimeout(done,600)}
   else{sfx('oops');speak(p.hint||'זה לא המקום. נסי סל אחר');be.classList.add('over');setTimeout(()=>be.classList.remove('over'),900)}}});
 const pool=el('div','sort-pool');area.appendChild(pool);let left=items.length;
 items.forEach(it=>{const ie=el('button','sort-item',it.e);pool.appendChild(ie);
  ie.onclick=()=>{if(sel&&sel.el===ie){sel=null;ie.style.borderColor='#e3d7fa';return}
   if(sel)sel.el.style.borderColor='#e3d7fa';sel={el:ie,bin:it.bin};ie.style.borderColor='#63c76a';sfx('tick')}})}},
// ספירה: להכניס n פריטים לתיק
countTap:{run:(area,p,done)=>{let count=0;
 const bag=el('div','drop-target',p.bag);area.appendChild(bag);
 const cnt=el('div','price-tag','0 / '+p.n);area.appendChild(cnt);
 const row=el('div','opt-row');area.appendChild(row);
 for(let i=0;i<p.n+2;i++){const b=el('button','opt-btn',p.item);row.appendChild(b);
  b.onclick=()=>{if(count>=p.n)return;b.style.display='none';count++;cnt.textContent=count+' / '+p.n;speak(''+count);sfx('tick');
   if(count===p.n){sfx('good');confettiBurst(6);setTimeout(done,800)}}}}},
// סידור בסדר הנכון
order:{run:(area,p,done)=>{let next=0;const cards=shuffle(p.cards.map((c,i)=>({e:c.e,n:c.n,i})));
 const slots=el('div','order-row');area.appendChild(slots);
 p.cards.forEach(()=>{slots.appendChild(el('div','order-slot',''))});
 const row=el('div','opt-row');area.appendChild(row);
 cards.forEach(c=>{const b=el('button','opt-btn',c.e+`<small>${c.n}</small>`);row.appendChild(b);
  b.onclick=()=>{
   if(c.i===next){slots.children[next].textContent=c.e;slots.children[next].classList.add('filled');b.disabled=true;b.style.opacity=.35;sfx('good');next++;speak(c.n);
    if(next>=p.cards.length){confettiBurst(6);setTimeout(done,700)}}
   else{sfx('oops');b.classList.add('hint');setTimeout(()=>b.classList.remove('hint'),1300);speak(p.hint||'מה בא קודם?')}}
 })}
},
// חזרה על רצף תנועות
simon:{run:(area,p,done)=>{const seq=p.seq;const btns=SIMON_MOVES.map(m=>{const b=el('button','simon-btn',m);b.dataset.m=m;return b});
 const row=el('div','simon-seq');btns.forEach(b=>row.appendChild(b));area.appendChild(row);
 let phase='show',idx=0;
 const lit=(m,ms)=>{const b=btns.find(x=>x.dataset.m===m);b.classList.add('lit');sfx('tick');setTimeout(()=>b.classList.remove('lit'),ms||450)};
 const show=()=>{phase='show';speak('עקבי אחרי!');seq.forEach((m,i)=>setTimeout(()=>{lit(m);if(i===seq.length-1)setTimeout(()=>{phase='play';idx=0;speak('עכשיו תורך!')},600)},700*(i+1)))};
 btns.forEach(b=>b.onclick=()=>{if(phase!=='play')return;const m=b.dataset.m;lit(m);
  if(m===seq[idx]){idx++;if(idx>=seq.length){phase='done';sfx('good');confettiBurst(6);setTimeout(done,650)}}
  else{phase='wait';sfx('oops');speak('כמעט! נראה שוב');setTimeout(show,1300)}});
 setTimeout(show,600)}},
// סיפור עם בחירות
story:{run:(area,p,done)=>{let i=0;
 const txt=el('div','story-text');area.appendChild(txt);const col=el('div','choice-col');area.appendChild(col);
 const step=()=>{col.innerHTML='';const s=STORIES[i];txt.textContent=s.t;speak(s.t);
  s.o.forEach(o=>{const b=el('button','choice-btn',o[0]+' '+o[1]);col.appendChild(b);
   b.onclick=()=>{col.innerHTML='';txt.textContent=o[2];speak(o[2]);sfx('good');i++;
    if(i>=p.points||i>=STORIES.length){confettiBurst(6);setTimeout(done,2200)}else setTimeout(step,2400)}})};
 step()}},
// בחירה שנשמרת (תלבושת, תאורה, שיר, מתכון, פלסטר, טלאי)
choiceSave:{run:(area,p,done)=>{const groups=p.groups;let gi=0;const picked={};
 const title=el('div','price-tag');area.appendChild(title);const row=el('div','opt-row');area.appendChild(row);
 const render=()=>{if(gi>=groups.length){Object.assign(STATE.choices,picked);saveState();sfx('good');confettiBurst(6);setTimeout(done,600);return}
  const g=groups[gi];title.textContent=g.q;speak(g.q);row.innerHTML='';
  g.opts.forEach(o=>{const b=el('button','opt-btn',(o.e||'')+(o.c?`<span class="light-dot" style="background:${o.c}"></span>`:'')+(o.n?`<small>${o.n}</small>`:''));row.appendChild(b);
   b.onclick=()=>{picked[g.key]=o.v;sfx('tick');[...row.children].forEach(x=>x.classList.remove('picked'));b.classList.add('picked');gi++;setTimeout(render,400)}})};
 render()}},
// קצב: מקש בזמן שהנקודה באזור
rhythm:{run:(area,p,done)=>{const beats=p.beats;let cur=0,hits=0;
 const meter=el('div','applause-meter'),mfill=el('div','applause-fill');meter.appendChild(mfill);area.appendChild(meter);
 const hitTxt=el('div','rhythm-hit-text','');area.appendChild(hitTxt);
 const track=el('div','rhythm-track');track.appendChild(el('div','rhythm-zone'));
 const dot=el('div','rhythm-dot');track.appendChild(dot);area.appendChild(track);
 const tapBtn=el('button','big-btn','🎵 מקש!');area.appendChild(tapBtn);
 let running=true,x=0,dir=1,zoneL=0,zoneR=0;
 const w=()=>track.clientWidth;const zw=76;
 const loop=()=>{if(!running)return;x+=dir*p.speed;if(x<=0){x=0;dir=1}if(x>=w()-44){x=w()-44;dir=-1}
  dot.style.left=x+'px';const W=w();zoneL=W/2-zw/2;zoneR=W/2+zw/2-44;requestAnimationFrame(loop)};
 requestAnimationFrame(loop);
 tapBtn.onclick=()=>{if(cur>=beats)return;cur++;const inZone=x>=zoneL-10&&x<=zoneR+10;
  if(inZone){hits++;sfx('note'+(1+(hits%4)));hitTxt.textContent='יופי! 🎶';hitTxt.style.color='#43a047';floaty('🎵')}
  else{sfx('oops');hitTxt.textContent='קצת מוקדם או מאוחר';hitTxt.style.color='#e0509b'}
  mfill.style.width=(hits/beats*100)+'%';
  if(cur>=beats){running=false;tapBtn.disabled=true;
   const great=hits>=Math.ceil(beats*.6);sfx(great?'applause':'good');confettiBurst(great?14:6);
   speak(great?'מחיאות כפיים! איזו הופעה!':'כל הכבוד על הניסיון!');setTimeout(done,1600)}}}},
// עודף: הלקוח שילם 10, צריך להחזיר
change:{run:(area,p,done)=>{const need=10-p.price;let given=0;
 area.appendChild(el('div','price-tag',`מחיר: ${p.price} 🪙 · שילמו: 10 🪙`));
 const hand=el('div','drop-target','🖐️');area.appendChild(hand);
 const cnt=el('div','price-tag','החזרת: 0');area.appendChild(cnt);
 const row=el('div','coin-row');area.appendChild(row);
 for(let i=0;i<10;i++){const b=el('button','coin','🪙');row.appendChild(b);
  b.onclick=()=>{if(b.classList.contains('given'))return;given++;
   if(given>need){sfx('oops');speak('זה יותר מדי! נסי לספור שוב');given--;return}
   b.classList.add('given');cnt.textContent='החזרת: '+given;speak(''+given);sfx('tick');
   if(given===need){sfx('good');confettiBurst(6);speak('בדיוק! עודף מושלם');setTimeout(done,900)}}}}},
// חלוקה שווה בשווה
share:{run:(area,p,done)=>{const perKid=p.total/p.kids;let left=p.total;
 const kidsRow=el('div','share-kids');area.appendChild(kidsRow);const kids=[];
 for(let k=0;k<p.kids;k++){const ke=el('div','share-kid',`<div class="ke">${p.kidEmojis[k]}</div><div class="got"></div>`);kidsRow.appendChild(ke);kids.push({el:ke,got:0});
  ke.onclick=()=>{if(!sel)return;sel.el.remove();kids[k].got++;left--;sel=null;
   ke.querySelector('.got').appendChild(el('span','',p.item));sfx('tick');
   if(left===0){const ok=kids.every(kk=>kk.got===perKid);
    if(ok){sfx('good');confettiBurst(8);speak('שווה בשווה! כולם שמחים');setTimeout(done,900)}
    else{sfx('oops');speak('עוד לא שווה לכולם. נסי להעביר');/* מאפשרים להחזיר */}}}} 
 const pool=el('div','share-pool');area.appendChild(pool);let sel=null;
 for(let i=0;i<p.total;i++){const ie=el('button','share-item',p.item);pool.appendChild(ie);
  ie.onclick=()=>{if(sel&&sel.el===ie){sel=null;ie.style.borderColor='#e3d7fa';return}
   if(sel)sel.el.style.borderColor='#e3d7fa';sel={el:ie};ie.style.borderColor='#63c76a';sfx('tick')}}}},
// מדידת חום: להחזיק את המדחום
temp:{run:(area,p,done)=>{let prog=0,timer=null;
 const face=el('div','sparkle-goal','😐');area.appendChild(face);
 const track=el('div','progress-track'),fill=el('div','progress-fill');track.appendChild(fill);area.appendChild(track);
 const th=el('button','opt-btn','🌡️');area.appendChild(th);
 const start=()=>{if(timer)return;sfx('tick');timer=setInterval(()=>{prog=Math.min(100,prog+4);fill.style.width=prog+'%';
  if(prog>=100){clearInterval(timer);timer=null;face.textContent='😊';sfx('good');speak('החום בסדר גמור!');confettiBurst(6);setTimeout(done,800)}},70)};
 const stop=()=>{if(timer&&prog<100){clearInterval(timer);timer=null}};
 th.addEventListener('pointerdown',start);addEventListener('pointerup',stop)}},
// שן מתנדנדת: מקשים בעדינות עד שהיא נושרת לכוסית
wobbly:{run:(area,p,done)=>{let taps=0;
 const tooth=el('div','sparkle-goal','🦷');tooth.classList.add('tooth','wobbly');area.appendChild(tooth);
 const cup=el('div','drop-target','🥤');area.appendChild(cup);
 tooth.onclick=()=>{taps++;sfx('tick');tooth.style.transform=`rotate(${taps%2?14:-14}deg) scale(${1+taps*.06})`;
  speak(['עוד קצת...','כמעט...','!'][Math.min(taps-1,2)]||'');
  if(taps>=3){tooth.classList.remove('wobbly');tooth.style.transition='all .8s';tooth.style.transform='translateY(120px) scale(.5)';tooth.style.opacity='0';
   setTimeout(()=>{cup.textContent='🥤🦷';sfx('sparkle');confettiBurst(10);speak('השן נשרה לבד! היא הייתה מוכנה לצאת');setTimeout(done,1400)},750)}}}},
// קציצה: מקשים על הירקות
chop:{run:(area,p,done)=>{let left=p.n;
 const row=el('div','opt-row');area.appendChild(row);
 sample(p.veggies,p.n).forEach(v=>{const b=el('button','opt-btn',v);row.appendChild(b);
  b.onclick=()=>{b.textContent='🥣';b.disabled=true;sfx('chop');floaty('✨');left--;if(left<=0){sfx('good');confettiBurst(6);setTimeout(done,600)}}})}},
// מציאת פריטים על המדף לפי רשימה
find:{run:(area,p,done)=>{const need=p.list.slice();let left=need.length;
 const listEl=el('div','price-tag','הרשימה: '+need.join(' '));area.appendChild(listEl);
 const row=el('div','opt-row');area.appendChild(row);
 shuffle(p.pool).forEach(it=>{const b=el('button','opt-btn',it);row.appendChild(b);
  b.onclick=()=>{const i=need.indexOf(it);if(i>=0){need.splice(i,1);b.disabled=true;b.classList.add('picked');left--;sfx('good');
   listEl.textContent='הרשימה: '+(need.join(' ')||'✔️');if(left<=0){confettiBurst(6);setTimeout(done,650)}}
  else{sfx('oops');b.classList.add('hint');setTimeout(()=>b.classList.remove('hint'),1200)}}})}}
};
