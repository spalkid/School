(()=>{const c=document.getElementById('c'),x=c.getContext('2d'),W=960,H=540;let keys={},shotCooldown=0,hero={x:90,y:410,vx:0,vy:0,hp:5,ground:false,face:1},cam=0,coins=0,mode='map',t=0,hp=100,phase=1,shots=[],haz=[],parry=0,attack=0,desk=[{x:260,y:365,w:150,h:20},{x:500,y:315,w:150,h:20},{x:760,y:365,w:150,h:20}],floor=460;function down(k,v){keys[k]=v}onkeydown=e=>{down(e.key.toLowerCase(),true);if(e.key===' '){e.preventDefault();jump()}if(e.key.toLowerCase()==='x')keys.attack=true;if(e.key.toLowerCase()==='e'&&mode==='map'&&hero.x>790&&hero.x<930)start()};onkeyup=e=>{down(e.key.toLowerCase(),false);if(e.key.toLowerCase()==='x')keys.attack=false};document.querySelectorAll('[data-k]').forEach(b=>{let k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();down(k,true);if(k==='jump')jump();if(k==='attack')keys.attack=true};b.onpointerup=b.onpointercancel=()=>{down(k,false);if(k==='attack')keys.attack=false}});function jump(){if(hero.ground){hero.vy=-560;hero.ground=false}else if(mode==='fight'&&haz.some(a=>a.parry&&Math.abs(a.x-hero.x)<55&&Math.abs(a.y-hero.y)<70)){parry++;coins++;haz=haz.filter(a=>!a.parry)}}function start(){mode='fight';t=0;hp=100;phase=1;haz=[];shots=[];hero.x=190;hero.y=420;hero.vx=0;hero.vy=0;hero.face=1;cam=0}document.getElementById('fightBtn').onclick=start;document.getElementById('shopBtn').onclick=()=>document.getElementById('shop').style.display='flex';document.getElementById('close').onclick=()=>document.getElementById('shop').style.display='none';document.getElementById('buy').onclick=()=>{if(coins>=3&&hero.hp<5){coins-=3;hero.hp++;document.getElementById('coins').textContent=coins}};function rect(a,b,w,h,col){x.fillStyle=col;x.fillRect(a,b,w,h)}function text(s,a,b,size=22,col='#241923'){x.fillStyle=col;x.font=`bold ${size}px Georgia`;x.fillText(s,a,b)}function update(dt){t+=dt;let l=keys.a||keys.arrowleft||keys.left,r=keys.d||keys.arrowright||keys.right;hero.vx=(r-l)*260;if(hero.vx)hero.face=Math.sign(hero.vx);hero.x=Math.max(20,Math.min(2600,hero.x+hero.vx*dt));hero.vy+=1300*dt;hero.y+=hero.vy*dt;hero.ground=false;let surfaces=[{x:0,y:floor,w:2600,h:100},...desk];for(let p of surfaces)if(hero.x+15>p.x&&hero.x-15<p.x+p.w&&hero.y+38>=p.y&&hero.y+38<=p.y+25&&hero.vy>=0){hero.y=p.y-38;hero.vy=0;hero.ground=true}cam=Math.max(0,Math.min(1700,hero.x-400));if(mode==='fight'){if(hp<50)phase=2;if(hp<22)phase=3;if(Math.random()<dt*(phase===1?0.65:phase===2?1.1:1.5)){let type=phase===1?['laser','flower','button'][Math.floor(Math.random()*3)]:phase===2?['bouncer','laser','flower'][Math.floor(Math.random()*3)]:['egg','concrete'][Math.floor(Math.random()*2)];haz.push({type,x:Math.random()*800+80,y:type==='egg'||type==='concrete'?10:430,vx:(Math.random()-.5)*260,vy:type==='egg'||type==='concrete'?100:0,life:5,parry:type==='flower'||type==='bouncer',warn:1.2})}haz.forEach(a=>{a.life-=dt;a.warn-=dt;if(a.type==='laser'){a.y=445}else{a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.type==='flower'||a.type==='bouncer')a.y=390+Math.sin(t*3+a.x)*60;if(a.type==='egg'||a.type==='concrete')a.vy+=360*dt}});haz=haz.filter(a=>a.life>0&&a.x>-80&&a.x<1040&&a.y<560);shotCooldown-=dt;if(keys.attack&&shotCooldown<=0){shotCooldown=.16;shots.push({x:hero.x+hero.face*25,y:hero.y-105,vx:hero.face*760,life:1.5})}shots.forEach(s=>{s.x+=s.vx*dt;s.life-=dt;if(s.x>700&&s.x<880&&s.y>170&&s.y<360&&s.life>0){hp-=18*dt;s.life=0}});shots=shots.filter(s=>s.life>0);for(let a of haz){if(a.warn<0&&Math.abs(a.x-hero.x)<32&&Math.abs(a.y-hero.y)<45&&hero.ground){hero.hp=Math.max(0,hero.hp-1);a.life=0}}if(hp<=0){mode='map';coins+=5;hero.x=100}}}
function draw(){
x.clearRect(0,0,W,H);
x.save();x.translate(-cam,0);
// Ретро-мультяшный школьный кабинет с глубиной и деталями
if(mode==='map'){
 rect(0,0,2600,H,'#d8c6a4');
 // верхняя стена и панели
 rect(0,0,2600,460,'#d9d0b8');rect(0,0,2600,24,'#49353a');
 rect(0,330,2600,130,'#b58c68');
 for(let i=0;i<26;i++){rect(i*100+4,330,3,130,'#8f684f');rect(i*100+7,330,90,4,'#d2a77b')}
 // кирпичные/штукатурные линии
 for(let y=42;y<320;y+=46){rect(0,y,2600,2,'#c4b99f')}
 // окна с рамами и солнечным светом
 for(let i=0;i<9;i++){let wx=i*280+35;
  rect(wx-9,54,178,194,'#59464a');rect(wx,63,160,178,'#e9d8a8');
  rect(wx+8,71,144,162,'#8db5bd');rect(wx+78,71,7,162,'#f0dfb6');rect(wx+8,148,144,7,'#f0dfb6');
  rect(wx+8,71,144,18,'#b5d0cb');rect(wx+18,90,42,50,'#a4c9c8');rect(wx+95,158,48,65,'#a4c9c8');
  rect(wx-16,246,192,12,'#775342');rect(wx+10,258,8,34,'#65483d');rect(wx+145,258,8,34,'#65483d');
 }
 // плакаты и доски
 for(let i=0;i<7;i++){let px=i*360+205;rect(px,65,115,92,'#654b42');rect(px+6,71,103,80,['#e8d9a8','#c6d9c6','#e3c2a9'][i%3]);
  text(['А + Б','НАША\nШКОЛА','2 × 2','БУДЬ\nСМЕЛЕЕ'][i%4],px+17,108,17,'#55434a');
 }
 // пол и плитка
 rect(0,460,2600,80,'#76594d');for(let i=0;i<52;i++){rect(i*50,460,2,80,'#5d453e');rect(i*50,498,50,2,'#99765e')}
 // потолочные лампы
 for(let i=0;i<13;i++){let lx=i*210+65;rect(lx,12,110,8,'#f6e8bc');rect(lx+8,20,94,3,'#fff3c9')}
 // парты и стулья как платформы
 for(let p of desk){rect(p.x+10,p.y+20,12,74,'#50372f');rect(p.x+p.w-22,p.y+20,12,74,'#50372f');rect(p.x,p.y,p.w,20,'#9b603e');rect(p.x+3,p.y+3,p.w-6,5,'#d39a62');rect(p.x+18,p.y+7,32,3,'#e8bd82');
  rect(p.x+42,p.y+92,68,8,'#68483b');rect(p.x+48,p.y+100,8,28,'#4c3832');rect(p.x+96,p.y+100,8,28,'#4c3832');
 }
 // шкафчики вдоль стены
 for(let i=0;i<8;i++){let lx=i*300+2200;rect(lx,280,52,180,'#647b78');rect(lx+5,286,42,168,'#82958a');rect(lx+35,360,4,7,'#e4c27f');}
 // вход и класс Дениса
 rect(2040,250,310,210,'#553c3a');rect(2052,262,286,198,'#b68a63');rect(2070,278,250,182,'#394e4b');rect(2082,290,226,170,'#a2b5a5');rect(2168,290,8,170,'#5e5148');rect(2290,370,10,10,'#e5bd6f');
 text('КАБИНЕТ № 13',2070,225,24,'#55343a');text('ДЕНИС',2150,340,25,'#fff0ce');
 text('МАГАЗИН',75,310,22,'#6b3439');text('ПАРТЫ — ПЛАТФОРМЫ',300,285,18,'#593c36');
}else{
 // арена босса — тот же кабинет, но камера показывает героя и Дениса вместе
 rect(0,0,W,H,'#d9d0b8');rect(0,0,W,24,'#49353a');rect(0,330,W,130,'#b58c68');
 for(let i=0;i<6;i++){let wx=i*170+25;rect(wx,65,140,165,'#59464a');rect(wx+8,73,124,149,'#8db5bd');rect(wx+68,73,6,149,'#f0dfb6');rect(wx+8,143,124,6,'#f0dfb6')}
 rect(0,460,W,80,'#76594d');for(let i=0;i<20;i++){rect(i*50,460,2,80,'#5d453e');rect(i*50,498,50,2,'#99765e')}
 // школьные парты по бокам
 for(let i=0;i<4;i++){let dx=i*190+30;rect(dx+12,385,10,70,'#50372f');rect(dx+100,385,10,70,'#50372f');rect(dx,370,130,18,'#9b603e');rect(dx+4,373,122,4,'#d39a62')}
 text('ШКОЛЬНЫЙ КАБИНЕТ · БОСС ДЕНИС',25,35,25,'#49353a');
 text('УДЕРЖИВАЙ X — СТРЕЛЬБА',25,62,14,'#7a3439');text('ФАЗА '+phase,820,35,20,'#49353a');
 // Денис на правой стороне арены
 x.save();x.translate(790,0);let bob=Math.sin(t*5)*3;
 x.fillStyle='#3b2930';x.beginPath();x.ellipse(0,354,62,12,0,0,Math.PI*2);x.fill();
 rect(-35,310+bob,25,48,'#343b55');rect(10,310-bob,25,48,'#343b55');
 x.fillStyle='#34242b';x.beginPath();x.ellipse(-20,359+bob,24,10,0,0,Math.PI*2);x.ellipse(26,359-bob,24,10,0,0,Math.PI*2);x.fill();
 x.fillStyle='#f3ead7';x.beginPath();x.moveTo(-48,218+bob);x.quadraticCurveTo(-62,248+bob,-52,326+bob);x.quadraticCurveTo(0,344+bob,52,326+bob);x.lineTo(48,220+bob);x.closePath();x.fill();x.strokeStyle='#4b3434';x.lineWidth=4;x.stroke();
 x.fillStyle='#b84c50';x.beginPath();x.moveTo(-13,220+bob);x.lineTo(0,245+bob);x.lineTo(13,220+bob);x.lineTo(0,290+bob);x.closePath();x.fill();
 for(let by=250;by<315;by+=22){x.fillStyle='#b78d50';x.beginPath();x.arc(0,by+bob,3,0,Math.PI*2);x.fill()}
 x.fillStyle='#d99c72';x.fillRect(-12,198+bob,24,28);x.beginPath();x.ellipse(0,163+bob,43,49,0,0,Math.PI*2);x.fill();x.strokeStyle='#573b35';x.lineWidth=4;x.stroke();
 x.fillStyle='#49352f';x.beginPath();x.moveTo(-42,153+bob);x.quadraticCurveTo(-37,105+bob,2,115+bob);x.quadraticCurveTo(39,111+bob,43,151+bob);x.lineTo(22,140+bob);x.lineTo(6,147+bob);x.lineTo(-12,137+bob);x.lineTo(-30,157+bob);x.closePath();x.fill();
 x.strokeStyle=phase>=2?'#9d3434':'#302a31';x.lineWidth=5;x.strokeRect(-34,151+bob,29,20);x.strokeRect(6,151+bob,29,20);x.beginPath();x.moveTo(-5,160+bob);x.lineTo(6,160+bob);x.stroke();
 x.fillStyle='#28232a';x.beginPath();x.arc(-19,160+bob,3,0,7);x.arc(20,160+bob,3,0,7);x.fill();x.strokeStyle='#633c36';x.lineWidth=3;x.beginPath();x.moveTo(-24,187+bob);x.quadraticCurveTo(0,198+bob,22,185+bob);x.stroke();
 if(phase>=2){x.strokeStyle='#e7ddd0';x.lineWidth=2;x.beginPath();x.moveTo(7,148+bob);x.lineTo(20,166+bob);x.lineTo(13,177+bob);x.stroke()}
 x.restore();text(phase===1?'ДЕНИС':phase===2?'ОЧКИ ТРЕСНУЛИ':'ПОСЛЕДНИЙ ЭТАЖ',680,85,18,'#49353a');
}
// Игрок — заметный мультяшный герой с обводкой, лицом, перчатками и анимацией
let runBob=hero.ground&&Math.abs(hero.vx)>1?Math.sin(t*15)*4:Math.sin(t*3)*1.5;
x.save();x.translate(hero.x,hero.y);x.scale(hero.face||1,1);
// тень
x.fillStyle='#3c2b2b88';x.beginPath();x.ellipse(0,2,24,6,0,0,Math.PI*2);x.fill();
// ноги и обувь
x.strokeStyle='#332b36';x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(-7,-20);x.lineTo(-10+runBob,-3);x.moveTo(7,-20);x.lineTo(11-runBob,-3);x.stroke();
x.fillStyle='#49343b';x.beginPath();x.ellipse(-13,-2,13,6,-.1,0,Math.PI*2);x.ellipse(13,-2,13,6,.1,0,Math.PI*2);x.fill();
// тело в стиле мультяшного героя
x.fillStyle='#e8bd62';x.strokeStyle='#3a2b35';x.lineWidth=4;x.beginPath();x.roundRect(-15,-43,30,29,7);x.fill();x.stroke();
x.fillStyle='#fff0cf';x.beginPath();x.moveTo(-7,-41);x.lineTo(0,-30);x.lineTo(7,-41);x.lineTo(0,-22);x.closePath();x.fill();
// руки и перчатки
x.strokeStyle='#d99c72';x.lineWidth=7;x.beginPath();x.moveTo(-13,-37);x.lineTo(-22,-25+runBob);x.moveTo(13,-37);x.lineTo(22,-25-runBob);x.stroke();
x.fillStyle='#fff0cf';x.strokeStyle='#3a2b35';x.lineWidth=3;x.beginPath();x.arc(-23,-24+runBob,6,0,7);x.arc(23,-24-runBob,6,0,7);x.fill();x.stroke();
// голова и волосы/шапка
x.fillStyle='#e7b18a';x.strokeStyle='#3a2b35';x.lineWidth=4;x.beginPath();x.arc(0,-55,17,0,Math.PI*2);x.fill();x.stroke();
x.fillStyle='#fff0cf';x.beginPath();x.arc(0,-61,17,Math.PI,Math.PI*2);x.fill();x.stroke();
x.fillStyle='#332b36';x.beginPath();x.arc(-6,-56,2.5,0,7);x.arc(6,-56,2.5,0,7);x.fill();x.strokeStyle='#693f3c';x.lineWidth=2;x.beginPath();x.arc(0,-50,5,.2,2.8);x.stroke();
x.restore();
// снаряды и атаки
for(let a of haz){if(a.warn>0){text('!',a.x,a.y-20,28,'#c52d35')}if(a.type==='laser'){rect(0,442,960,8,'#ff3c36');rect(0,438,960,2,'#fff')}else if(a.type==='flower'){x.fillStyle=['#ff6b8b','#ffd34f','#6bd8e8'][Math.floor(a.x)%3];x.beginPath();x.arc(a.x,a.y,15,0,7);x.fill()}else if(a.type==='egg'||a.type==='concrete'){rect(a.x-12,a.y-12,24,24,a.type==='egg'?'#f4e8cb':'#777')}else{x.fillStyle='#ef73aa';x.beginPath();x.arc(a.x,a.y,13,0,7);x.fill()}}
for(let s of shots){rect(s.x,s.y-4,24,8,'#f8e36d');rect(s.x+4,s.y-2,12,3,'#fff6bf')}
x.restore();
if(mode==='fight'){rect(20,50,220,14,'#50343a');rect(20,50,220*hp/100,14,'#b63d45');text('ДЕНИС · '+Math.ceil(hp)+'%',20,88,18);text('ТЫ',Math.max(12,Math.min(250,hero.x-cam-12)),410,13,'#49353a')}
else{text('Монеты: '+coins+'   Жизни: '+hero.hp,20,30,20)}
requestAnimationFrame(loop)}let last=0;function loop(now){let dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw()}loop(0)})();
