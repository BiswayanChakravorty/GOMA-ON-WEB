import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const $ = (id) => document.getElementById(id);
const ui = {
  loading:$('loading'), menu:$('menu'), dialogue:$('dialogue'), dialogueName:$('dialogueName'),
  dialogueText:$('dialogueText'), dialogueHint:$('dialogueHint'), objective:$('objective'),
  mission:$('mission'), prompt:$('prompt'), crosshair:$('crosshair'), toast:$('toast'),
  health:$('health'), ability:$('ability'), evidence:$('evidence'), chapter:$('chapter')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05090d);
scene.fog = new THREE.FogExp2(0x081116, 0.018);

const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.autoUpdate=true;
const composer=new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
composer.setSize(innerWidth,innerHeight);
composer.addPass(new RenderPass(scene,camera));
const bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.48,0.65,0.78);
composer.addPass(bloomPass);
$('game').replaceWith(renderer.domElement);
renderer.domElement.id='game';

const hemi = new THREE.HemisphereLight(0x94a8bd,0x151a17,0.9);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9bb5d0,1.8);
moon.position.set(-35,65,20);
moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);
moon.shadow.camera.near=1;
moon.shadow.camera.far=180;
moon.shadow.camera.left=-90;
moon.shadow.camera.right=90;
moon.shadow.camera.top=90;
moon.shadow.camera.bottom=-90;
scene.add(moon);

const fill = new THREE.DirectionalLight(0x4d7d8a,0.35);
fill.position.set(35,18,-45);
scene.add(fill);

function addAtmosphere(){
  const count=900;
  const geo=new THREE.BufferGeometry();
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-.5)*150;
    positions[i*3+1]=Math.random()*18;
    positions[i*3+2]=(Math.random()-.5)*150;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({color:0x8ebac4,size:.045,transparent:true,opacity:.32,depthWrite:false});
  const dust=new THREE.Points(geo,mat);
  dust.userData.atmosphere=true;
  scene.add(dust);
  return dust;
}
const atmosphere=addAtmosphere();

const clock=new THREE.Clock();
const keys=new Set();
const raycaster=new THREE.Raycaster();
const center=new THREE.Vector2(0,0);
const colliders=[];
const interactables=[];
const enemies=[];
const effects=[];
let running=false, paused=false, mode='PROLOGUE', mission=0, objectiveIndex=0;
let dialogue=null, dialogueQueue=[], dialogueTimer=0;
let toastTimer=0, cameraYaw=0.35, cameraPitch=0.36, cameraDistance=6.8;
let lastShot=0;

const state={
  health:100, resonance:0, evidence:[], flags:{},
  sense:false, completed:{}, apartmentVisited:false, notebookFound:false,
  hospitalRecords:false, undercityUnlocked:false, anomalySeen:false
};

const mats={
  floor:new THREE.MeshStandardMaterial({color:0x20262b,roughness:.92}),
  wall:new THREE.MeshStandardMaterial({color:0x53565b,roughness:.82}),
  wallDark:new THREE.MeshStandardMaterial({color:0x292d33,roughness:.9}),
  concrete:new THREE.MeshStandardMaterial({color:0x73767a,roughness:.86}),
  metal:new THREE.MeshStandardMaterial({color:0x343a41,roughness:.38,metalness:.5}),
  glass:new THREE.MeshStandardMaterial({color:0x527888,roughness:.2,metalness:.15,transparent:true,opacity:.7}),
  red:new THREE.MeshStandardMaterial({color:0x8e3e45,roughness:.7}),
  signal:new THREE.MeshStandardMaterial({color:0x9cecff,emissive:0x2e8ca8,emissiveIntensity:3.2,roughness:.25}),
  asphalt:new THREE.MeshStandardMaterial({color:0x10171b,roughness:.76,metalness:.05}),
  building:new THREE.MeshStandardMaterial({color:0x303a40,roughness:.86}),
  concreteWet:new THREE.MeshStandardMaterial({color:0x465158,roughness:.52,metalness:.12}),
  window:new THREE.MeshStandardMaterial({color:0x18333c,emissive:0x0d6978,emissiveIntensity:.75,roughness:.25,metalness:.15}),
  neon:new THREE.MeshStandardMaterial({color:0x9cecff,emissive:0x43d4e6,emissiveIntensity:5,roughness:.2}),
  skin2:new THREE.MeshStandardMaterial({color:0x9c684f,roughness:.9}),
  jacket2:new THREE.MeshStandardMaterial({color:0x151c22,roughness:.68,metalness:.15}),
  player:new THREE.MeshStandardMaterial({color:0x2d5f86,roughness:.65}),
  skin:new THREE.MeshStandardMaterial({color:0xc88e6f,roughness:.82}),
  enemy:new THREE.MeshStandardMaterial({color:0x4d6671,roughness:.8}),
  authority:new THREE.MeshStandardMaterial({color:0x59636d,roughness:.7}),
  paper:new THREE.MeshStandardMaterial({color:0xd8d0bc,roughness:1}),
  screen:new THREE.MeshStandardMaterial({color:0x6ed0db,emissive:0x2c7881,emissiveIntensity:1.6})
};

function box(w,h,d,material,x,y,z,parent=scene){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function cyl(r,h,material,x,y,z,parent=scene){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function textBillboard(text,x,y,z,color=0xffffff){
  const c=document.createElement('canvas'); c.width=512;c.height=96;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,512,96);ctx.font='700 34px Arial';
  ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.fillText(text,16,58);
  const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.position.set(x,y,z);s.scale.set(6,1.12,1);scene.add(s);return s;
}

function makePlayer(){
  const g=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.46,.86,6,12),mats.jacket2);
  torso.position.y=1.02;torso.scale.set(1,.92,.72);torso.castShadow=true;g.add(torso);
  const shirt=new THREE.Mesh(new THREE.BoxGeometry(.28,.52,.1),mats.player);
  shirt.position.set(0,1.03,.34);shirt.castShadow=true;g.add(shirt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,20,14),mats.skin);
  head.position.y=1.84;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.315,20,10,0,Math.PI*2,0,Math.PI*.48),mats.wallDark);
  hair.position.set(0,1.94,0);hair.castShadow=true;g.add(hair);
  for(const x of [-.27,.27]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.66,5,8),mats.jacket2);
    arm.position.set(x,1.03,0);arm.rotation.z=x<0?.12:-.12;arm.castShadow=true;g.add(arm);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.72,5,8),mats.wallDark);
    leg.position.set(x*.62,.39,0);leg.castShadow=true;g.add(leg);
    const shoe=box(.27,.13,.52,mats.metal,x*.62,.07,.10,g);
    shoe.castShadow=true;
  }
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,8,20),mats.signal);
  collar.rotation.x=Math.PI/2;collar.position.set(0,1.42,.08);g.add(collar);
  scene.add(g);return g;
}
const player={group:makePlayer(),pos:new THREE.Vector3(0,0,7),angle:Math.PI, speed:4.8};
player.group.position.copy(player.pos);

function makeEnemy(x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,6,12),mats.enemy);
  body.position.y=.95;body.scale.set(1,.96,.78);body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),mats.skin2);
  head.position.y=1.68;head.castShadow=true;g.add(head);
  const eyeMat=new THREE.MeshStandardMaterial({color:0xbffcff,emissive:0x48d9e8,emissiveIntensity:7});
  for(const x2 of [-.105,.105]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),eyeMat);
    eye.position.set(x2,1.72,.275);g.add(eye);
  }
  const aura=new THREE.PointLight(0x42d5e8,1.2,5);aura.position.y=1.3;g.add(aura);
  const e={group:g,pos:new THREE.Vector3(x,0,z),health:65,attack:0};
  g.position.copy(e.pos);scene.add(g);enemies.push(e);return e;
}

function clearMissionSpace(){
  for(const o of [...scene.children]) if(o.userData.levelObject) scene.remove(o);
  colliders.length=0;
  interactables.length=0;
}

function clearDynamic(){
  for(const e of enemies)scene.remove(e.group);
  enemies.length=0;
  for(const e of effects)scene.remove(e);
  effects.length=0;
}

function resetWorld(){
  clearDynamic();
  clearMissionSpace();
  buildDistrict();
}

function addCollider(x,z,w,d,object=null){
  colliders.push({x,z,w,d,object});
  if(object)object.userData.levelObject=true;
}

function blocked(x,z,r=.45){
  for(const c of colliders){
    if(x>c.x-c.w/2-r&&x<c.x+c.w/2+r&&z>c.z-c.d/2-r&&z<c.z+c.d/2+r)return true;
  }
  return false;
}
function move(dx,dz){
  const nx=player.pos.x+dx,nz=player.pos.z+dz;
  if(!blocked(nx,player.pos.z))player.pos.x=nx;
  if(!blocked(player.pos.x,nz))player.pos.z=nz;
}

function buildRoom(w,d,h,wallMat=mats.wall){
  box(w,.2,d,mats.floor,0,0,0);
  box(w,h,.25,wallMat,0,h/2,-d/2);
  box(.25,h,d,wallMat,-w/2,h/2,0);
  box(.25,h,d,wallMat,w/2,h/2,0);
  addCollider(0,-d/2,w,.25);addCollider(-w/2,0,.25,d);addCollider(w/2,0,.25,d);
}
function lamp(x,z,color=0xb8d9e5){
  const pole=cyl(.045,2.7,mats.metal,x,1.35,z);
  pole.userData.levelObject=true;
  const arm=box(.55,.045,.045,mats.metal,x+.22,2.62,z);
  arm.userData.levelObject=true;
  const l=new THREE.PointLight(color,2.8,16);l.position.set(x+.45,2.58,z);l.castShadow=true;scene.add(l);
  const shade=cyl(.11,.07,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:3.5}),x+.45,2.55,z);
  shade.userData.levelObject=true;
}
function propDesk(x,z){
  box(2,.12,.9,mats.metal,x,.95,z);box(.12,1,.8,mats.metal,x-.9,.5,z);box(.12,1,.8,mats.metal,x+.9,.5,z);
}
function interactable(id,label,x,z,action){
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),mats.neon);
  core.position.y=.8;g.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.018,8,32),mats.signal);
  ring.rotation.x=Math.PI/2;ring.position.y=.8;g.add(ring);
  const light=new THREE.PointLight(0x55d9e8,1.4,4);light.position.y=.8;g.add(light);
  g.position.set(x,0,z);g.userData.levelObject=true;scene.add(g);
  interactables.push({id,label,x,z,action,mesh:g});
  return g;
}

function buildDistrict(){
  // Small authored district around the apartment / hospital / maintenance route.
  box(180,.5,180,mats.asphalt,0,-.3,0);scene.children.at(-1).userData.levelObject=true;
  for(const x of [-65,-15,35,75]){
    for(const z of [-78,-28,22,72]){
      box(1.2,.012,4,new THREE.MeshStandardMaterial({color:0xc6c0a2,roughness:.8}),x,.055,z);
    }
  }
  for(const [x,z,w,d,h,c] of [
    [-32,-18,25,22,10,0x303941],[35,-18,30,24,13,0x3d444c],
    [-34,32,28,24,8,0x4a3f42],[35,34,32,25,11,0x38444b],
    [0,-52,50,20,7,0x4c4642]
  ]){
    const b=box(w,h,d,new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:.06}),x,h/2,z);
    b.userData.levelObject=true;addCollider(x,z,w,d,b);
    for(let wx=-w/2+2;wx<w/2-1;wx+=3.6){
      for(let wy=2.1;wy<h-.8;wy+=2.6){
        const lit=((Math.floor(wx*10)+Math.floor(wy*10)+x+z)%5===0);
        const win=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.05,.045),lit?mats.window:new THREE.MeshStandardMaterial({color:0x111a20,roughness:.35,metalness:.15}));
        win.position.set(x+wx,wy,z-d/2-.028);win.castShadow=false;win.receiveShadow=true;b.add(win);
      }
    }
  }
  // Street grid and street lamps.
  for(const x of [-65,-15,35,75])box(9,.08,180,new THREE.MeshStandardMaterial({color:0x0d1317,roughness:.9}),x,.02,0);
  for(const z of [-70,-18,32,72])box(180,.08,8,new THREE.MeshStandardMaterial({color:0x11161a}),0,.02,z);
  for(const x of [-58,-8,42])for(const z of [-62,-10,40,70])lamp(x,z);
  textBillboard('ST. AUGUSTE',-12,5,-52,0xb9c6d0);
  textBillboard('NORTH RESIDENTIAL',-58,5,12,0xb9c6d0);
  buildApartment();
  interactable('police','POLICE DESK',-10,-52,()=>{progressM1();});
}

function buildApartment(ox=-58,oz=12){
  const g=new THREE.Group();g.position.set(ox,0,oz);scene.add(g);g.userData.levelObject=true;
  box(15,.2,12,mats.floor,0,.1,0,g);
  box(15,5,.25,mats.wall,0,2.5,-6,g);box(.25,5,12,mats.wall,-7.5,2.5,0,g);
  box(.25,5,12,mats.wall,7.5,2.5,0,g);
  box(15,5,.25,mats.wall,0,2.5,6,g);
  // doorway opening is represented by a door mesh that can be crossed through by mission.
  const door=box(2.3,4,.18,mats.metal,0,2,-5.9,g);door.userData.levelObject=true;
  addCollider(ox-7.5,oz,.25,12);addCollider(ox+7.5,oz,.25,12);addCollider(ox,oz+6,15,.25);
  // floor props
  box(4,.5,2.2,mats.metal,-3,.5,1,g);box(.3,2,.3,mats.metal,-4,1,1,g);
  box(3,.12,2,mats.red,2,.62,1,g);
  const photo=box(.35,.6,.08,mats.paper,-2,1.35,-2.7,g);photo.userData.levelObject=true;
  interactable('photo','PHOTO',ox-2,oz-2.7,()=>{addEvidence('Photo of Aarav and Mira');say('Aarav','We took this three weeks ago. She was still here.');});
  const charger=box(.35,.12,.18,mats.paper,3,.72,3,g);charger.userData.levelObject=true;
  interactable('charger','CHARGER',ox+3,oz+3,()=>{addEvidence('Mira’s charger — still plugged in');say('Aarav','She left the charger. And her ID. That doesn’t fit.');});
  interactable('notebook','NOTEBOOK',ox-3,oz+3,()=>{state.notebookFound=true;addEvidence('Notebook: repeated 03:17 entries');say('Aarav','Eleven seconds. She wrote it down before anyone else noticed.');});
}

function setRoom(sceneGroup){
  clearDynamic();
  // Hide the city and rebuild a mission interior around the player.
  for(const o of scene.children) if(o!==camera&&o!==hemi&&o!==moon&&o!==player.group) o.visible=false;
  sceneGroup();
}
function showWorld(){
  for(const o of scene.children) if(o.userData.levelObject) o.visible=true;
}

function addEvidence(name){
  if(!state.evidence.includes(name)){state.evidence.push(name);ui.evidence.textContent=state.evidence.length+' EVIDENCE';toast('Evidence recovered: '+name);}
}
function toast(t){
  ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2200);
}

function say(name,text,next=null){
  dialogue={name,text,next};ui.dialogueName.textContent=name;ui.dialogueText.textContent=text;
  ui.dialogue.classList.remove('hidden');paused=true;renderer.domElement.style.cursor='default';
}
function closeDialogue(){
  if(!dialogue)return;
  const n=dialogue.next;dialogue=null;ui.dialogue.classList.add('hidden');paused=false;
  if(n)n();
}
function sequence(lines,done){
  dialogueQueue=lines.map(x=>({name:x[0],text:x[1]}));dialogueTimer=0;
  const advance=()=>{ if(dialogueQueue.length){const l=dialogueQueue.shift();say(l.name,l.text,advance);} else if(done)done(); };
  advance();
}

function setMission(name,obj){
  ui.mission.textContent=name;ui.objective.textContent=obj;
}
function setChapter(text){ui.chapter.textContent=text;}

function startGame(){
  running=true;paused=false;ui.menu.classList.add('hidden');beginPrologue();
}
function beginPrologue(){
  mode='PROLOGUE';mission=0;objectiveIndex=0;state.health=100;
  resetWorld();player.pos.set(-1,0,2);player.group.position.copy(player.pos);
  setChapter('PROLOGUE  /  03:17');setMission('PROLOGUE','');
  sequence([
    ['MIRA','Are you awake?'],
    ['AARAV','Barely. What happened?'],
    ['MIRA','Come downstairs. I need you to see something.'],
    ['AARAV','At this hour?'],
    ['MIRA','Five minutes. Then you can go back to sleep.']
  ],()=>{
    toast('Mira went downstairs. Aarav went back to bed.');
    setTimeout(()=>{
      sequence([
        ['PHONE','03:17 AM'],
        ['SYSTEM','SIGNAL DETECTED — 11 SECONDS'],
        ['AARAV','...Mira?']
      ],()=>{
        addEvidence('Photograph taken from inside Aarav’s room');
        toast('The power is gone. Mira is gone.');
        setTimeout(beginMission1,700);
      });
    },900);
  });
}

function beginMission1(){
  mode='M1';mission=1;objectiveIndex=0;resetWorld();
  player.pos.set(-58,0,8);player.group.position.copy(player.pos);
  setChapter('ACT I  /  THE DISAPPEARANCE');
  setMission('MISSION 1 — THE OFFICIAL STORY','Search Mira’s apartment.');
  interactable('door','ENTER APARTMENT',-58,6,()=>{
  player.pos.set(-58,0,4.5);
  player.group.position.copy(player.pos);
  toast('Mira’s apartment — search for anything she left behind.');
  setMission('MISSION 1 — THE OFFICIAL STORY','Search the apartment for evidence.');
});
  toast('Mira is missing. The police say she left voluntarily.');
}
function progressM1(){
  if(state.notebookFound&&state.evidence.some(x=>x.includes('charger'))){
    setMission('MISSION 1 — THE OFFICIAL STORY','Report Mira missing at the police desk.');
    objectiveIndex=1;
    toast('The apartment tells a different story.');
  }
  if(objectiveIndex===1&&player.pos.distanceTo(new THREE.Vector3(-10,-52,0))<8){
    sequence([
      ['OFFICER','She’s an adult. If she left voluntarily, there’s nothing to investigate.'],
      ['AARAV','Her clothes are here. Her charger is plugged in.'],
      ['OFFICER','People leave things behind. Give it a day.']
    ],()=>{state.flags.authorityApproach='questioning';completeMission(1);});
  }
}

function beginMission2(){
  mode='M2';mission=2;objectiveIndex=0;
  clearMissionSpace();
  clearDynamic();
  buildMaintenance();
  player.pos.set(0,0,9);player.group.position.copy(player.pos);
  setChapter('ACT I  /  FIRST CONTACT');setMission('MISSION 2 — FIRST CONTACT','Reach the maintenance corridor.');
  toast('Mira’s warning points toward the cell tower.');
}
function buildMaintenance(){
  for(const [x,z,w,d,h] of [[0,-12,26,22,4],[0,15,26,18,3]]){
    const b=box(w,h,d,mats.wallDark,x,h/2,z);b.userData.levelObject=true;
  }
  addCollider(-13,0,.3,65);addCollider(13,0,.3,65);
  box(2,.1,65,mats.floor,0,.02,0);scene.children.at(-1).userData.levelObject=true;
  for(const z of [-25,-5,15,30])lamp(-5,z,0x8dc5d8);
  const anomaly=box(1.4,2,1.4,mats.signal,0,1,-28);anomaly.userData.levelObject=true;
  interactable('anomaly','ANOMALY',0,-28,()=>{
    state.anomalySeen=true;state.resonance=25;addEvidence('Signal fragment — Mira’s voice');
    say('MIRA','Don’t come looking for me. If you hear the signal again, don’t answer.');
    ui.ability.textContent='RESONANCE: SENSE';
  });
}
function progressM2(){
  if(state.anomalySeen&&player.pos.distanceTo(new THREE.Vector3(0,-28,0))<5){
    setMission('MISSION 2 — FIRST CONTACT','Follow the impossible corridor.');
    objectiveIndex=1;
  }
  if(objectiveIndex===1&&player.pos.z>-2){
    sequence([
      ['AARAV','That wall was behind me.'],
      ['AARAV','No. I’m not imagining this.'],
      ['SIGNAL','...03:17...']
    ],()=>{completeMission(2);});
  }
}

function beginMission3(){
  mode='M3';mission=3;objectiveIndex=0;
  clearMissionSpace();
  clearDynamic();buildHospital();
  player.pos.set(0,0,15);player.group.position.copy(player.pos);
  setChapter('ACT I  /  WARD 7');setMission('MISSION 3 — WARD 7','Enter the abandoned hospital wing.');
  toast('The first real contact is waiting inside.');
}
function buildHospital(){
  box(44,.2,46,mats.floor,0,0,0);scene.children.at(-1).userData.levelObject=true;
  for(const [x,z,w,d] of [[-12,-18,18,12],[12,-18,18,12],[-12,10,18,12],[12,10,18,12]]){
    const b=box(w,4,d,mats.wall,x,2,z);b.userData.levelObject=true;addCollider(x,z,w,d,b);
  }
  for(const x of [-20,-7,7,20])lamp(x,20,0xb8d5df);
  textBillboard('WARD 7',-4,5,-20,0xd9e5eb);
  interactable('records','RECORDS ROOM',-18,2,()=>{
    if(state.resonance<100){addEvidence('Hospital transfer records');state.hospitalRecords=true;state.resonance=100;say('AARAV','These transfers happened before the disappearances. Why is Mira’s name here?');}
  });
  spawnEnemy(-8,-6);spawnEnemy(8,-6);spawnEnemy(0,-12);
}
function progressM3(){
  if(player.pos.z<3&&state.resonance<100){
    state.resonance=100;ui.ability.textContent='RESONANCE: SENSE';
    say('AARAV','I can see it. Something is wrong with the space around them.');
  }
  if(state.hospitalRecords&&enemies.length===0){
    setMission('MISSION 3 — WARD 7','Find the records room.');
    objectiveIndex=1;
  }
  if(objectiveIndex===1&&state.hospitalRecords&&player.pos.distanceTo(new THREE.Vector3(-18,0,2))<6){
    completeMission(3);
  }
}

function beginMission4(){
  mode='M4';mission=4;objectiveIndex=0;
  clearMissionSpace();
  clearDynamic();buildEvidenceRoom();
  player.pos.set(0,0,4);player.group.position.copy(player.pos);
  setChapter('ACT I  /  WHAT SHE KNEW');
  setMission('MISSION 4 — WHAT SHE KNEW','Return to Mira’s apartment and assemble the evidence.');
  toast('The hospital records change what the apartment means.');
}
function buildEvidenceRoom(){
  buildApartment(0,0);
  for(const o of scene.children)if(o.userData.levelObject)o.visible=true;
  box(7,.1,4,mats.wallDark,0,.65,0); // evidence table
  for(let i=0;i<4;i++)box(1.1,.05,1.5,mats.paper,-2+i*1.35,.73,0);
  interactable('board','EVIDENCE BOARD',0,0,()=>{
    if(!state.hospitalRecords)return;
    addEvidence('Timeline: Mira investigated before Day 7');
    state.undercityUnlocked=true;
    say('AARAV','She was investigating before anyone disappeared. She knew this was coming.');
    setMission('MISSION 4 — WHAT SHE KNEW','Open the undercity access point.');
    objectiveIndex=1;
  });
  interactable('mira-note','FINAL NOTE',4,3,()=>{
    addEvidence('Mira’s final note — “Below the city.”');
    state.flags.miraAutonomySeed=true;
  });
  interactable('access','UNDERCITY ACCESS',0,-5,()=>{
    if(state.undercityUnlocked)sequence([
      ['AARAV','You knew where this led.'],
      ['AARAV','So why tell me not to follow?'],
      ['MIRA','(recording) If you found this, you already know I didn’t disappear by accident.']
    ],()=>{completeMission(4);finishAct1();});
  });
}
function finishAct1(){
  mode='ACT1_DONE';setChapter('ACT I COMPLETE');setMission('ACT I — COMPLETE','The trail leads below Veyra.');
  ui.objective.textContent='Act I complete. The next chapter begins beneath the city.';
  toast('ACT I COMPLETE — THE HUNT BEGINS BELOW');
  state.completed.act1=true;save();
}

function completeMission(n){
  state.completed['m'+n]=true;
  save();
  if(n===1)beginMission2();
  else if(n===2)beginMission3();
  else if(n===3)beginMission4();
  else if(n===4)finishAct1();
}

function save(){
  localStorage.setItem('goma-story-save',JSON.stringify(state));
}
function load(){
  try{Object.assign(state,JSON.parse(localStorage.getItem('goma-story-save')||'{}'));}catch{}
}

function attack(){
  if(paused||!running)return;
  const now=performance.now();if(now-lastShot<420)return;lastShot=now;
  raycaster.setFromCamera(center,camera);
  const hit=raycaster.intersectObjects(enemies.flatMap(e=>e.group.children),true)[0];
  if(!hit)return;
  const e=enemies.find(x=>x.group===hit.object.parent||x.group.children.includes(hit.object)||x.group.getObjectById(hit.object.id));
  if(e){e.health-=34;state.resonance=Math.min(100,state.resonance+6);spawnSpark(hit.point);}
}
function spawnSpark(p){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),mats.signal);m.position.copy(p);scene.add(m);effects.push(m);
}
function updateEnemies(dt){
  for(const e of [...enemies]){
    const d=e.pos.distanceTo(player.pos);
    if(d<28){
      const dir=player.pos.clone().sub(e.pos).setY(0).normalize();
      if(d>2.1)e.pos.addScaledVector(dir,1.8*dt);
      else {e.attack-=dt;if(e.attack<=0){state.health-=12;e.attack=1.1;}}
      e.group.rotation.y=Math.atan2(dir.x,dir.z);
    }
    e.group.position.copy(e.pos);
    if(e.health<=0){scene.remove(e.group);enemies.splice(enemies.indexOf(e),1);state.resonance=Math.min(100,state.resonance+12);toast('Signal-touched neutralized');}
  }
}

function updatePlayer(dt){
  const x=(keys.has('d')?1:0)-(keys.has('a')?1:0);
  const z=(keys.has('w')?1:0)-(keys.has('s')?1:0);
  const v=new THREE.Vector3(x,0,z);
  if(v.lengthSq()){
    v.normalize();
    const f=new THREE.Vector3(Math.sin(cameraYaw),0,Math.cos(cameraYaw));
    const r=new THREE.Vector3(f.z,0,-f.x);
    const m=r.multiplyScalar(v.x).add(f.multiplyScalar(v.z)).normalize();
    move(m.x*player.speed*dt,m.z*player.speed*dt);
    player.angle=Math.atan2(m.x,m.z);player.group.rotation.y=player.angle;
  }
  player.group.position.copy(player.pos);
}
function updateCamera(dt){
  const h=Math.cos(cameraPitch)*cameraDistance;
  const target=player.pos.clone().add(new THREE.Vector3(0,1.15,0));
  const desired=new THREE.Vector3(
    player.pos.x+Math.sin(cameraYaw)*h,
    player.pos.y+1.8+Math.sin(cameraPitch)*cameraDistance,
    player.pos.z+Math.cos(cameraYaw)*h
  );
  camera.position.lerp(desired,Math.min(1,dt*8));camera.lookAt(target);
}
function updateEffects(dt){
  for(const e of [...effects]){e.scale.multiplyScalar(1+dt*3);e.material.opacity=Math.max(0,(e.material.opacity??1)-dt*2);if(e.material.opacity<=0){scene.remove(e);effects.splice(effects.indexOf(e),1);}}
}
function updateMission(){
  if(mode==='M1')progressM1();
  if(mode==='M2')progressM2();
  if(mode==='M3')progressM3();
  if(mode==='M4'&&objectiveIndex===0&&state.hospitalRecords){setMission('MISSION 4 — WHAT SHE KNEW','Assemble the evidence on the board.');}
  if(mode==='M4'&&objectiveIndex===1&&state.undercityUnlocked&&player.pos.distanceTo(new THREE.Vector3(0,-5,0))<5){
    toast('The entrance is open.');objectiveIndex=2;
  }
}
function updateUI(){
  ui.health.style.width=Math.max(0,state.health)+'%';
  ui.ability.style.width=state.resonance+'%';
  ui.evidence.textContent=state.evidence.length+' EVIDENCE';
  ui.prompt.classList.add('hidden');
  let near=null,best=999;
  for(const i of interactables){
    if(!i.mesh.visible)continue;
    const d=player.pos.distanceTo(new THREE.Vector3(i.x,0,i.z));
    if(d<best&&d<4){best=d;near=i;}
  }
  if(near){ui.prompt.textContent='E  '+near.label;ui.prompt.classList.remove('hidden');}
}
function interact(){
  let best=null,bd=999;
  for(const i of interactables){
    if(!i.mesh.visible)continue;
    const d=player.pos.distanceTo(new THREE.Vector3(i.x,0,i.z));
    if(d<bd&&d<4){bd=d;best=i;}
  }
  if(best)best.action();
}

function loop(){
  const dt=Math.min(.033,clock.getDelta());
  atmosphere.rotation.y += dt*.004;
  if(running&&!paused&&!dialogue){
    updatePlayer(dt);updateEnemies(dt);updateMission();updateCamera(dt);updateEffects(dt);
    if(state.health<=0){state.health=100;player.pos.set(0,0,8);toast('You wake at the last safe point.');}
  }
  updateUI();composer.render();
}

$('dialogue').addEventListener('click',closeDialogue);
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();keys.add(k);
  if(k==='enter'&&dialogue){closeDialogue();return;}
  if(dialogue)return;
  if(k==='e')interact();
  if(k==='f'||e.code==='Space')attack();
  if(k==='escape'&&running&&!dialogue){paused=!paused;toast(paused?'PAUSED':'RESUMED');}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('mousemove',e=>{
  if(running&&!paused&&!dialogue){cameraYaw-=e.movementX*.0022;cameraPitch=THREE.MathUtils.clamp(cameraPitch-e.movementY*.0018,.2,.7);}
});
renderer.domElement.addEventListener('click',()=>{if(running&&!paused&&!dialogue)renderer.domElement.requestPointerLock?.();});
$('play').addEventListener('click',startGame);
$('continue').addEventListener('click',()=>{load();startGame();});
$('new').addEventListener('click',()=>{localStorage.removeItem('goma-story-save');location.reload();});

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  composer.setSize(innerWidth,innerHeight);
  composer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
});

resetWorld();load();
setTimeout(()=>ui.loading.classList.add('hidden'),800);
renderer.setAnimationLoop(loop);
