/* Cinco Noites na Pizzaria do BOB 3D - lógica do jogo */
window.addEventListener('error',function(e){
 var d=document.getElementById('errBox');
 if(!d){d=document.createElement('div');d.id='errBox';d.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:99;background:#300;color:#fff;font:14px monospace;padding:10px;border:2px solid #f44;white-space:pre-wrap';document.body.appendChild(d);}
 d.textContent='Erro: '+e.message+'\n'+(e.filename||'')+':'+(e.lineno||'')+'\nMande um print disso para corrigir.';
});
(function(){
'use strict';
const $=s=>document.querySelector(s);
if(!window.THREE){document.body.innerHTML='<p style="color:#fff;font:20px monospace;padding:20px">Não deu para carregar o Three.js. Confira a conexão com a internet e recarregue.</p>';return;}

/* ================= CONFIG ================= */
/* Troque os sons aqui. Os arquivos ficam na pasta sounds/ */
const SOUND_FILES={/*@@SOUNDS@@*/
 menu:'sounds/menu_soum.ogg',
 fan:'sounds/ventilador.mp3',
 doorClose:'sounds/porta_fechando.mp3',
 doorOpen:'sounds/porta_abrindo.mp3',
 flash:'sounds/LANTERNA_ON_OFF.mp3',
 maskOn:'sounds/colocando_a_mascara.mp3',
 breath:'sounds/respiracao_da_mascara.mp3',
 stepsSide:'sounds/andando_no_corregor.mp3',
 stepsHall:'sounds/corredor_do_meio.mp3',
 vent:'sounds/andando_nos_dutos.mp3',
 laugh:'sounds/risada_do_palhaco.mp3',
 jumpscare:'sounds/jumpscare.mp3',
 sixAM:'sounds/6_da_manha.mp3',
 honk:'sounds/som_do_poster.mp3',
 rare:'sounds/som_raro_que_pode_tocar.mp3'
/*@@END@@*/};

const HOUR_LEN=45, BOSS_HP=150, YAW_MAX=1.2;
const ORDER=['bob','bibi','dewy','titi','boba'];
/* Dificuldade por noite (0 = parado, 20 = máximo) */
const LEVELS={1:{bob:2,bibi:3,dewy:3,titi:0,boba:0},2:{bob:4,bibi:5,dewy:5,titi:4,boba:3},3:{bob:6,bibi:7,dewy:7,titi:6,boba:6},4:{bob:9,bibi:9,dewy:10,titi:9,boba:9},5:{bob:12,bibi:12,dewy:13,titi:13,boba:12}};
/* Segundos que você tem para se defender depois que eles chegam */
const ATK={1:9,2:8,3:7.5,4:7,5:6.5,7:6};

const CHARS={
 bob:{name:'BOB',sp:'Cachorro Vermelho',color:'#ff5a62',spot:'O',def:'mask',need:2.5,interval:6,path:[1,2,8,'end'],
  how:'Quando ele entrar no escritório, segure a <b>máscara</b> até ele ir embora.',
  bio:'O mascote principal. Adora festas de aniversário. Ninguém na pizzaria fala sobre o incidente de 87.',
  tip:'Quando as luzes piscarem e o BOB aparecer na sala, segure a MÁSCARA (Espaço) até ele sair.'},
 bibi:{name:'BIBI',sp:'Elefante Azul',color:'#7fa6ff',spot:'H',def:'hall',need:2,interval:5.5,path:[1,2,3,'end'],
  how:'Ela surge no fundo do corredor. Segure a <b>lanterna no corredor</b>.',
  bio:'Cantora oficial do palco. Tem pavor de luz forte desde um curto-circuito num show.',
  tip:'Olhos brilhando no corredor? É a BIBI. Segure a LANTERNA no corredor (F).'},
 dewy:{name:'DEWY',sp:'Gato Roxo',color:'#c08cff',spot:'L',def:'doorL',need:1.5,interval:5,path:[1,6,4,'end'],
  how:'Chega pela esquerda. Feche a <b>porta esquerda</b>.',
  bio:'Silencioso e ágil, vive escondido no depósito entre as cabeças de reserva.',
  tip:'Passos à esquerda são do DEWY. Feche a PORTA ESQUERDA (A).'},
 titi:{name:'TITI',sp:'Vaca Rosa',color:'#ff9ccc',spot:'R',def:'doorR',need:1.5,interval:5.5,path:[1,2,5,'end'],
  how:'Chega pela direita. Feche a <b>porta direita</b>.',
  bio:'Servia milkshakes. Ainda tenta servir, custe o que custar.',
  tip:'Passos à direita são da TITI. Feche a PORTA DIREITA (D).'},
 boba:{name:'Boba',sp:'Galinha Laranja',color:'#ffad5c',spot:'V',def:'vent',need:2,interval:5,path:[3,7,'end'],
  how:'Rasteja pelo duto. Segure a <b>lanterna no duto</b>.',
  bio:'Cozinheira da pizzaria. A câmera da cozinha está quebrada, então só dá para ouvir as panelas quando ela passa por lá.',
  tip:'Barulho nos dutos? É a Boba. Segure a LANTERNA no duto (V).'},
 clown:{name:'SR. GARGALHADA',sp:'Palhaço',color:'#ff3b6b',
  how:'Usa <b>tudo</b>: portas, lanterna, máscara e se esconde nas câmeras (dê o <b>choque</b>).',
  bio:'Ninguém lembra de ter contratado ele. Ninguém lembra de ter desligado ele.',
  tip:'Veja de onde vem a risada e use a defesa certa. Se ele sumir, abra as câmeras, ache e dê CHOQUE (E). Não deixe as portas fechadas demais: elas superaquecem.'},
 golden:{name:'BOB DOURADO',sp:'???',color:'#e0b83a',
  how:'Se ele aparecer sentado na sala, <b>não encare</b>. Abra as câmeras ou coloque a máscara.',
  bio:'Um traje antigo guardado nos fundos, com os olhos vazios. Dizem que ele nem está realmente ali.',
  tip:'Nunca encare o BOB Dourado. Abra as câmeras ou coloque a máscara assim que ele aparecer.'}
};
const CAMS={1:'Palco Principal',2:'Salão de Festas',3:'Cozinha',4:'Corredor Oeste',5:'Corredor Leste',6:'Depósito',7:'Duto de Ventilação',8:'Área de Brinquedos'};
const PAN={doorL:-.9,doorR:.9,hall:0,vent:-.45,mask:0,cam:0,L:-.9,R:.9,H:0,V:-.45,O:0};

const CALLS={
1:`<span class="who">📞 Mensagem do Valdir, o vigia antigo</span><p>Alô? Bem-vindo à <b>Pizzaria do BOB</b>! Olha, os animatrônicos andam sozinhos à noite. Cada um tem um jeito de ser parado:</p><ul>
<li><b style="color:#ff5a62">BOB</b>, o cachorro vermelho, entra na sala: segure a <b>máscara</b> [Espaço].</li>
<li><b style="color:#7fa6ff">BIBI</b>, a elefanta azul, aparece no corredor: segure a <b>lanterna no corredor</b> [F].</li>
<li><b style="color:#ffad5c">Boba</b>, a galinha laranja, vem pelo duto: segure a <b>lanterna no duto</b> [V].</li>
<li><b style="color:#c08cff">DEWY</b>, o gato roxo, vem pela <b>porta esquerda</b> [A].</li>
<li><b style="color:#ff9ccc">TITI</b>, a vaca rosa, vem pela <b>porta direita</b> [D].</li></ul>
<p>Olhe pros lados arrastando a tela ou com as setas. Use as <b>câmeras</b> [S], mas tudo gasta <b>energia</b>. Aguente até as 6 da manhã!</p>`,
2:`<span class="who">📞 Valdir</span><p>Ei, você sobreviveu! Hoje eles estão mais agitados e a TITI começou a passear. Ah, a câmera da cozinha está quebrada desde sempre. Só tem áudio.</p>`,
3:`<span class="who">📞 Valdir</span><p>Noite 3. Passos à esquerda ou à direita, porta. Barulho nos dutos, lanterna lá em cima. Olhos no corredor, lanterna no corredor. Luzes piscando... máscara, rápido.</p>`,
4:`<span class="who">📞 Valdir</span><p>Vou ser rápido. Tem alguém batendo na porta aqui da sala de... <i>*estática*</i>... economiza energia, não deixa as câmeras abertas à toa. Eles ficam mais rápidos depois das 2. <i>*barulho de mascote*</i></p>`,
5:`<span class="who">📞 (ninguém fala)</span><p><i>Só se ouve estática e uma respiração pesada do outro lado da linha.</i></p>`,
6:`<span class="who">📞 Valdir (a ligação está falhando)</span><p>...Alô? Eu achei que não ia mais conseguir ligar. Tinha um sexto boneco no porão. Um <b style="color:#ff3b6b">palhaço</b>. O <b>SR. GARGALHADA</b>.</p><p>Ele sabe tudo que os outros fazem: aparece nas <b>portas</b>, no <b>corredor</b>, no <b>duto</b>, entra na <b>sala</b>... e <b>se esconde nas câmeras</b>. Quando ele sumir, abra as câmeras, ache ele e dê o <b>choque</b> [E].</p><p>Cada defesa certa machuca ele. E hoje as portas <b>superaquecem</b> se ficarem fechadas mais de 5 segundos. Ha... ha...</p>`,
7:`<span class="who">📞 Gerência</span><p>Noite extra, por sua conta e risco. Você escolheu os níveis. A pizzaria não se responsabiliza por nada.</p>`
};

/* ================= SAVE ================= */
let save={night:1,n6:false,won6:false,max:false,seenGolden:false,custom:{bob:5,bibi:5,dewy:5,titi:5,boba:5}};
try{const r=localStorage.getItem('pizzariaBob3d_v1'); if(r){const o=JSON.parse(r); save=Object.assign(save,o); save.custom=Object.assign({bob:5,bibi:5,dewy:5,titi:5,boba:5},o.custom||{});}}catch(e){}
function persist(){try{localStorage.setItem('pizzariaBob3d_v1',JSON.stringify(save));}catch(e){}}

/* ================= AUDIO ================= */
const A={ctx:null,master:null,buf:{},html:{},loading:false,loops:{},want:new Set(),vol:{}};
function audio(){
 if(!A.ctx){
  try{A.ctx=new (window.AudioContext||window.webkitAudioContext)();A.master=A.ctx.createGain();A.master.gain.value=.9;A.master.connect(A.ctx.destination);}catch(e){A.ctx=null;}
  loadSounds();
 }
 if(A.ctx&&A.ctx.state==='suspended') A.ctx.resume();
 return A.ctx;
}
function b64ToBuf(d){const b=atob(d.slice(d.indexOf(',')+1));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
function decode(ab){return new Promise((res,rej)=>A.ctx.decodeAudioData(ab,res,rej));}
async function loadOne(k,url){
 try{
  if(!A.ctx) throw 0;
  let ab; if(url.startsWith('data:')) ab=b64ToBuf(url); else {let r=await fetch(url).catch(()=>null); if((!r||!r.ok)&&url.includes('/')) r=await fetch(url.split('/').pop()); if(!r.ok) throw 0; ab=await r.arrayBuffer();}
  A.buf[k]=await decode(ab);
 }catch(e){ try{const el=new Audio(url);el.preload='auto';A.html[k]=el;}catch(_){} }
 if(A.want.has(k)&&!A.loops[k]) A.loops[k]=play(k,{loop:true,vol:A.vol[k]});
}
function loadSounds(){if(A.loading)return;A.loading=true;Object.keys(SOUND_FILES).forEach(k=>loadOne(k,SOUND_FILES[k]));}
function outNode(node,pan){
 if(A.ctx.createStereoPanner&&pan){const p=A.ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node.connect(p);p.connect(A.master);}
 else node.connect(A.master);
}
function play(k,o){
 o=o||{}; const vol=o.vol==null?1:o.vol;
 if(A.ctx&&A.buf[k]){
  const s=A.ctx.createBufferSource(); s.buffer=A.buf[k]; s.loop=!!o.loop; if(o.rate) s.playbackRate.value=o.rate;
  const gn=A.ctx.createGain(); gn.gain.value=vol; s.connect(gn); outNode(gn,o.pan);
  if(o.dur) s.start(0,o.offset||0,o.dur); else s.start(0,o.offset||0);
  return {stop(f){f=f==null?.25:f;try{const t=A.ctx.currentTime;gn.gain.cancelScheduledValues(t);gn.gain.setValueAtTime(gn.gain.value,t);gn.gain.linearRampToValueAtTime(0,t+f);s.stop(t+f+.03);}catch(e){}}};
 }
 if(A.html[k]){
  const el=A.html[k].cloneNode(); el.volume=Math.min(1,vol); el.loop=!!o.loop; if(o.rate) el.playbackRate=o.rate;
  el.play().catch(()=>{}); let to=o.dur?setTimeout(()=>el.pause(),o.dur*1000):null;
  return {stop(){el.pause();if(to)clearTimeout(to);}};
 }
 return {stop(){}};
}
function sloop(k,vol){A.want.add(k);A.vol[k]=vol;if(A.loops[k])return;if(A.buf[k]||A.html[k])A.loops[k]=play(k,{loop:true,vol});}
function sunloop(k,f){A.want.delete(k);if(A.loops[k]){A.loops[k].stop(f);delete A.loops[k];}}
function tone(f,dur,type,vol,pan,when,slideTo){
 const a=A.ctx; if(!a) return; const t=a.currentTime+(when||0);
 const o=a.createOscillator(),gn=a.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t);
 if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
 gn.gain.setValueAtTime(vol||.2,t); gn.gain.exponentialRampToValueAtTime(.001,t+dur);
 o.connect(gn); outNode(gn,pan); o.start(t); o.stop(t+dur+.05);
}
let noiseBuf=null;
function noise(dur,vol,freq,ftype,pan,when){
 const a=A.ctx; if(!a) return;
 if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 const t=a.currentTime+(when||0); const s=a.createBufferSource(); s.buffer=noiseBuf;
 const f=a.createBiquadFilter(); f.type=ftype||'lowpass'; f.frequency.value=freq||1000;
 const gn=a.createGain(); gn.gain.setValueAtTime(vol||.3,t); gn.gain.exponentialRampToValueAtTime(.001,t+dur);
 s.connect(f); f.connect(gn); outNode(gn,pan); s.start(t,Math.random()); s.stop(t+dur+.05);
}
const sfx={
 growl(){tone(62,1.3,'sawtooth',.16,0,0,48);noise(1.2,.12,200);},
 bang(pan){for(let i=0;i<3;i++)noise(.2,.7,240,'lowpass',pan,i*.24);},
 screech(pan){tone(1100,.4,'sawtooth',.1,pan,0,260);},
 retreat(){for(let i=0;i<3;i++)noise(.12,.35,160,'lowpass',0,i*.3);},
 hit(){tone(220,.35,'square',.25,0,0,55);noise(.35,.45,1500,'bandpass');},
 zap(){noise(.35,.4,4200,'highpass');tone(1300,.3,'sawtooth',.14,0,0,280);},
 jam(){tone(150,.6,'sawtooth',.2,0,0,55);noise(.5,.3,600);},
 powerOut(){tone(420,1.8,'sine',.3,0,0,35);},
 cam(){noise(.14,.18,3200,'highpass');},
 clatter(){for(let i=0;i<4;i++){tone(700+Math.random()*900,.12,'triangle',.08,.3,i*.11+Math.random()*.05);noise(.08,.15,3000,'bandpass',.3,i*.11);}},
 musicBox(){const n=[659,587,523,587,659,659,659,0,587,587,587,0,659,784,784,0];n.forEach((f,i)=>{if(f){tone(f*2,.55,'triangle',.07,-.8,i*.34);tone(f*4,.25,'sine',.025,-.8,i*.34);}});}
};

/* ================= THREE SETUP ================= */
const renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:false,powerPreference:'high-performance'});
renderer.setClearColor(0x000000);
const RES=.5;
const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0x040205,3,17);
const amb=new THREE.AmbientLight(0x2b2238,.55); scene.add(amb);
const allCams=[];
function mkCam(fov){const c=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.05,40);allCams.push(c);return c;}
const playerCam=mkCam(75); playerCam.position.set(0,1.3,1.25); playerCam.rotation.order='YXZ';
const menuCam=mkCam(60);

const matCache={};
function mat(c,extra){if(typeof c==='object')return c;const k=c+'|'+(extra?JSON.stringify(extra):'');if(!matCache[k])matCache[k]=new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:4},extra||{}));return matCache[k];}
function mesh(geo,m,x,y,z,parent){const o=new THREE.Mesh(geo,mat(m));o.position.set(x||0,y||0,z||0);if(parent)parent.add(o);return o;}
function box(w,h,d,c,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,parent);}
function slab(x1,x2,y1,y2,z1,z2,c,parent){return box(x2-x1,y2-y1,z2-z1,c,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,parent);}
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;if(!t.userData)t.userData={};t.userData.ctx=x;return t;}
function plane(w,h,tex,x,y,z,ry,parent,basic){const m=basic?new THREE.MeshBasicMaterial({map:tex}):new THREE.MeshPhongMaterial({map:tex,shininess:0});const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry||0;parent.add(o);return o;}

/* ---------- textures ---------- */
const checkerBase=ctex(64,64,(x)=>{x.fillStyle='#d9d4c4';x.fillRect(0,0,64,64);x.fillStyle='#111';x.fillRect(0,0,32,32);x.fillRect(32,32,32,32);});
function floorMat(w,d){const t=checkerBase.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(w,d);return new THREE.MeshPhongMaterial({map:t,shininess:10});}
function signTex(text,bg,fg,size){return ctex(256,64,(x)=>{x.fillStyle=bg;x.fillRect(0,0,256,64);x.fillStyle=fg;x.font=`${size||40}px VT323, monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);});}
function drawPoster(x,variant){
 x.fillStyle=variant?'#120a06':'#e9dcc0';x.fillRect(0,0,128,128);
 x.fillStyle=variant?'#3a2a08':'#5c1a1f';x.fillRect(6,6,116,92);
 const head=variant?'#a8861e':'#c8252c', ear=variant?'#6a520c':'#7d1015';
 x.fillStyle=ear;x.beginPath();x.ellipse(36,54,10,24,.3,0,7);x.fill();x.beginPath();x.ellipse(92,54,10,24,-.3,0,7);x.fill();
 x.fillStyle=head;x.beginPath();x.arc(64,52,32,0,7);x.fill();
 x.fillStyle=variant?'#c9a63a':'#f08a8e';x.beginPath();x.ellipse(64,66,17,12,0,0,7);x.fill();
 x.fillStyle=variant?'#000':'#f4f1e8';x.beginPath();x.arc(52,44,7,0,7);x.arc(76,44,7,0,7);x.fill();
 if(!variant){x.fillStyle='#111';x.beginPath();x.arc(52,45,3,0,7);x.arc(76,45,3,0,7);x.fill();}
 x.fillStyle='#111';x.beginPath();x.arc(64,58,5,0,7);x.fill();
 x.fillStyle=variant?'#c9a227':'#5c1a1f';x.font='22px VT323, monospace';x.textAlign='center';x.fillText(variant?'SOU EU':'FESTA DO BOB!',64,118);
}
const TEX={
 poster:ctex(128,128,(x)=>drawPoster(x,false)),
 celebrate:ctex(128,128,(x)=>{x.fillStyle='#120c10';x.fillRect(0,0,128,128);x.fillStyle='#f2b33d';x.font='30px VT323, monospace';x.textAlign='center';x.fillText('COMEMORE!',64,30);[['#c8252c',30],['#3b6fd6',64],['#e97db4',98]].forEach(([c,cx])=>{x.fillStyle=c;x.beginPath();x.arc(cx,80,16,0,7);x.fill();x.fillStyle='#fff';x.fillRect(cx-8,74,5,5);x.fillRect(cx+3,74,5,5);});x.fillStyle='#efe6cf';x.font='16px VT323, monospace';x.fillText('BOB & AMIGOS',64,118);}),
 kids:ctex(256,128,(x)=>{x.fillStyle='#1b1d26';x.fillRect(0,0,256,128);const cols=['#c8252c','#3b6fd6','#7a3cc0','#e97db4','#f08a24','#c8252c','#3b6fd6','#f08a24'];for(let i=0;i<8;i++){const px=6+(i%4)*62,py=6+Math.floor(i/4)*60;x.save();x.translate(px+28,py+28);x.rotate((Math.random()-.5)*.3);x.fillStyle='#f4efe2';x.fillRect(-27,-26,54,52);x.strokeStyle=cols[i];x.lineWidth=3;x.beginPath();x.arc(0,-10,9,0,7);x.moveTo(0,-1);x.lineTo(0,14);x.moveTo(-10,4);x.lineTo(10,4);x.moveTo(0,14);x.lineTo(-7,22);x.moveTo(0,14);x.lineTo(7,22);x.stroke();x.restore();}}),
 stage:signTex('BOB & AMIGOS','#7d1222','#f2b33d',44),
 birthday:signTex('FELIZ ANIVERSÁRIO','#1a2a55','#f2b33d',34),
 smile:ctex(64,64,(x)=>{x.fillStyle='#e9dcc0';x.fillRect(0,0,64,64);x.fillStyle='#5c1a1f';x.font='18px VT323, monospace';x.textAlign='center';x.fillText('SORRIA!',32,58);x.fillStyle='#c8252c';x.beginPath();x.arc(32,26,16,0,7);x.fill();x.fillStyle='#fff';x.fillRect(24,20,5,5);x.fillRect(35,20,5,5);}),
 rules:ctex(64,64,(x)=>{x.fillStyle='#d8cfb8';x.fillRect(0,0,64,64);x.fillStyle='#222';x.font='11px VT323, monospace';['REGRAS:','1. NÃO CORRA','2. NÃO GRITE','3. NÃO SAIA','   APÓS 0H'].forEach((l,i)=>x.fillText(l,4,12+i*12));}),
 exit:signTex('SAÍDA','#0f3a18','#8fe38f',44),
 power:signTex('NÃO DESLIGUE A ENERGIA','#1d1a14','#c9b98a',22)
};

/* ---------- OFFICE ---------- */
const OFF=new THREE.Group(); scene.add(OFF);
const WALL=0x2b2d39, TRIM=0x5c1a1f, METAL=0x3b3f47;
(function buildOffice(){
 const f=new THREE.Mesh(new THREE.PlaneGeometry(5.2,4.4),floorMat(5.2,4.4)); f.rotation.x=-Math.PI/2; f.position.z=0; OFF.add(f);
 slab(-2.6,2.6,3,3.1,-2.1,2.2,0x14141a,OFF);
 slab(-2.6,2.6,0,3.1,2,2.2,WALL,OFF);
 // front wall with hallway + vent holes
 slab(-2.6,-.8,0,2.2,-2.1,-1.9,WALL,OFF); slab(-2.6,-2.2,2.2,2.7,-2.1,-1.9,WALL,OFF); slab(-1.4,-.8,2.2,2.7,-2.1,-1.9,WALL,OFF);
 slab(-2.6,-.8,2.7,3.1,-2.1,-1.9,WALL,OFF); slab(.8,2.6,0,3.1,-2.1,-1.9,WALL,OFF); slab(-.8,.8,2.4,3.1,-2.1,-1.9,WALL,OFF);
 [2.3,2.4,2.5,2.6].forEach(y=>slab(-2.2,-1.4,y-.015,y+.015,-1.9,-1.87,METAL,OFF));
 slab(-2.25,-1.35,2.15,2.2,-1.9,-1.86,0x555a62,OFF); slab(-2.25,-1.35,2.7,2.75,-1.9,-1.86,0x555a62,OFF);
 // side walls with doors
 [-1,1].forEach(s=>{
  const a=s*2.4,b=s*2.6,x1=Math.min(a,b),x2=Math.max(a,b);
  slab(x1,x2,0,3.1,-2.1,-.4,WALL,OFF); slab(x1,x2,0,3.1,1,2.2,WALL,OFF); slab(x1,x2,2.3,3.1,-.4,1,WALL,OFF);
  slab(s*2.38-.02,s*2.38+.02,0,2.35,-.48,-.4,0xd9a52e,OFF); slab(s*2.38-.02,s*2.38+.02,0,2.35,1,1.08,0xd9a52e,OFF);
  box(.04,.18,.12,0x881010,s*2.38,1.25,-.75,OFF); box(.04,.12,.12,0x10308a,s*2.38,1.0,-.75,OFF);
  // outside corridor
  const o1=s*2.6,o2=s*5,ox1=Math.min(o1,o2),ox2=Math.max(o1,o2);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3),floorMat(2.4,3)); fl.rotation.x=-Math.PI/2; fl.position.set(s*3.8,0,.3); OFF.add(fl);
  slab(ox1,ox2,2.6,2.7,-1.2,1.8,0x101014,OFF); slab(ox1,ox2,0,2.6,-1.4,-1.2,0x24252f,OFF); slab(ox1,ox2,0,2.6,1.8,2,0x24252f,OFF);
  slab(s>0?5:-5.2,s>0?5.2:-5,0,2.6,-1.2,1.8,0x24252f,OFF);
 });
 // stripes
 slab(-2.6,-.8,.9,1,-1.9,-1.88,TRIM,OFF); slab(.8,2.6,.9,1,-1.9,-1.88,TRIM,OFF);
 slab(-2.4,-2.38,.9,1,-1.9,-.48,TRIM,OFF); slab(2.38,2.4,.9,1,-1.9,-.48,TRIM,OFF);
 // hallway
 const hf=new THREE.Mesh(new THREE.PlaneGeometry(1.6,9),floorMat(1.6,9)); hf.rotation.x=-Math.PI/2; hf.position.set(0,0,-6.5); OFF.add(hf);
 slab(-1,-.8,0,2.4,-11,-2,0x1d1e26,OFF); slab(.8,1,0,2.4,-11,-2,0x1d1e26,OFF); slab(-.8,.8,2.4,2.5,-11,-2,0x101014,OFF); slab(-.8,.8,0,2.4,-11.2,-11,0x1d1e26,OFF);
 plane(.5,.5,TEX.smile,-.79,1.5,-4.4,Math.PI/2,OFF); plane(.5,.5,TEX.rules,.79,1.5,-7,-Math.PI/2,OFF);
 // duct
 slab(-2.25,-1.35,2.15,2.2,-4.5,-2.1,0x1a1c20,OFF); slab(-2.25,-1.35,2.7,2.75,-4.5,-2.1,0x1a1c20,OFF);
 slab(-2.25,-2.2,2.2,2.7,-4.5,-2.1,0x1a1c20,OFF); slab(-1.4,-1.35,2.2,2.7,-4.5,-2.1,0x1a1c20,OFF); slab(-2.25,-1.35,2.15,2.75,-4.55,-4.5,0x1a1c20,OFF);
 // posters & drawings
 plane(.8,.8,TEX.poster,-1.65,1.4,-1.885,0,OFF);
 plane(.7,.7,TEX.celebrate,1.65,1.75,-1.885,0,OFF);
 plane(1.4,.7,TEX.kids,-2.385,1.55,-1.2,Math.PI/2,OFF);
 plane(1.2,.3,TEX.power,2.385,1.9,-1.2,-Math.PI/2,OFF);
 // desk
 slab(-1.3,1.3,.74,.8,-.1,.6,0x4a3324,OFF); slab(-1.3,1.3,0,.74,-.12,-.08,0x2c1e15,OFF);
 slab(-1.3,-1.2,0,.74,-.1,.6,0x2c1e15,OFF); slab(1.2,1.3,0,.74,-.1,.6,0x2c1e15,OFF);
 slab(-.75,-.25,.8,.84,.05,.25,0x1c1c1c,OFF); slab(-.72,-.28,.84,1.16,.12,.18,0x1c1c1c,OFF);
 // papers, phone, soda
 box(.25,.01,.32,0xe9e0c8,.3,.805,.35,OFF).rotation.y=.3; box(.22,.01,.3,0xd8ceb4,.15,.81,.3,OFF).rotation.y=-.2;
 box(.18,.06,.12,0x7a1010,1.0,.83,.42,OFF); box(.2,.04,.05,0x501010,1.0,.88,.42,OFF);
 mesh(new THREE.CylinderGeometry(.04,.035,.14,7),0xc8252c,-.95,.87,.45,OFF);
 // cupcake with eyes
 mesh(new THREE.CylinderGeometry(.06,.05,.07,8),0xe97db4,-1.0,.835,.15,OFF);
 mesh(new THREE.SphereGeometry(.07,7,5),0xfbe0ee,-1.0,.89,.15,OFF);
 mesh(new THREE.SphereGeometry(.012,5,3),0x111111,-1.02,.9,.21,OFF); mesh(new THREE.SphereGeometry(.012,5,3),0x111111,-.98,.9,.21,OFF);
 mesh(new THREE.CylinderGeometry(.006,.006,.08,4),0xffffff,-1.0,.98,.15,OFF);
 mesh(new THREE.SphereGeometry(.015,4,3),new THREE.MeshBasicMaterial({color:0xffb030}),-1.0,1.03,.15,OFF);
 // lamp
 mesh(new THREE.CylinderGeometry(.01,.01,.3,4),0x222222,0,2.95,.3,OFF);
 mesh(new THREE.ConeGeometry(.25,.18,8,1,true),0x333333,0,2.75,.3,OFF);
})();
const monitorScreen=new THREE.Mesh(new THREE.PlaneGeometry(.4,.26),new THREE.MeshBasicMaterial({color:0x2a7a32}));
monitorScreen.position.set(-.5,1.0,.185); OFF.add(monitorScreen);
const fanBlades=new THREE.Group(); fanBlades.position.set(.75,1.08,.25); OFF.add(fanBlades);
mesh(new THREE.CylinderGeometry(.03,.08,.28,6),0x333333,.75,.94,.22,OFF);
for(let i=0;i<4;i++){const b=box(.05,.2,.01,0x777777,0,.1,0);const p=new THREE.Group();p.add(b);p.rotation.z=i*Math.PI/2;fanBlades.add(p);}
const noseMesh=mesh(new THREE.SphereGeometry(.035,6,4),0x111111,-1.65,1.4+.04,-1.86,OFF);
// doors
function makeShutter(s){const gr=new THREE.Group();slab(-.03,.03,-1.15,1.15,-.7,.7,0x555a62,gr);for(let y=-1;y<1.1;y+=.25)slab(-.035,.035,y,y+.03,-.7,.7,0x3b3f46,gr);slab(-.04,.04,-1.15,-1.0,-.7,.7,0xd9a52e,gr);gr.position.set(s*2.5,3.5,.3);OFF.add(gr);return gr;}
const doorL=makeShutter(-1), doorR=makeShutter(1);
// lights
const lamp=new THREE.PointLight(0xffc878,1.15,7.5,1.4); lamp.position.set(0,2.6,.3); scene.add(lamp);
const redL=new THREE.PointLight(0xff2a2a,.9,3.6,1.5); redL.position.set(-4.1,2.2,.3); scene.add(redL);
const redR=new THREE.PointLight(0xff2a2a,.9,3.6,1.5); redR.position.set(4.1,2.2,.3); scene.add(redR);
const spot=new THREE.SpotLight(0xfff1c8,0,15,.3,.5,1.1); spot.position.set(0,1.25,1.0); scene.add(spot); scene.add(spot.target);
const jsLight=new THREE.PointLight(0xffffff,0,3.5,1); scene.add(jsLight);

/* ---------- ROOMS (câmeras) ---------- */
const ROOMS={};
function shell(G,w,d,h,wallC,ceilC){
 const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),floorMat(w,d)); f.rotation.x=-Math.PI/2; G.add(f);
 slab(-w/2,w/2,h,h+.1,-d/2,d/2,ceilC||0x101014,G);
 slab(-w/2-.1,-w/2,0,h,-d/2,d/2,wallC,G); slab(w/2,w/2+.1,0,h,-d/2,d/2,wallC,G);
 slab(-w/2,w/2,0,h,-d/2-.1,-d/2,wallC,G); slab(-w/2,w/2,0,h,d/2,d/2+.1,wallC,G);
 slab(-w/2,w/2,.9,1,-d/2,-d/2+.02,TRIM,G);
}
const ROOMDEF={
 1:G=>{shell(G,10,8,3.6,0x2a1c22);slab(-4,4,0,.5,-4,-1.6,0x4d2c17,G);slab(-4,4,.5,.52,-4,-1.6,0x5e3a20,G);
   [-1,1].forEach(s=>slab(s*4.6-.4,s*4.6+.4,0,3.6,-4,-1.6,0x6b0f1a,G));slab(-5,5,3,3.6,-4,-3.4,0x7d1222,G);
   plane(3,.75,TEX.stage,0,2.55,-3.98,0,G);
   [-2.8,0,2.8].forEach(x=>{const st=mesh(new THREE.OctahedronGeometry(.18),mat(0xe9c46a,{emissive:0x332200}),x,3.2,-3.3,G);st.scale.z=.3;});
   return {cam:[3.8,3.1,3.4],look:[-.4,1.3,-2.6],slots:[[-2.4,.5,-2.7],[-.8,.5,-3],[.8,.5,-3],[2.4,.5,-2.7],[3.6,0,-.6]],light:[0xffc890,1.3,12,[0,3.2,0]]};},
 2:G=>{shell(G,10,8,3.4,0x1e2233);slab(-3.5,3.5,.72,.78,-.7,.7,0xe8e2d0,G);
   [-3.2,3.2].forEach(x=>[-.5,.5].forEach(z=>slab(x-.05,x+.05,0,.72,z-.05,z+.05,0x444444,G)));
   [0xc8252c,0x3b6fd6,0xf08a24,0x7a3cc0].forEach((c,i)=>mesh(new THREE.ConeGeometry(.12,.3,6),c,-2.4+i*1.6,.93,0,G));
   [[-4,2.6,-3,0xc8252c],[-3.3,2.9,-3.3,0x3b6fd6],[3.6,2.7,-3.2,0xf08a24],[4.1,2.4,-2.6,0x7a3cc0]].forEach(([x,y,z,c])=>{const b=mesh(new THREE.SphereGeometry(.25,7,5),c,x,y,z,G);b.scale.y=1.2;slab(x-.006,x+.006,y-1.4,y-.3,z-.006,z+.006,0x999999,G);});
   plane(3.4,.7,TEX.birthday,0,2.7,-3.98,0,G);
   return {cam:[4.2,3,3.4],look:[-.5,1,-1.4],slots:[[-2.6,0,-2.7],[-.9,0,-2.9],[.9,0,-2.9],[2.6,0,-2.7],[-1.5,0,1.8]],light:[0xaabbff,.9,12,[0,3,0]]};},
 4:G=>{shell(G,3,14,2.8,0x1b1b22);plane(.8,.8,TEX.smile,-1.49,1.5,-2,Math.PI/2,G);plane(1.2,.6,TEX.kids,1.49,1.5,1,-Math.PI/2,G);
   return {cam:[1.1,2.5,6.6],look:[-.1,1.1,-3],slots:[[0,0,-1],[-.5,0,1.8],[.5,0,-3.6],[0,0,3.6],[0,0,-5.6]],light:[0x99aacc,.7,9,[0,2.6,0]]};},
 5:G=>{shell(G,3,14,2.8,0x1b1b22);plane(.8,.4,TEX.exit,0,2.4,-6.95,0,G,true);plane(.8,.8,TEX.rules,-1.49,1.5,0,Math.PI/2,G);
   return {cam:[-1.1,2.5,6.6],look:[.1,1.1,-3],slots:[[0,0,-1],[.5,0,1.8],[-.5,0,-3.6],[0,0,3.6],[0,0,-5.6]],light:[0x99ccaa,.7,9,[0,2.6,0]]};},
 6:G=>{shell(G,8,7,3,0x1d1913);
   [[-3.9,-1.5],[1.5,3.9]].forEach(([a,b])=>[.9,1.8,2.6].forEach(y=>slab(a,b,y,y+.05,-3.5,-2.8,0x3a2f22,G)));
   [[-3.4,.95,.5],[-2.6,.95,.4],[2.2,1.85,.45],[3.3,0,.6],[-3,0,.7],[2.8,.95,.5]].forEach(([x,y,s])=>box(s,s*.8,s,0x5a4630,x,y+s*.4,-3.1,G));
   [[-2.1,0x7d1015],[-1.75,0x1d3d85]].forEach(([x,c])=>{mesh(new THREE.IcosahedronGeometry(.2,1),c,x,2.05,-3.15,G);mesh(new THREE.SphereGeometry(.04,5,3),0x000000,x-.07,2.1,-2.97,G);mesh(new THREE.SphereGeometry(.04,5,3),0x000000,x+.07,2.1,-2.97,G);});
   mesh(new THREE.IcosahedronGeometry(.2,1),0x431d70,2.5,2.85,-3.15,G);
   return {cam:[3.4,2.7,3],look:[-.5,1,-1.2],slots:[[-1.8,0,-1.6],[0,0,-1.9],[1.8,0,-1.6],[0,0,.8],[-1,0,.3]],light:[0xffd9a0,.6,9,[0,2.8,0]]};},
 7:G=>{shell(G,1.4,10,1.3,0x202328,0x202328);for(let z=-4.5;z<=4.5;z+=1.5)slab(-.7,.7,1.22,1.3,z-.04,z+.04,0x15171a,G);
   return {cam:[0,1.0,4.6],look:[0,.4,-3],slots:[[0,0,-.6],[0,0,1.6],[0,0,-2.8],[.2,0,.6]],scale:.45,light:[0x88ffaa,.5,7,[0,1.1,1]]};},
 8:G=>{shell(G,10,8,3.4,0x1a1d2b);
   slab(-4.6,-1.2,0,.45,-3.8,-3.6,0x3b6fd6,G);slab(-4.6,-1.2,0,.45,-1.2,-1,0x3b6fd6,G);slab(-4.8,-4.6,0,.45,-3.8,-1,0x3b6fd6,G);slab(-1.2,-1,0,.45,-3.8,-1,0x3b6fd6,G);
   const cols=[0xc8252c,0x3b6fd6,0xf08a24,0x7a3cc0,0xe97db4,0xffd23f],bg=new THREE.SphereGeometry(.11,5,4);
   for(let i=0;i<70;i++)mesh(bg,cols[i%6],-4.5+Math.random()*3.3,.15+Math.random()*.2,-3.5+Math.random()*2.4,G);
   const sl=box(.8,.06,3.4,0xc8252c,2.9,1.2,-2.1,G);sl.rotation.x=.6;slab(2.6,3.2,0,2.3,-3.95,-3.75,0x666666,G);
   return {cam:[4.2,3,3.4],look:[-.6,1,-1.4],slots:[[.4,0,-2.6],[1.6,0,-.6],[-.4,0,-.2],[3.6,0,.6],[-2.9,.3,-2.4]],light:[0xd0a0ff,.8,12,[0,3,0]]};}
};
Object.keys(ROOMDEF).forEach(k=>{
 const id=+k, ox=40+id*20, G=new THREE.Group(); G.position.set(ox,0,0); scene.add(G);
 const d=ROOMDEF[id](G);
 const cam=mkCam(68); cam.position.set(ox+d.cam[0],d.cam[1],d.cam[2]); cam.lookAt(ox+d.look[0],d.look[1],d.look[2]);
 const L=new THREE.PointLight(d.light[0],d.light[1],d.light[2],1.4); L.position.set(ox+d.light[3][0],d.light[3][1],d.light[3][2]); scene.add(L);
 ROOMS[id]={cam,base:cam.quaternion.clone(),light:L,baseI:d.light[1],slots:d.slots.map(s=>new THREE.Vector3(ox+s[0],s[1],s[2])),scale:d.scale||1};
});
menuCam.position.set(60.3,1.35,2.4); menuCam.lookAt(60,1.75,-2.7); const menuBase=menuCam.quaternion.clone();

/* ---------- ANIMATRONICS (low poly) ---------- */
const PAL3={bob:{m:0xc8252c,l:0xf08a8e,d:0x7d1015,eye:0xfffbe6},bibi:{m:0x3b6fd6,l:0x9cbcf3,d:0x1d3d85,eye:0xfffbe6},dewy:{m:0x7a3cc0,l:0xbf98e8,d:0x431d70,eye:0xfffbe6},titi:{m:0xe97db4,l:0xfbd0e4,d:0xa6437a,eye:0xfffbe6},boba:{m:0xf08a24,l:0xffd08f,d:0xa4500b,eye:0xfffbe6},clown:{m:0xf3efe6,l:0xffffff,d:0x5b2a86,eye:0xff2244},golden:{m:0xc9a227,l:0xe8cf7a,d:0x7a5e10,eye:0x000000,hollow:true},shadow:{m:0x060608,l:0x0a0a0c,d:0x030304,eye:0xffffff,darkWhites:true}};
function makeBot(type){
 const P=PAL3[type], grp=new THREE.Group();
 const M=mat(P.m),L=mat(P.l),D=mat(P.d),white=mat(type==='shadow'?0x111111:0xf1ede2),blk=mat(0x111111);
 const clown=type==='clown', dog=type==='bob'||type==='golden', cat=type==='dewy'||type==='shadow';
 box(.2,.8,.22,clown?0x2a9d8f:P.d,-.15,.4,0,grp); box(.2,.8,.22,clown?0x7b2cbf:P.d,.15,.4,0,grp);
 box(.26,.1,.36,clown?0xd00000:P.d,-.15,.05,.06,grp); box(.26,.1,.36,clown?0xd00000:P.d,.15,.05,.06,grp);
 if(clown){
  box(.34,.78,.5,0x7b2cbf,-.17,1.19,0,grp); box(.34,.78,.5,0x2a9d8f,.17,1.19,0,grp);
  [1.0,1.2,1.4].forEach(y=>mesh(new THREE.SphereGeometry(.04,6,4),0xffd60a,0,y,.26,grp));
  const r=mesh(new THREE.TorusGeometry(.3,.08,5,10),white,0,1.58,0,grp); r.rotation.x=Math.PI/2;
 } else {
  mesh(new THREE.CylinderGeometry(.34,.3,.78,7),M,0,1.19,0,grp);
  const b=mesh(new THREE.SphereGeometry(.25,6,5),L,0,1.14,.2,grp); b.scale.set(1,1.2,.55);
  const bt=new THREE.ConeGeometry(.07,.12,4); const b1=mesh(bt,blk,-.07,1.55,.3,grp); b1.rotation.z=-Math.PI/2; const b2=mesh(bt,blk,.07,1.55,.3,grp); b2.rotation.z=Math.PI/2;
 }
 const mkArm=s=>{const pv=new THREE.Group();pv.position.set(s*.43,1.5,0);grp.add(pv);const ac=clown?(s<0?0x7b2cbf:0x2a9d8f):P.m;box(type==='boba'?.08:.16,.66,type==='boba'?.3:.18,ac,0,-.33,0,pv);mesh(new THREE.SphereGeometry(.1,6,4),clown?white:L,0,-.7,0,pv);return pv;};
 const armL=mkArm(-1),armR=mkArm(1);
 const head=new THREE.Group(); head.position.set(0,1.82,0); grp.add(head);
 mesh(new THREE.IcosahedronGeometry(.33,1),M,0,0,0,head);
 const pupils=[];
 [-1,1].forEach(s=>{
  mesh(new THREE.SphereGeometry(.085,7,5),(P.hollow||P.darkWhites)?blk:white,s*.12,.06,.27,head);
  const p=new THREE.Mesh(new THREE.SphereGeometry(.036,6,4),new THREE.MeshBasicMaterial({color:P.eye,fog:false})); p.position.set(s*.12,.06,.345); head.add(p);
  if(P.hollow) p.visible=false; pupils.push(p);
 });
 const jaw=new THREE.Group(); jaw.position.set(0,-.15,.17); head.add(jaw);
 box(clown?.34:.26,.07,.18,clown?0xb5121f:0x250808,0,-.03,.06,jaw);
 const toothG=new THREE.ConeGeometry(.018,.05,4);
 for(let i=0;i<5;i++){mesh(toothG,white,-.1+i*.05,.02,.14,jaw);const t=mesh(toothG,white,-.1+i*.05,-.13,.31,head);t.rotation.x=Math.PI;}
 if(dog){
  [-1,1].forEach(s=>{const e=box(.1,.38,.2,P.d,s*.31,-.06,0,head);e.rotation.z=s*.25;});
  box(.24,.13,.2,P.l,0,-.03,.3,head); mesh(new THREE.SphereGeometry(.055,6,4),blk,0,.02,.41,head);
 } else if(type==='bibi'){
  [-1,1].forEach(s=>{const e=mesh(new THREE.CylinderGeometry(.3,.3,.04,7),D,s*.38,0,-.05,head);e.rotation.z=Math.PI/2;const i=mesh(new THREE.CylinderGeometry(.2,.2,.02,7),L,s*.405,0,-.03,head);i.rotation.z=Math.PI/2;const tk=mesh(new THREE.ConeGeometry(.03,.18,5),white,s*.13,-.16,.32,head);tk.rotation.x=Math.PI*.55;});
  [.085,.075,.065,.055].forEach((r,i)=>{const c=mesh(new THREE.CylinderGeometry(r,r*.9,.17,6),M,0,-.02-i*.15,.33+i*.03,head);c.rotation.x=-.15-i*.05;});
 } else if(cat){
  [-1,1].forEach(s=>{const e=mesh(new THREE.ConeGeometry(.12,.26,4),M,s*.19,.3,0,head);e.rotation.z=-s*.35;for(let k=0;k<2;k++){const w=box(.26,.012,.012,0xdddddd,s*.24,-.05-k*.04,.3,head);w.rotation.z=s*(.12-k*.2);}});
  const mz=mesh(new THREE.SphereGeometry(.13,6,4),L,0,-.06,.25,head); mz.scale.set(1.2,.8,.8);
  const ns=mesh(new THREE.ConeGeometry(.035,.05,3),0xff7fb0,0,-.01,.37,head); ns.rotation.x=Math.PI;
  const tl=mesh(new THREE.CylinderGeometry(.05,.04,.8,5),M,0,1.15,-.45,grp); tl.rotation.x=-.9;
 } else if(type==='titi'){
  [-1,1].forEach(s=>{const h=mesh(new THREE.ConeGeometry(.05,.22,5),0xf1e2bd,s*.22,.3,0,head);h.rotation.z=-s*.6;box(.22,.07,.12,P.d,s*.38,.08,0,head);});
  box(.32,.17,.16,P.l,0,-.08,.29,head); box(.04,.05,.02,blk,-.07,-.06,.375,head); box(.04,.05,.02,blk,.07,-.06,.375,head);
  box(.14,.1,.02,0xffffff,-.12,.16,.27,head); box(.16,.14,.03,0xffffff,.15,1.3,.31,grp); box(.12,.12,.03,0xffffff,-.18,1.05,.3,grp);
 } else if(type==='boba'){
  [[-.07,.33,0],[0,.37,.02],[.07,.33,0]].forEach(p=>mesh(new THREE.SphereGeometry(.075,6,4),0xe01e37,p[0],p[1],p[2],head));
  const bk=mesh(new THREE.ConeGeometry(.08,.22,4),0xffd23f,0,-.04,.4,head); bk.rotation.x=Math.PI/2;
  const wt=mesh(new THREE.SphereGeometry(.05,6,4),0xe01e37,0,-.2,.3,head); wt.scale.set(1,1.6,1);
 } else if(clown){
  [-1,1].forEach(s=>{[[.33,0,-.02,.15],[.3,-.17,0,.12],[.29,.15,-.05,.12]].forEach(([x,y,z,r])=>mesh(new THREE.SphereGeometry(r,6,4),0x2bb3a3,s*x,y,z,head));const dm=mesh(new THREE.OctahedronGeometry(.09),0x1d1a6e,s*.12,.06,.25,head);dm.scale.set(.7,1.6,.4);});
  const hat=mesh(new THREE.ConeGeometry(.17,.45,6),0x7b2cbf,.03,.48,0,head); hat.rotation.z=-.15;
  mesh(new THREE.SphereGeometry(.06,6,4),0xffd60a,.07,.72,0,head);
  mesh(new THREE.SphereGeometry(.075,7,5),0xd00000,0,-.03,.37,head);
 }
 grp.userData={head,jaw,armL,armR,pupils,type,base:clown?1.08:(type==='boba'?.92:1),tw:0,twY:0,ph:Math.random()*6};
 grp.scale.setScalar(grp.userData.base);
 return grp;
}
const bots={};
['bob','bibi','dewy','titi','boba','clown','golden','shadow'].forEach(id=>{bots[id]=makeBot(id);bots[id].visible=false;scene.add(bots[id]);});

/* ---------- GALLERY ---------- */
const gScene=new THREE.Scene(); gScene.background=new THREE.Color(0x070506);
gScene.add(new THREE.AmbientLight(0x403040,.8));
const gSpot=new THREE.SpotLight(0xffe0b0,2.2,14,.5,.6,1); gSpot.position.set(1.5,4.5,3); gScene.add(gSpot); gSpot.target.position.set(0,1,0); gScene.add(gSpot.target);
const gRim=new THREE.PointLight(0xff3040,1,6); gRim.position.set(-2,2.2,-2); gScene.add(gRim);
mesh(new THREE.CylinderGeometry(1,1.05,.12,10),0x2a1f18,0,.06,0,gScene);
const gCam=mkCam(42); gCam.position.set(0,1.4,4.6);
const gBots={}; let gSel='bob', gRot=0, gDrag=null;

/* ================= UI / SCREENS ================= */
let mode='splash';
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));}
const MUSIC_MODES=['menu','extras','intro','custom'];
function setMode(m,screen){
 mode=m; show(screen||m);
 if(MUSIC_MODES.includes(m)) sloop('menu',.55); else sunloop('menu',.6);
 if(!['game','jumpscare','extras'].includes(m)){amb.intensity=.55;layoutMenu();}
 if(m==='menu') buildMenu();
 $('#gl').classList.toggle('cctv',false);
}
function buildMenu(){
 $('#bCont').classList.toggle('hidden',save.night<=1);
 $('#bCont').textContent='Continuar (Noite '+save.night+')';
 $('#bSix').classList.toggle('hidden',!save.n6);
 $('#bCustom').classList.toggle('hidden',!save.won6);
 const np=$('#nightPick'); np.innerHTML='';
 if(save.night>1||save.n6){
  for(let n=1;n<=save.night;n++){const b=document.createElement('button');b.className='chip';b.textContent='Noite '+n;b.onclick=()=>openIntro(n);np.appendChild(b);}
  if(save.n6){const b=document.createElement('button');b.className='chip boss';b.textContent='Noite 6';b.onclick=()=>openIntro(6);np.appendChild(b);}
 }
 $('#stars').textContent=(save.n6?'★':'')+(save.won6?'★':'')+(save.max?'★':'');
}
function hideBots(){Object.values(bots).forEach(b=>b.visible=false);}
function putBot(id,x,y,z,s,lx,lz){const b=bots[id];b.visible=true;b.position.set(x,y,z);b.scale.setScalar((s||1)*b.userData.base);b.lookAt(lx,y,lz);b.rotation.x=0;}
function layoutMenu(){
 hideBots();
 const R=ROOMS[1], c=menuCam.position;
 const lead=Math.random()<.1?'golden':'bob';
 [lead,'bibi','dewy','titi','boba'].forEach((id,i)=>{const p=R.slots[[1,0,3,2,4][i]];putBot(id,p.x,p.y,p.z,1,c.x,c.z);});
 if(save.n6) putBot('clown',63.6,0,-1.2,1,c.x,c.z);
}
function openIntro(n){
 curNight=n; audio();
 $('#introNight').textContent='NOITE '+n;
 $('#introSub').textContent=n===6?'Batalha final':(n===7?'Personalizada':'12:00 AM');
 $('#introCall').innerHTML=CALLS[n];
 setMode('intro');
}
function buildExtras(){
 const L=$('#exList'); L.innerHTML='';
 ['bob','bibi','dewy','titi','boba','clown','golden'].forEach(id=>{
  const locked=(id==='clown'&&!save.n6)||(id==='golden'&&!save.seenGolden);
  const b=document.createElement('button'); b.className='exb'+(id===gSel?' on':''); b.style.setProperty('--c',CHARS[id].color);
  b.textContent=locked?'???':CHARS[id].name; b.onclick=()=>{gSel=id;buildExtras();};
  L.appendChild(b);
 });
 const locked=(gSel==='clown'&&!save.n6)||(gSel==='golden'&&!save.seenGolden);
 const ch=CHARS[gSel];
 $('#exName').textContent=locked?'???':ch.name; $('#exName').style.color=ch.color;
 $('#exSp').textContent=locked?(gSel==='clown'?'Termine a Noite 5 para revelar':'Um segredo raro. Continue jogando.'):ch.sp;
 $('#exDef').innerHTML=locked?'':'<b>Defesa:</b> '+ch.how;
 $('#exBio').textContent=locked?'':ch.bio;
 Object.values(gBots).forEach(b=>b.visible=false);
 if(!gBots[gSel]){gBots[gSel]=makeBot(gSel);gBots[gSel].position.y=.12;gScene.add(gBots[gSel]);}
 const gb=gBots[gSel]; gb.visible=true;
 gb.traverse(o=>{if(o.isMesh&&o.material){if(locked){if(!o.userData.orig){o.userData.orig=o.material;}o.material=mat(0x000000);}else if(o.userData.orig){o.material=o.userData.orig;}}});
 if(gSel==='clown'&&!locked) play('laugh',{dur:1.6,vol:.6});
 setMode('extras');
}
let curNight=1;
$('#bSplash').onclick=()=>{audio();setMode('menu');};
$('#bNew').onclick=()=>openIntro(1);
$('#bCont').onclick=()=>openIntro(save.night);
$('#bSix').onclick=()=>openIntro(6);
$('#bCustom').onclick=()=>{buildCustom();setMode('custom');};
$('#bExtras').onclick=buildExtras;
$('#bExtBack').onclick=()=>setMode('menu');
$('#bIntroBack').onclick=()=>setMode('menu');
$('#bStart').onclick=()=>startNight(curNight);
$('#bRetry').onclick=()=>openIntro(curNight);
$('#bGoMenu').onclick=()=>{stopSix();setMode('menu');};
$('#bWinMenu').onclick=()=>{stopSix();setMode('menu');};
$('#bBossMenu').onclick=()=>{stopSix();setMode('menu');};
$('#bNext').onclick=()=>{stopSix();openIntro(curNight>=5?6:curNight+1);};
$('#bCustomBack').onclick=()=>setMode('menu');
$('#bCustomGo').onclick=()=>{persist();openIntro(7);};
$('#quitBtn').onclick=()=>{if(g)g.over=true;endNightAudio();setMode('menu');};
let sixHandle=null; function stopSix(){if(sixHandle){sixHandle.stop(.8);sixHandle=null;}}

function buildCustom(){
 const R=$('#customRows'); R.innerHTML='';
 ORDER.forEach(id=>{
  const row=document.createElement('div'); row.className='row';
  row.innerHTML=`<b style="color:${CHARS[id].color}">${CHARS[id].name}</b><button aria-label="Diminuir">−</button><span>${save.custom[id]}</span><button aria-label="Aumentar">+</button>`;
  const [m,p]=row.querySelectorAll('button'), sp=row.querySelector('span');
  m.onclick=()=>{save.custom[id]=Math.max(0,save.custom[id]-1);sp.textContent=save.custom[id];};
  p.onclick=()=>{save.custom[id]=Math.min(20,save.custom[id]+1);sp.textContent=save.custom[id];};
  R.appendChild(row);
 });
 const P=$('#presets'); P.innerHTML='';
 [['Todos 0',0],['Todos 10',10],['20/20/20/20/20',20]].forEach(([l,v])=>{const b=document.createElement('button');b.className='chip'+(v===20?' boss':'');b.textContent=l;b.onclick=()=>{ORDER.forEach(id=>save.custom[id]=v);buildCustom();};P.appendChild(b);});
}

/* map */
const MAPLAYOUT=[6,1,0,3,2,8,4,7,5,-1,'you',-1];
(function(){const m=$('#map');MAPLAYOUT.forEach(v=>{const b=document.createElement('button');if(v===-1||v===0){b.className='mapb empty';b.tabIndex=-1;}else if(v==='you'){b.className='mapb you';b.innerHTML='<b>VOCÊ</b>sala';b.tabIndex=-1;}else{b.className='mapb';b.dataset.cam=v;b.innerHTML=`<b>CAM ${v}</b>${CAMS[v].split(' ')[0]}`;b.onclick=()=>setCam(v);}m.appendChild(b);});})();

/* ================= GAME ================= */
let g=null;
const holds=new Set();
const has=a=>holds.has(a+':k')||holds.has(a+':p');
let yaw=0,yawT=0,pitch=-.04,edgeV=0;
const keysLook={left:false,right:false};

function startNight(n){
 audio(); stopSix(); curNight=n;
 const lv=n===7?save.custom:(n===6?null:LEVELS[n]);
 g={night:n,boss:n===6,t:0,power:100,doors:{l:false,r:false},doorY:{l:3.5,r:3.5},heat:{l:0,r:0},jam:{l:0,r:0},cams:false,cam:1,flash:null,mask:false,powerOut:false,outTimer:0,mbT:0,over:false,chars:{},bossS:null,staticBurst:0,toastT:0,kitchenT:1,rare:null,flick:0};
 ORDER.forEach(id=>{g.chars[id]={state:'move',step:0,timer:CHARS[id].interval*(1+Math.random()),level:lv?lv[id]:0};});
 if(g.boss) g.bossS={hp:BOSS_HP,atk:null,cd:5,last:null};
 if(!g.boss&&Math.random()<.35){const types=['golden','shadow','poster'];g.rare={type:types[Math.floor(Math.random()*3)],at:35+Math.random()*180,active:false,done:false,t:0,look:0,cam:[1,2,4,5,6,8][Math.floor(Math.random()*6)],seen:false};}
 drawPoster(TEX.poster.userData.ctx,false); TEX.poster.needsUpdate=true;
 holds.clear(); yaw=yawT=0;
 doorL.position.y=doorR.position.y=3.5;
 lamp.intensity=1.15; amb.intensity=.55; redL.intensity=redR.intensity=.9; monitorScreen.material.color.setHex(0x2a7a32);
 $('#bossBar').classList.toggle('hidden',!g.boss);
 $('#shockBtn').classList.toggle('hidden',!g.boss);
 $('#camsUI').classList.add('hidden');
 $('#nightLbl').textContent=n===7?'Noite 7':'Noite '+n;
 $('#danger').style.opacity=0; $('#itsme').classList.remove('on');
 setMode('game');
 sloop('fan',.32);
 if(g.boss) toast('Ele está acordando...');
}
function endNightAudio(){sunloop('fan',.3);sunloop('breath',.2);}
function usage(){return 1+(g.doors.l?1:0)+(g.doors.r?1:0)+(g.cams?1:0)+(g.flash?1:0);}

function update(dt){
 g.t+=dt;
 const maskWant=has('mask');
 if(maskWant&&g.cams) closeCams();
 if(maskWant!==g.mask){g.mask=maskWant; if(g.mask){play('maskOn');sloop('breath',.55);}else{sunloop('breath',.25);play('maskOn',{vol:.5,rate:1.2});}}
 let f=null;
 if(!g.cams&&!g.mask&&!g.powerOut){if(has('hall'))f='hall';else if(has('vent'))f='vent';}
 if(f!==g.flash){if(!!f!==!!g.flash) play('flash',{vol:.8}); g.flash=f;}
 if(g.boss){
  ['l','r'].forEach(s=>{
   if(g.jam[s]>0){g.jam[s]-=dt;return;}
   if(g.doors[s]){g.heat[s]+=dt;if(g.heat[s]>=5){g.doors[s]=false;g.jam[s]=3;g.heat[s]=0;sfx.jam();play('doorOpen',{dur:1,vol:.7});toast('A porta '+(s==='l'?'esquerda':'direita')+' superaqueceu!');}}
   else g.heat[s]=Math.max(0,g.heat[s]-dt*1.5);
  });
 }
 if(!g.powerOut){
  g.power-=usage()*.09*(1+.05*(Math.min(g.night,5)-1))*(g.night===7?1.15:1)*(g.boss?.8:1)*dt;
  if(g.power<=0){g.power=0;powerOutStart();}
 } else {
  g.outTimer-=dt; g.mbT-=dt;
  if(g.mbT<=0){sfx.musicBox();g.mbT=5.6;}
  if(g.outTimer<=0){jumpscare(g.boss?'clown':'bob');return;}
 }
 if(!g.boss&&g.t>=HOUR_LEN*6){winNight();return;}
 if(g.staticBurst>0) g.staticBurst-=dt;
 if(g.toastT>0){g.toastT-=dt;if(g.toastT<=0)$('#toast').classList.remove('on');}
 // kitchen audio
 if(g.cams&&g.cam===3){g.kitchenT-=dt;if(g.kitchenT<=0){g.kitchenT=.9+Math.random()*1.2;if(inKitchen())sfx.clatter();}}
 updateRare(dt);
 if(g.over) return;
 if(g.boss) updateBoss(dt); else updateChars(dt);
}
function inKitchen(){return ORDER.some(id=>{const c=g.chars[id];return c.state==='move'&&CHARS[id].path[c.step]===3;});}
function updateRare(dt){
 const r=g.rare; if(!r||r.done) return;
 if(!r.active){
  if(g.t>=r.at){r.active=true;r.t=0;
   if(r.type==='golden'){play('rare',{vol:.9});$('#itsme').classList.add('on');save.seenGolden=true;persist();}
   else if(r.type==='poster'){drawPoster(TEX.poster.userData.ctx,true);TEX.poster.needsUpdate=true;play('rare',{vol:.35});r.done=true;}
  }
  return;
 }
 r.t+=dt;
 if(r.type==='golden'){
  if(g.cams||g.mask){r.done=true;r.active=false;$('#itsme').classList.remove('on');return;}
  if(Math.abs(yaw)<.7) r.look+=dt;
  if(r.look>=4.5){$('#itsme').classList.remove('on');jumpscare('golden');return;}
  if(r.t>=6.5){r.done=true;r.active=false;$('#itsme').classList.remove('on');}
 } else if(r.type==='shadow'){
  if(g.cams&&g.cam===r.cam&&!r.seen){r.seen=true;play('rare',{vol:.8});g.staticBurst=.5;}
  if(r.t>=10){r.done=true;r.active=false;}
 }
}
function isDefended(type){
 if(type==='doorL') return g.doors.l;
 if(type==='doorR') return g.doors.r;
 if(type==='hall') return g.flash==='hall';
 if(type==='vent') return g.flash==='vent';
 if(type==='mask') return g.mask;
 return false;
}
function updateChars(dt){
 const hourBoost=Math.floor(g.t/HOUR_LEN/2);
 for(const id of ORDER){
  const c=g.chars[id], def=CHARS[id];
  if(c.state==='move'){
   c.timer-=dt;
   if(c.timer<=0){
    c.timer=def.interval*(.8+Math.random()*.4);
    const lvl=c.level>0?c.level+hourBoost:0;
    if(lvl>0&&Math.random()*20<lvl){
     const prev=def.path[c.step]; c.step++; const now=def.path[c.step];
     if(g.cams&&(g.cam===prev||g.cam===now)) g.staticBurst=.6;
     if(now==='end'){c.state='atk';c.time=ATK[g.night]||6.5;c.hold=0;arrival(id);}
    }
   }
  } else {
   if(isDefended(def.def)){c.hold+=dt;if(c.hold>=def.need){c.state='move';c.step=0;c.timer=def.interval*1.6;retreat(id);}}
   else {c.time-=dt;if(c.time<=0){jumpscare(id);return;}}
  }
 }
}
function arrival(id){
 if(id==='dewy') play('stepsSide',{pan:-.9,vol:.95,dur:3.5});
 else if(id==='titi') play('stepsSide',{pan:.9,vol:.95,dur:3.5});
 else if(id==='bibi') play('stepsHall',{vol:.9});
 else if(id==='boba') play('vent',{pan:-.45,vol:.9,dur:4});
 else if(id==='bob'){sfx.growl();g.flick=1.2;}
}
function retreat(id){
 const d=CHARS[id].def, p=PAN[CHARS[id].spot];
 if(d==='doorL'||d==='doorR') sfx.bang(p);
 else if(d==='hall'||d==='vent') sfx.screech(p);
 else sfx.retreat();
}
function updateBoss(dt){
 const b=g.bossS;
 if(!b.atk){b.cd-=dt;if(b.cd<=0)newBossAtk();$('#danger').style.opacity=0;return;}
 const a=b.atk;
 if(a.type!=='cam'&&isDefended(a.type)){a.hold+=dt;if(a.hold>=1){bossHit(10);return;}}
 else {a.time-=dt;if(a.time<=0){jumpscare('clown');return;}}
 $('#danger').style.opacity=Math.max(0,Math.min(.9,1-a.time/a.max)).toFixed(2);
}
function newBossAtk(){
 const b=g.bossS, types=['doorL','doorR','hall','vent','mask','cam'];
 let t; do{t=types[Math.floor(Math.random()*types.length)];}while(t===b.last&&Math.random()<.8);
 const frac=b.hp/BOSS_HP, time=t==='cam'?(6+3.5*frac):(3+2.8*frac);
 b.atk={type:t,time,max:time,hold:0,cam:t==='cam'?[1,2,4,5,6,7,8][Math.floor(Math.random()*7)]:0};
 b.last=t;
 play('laugh',{pan:PAN[t],dur:2.2,vol:.95});
 if(t==='cam'){toast('Ele sumiu nas câmeras! Ache e dê o choque');if(g.cams)g.staticBurst=.5;}
 if(t==='mask') g.flick=1.5;
}
function bossHit(dmg){
 const b=g.bossS; b.hp=Math.max(0,b.hp-dmg); sfx.hit(); b.atk=null; $('#danger').style.opacity=0;
 const frac=b.hp/BOSS_HP; b.cd=.7+Math.random()*1.6*(.35+.65*frac);
 if(b.hp<=0){winBoss();return;}
 if(frac<=.5&&frac+dmg/BOSS_HP>.5) toast('Ele está furioso! Mais rápido agora...');
}
function shock(){
 if(!g||!g.boss||!g.cams||g.over) return;
 sfx.zap(); g.staticBurst=.4; g.power=Math.max(0,g.power-1.5);
 const a=g.bossS.atk;
 if(a&&a.type==='cam'){if(g.cam===a.cam)bossHit(15);else{a.time-=1.5;toast('Câmera errada!');}}
}
function toggleDoor(s){
 if(!g||g.over||g.powerOut) return;
 if(g.jam[s]>0){toast('Porta emperrada!');return;}
 g.doors[s]=!g.doors[s];
 if(g.doors[s]) play('doorClose',{pan:s==='l'?-.7:.7}); else play('doorOpen',{pan:s==='l'?-.7:.7,dur:1.2,vol:.8});
}
function toggleCams(){
 if(!g||g.over||g.powerOut||g.mask) return;
 g.cams=!g.cams; sfx.cam(); g.staticBurst=.35;
 $('#camsUI').classList.toggle('hidden',!g.cams);
}
function closeCams(){if(g&&g.cams){g.cams=false;$('#camsUI').classList.add('hidden');}}
function setCam(n){if(!g||!g.cams)return;if(g.cam!==n){g.cam=n;sfx.cam();g.staticBurst=.3;}}
function powerOutStart(){
 g.powerOut=true;g.doors.l=g.doors.r=false;closeCams();g.flash=null;
 sfx.powerOut();sunloop('fan',.4);g.outTimer=8+Math.random()*8;g.mbT=2.5;toast('A energia acabou...');
}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('on');if(g)g.toastT=2.6;}

let js=null, jsHandle=null;
function jumpscare(id){
 if(g.over) return; g.over=true; closeCams(); holds.clear();
 g.mask=false; g.flash=null; endNightAudio(); $('#itsme').classList.remove('on'); $('#danger').style.opacity=0;
 hideBots(); bots[id].visible=true; js={id,t:0};
 setMode('jumpscare','jsScreen');
 jsHandle=play('jumpscare',{vol:1});
 setTimeout(()=>{
  if(jsHandle){jsHandle.stop(.6);jsHandle=null;} jsLight.intensity=0; js=null;
  $('#goWho').textContent=CHARS[id].name+' te pegou.'; $('#goTip').textContent='Dica: '+CHARS[id].tip;
  setMode('over','gameover');
 },1900);
}
function winNight(){
 g.over=true; endNightAudio(); holds.clear(); $('#itsme').classList.remove('on');
 const n=g.night;
 if(n<5) save.night=Math.max(save.night,n+1);
 if(n===5){save.n6=true;save.night=Math.max(save.night,5);}
 const maxed=n===7&&ORDER.every(id=>save.custom[id]>=20);
 if(maxed) save.max=true;
 persist();
 $('#winClock').textContent='5 AM'; $('#winMsg').textContent=''; $('#bNext').classList.add('hidden');
 setMode('win');
 setTimeout(()=>{
  $('#winClock').textContent='6 AM'; sixHandle=play('sixAM');
  $('#winMsg').textContent=n===5?'Você sobreviveu à semana! Mas... a Noite 6 foi desbloqueada.':(n===7?(maxed?'20/20/20/20/20 completo. Lenda da pizzaria.':'Noite personalizada concluída.'):'Você sobreviveu à Noite '+n+'.');
  if(n<=5){$('#bNext').textContent=n===5?'Encarar a Noite 6':'Noite '+(n+1);$('#bNext').classList.remove('hidden');}
 },1400);
}
function winBoss(){g.over=true;endNightAudio();holds.clear();save.won6=true;save.n6=true;persist();sixHandle=play('sixAM');setMode('bosswin');}

/* ================= LAYOUT / ANIMATION ================= */
const SPOT3={L:[-3.4,0,.3,1,0,.3],R:[3.4,0,.3,1,0,.3],H:[0,0,-6.2,1,0,1.25],V:[-1.8,1.52,-2.8,.55,-1.8,1.25],O:[1.4,0,-.85,1,0,1.25]};
const ATK2SPOT={doorL:'L',doorR:'R',hall:'H',vent:'V',mask:'O'};
function putSpot(id,k){const s=SPOT3[k];putBot(id,s[0],s[1],s[2],s[3],s[4],s[5]);}
function layoutGame(){
 hideBots();
 if(g.powerOut){putSpot(g.boss?'clown':'bob','L');return;}
 const lists={};
 const add=(r,id)=>{(lists[r]=lists[r]||[]).push(id);};
 ORDER.forEach(id=>{const c=g.chars[id];if(c.state==='atk'&&!g.boss)putSpot(id,CHARS[id].spot);else add(CHARS[id].path[c.step],id);});
 if(g.boss){const a=g.bossS.atk;if(a){if(a.type==='cam')add(a.cam,'clown');else putSpot('clown',ATK2SPOT[a.type]);}}
 const r=g.rare;
 if(r&&r.active){
  if(r.type==='golden'){putBot('golden',0,-.5,-.6,1,0,1.25);const u=bots.golden.userData;u.head.rotation.z=.45;u.head.rotation.x=.3;}
  if(r.type==='shadow') add(r.cam,'shadow');
 }
 Object.keys(lists).forEach(k=>{
  const R=ROOMS[k]; if(!R) return;
  lists[k].forEach((id,i)=>{const p=R.slots[i%R.slots.length];putBot(id,p.x,p.y,p.z,R.scale,R.cam.position.x,R.cam.position.z);});
 });
}
function animBots(dt,t){
 Object.values(bots).forEach(b=>{
  if(!b.visible) return; const u=b.userData;
  if(u.type==='golden'&&mode==='game') return;
  if(u.tw>0){u.tw-=dt;}else if(Math.random()<dt*.25){u.tw=.2+Math.random()*.4;u.twY=(Math.random()-.5)*.9;}
  u.head.rotation.y+=((u.tw>0?u.twY:0)-u.head.rotation.y)*Math.min(1,dt*(u.tw>0?18:3));
  u.head.rotation.z=Math.sin(t*.8+u.ph)*.06; u.head.rotation.x=0;
  u.armL.rotation.x=Math.sin(t*.6+u.ph)*.05; u.armR.rotation.x=-Math.sin(t*.6+u.ph)*.05;
  u.jaw.rotation.x=0;
 });
}
const Y=new THREE.Vector3(0,1,0), _q=new THREE.Quaternion(), _fwd=new THREE.Vector3();
function animate(dt,t){
 if(mode==='game'&&g){
  layoutGame(); animBots(dt,t);
  // look
  let v=edgeV; if(keysLook.left)v+=1; if(keysLook.right)v-=1;
  yawT+=v*1.9*dt;
  let pT=-.04;
  if(g.flash==='hall'){yawT+=(0-yawT)*Math.min(1,dt*4);pT=0;}
  else if(g.flash==='vent'){yawT+=(.52-yawT)*Math.min(1,dt*4);pT=.28;}
  yawT=Math.max(-YAW_MAX,Math.min(YAW_MAX,yawT));
  yaw+=(yawT-yaw)*Math.min(1,dt*8); pitch+=(pT-pitch)*Math.min(1,dt*6);
  playerCam.rotation.set(pitch,yaw,0,'YXZ'); playerCam.position.set(0,1.3,1.25);
  // doors
  g.doorY.l+=((g.doors.l?1.15:3.5)-g.doorY.l)*Math.min(1,dt*14); g.doorY.r+=((g.doors.r?1.15:3.5)-g.doorY.r)*Math.min(1,dt*14);
  doorL.position.y=g.doorY.l; doorR.position.y=g.doorY.r;
  // lights
  if(g.flick>0) g.flick-=dt;
  const officeThreat=(!g.boss&&g.chars.bob.state==='atk')||(g.boss&&g.bossS.atk&&g.bossS.atk.type==='mask');
  if(g.powerOut){lamp.intensity=0;amb.intensity=.12;redL.intensity=redR.intensity=0;monitorScreen.material.color.setHex(0x050805);
   const blink=Math.sin(t*9)>0; bots[g.boss?'clown':'bob'].userData.pupils.forEach(p=>p.visible=blink);}
  else {
   lamp.intensity=(officeThreat||g.flick>0)?(Math.random()<.5?.15:1.1):(Math.random()<.004?.3:1.15);
   amb.intensity=.55; redL.intensity=redR.intensity=.9; monitorScreen.material.color.setHex(g.cams?0x4ac25a:0x2a7a32);
   Object.values(bots).forEach(b=>{if(b.userData.type!=='golden')b.userData.pupils.forEach(p=>p.visible=true);});
  }
  fanBlades.rotation.z+=g.powerOut?0:dt*22;
  spot.intensity=g.flash?3.2:0;
  if(g.flash==='hall') spot.target.position.set(0,1.4,-7); else if(g.flash==='vent') spot.target.position.set(-1.8,2.45,-2.9);
  // room cam sway
  if(g.cams&&ROOMS[g.cam]){const R=ROOMS[g.cam];_q.setFromAxisAngle(Y,Math.sin(t*.35)*.2);R.cam.quaternion.copy(_q).multiply(R.base);}
 } else if(mode==='jumpscare'&&js){
  js.t+=dt; const b=bots[js.id], u=b.userData;
  _fwd.set(0,0,-1).applyQuaternion(playerCam.quaternion); _fwd.y=0; _fwd.normalize();
  const k=Math.min(1,js.t/.3), dist=1.7-1.15*(1-Math.pow(1-k,3));
  const s=u.base, headY=1.82*s;
  b.visible=true; b.scale.setScalar(s);
  b.position.set(playerCam.position.x+_fwd.x*dist,1.3-headY+.05,playerCam.position.z+_fwd.z*dist);
  b.lookAt(playerCam.position.x,b.position.y,playerCam.position.z);
  u.jaw.rotation.x=.55+Math.sin(js.t*40)*.15; u.head.rotation.z=Math.sin(js.t*55)*.12; u.head.rotation.x=0; u.head.rotation.y=0;
  u.armL.rotation.x=-1.2; u.armR.rotation.x=-1.2;
  u.pupils.forEach(p=>p.visible=true);
  jsLight.position.copy(playerCam.position).addScaledVector(_fwd,.3); jsLight.intensity=1.6;
  playerCam.rotation.set(pitch+(Math.random()-.5)*.06,yaw+(Math.random()-.5)*.06,(Math.random()-.5)*.05,'YXZ');
 } else if(mode==='extras'){
  const gb=gBots[gSel]; if(gb){if(!gDrag)gRot+=dt*.5;gb.rotation.y=gRot;const u=gb.userData;u.head.rotation.z=Math.sin(t*1.2)*.08;u.jaw.rotation.x=Math.max(0,Math.sin(t*2))*.25;}
 } else {
  // menu-ish
  animBots(dt,t);
  const R=ROOMS[1]; R.light.intensity=Math.random()<.06?.2:(R.baseI*(.85+Math.random()*.15));
  _q.setFromAxisAngle(Y,Math.sin(t*.25)*.08); menuCam.quaternion.copy(_q).multiply(menuBase);
 }
 if(mode==='game') ROOMS[1].light.intensity=ROOMS[1].baseI;
}

/* ================= HUD ================= */
const btnOf=a=>document.querySelector(`.ctl[data-act="${a}"]`);
function renderHUD(){
 const h=Math.min(5,Math.floor(g.t/HOUR_LEN));
 $('#hourLbl').textContent=g.boss?'??:??':(h===0?12:h)+' AM';
 $('#powerLbl').textContent='Energia: '+Math.ceil(g.power)+'%';
 const u=g.powerOut?0:usage();
 $('#usage').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<u?'u'+u:''}"></i>`).join('');
 if(g.boss) $('#bossFill').style.width=(g.bossS.hp/BOSS_HP*100)+'%';
 ['l','r'].forEach(sd=>{const b=btnOf(sd==='l'?'doorL':'doorR');b.classList.toggle('on',g.doors[sd]);b.disabled=g.powerOut||g.jam[sd]>0;b.querySelector('.heat').style.width=g.boss?Math.min(100,g.heat[sd]/5*100)+'%':'0';});
 btnOf('hall').classList.toggle('held',g.flash==='hall'); btnOf('vent').classList.toggle('held',g.flash==='vent');
 btnOf('mask').classList.toggle('held',g.mask); btnOf('cams').classList.toggle('on',g.cams);
 btnOf('hall').disabled=btnOf('vent').disabled=btnOf('cams').disabled=g.powerOut;
 let threat=g.boss?(!!g.bossS.atk&&g.bossS.atk.type!=='cam'):ORDER.some(id=>g.chars[id].state==='atk');
 btnOf('cams').classList.toggle('warn',g.cams&&threat);
 $('#maskOv').classList.toggle('on',g.mask);
 $('#gl').classList.toggle('cctv',g.cams);
 if(g.cams){
  $('#camLbl').textContent='CAM '+g.cam+' · '+CAMS[g.cam];
  $('#kitchenMsg').classList.toggle('hidden',g.cam!==3);
  document.querySelectorAll('.mapb[data-cam]').forEach(b=>b.classList.toggle('on',+b.dataset.cam===g.cam));
 }
 $('#lookHint').style.opacity=g.t<12?1:0;
}

/* ================= NOISE ================= */
const nCtx=$('#noise').getContext('2d'), nImg=nCtx.createImageData(160,90);
function drawNoise(){const d=nImg.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}nCtx.putImageData(nImg,0,0);}

/* ================= LOOP ================= */
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)*RES); renderer.setSize(w,h,false);
 allCams.forEach(c=>{c.aspect=w/h;c.updateProjectionMatrix();});
 if(w>760) gCam.lookAt(-1.05,1.05,0); else gCam.lookAt(0,.25,0);
}
addEventListener('resize',resize); resize();
let last=performance.now();
function frame(ts){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(0,(ts-last)/1000)); last=ts; const t=ts/1000;
 if(mode==='game'&&g&&!g.over){update(dt);}
 animate(dt,t);
 if(mode==='game'&&g&&!g.over) renderHUD();
 // render
 if(mode==='game'&&g&&g.cams){if(g.cam===3){renderer.clear();}else renderer.render(scene,ROOMS[g.cam].cam);}
 else if(mode==='game'||mode==='jumpscare') renderer.render(scene,playerCam);
 else if(mode==='extras') renderer.render(gScene,gCam);
 else if(mode==='splash') renderer.clear();
 else renderer.render(scene,menuCam);
 // noise overlay
 let no=0;
 if(mode==='game'&&g&&g.cams) no=g.staticBurst>0?.95:.16+Math.random()*.06;
 else if(MUSIC_MODES.includes(mode)) no=mode==='extras'?.03:(.05+Math.random()*.05+(Math.random()<.02?.4:0));
 if(no>0) drawNoise();
 $('#noise').style.opacity=no.toFixed(2);
}
requestAnimationFrame(frame);

/* ================= INPUT ================= */
document.querySelectorAll('.ctl').forEach(b=>{
 const act=b.dataset.act;
 b.addEventListener('contextmenu',e=>e.preventDefault());
 if(b.classList.contains('hold')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();audio();try{b.setPointerCapture(e.pointerId);}catch(_){}holds.add(act+':p');});
  const up=()=>holds.delete(act+':p');
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
 } else b.addEventListener('click',()=>{audio();if(act==='doorL')toggleDoor('l');else if(act==='doorR')toggleDoor('r');else if(act==='cams')toggleCams();b.blur();});
});
$('#shockBtn').onclick=e=>{shock();e.currentTarget.blur();};
// look + poster click
const look=$('#look'); let drag=null;
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
look.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,sx:e.clientX,sy:e.clientY,t:performance.now(),type:e.pointerType};try{look.setPointerCapture(e.pointerId);}catch(_){}});
look.addEventListener('pointermove',e=>{
 if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x;drag.x=e.clientX;if(Math.abs(e.clientX-drag.sx)>6)yawT+=dx*.005;edgeV=0;return;}
 if(e.pointerType==='mouse'){const r=e.clientX/innerWidth;edgeV=r<.15?(.15-r)/.15:(r>.85?-(r-.85)/.15:0);}
});
look.addEventListener('pointerup',e=>{
 if(!drag) return; const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy), quick=performance.now()-drag.t<450; drag=null;
 if(moved<8&&quick&&g&&!g.over&&!g.cams&&!g.mask){
  ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); ray.setFromCamera(ndc,playerCam);
  if(ray.intersectObject(noseMesh).length){play('honk');noseMesh.scale.setScalar(.6);setTimeout(()=>noseMesh.scale.setScalar(1),120);}
 }
});
look.addEventListener('pointerleave',()=>{edgeV=0;});
look.addEventListener('pointercancel',()=>{drag=null;edgeV=0;});
// gallery drag
$('#extras').addEventListener('pointerdown',e=>{if(e.target.closest('#exPanel'))return;gDrag={x:e.clientX};});
addEventListener('pointermove',e=>{if(gDrag){gRot+=(e.clientX-gDrag.x)*.01;gDrag.x=e.clientX;}});
addEventListener('pointerup',()=>{gDrag=null;});
const KEYHOLD={' ':'mask','f':'hall','v':'vent'};
document.addEventListener('keydown',e=>{
 if(mode!=='game'||!g||g.over) return;
 const k=e.key.toLowerCase();
 if(KEYHOLD[k]){e.preventDefault();holds.add(KEYHOLD[k]+':k');return;}
 if(k==='arrowleft'){keysLook.left=true;e.preventDefault();return;}
 if(k==='arrowright'){keysLook.right=true;e.preventDefault();return;}
 if(e.repeat) return;
 if(k==='a'){toggleDoor('l');e.preventDefault();}
 else if(k==='d'){toggleDoor('r');e.preventDefault();}
 else if(k==='s'){toggleCams();e.preventDefault();}
 else if(k==='e'){shock();e.preventDefault();}
 else if(/^[1-8]$/.test(k)) setCam(+k);
});
document.addEventListener('keyup',e=>{
 const k=e.key.toLowerCase();
 if(KEYHOLD[k]){e.preventDefault();holds.delete(KEYHOLD[k]+':k');}
 if(k==='arrowleft')keysLook.left=false; if(k==='arrowright')keysLook.right=false;
});
addEventListener('blur',()=>{holds.clear();keysLook.left=keysLook.right=false;});
})();
