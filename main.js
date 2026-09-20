const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const ui={cash:document.getElementById('cash'),mission:document.getElementById('mission'),heat:document.getElementById('heat'),box:document.getElementById('missionBox'),text:document.getElementById('missionText'),toast:document.getElementById('toast'),loading:document.getElementById('loading')};
const DPR=Math.min(devicePixelRatio||1,2);
let W=innerWidth,H=innerHeight;
function resize(){W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();

const keys=new Set();
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase()); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault(); if(e.key.toLowerCase()==='e') startMission(); if(e.key.toLowerCase()==='r') reset()});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key.toLowerCase(); const on=e=>{e.preventDefault();keys.add(k)};const off=e=>{e.preventDefault();keys.delete(k)};b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off,{passive:false});b.addEventListener('touchcancel',off,{passive:false});b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off)});
document.getElementById('action').addEventListener('pointerdown',e=>{e.preventDefault();action()});

const world={w:3200,h:2400};
const roadsX=[280,760,1240,1720,2200,2680], roadsY=[260,700,1140,1580,2020];
const buildings=[];
const trees=[];
for(let ix=0;ix<roadsX.length-1;ix++)for(let iy=0;iy<roadsY.length-1;iy++){
  const x=roadsX[ix]+72,y=roadsY[iy]+72,w=roadsX[ix+1]-roadsX[ix]-144,h=roadsY[iy+1]-roadsY[iy]-144;
  if(w>60&&h>60) buildings.push({x,y,w,h,c:((ix+iy)%3)+1});
}
for(let i=0;i<120;i++){const x=90+Math.random()*(world.w-180),y=90+Math.random()*(world.h-180);if(isRoad(x,y))continue;trees.push({x,y,r:5+Math.random()*5})}
function isRoad(x,y){return roadsX.some(rx=>Math.abs(x-rx)<60)||roadsY.some(ry=>Math.abs(y-ry)<60)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function rectHitCircle(r,c){const x=clamp(c.x,r.x,r.x+r.w),y=clamp(c.y,r.y,r.y+r.h);return (c.x-x)**2+(c.y-y)**2<(c.r||0)**2}

const player={x:430,y:410,r:13,angle:0,speed:2.6,inCar:false,health:100,cash:0};
const car={x:480,y:410,w:34,h:18,angle:0,speed:0,max:7,occupied:false};
let pedestrians=[],traffic=[],police=[];
for(let i=0;i<42;i++)pedestrians.push({x:100+Math.random()*3000,y:100+Math.random()*2200,dir:Math.random()*Math.PI*2,spd:.45+Math.random()*.35,r:5});
for(let i=0;i<18;i++){const horizontal=Math.random()>.5;const road=horizontal?roadsY[Math.floor(Math.random()*roadsY.length)]:roadsX[Math.floor(Math.random()*roadsX.length)];traffic.push({x:horizontal?Math.random()*world.w:road,y:horizontal?road:Math.random()*world.h,horizontal,dir:Math.random()>.5?1:-1,spd:1.2+Math.random()*1.4,c:Math.floor(Math.random()*4)})}

const missions=[
 {name:'Quick Pickup',x:1240,y:700,reward:150},
 {name:'Night Run',x:2200,y:1580,reward:250},
 {name:'Drop Point',x:760,y:2020,reward:325},
 {name:'Warehouse Deal',x:2680,y:1140,reward:500}
];
let currentMission=null,missionStage='none',missionDone=0;
let camera={x:0,y:0},last=performance.now(),toastTimer=0;

function reset(){Object.assign(player,{x:430,y:410,angle:0,speed:2.6,inCar:false,health:100,cash:0});Object.assign(car,{x:480,y:410,angle:0,speed:0,occupied:false});currentMission=null;missionStage='none';missionDone=0;police=[];showToast('City reset')}
function startMission(){if(currentMission||player.inCar)return;currentMission=missions[missionDone%missions.length];missionStage='go';ui.box.classList.remove('hidden');ui.text.textContent=currentMission.name+' — reach the yellow marker';ui.mission.textContent=currentMission.name;showToast('Mission started')}
function action(){if(currentMission===null)startMission();else toggleCar()}

function toggleCar(){if(player.inCar){player.inCar=false;car.occupied=false;player.x=car.x+26;player.y=car.y+4;car.speed=0;showToast('On foot');return}
if(Math.hypot(player.x-car.x,player.y-car.y)<55){player.inCar=true;car.occupied=true;showToast('Vehicle entered')}}

function showToast(t){ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1500)}

function pressed(...names){return names.some(n=>keys.has(n.toLowerCase()))}
function forwardInput(){return pressed('w','arrowup')}
function backInput(){return pressed('s','arrowdown')}
function leftInput(){return pressed('a','arrowleft')}
function rightInput(){return pressed('d','arrowright')}

function blocked(x,y,r){if(x<r||y<r||x>world.w-r||y>world.h-r)return true;return buildings.some(b=>rectHitCircle(b,{x,y,r}))}

function spawnPolice(){if(police.length>=6)return;const a=Math.random()*Math.PI*2;const d=450+Math.random()*250;police.push({x:clamp(player.x+Math.cos(a)*d,50,world.w-50),y:clamp(player.y+Math.sin(a)*d,50,world.h-50),spd:1.8+Math.random()*.8})}
function updatePolice(){const wanted=police.length>0?Math.min(5,Math.ceil(police.length/1.5)):0;ui.heat.textContent='★'.repeat(wanted)+'☆'.repeat(5-wanted);for(const p of police){const a=Math.atan2(player.y-p.y,player.x-p.x);p.x+=Math.cos(a)*p.spd;p.y+=Math.sin(a)*p.spd;if(Math.hypot(p.x-player.x,p.y-player.y)<24){player.health-=0.18;if(player.health<1){showToast('Busted');reset();return}}}}
function checkMission(){if(!currentMission)return; if(dist(player,currentMission)<70){player.cash+=currentMission.reward;missionDone++;showToast('Mission complete +$'+currentMission.reward);currentMission=null;missionStage='none';ui.box.classList.add('hidden');ui.mission.textContent='FREE ROAM'}}

function update(dt){
  const f=forwardInput(),b=backInput(),l=leftInput(),r=rightInput();
  if(player.inCar){
    if(f)car.speed=Math.min(car.max,car.speed+.22*dt);
    if(b)car.speed=Math.max(-car.max*.45,car.speed-.18*dt);
    car.speed*=Math.pow(.985,dt);
    if(l)car.angle-=.045*dt*(Math.abs(car.speed)/car.max+.2);
    if(r)car.angle+=.045*dt*(Math.abs(car.speed)/car.max+.2);
    const nx=car.x+Math.cos(car.angle)*car.speed*dt*1.7,ny=car.y+Math.sin(car.angle)*car.speed*dt*1.7;
    if(!blocked(nx,ny,16)){car.x=nx;car.y=ny}else{car.speed*=-.25}
    player.x=car.x;player.y=car.y;player.angle=car.angle;
  }else{
    let dx=(r?1:0)-(l?1:0),dy=(b?1:0)-(f?1:0);const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
    const s=player.speed*dt*1.7,nx=player.x+dx*s,ny=player.y+dy*s;
    if(!blocked(nx,ny,player.r)){player.x=nx;player.y=ny}
    if(dx||dy)player.angle=Math.atan2(dy,dx)
  }
  for(const p of pedestrians){p.x+=Math.cos(p.dir)*p.spd*dt;p.y+=Math.sin(p.dir)*p.spd*dt;if(p.x<30||p.x>world.w-30||p.y<30||p.y>world.h-30)p.dir+=Math.PI}
  for(const t of traffic){if(t.horizontal)t.x+=t.dir*t.spd*dt;else t.y+=t.dir*t.spd*dt;if(t.x<-50)t.x=world.w+50;if(t.x>world.w+50)t.x=-50;if(t.y<-50)t.y=world.h+50;if(t.y>world.h+50)t.y=-50}
  if(player.inCar && Math.abs(car.speed)>4.5 && Math.random()<.0009*dt)spawnPolice();
  updatePolice();checkMission();
  camera.x+=(player.x-W/2-camera.x)*.12;camera.y+=(player.y-H/2-camera.y)*.12;
  camera.x=clamp(camera.x,0,world.w-W);camera.y=clamp(camera.y,0,world.h-H);
  ui.cash.textContent='$'+Math.floor(player.cash); 
}

function worldToScreen(x,y){return{x:x-camera.x,y:y-camera.y}}
function drawRoads(){
 ctx.fillStyle='#6f737d';ctx.fillRect(0,0,W,H);
 for(const x of roadsX){const sx=x-camera.x-56;ctx.fillStyle='#272b33';ctx.fillRect(sx,0,112,H);ctx.fillStyle='rgba(255,210,80,.55)';for(let y=-30;y<H+60;y+=54){ctx.fillRect(x-camera.x-2,y,4,26)}}
 for(const y of roadsY){const sy=y-camera.y-56;ctx.fillStyle='#272b33';ctx.fillRect(0,sy,W,112);ctx.fillStyle='rgba(255,210,80,.55)';for(let x=-30;x<W+60;x+=54){ctx.fillRect(x,y-camera.y-2,26,4)}}
}
function drawCity(){
 ctx.fillStyle='#777d86';ctx.fillRect(0,0,W,H);
 drawRoads();
 for(const b of buildings){const s=worldToScreen(b.x,b.y);ctx.fillStyle=['#2a2f39','#313740','#242b34'][b.c-1];ctx.fillRect(s.x,s.y,b.w,b.h);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.strokeRect(s.x+.5,s.y+.5,b.w-1,b.h-1);
   ctx.fillStyle='rgba(255,214,95,.06)';for(let x=s.x+16;x<s.x+b.w-8;x+=28)for(let y=s.y+14;y<s.y+b.h-8;y+=24)ctx.fillRect(x,y,7,5)}
 for(const t of trees){const s=worldToScreen(t.x,t.y);if(s.x<-20||s.y<-20||s.x>W+20||s.y>H+20)continue;ctx.fillStyle='#1c5b35';ctx.beginPath();ctx.arc(s.x,s.y,t.r+2,0,7);ctx.fill();ctx.fillStyle='#2e874a';ctx.beginPath();ctx.arc(s.x-2,s.y-2,t.r,0,7);ctx.fill()}
 for(const t of traffic){const s=worldToScreen(t.x,t.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(t.horizontal?(t.dir>0?0:Math.PI):(t.dir>0?Math.PI/2:-Math.PI/2));ctx.fillStyle=['#3e7bd6','#cb3a3a','#d4a72c','#6a5cbd'][t.c];ctx.fillRect(-15,-8,30,16);ctx.fillStyle='#a7bfd1';ctx.fillRect(-7,-6,11,4);ctx.restore()}
 for(const p of pedestrians){const s=worldToScreen(p.x,p.y);ctx.fillStyle='#e4c6a8';ctx.beginPath();ctx.arc(s.x,s.y,5,0,7);ctx.fill();ctx.strokeStyle='#111';ctx.stroke()}
 if(currentMission){const s=worldToScreen(currentMission.x,currentMission.y);const pulse=12+Math.sin(performance.now()/160)*4;ctx.strokeStyle='rgba(255,211,78,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,pulse,0,7);ctx.stroke();ctx.fillStyle='rgba(255,211,78,.8)';ctx.fillRect(s.x-3,s.y-3,6,6)}
 for(const p of police){const s=worldToScreen(p.x,p.y);ctx.fillStyle='#dfe5ec';ctx.fillRect(s.x-11,s.y-7,22,14);ctx.fillStyle='#2d5bd6';ctx.fillRect(s.x-8,s.y-7,6,4);ctx.fillStyle='#d73b45';ctx.fillRect(s.x+2,s.y-7,6,4)}
 if(player.inCar){const s=worldToScreen(car.x,car.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(car.angle);ctx.fillStyle='#f0bf37';ctx.fillRect(-17,-9,34,18);ctx.fillStyle='#16202b';ctx.fillRect(-7,-7,13,5);ctx.restore()}
 else{const s=worldToScreen(player.x,player.y);ctx.fillStyle='#f2d1b0';ctx.beginPath();ctx.arc(s.x,s.y,9,0,7);ctx.fill();ctx.fillStyle='#e0b33d';ctx.fillRect(s.x-7,s.y+6,14,8)}
}
function drawMinimap(){const size=Math.min(165,W*.25),x=W-size-18,y=18;ctx.fillStyle='rgba(8,10,14,.86)';ctx.fillRect(x,y,size,size);ctx.strokeStyle='rgba(255,255,255,.14)';ctx.strokeRect(x+.5,y+.5,size-1,size-1);const sx=size/world.w,sy=size/world.h;for(const rx of roadsX){ctx.fillStyle='#3a3f48';ctx.fillRect(x+(rx-56)*sx,y,112*sx,size)}for(const ry of roadsY){ctx.fillStyle='#3a3f48';ctx.fillRect(x,y+(ry-56)*sy,size,112*sy)}if(currentMission){ctx.fillStyle='#ffd34e';ctx.fillRect(x+currentMission.x*sx-2,y+currentMission.y*sy-2,4,4)}ctx.fillStyle='#fff';ctx.fillRect(x+player.x*sx-2,y+player.y*sy-2,5,5)}
function loop(now){const dt=Math.min(2,(now-last)/16.67);last=now;update(dt);drawCity();drawMinimap();requestAnimationFrame(loop)}
setTimeout(()=>{ui.loading.style.opacity='0';setTimeout(()=>ui.loading.remove(),550)},1000);
requestAnimationFrame(loop);