import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const ui = {
  loading: document.getElementById('loading'),
  menu: document.getElementById('menu'),
  hud: document.getElementById('hud'),
  cash: document.getElementById('cash'),
  health: document.getElementById('health'),
  armor: document.getElementById('armor'),
  heat: document.getElementById('heat'),
  mission: document.getElementById('mission'),
  weapon: document.getElementById('weapon'),
  ammo: document.getElementById('ammo'),
  prompt: document.getElementById('prompt'),
  objective: document.getElementById('objective'),
  toast: document.getElementById('toast'),
  crosshair: document.getElementById('crosshair'),
  pause: document.getElementById('pause'),
  pauseCard: document.getElementById('pauseCard'),
  touch: document.getElementById('touch')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1118);
scene.fog = new THREE.FogExp2(0x0b1118, 0.012);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 600);
camera.position.set(8, 7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('game').replaceWith(renderer.domElement);
renderer.domElement.id = 'game';
renderer.domElement.setAttribute('aria-label', 'GOMA 3D game');

const hemi = new THREE.HemisphereLight(0x8fa8c7, 0x25301f, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe1ad, 2.0);
sun.position.set(-90, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
scene.add(sun);

const WORLD = 360;
const clock = new THREE.Clock();
const keys = new Set();
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);
const tmp = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();

let started = false;
let paused = true;
let gameTime = 21.3;
let shake = 0;
let toastTimer = 0;
let lastShot = 0;
let cash = 0;
let wanted = 0;
let wantedTimer = 0;
let missionIndex = 0;
let currentMission = null;
let kills = 0;
let mouseDown = false;
let camYaw = 0.65;
let camPitch = 0.43;
let camDistance = 8.5;
let saveTimer = 0;

const input = { x: 0, z: 0, sprint: false, fire: false };
const touchState = { up:false,down:false,left:false,right:false,sprint:false,fire:false };

const weapons = [
  { name:'PISTOL', damage:32, cooldown:280, ammo:90, range:65 },
  { name:'SMG', damage:15, cooldown:95, ammo:180, range:75 },
  { name:'SHOTGUN', damage:68, cooldown:720, ammo:32, range:35 },
  { name:'BAT', damage:45, cooldown:520, ammo:Infinity, range:4.2 },
  { name:'RIFLE', damage:48, cooldown:420, ammo:60, range:100 }
];
let weaponIndex = 0;

const missions = [
  { name:'FIRST CONTACT', objective:'Reach the warehouse and meet the fixer.', x:-70,z:-92, reward:250, type:'reach' },
  { name:'CLEAN HOUSE', objective:'Clear the warehouse perimeter.', x:-70,z:-92, reward:450, type:'clear' },
  { name:'HOT DELIVERY', objective:'Take the package to the harbor.', x:118,z:-112, reward:650, type:'reachHeat' },
  { name:'NO WITNESSES', objective:'Survive the police response.', x:118,z:-112, reward:900, type:'survive' },
  { name:'NIGHT SHIFT', objective:'Reach the nightclub after dark.', x:78,z:76, reward:1200, type:'reach' }
];

const buildings = [];
const npcs = [];
const enemies = [];
const cops = [];
const bullets = [];
const effects = [];
const traffic = [];
const colliders = [];
const interactables = [];

function mat(color, roughness=0.8, metalness=0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
const mats = {
  asphalt: mat(0x20262d),
  road: mat(0x11161b),
  sidewalk: mat(0x6b7072),
  concrete: mat(0x687078),
  brick: mat(0x824e42),
  glass: new THREE.MeshStandardMaterial({color:0x3f7188,roughness:.22,metalness:.18,transparent:true,opacity:.82}),
  grass: mat(0x304b36),
  neon: new THREE.MeshStandardMaterial({color:0xffc928,emissive:0x6b4300,emissiveIntensity:2.8}),
  player: mat(0x2f7ee6),
  skin: mat(0xd49b78),
  enemy: mat(0xc44848),
  police: mat(0xeeeeee),
  tire: mat(0x121212)
};

function box(w,h,d,material,x,y,z,cast=true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  m.position.set(x,y,z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function cyl(r,h,material,x,y,z,segments=12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}

function buildCity() {
  box(WORLD,0.6,WORLD,mats.asphalt,0,-0.3,0,false);
  const roadW = 18;
  for (let i=-3;i<=3;i++) {
    box(roadW,.12,WORLD,mats.road,i*55,.04,0,false);
    box(WORLD,.12,roadW,mats.road,0,.05,i*55,false);
    for (let z=-WORLD/2;z<WORLD/2;z+=18) box(1.2,.03,8,mats.sidewalk,i*55-10,.12,z,false);
    for (let x=-WORLD/2;x<WORLD/2;x+=18) box(8,.03,1.2,mats.sidewalk,x,.12,i*55-10,false);
  }
  const blocks = [
    [-112,-112,44,38,0x78483f],[-45,-112,48,38,0x5b626b],[28,-112,48,38,0x7b6b4c],[103,-112,50,38,0x4b6671],
    [-112,-40,44,38,0x6e5a4d],[-42,-40,48,38,0x555b66],[30,-40,48,38,0x6b4d59],[103,-40,50,38,0x55654f],
    [-112,40,44,38,0x4e6258],[-42,40,48,38,0x795d4a],[30,40,48,38,0x4d5d70],[103,40,50,38,0x69514a],
    [-112,112,44,38,0x5b536d],[-42,112,48,38,0x5e6a57],[30,112,48,38,0x785349],[103,112,50,38,0x4f5f6d]
  ];
  for (const [x,z,w,d,c] of blocks) {
    const floors = 2 + Math.floor(Math.random()*4);
    const h = floors*5.5;
    const b = box(w,h,d,mat(c),x,h/2,z);
    buildings.push(b); colliders.push({x,z,w,d});
    for (let yy=3;yy<h-1;yy+=5) {
      for (let xx=x-w/2+5;xx<x+w/2-2;xx+=9) {
        if (Math.random()>.22) {
          const win=box(3.5,1.5,.12,mats.glass,xx,yy,z-d/2-.08,false);
          win.userData.window=true;
        }
      }
    }
    if (Math.random()>.35) box(w*.82,.5,d*.82,mat(0x30343a),x,h+.3,z,false);
  }
  // Park and harbor identity.
  box(45,.08,45,mats.grass,112,.1,48,false);
  for(let i=0;i<22;i++){
    const x=92+Math.random()*40,z=27+Math.random()*42;
    cyl(.5,5,mat(0x5d3b2b),x,2.5,z,8);
    cyl(3.2,2.5,mat(0x2e6b3d),x,6,z,8);
  }
  box(58,.2,58,mat(0x1c5062),128,.0,-112,false);
  for(let i=0;i<6;i++) box(38,.8,.8,mat(0x754b32),105+i*9,.8,-82,false);

  const labels = [
    ['POLICE HQ',-112,-132,0x426ba8],['GOMA GARAGE',-42,18,0xe0a82e],['SAFEHOUSE',-112,58,0x55a36b],
    ['WAREHOUSE 9',-70,-92,0xc95b55],['NIGHT CLUB',78,76,0xa455d4],['HARBOR',118,-112,0x43a4c5]
  ];
  for(const [name,x,z,color] of labels){
    const sign=box(10,3,.4,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.3}),x,8,z);
    sign.userData.label=name;
    interactables.push({name,x,z,mesh:sign});
  }
  // Street lights.
  for(let x=-165;x<=165;x+=30) for(const z of [-28,28]) {
    cyl(.16,7,mat(0x25292e),x,3.5,z,8);
    const lamp=cyl(.55,.25,mats.neon,x,7,z,12);
    lamp.rotation.x=Math.PI/2;
  }
}

function makeCharacter(color, scale=1) {
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55*scale,1.05*scale,4,8),mat(color));
  body.position.y=1.05*scale; body.castShadow=true; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.38*scale,12,8),mats.skin);
  head.position.y=1.95*scale; head.castShadow=true; g.add(head);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.65*scale,.65*scale,.25*scale),mat(0x171a20));
  pack.position.set(0,1.05*scale,.35*scale); g.add(pack);
  scene.add(g); return g;
}

const player = {
  group: makeCharacter(0x2f7ee6,1),
  pos: new THREE.Vector3(-138,0,-145),
  health:100, armor:50, speed:6.4, sprint:9.2, angle:0,
  inCar:false, vehicle:null
};
player.group.position.copy(player.pos);

function makeCar(color, police=false) {
  const g=new THREE.Group();
  const body=box(2.2,.7,4.2,mat(color,.45,.25),0,.75,0);
  body.castShadow=true; g.add(body);
  const cabin=box(1.75,.75,2.1,new THREE.MeshStandardMaterial({color:0x26323d,roughness:.25,metalness:.2}),0,1.35,-.15);
  cabin.castShadow=true; g.add(cabin);
  for(const x of [-1.0,1.0]) for(const z of [-1.45,1.45]) {
    const w=cyl(.43,.28,mats.tire,x,.42,z,12); w.rotation.z=Math.PI/2; g.add(w);
  }
  if(police){
    box(.75,.22,.35,new THREE.MeshStandardMaterial({color:0x2b65ff,emissive:0x102d80,emissiveIntensity:2}),0,1.85,0,g);
    box(.3,.12,.38,new THREE.MeshStandardMaterial({color:0xff3a48,emissive:0x77101a,emissiveIntensity:2}),-.35,1.86,0,g);
  }
  scene.add(g); return g;
}

const playerCar={group:makeCar(0xd5a82f),pos:new THREE.Vector3(-125,0,-145),speed:0,health:100,angle:0};
playerCar.group.position.copy(playerCar.pos);

function spawnNPC() {
  const g=makeCharacter(Math.random()>.5?0x6b7a92:0xb86d4f,.78);
  const p={group:g,pos:new THREE.Vector3((Math.random()-.5)*300,0,(Math.random()-.5)*300),dir:Math.random()*Math.PI*2,speed:1.2+Math.random(),panic:0};
  p.group.position.copy(p.pos); npcs.push(p);
}
function spawnEnemy(x,z) {
  const g=makeCharacter(0xc44848,.9);
  const e={group:g,pos:new THREE.Vector3(x,0,z),health:70,max:70,speed:2.5,attack:0,dead:false};
  g.position.copy(e.pos); enemies.push(e);
}
function spawnCop() {
  const a=Math.random()*Math.PI*2, d=35+Math.random()*25;
  const g=makeCharacter(0xeeeeee,.9);
  const c={group:g,pos:new THREE.Vector3(player.pos.x+Math.cos(a)*d,0,player.pos.z+Math.sin(a)*d),health:100,max:100,speed:3.2,attack:0};
  c.group.position.copy(c.pos); cops.push(c);
  const car=makeCar(0xeeeeee,true); car.position.copy(c.pos); car.scale.setScalar(.95); c.car=car;
}
function spawnTraffic() {
  const horizontal=Math.random()>.5;
  const g=makeCar([0x3b78b5,0xb44f4f,0x5b9a68,0x9a7a45][Math.floor(Math.random()*4)]);
  const t={group:g,pos:new THREE.Vector3(horizontal?(Math.random()-.5)*320:-55+Math.random()*110,0,horizontal?(-55+Math.random()*110):(Math.random()-.5)*320),horizontal,dir:Math.random()>.5?1:-1,speed:4+Math.random()*3};
  g.position.copy(t.pos); traffic.push(t);
}

function setupWorld() {
  buildCity();
  for(let i=0;i<34;i++)spawnNPC();
  for(let i=0;i<10;i++)spawnTraffic();
  spawnEnemy(-66,-87); spawnEnemy(-74,-98);
}

function toast(text) {
  ui.toast.textContent=text; ui.toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1900);
}
function setWanted(n) {
  wanted=Math.max(0,Math.min(5,wanted+n)); wantedTimer=0; shake=Math.min(1,shake+.12);
  if(wanted>0) while(cops.length<wanted)spawnCop();
}
function damagePlayer(amount) {
  const absorbed=Math.min(player.armor,amount*.55);
  player.armor-=absorbed; player.health-=amount-absorbed;
  shake=Math.min(1,shake+.2);
  if(player.health<=0)respawn();
}
function respawn() {
  player.health=100; player.armor=50; player.pos.set(-138,0,-145);
  player.group.position.copy(player.pos); player.inCar=false; playerCar.group.visible=true; playerCar.health=100;
  wanted=0; cops.splice(0).forEach(c=>scene.remove(c.group,c.car)); enemies.splice(0).forEach(e=>scene.remove(e.group));
  currentMission=null; toast('You were taken out — back to the safehouse'); save();
}

function save() {
  localStorage.setItem('goma3d-save',JSON.stringify({cash,missionIndex,wanted:0,weaponIndex,quality:renderer.getPixelRatio()}));
}
function load() {
  try {
    const s=JSON.parse(localStorage.getItem('goma3d-save')||'null');
    if(s){cash=s.cash||0;missionIndex=s.missionIndex||0;weaponIndex=s.weaponIndex||0;}
  } catch {}
}
load();

function beginGame() {
  started=true; paused=false; ui.menu.classList.add('hidden'); ui.pause.classList.add('hidden');
  renderer.domElement.requestPointerLock?.(); toast('WASD move · Mouse aim · Click fire · E interact');
}
function togglePause(force) {
  if(!started)return;
  paused=force===undefined?!paused:force;
  ui.pause.classList.toggle('hidden',!paused);
  if(paused)document.exitPointerLock?.(); else renderer.domElement.requestPointerLock?.();
}
function fire() {
  if(paused||!started)return;
  const w=weapons[weaponIndex],now=performance.now();
  if(now-lastShot<w.cooldown || (w.ammo!==Infinity&&w.ammo<=0))return;
  lastShot=now;if(w.ammo!==Infinity)w.ammo--;
  if(w.name==='BAT'){
    for(const target of [...enemies,...cops]) if(target.pos.distanceTo(player.pos)<w.range){target.health-=w.damage;target.hit=true;}
    setWanted(.15); return;
  }
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const origin=camera.getWorldPosition(new THREE.Vector3());
  const dir=raycaster.ray.direction.clone();
  bullets.push({origin,dir,life:1.2,damage:w.damage,mesh:null});
  const flash=cyl(.08,.5,mats.neon,origin.x,origin.y,origin.z,8); flash.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir); bullets[bullets.length-1].mesh=flash;
  setWanted(.12); shake=Math.min(1,shake+.035);
}

function interact() {
  if(!started)return beginGame();
  if(player.inCar) {
    player.inCar=false; player.group.visible=true; player.pos.copy(playerCar.pos).add(new THREE.Vector3(2,0,0)); player.group.position.copy(player.pos); toast('Exited vehicle'); return;
  }
  if(player.pos.distanceTo(playerCar.pos)<5) {
    player.inCar=true; player.group.visible=false; playerCar.group.visible=true; toast('Vehicle entered — WASD drive · E exit'); return;
  }
  const near=interactables.find(i=>Math.hypot(player.pos.x-i.x,player.pos.z-i.z)<8);
  if(near){toast(near.name);return;}
  if(!currentMission && missionIndex<missions.length) startMission();
}

function startMission() {
  currentMission=missions[missionIndex];
  ui.objective.textContent=currentMission.objective;
  ui.mission.textContent=currentMission.name;
  toast('Mission started: '+currentMission.name);
  if(currentMission.type==='clear'){
    for(let i=0;i<4;i++)spawnEnemy(currentMission.x+(Math.random()-.5)*16,currentMission.z+(Math.random()-.5)*16);
  }
}
function completeMission() {
  const m=currentMission; cash+=m.reward; missionIndex++;
  currentMission=null; ui.mission.textContent='FREE ROAM'; ui.objective.textContent='Explore the city. Find the next job.';
  toast('MISSION COMPLETE  +$'+m.reward); save();
}

function updateInput() {
  const k=(name)=>keys.has(name);
  input.x=(k('d')?1:0)-(k('a')?1:0)+(touchState.right?1:0)-(touchState.left?1:0);
  input.z=(k('s')?1:0)-(k('w')?1:0)+(touchState.down?1:0)-(touchState.up?1:0);
  input.sprint=k('shift')||touchState.sprint;
  input.fire=mouseDown||touchState.fire;
}
function blocked(x,z,r=1.2){
  if(x<-174+r||x>174-r||z<-174+r||z>174-r)return true;
  for(const b of colliders){
    if(x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r)return true;
  }
  return false;
}
function tryMove(pos,dx,dz,r){
  const nx=pos.x+dx,nz=pos.z+dz;
  if(!blocked(nx,pos.z,r))pos.x=nx;
  if(!blocked(pos.x,nz,r))pos.z=nz;
}
function movePlayer(dt) {
  if(player.inCar){
    const car=playerCar;
    if(input.z<0)car.speed=Math.min(18,car.speed+18*dt);
    if(input.z>0)car.speed=Math.max(-7,car.speed-22*dt);
    car.speed*=Math.pow(.93,dt*60);
    car.angle+=(input.x*1.8*dt)*(Math.abs(car.speed)/12+.25);
    const f=new THREE.Vector3(Math.sin(car.angle),0,Math.cos(car.angle));
    const dx=f.x*car.speed*dt,dz=f.z*car.speed*dt;
    if(!blocked(car.pos.x+dx,car.pos.z,2.2)&&!blocked(car.pos.x,car.pos.z+dz,2.2))car.pos.addScaledVector(f,car.speed*dt);
    else {car.speed*=-.25;car.health-=Math.abs(car.speed)*.08;shake=Math.min(1,shake+.08);}
    car.group.position.copy(car.pos);car.group.rotation.y=car.angle;
    player.pos.copy(car.pos);
    if(Math.abs(car.speed)>12)setWanted(.01);
    return;
  }
  const v=new THREE.Vector3(input.x,0,input.z);
  if(v.lengthSq()>1)v.normalize();
  const speed=input.sprint?player.sprint:player.speed;
  const camForward=new THREE.Vector3(Math.sin(camYaw),0,Math.cos(camYaw));
  const camRight=new THREE.Vector3(camForward.z,0,-camForward.x);
  const move=camRight.multiplyScalar(v.x).add(camForward.multiplyScalar(v.z));
  if(move.lengthSq()>0){
    move.normalize();
    tryMove(player.pos,move.x*speed*dt,move.z*speed*dt,.9);
    player.angle=Math.atan2(move.x,move.z);
    player.group.rotation.y=player.angle;
  }
  player.pos.x=THREE.MathUtils.clamp(player.pos.x,-174,174);player.pos.z=THREE.MathUtils.clamp(player.pos.z,-174,174);
  player.group.position.copy(player.pos);
}

function updateNPCs(dt) {
  for(const p of npcs){
    const d=p.pos.distanceTo(player.pos);
    if(wanted>0&&d<28){p.panic=2.5; p.dir=Math.atan2(p.pos.x-player.pos.x,p.pos.z-player.pos.z);}
    if(p.panic>0){p.panic-=dt;p.pos.x+=Math.sin(p.dir)*p.speed*2.4*dt;p.pos.z+=Math.cos(p.dir)*p.speed*2.4*dt;}
    else {p.dir+=Math.sin(performance.now()*.0004+p.pos.x)*.008;p.pos.x+=Math.sin(p.dir)*p.speed*dt;p.pos.z+=Math.cos(p.dir)*p.speed*dt;}
    p.group.position.copy(p.pos);p.group.rotation.y=p.dir;
  }
}
function updateEnemies(dt) {
  for(const e of [...enemies]){
    const d=e.pos.distanceTo(player.pos);
    if(d<55){
      const dir=player.pos.clone().sub(e.pos).setY(0).normalize();
      if(d>3.2)e.pos.addScaledVector(dir,e.speed*dt);
      else {e.attack-=dt;if(e.attack<=0){damagePlayer(8);e.attack=1;}}
      e.group.rotation.y=Math.atan2(dir.x,dir.z);
    }
    e.group.position.copy(e.pos);
    if(e.health<=0){scene.remove(e.group);enemies.splice(enemies.indexOf(e),1);kills++;cash+=35;}
  }
}
function updateCops(dt) {
  for(const c of [...cops]){
    const d=c.pos.distanceTo(player.pos);
    const dir=player.pos.clone().sub(c.pos).setY(0).normalize();
    c.pos.addScaledVector(dir,c.speed*dt);
    c.group.position.copy(c.pos);c.group.rotation.y=Math.atan2(dir.x,dir.z);
    c.car.position.copy(c.pos);c.car.rotation.y=c.group.rotation.y;
    if(d<3.2){c.attack-=dt;if(c.attack<=0){damagePlayer(10);c.attack=.9;}}
    if(c.health<=0){scene.remove(c.group,c.car);cops.splice(cops.indexOf(c),1);cash+=100;}
  }
}
function updateTraffic(dt) {
  for(const t of traffic){
    if(t.horizontal)t.pos.x+=t.dir*t.speed*dt;else t.pos.z+=t.dir*t.speed*dt;
    if(t.pos.x>180)t.pos.x=-180;if(t.pos.x<-180)t.pos.x=180;
    if(t.pos.z>180)t.pos.z=-180;if(t.pos.z<-180)t.pos.z=180;
    t.group.position.copy(t.pos);t.group.rotation.y=t.horizontal?(t.dir>0?Math.PI/2:-Math.PI/2):(t.dir>0?0:Math.PI);
  }
}
function updateBullets(dt) {
  for(const b of [...bullets]){
    b.origin.addScaledVector(b.dir,55*dt);b.life-=dt;
    if(b.mesh){b.mesh.position.copy(b.origin);b.mesh.scale.y=2;}
    for(const target of [...enemies,...cops]){
      if(b.origin.distanceTo(target.pos.clone().add(new THREE.Vector3(0,1,0)))<2.2){
        target.health-=b.damage;b.life=0;target.hit=true;setWanted(.18);break;
      }
    }
    if(b.life<=0){if(b.mesh)scene.remove(b.mesh);bullets.splice(bullets.indexOf(b),1);}
  }
}
function updateMission(dt) {
  if(!currentMission)return;
  if(playerCar.health<=0){playerCar.health=100;player.inCar=false;player.group.visible=true;player.pos.copy(playerCar.pos).add(new THREE.Vector3(3,0,0));toast('Vehicle disabled — repaired at safehouse');}
  const d=Math.hypot(player.pos.x-currentMission.x,player.pos.z-currentMission.z);
  if(currentMission.type==='reach'&&d<8)completeMission();
  if(currentMission.type==='reachHeat'&&d<8){setWanted(2);currentMission.type='survive';currentMission.objective='Lose the police and reach the safehouse.';currentMission.x=-112;currentMission.z=58;ui.objective.textContent=currentMission.objective;}
  if(currentMission.type==='survive'&&wanted===0&&d<12)completeMission();
  if(currentMission.type==='clear'&&Math.hypot(player.pos.x-currentMission.x,player.pos.z-currentMission.z)<18&&enemies.length===0)completeMission();
  if(currentMission.type==='survive'&&wanted>0){wantedTimer+=dt;if(wantedTimer>12){wanted=0;wantedTimer=0;cops.splice(0).forEach(c=>scene.remove(c.group,c.car));toast('Heat lost');}}
}

function updateCamera(dt) {
  const target=player.inCar?playerCar.pos:player.pos;
  cameraTarget.lerp(target,.12);
  const horizontal=Math.cos(camPitch)*camDistance;
  const desired=new THREE.Vector3(
    target.x+Math.sin(camYaw)*horizontal,
    target.y+2.0+Math.sin(camPitch)*camDistance,
    target.z+Math.cos(camYaw)*horizontal
  );
  if(shake>0){desired.x+=(Math.random()-.5)*shake;desired.y+=(Math.random()-.5)*shake;}
  camera.position.lerp(desired,Math.min(1,dt*8));
  camera.lookAt(target.x,target.y+1.25,target.z);
  shake=Math.max(0,shake-dt*.9);
}

function updateLighting(dt) {
  gameTime=(gameTime+dt*.04)%24;
  const night=gameTime>19||gameTime<6;
  const t=night?0.28:1;
  sun.intensity=1.7*t+.15;
  hemi.intensity=.75*t+.25;
  scene.background.lerp(new THREE.Color(night?0x050912:0x7392ad),dt*.4);
  scene.fog.color.lerp(new THREE.Color(night?0x050912:0x7392ad),dt*.4);
}

function updateHUD() {
  ui.cash.textContent='$'+cash.toLocaleString();
  ui.health.style.width=Math.max(0,player.health)+'%';
  ui.armor.style.width=Math.max(0,player.armor*2)+'%';
  ui.heat.textContent='★'.repeat(Math.ceil(wanted))+'☆'.repeat(5-Math.ceil(wanted));
  ui.weapon.textContent=weapons[weaponIndex].name;
  ui.ammo.textContent=weapons[weaponIndex].ammo===Infinity?'∞':weapons[weaponIndex].ammo;
  ui.mission.textContent=currentMission?currentMission.name:'FREE ROAM';
  let prompt='';
  if(player.inCar)prompt='E  EXIT VEHICLE';
  else if(player.pos.distanceTo(playerCar.pos)<5)prompt='E  ENTER VEHICLE';
  else if(!currentMission&&missionIndex<missions.length)prompt='E  START NEXT JOB';
  ui.prompt.textContent=prompt;
  ui.prompt.classList.toggle('hidden',!prompt);
}

function render() {
  renderer.render(scene,camera);
}
function loop() {
  const dt=Math.min(.033,clock.getDelta());
  updateInput();
  if(started&&!paused){
    movePlayer(dt);updateNPCs(dt);updateEnemies(dt);updateCops(dt);updateTraffic(dt);updateBullets(dt);updateMission(dt);updateLighting(dt);updateCamera(dt);
    saveTimer+=dt;if(saveTimer>15){saveTimer=0;save();}
  }
  updateHUD();render();requestAnimationFrame(loop);
}

function bindHold(id, prop) {
  const el=document.getElementById(id); if(!el)return;
  const on=e=>{e.preventDefault();touchState[prop]=true;}; const off=e=>{e.preventDefault();touchState[prop]=false;};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);
}
bindHold('tUp','up');bindHold('tDown','down');bindHold('tLeft','left');bindHold('tRight','right');bindHold('tSprint','sprint');bindHold('tFire','fire');

addEventListener('keydown',e=>{
  keys.add(e.key.toLowerCase());
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();
  const k=e.key.toLowerCase();
  if(k==='escape')togglePause();
  if(k==='e')interact();
  if(k==='f')fire();
  if(k==='m')toast('Map: Downtown · Warehouse · Harbor · Nightclub · Police HQ');
  if(/^[1-5]$/.test(k)){weaponIndex=Number(k)-1;toast('Equipped '+weapons[weaponIndex].name);}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('mousedown',e=>{if(e.button===0){mouseDown=true;if(started&&!paused)fire();}});
addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;});
addEventListener('mousemove',e=>{
  if(document.pointerLockElement===renderer.domElement&&!paused){camYaw-=e.movementX*.0022;camPitch=THREE.MathUtils.clamp(camPitch-e.movementY*.0018,.22,.72);}
});
addEventListener('wheel',e=>{camDistance=THREE.MathUtils.clamp(camDistance+e.deltaY*.008,5.5,12);},{passive:true});
renderer.domElement.addEventListener('click',()=>{if(started&&!paused)renderer.domElement.requestPointerLock?.();});

document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const a=btn.dataset.action;
  if(a==='play'||a==='continue'||a==='new')beginGame();
  if(a==='settings')toast('Settings: high-quality WebGL preset active');
  if(a==='credits')toast('GOMA — original browser game');
}));
document.querySelectorAll('[data-modal]').forEach(btn=>btn.addEventListener('click',()=>{
  const a=btn.dataset.modal;
  if(a==='resume')togglePause(false);
  if(a==='quit'){togglePause(true);ui.menu.classList.remove('hidden');started=false;}
}));

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
});
setTimeout(()=>{ui.loading.classList.add('loaded');setTimeout(()=>ui.loading.remove(),700);},900);

setupWorld();
loop();
