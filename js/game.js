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

const HOUR_LEN=72;      /* segundos por hora do jogo (6 horas = ~7 minutos) */
const MOVE_INT=8;       /* a cada quantos segundos cada um tenta se mexer */
const COOLDOWN=20;      /* descanso depois de ser expulso */
const BOSS_HP=220, YAW_MAX=1.2;
const WALKERS=['sandega','bruna','fernanda','xinglau','toco'];
const ALL=['sandega','bruna','fernanda','xinglau','toco','zig'];
const GROUP3=['bruna','fernanda','toco']; /* nunca os 3 atacando juntos */
/* Dificuldade por noite (0 = parado, 20 = máximo). zig = velocidade com que a cadeira dele para */
const LEVELS={
 1:{sandega:3,bruna:0,fernanda:0,xinglau:0,toco:0,zig:0},
 2:{sandega:4,bruna:3,fernanda:3,xinglau:0,toco:0,zig:0},
 3:{sandega:5,bruna:5,fernanda:4,xinglau:3,toco:0,zig:0},
 4:{sandega:6,bruna:6,fernanda:6,xinglau:5,toco:4,zig:0},
 5:{sandega:8,bruna:8,fernanda:8,xinglau:7,toco:6,zig:12}
};
/* Segundos para se defender depois que eles chegam */
const ATK={1:11,2:10,3:9.5,4:9,5:8.5,7:7.5};

/* Caminhos pelo restaurante: [x,y,z,{w:passagem, c:câmera, s:escala}] */
const RAW_PATHS={
 sandega:[[3,.6,-25.8,{c:1}],[.8,.6,-23.8,{w:1}],[.8,.3,-23.35,{w:1}],[.8,0,-22.7,{w:1}],[6.5,0,-22.6,{c:2}],[6.5,0,-14.8,{w:1}],[3.9,0,-14.6,{w:1}],[3.8,0,-11,{c:5}],[4.1,0,-5.5,{c:5}],[3.6,0,-1.6,{w:1}],[3.4,0,.3]],
 xinglau:[[-3,.6,-25.8,{c:1}],[-.8,.6,-23.8,{w:1}],[-.8,.3,-23.35,{w:1}],[-.8,0,-22.7,{w:1}],[-7.4,0,-22.6,{c:2}],[-9.3,0,-25,{w:1}],[-12.3,0,-24.8,{c:6}],[-9.3,0,-25,{w:1}],[-7.2,0,-22.4,{w:1}],[-6.6,0,-14.8,{w:1}],[-3.9,0,-14.6,{w:1}],[-3.8,0,-11,{c:4}],[-4.1,0,-5.5,{c:4}],[-3.6,0,-1.6,{w:1}],[-3.4,0,.3]],
 bruna:[[-1,.6,-26.3,{c:1}],[-.3,.6,-23.8,{w:1}],[-.3,.3,-23.35,{w:1}],[-.3,0,-21.3,{c:2}],[0,0,-15.6,{c:2}],[0,0,-12.3],[0,0,-6.2]],
 toco:[[1,.6,-26.3,{c:1}],[.4,.6,-23.8,{w:1}],[.4,.3,-23.35,{w:1}],[.9,0,-19,{c:2}],[.5,0,-15.2,{c:2}],[.45,0,-9.8],[.3,0,-3.1,{w:1}],[.45,0,-1.5,{w:1}],[1.4,0,-.85]],
 fernanda:[[-13.4,0,-16.5,{c:8}],[-11.4,0,-17.8,{w:1}],[-9.4,0,-18,{w:1}],[-7,0,-15.2,{c:2}],[-1.8,0,-14.75,{w:1}],[-1.8,1.4,-14.75,{w:1}],[-1.8,1.52,-13.6,{w:1,s:.55}],[-1.8,1.52,-10.5,{c:7,s:.55}],[-1.8,1.52,-6,{c:7,s:.55}],[-1.8,1.52,-2.8,{s:.55}]],
 zig:[[12.9,0,-20.8,{c:3}],[10.6,0,-21,{w:1}],[7.2,0,-21,{w:1}],[6.6,0,-14.8,{w:1}],[3.9,0,-14.6,{w:1}],[3.9,0,-6,{w:1}],[3.6,0,-1.6,{w:1}],[3.4,0,.3]]
};

const CHARS={
 sandega:{name:'SANDEGA',sp:'Tartaruga',color:'#5fd07a',spot:'R',def:'doorR',need:1.5,speed:.9,back:4,
  how:'Anda devagar pelo corredor leste e para na <b>porta direita</b>. Feche a porta.',
  bio:'A mais antiga da turma. Lenta, mas nunca desiste. O casco ainda tem adesivos dos anos 80.',
  tip:'Passos pesados à direita são da SANDEGA. Feche a PORTA DIREITA (D) quando ela chegar.'},
 bruna:{name:'BRUNA',sp:'Raposa',color:'#ff8a3d',spot:'H',def:'hall',need:2,speed:1.4,back:3,
  how:'Vem pelo corredor do meio. Segure a <b>lanterna no corredor</b> quando ela chegar perto.',
  bio:'Estrela do show de mágica. Odeia holofote fora de hora.',
  tip:'Viu olhos no corredor do meio? É a BRUNA. Segure a LANTERNA no corredor (F).'},
 fernanda:{name:'FERNANDA',sp:'Águia',color:'#ff4f9a',spot:'V',def:'vent',need:2,speed:1.5,back:3,
  how:'Entra pelo duto que sai do salão. Segure a <b>lanterna no duto</b>.',
  bio:'Mascote do time de basquete infantil. Ninguém sabe como ela sobe nas paredes.',
  tip:'Barulho nos dutos é a FERNANDA. Segure a LANTERNA no duto (V) quando ela aparecer na grade.'},
 xinglau:{name:'XINGLAU',sp:'Pato',color:'#ffd23f',spot:'L',def:'doorL',need:1.5,speed:1.3,back:6,
  how:'Passa pelo depósito e vem pelo corredor oeste. Feche a <b>porta esquerda</b>.',
  bio:'Capitão do time. Grita "QUÁ!" para comemorar. Ou para assustar.',
  tip:'Passos à esquerda são do XINGLAU. Feche a PORTA ESQUERDA (A).'},
 toco:{name:'TOCO',sp:'Cachorro',color:'#6aa8ff',spot:'O',def:'mask',need:2.5,speed:1.2,back:4,
  how:'Desce o corredor do meio e entra na sala. Segure a <b>máscara</b> até ele ir embora.',
  bio:'O mais simpático do palco. Abana o rabo até hoje, só que mais devagar.',
  tip:'Quando o TOCO entrar na sala e as luzes piscarem, segure a MÁSCARA (Espaço) até ele sair.'},
 zig:{name:'ZIG',sp:'Macaco',color:'#ff4060',spot:'R',def:'doorR',
  how:'Fica na cadeira giratória da cozinha. Abra a <b>CAM 3</b> e segure <b>Girar</b> para ele não parar.',
  bio:'Hiperativo. Só fica quieto girando. Se a cadeira para, ele vai atrás de quem parou.',
  tip:'Abra a CAM 3 e segure GIRAR (G) antes da barra do ZIG acabar. Se ele fugir, feche a PORTA DIREITA rápido.'},
 clown:{name:'SR. GARGALHADA',sp:'Palhaço',color:'#ff3b6b',
  how:'Usa <b>tudo</b>: portas, lanterna, máscara e se esconde nas câmeras (dê o <b>choque</b>).',
  bio:'Ninguém lembra de ter contratado ele. Ninguém lembra de ter desligado ele.',
  tip:'Veja de onde vem a risada e use a defesa certa. Na fase 2 e 3 ele aparece em dois lugares: resolva primeiro a porta e depois o resto. Se ele sumir, abra as câmeras, ache e dê CHOQUE (E). Não deixe as portas fechadas demais: elas superaquecem.'},
 golden:{name:'BOB DOURADO',sp:'???',color:'#e0b83a',
  how:'Se ele aparecer sentado na sala, <b>não encare</b>. Abra as câmeras ou coloque a máscara.',
  bio:'O primeiro mascote da pizzaria, aposentado em 87. O traje ficou guardado nos fundos, com os olhos vazios.',
  tip:'Nunca encare o BOB Dourado. Abra as câmeras ou coloque a máscara assim que ele aparecer.'}
};
const CAMS={1:'Palco Principal',2:'Salão de Festas',3:'Cozinha',4:'Corredor Oeste',5:'Corredor Leste',6:'Depósito',7:'Duto de Ventilação',8:'Área de Brinquedos'};
const PAN={doorL:-.9,doorR:.9,hall:0,vent:-.45,mask:0,cam:0,L:-.9,R:.9,H:0,V:-.45,O:0};

const CALLS={
1:`<span class="who">📞 Valdir · vigia noturno (1998–2016)</span><p>Alô? Ah, que bom, você atendeu. Sou o Valdir. Fui vigia daqui por muito tempo, então deixaram eu gravar umas mensagens pra você.</p><p>Um pouco de história: a <b>Pizzaria do BOB</b> abriu em 1983. O BOB era o cachorro vermelho, o mascote do seu Roberto, o dono. Em 2016 o neto dele assumiu. Ele era fã doente de uma turma da internet que explorava lugar abandonado e resolvia mistério. Aí ele aposentou o BOB e mandou construir uma banda nova, com camisa de time e tudo: a <b>Liga Mistério</b>.</p><p>Seis bonecos. Cada um com seu número, seu emblema e seu jeito. A criançada adorava. O problema é que, à noite, eles continuam... ensaiando. Andando por aí.</p><p>Hoje deve ser tranquilo. Só a <b class="c-sandega">Sandega</b>, a tartaruga camisa 01, costuma sair do palco. Ela é a mais velha e a mais teimosa. Sempre desce pelo <b>corredor leste</b>, e quando chega na porta da direita, só vai embora se der com a cara na porta.</p><p>Bom, é isso. Até amanhã. Se tiver amanhã. Brincadeira! ...Mais ou menos.</p>`,
2:`<span class="who">📞 Valdir</span><p>Você voltou! Bom sinal.</p><p>Deixa eu te contar do <b>Show do Mistério</b>. Toda tarde de sábado a Liga apresentava um caso pras crianças resolverem: um tesouro sumido, um fantasma no salão, essas coisas. Era tudo combinado, claro.</p><p>A <b class="c-bruna">Bruna</b>, a raposa, fazia os truques de mágica. O número dela dependia dos holofotes. Um dia a luz estourou bem na cara dela no meio do show, e desde então ela não suporta luz forte. Quando ela vier pelo corredor do meio... você entendeu.</p><p>E a <b class="c-fernanda">Fernanda</b>, a águia. Durante a manutenção, a gente sempre achava ela dentro dos dutos de ventilação, sem ninguém ter colocado lá. Ela sobe pelo salão e vem rastejando até a grade da sua sala. Ela também odeia ser vista no escuro.</p><p>Uma coisa boa: as duas parecem esperar a vez uma da outra. Nunca vi as duas chegando juntas.</p>`,
3:`<span class="who">📞 Valdir</span><p>Noite 3. Hoje o capitão acorda.</p><p>O <b class="c-xinglau">Xinglau</b>, o pato camisa 09, era o líder da Liga no palco. Ele abria todo show gritando "QUÁ!" e as crianças respondiam. O neto do seu Roberto falava que ele era o coração da turma.</p><p>Só que o capitão tem uma mania: antes de qualquer coisa, ele passa no <b>depósito</b>, como se estivesse conferindo as peças reservas. Depois desce o <b>corredor oeste</b>. Se ele chegar na porta da esquerda e encontrar ela aberta...</p><p>Ah, e se você ouvir um "quá" do lado de fora, não responda.</p>`,
4:`<span class="who">📞 Valdir</span><p>Preciso te contar uma coisa que ninguém conta.</p><p>Nas festas, os funcionários vestiam umas <b>máscaras da Liga</b> pra animar as crianças. E o <b class="c-toco">Toco</b>, o cachorro azul, sempre reconhecia. Ele chegava perto, olhava bem no rosto e, se achava que era "um da turma", ia embora abanando o rabo.</p><p>Por isso deixaram uma máscara na sua mesa. O Toco desce o corredor do meio igual a Bruna, mas não para no corredor. Ele <b>entra na sala</b>. Ele só quer um abraço. O problema é o tamanho do abraço.</p><p>Outra coisa: ontem a fita da câmera do depósito mostrou uma lona cobrindo alguma coisa grande. Eu não lembro de ter colocado lona nenhuma lá.</p>`,
5:`<span class="who">📞 Valdir</span><p>Última noite da semana. E a mais barulhenta.</p><p>O <b class="c-zig">Zig</b>, o macaco camisa 66, nunca ficou parado. Nem no palco, nem fora dele. A única coisa que acalmava ele era a cadeira giratória da cozinha, o <b>Gira-Gira do Zig</b>. A gente passava a noite inteira girando aquela cadeira.</p><p>Quando a cadeira para, ele vai atrás de quem parou. E ele é rápido. Muito rápido. Ele sempre corre pro lado direito.</p><p>...Olha, vou falar uma coisa e depois desligo. Achei umas fitas antigas no porão. Tem um sétimo boneco nelas. Não é da Liga. Não tem camisa. E ele <b>ri</b>. Se amanhã você ouvir uma risada... <i>*estática*</i></p>`,
6:`<span class="who">📞 Valdir (sinal fraco)</span><p>...tá me ouvindo? O sinal aqui embaixo é horrível.</p><p>Toda história de mistério precisa de um vilão. O neto do seu Roberto mandou construir um pra Liga caçar nos shows: o <b class="c-clown">Sr. Gargalhada</b>. A ideia era que as crianças ajudassem a Liga a desmascarar ele no final. Só que ele nunca foi desmascarado. Ninguém nunca conseguiu tirar aquela máscara.</p><p>Ele aprendeu tudo assistindo os outros. As portas, o corredor, o duto, a sala... e as câmeras. Ele <b>some nelas</b>. Dizem que dá pra achar ele pelo olho, que é o único que brilha.</p><p>Quanto mais você machuca ele, mais ele se espalha. Chega uma hora que ele está em dois lugares ao mesmo tempo. E as portas não aguentam ficar fechadas muito tempo hoje.</p><p>Se você sobreviver até ele cair... ha... ha... desculpa. Não fui eu que ri.</p>`,
7:`<span class="who">📞 Gerência</span><p>Esta é uma noite extra, fora da escala. Você escolheu quem está acordado e com qual intensidade.</p><p>A Pizzaria do BOB lembra que o uso dos animatrônicos fora do horário de funcionamento é proibido e que a empresa não se responsabiliza por ferimentos, desaparecimentos ou risadas.</p>`
};
/* passo a passo mostrado quando você morre */
const STEPS={
 sandega:['Ela anda devagar: acompanhe pela CAM 2 (salão) e pela CAM 5 (corredor leste).','Quando ouvir passos pesados do lado DIREITO, olhe para a direita.','Feche a PORTA DIREITA (D) e espere a pancada. Depois pode abrir para economizar energia.'],
 bruna:['Ela desce pelo corredor do meio, bem na sua frente.','Quando os olhos brilharem no fundo do corredor, segure a LANTERNA (F).','Segure até ouvir o grito dela fugindo.'],
 fernanda:['Ela sobe pelo duto que sai do salão (CAM 7 mostra o duto).','Barulho metálico no alto = ela está vindo.','Quando ela aparecer na grade do duto, segure a LANTERNA NO DUTO (V).'],
 xinglau:['Ele passa pelo depósito (CAM 6) e desce o corredor oeste (CAM 4).','Passos e um "QUÁ" do lado ESQUERDO = ele chegou.','Feche a PORTA ESQUERDA (A) até ouvir as batidas.'],
 toco:['Ele desce o corredor do meio e entra direto na sala.','A lanterna mostra ele chegando, mas não espanta.','Quando as luzes piscarem e ele estiver na sala, segure a MÁSCARA (Espaço) até ele sair.'],
 zig:['Abra a CAM 3 (cozinha) de vez em quando.','Segure GIRAR (G) até a barra da cadeira encher.','Se ele fugir, ele corre até a PORTA DIREITA: feche ela (D) na hora.'],
 clown:['Escute de onde vem a risada e veja onde ele aparece.','Porta = feche a porta. Corredor ou duto = lanterna. Dentro da sala = máscara.','Se ele sumir, abra as câmeras, procure o olho brilhando e dê CHOQUE (E). Use a luz (L) se estiver escuro.','Na fase 2 e 3 ele aparece em dois lugares: resolva a porta primeiro.'],
 golden:['Quando ele aparecer sentado na sua frente, não encare.','Abra as câmeras ou coloque a máscara imediatamente.']
};


/* ================= SAVE ================= */
const CUSTOM_DEF={sandega:5,bruna:5,fernanda:5,xinglau:5,toco:5,zig:5};
let save={night:1,n6:false,won6:false,max:false,seenGolden:false,custom:Object.assign({},CUSTOM_DEF)};
try{const r=localStorage.getItem('pizzariaBob3d_v2'); if(r){const o=JSON.parse(r); save=Object.assign(save,o); save.custom=Object.assign({},CUSTOM_DEF,o.custom||{});}}catch(e){}
function persist(){try{localStorage.setItem('pizzariaBob3d_v2',JSON.stringify(save));}catch(e){}}


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
 alarm(){for(let i=0;i<6;i++){tone(880,.18,'square',.12,.5,i*.36);tone(660,.18,'square',.12,.5,i*.36+.18);}},
 thud(pan,w){noise(.22,.6,120,'lowpass',pan,w||0);tone(60,.2,'sine',.25,pan,w||0,40);},
 quack(pan){[0,.24].forEach(w=>{tone(560,.17,'sawtooth',.22,pan,w+.1,300);tone(1120,.12,'square',.06,pan,w+.1,600);noise(.12,.12,1400,'bandpass',pan,w+.1);});},
 hiss(pan){noise(.8,.25,3500,'highpass',pan);},
 ring(){[0,.08,.16,.24,.4,.48,.56,.64].forEach(w=>tone(w<.35?1320:1180,.07,'square',.07,0,w));},
 blip(){tone(260+Math.random()*120,.035,'square',.03);},
 musicBox(){const n=[659,587,523,587,659,659,659,0,587,587,587,0,659,784,784,0];n.forEach((f,i)=>{if(f){tone(f*2,.55,'triangle',.07,-.8,i*.34);tone(f*4,.25,'sine',.025,-.8,i*.34);}});}
};

/* ================= THREE SETUP ================= */
const renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(1); renderer.setClearColor(0x000000);
const PS1_H=240; /* altura interna da imagem (estilo PS1 = 240) */
const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0x020103,2.5,19);
const amb=new THREE.AmbientLight(0x1a1430,.3); scene.add(amb);
const allCams=[];
function mkCam(fov){const c=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.05,60);allCams.push(c);return c;}
const playerCam=mkCam(75); playerCam.position.set(0,1.3,1.25); playerCam.rotation.order='YXZ';
const menuCam=mkCam(58);

/* PS1: vértices "tremidos" (snap na grade de pixels) */
function ps1Hook(sh){sh.vertexShader=sh.vertexShader.replace('#include project_vertex','#include project_vertex\n\tgl_Position.xy=floor(gl_Position.xy/gl_Position.w*vec2(213.0,120.0)+0.5)/vec2(213.0,120.0)*gl_Position.w;');}
function ps1(m){m.onBeforeCompile=ps1Hook;return m;}

const matCache={};
function mat(c,extra){if(typeof c==='object')return c;const k=c+'|'+(extra?JSON.stringify(extra):'');if(!matCache[k])matCache[k]=ps1(new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:4},extra||{})));return matCache[k];}
function mesh(geo,m,x,y,z,parent){const o=new THREE.Mesh(geo,mat(m));o.position.set(x||0,y||0,z||0);if(parent)parent.add(o);return o;}
function box(w,h,d,c,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,parent);}
function slab(x1,x2,y1,y2,z1,z2,c,parent){return box(x2-x1,y2-y1,z2-z1,c,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,parent);}
const SHADOW_MAT=ps1(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.45,depthWrite:false}));

/* ---------- texturas procedurais (baixa resolução) ---------- */
let seed=7; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
const TEXT_TEX=[];
function ctex(w,h,draw,opts){opts=opts||{};const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if(opts.rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;if(!t.userData)t.userData={};t.userData.ctx=x;if(opts.text)TEXT_TEX.push([t,draw,w,h]);return t;}
function grime(x,w,h,n,a){for(let i=0;i<n;i++){x.fillStyle='rgba(0,0,0,'+(rnd()*a).toFixed(3)+')';x.fillRect(Math.floor(rnd()*w),Math.floor(rnd()*h),1+Math.floor(rnd()*3),1+Math.floor(rnd()*3));}}
function plane(w,h,tex,x,y,z,ry,parent,basic){const m=ps1(basic?new THREE.MeshBasicMaterial({map:tex}):new THREE.MeshLambertMaterial({map:tex}));const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry||0;parent.add(o);return o;}
const TX={
 wall:ctex(64,64,x=>{x.fillStyle='#2a2e46';x.fillRect(0,0,64,64);for(let i=0;i<64;i+=16){x.fillStyle='#333a5a';x.fillRect(i,0,8,64);x.fillStyle='#22263a';x.fillRect(i+8,0,1,64);}for(let y=6;y<64;y+=16)for(let i=3;i<64;i+=16){x.fillStyle='#5c4a78';x.fillRect(i,y,2,2);}grime(x,64,64,300,.35);},{rep:true}),
 wall2:ctex(64,64,x=>{x.fillStyle='#3a3228';x.fillRect(0,0,64,64);for(let y=0;y<64;y+=8){x.fillStyle='#2f2820';x.fillRect(0,y,64,1);}grime(x,64,64,420,.45);},{rep:true}),
 wain:ctex(32,32,x=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#1a1a1d':'#cfc9b8';x.fillRect(i*8,j*8,8,8);}grime(x,32,32,90,.4);},{rep:true}),
 floor:ctex(64,64,x=>{x.fillStyle='#d6d0bd';x.fillRect(0,0,64,64);x.fillStyle='#141416';x.fillRect(0,0,32,32);x.fillRect(32,32,32,32);grime(x,64,64,340,.4);},{rep:true}),
 floor2:ctex(64,64,x=>{x.fillStyle='#4a4640';x.fillRect(0,0,64,64);grime(x,64,64,600,.5);x.strokeStyle='#2a2824';x.beginPath();x.moveTo(0,32);x.lineTo(64,30);x.stroke();},{rep:true}),
 ceil:ctex(64,64,x=>{x.fillStyle='#56565c';x.fillRect(0,0,64,64);x.fillStyle='#3a3a40';x.fillRect(0,0,64,2);x.fillRect(0,0,2,64);x.fillRect(0,32,64,2);x.fillRect(32,0,2,64);x.fillStyle='rgba(120,90,40,.35)';x.beginPath();x.arc(46,16,7,0,7);x.fill();grime(x,64,64,260,.3);},{rep:true}),
 wood:ctex(64,64,x=>{for(let y=0;y<64;y+=8){x.fillStyle=['#6b4226','#5e3a21','#74482a'][(y/8)%3];x.fillRect(0,y,64,8);x.fillStyle='#3b2414';x.fillRect(0,y+7,64,1);x.fillRect((y*13)%64,y,1,8);}grime(x,64,64,160,.3);},{rep:true}),
 metal:ctex(32,32,x=>{x.fillStyle='#6e7178';x.fillRect(0,0,32,32);grime(x,32,32,160,.35);x.fillStyle='#4a4d54';x.fillRect(0,15,32,2);x.fillStyle='#9a9ea6';[[3,3],[28,3],[3,28],[28,28]].forEach(([a,b])=>x.fillRect(a,b,2,2));},{rep:true}),
 curtain:ctex(32,64,x=>{for(let i=0;i<32;i++){const v=Math.sin(i/32*Math.PI*4)*.5+.5;x.fillStyle=`rgb(${Math.round(90+v*80)},${Math.round(8+v*14)},${Math.round(18+v*16)})`;x.fillRect(i,0,1,64);}grime(x,32,64,90,.25);},{rep:true}),
 tile:ctex(32,32,x=>{x.fillStyle='#8f958f';x.fillRect(0,0,32,32);for(let i=0;i<2;i++)for(let j=0;j<2;j++){x.fillStyle='#d8dcd4';x.fillRect(i*16+1,j*16+1,14,14);}grime(x,32,32,120,.35);},{rep:true}),
 carpet:ctex(64,64,x=>{x.fillStyle='#2a1440';x.fillRect(0,0,64,64);const c=['#e0303f','#3b6fd6','#f2b33d','#49c06a','#e97db4'];for(let i=0;i<40;i++){x.fillStyle=c[i%5];const a=Math.floor(rnd()*60),b=Math.floor(rnd()*60);if(i%3)x.fillRect(a,b,3,3);else{x.beginPath();x.moveTo(a,b);x.lineTo(a+5,b+2);x.lineTo(a+1,b+5);x.fill();}}grime(x,64,64,150,.3);},{rep:true}),
 hazard:ctex(32,32,x=>{x.fillStyle='#d9a52e';x.fillRect(0,0,32,32);x.fillStyle='#141414';for(let i=-32;i<32;i+=16){x.beginPath();x.moveTo(i,32);x.lineTo(i+8,32);x.lineTo(i+40,0);x.lineTo(i+32,0);x.fill();}},{rep:true}),
 cardboard:ctex(32,32,x=>{x.fillStyle='#a07a48';x.fillRect(0,0,32,32);x.fillStyle='#c9b98a';x.fillRect(0,14,32,4);grime(x,32,32,80,.3);},{rep:true}),
 floorD:ctex(64,64,x=>{x.fillStyle='#d6d0bd';x.fillRect(0,0,64,64);x.fillStyle='#141416';x.fillRect(0,0,32,32);x.fillRect(32,32,32,32);const c=['#e0303f','#3b6fd6','#f2b33d','#49c06a','#e97db4'];for(let i=0;i<26;i++){x.fillStyle=c[i%5];x.fillRect(Math.floor(rnd()*62),Math.floor(rnd()*62),2,2);}grime(x,64,64,420,.45);x.fillStyle='rgba(60,30,10,.3)';x.beginPath();x.arc(44,20,9,0,7);x.fill();},{rep:true}),
 cloth:ctex(32,32,x=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#b8202a':'#e8e0d0';x.fillRect(i*8,j*8,8,8);}grime(x,32,32,90,.35);},{rep:true}),
 paper:ctex(32,32,x=>{x.fillStyle='#e8e0cc';x.fillRect(0,0,32,32);x.fillStyle='#555';for(let i=0;i<7;i++)x.fillRect(4,5+i*3.5,18+((i*7)%8),1);x.fillStyle='#a01018';x.fillRect(5,28,14,2);grime(x,32,32,60,.3);}),
 pipe:ctex(32,32,x=>{x.fillStyle='#4a4e56';x.fillRect(0,0,32,32);grime(x,32,32,160,.5);x.fillStyle='rgba(120,60,20,.4)';x.fillRect(0,20,32,5);},{rep:true}),
 arcade:ctex(32,32,x=>{x.fillStyle='#050510';x.fillRect(0,0,32,32);x.fillStyle='#ffd23f';x.beginPath();x.arc(10,16,5,.5,5.8);x.lineTo(10,16);x.fill();x.fillStyle='#ff4060';x.fillRect(20,12,6,7);x.fillStyle='#fff';for(let i=14;i<20;i+=4)x.fillRect(i,15,1,1);}),
};
/* ---------- PÔSTERES: rostos desenhados + envelhecimento ---------- */
const FACE={
 sandega:{head:'#4f9a3a',hair:'#1e9a8a',accent:'#c9b870',eye:'#7af0c0'},
 bruna:{head:'#e0601c',hair:'#e0601c',accent:'#f4e6d4',eye:'#ffb040'},
 fernanda:{head:'#f2dada',hair:'#e04a2a',accent:'#e8901c',eye:'#ff5aa0'},
 xinglau:{head:'#d8a622',hair:'#efe0a8',accent:'#e86a1c',eye:'#c8903a'},
 toco:{head:'#3a78c8',hair:'#3a78c8',accent:'#ece4d4',eye:'#9ad0ff'},
 zig:{head:'#c41a48',hair:'#c41a48',accent:'#c49a6c',eye:'#ff3040'},
 bob:{head:'#c8252c',hair:'#7d1015',accent:'#f08a8e',eye:'#ffffff'}
};
function tri(x,a,b,c,d,e,f){x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.lineTo(e,f);x.closePath();x.fill();}
function drawFace(x,type,cx,cy,s,o){
 o=o||{}; const F=FACE[type]; x.save(); x.translate(cx,cy);
 x.lineWidth=Math.max(1,s*.06); x.strokeStyle='#120a08';
 // atrás da cabeça
 if(type==='bruna'){x.fillStyle=F.head;tri(x,-s*.9,-s*.2,-s*.55,-s*1.35,-s*.15,-s*.7);tri(x,s*.9,-s*.2,s*.55,-s*1.35,s*.15,-s*.7);x.fillStyle='#d88a9a';tri(x,-s*.72,-s*.35,-s*.55,-s*1.05,-s*.3,-s*.7);tri(x,s*.72,-s*.35,s*.55,-s*1.05,s*.3,-s*.7);}
 if(type==='toco'){x.fillStyle='#2a5a9a';x.beginPath();x.ellipse(-s*.95,s*.1,s*.32,s*.7,.35,0,7);x.fill();x.beginPath();x.ellipse(s*.95,s*.1,s*.32,s*.7,-.35,0,7);x.fill();}
 if(type==='bob'){x.fillStyle=F.hair;x.beginPath();x.ellipse(-s*.9,s*.1,s*.3,s*.75,.3,0,7);x.fill();x.beginPath();x.ellipse(s*.9,s*.1,s*.3,s*.75,-.3,0,7);x.fill();}
 if(type==='zig'){x.fillStyle=F.accent;x.beginPath();x.arc(-s*1.0,0,s*.38,0,7);x.arc(s*1.0,0,s*.38,0,7);x.fill();x.fillStyle='#6a4a30';x.beginPath();x.arc(-s*1.0,0,s*.2,0,7);x.arc(s*1.0,0,s*.2,0,7);x.fill();}
 if(type==='fernanda'){x.fillStyle=F.hair;for(let i=0;i<7;i++){const a=-2.4+i*.32;tri(x,Math.cos(a)*s*.6,Math.sin(a)*s*.6,Math.cos(a)*s*1.55,Math.sin(a)*s*1.45-s*.2,Math.cos(a+.25)*s*.7,Math.sin(a+.25)*s*.7);}}
 // cabeça
 x.fillStyle=F.head; x.beginPath(); x.ellipse(0,0,s,s*(type==='sandega'?1.05:.96),0,0,7); x.fill(); x.stroke();
 // cabelo/topete
 if(type==='sandega'||type==='zig'||type==='toco'){x.fillStyle=F.hair;for(let i=0;i<7;i++){const xx=-s*.6+i*s*.2;tri(x,xx-s*.14,-s*.7,xx+s*.14,-s*.7,xx+(i-3)*s*.06,-s*(1.2+(i%2)*.2));}}
 if(type==='xinglau'){x.fillStyle=F.hair;for(let i=0;i<5;i++)tri(x,-s*.3+i*s*.12,-s*.75,-s*.1+i*s*.12,-s*.75,-s*.55+i*s*.05,-s*1.5+(i%2)*s*.2);}
 // focinho/bico
 if(type==='bruna'){x.fillStyle=F.accent;tri(x,-s*.75,s*.05,s*.75,s*.05,0,s*.95);x.fillStyle='#111';x.beginPath();x.arc(0,s*.3,s*.11,0,7);x.fill();}
 if(type==='toco'||type==='bob'){x.fillStyle=F.accent;x.beginPath();x.ellipse(0,s*.38,s*.5,s*.36,0,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.ellipse(0,s*.2,s*.16,s*.11,0,0,7);x.fill();}
 if(type==='zig'){x.fillStyle=F.accent;x.beginPath();x.ellipse(0,s*.1,s*.72,s*.78,0,0,7);x.fill();x.beginPath();x.ellipse(0,s*.48,s*.45,s*.3,0,0,7);x.fill();}
 // olhos
 const ey=type==='zig'?-s*.08:-s*.15, ex=s*.36, er=s*.22;
 [-1,1].forEach(k=>{
  x.fillStyle='#0a0606';x.beginPath();x.ellipse(k*ex,ey,er*1.45,er*1.3,0,0,7);x.fill();
  if(o.glow){x.fillStyle=F.eye;x.shadowColor=F.eye;x.shadowBlur=s*.4;x.beginPath();x.arc(k*ex,ey,er*.4,0,7);x.fill();x.shadowBlur=0;}
  else {x.fillStyle='#f2ece0';x.beginPath();x.arc(k*ex,ey,er,0,7);x.fill();x.fillStyle=F.eye;x.beginPath();x.arc(k*ex,ey+er*.1,er*.55,0,7);x.fill();x.fillStyle='#000';x.beginPath();x.arc(k*ex,ey+er*.1,er*.25,0,7);x.fill();}
  if(type==='xinglau'||type==='fernanda'||type==='zig'){x.fillStyle='#120a08';x.save();x.translate(k*ex,ey-er*1.35);x.rotate(k*.4);x.fillRect(-er*1.2,-s*.05,er*2.4,s*.1);x.restore();}
 });
 // boca
 const my=type==='zig'?s*.5:(type==='bruna'?s*.58:s*.5);
 if(type==='xinglau'||type==='fernanda'||type==='sandega'){
  x.fillStyle=F.accent; x.beginPath(); x.moveTo(-s*.55,s*.12); x.quadraticCurveTo(0,s*(type==='fernanda'?.55:.35),s*.55,s*.12); x.lineTo(s*.42,s*.5); x.quadraticCurveTo(0,s*.95,-s*.42,s*.5); x.closePath(); x.fill(); x.stroke();
  x.fillStyle='#2a0606'; x.beginPath(); x.ellipse(0,s*.42,s*.36,s*.14,0,0,7); x.fill();
  x.fillStyle='#efe6cf'; for(let i=0;i<6;i++) tri(x,-s*.3+i*s*.12,s*.3,-s*.24+i*s*.12,s*.3,-s*.27+i*s*.12,s*.4);
 } else {
  x.fillStyle='#2a0606'; x.beginPath(); x.moveTo(-s*.5,my-s*.08); x.quadraticCurveTo(0,my+s*.45,s*.5,my-s*.08); x.quadraticCurveTo(0,my+s*.12,-s*.5,my-s*.08); x.fill();
  x.fillStyle='#efe6cf'; for(let i=0;i<7;i++){const xx=-s*.42+i*s*.14;tri(x,xx-s*.05,my-s*.04+Math.abs(i-3)*-s*.02,xx+s*.05,my-s*.04+Math.abs(i-3)*-s*.02,xx,my+s*.08);}
 }
 // vandalismo nos olhos
 if(o.scratch){x.strokeStyle='#050303';x.lineWidth=s*.08;[-1,1].forEach(k=>{x.beginPath();for(let i=0;i<6;i++){x.moveTo(k*ex-er*1.4,ey-er+i*er*.4);x.lineTo(k*ex+er*1.4,ey-er*.6+i*er*.4);}x.stroke();});}
 x.restore();
}
function ageCanvas(x,w,h,o){
 o=o||{};
 for(let i=0;i<w*h*.08;i++){x.fillStyle=`rgba(${rnd()<.5?40:90},${rnd()<.5?25:60},10,${(rnd()*.25).toFixed(2)})`;x.fillRect(Math.floor(rnd()*w),Math.floor(rnd()*h),1+Math.floor(rnd()*2),1+Math.floor(rnd()*2));}
 for(let i=0;i<4;i++){const g=x.createRadialGradient(rnd()*w,rnd()*h,1,rnd()*w,rnd()*h,10+rnd()*30);g.addColorStop(0,'rgba(70,40,10,.35)');g.addColorStop(1,'rgba(70,40,10,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}
 x.fillStyle='rgba(0,0,0,.22)';x.fillRect(Math.floor(w/2),0,1,h);x.fillRect(0,Math.floor(h/2),w,1);
 x.fillStyle='rgba(255,255,255,.08)';x.fillRect(Math.floor(w/2)+1,0,1,h);
 const vg=x.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=vg;x.fillRect(0,0,w,h);
 if(o.torn){x.globalCompositeOperation='destination-out';x.beginPath();x.moveTo(w,h);x.lineTo(w-w*.35,h);for(let i=0;i<8;i++)x.lineTo(w-w*.35+i*w*.05,h-(i%2?6:14)-i*h*.03);x.lineTo(w,h-h*.35);x.closePath();x.fill();x.globalCompositeOperation='source-over';}
 if(o.tape){x.fillStyle='rgba(220,210,170,.7)';x.save();x.translate(w*.5,3);x.rotate(.05);x.fillRect(-12,-3,24,8);x.restore();}
}
function scrawl(x,text,cx,cy,size,rot,color){x.save();x.translate(cx,cy);x.rotate(rot||0);x.fillStyle=color||'#b0101a';x.font=`${size}px VT323, monospace`;x.textAlign='center';x.globalAlpha=.85;for(let i=0;i<2;i++)x.fillText(text,i*.7,i*.5);x.globalAlpha=1;x.restore();}
function posterDraw(spec){
 const w=128,h=160;
 return x=>{
  x.clearRect(0,0,w,h);
  x.fillStyle=spec.paper||'#e2d6b8';x.fillRect(0,0,w,h);
  x.fillStyle=spec.bg;x.fillRect(5,5,w-10,h-10);
  const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.15)');gr.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=gr;x.fillRect(5,5,w-10,h-10);
  for(let i=0;i<14;i++){x.fillStyle=`rgba(255,255,255,${(.04+rnd()*.06).toFixed(2)})`;x.beginPath();x.moveTo(w/2,h*.48);x.arc(w/2,h*.48,110,i*.45,i*.45+.18);x.fill();}
  x.fillStyle=spec.titleC||'#ffd23f';x.font='24px VT323, monospace';x.textAlign='center';x.fillText(spec.title,w/2,26);
  if(spec.faces){spec.faces.forEach((f,i)=>drawFace(x,f,20+i*((w-40)/(spec.faces.length-1)),78+(i%2)*14,13,{glow:spec.glow,scratch:spec.scratchIdx===i}));}
  else drawFace(x,spec.face,w/2,82,30,{glow:spec.glow,scratch:spec.scratch});
  x.fillStyle=spec.subC||'#efe6cf';x.font='16px VT323, monospace';x.fillText(spec.sub||'',w/2,h-24);
  x.font='12px VT323, monospace';x.fillStyle='rgba(239,230,207,.7)';x.fillText(spec.foot||'PIZZARIA DO BOB',w/2,h-11);
  ageCanvas(x,w,h,{torn:spec.torn,tape:true});
  if(spec.scrawl) scrawl(x,spec.scrawl,w/2,spec.scrawlY||118,spec.scrawlS||20,spec.scrawlR||-.2);
 };
}
function posterTex(spec){return ctex(128,160,posterDraw(spec),{text:true});}
function flyerTex(lines,title,o){
 o=o||{};
 return ctex(128,160,x=>{
  x.fillStyle='#d9d0b8';x.fillRect(0,0,128,160);
  x.fillStyle='#1a1410';x.font='20px VT323, monospace';x.textAlign='center';x.fillText(title,64,22);
  x.fillRect(10,28,108,2);
  x.font='12px VT323, monospace';x.textAlign='left';
  lines.forEach((l,i)=>{x.fillStyle=l.startsWith('!')?'#8a0a12':'#2a2018';x.fillText(l.replace(/^!/,''),10,44+i*12);});
  ageCanvas(x,128,160,{torn:o.torn,tape:true});
  if(o.scrawl) scrawl(x,o.scrawl,64,o.y||140,18,-.15);
 },{text:true});
}
function kidsTex(){
 return ctex(256,128,x=>{
  x.clearRect(0,0,256,128);
  const types=['sandega','bruna','fernanda','xinglau','toco','zig','bob','zig'];
  for(let i=0;i<8;i++){
   const px=4+(i%4)*63,py=4+Math.floor(i/4)*62;
   x.save();x.translate(px+29,py+29);x.rotate((rnd()-.5)*.35);
   x.fillStyle='#f4efe2';x.fillRect(-28,-28,56,56);
   x.globalAlpha=.85;drawFace(x,types[i],0,-4,12,{glow:i===6});x.globalAlpha=1;
   x.strokeStyle='#333';x.lineWidth=2;x.beginPath();x.moveTo(-6,12);x.lineTo(-6,24);x.moveTo(6,12);x.lineTo(6,24);x.stroke();
   if(i===2||i===5){x.strokeStyle='#c01020';x.lineWidth=3;x.beginPath();x.moveTo(-22,-22);x.lineTo(22,22);x.moveTo(22,-22);x.lineTo(-22,22);x.stroke();}
   x.fillStyle=['#c8252c','#3b6fd6','#2a8a3a','#7a3cc0'][i%4];x.font='11px VT323, monospace';x.textAlign='center';
   x.fillText(['EU E A SANDEGA','A BRUNA','NAO GOSTO','QUA QUA','MEU AMIGO','ELE GIRA','ELE VOLTOU','ELES ANDAM'][i],0,-18);
   x.restore();
  }
 },{text:true});
}

const BOB_SPEC={title:'FESTA DO BOB!',face:'bob',bg:'#5c1a1f',sub:'TODO DIA É ANIVERSÁRIO',foot:'DESDE 1983'};
const BOB_VAR={title:'SOU EU',face:'bob',bg:'#1a1206',glow:true,sub:'',foot:'',titleC:'#c9a227',scrawl:'SOU EU',scrawlY:132,scrawlS:24};
function drawPoster(x,variant){posterDraw(variant?BOB_VAR:BOB_SPEC)(x);}
function signDraw(text,bg,fg,size){return x=>{x.fillStyle=bg;x.fillRect(0,0,256,64);x.fillStyle=fg;x.font=(size||40)+'px VT323, monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);};}
function signTex(text,bg,fg,size){return ctex(256,64,signDraw(text,bg,fg,size),{text:true});}
const TEX={
 poster:ctex(128,160,x=>drawPoster(x,false),{text:true}),
 celebrate:posterTex({title:'COMEMORE!',faces:['sandega','bruna','fernanda','xinglau','toco','zig'],bg:'#1a0c14',sub:'BOB & AMIGOS',scratchIdx:3,scrawl:'ELES OLHAM',scrawlY:128}),
 kids:kidsTex(),
 pBruna:posterTex({title:'SHOW DE MÁGICA',face:'bruna',bg:'#3a1206',sub:'COM A BRUNA',scratch:true,scrawl:'ELA VÊ VOCÊ',scrawlY:120,torn:true}),
 pSandega:posterTex({title:'DEVAGAR...',face:'sandega',bg:'#0e2a14',sub:'E SEMPRE! - SANDEGA',scrawl:'ELA CHEGA',scrawlY:126,scrawlR:.15}),
 pXinglau:posterTex({title:'CAPITÃO DO TIME',face:'xinglau',bg:'#3a2a06',sub:'XINGLAU Nº 09',torn:true}),
 pToco:posterTex({title:'MELHOR AMIGO',face:'toco',bg:'#0a1a3a',sub:'ABRACE O TOCO',scrawl:'NÃO ABRACE',scrawlY:124}),
 pFernanda:posterTex({title:'VOE ALTO!',face:'fernanda',bg:'#3a0820',sub:'COM A FERNANDA',glow:true}),
 pZig:posterTex({title:'GIRA-GIRA!',face:'zig',bg:'#2a0610',sub:'NÃO DEIXE PARAR',glow:true,scrawl:'NUNCA',scrawlY:118,scrawlS:26}),
 pBobOld:posterTex({title:'BOB',face:'bob',bg:'#2a0a0c',sub:'1983 - 1987',foot:'',scratch:true,torn:true,scrawl:'ONDE ELE ESTÁ?',scrawlY:126,scrawlS:16}),
 job:flyerTex(['PROCURA-SE','VIGIA NOTURNO','','TURNO: 0H ÀS 6H','SALÁRIO: R$ 120/SEM','','A EMPRESA NÃO SE','RESPONSABILIZA','POR DANOS.','','!NÃO OLHE NOS OLHOS'],'CLASSIFICADOS',{scrawl:'FUJA',y:146}),
 smile:posterTex({title:'SORRIA!',face:'toco',bg:'#2a0a0a',sub:'VOCÊ ESTÁ SENDO',foot:'FILMADO',glow:true}),
 rules:flyerTex(['1. NÃO CORRA','2. NÃO GRITE','3. NÃO TOQUE NOS','   ANIMATRÔNICOS','4. NÃO SAIA APÓS 0H','5. MANTENHA AS','   PORTAS ABERTAS','6. SORRIA SEMPRE','','!7. SE ELES OLHAREM','!   PARA VOCÊ, NÃO','!   SE MEXA'],'REGRAS',{torn:true}),
 stage:signTex('BOB & AMIGOS','#7d1222','#f2b33d',44),
 birthday:signTex('FELIZ ANIVERSÁRIO','#1a2a55','#f2b33d',34),
 play:signTex('DIVIRTA-SE!','#2a1440','#ffd23f',40),
 staff:signTex('SÓ FUNCIONÁRIOS','#1a1a1a','#e0303f',32),
 smile:ctex(64,64,x=>{x.fillStyle='#e9dcc0';x.fillRect(0,0,64,64);x.fillStyle='#5c1a1f';x.font='18px VT323, monospace';x.textAlign='center';x.fillText('SORRIA!',32,58);x.fillStyle='#c8252c';x.beginPath();x.arc(32,26,16,0,7);x.fill();x.fillStyle='#fff';x.fillRect(24,20,5,5);x.fillRect(35,20,5,5);},{text:true}),
 rules:ctex(64,64,x=>{x.fillStyle='#d8cfb8';x.fillRect(0,0,64,64);x.fillStyle='#222';x.font='11px VT323, monospace';x.textAlign='left';['REGRAS:','1. NÃO CORRA','2. NÃO GRITE','3. NÃO SAIA','   APÓS 0H'].forEach((l,i)=>x.fillText(l,4,12+i*12));},{text:true}),
 exit:signTex('SAÍDA','#0f3a18','#8fe38f',44),
 power:signTex('NÃO DESLIGUE A ENERGIA','#1d1a14','#c9b98a',22),
 zig:signTex('GIRA-GIRA DO ZIG','#3a0d14','#ffd23f',30)
};
const TXG0=TX.metal;
const LM={
 wall:{t:TX.wall,s:2},wall2:{t:TX.wall2,s:2},wain:{t:TX.wain,s:1},trim:{c:0x6a1820},floor:{t:TX.floor,s:1},floor2:{t:TX.floor2,s:2},
 ceil:{t:TX.ceil,s:2},wood:{t:TX.wood,s:1.5},metal:{t:TX.metal,s:1},dark:{c:0x121216},hazard:{t:TX.hazard,s:.4},
 stage:{t:TX.wood,s:1,c:0xd9a878},curtain:{t:TX.curtain,s:1.5},black:{c:0x0e0e12},table:{t:TX.cloth,s:.6},chair:{c:0x8a1c24},red:{c:0xb5121f},
 tile:{t:TX.tile,s:.8},tilewall:{t:TX.tile,s:.8,c:0xd8e6dc},counter:{t:TX.metal,s:1,c:0xc8c8c0},white:{c:0xe8e4da},cardboard:{t:TX.cardboard,s:.6},
 carpet:{t:TX.carpet,s:2},floorD:{t:TX.floorD,s:1},blue:{c:0x2d5bd0},yellow:{c:0xe0b020},duct:{t:TX.metal,s:.8,c:0x8a8e98},glow:{c:0xfff1d0,basic:true}
};
Object.values(LM).forEach(o=>{o.mat=ps1(o.basic?new THREE.MeshBasicMaterial({color:o.c==null?0xffffff:o.c}):new THREE.MeshLambertMaterial({color:o.c==null?0xffffff:o.c,map:o.t||null}));});

/* ---------- monta o mapa (geometria subdividida para a luz por vértice do PS1) ---------- */
function geoSlab(b,tile){
 const w=b[1]-b[0],h=b[3]-b[2],d=b[5]-b[4],sg=v=>Math.max(1,Math.min(20,Math.round(v/.8)));
 const g=new THREE.BoxGeometry(w,h,d,sg(w),sg(h),sg(d));
 g.translate((b[0]+b[1])/2,(b[2]+b[3])/2,(b[4]+b[5])/2);
 const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));
  if(ny>.5)uv.setXY(i,X/tile,Z/tile);else if(nx>.5)uv.setXY(i,Z/tile,Y/tile);else uv.setXY(i,X/tile,Y/tile);}
 return g;
}
function mergeGeos(list){
 let vc=0,ic=0; list.forEach(g=>{vc+=g.attributes.position.count;ic+=g.index.count;});
 const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),uvs=new Float32Array(vc*2),idx=vc>65535?new Uint32Array(ic):new Uint16Array(ic);
 let vo=0,io=0;
 list.forEach(g=>{pos.set(g.attributes.position.array,vo*3);nor.set(g.attributes.normal.array,vo*3);uvs.set(g.attributes.uv.array,vo*2);const ia=g.index.array;for(let i=0;i<ia.length;i++)idx[io+i]=ia[i]+vo;vo+=g.attributes.position.count;io+=ia.length;g.dispose();});
 const m=new THREE.BufferGeometry();
 m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('uv',new THREE.BufferAttribute(uvs,2));m.setIndex(new THREE.BufferAttribute(idx,1));m.computeBoundingSphere();
 return m;
}
/* ================= MAPA DO RESTAURANTE =================
   Cada bloco: [x1,x2,y1,y2,z1,z2,material]. x = leste/oeste, z = norte(-)/sul(+), y = altura (metros).
   //@@LEVEL_START */
function levelData(){
 const S=[];
 const A=(x1,x2,y1,y2,z1,z2,m)=>S.push([Math.min(x1,x2),Math.max(x1,x2),Math.min(y1,y2),Math.max(y1,y2),Math.min(z1,z2),Math.max(z1,z2),m]);
 // parede com rodapé xadrez, faixa e papel de parede
 const W=(x1,x2,z1,z2,y1,y2,upper)=>{
  if(y1<1) A(x1,x2,y1,Math.min(1,y2),z1,z2,'wain');
  if(y2>1&&y1<1.08) A(x1,x2,Math.max(1,y1),Math.min(1.08,y2),z1,z2,'trim');
  if(y2>1.08) A(x1,x2,Math.max(1.08,y1),y2,z1,z2,upper||'wall');
 };
 const T=(x1,x2,z1,z2,y1,y2)=>A(x1,x2,y1,y2,z1,z2,'tilewall');

 /* ---- ESCRITÓRIO ---- */
 A(-2.4,2.4,-.1,0,-1.9,2,'floor'); A(-2.6,2.6,3,3.1,-2.1,2.2,'ceil');
 W(-2.6,2.6,2,2.2,0,3);
 W(-2.6,-2.2,-2.1,-1.9,0,3); W(-1.4,-.8,-2.1,-1.9,0,3);
 W(-2.2,-1.4,-2.1,-1.9,0,2.2); W(-2.2,-1.4,-2.1,-1.9,2.7,3);
 W(.8,2.6,-2.1,-1.9,0,3); W(-.8,.8,-2.1,-1.9,2.4,3);
 [-1,1].forEach(s=>{const a=s*2.4,b=s*2.6;W(a,b,-2.1,-.4,0,3);W(a,b,1,2.2,0,3);W(a,b,-.4,1,2.3,3);
  A(s*2.38,s*2.42,0,2.36,-.5,-.4,'hazard'); A(s*2.38,s*2.42,0,2.36,1,1.1,'hazard'); A(s*2.38,s*2.42,2.3,2.38,-.5,1.1,'hazard');});
 A(-.6,.6,2.96,3,.1,.5,'glow');
 // mesa
 A(-1.3,1.3,.74,.8,-.1,.6,'wood'); A(-1.3,1.3,0,.74,-.13,-.07,'wood');
 A(-1.3,-1.2,0,.74,-.1,.6,'wood'); A(1.2,1.3,0,.74,-.1,.6,'wood');
 // arquivo, prateleira
 A(1.75,2.38,0,1.25,1.35,1.95,'metal'); A(1.75,2.38,1.25,1.28,1.35,1.95,'dark');
 A(-2.38,-1.9,1.6,1.65,1.2,1.95,'wood');
 // grade do duto
 [2.3,2.4,2.5,2.6].forEach(y=>A(-2.2,-1.4,y-.015,y+.015,-1.9,-1.87,'metal'));
 A(-2.25,-1.35,2.15,2.2,-1.9,-1.86,'metal'); A(-2.25,-1.35,2.7,2.75,-1.9,-1.86,'metal');

 /* ---- CORREDOR DO MEIO ---- */
 A(-.8,.8,-.1,0,-14.2,-2.1,'floor'); A(-.8,.8,2.6,2.7,-14.2,-2.1,'ceil');
 W(-1,-.8,-14.2,-2.1,0,2.7); W(.8,1,-14.2,-2.1,0,2.7);
 A(-.3,.3,2.56,2.6,-12.7,-12.3,'glow');

 /* ---- CORREDORES OESTE E LESTE ---- */
 [-1,1].forEach(s=>{
  A(s*2.6,s*5,-.1,0,-14.2,2,'floor'); A(s*2.6,s*5,2.8,2.9,-14.2,2,'ceil');
  W(s*5,s*5.2,-14.2,2.2,0,2.9); W(s*2.6,s*5,2,2.2,0,2.9); W(s*2.4,s*2.6,-14.2,-2.1,0,2.9);
  A(s*4.1,s*3.5,2.76,2.8,-8.2,-7.8,'glow');
  A(s*4.98,s*5,0,.5,-13,-1,'trim');
 });

 /* ---- SALÃO DE FESTAS ---- */
 A(-10,10,-.1,0,-28,-14.2,'floorD'); A(-10.2,10.2,4,4.1,-28.2,-14,'ceil');
 [[-10.2,-5],[-2.6,-2.3],[-1.3,-.8],[.8,2.6],[5,10.2]].forEach(([a,b])=>W(a,b,-14.2,-14,0,4));
 W(-2.3,-1.3,-14.2,-14,0,2); W(-2.3,-1.3,-14.2,-14,2.9,4);
 A(-2.35,-1.25,1.95,2,-14.27,-14.2,'metal'); A(-2.35,-1.25,2.9,2.95,-14.27,-14.2,'metal'); A(-2.35,-2.3,1.95,2.95,-14.27,-14.2,'metal'); A(-1.3,-1.25,1.95,2.95,-14.27,-14.2,'metal');
 W(-5,-2.6,-14.2,-14,2.8,4); W(-.8,.8,-14.2,-14,2.6,4); W(2.6,5,-14.2,-14,2.8,4);
 W(-10.2,10.2,-28.2,-28,0,4);
 W(-10.2,-10,-28,-26,0,4); W(-10.2,-10,-24,-19,0,4); W(-10.2,-10,-17,-14.2,0,4);
 W(-10.2,-10,-26,-24,2.6,4); W(-10.2,-10,-19,-17,2.6,4);
 W(10,10.2,-28,-22,0,4); W(10,10.2,-20,-14.2,0,4); W(10,10.2,-22,-20,2.6,4);
 // palco
 A(-6.4,6.4,0,.6,-28,-23.6,'stage'); A(-6.4,6.4,.56,.62,-23.62,-23.56,'trim'); A(-1.2,1.2,0,.3,-23.6,-23.1,'stage');
 A(-6.4,6.4,.6,4,-27.95,-27.75,'curtain'); A(-7,-6,0,4,-24.2,-23.4,'curtain'); A(6,7,0,4,-24.2,-23.4,'curtain'); A(-7,7,3.3,4,-24.2,-23.4,'curtain');
 A(-6.2,-5.4,.6,1.6,-27.6,-26.9,'black'); A(5.4,6.2,.6,1.6,-27.6,-26.9,'black');
 // mesas e cadeiras
 [[-4,-17.2],[4,-17.2],[-4,-20.6],[4,-20.6]].forEach(([cx,cz])=>{
  A(cx-2,cx+2,.72,.78,cz-.5,cz+.5,'table');
  [[-1.85,-.35],[1.75,-.35],[-1.85,.25],[1.75,.25]].forEach(([dx,dz])=>A(cx+dx,cx+dx+.1,0,.72,cz+dz,cz+dz+.1,'black'));
  for(let i=0;i<4;i++){const x=cx-1.5+i;A(x-.2,x+.2,0,.45,cz-.95,cz-.55,'chair');A(x-.2,x+.2,.45,.95,cz-.97,cz-.9,'chair');A(x-.2,x+.2,0,.45,cz+.55,cz+.95,'chair');A(x-.2,x+.2,.45,.95,cz+.9,cz+.97,'chair');}
 });
 // fliperamas e balcão de prêmios
 A(-10,-9.3,0,1.8,-16,-15.3,'black'); A(-10,-9.3,0,1.8,-16.9,-16.2,'black');
 A(7,9.8,0,1,-15.7,-15.1,'red'); A(7,9.8,1,1.05,-15.75,-15.05,'wood');
 [[-4,-17.2],[4,-17.2],[-4,-20.6],[4,-20.6]].forEach(([x,z])=>A(x-.5,x+.5,3.95,4,z-.15,z+.15,'glow'));

 /* ---- COZINHA ---- */
 A(10.2,16,-.1,0,-26,-16,'tile'); A(10,16.2,3.2,3.3,-26.2,-15.8,'ceil');
 T(16,16.2,-26.2,-15.8,0,3.3); T(10.2,16,-26.2,-26,0,3.3); T(10.2,16,-16,-15.8,0,3.3);
 A(10.4,15.8,0,.9,-25.8,-25.1,'counter'); A(15.1,15.8,0,.9,-25.1,-17,'counter');
 A(12,13.2,.9,1,-25.7,-25.2,'black'); A(10.4,11.4,0,2.2,-17,-16.2,'white');
 A(12.5,13.5,3.15,3.2,-21.2,-20.8,'glow');

 /* ---- DEPÓSITO ---- */
 A(-16,-10.2,-.1,0,-28,-22,'floor2'); A(-16.2,-10,3,3.1,-28.2,-21.8,'ceil');
 W(-16.2,-16,-28.2,-21.8,0,3.1,'wall2'); W(-16,-10.2,-28.2,-28,0,3.1,'wall2'); W(-16,-10.2,-22,-21.8,0,3.1,'wall2');
 [.8,1.6,2.4].forEach(y=>A(-15.8,-12,y,y+.05,-27.9,-27.3,'wood'));
 A(-15.8,-15.7,0,2.6,-27.9,-27.3,'metal'); A(-12.1,-12,0,2.6,-27.9,-27.3,'metal');
 A(-15.7,-15,0,.7,-24,-23.3,'cardboard'); A(-15.6,-15.1,.7,1.2,-23.9,-23.4,'cardboard'); A(-11,-10.4,0,.6,-27.7,-27.1,'cardboard');
 A(-13,-11,.8,.86,-23.5,-22.6,'wood'); A(-12.95,-12.85,0,.8,-23.45,-23.35,'black'); A(-11.15,-11.05,0,.8,-23.45,-23.35,'black');

 /* ---- ÁREA DE BRINQUEDOS ---- */
 A(-16,-10.2,-.1,0,-20,-14.4,'carpet'); A(-16.2,-10,3.4,3.5,-20.2,-14.2,'ceil');
 W(-16.2,-16,-20.2,-14.2,0,3.5); W(-16,-10.2,-20.2,-20,0,3.5); W(-16,-10.2,-14.4,-14.2,0,3.5);
 A(-15.8,-13,0,.5,-19.8,-19.6,'blue'); A(-15.8,-13,0,.5,-17.6,-17.4,'blue'); A(-13.2,-13,0,.5,-19.6,-17.6,'blue');
 A(-15.9,-15.2,0,2,-15.4,-14.6,'yellow');
 A(-12,-11.4,0,.6,-19.8,-19.2,'red'); A(-12.9,-12.3,0,.6,-19.8,-19.2,'blue'); A(-12.45,-11.85,.6,1.2,-19.8,-19.2,'yellow');

 /* ---- DUTO ---- */
 A(-2.35,-1.25,1.95,2,-14.1,-1.9,'duct'); A(-2.35,-1.25,2.9,2.95,-14.1,-1.9,'duct');
 A(-2.35,-2.3,2,2.9,-14.1,-1.9,'duct'); A(-1.3,-1.25,2,2.9,-14.1,-1.9,'duct');
 for(let z=-13;z<=-3;z+=1.5) A(-2.3,-1.3,2.85,2.9,z-.05,z+.05,'dark');
 return S;
}
/* Câmeras: posição, para onde olham e onde os animatrônicos ficam em cada sala */
const CAMDEF={
 1:{pos:[0,3.5,-16.2],look:[0,1.5,-25.6],slots:[[-3,.6,-25.8],[-1,.6,-26.3],[1,.6,-26.3],[3,.6,-25.8],[5,.6,-25]]},
 2:{pos:[9.4,3.6,-14.8],look:[-3,.8,-21.5],slots:[[-.2,0,-15.6],[-7.5,0,-22.3],[7.2,0,-18.9],[0,0,-22.6],[6.8,0,-22.8]]},
 3:{pos:[15.5,2.9,-16.5],look:[11.5,.8,-23.5],slots:[[12.2,0,-23.6],[14,0,-19.5],[11.6,0,-18.6],[14,0,-24]]},
 4:{pos:[-3.8,2.6,-13.9],look:[-3.8,.8,-1],slots:[[-3.8,0,-9.2],[-4.2,0,-5.8],[-3.4,0,-11.6],[-4.3,0,-3.2]]},
 5:{pos:[3.8,2.6,-13.9],look:[3.8,.8,-1],slots:[[3.8,0,-9.2],[4.2,0,-5.8],[3.4,0,-11.6],[4.3,0,-3.2]]},
 6:{pos:[-10.6,2.7,-22.4],look:[-14.6,.8,-26.6],slots:[[-12.2,0,-24.8],[-13.8,0,-23.4],[-11.6,0,-26.6],[-14.8,0,-25.4]]},
 7:{pos:[-1.8,2.78,-3.4],look:[-1.8,2.25,-13],slots:[[-1.8,1.52,-9],[-1.8,1.52,-6.5],[-1.8,1.52,-11.5],[-1.8,1.52,-5]],scale:.55},
 8:{pos:[-10.6,3.1,-14.8],look:[-14.2,.6,-18.3],slots:[[-12.4,0,-15.8],[-11.9,0,-18.2],[-14.6,0,-15.4],[-12.8,0,-17],[-14.4,.25,-18.6]]}
};
/* //@@LEVEL_END */

(function buildLevel(){
 const by={};
 levelData().forEach(b=>{(by[b[6]]=by[b[6]]||[]).push(b);});
 Object.keys(by).forEach(k=>{
  const L=LM[k]||LM.dark;
  // divide em blocos menores para não estourar o índice de 16 bits
  for(let i=0;i<by[k].length;i+=60){
   const m=new THREE.Mesh(mergeGeos(by[k].slice(i,i+60).map(b=>geoSlab(b,L.s||1))),L.mat); scene.add(m);
  }
 });
})();

/* ---------- objetos e decoração ---------- */
const OFF=new THREE.Group(); scene.add(OFF);
function lightCone(x,y,z,tx,ty,tz,r,color,op){
 const h=Math.hypot(tx-x,ty-y,tz-z);
 const geo=new THREE.ConeGeometry(r,h,10,1,true); geo.rotateX(-Math.PI/2); geo.translate(0,0,h/2);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:op||.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 m.position.set(x,y,z); m.lookAt(tx,ty,tz); scene.add(m); return m;
}
(function props(){
 const P=OFF;
 // escritório: monitor, papéis, telefone, refri, cupcake, lixeira, abajur
 slab(-.75,-.25,.8,.84,.05,.25,0x1c1c1c,P); slab(-.72,-.28,.84,1.16,.12,.18,0x1c1c1c,P);
 box(.25,.01,.32,0xe9e0c8,.3,.805,.35,P).rotation.y=.3; box(.22,.01,.3,0xd8ceb4,.15,.81,.3,P).rotation.y=-.2;
 box(.18,.06,.12,0x7a1010,1.0,.83,.42,P); box(.2,.04,.05,0x501010,1.0,.88,.42,P);
 mesh(new THREE.CylinderGeometry(.04,.035,.14,7),0xc8252c,-.95,.87,.45,P);
 mesh(new THREE.CylinderGeometry(.06,.05,.07,8),0xe97db4,-1.0,.835,.15,P);
 mesh(new THREE.SphereGeometry(.07,7,5),0xfbe0ee,-1.0,.89,.15,P);
 mesh(new THREE.SphereGeometry(.012,5,3),0x111111,-1.02,.9,.21,P); mesh(new THREE.SphereGeometry(.012,5,3),0x111111,-.98,.9,.21,P);
 mesh(new THREE.CylinderGeometry(.006,.006,.08,4),0xffffff,-1.0,.98,.15,P);
 mesh(new THREE.SphereGeometry(.015,4,3),ps1(new THREE.MeshBasicMaterial({color:0xffb030})),-1.0,1.03,.15,P);
 mesh(new THREE.CylinderGeometry(.16,.13,.4,8,1,true),0x3a3a40,-1.9,.2,1.5,P);
 mesh(new THREE.ConeGeometry(.28,.18,8,1,true),0x2a2a2e,0,2.82,.3,P);
 mesh(new THREE.CylinderGeometry(.008,.008,.2,4),0x111111,0,2.98,.3,P);
 // relógio de parede
 const clk=mesh(new THREE.CylinderGeometry(.16,.16,.04,12),0xe8e4da,.4,2.3,-1.88,P); clk.rotation.x=Math.PI/2;
 box(.01,.11,.01,0x111111,.4,2.34,-1.85,P); box(.08,.01,.01,0x111111,.43,2.3,-1.85,P);
 // pôsteres e avisos (128x160 -> proporção 0,8 x 1,0)
 const PO=(t,w,x,y,z,ry)=>{const m=plane(w,w*1.25,t,x,y,z,ry,P);m.material.transparent=true;m.material.alphaTest=.5;return m;};
 PO(TEX.poster,.8,-1.65,1.5,-1.885,0);
 PO(TEX.celebrate,.7,1.6,1.7,-1.885,0);
 PO(TEX.job,.42,.95,1.25,-1.884,0).rotation.z=.06;
 const kd=plane(1.4,.7,TEX.kids,-2.385,1.55,-1.2,Math.PI/2,P); kd.material.transparent=true;
 plane(1.2,.3,TEX.power,2.385,2.05,-1.2,-Math.PI/2,P);
 PO(TEX.rules,.45,2.385,1.35,-1.35,-Math.PI/2);
 PO(TEX.pBruna,.55,-.79,1.5,-4.4,Math.PI/2); PO(TEX.smile,.5,.79,1.55,-7,-Math.PI/2); PO(TEX.rules,.45,-.79,1.45,-9.8,Math.PI/2).rotation.z=-.08;
 // corredores laterais
 const kd2=plane(1.2,.6,TEX.kids,-4.99,1.6,-6,Math.PI/2,P); kd2.material.transparent=true;
 PO(TEX.pXinglau,.6,-4.99,1.55,-3.2,Math.PI/2); PO(TEX.pBobOld,.55,-2.61,1.6,-8.5,-Math.PI/2);
 PO(TEX.pSandega,.6,4.99,1.6,-6.5,-Math.PI/2); PO(TEX.smile,.45,2.61,1.6,-10.5,Math.PI/2);
 plane(.8,.2,TEX.exit,3.8,2.55,1.99,Math.PI,P,true); plane(.8,.2,TEX.exit,-3.8,2.55,1.99,Math.PI,P,true);
 // salão
 plane(3.2,.8,TEX.stage,0,3.65,-23.38,0,P,true);
 plane(3.4,.85,TEX.birthday,7.6,3.0,-14.21,Math.PI,P);
 PO(TEX.celebrate,1,-9.99,2.2,-21.5,Math.PI/2); PO(TEX.pToco,.8,-9.99,2.2,-15.6+.0,Math.PI/2);
 PO(TEX.pFernanda,.8,9.99,2.2,-25,-Math.PI/2); PO(TEX.poster,.8,9.99,2.2,-17.2,-Math.PI/2);
 PO(TEX.pBruna,.8,-7.6,2.4,-14.21,Math.PI);
 plane(1.2,.3,TEX.staff,-9.99,2.85,-25,Math.PI/2,P);
 plane(1.6,.4,TEX.zig,12.9,2.1,-25.99,0,P,true); PO(TEX.pZig,.6,15.99,1.8,-21,-Math.PI/2);
 PO(TEX.pBobOld,.6,-15.99,1.7,-25.5,Math.PI/2); PO(TEX.job,.45,-10.21,1.6,-23.2,-Math.PI/2);
 const kd3=plane(1.6,.8,TEX.kids,-13.1,1.8,-19.99,0,P); kd3.material.transparent=true; PO(TEX.pZig,.55,-15.99,1.6,-17,Math.PI/2);
 [-15.65,-16.55].forEach(z=>{plane(.5,.4,TX.arcade,-9.29,1.35,z,Math.PI/2,P,true);});
 const hatC=[0xc8252c,0x3b6fd6,0xf08a24,0x7a3cc0,0x49c06a];
 [[-4,-17.2],[4,-17.2],[-4,-20.6],[4,-20.6]].forEach(([cx,cz],t)=>{
  for(let i=0;i<4;i++){const x=cx-1.5+i;
   mesh(new THREE.CylinderGeometry(.12,.12,.015,8),0xf2f0ea,x,.79,cz-.28,P); mesh(new THREE.CylinderGeometry(.12,.12,.015,8),0xf2f0ea,x,.79,cz+.28,P);
   if((i+t)%2===0) mesh(new THREE.ConeGeometry(.07,.2,6),hatC[(i+t)%5],x+.15,.88,cz-.15,P);
   if((i+t)%3===0) mesh(new THREE.CylinderGeometry(.035,.03,.12,6),hatC[(i*2+t)%5],x-.2,.85,cz+.1,P);
  }
  box(.45,.05,.45,0xd9b070,cx,.81,cz,P); box(.36,.01,.36,0xc8252c,cx,.84,cz,P);
 });
 [[-8.6,2.7,-15.4,0xc8252c],[-8.1,3.0,-15.8,0x3b6fd6],[8.6,2.8,-24.5,0xf08a24],[9.1,2.5,-25.2,0x7a3cc0],[-3.2,3.1,-23.0,0xe97db4],[3.4,3.2,-23.1,0x49c06a]].forEach(([x,y,z,c])=>{
  const b=mesh(new THREE.SphereGeometry(.25,7,5),c,x,y,z,P); b.scale.y=1.2; slab(x-.006,x+.006,y-1.4,y-.3,z-.006,z+.006,0x999999,P);
 });
 [-2.8,0,2.8].forEach(x=>{const st=mesh(new THREE.OctahedronGeometry(.2),mat(0xe9c46a,{emissive:0x332200}),x,3.05,-27.6,P);st.scale.z=.3;});
 // cozinha
 mesh(new THREE.SphereGeometry(.6,8,5,0,Math.PI*2,0,Math.PI/2),0x9a4a2a,14.6,.9,-24.5,P);
 [[11.2,2.2],[11.7,2.0],[12.2,2.3]].forEach(([x,y])=>{const pan=mesh(new THREE.CylinderGeometry(.16,.13,.05,8),0x444448,x,y,-25.95,P);pan.rotation.x=Math.PI/2;});
 mesh(new THREE.CylinderGeometry(.25,.25,.02,10),0xd9a050,13,.92,-21,P);
 // depósito: cabeças reservas e traje vazio
 [[-15.2,0x7d1015],[-14.4,0x1d3d85],[-13.6,0x431d70]].forEach(([x,c],i)=>{mesh(new THREE.IcosahedronGeometry(.2,1),c,x,1.06+(i===2?.8:0),-27.6,P);mesh(new THREE.SphereGeometry(.04,5,3),0x000000,x-.07,1.1+(i===2?.8:0),-27.42,P);mesh(new THREE.SphereGeometry(.04,5,3),0x000000,x+.07,1.1+(i===2?.8:0),-27.42,P);});
 // brinquedos: bolinhas e escorregador
 const cols=[0xc8252c,0x3b6fd6,0xf08a24,0x7a3cc0,0xe97db4,0xffd23f],bg=new THREE.SphereGeometry(.11,5,4);
 for(let i=0;i<80;i++) mesh(bg,cols[i%6],-15.7+rnd()*2.6,.12+rnd()*.25,-19.5+rnd()*1.9,P);
 const sl=box(3,.06,.7,0xc8252c,-13.75,1.05,-15,P); sl.rotation.z=-.62;
 // cones de luz
 lightCone(0,2.8,.3,0,0,.3,1.3,0xffd2a0,.05);
 lightCone(0,2.55,-12.5,0,0,-12.5,.9,0x8fa8ff,.05);
 lightCone(-5,3.8,-16.5,-1.5,.6,-25.8,1.1,0xff3cc8,.06);
 lightCone(5,3.8,-16.5,1.5,.6,-25.8,1.1,0x40d0ff,.06);
})();
(function moreProps(){
 const P=OFF, pm=ps1(new THREE.MeshLambertMaterial({map:TX.pipe}));
 const pipe=(a,b,r)=>limb(a,b,r||.06,r||.06,pm,P,8);
 // canos no teto
 pipe([.55,2.45,-2.2],[.55,2.45,-14]); pipe([-.5,2.5,-2.2],[-.5,2.5,-14],.035);
 [-1,1].forEach(s=>{pipe([s*4.75,2.68,1.8],[s*4.75,2.68,-14],.07);pipe([s*4.55,2.72,1.8],[s*4.55,2.72,-14],.04);});
 pipe([-9.8,3.8,-14.5],[9.8,3.8,-14.5],.08); pipe([-9.8,3.85,-27.8],[-9.8,3.85,-14.5],.06);
 pipe([2.3,2.85,1.9],[2.3,2.85,-1.8],.05); pipe([2.3,2.85,-1.8],[2.3,.1,-1.8],.05);
 // fios caídos
 for(let i=0;i<5;i++){const z=-3-i*2.2;limb([-.6,2.6,z],[-.4+Math.sin(i)*.2,2.1-i%2*.2,z-.6],.008,.008,mat(0x111111),P,4);}
 // placa de chão molhado
 const wf=new THREE.Group();wf.position.set(4.4,0,-8.6);wf.rotation.y=.5;P.add(wf);
 [-1,1].forEach(s=>{const p=box(.4,.6,.02,0xe0b020,0,.3,s*.1,wf);p.rotation.x=s*.25;});
 // sacos de lixo
 [[-4.6,-12.6],[-4.4,-12.1],[15.6,-16.6],[-11,-27.5]].forEach(([x,z],i)=>{const b=mesh(new THREE.SphereGeometry(.3,9,7),0x16241a,x,.22,z,P);b.scale.set(1,.75,1.1);b.rotation.y=i;});
 // placa do forro caída
 const tile=box(.6,.02,.6,0x56565c,.25,2.25,-9.4,P); tile.rotation.set(.9,.2,.1);
 // portas extras
 const door=(x,z,ry,txt)=>{const d=box(.9,2.1,.06,0x2a2018,x,1.05,z,P);d.rotation.y=ry;const sg=plane(.6,.15,signTex(txt,'#1a1a1a','#c9b98a',30),x+Math.sin(ry)*.04,1.85,z+Math.cos(ry)*.04,ry,P);};
 door(-4.97,-9.8,Math.PI/2,'BANHEIRO'); door(4.97,-10.2,-Math.PI/2,'ZELADORIA');
 // bandeirinhas no salão
 const fc=[0xc8252c,0x3b6fd6,0xf2b33d,0x49c06a,0xe97db4,0x7a3cc0], fg=new THREE.ConeGeometry(.13,.26,3);
 [[-9.8,-16],[-9.8,-19.5],[-9.8,-23]].forEach(([x0,z],j)=>{for(let i=0;i<=26;i++){const k=i/26,x=x0+19.6*k,y=3.75-Math.sin(k*Math.PI)*.6;const f=new THREE.Mesh(fg,mat(fc[(i+j)%6]));f.position.set(x,y-.12,z);f.rotation.x=Math.PI;f.scale.z=.2;P.add(f);}});
 // treliça e refletores do palco
 slab(-6.4,6.4,3.62,3.72,-24.75,-24.65,0x2a2a2e,P); slab(-6.4,6.4,3.62,3.72,-25.35,-25.25,0x2a2a2e,P);
 for(let x=-6;x<=6;x+=1.2) limb([x,3.67,-24.7],[x+.6,3.67,-25.3],.012,.012,mat(0x2a2a2e),P,4);
 [-4.5,-1.5,1.5,4.5].forEach((x,i)=>{const can=mesh(new THREE.CylinderGeometry(.13,.1,.28,10),0x18181c,x,3.45,-25,P);can.rotation.x=.6;mesh(new THREE.CircleGeometry(.1,10),ps1(new THREE.MeshBasicMaterial({color:[0xff3cc8,0xfff1d0,0xfff1d0,0x40d0ff][i]})),x,3.36,-24.9,P).rotation.x=.6-Math.PI/2;});
 // pedestais de microfone e bateria
 [-1.8,1.8].forEach(x=>{limb([x,.6,-24.4],[x,1.85,-24.4],.012,.012,mat(0x222222),P,5);mesh(new THREE.SphereGeometry(.04,8,6),0x333333,x,1.9,-24.35,P);});
 const dr=new THREE.Group();dr.position.set(0,.6,-27.1);P.add(dr);
 mesh(new THREE.CylinderGeometry(.35,.35,.5,14),0xb8202a,0,.3,0,dr).rotation.x=Math.PI/2;
 [[-.55,.6],[.55,.6]].forEach(([x,y])=>mesh(new THREE.CylinderGeometry(.18,.18,.16,12),0xb8202a,x,y,.1,dr));
 [[-.75,1.05],[.75,1.05]].forEach(([x,y])=>{limb([x,0,0],[x,y,0],.01,.01,mat(0x888888),dr,4);mesh(new THREE.CylinderGeometry(.22,.22,.01,12),0xc9a227,x,y,0,dr).rotation.z=.15;});
 // bolo e presentes
 mesh(new THREE.CylinderGeometry(.18,.18,.18,14),0xf0d8e0,-4,.88,-20.6,P); mesh(new THREE.CylinderGeometry(.18,.18,.03,14),0xc8252c,-4,.98,-20.6,P);
 for(let i=0;i<5;i++){mesh(new THREE.CylinderGeometry(.008,.008,.08,4),0xffffff,-4+Math.cos(i*1.25)*.1,1.03,-20.6+Math.sin(i*1.25)*.1,P);}
 [[7.6,-15.4,0xc8252c],[8.2,-15.4,0x3b6fd6],[8.8,-15.4,0x49c06a],[9.3,-15.4,0xf2b33d]].forEach(([x,z,c],i)=>{mesh(new THREE.SphereGeometry(.14,10,8),c,x,1.18,z,P);mesh(new THREE.SphereGeometry(.06,8,6),c,x+.08,1.32,z,P);mesh(new THREE.SphereGeometry(.06,8,6),c,x-.08,1.32,z,P);});
 [[-8.8,-27.2,.4,0xc8252c],[-8.2,-27.4,.3,0x3b6fd6],[8.6,-27.3,.35,0x7a3cc0]].forEach(([x,z,w,c])=>{box(w,w,w,c,x,w/2,z,P);box(w+.01,.06,w+.01,0xf2b33d,x,w/2,z,P);});
 // balões murchos no chão
 [[-7.5,-19],[6.8,-24],[-1.5,-15.2],[3,-22.8]].forEach(([x,z],i)=>{const b=mesh(new THREE.SphereGeometry(.2,9,6),fc[i],x,.05,z,P);b.scale.set(1,.25,1.3);});
 // fliperamas: letreiros
 [-15.65,-16.55].forEach((z,i)=>{box(.7,.2,.7,i?0x3b6fd6:0xc8252c,-9.65,1.9,z,P);});
 // cozinha: pia, latas, caixas de pizza, coifa
 box(.9,.25,.55,0x9a9ea6,15.45,.95,-19,P); box(1.6,.5,1,0x55585e,14.6,2.5,-24.5,P);
 for(let i=0;i<8;i++) mesh(new THREE.CylinderGeometry(.06,.06,.15,8),[0xc8252c,0xe0b020,0x3b6fd6][i%3],10.6+i*.2,1.0,-25.5,P);
 for(let i=0;i<5;i++){const pz=box(.45,.06,.45,0xc9a070,14.3,.06+i*.065,-17.1,P);pz.rotation.y=i*.12;}
 // depósito: lona cobrindo algo e braço solto
 const tarp=mesh(new THREE.SphereGeometry(.6,12,9),0x2a3a4a,-14.6,.75,-22.8,P); tarp.scale.set(.8,1.3,.8);
 mesh(new THREE.SphereGeometry(.18,10,8),0x2a3a4a,-14.6,1.95,-22.8,P);
 limb([-12.8,.9,-23],[-12,.88,-22.9],.04,.035,mat(0x2a2a2e,{shininess:40}),P,8); limb([-12,.88,-22.9],[-11.5,.9,-23.15],.035,.03,mat(0x2a2a2e,{shininess:40}),P,8);
 // brinquedos: túnel e estrelas penduradas
 const tun=mesh(new THREE.CylinderGeometry(.45,.45,1.6,14,1,true),0x49c06a,-11.4,.45,-15.6,P); tun.rotation.z=Math.PI/2; tun.material=ps1(new THREE.MeshLambertMaterial({color:0x49c06a,side:THREE.DoubleSide,map:TXG0}));
 [[-14,-16],[-12.5,-18.5],[-11,-16.8]].forEach(([x,z])=>{limb([x,3.4,z],[x,2.6,z],.004,.004,mat(0x999999),P,3);const st=mesh(new THREE.OctahedronGeometry(.18),mat(0xf2b33d,{emissive:0x221100}),x,2.5,z,P);st.scale.z=.3;});
 // escritório: monitores CRT empilhados, caneca, papéis colados
 box(.42,.36,.38,0x2a2a26,.62,1.0,.1,P); plane(.32,.24,TX.arcade,.62,1.02,.295,0,P,true);
 mesh(new THREE.CylinderGeometry(.04,.035,.09,8),0xe8e4da,-.15,.85,.42,P);
 [[-2.2,1.1,-1.884],[-.95,2.0,-1.884],[2.2,1.0,-1.884]].forEach(([x,y,z],i)=>{const pp=plane(.2,.26,TX.paper,x,y,z,0,P);pp.rotation.z=(i-1)*.15;});
 for(let i=0;i<4;i++) limb([-.4+i*.05,.02,.2],[-1.2+i*.1,.02,1.4],.008,.008,mat(0x111111),P,4);
})();
const monitorScreen=new THREE.Mesh(new THREE.PlaneGeometry(.4,.26),ps1(new THREE.MeshBasicMaterial({color:0x2a7a32})));
monitorScreen.position.set(-.5,1.0,.185); OFF.add(monitorScreen);
const fanBlades=new THREE.Group(); fanBlades.position.set(.75,1.08,.25); OFF.add(fanBlades);
mesh(new THREE.CylinderGeometry(.03,.08,.28,6),0x333333,.75,.94,.22,OFF);
for(let i=0;i<4;i++){const b=box(.05,.2,.01,0x777777,0,.1,0);const p=new THREE.Group();p.add(b);p.rotation.z=i*Math.PI/2;fanBlades.add(p);}
const noseMesh=mesh(new THREE.SphereGeometry(.035,8,6),0x111111,-1.65,1.45,-1.86,OFF);
function makeShutter(s){const gr=new THREE.Group();slab(-.03,.03,-1.15,1.15,-.7,.7,0x5a5f68,gr);for(let y=-1;y<1.1;y+=.25)slab(-.035,.035,y,y+.03,-.7,.7,0x3b3f46,gr);slab(-.04,.04,-1.15,-1.0,-.7,.7,0xd9a52e,gr);gr.position.set(s*2.5,3.5,.3);OFF.add(gr);return gr;}
const doorL=makeShutter(-1), doorR=makeShutter(1);
noseMesh.userData.keep=true; monitorScreen.userData.keep=true; mergeGroupMeshes(OFF);

/* ---------- luzes ---------- */
function PL(c,i,d,x,y,z){i*=.72;const l=new THREE.PointLight(c,i,d,1.5);l.position.set(x,y,z);scene.add(l);l.userData.base=i;return l;}
const lamp=PL(0xffc890,1.55,6.5,0,2.7,.3);
const LIGHTS={
 corr:PL(0x8fa8ff,.7,6,0,2.4,-12.5),
 hallW:PL(0xa8b4ff,.75,6,-3.8,2.6,-8), hallE:PL(0xa8b4ff,.75,6,3.8,2.6,-8),
 dining:PL(0xffcf9a,1.15,16,0,3.7,-19),
 kitchen:PL(0xc8ffd0,.95,10,13,3,-21),
 storage:PL(0xffaa60,.8,8,-13,2.7,-25),
 play:PL(0xd080ff,.9,9,-13,3.1,-17)
};
Object.values(LIGHTS).forEach(l=>{l.userData.base*=.45;l.intensity=l.userData.base;});
const camLight=new THREE.PointLight(0xd8ffd0,0,15,1.1); scene.add(camLight);
const clownLight=new THREE.PointLight(0xff4a3a,0,5,1.3); scene.add(clownLight);
const redL=PL(0xff2020,.9,4,-3.8,2.4,1.2), redR=PL(0xff2020,.9,4,3.8,2.4,1.2);
function SL(c,x,y,z,tx,ty,tz){const s=new THREE.SpotLight(c,1.7,18,.38,.5,1);s.position.set(x,y,z);s.target.position.set(tx,ty,tz);scene.add(s);scene.add(s.target);s.userData.base=1.7;return s;}
const stageA=SL(0xff3cc8,-5,3.8,-16.5,-1.5,.6,-25.8), stageB=SL(0x40d0ff,5,3.8,-16.5,1.5,.6,-25.8);
const spot=new THREE.SpotLight(0xfff1c8,0,15,.3,.5,1.1); spot.position.set(0,1.25,1.0); scene.add(spot); scene.add(spot.target);
const jsLight={intensity:0,position:new THREE.Vector3()};
function buildingLights(on,t){
 Object.values(LIGHTS).forEach(l=>l.intensity=on?l.userData.base:0);
 stageA.intensity=stageB.intensity=on?1.7:0;
 if(on){
  if(Math.random()<.04) LIGHTS.corr.intensity=.05;
  if(Math.random()<.05) LIGHTS.storage.intensity=.1;
  if(Math.random()<.02) LIGHTS.hallW.intensity=.1;
  if(Math.random()<.02) LIGHTS.hallE.intensity=.1;
  if(Math.random()<.01) LIGHTS.play.intensity=.1;
  stageA.intensity=.6+Math.sin(t*1.3)*.15; stageB.intensity=.6+Math.cos(t*1.1)*.15;
 }
}

/* ---------- câmeras de segurança ---------- */
const ROOMS={};
Object.keys(CAMDEF).forEach(k=>{
 const d=CAMDEF[k], cam=mkCam(68);
 cam.position.set(d.pos[0],d.pos[1],d.pos[2]); cam.lookAt(d.look[0],d.look[1],d.look[2]);
 ROOMS[k]={cam,base:cam.quaternion.clone(),slots:d.slots.map(s=>new THREE.Vector3(s[0],s[1],s[2])),scale:d.scale||1};
});
menuCam.position.set(.6,1.6,-19); menuCam.lookAt(0,2.0,-26); const menuBase=menuCam.quaternion.clone();

/* ---------- pós-processamento PS1: baixa resolução + dithering + cores limitadas ---------- */
const rt=new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat});
const postMat=new THREE.ShaderMaterial({
 uniforms:{tDiffuse:{value:rt.texture},res:{value:new THREE.Vector2(4,4)},time:{value:0},cctv:{value:0},grain:{value:0},flash:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
 fragmentShader:[
  'uniform sampler2D tDiffuse;uniform vec2 res;uniform float time;uniform float cctv;uniform float grain;uniform float flash;varying vec2 vUv;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
  'float m2(vec2 q){return 2.0*abs(q.x-q.y)+q.y;}',
  'float bayer(vec2 p){p=mod(floor(p),4.0);return (4.0*m2(mod(p,2.0))+m2(floor(p/2.0)))/16.0;}',
  'void main(){',
  ' vec2 uv=vUv;',
  ' if(cctv>0.5){float line=floor(uv.y*res.y);uv.x+=(h(vec2(line,floor(time*24.0)))-0.5)*0.004;}',
  ' vec3 c=texture2D(tDiffuse,uv).rgb;',
  ' vec2 px=floor(uv*res);',
  ' if(cctv>0.5){float l=dot(c,vec3(0.3,0.59,0.11));c=mix(c,vec3(l*0.7,l*1.15,l*0.75)*1.4,0.8);c*=0.8+0.2*step(0.5,fract(px.y*0.5));}',
  ' float n=h(px+fract(time*7.0)*vec2(37.0,91.0));',
  ' c+=(n-0.5)*min(grain,0.5);',
  ' c=mix(c,vec3(n),clamp(grain-0.5,0.0,1.0));',
  ' c+=flash*vec3(0.6,0.0,0.05);',
  ' vec2 d=vUv-0.5;c*=1.0-dot(d,d)*(cctv>0.5?1.7:1.0);',
  ' c=floor(c*24.0+bayer(px))/24.0;',
  ' gl_FragColor=vec4(c,1.0);',
  '}'].join('\n'),
 depthTest:false,depthWrite:false
});
const postScene=new THREE.Scene(), postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat); postQuad.frustumCulled=false; postScene.add(postQuad);
function renderTo(sc,cam){renderer.setRenderTarget(rt);if(sc)renderer.render(sc,cam);else renderer.clear();}
function presentPS1(){renderer.setRenderTarget(null);renderer.render(postScene,postCam);}
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{TEXT_TEX.forEach(([t,d,w,h])=>{const x=t.userData.ctx;x.clearRect(0,0,w,h);d(x,w,h);t.needsUpdate=true;});});

/* ---------- ANIMATRONICS (low poly) ---------- */
const PAL3={bob:{m:0xc8252c,l:0xf08a8e,d:0x7d1015,eye:0xfffbe6},bibi:{m:0x3b6fd6,l:0x9cbcf3,d:0x1d3d85,eye:0xfffbe6},dewy:{m:0x7a3cc0,l:0xbf98e8,d:0x431d70,eye:0xfffbe6},titi:{m:0xe97db4,l:0xfbd0e4,d:0xa6437a,eye:0xfffbe6},boba:{m:0xf08a24,l:0xffd08f,d:0xa4500b,eye:0xfffbe6},clown:{m:0xf3efe6,l:0xffffff,d:0x5b2a86,eye:0xff2244},golden:{m:0xc9a227,l:0xe8cf7a,d:0x7a5e10,eye:0x000000,hollow:true},spare:{m:0x6e6e74,l:0x8e8e94,d:0x3a3a40,eye:0x000000,hollow:true},shadow:{m:0x060608,l:0x0a0a0c,d:0x030304,eye:0xffffff,darkWhites:true}};
function makeBot(type){
 const P=PAL3[type], grp=new THREE.Group();
 const M=mat(P.m),L=mat(P.l),D=mat(P.d),white=mat(type==='shadow'?0x111111:0xf1ede2),blk=mat(0x111111);
 const clown=type==='clown', dog=type==='bob'||type==='golden'||type==='spare', cat=type==='dewy'||type==='shadow';
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
  const p=new THREE.Mesh(new THREE.SphereGeometry(.036,6,4),ps1(new THREE.MeshBasicMaterial({color:P.eye,fog:false}))); p.position.set(s*.12,.06,.345); head.add(p);
  if(P.hollow) p.visible=false; p.userData.keep=true; pupils.push(p);
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
 const shd=new THREE.Mesh(new THREE.CircleGeometry(.42,10),SHADOW_MAT); shd.rotation.x=-Math.PI/2; shd.position.y=.012; grp.add(shd);
 grp.userData={head,jaw,armL,armR,pupils,type,base:clown?1.08:(type==='boba'?.92:1),tw:0,twY:0,ph:Math.random()*6};
 grp.scale.setScalar(grp.userData.base);
 mergeGroupMeshes(grp);
 return grp;
}
/* ---------- ANIMATRÔNICOS (menos low poly, sombreamento suave estilo PS1) ---------- */
const TXG=ctex(64,64,x=>{for(let i=0;i<64;i++)for(let j=0;j<64;j++){const v=Math.round(190+rnd()*65);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(i,j,1,1);}grime(x,64,64,220,.5);for(let i=0;i<6;i++){x.fillStyle='rgba(60,30,10,.25)';x.beginPath();x.arc(rnd()*64,rnd()*64,2+rnd()*5,0,7);x.fill();}},{rep:true});
const bmC={};
function bm(c,shiny){const k=c+(shiny?'s':'');if(!bmC[k])bmC[k]=ps1(shiny?new THREE.MeshPhongMaterial({color:c,shininess:40,specular:0x444444}):new THREE.MeshLambertMaterial({color:c,map:TXG}));return bmC[k];}
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const DESIGN={
 xinglau:{fur:0xd4a021,fur2:0xd4a021,jersey:0xd9a624,stripe:0x1a1410,feet:'duck',featC:0xe0601a,hair:0xe6d49a,eye:0xd9a050,num:'09',lid:.35},
 fernanda:{fur:0xc8185a,fur2:0xf0d2d2,jersey:0xc8185a,stripe:0x1a1014,feet:'talon',legC:0xd8701c,featC:0xe08a1c,hair:0xe04a2a,head:0xf0d8d8,eye:0xff5aa0,num:'21',lid:.4},
 bruna:{fur:0xe0601c,fur2:0xf0e0d0,jersey:0xe0601c,stripe:0x1a1210,feet:'paw',hair:0xe0601c,eye:0xffa040,num:'13',lid:.1},
 toco:{fur:0x3a78c8,fur2:0xe8e0d0,jersey:0x3a78c8,stripe:0x101420,feet:'paw',hair:0x3a78c8,eye:0x9ad0ff,num:'07',lid:.05},
 sandega:{fur:0x2f8a3c,fur2:0x2f8a3c,jersey:0x2f8a3c,stripe:0x0e1a10,feet:'paw',hair:0x1e9a8a,head:0x5f9a3a,beak:0xb0a060,eye:0x60e0b0,shell:0x4a6a2a,num:'01',lid:.15},
 zig:{fur:0xb08860,fur2:0xb08860,jersey:0xc8203a,stripe:0x1a0e10,feet:'paw',hair:0xc01a4a,eye:0xff3040,num:'66',lid:.3}
};
function emblemTex(type){
 const D=DESIGN[type];
 return ctex(128,128,x=>{
  x.fillStyle=hex(D.jersey);x.fillRect(0,0,128,128);
  x.save();x.translate(64,64);x.rotate(Math.PI/4);x.fillStyle='#0e0b0a';x.fillRect(-42,-42,84,84);x.strokeStyle='#efe6cf';x.lineWidth=3;x.strokeRect(-37,-37,74,74);x.restore();
  if(type==='xinglau'){x.save();x.translate(64,66);x.strokeStyle='#efe6cf';x.lineWidth=14;x.beginPath();x.moveTo(-32,-34);x.lineTo(32,34);x.moveTo(32,-34);x.lineTo(-32,34);x.stroke();x.strokeStyle='#111';x.lineWidth=9;x.stroke();x.restore();}
  drawFace(x,type,64,68,21,{});
  grime(x,128,128,260,.35);
 },{text:true});
}
function numberTex(n,c){return ctex(64,64,x=>{x.fillStyle=hex(c);x.fillRect(0,0,64,64);x.fillStyle='#120e0c';x.font='44px VT323, monospace';x.textAlign='center';x.fillText(n,32,48);grime(x,64,64,120,.35);},{text:true});}
const _Yv=new THREE.Vector3(0,1,0);
function limb(a,b,r1,r2,m,parent,seg){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),L=d.length();const o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,L,seg||8),m);o.position.copy(A).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o;}
function lathe(pts,seg,m,x,y,z,parent){const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg||14);const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);parent.add(o);return o;}
/* junta as malhas de cada grupo por material: muito menos chamadas de desenho (performance) */
function mergeGroupMeshes(root){
 const nodes=[]; root.traverse(n=>{if(!n.isMesh)nodes.push(n);});
 nodes.forEach(node=>{
  const kids=node.children.filter(c=>c.isMesh&&!c.userData.keep&&!c.children.length&&c.material&&!c.material.transparent);
  const byMat=new Map();
  kids.forEach(m=>{if(!byMat.has(m.material))byMat.set(m.material,[]);byMat.get(m.material).push(m);});
  byMat.forEach((list,mt)=>{
   if(list.length<2) return;
   let vc=0;
   const geos=list.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);vc+=g.attributes.position.count;return g;});
   const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),uv=new Float32Array(vc*2); let o=0;
   geos.forEach(g=>{const n=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=n;g.dispose();});
   const mg=new THREE.BufferGeometry();
   mg.setAttribute('position',new THREE.BufferAttribute(pos,3));mg.setAttribute('normal',new THREE.BufferAttribute(nor,3));mg.setAttribute('uv',new THREE.BufferAttribute(uv,2));mg.computeBoundingSphere();
   list.forEach(m=>node.remove(m)); node.add(new THREE.Mesh(mg,mt));
  });
 });
}
/* perfil de membro com "músculo" (y crescente, pendurado para baixo a partir do pivô) */
function limbProf(len,r1,rm,r2){return [[0,-len],[r2*.55,-len],[r2,-len*.93],[r2*1.05,-len*.8],[rm,-len*.45],[r1*1.02,-len*.12],[r1*.75,-len*.02],[0,0]];}
function makeBot2(type){
 const D=DESIGN[type], G=new THREE.Group();
 const J=bm(0x1a1616,true), JER=bm(D.jersey), F=bm(D.fur), F2=bm(D.fur2), STR=bm(D.stripe), CL=bm(0x241a16,true), TEETH=bm(0xe8e2cc,true), DARK=bm(0x2a0808), GUM=bm(0x6a1420);
 const add=(geo,m,x,y,z,p)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);p.add(o);return o;};
 const C=(rt,rb,h,m,x,y,z,p,s)=>add(new THREE.CylinderGeometry(rt,rb,h,s||14),m,x,y,z,p);
 const S=(r,m,x,y,z,p,a,b)=>add(new THREE.SphereGeometry(r,a||16,b||12),m,x,y,z,p);
 const K=(r,h,m,x,y,z,p,s)=>add(new THREE.ConeGeometry(r,h,s||8),m,x,y,z,p);
 const LA=(pts,m,x,y,z,p,s)=>add(new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(q[0],q[1])),s||16),m,x,y,z,p);
 const tw=type==='bruna'?.86:(type==='sandega'?1.14:1);
 /* tufos de pelo serrilhados (como nas bordas dos designs) */
 const fringe=(par,y,r,n,len,m,down,sc)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(i%2)*.15;const c=add(new THREE.ConeGeometry(.045*(sc||1),len*(.8+(i%3)*.15),4),m,Math.sin(a)*r,y,Math.cos(a)*r,par);c.scale.z=.45;c.rotation.set((down?Math.PI:0)-Math.cos(a)*.35*(down?1:-1),a,0);}};
 const tuft=(par,x,y,z,r,h,m,rx,rz)=>{const c=add(new THREE.ConeGeometry(r,h,5),m,x,y,z,par);c.scale.z=.5;c.rotation.set(rx||0,0,rz||0);return c;};
 /* ---- quadril e tronco ---- */
 const hips=new THREE.Group(); hips.position.y=1.0; G.add(hips);
 const pel=LA([[0,-.14],[.2*tw,-.14],[.25*tw,-.07],[.275*tw,.04],[.25*tw,.12],[.18*tw,.15],[0,.15]],JER,0,0,0,hips); pel.scale.z=.8;
 const torso=new THREE.Group(); torso.position.y=.18; hips.add(torso);
 const waist=LA([[0,-.04],[.15*tw,-.04],[.13*tw,.05],[.15*tw,.13],[0,.13]],type==='bruna'?F2:J,0,0,0,torso); waist.scale.z=.85;
 if(type!=='bruna') for(let i=0;i<3;i++) C(.012,.012,.16,DARK,(i-1)*.06,.05,.1*tw,torso,5);
 const tor=LA([[0,0],[.25*tw,0],[.29*tw,.05],[.34*tw,.17],[.37*tw,.3],[.37*tw,.4],[.34*tw,.49],[.26*tw,.55],[.16*tw,.58],[0,.58]],JER,0,.06,0,torso,20); tor.scale.z=.74;
 const col=new THREE.Mesh(new THREE.TorusGeometry(.165,.035,8,18),STR); col.rotation.x=Math.PI/2; col.position.y=.62; torso.add(col);
 const em=plane(.25,.25,emblemTex(type),0,.35,.274*tw,0,torso); em.material=ps1(new THREE.MeshLambertMaterial({map:em.material.map}));
 const nb=plane(.2,.2,numberTex(D.num,D.jersey),0,.36,-.276*tw,Math.PI,torso); nb.material=ps1(new THREE.MeshLambertMaterial({map:nb.material.map}));
 [-1,1].forEach(s=>{const sp=S(.16*tw,JER,s*.32*tw,.48,0,torso);sp.scale.set(1.05,.72,.92);});
 /* ---- pernas ---- */
 const mkLeg=s=>{
  const hip=new THREE.Group(); hip.position.set(s*.15*tw,0,0); hips.add(hip);
  S(.085,J,0,0,0,hip);
  const th=LA(limbProf(.4,.13*tw,.14*tw,.1*tw),type==='bruna'?F2:F,0,-.02,0,hip); th.scale.z=.92;
  if(type==='bruna') fringe(hip,-.32,.1*tw,9,.2,F2,true);
  if(type==='fernanda') fringe(hip,-.28,.11,8,.22,F2,true);
  const knee=new THREE.Group(); knee.position.y=-.42; hip.add(knee);
  S(.072,J,0,0,0,knee); C(.035,.035,.12,J,0,-.06,0,knee,8);
  const sh=LA(limbProf(.36,.1*tw,.11*tw,.08*tw),type==='fernanda'?bm(D.legC):F,0,-.02,0,knee); sh.scale.z=.92;
  if(type==='zig'||type==='toco'||type==='bruna') fringe(knee,-.04,.1*tw,10,.2,type==='zig'?bm(D.hair):(type==='toco'?F:F2),true);
  if(type==='toco'){const pt=S(.08,F2,0,-.24,.05,knee);pt.scale.set(1,1.6,.6);}
  S(.055,J,0,-.39,0,knee);
  const ft=new THREE.Group(); ft.position.y=-.5; knee.add(ft);
  if(D.feet==='duck'){const fm=bm(D.featC);const pad=S(.13,fm,0,-.005,.1,ft);pad.scale.set(1.1,.3,1.6);[-.085,0,.085].forEach(dx=>{const t=S(.05,fm,dx,-.015,.28,ft);t.scale.set(1.15,.4,1.7);});const ank=S(.08,fm,0,.05,0,ft);ank.scale.set(1,.7,1);}
  else if(D.feet==='talon'){const fm=bm(D.legC);const pad=S(.1,fm,0,0,.04,ft);pad.scale.set(1.1,.55,1.3);[-.065,0,.065].forEach(dx=>{limb([dx,0,.08],[dx*1.4,-.02,.2],.032,.024,fm,ft,8);S(.025,fm,dx*1.4,-.02,.2,ft,8,6);const c=K(.022,.11,CL,dx*1.45,-.035,.26,ft,6);c.rotation.x=Math.PI/2+.35;});const bc=K(.022,.1,CL,0,-.02,-.09,ft,6);bc.rotation.x=-Math.PI/2;}
  else {const pad=S(.125,type==='toco'?F2:F,0,-.005,.07,ft);pad.scale.set(1.05,.5,1.4);[-.07,0,.07].forEach(dx=>{const toe=S(.045,type==='toco'?F2:F,dx,-.015,.21,ft,10,8);toe.scale.set(1,.85,1.25);const c=K(.024,.09,CL,dx,-.03,.27,ft,6);c.rotation.x=Math.PI/2;});}
  return {hip,knee};
 };
 const LL=mkLeg(-1), LR=mkLeg(1);
 /* ---- braços e mãos ---- */
 const wings=[];
 const mkArm=s=>{
  const sh=new THREE.Group(); sh.position.set(s*.45*tw,.5,0); torso.add(sh);
  S(.088,J,0,0,0,sh);
  LA([[0,-.29],[.112*tw,-.29],[.118*tw,-.24],[.124*tw,-.12],[.13*tw,-.04],[.11*tw,0],[0,0]],JER,0,0,0,sh);
  [-.2,-.245].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.122*tw,.012,4,14),STR);r.rotation.x=Math.PI/2;r.position.y=y;sh.add(r);});
  const pt=add(new THREE.CylinderGeometry(.045,.045,.01,10),STR,s*.122*tw,-.1,0,sh); pt.rotation.z=Math.PI/2;
  const el=new THREE.Group(); el.position.y=-.33; sh.add(el);
  S(.066,J,0,0,0,el); C(.032,.032,.1,J,0,-.05,0,el,8);
  const al=type==='zig'?.38:.3;
  LA(limbProf(al,.09*tw,.105*tw,.08*tw),type==='toco'?F2:F,0,-.03,0,el);
  if(type==='bruna'||type==='zig') fringe(el,-.03,.09,9,.18,type==='zig'?bm(D.hair):F2,true);
  if(type==='toco') fringe(el,-.03,.09,8,.14,F,true,.8);
  const wr=new THREE.Group(); wr.position.y=-.06-al; wr.scale.setScalar(1.15); el.add(wr);
  S(.05,J,0,0,0,wr);
  const HM=type==='toco'?F2:F;
  const palm=S(.08,HM,0,-.09,0,wr); palm.scale.set(1.1,1.15,.62);
  [-1,0,1].forEach(k=>{
   const fx=k*.042;
   S(.028,HM,fx,-.17,.01,wr,10,8);
   C(.026,.024,.07,HM,fx,-.205,.012,wr,8);
   S(.025,HM,fx,-.24,.015,wr,10,8);
   C(.024,.02,.06,HM,fx,-.27,.02,wr,8);
   const cl=K(.02,.08,type==='xinglau'?HM:CL,fx,-.33,.025,wr,6); cl.rotation.x=Math.PI;
  });
  const thb=C(.024,.02,.09,HM,s*-.07,-.12,.04,wr,8); thb.rotation.z=s*.7;
  if(type==='fernanda'){const wg=new THREE.Group();sh.add(wg);wings.push(wg);for(let i=0;i<8;i++){const f=add(new THREE.ConeGeometry(.07,.46,5),i%2?F2:F,s*.12,-.14-i*.075,-.05,wg);f.scale.z=.28;f.rotation.z=s*(.48+i*.07)+Math.PI;}}
  return {sh,el};
 };
 const AL=mkArm(-1), AR=mkArm(1);
 /* ---- pescoço e cabeça ---- */
 const neck=new THREE.Group(); neck.position.y=.66; torso.add(neck);
 C(.05,.06,.14,J,0,.05,0,neck); [-1,1].forEach(s=>C(.012,.012,.15,DARK,s*.05,.05,.03,neck,5));
 const head=new THREE.Group(); head.position.set(0,.13,0); neck.add(head);
 const pupils=[], lids=[];
 const eye=(x,y,z,r,iris,sock,lidC)=>{
  const so=S(r*1.5,bm(sock||0x0c0a0a),x,y,z-.035,head); so.scale.set(1,.92,.42);
  S(r,bm(0xefeadf,true),x,y,z,head);
  const p=new THREE.Mesh(new THREE.SphereGeometry(r*.42,12,10),ps1(new THREE.MeshBasicMaterial({color:iris,fog:false})));p.position.set(x,y,z+r*.62);p.userData.keep=true;head.add(p);pupils.push(p);
  S(r*.18,bm(0x050505,true),x,y,z+r*.98,head,8,6);
  const lid=add(new THREE.SphereGeometry(r*1.16,16,8,0,Math.PI*2,0,Math.PI/2),bm(lidC),x,y,z,head); lid.rotation.x=D.lid; lid.userData.keep=true; lids.push(lid);
 };
 const brows=(y,z,sp,ang,m)=>[-1,1].forEach(s=>{const b=S(.06,m||STR,s*sp,y,z,head,10,6);b.scale.set(1.25,.28,.4);b.rotation.z=s*ang;});
 const jaw=new THREE.Group(); head.add(jaw);
 const teeth=(n,w,y,z,down,par,big)=>{for(let i=0;i<n;i++){const t=K(big?.02:.015,big?.065:.045,TEETH,-w/2+w*i/(n-1),y,z-Math.abs(i-(n-1)/2)*.012,par,6);if(down)t.rotation.x=Math.PI;}};
 let tail=null;
 if(type==='xinglau'){
  const hd=S(.27,F,0,0,0,head,18,14); hd.scale.set(1,1.06,.98);
  [-1,1].forEach(s=>{const ck=S(.12,F,s*.15,-.08,.12,head);ck.scale.set(1,.8,.8);});
  eye(-.1,.06,.21,.066,D.eye,0x0c0a0a,D.fur); eye(.1,.06,.21,.066,D.eye,0x0c0a0a,D.fur); brows(.165,.25,.1,.38);
  const ub=S(.17,bm(D.featC),0,-.07,.25,head,18,12); ub.scale.set(1.05,.3,1);
  const ubt=S(.05,bm(D.featC),0,-.04,.15,head); ubt.scale.set(1.6,.6,1.4);
  const mo=S(.1,DARK,0,-.12,.22,head); mo.scale.set(1.15,.5,.95);
  teeth(8,.22,-.115,.36,true,head);
  jaw.position.set(0,-.11,.12); const lb=S(.16,bm(D.featC),0,-.04,.14,jaw,18,12); lb.scale.set(1.02,.24,.95); const tg=S(.06,GUM,0,-.02,.12,jaw); tg.scale.set(1.3,.4,1.3); teeth(8,.21,0,.26,false,jaw);
  for(let i=0;i<11;i++) tuft(head,-.11+i*.024,.31,.05-i*.012,.04,.34-(i%3)*.04,bm(D.hair),-.45,.6-i*.11);
 } else if(type==='fernanda'){
  const hd=S(.26,bm(D.head),0,0,0,head,18,14); hd.scale.set(1,1.1,1);
  for(let i=0;i<14;i++) tuft(head,-.17+i*.026,.2,-.07,.055,.4-(i%3)*.05,bm(i%2?D.hair:0xff7a3a),-.8-(i%3)*.15,(i-6.5)*.1);
  [-1,1].forEach(s=>{for(let i=0;i<4;i++) tuft(head,s*(.2+i*.015),-.04-i*.055,-.01,.05,.24,i%2?F:F2,0,s*(1.2+i*.18));});
  eye(-.1,.07,.2,.06,D.eye,0x3a0a1a,D.head); eye(.1,.07,.2,.06,D.eye,0x3a0a1a,D.head); brows(.165,.23,.1,.45,bm(0x2a0a12));
  const ub=S(.1,bm(D.featC),0,-.03,.25,head); ub.scale.set(.85,.62,1.25);
  const hk=K(.05,.17,bm(D.featC),0,-.07,.37,head,10); hk.rotation.x=Math.PI/2+.65;
  const mo=S(.08,DARK,0,-.11,.22,head); mo.scale.set(1,.8,1); teeth(6,.13,-.09,.31,true,head);
  jaw.position.set(0,-.12,.13); const lb=S(.08,bm(D.featC),0,-.02,.1,jaw); lb.scale.set(.9,.32,1.35); const tg=S(.04,GUM,0,0,.09,jaw); tg.scale.set(1.2,.4,1.4); teeth(6,.11,.01,.17,false,jaw);
 } else if(type==='bruna'){
  const hd=S(.25,F,0,0,0,head,18,14); hd.scale.set(1.05,1,.97);
  const mz=LA([[0,0],[.12,.02],[.105,.1],[.065,.17],[.025,.21],[0,.22]],F2,0,-.08,.18,head); mz.rotation.x=Math.PI/2;
  S(.034,bm(0x111111,true),0,-.07,.4,head,10,8);
  [-1,1].forEach(s=>{const e=K(.11,.33,F,s*.15,.29,-.02,head,10);e.rotation.z=-s*.25;e.scale.z=.55;const ei=K(.07,.23,bm(0xd88a9a),s*.15,.27,.025,head,10);ei.rotation.z=-s*.25;ei.scale.z=.35;
   for(let i=0;i<4;i++) tuft(head,s*(.21+i*.012),.0-i*.055,.05,.05,.22,F2,0,s*(1.2+i*.15));});
  [-.13,-.07,-.01,.06,.11].forEach((x,i)=>tuft(head,x,.08,.235,.028,.28,F,Math.PI,(i-2)*.14));
  eye(-.095,.05,.2,.07,D.eye,0x2a1008,D.fur); eye(.095,.05,.2,.07,D.eye,0x2a1008,D.fur);
  [-1,1].forEach(s=>{for(let i=0;i<3;i++){const l=K(.008,.06,bm(0x111111),s*(.13+i*.025),.135+i*.012,.23,head,4);l.rotation.z=-s*(.6+i*.35);}});
  const mo=S(.08,DARK,0,-.15,.21,head); mo.scale.set(1.1,.7,1); teeth(8,.15,-.115,.32,true,head,true);
  jaw.position.set(0,-.15,.14); const lj=S(.08,F2,0,-.02,.08,jaw); lj.scale.set(1.05,.33,1.25); const tg=S(.045,GUM,0,0,.07,jaw); tg.scale.set(1.3,.4,1.3); teeth(8,.13,.01,.15,false,jaw,true);
  tail=new THREE.Group(); tail.position.set(0,.02,-.2); hips.add(tail);
  [[0,0,-.1,.15,F],[0,-.1,-.29,.2,F],[0,-.27,-.46,.22,F],[0,-.44,-.58,.18,F2],[0,-.56,-.64,.1,F2]].forEach(([x,y,z,r,m])=>{const t=S(r,m,x,y,z,tail,14,10);t.scale.set(1,1,1.35);});
  for(let i=0;i<10;i++){const a=i*1.3;tuft(tail,Math.sin(a)*.14,-.3+Math.cos(a)*.12,-.42,.06,.2,i%3?F:F2,Math.PI*.6,Math.sin(a)*.8);}
 } else if(type==='toco'){
  S(.27,F,0,0,0,head,18,14);
  const fp=S(.2,F2,0,-.05,.11,head); fp.scale.set(1.05,.85,.75);
  const mz=S(.14,F2,0,-.08,.2,head); mz.scale.set(1,.75,1.1);
  const ns=S(.045,bm(0x111111,true),0,-.02,.36,head,12,10); ns.scale.set(1.35,1,1);
  [-1,1].forEach(s=>{const e=S(.12,F,s*.26,-.03,-.02,head);e.scale.set(.42,1.45,.95);e.rotation.z=s*.5;const ei=S(.09,F2,s*.25,-.04,.015,head);ei.scale.set(.28,1.25,.75);ei.rotation.z=s*.5;});
  for(let i=0;i<10;i++) tuft(head,-.13+i*.028,.27,.03-(i%2)*.07,.045,.22,F,0,.55-i*.12);
  eye(-.1,.06,.21,.066,D.eye,0x0c0e18,D.fur); eye(.1,.06,.21,.066,D.eye,0x0c0e18,D.fur); brows(.165,.25,.1,-.15);
  const mo=S(.08,DARK,0,-.16,.22,head); mo.scale.set(1.2,.65,1); teeth(8,.17,-.155,.33,true,head,true);
  jaw.position.set(0,-.17,.15); const lj=S(.09,F2,0,-.02,.08,jaw); lj.scale.set(1.12,.33,1.12); const tg=S(.05,GUM,0,0,.07,jaw); tg.scale.set(1.3,.4,1.25); teeth(8,.15,.01,.16,false,jaw,true);
  tail=new THREE.Group(); tail.position.set(0,.02,-.22); hips.add(tail);
  const tl=K(.065,.3,F,0,.13,-.05,tail,10); tl.rotation.x=-.5; fringe(tail,.2,.04,6,.1,F2,false,.6);
 } else if(type==='sandega'){
  C(.08,.09,.14,bm(D.beak),0,.02,0,neck);
  const hd=S(.24,bm(D.head),0,0,0,head,18,14); hd.scale.set(1,.95,1.1);
  const bk=LA([[0,0],[.12,.02],[.105,.09],[.05,.15],[0,.17]],bm(D.beak),0,-.06,.16,head,14); bk.rotation.x=Math.PI/2;
  const mo=S(.08,DARK,0,-.12,.2,head); mo.scale.set(1.15,.6,1);
  jaw.position.set(0,-.12,.12); const lj=S(.09,bm(D.beak),0,-.02,.08,jaw); lj.scale.set(1.05,.28,1.25); const tg=S(.045,GUM,0,0,.07,jaw); tg.scale.set(1.3,.4,1.3); teeth(6,.11,.0,.15,false,jaw);
  for(let i=0;i<14;i++) tuft(head,-.15+i*.023,.24,-.06+(i%2)*.08,.055,.28-(i%3)*.04,bm(D.hair),-.25,.75-i*.11);
  eye(-.09,.07,.185,.074,D.eye,0x0a0a08,D.head); eye(.09,.07,.185,.074,D.eye,0x0a0a08,D.head);
  const shellG=new THREE.Group(); shellG.position.set(0,.3,-.13); torso.add(shellG);
  const sh=S(.44,bm(D.shell),0,0,0,shellG,22,16); sh.scale.set(1.05,1.15,.62);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,8,24),bm(0x3a5520)); rim.scale.set(1.05,1.15,1); rim.position.z=.04; shellG.add(rim);
  [[-.16,.16],[.16,.16],[0,-.08],[-.22,-.18],[.22,-.18],[0,.34],[0,.12]].forEach(([x,y])=>{const p=add(new THREE.CylinderGeometry(.11,.12,.035,6),bm(0x3a5520),x,y,-.265,shellG);p.rotation.x=Math.PI/2;});
  [0,1,2].forEach(i=>{const p=S(.16-i*.015,bm(D.beak),0,.13-i*.08,.23-i*.02,torso);p.scale.set(1,.24,.32);});
 } else if(type==='zig'){
  S(.26,bm(D.hair),0,0,0,head,18,14);
  const fc=S(.21,F,0,-.02,.13,head); fc.scale.set(1,1.05,.6);
  const mz=S(.12,F,0,-.11,.22,head); mz.scale.set(1.05,.7,.95);
  [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.TorusGeometry(.08,.03,8,16),F);e.position.set(s*.28,.03,0);e.rotation.y=Math.PI/2;head.add(e);const ei=C(.07,.07,.02,bm(0x6a4a30),s*.28,.03,0,head,14);ei.rotation.z=Math.PI/2;});
  for(let i=0;i<22;i++) tuft(head,Math.sin(i*1.7)*.16,.22+(i%3)*.03,-.08+Math.cos(i*1.3)*.11,.055,.28,bm(D.hair),-.3+Math.cos(i)*.35,Math.sin(i*2.1)*.85);
  eye(-.085,.05,.24,.056,D.eye,0x1a0806,D.fur); eye(.085,.05,.24,.056,D.eye,0x1a0806,D.fur); brows(.135,.29,.085,.45,bm(0x3a1a10));
  const mo=S(.08,DARK,0,-.15,.25,head); mo.scale.set(1.15,.7,1); teeth(8,.16,-.16,.34,true,head,true);
  jaw.position.set(0,-.18,.18); const lj=S(.085,F,0,-.02,.08,jaw); lj.scale.set(1.08,.33,1.12); const tg=S(.045,GUM,0,0,.07,jaw); tg.scale.set(1.3,.4,1.3); teeth(8,.14,.01,.14,false,jaw,true);
  tail=new THREE.Group(); tail.position.set(0,.02,-.22); hips.add(tail);
  const pts=[[0,0,0],[0,.2,-.22],[0,.5,-.32],[0,.78,-.22],[0,.86,-.02],[0,.74,.1]];
  for(let i=0;i<pts.length-1;i++){limb(pts[i],pts[i+1],.055,.05,bm(D.hair),tail,10);S(.053,bm(D.hair),pts[i+1][0],pts[i+1][1],pts[i+1][2],tail,10,8);}
 }
 if(type==='fernanda'){for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const f=add(new THREE.ConeGeometry(.075,.36,5),i%2?F2:F,Math.sin(a)*.25,-.12,Math.cos(a)*.2,hips);f.scale.z=.35;f.rotation.set(Math.PI-Math.cos(a)*.35,0,Math.sin(a)*.35);}}
 const shd=new THREE.Mesh(new THREE.CircleGeometry(.45,14),SHADOW_MAT); shd.rotation.x=-Math.PI/2; shd.position.y=.012; G.add(shd);
 const jaw0={xinglau:.32,fernanda:.4,bruna:.38,toco:.32,sandega:.28,zig:.34}[type];
 jaw.rotation.x=jaw0;
 head.scale.setScalar(1.1);
 mergeGroupMeshes(G);
 G.userData={rig:2,hips,torso,head,neck,jaw,armL:AL.sh,armR:AR.sh,elbowL:AL.el,elbowR:AR.el,legL:LL.hip,legR:LR.hip,kneeL:LL.knee,kneeR:LR.knee,tail,wings,lids,lid0:D.lid,pupils,type,
  base:type==='sandega'?1.04:1,tw:0,twY:0,twX:0,ph:Math.random()*6,jaw0,wph:0,walk:false,sit:false,pose:'idle',blinkT:2+Math.random()*4,blink:0,glitch:0,clack:0,stepT:0};
 G.scale.setScalar(G.userData.base);
 return G;
}

/* ---------- SR. GARGALHADA (baseado na ficha) ---------- */
const TX_HARL=ctex(128,128,x=>{
 x.fillStyle='#d6c6a2';x.fillRect(0,0,128,128);
 x.fillStyle='#1a1c26';
 for(let c=0;c<4;c++){const cx=c*32+16;for(let r=0;r<2;r++){const cy=r*64+(c%2)*32;x.beginPath();x.moveTo(cx,cy-30);x.lineTo(cx+9,cy);x.lineTo(cx,cy+30);x.lineTo(cx-9,cy);x.closePath();x.fill();}}
 for(let i=0;i<900;i++){x.fillStyle=`rgba(${70+Math.floor(rnd()*40)},${40+Math.floor(rnd()*30)},20,${(rnd()*.22).toFixed(2)})`;x.fillRect(Math.floor(rnd()*128),Math.floor(rnd()*128),1+Math.floor(rnd()*3),1+Math.floor(rnd()*3));}
 for(let i=0;i<5;i++){const g2=x.createRadialGradient(rnd()*128,rnd()*128,1,rnd()*128,rnd()*128,12+rnd()*20);g2.addColorStop(0,'rgba(90,50,30,.3)');g2.addColorStop(1,'rgba(90,50,30,0)');x.fillStyle=g2;x.fillRect(0,0,128,128);}
},{rep:true});
const TX_RUFF=ctex(32,32,x=>{for(let i=0;i<32;i++){const v=i%4<2;x.fillStyle=v?'#c9b49a':'#9e8268';x.fillRect(i,0,1,32);}x.fillStyle='rgba(120,30,30,.35)';x.fillRect(0,0,32,10);grime(x,32,32,60,.4);},{rep:true});
function makeClown(){
 const G=new THREE.Group();
 const SUIT=ps1(new THREE.MeshLambertMaterial({map:TX_HARL})), RUFF=ps1(new THREE.MeshLambertMaterial({map:TX_RUFF}));
 const CREAM=bm(0xd2c19c), BLK=bm(0x16171e), GLOVE=bm(0x121216,true), SHOE=bm(0x1a1b22,true), FACE=bm(0xe6e2da), BLUE=bm(0x2a5cae), NOSE=bm(0x1c2848,true), LIP=bm(0xa8141a,true), HAT=bm(0x6c7c94), HORN=bm(0x2c3c5e), J=bm(0x1a1616,true), TEETH=bm(0xd8d0bc,true), DARK=bm(0x1a0606);
 const add=(geo,m,x,y,z,p)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);p.add(o);return o;};
 const S=(r,m,x,y,z,p,a,b)=>add(new THREE.SphereGeometry(r,a||16,b||12),m,x,y,z,p);
 const LA=(pts,m,x,y,z,p,s)=>add(new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(q[0],q[1])),s||18),m,x,y,z,p);
 const frill=(par,y,r,n,len,m,down,tilt)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const c=add(new THREE.ConeGeometry(.055,len,4),m,Math.sin(a)*r,y,Math.cos(a)*r,par);c.scale.z=.35;c.rotation.set((down?Math.PI:0)-Math.cos(a)*(tilt||.5)*(down?1:-1),a,0);}};
 /* quadril e calças largas */
 const hips=new THREE.Group(); hips.position.y=1.0; G.add(hips);
 LA([[0,-.16],[.26,-.16],[.32,-.06],[.34,.06],[.3,.16],[0,.16]],SUIT,0,0,0,hips).scale.z=.85;
 const torso=new THREE.Group(); torso.position.y=.18; hips.add(torso);
 const tor=LA([[0,-.04],[.36,-.04],[.41,.03],[.37,.12],[.33,.26],[.35,.4],[.34,.5],[.24,.58],[.12,.62],[0,.62]],SUIT,0,0,0,torso,20); tor.scale.z=.8;
 frill(torso,.02,.37,18,.2,CREAM,true,.6);
 [.48,.35,.22,.09].forEach(y=>{const b=S(.05,BLK,0,y,.31,torso,10,8);b.scale.z=.7;});
 /* gola de babado plissado */
 const collar=new THREE.Group(); collar.position.y=.6; torso.add(collar);
 for(let i=0;i<26;i++){const a=i/26*Math.PI*2;const p=add(new THREE.BoxGeometry(.075,.05,.24),i%2?RUFF:CREAM,Math.sin(a)*.2,0,Math.cos(a)*.2,collar);p.rotation.y=a;p.rotation.x=.25;}
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2+.15;const p=add(new THREE.BoxGeometry(.07,.04,.16),RUFF,Math.sin(a)*.17,.05,Math.cos(a)*.17,collar);p.rotation.y=a;p.rotation.x=.45;}
 /* pernas */
 const mkLeg=s=>{
  const hip=new THREE.Group(); hip.position.set(s*.17,0,0); hips.add(hip);
  S(.09,J,0,0,0,hip);
  LA([[0,-.44],[.15,-.44],[.17,-.36],[.19,-.2],[.17,-.05],[.13,0],[0,0]],SUIT,0,-.02,0,hip);
  const knee=new THREE.Group(); knee.position.y=-.42; hip.add(knee);
  LA([[0,-.38],[.17,-.38],[.2,-.32],[.17,-.2],[.15,-.06],[.13,0],[0,0]],SUIT,0,-.02,0,knee);
  frill(knee,-.36,.17,14,.13,CREAM,true,.7);
  const ft=new THREE.Group(); ft.position.y=-.5; knee.add(ft);
  const sh=S(.14,SHOE,0,.02,.1,ft,16,10); sh.scale.set(1.15,.62,1.9);
  const toe=S(.12,SHOE,0,.03,.3,ft,14,10); toe.scale.set(1.15,.75,1);
  return {hip,knee};
 };
 const LL=mkLeg(-1), LR=mkLeg(1);
 /* braços com mangas bufantes e luvas pretas */
 const mkArm=s=>{
  const sh=new THREE.Group(); sh.position.set(s*.44,.5,0); torso.add(sh);
  const pf=S(.15,SUIT,0,-.04,0,sh); pf.scale.set(1,1,.95);
  LA([[0,-.32],[.13,-.32],[.15,-.26],[.15,-.12],[.13,0],[0,0]],SUIT,0,0,0,sh);
  const el=new THREE.Group(); el.position.y=-.33; sh.add(el);
  LA([[0,-.34],[.17,-.34],[.18,-.28],[.15,-.14],[.13,-.02],[0,-.02]],SUIT,0,0,0,el);
  frill(el,-.32,.16,14,.14,CREAM,true,.7);
  const wr=new THREE.Group(); wr.position.y=-.38; el.add(wr);
  const palm=S(.085,GLOVE,0,-.07,0,wr); palm.scale.set(1.15,1.2,.7);
  [-1,0,1].forEach(k=>{const f=add(new THREE.CylinderGeometry(.03,.028,.13,10),GLOVE,k*.045,-.19,.015,wr);S(.029,GLOVE,k*.045,-.255,.015,wr,10,8);});
  const thb=add(new THREE.CylinderGeometry(.028,.026,.09,10),GLOVE,s*-.075,-.1,.035,wr); thb.rotation.z=s*.7;
  return {sh,el};
 };
 const AL=mkArm(-1), AR=mkArm(1);
 /* cabeça */
 const neck=new THREE.Group(); neck.position.y=.68; torso.add(neck);
 add(new THREE.CylinderGeometry(.06,.07,.12,12),J,0,.04,0,neck);
 const head=new THREE.Group(); head.position.set(0,.16,0); neck.add(head);
 const hd=S(.25,FACE,0,0,0,head,20,16); hd.scale.set(.95,1.12,.98);
 const back=S(.24,HAT,0,.1,-.04,head,16,10); back.scale.set(.98,.75,.95);
 const pupils=[], lids=[];
 [-1,1].forEach(s=>{
  const dm=add(new THREE.OctahedronGeometry(.09,1),BLUE,s*.1,.05,.2,head); dm.scale.set(.7,1.9,.35); dm.rotation.z=s*-.12;
  const so=S(.065,bm(0x050404),s*.1,.05,.215,head,12,10); so.scale.set(1.1,.85,.5);
  const big=s<0;
  const p=new THREE.Mesh(new THREE.SphereGeometry(big?.026:.012,10,8),ps1(new THREE.MeshBasicMaterial({color:big?0xff3a2a:0x3a0808,fog:false})));p.position.set(s*.1,.045,.245);p.userData.keep=true;head.add(p);pupils.push(p);
  if(big){const halo=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),ps1(new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})));halo.position.copy(p.position);head.add(halo);}
  const lid=add(new THREE.SphereGeometry(.07,14,7,0,Math.PI*2,0,Math.PI/2),FACE,s*.1,.05,.2,head);lid.rotation.x=.45;lid.userData.keep=true;lids.push(lid);
  const br=S(.05,bm(0x1a2a50),s*.1,.13,.215,head,10,6); br.scale.set(1.4,.3,.4); br.rotation.z=s*.45;
  const ck=S(.04,bm(0xb05060),s*.15,-.07,.2,head,10,8); ck.scale.set(1.2,.8,.4);
 });
 const ns=S(.055,NOSE,0,-.01,.27,head,14,10); ns.scale.set(1,.9,1.1);
 S(.07,DARK,0,-.14,.2,head).scale.set(1.3,.6,.9);
 const ul=new THREE.Mesh(new THREE.TorusGeometry(.085,.022,8,18,Math.PI),LIP); ul.position.set(0,-.11,.21); ul.rotation.set(-.2,0,Math.PI); ul.scale.set(1.15,.5,1); head.add(ul);
 for(let i=0;i<7;i++){const t=add(new THREE.ConeGeometry(.014,.04,5),TEETH,-.06+i*.02,-.125,.235-Math.abs(i-3)*.006,head);t.rotation.x=Math.PI;}
 const jaw=new THREE.Group(); jaw.position.set(0,-.15,.12); head.add(jaw);
 const lj=S(.09,FACE,0,-.03,.06,jaw); lj.scale.set(1.05,.45,.95);
 const ll=new THREE.Mesh(new THREE.TorusGeometry(.08,.022,8,18,Math.PI),LIP); ll.position.set(0,-.005,.1); ll.rotation.set(.3,0,0); ll.scale.set(1.15,.45,1); jaw.add(ll);
 for(let i=0;i<7;i++) add(new THREE.ConeGeometry(.013,.035,5),TEETH,-.055+i*.018,.01,.11-Math.abs(i-3)*.006,jaw);
 /* chapéu cônico e chifres curvos */
 const hat=add(new THREE.ConeGeometry(.09,.34,14),HAT,0,.4,-.02,head); hat.rotation.z=-.06;
 add(new THREE.CylinderGeometry(.1,.11,.05,14),bm(0x8a96a8),0,.25,-.02,head);
 [-1,1].forEach(s=>{
  const pts=[[s*.2,.14,0],[s*.33,.2,0],[s*.46,.17,-.02],[s*.53,.06,-.03],[s*.52,-.08,-.03],[s*.45,-.17,-.02],[s*.38,-.19,0]];
  for(let i=0;i<pts.length-1;i++){limb(pts[i],pts[i+1],.042-i*.003,.039-i*.003,HORN,head,10);S(.04-i*.003,HORN,pts[i+1][0],pts[i+1][1],pts[i+1][2],head,10,8);}
  S(.055,HAT,s*.21,.14,0,head,12,10);
 });
 const shd=new THREE.Mesh(new THREE.CircleGeometry(.5,14),SHADOW_MAT); shd.rotation.x=-Math.PI/2; shd.position.y=.012; G.add(shd);
 jaw.rotation.x=.18;
 mergeGroupMeshes(G);
 G.userData={rig:2,hips,torso,head,neck,jaw,armL:AL.sh,armR:AR.sh,elbowL:AL.el,elbowR:AR.el,legL:LL.hip,legR:LR.hip,kneeL:LL.knee,kneeR:LR.knee,tail:null,wings:[],lids,lid0:.45,pupils,type:'clown',
  base:1.1,tw:0,twY:0,twX:0,ph:Math.random()*6,jaw0:.18,wph:0,walk:false,sit:false,pose:'idle',blinkT:3,blink:0,glitch:0,clack:0,stepT:0};
 G.scale.setScalar(1.1);
 return G;
}

function makeAny(id){if(id==='clown'||id==='clown2')return makeClown();return DESIGN[id]?makeBot2(id):makeBot(id);}
const bots={};
[...ALL,'clown','clown2','golden','shadow'].forEach(id=>{bots[id]=makeAny(id);bots[id].visible=false;scene.add(bots[id]);});
(function(){const sp=makeBot('spare');sp.position.set(-15.45,-.42,-24.6);sp.rotation.y=Math.PI/2;sp.userData.head.rotation.z=.5;sp.userData.head.rotation.x=.35;sp.userData.armL.rotation.z=.3;sp.userData.armR.rotation.z=-.3;scene.add(sp);})();
/* cadeira giratória do Zig */
const stool=new THREE.Group(); stool.position.set(12.9,0,-20.8); scene.add(stool);
mesh(new THREE.CylinderGeometry(.3,.36,.05,10),0x333338,0,.025,0,stool);
mesh(new THREE.CylinderGeometry(.05,.05,.52,6),0x888890,0,.29,0,stool);
const stoolTop=new THREE.Group(); stoolTop.position.y=.56; stool.add(stoolTop);
mesh(new THREE.CylinderGeometry(.34,.32,.08,10),0xc8203a,0,0,0,stoolTop);
[0,1,2,3].forEach(i=>{const s=box(.66,.085,.06,0xf2f0ea,0,0,0,stoolTop);s.rotation.y=i*Math.PI/4;});
const PATHS={};
Object.keys(RAW_PATHS).forEach(id=>{PATHS[id]=RAW_PATHS[id].map(a=>{const o=a[3]||{};return {p:new THREE.Vector3(a[0],a[1],a[2]),w:!!o.w,cam:o.c||0,s:o.s||1};});});

/* ---------- GALLERY ---------- */
const gScene=new THREE.Scene(); gScene.background=new THREE.Color(0x070506);
gScene.add(new THREE.AmbientLight(0x403040,.8));
const gSpot=new THREE.SpotLight(0xffe0b0,2.2,14,.5,.6,1); gSpot.position.set(1.5,4.5,3); gScene.add(gSpot); gSpot.target.position.set(0,1,0); gScene.add(gSpot.target);
const gRim=new THREE.PointLight(0xff3040,1,6); gRim.position.set(-2,2.2,-2); gScene.add(gRim);
mesh(new THREE.CylinderGeometry(1,1.05,.12,10),0x2a1f18,0,.06,0,gScene);
const gCam=mkCam(42); gCam.position.set(0,1.4,4.6);
const gBots={}; let gSel='sandega', gRot=0, gDrag=null;

/* ================= UI / SCREENS ================= */
let mode='splash';
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));}
const MUSIC_MODES=['menu','extras','intro','custom'];
function setMode(m,screen){
 if(m!=='intro') stopIntro();
 if(m!=='game') clearToast();
 mode=m; show(screen||m);
 if(MUSIC_MODES.includes(m)) sloop('menu',.55); else sunloop('menu',.6);
 if(!['game','jumpscare','extras'].includes(m)){amb.intensity=.3;layoutMenu();}
 if(m==='menu') buildMenu();
}
function buildMenu(){
 $('#bCont').classList.toggle('hidden',save.night<=1);
 $('#contSub').textContent='Voltar para a Noite '+save.night;
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
function putBot(id,x,y,z,s,lx,lz){const b=bots[id];b.visible=true;b.position.set(x,y,z);b.scale.setScalar((s||1)*b.userData.base);b.lookAt(lx,y,lz);b.rotation.x=0;b.userData.walk=false;b.userData.sit=false;b.userData.pose='idle';}
function layoutMenu(){
 hideBots();
 const c=menuCam.position;
 [['xinglau',-3,-25.8],['bruna',-1,-26.3],['toco',1,-26.3],['sandega',3,-25.8],['fernanda',5,-25],['zig',-5,-25]].forEach(([id,x,z],i)=>{putBot(id,x,.6,z,1,c.x,c.z);bots[id].userData.pose='perform';bots[id].userData.ph=i*.7;});
 if(save.n6) putBot('clown',0,.6,-27.4,1,c.x,c.z);
 if(Math.random()<.1) putBot('golden',-6.8,0,-22.6,1,c.x,c.z);
}
let IT={ring:null,auto:null,type:null,clock:null,nodes:[],idx:0,answered:false,secs:0};
function stopIntro(){clearInterval(IT.ring);clearTimeout(IT.auto);clearInterval(IT.type);clearInterval(IT.clock);IT.ring=IT.auto=IT.type=IT.clock=null;$('#phone').classList.remove('ringing','talking');}
function openIntro(n){
 curNight=n; audio(); stopIntro();
 $('#introNight').textContent='NOITE '+n;
 $('#introSub').textContent=n===6?'Batalha final':(n===7?'Personalizada':'12:00 AM');
 const box=$('#introCall'); box.innerHTML=CALLS[n];
 const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT); IT.nodes=[]; let nd;
 while((nd=w.nextNode())){IT.nodes.push([nd,nd.textContent]);nd.textContent='';}
 IT.idx=0; IT.answered=false; IT.secs=0;
 $('#phName').textContent=n===7?'GERÊNCIA':'VALDIR';
 $('#phStatus').textContent='chamando...'; $('#phTime').textContent='';
 $('#phone').classList.add('ringing'); $('#bAnswer').classList.remove('hidden'); $('#bStart').classList.add('hidden'); $('#callBox').classList.add('waiting');
 setMode('intro');
 sfx.ring(); IT.ring=setInterval(()=>sfx.ring(),1500);
 IT.auto=setTimeout(answerCall,4500);
}
function answerCall(){
 if(IT.answered||mode!=='intro') return; IT.answered=true;
 clearInterval(IT.ring); clearTimeout(IT.auto);
 tone(880,.08,'square',.06); $('#phone').classList.remove('ringing'); $('#phone').classList.add('talking');
 $('#bAnswer').classList.add('hidden'); $('#callBox').classList.remove('waiting'); $('#phStatus').textContent='em chamada';
 IT.clock=setInterval(()=>{IT.secs++;$('#phTime').textContent='00:'+String(IT.secs).padStart(2,'0');},1000);
 let n=0;
 IT.type=setInterval(()=>{
  for(let k=0;k<2;k++){
   while(IT.idx<IT.nodes.length&&IT.nodes[IT.idx][0].textContent.length>=IT.nodes[IT.idx][1].length) IT.idx++;
   if(IT.idx>=IT.nodes.length){finishCall();return;}
   const [node,full]=IT.nodes[IT.idx]; node.textContent=full.slice(0,node.textContent.length+1);
  }
  if((n++)%2===0) sfx.blip();
  const b=$('#introCall'); b.scrollTop=b.scrollHeight;
 },32);
}
function finishCall(){
 clearInterval(IT.type); IT.type=null; IT.nodes.forEach(([nd,f])=>nd.textContent=f); IT.idx=IT.nodes.length;
 $('#bStart').classList.remove('hidden');
 setTimeout(()=>{if(mode==='intro'&&IT.answered){$('#phStatus').textContent='chamada encerrada';clearInterval(IT.clock);$('#phone').classList.remove('talking');}},600);
}
function buildExtras(){
 const L=$('#exList'); L.innerHTML='';
 const list=[...ALL,'clown','golden'];
 list.forEach(id=>{
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
 if(!gBots[gSel]){gBots[gSel]=makeAny(gSel);gBots[gSel].position.y=.12;gScene.add(gBots[gSel]);}
 const gb=gBots[gSel]; gb.visible=true;
 gb.traverse(o=>{if(o.isMesh&&o.material&&o.material!==SHADOW_MAT){if(locked){if(!o.userData.orig){o.userData.orig=o.material;}o.material=mat(0x000000);}else if(o.userData.orig){o.material=o.userData.orig;}}});
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
$('#bAnswer').onclick=answerCall; $('#bSkip').onclick=()=>startNight(curNight);
$('#callBox').onclick=e=>{if(e.target.closest('button'))return;if(!IT.answered)answerCall();else if(IT.type)finishCall();};
$('#camLightBtn').onclick=e=>{toggleCamLight();e.currentTarget.blur();};
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
 ALL.forEach(id=>{
  const row=document.createElement('div'); row.className='row';
  row.innerHTML=`<b style="color:${CHARS[id].color}">${CHARS[id].name}</b><button aria-label="Diminuir">−</button><span>${save.custom[id]}</span><button aria-label="Aumentar">+</button>`;
  const [m,p]=row.querySelectorAll('button'), sp=row.querySelector('span');
  m.onclick=()=>{save.custom[id]=Math.max(0,save.custom[id]-1);sp.textContent=save.custom[id];};
  p.onclick=()=>{save.custom[id]=Math.min(20,save.custom[id]+1);sp.textContent=save.custom[id];};
  R.appendChild(row);
 });
 const P=$('#presets'); P.innerHTML='';
 [['Todos 0',0],['Todos 10',10],['Todos 20',20]].forEach(([l,v])=>{const b=document.createElement('button');b.className='chip'+(v===20?' boss':'');b.textContent=l;b.onclick=()=>{ALL.forEach(id=>save.custom[id]=v);buildCustom();};P.appendChild(b);});
}
const MAPLAYOUT=[6,1,0,3,2,8,4,7,5,-1,'you',-1];
(function(){const m=$('#map');MAPLAYOUT.forEach(v=>{const b=document.createElement('button');if(v===-1||v===0){b.className='mapb empty';b.tabIndex=-1;}else if(v==='you'){b.className='mapb you';b.innerHTML='<b>VOCÊ</b>sala';b.tabIndex=-1;}else{b.className='mapb';b.dataset.cam=v;b.innerHTML=`<b>CAM ${v}</b>${CAMS[v].split(' ')[0]}`;b.onclick=()=>setCam(v);}m.appendChild(b);});})();

/* ================= GAME ================= */
let g=null;
const holds=new Set();
const has=a=>holds.has(a+':k')||holds.has(a+':p');
let yaw=0,yawT=0,pitch=-.04,edgeV=0;
const keysLook={left:false,right:false};
function newMover(path,level){return {path,i:0,from:0,to:0,prog:0,len:0,state:'idle',timer:MOVE_INT*(1+Math.random()),level,yaw:0,approach:false,time:0,hold:0};}
function startNight(n){
 audio(); stopSix(); curNight=n;
 const lv=n===7?save.custom:(n===6?null:LEVELS[n]);
 g={night:n,boss:n===6,t:0,power:100,doors:{l:false,r:false},doorY:{l:3.5,r:3.5},heat:{l:0,r:0},jam:{l:0,r:0},cams:false,cam:1,flash:null,mask:false,powerOut:false,outTimer:0,mbT:0,over:false,chars:{},bossS:null,staticBurst:0,toastT:0,rare:null,flick:0,lastApproach:-99,crankT:0,spin:0,camLight:false,shake:0};
 WALKERS.forEach(id=>{g.chars[id]=newMover(PATHS[id],lv?lv[id]:0);});
 const zl=lv?lv.zig:0;
 g.zig=Object.assign(newMover(PATHS.zig,zl),{on:zl>0,meter:100,drain:n===7?zl*.09:zl*.092,warned:false});
 if(g.boss) g.bossS={hp:BOSS_HP,atks:[],cd:4.5,last:null,phase:1,hb:0};
 if(!g.boss&&Math.random()<.35){const types=['golden','shadow','poster'];g.rare={type:types[Math.floor(Math.random()*3)],at:60+Math.random()*360,active:false,done:false,t:0,look:0,cam:[1,2,4,5,6,8][Math.floor(Math.random()*6)],seen:false};}
 drawPoster(TEX.poster.userData.ctx,false); TEX.poster.needsUpdate=true;
 holds.clear(); yaw=yawT=0;
 doorL.position.y=doorR.position.y=3.5;
 lamp.intensity=1.1; amb.intensity=.3; redL.intensity=redR.intensity=.9; monitorScreen.material.color.setHex(0x2a7a32);
 $('#bossBar').classList.toggle('hidden',!g.boss);
 $('#shockBtn').classList.toggle('hidden',!g.boss);
 $('#camsUI').classList.add('hidden');
 $('#nightLbl').textContent='Noite '+n;
 $('#danger').style.opacity=0; $('#itsme').classList.remove('on');
 setMode('game');
 sloop('fan',.32);
 if(g.boss) toast('Ele está acordando...');
}
function endNightAudio(){sunloop('fan',.3);sunloop('breath',.2);}
function usage(){return 1+(g.doors.l?1:0)+(g.doors.r?1:0)+(g.cams?1:0)+(g.flash?1:0)+(g.zig.cranking?1:0)+(g.cams&&g.camLight?1:0);}

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
   if(g.doors[s]){g.heat[s]+=dt*(g.bossS&&g.bossS.phase===3?1.3:1);if(g.heat[s]>=5){g.doors[s]=false;g.jam[s]=3;g.heat[s]=0;sfx.jam();play('doorOpen',{dur:1,vol:.7});toast('A porta '+(s==='l'?'esquerda':'direita')+' superaqueceu!');}}
   else g.heat[s]=Math.max(0,g.heat[s]-dt*1.5);
  });
 }
 if(!g.powerOut){
  g.power-=usage()*.065*(1+.05*(Math.min(g.night,5)-1))*(g.night===7?1.1:1)*(g.boss?.9:1)*dt;
  if(g.power<=0){g.power=0;powerOutStart();}
 } else {
  g.outTimer-=dt; g.mbT-=dt;
  if(g.mbT<=0){sfx.musicBox();g.mbT=5.6;}
  if(g.outTimer<=0){jumpscare(g.boss?'clown':'toco');return;}
 }
 if(!g.boss&&g.t>=HOUR_LEN*6){winNight();return;}
 if(g.staticBurst>0) g.staticBurst-=dt;
 updateRare(dt);
 if(g.over) return;
 if(g.boss){updateBoss(dt);return;}
 updateWalkers(dt); if(g.over) return;
 stepSounds(dt);
 updateZig(dt);
}
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
/* ---- movimento pelos caminhos ---- */
function startWalk(c,dir){c.from=c.i;c.to=c.i+dir;c.prog=0;c.len=Math.max(.01,c.path[c.from].p.distanceTo(c.path[c.to].p));}
function stopAt(c){c.from=c.to=c.i;c.prog=0;c.len=0;}
function activeThreats(){return WALKERS.filter(k=>{const c=g.chars[k];return c.state==='atk'||(c.state==='walk'&&c.approach);});}
function canApproach(id){
 const a=activeThreats();
 if(a.length>=2) return false;
 if(GROUP3.includes(id)&&a.filter(k=>GROUP3.includes(k)).length>=2) return false;
 if(g.t-g.lastApproach<4) return false;
 return true;
}
function updateWalkers(dt){
 const hb=Math.floor(g.t/HOUR_LEN/2);
 for(const id of WALKERS){
  const c=g.chars[id], D=CHARS[id], P=c.path, last=P.length-1;
  if(c.state==='idle'){
   c.timer-=dt; if(c.timer>0) continue;
   c.timer=MOVE_INT*(.8+Math.random()*.4);
   const lvl=c.level>0?c.level+hb:0;
   if(!(lvl>0&&Math.random()*20<lvl)) continue;
   let ns=c.i+1; while(ns<last&&P[ns].w) ns++;
   const final=ns===last;
   if(final&&!canApproach(id)){c.timer=3+Math.random()*2;continue;}
   if(g.cams&&P[c.i].cam===g.cam) g.staticBurst=.45;
   c.approach=final; if(final){g.lastApproach=g.t;approachSfx(id);}
   c.state='walk'; startWalk(c,1);
  } else if(c.state==='walk'||c.state==='back'){
   c.prog+=D.speed*(c.state==='back'?1.6:1)*dt;
   while(c.prog>=c.len){
    c.prog-=c.len; c.i=c.to;
    if(c.state==='walk'){
     if(c.i===last){
      const others=WALKERS.filter(k=>k!==id&&g.chars[k].state==='atk').length;
      c.state='atk'; c.time=(ATK[g.night]||8)+(others>0?3:0); c.hold=0; c.approach=false; stopAt(c); arriveSfx(id); break;
     }
     if(P[c.i].w){if(id==='fernanda'&&P[c.i].s<1&&P[c.i-1].s>=1)play('vent',{pan:-.45,vol:.5,dur:2.5});startWalk(c,1);continue;}
     c.state='idle'; stopAt(c); break;
    } else {
     if(c.i<=D.back&&!P[c.i].w){c.state='idle';c.timer=COOLDOWN*(.8+Math.random()*.4);stopAt(c);break;}
     startWalk(c,-1);
    }
   }
  } else if(c.state==='atk'){
   if(isDefended(D.def)){c.hold+=dt;if(c.hold>=D.need){retreatSfx(id);c.state='back';startWalk(c,-1);}}
   else {c.time-=dt;if(c.time<=0){jumpscare(id);return;}}
  }
 }
}
function approachSfx(id){
 if(id==='sandega') play('stepsSide',{pan:.9,vol:.9,rate:.8,dur:5});
 else if(id==='xinglau') play('stepsSide',{pan:-.9,vol:1,dur:4.5});
 else if(id==='bruna') play('stepsSide',{pan:0,vol:.7,rate:1.05,dur:4});
 else if(id==='toco') play('stepsSide',{pan:.1,vol:.75,rate:.9,dur:4.5});
 else if(id==='fernanda') play('vent',{pan:-.45,vol:.95,dur:4});
}
function arriveSfx(id){
 const p=PAN[CHARS[id].spot];
 if(id==='toco'){sfx.growl();g.flick=1.2;}
 else if(id==='xinglau'){sfx.thud(p);sfx.quack(p);}
 else if(id==='sandega'){sfx.thud(p);sfx.thud(p,.25);}
 else if(id==='bruna'){sfx.hiss(0);}
 else if(id==='fernanda'){sfx.screech(p);tone(180,.3,'square',.08,p,0,90);}
}
/* passos de verdade enquanto eles andam perto do escritório */
const _sp=new THREE.Vector3();
function stepSounds(dt){
 const list=WALKERS.map(id=>[id,g.chars[id]]).concat([['zig',g.zig]]);
 list.forEach(([id,c])=>{
  if(!(c.state==='walk'||c.state==='back'||c.state==='run')||!c.len) return;
  c.stepT=(c.stepT||0)-dt; if(c.stepT>0) return;
  const sp=id==='zig'?(c.state==='run'?3.2:2.2):CHARS[id].speed*(c.state==='back'?1.6:1);
  c.stepT=.62/Math.max(.5,sp);
  const a=c.path[c.from].p,b=c.path[c.to].p; _sp.lerpVectors(a,b,Math.min(1,c.prog/c.len));
  const d=Math.hypot(_sp.x,_sp.z-.5); if(d>15) return;
  const v=.5*(1-d/15)*(1-d/15), pan=Math.max(-1,Math.min(1,_sp.x/4));
  if(c.path[c.from].s<1||c.path[c.to].s<1){tone(110+Math.random()*60,.06,'square',v*.5,pan);noise(.05,v*.6,900,'bandpass',pan);}
  else {noise(.09,v,id==='sandega'?110:170,'lowpass',pan);tone(id==='sandega'?55:75,.08,'sine',v*.6,pan);if(Math.random()<.3)tone(900+Math.random()*400,.03,'square',v*.08,pan);}
 });
}
function retreatSfx(id){
 const d=CHARS[id].def, p=PAN[CHARS[id].spot];
 if(d==='doorL'||d==='doorR') sfx.bang(p);
 else if(d==='hall'||d==='vent') sfx.screech(p);
 else sfx.retreat();
}
/* ---- Zig ---- */
function updateZig(dt){
 const z=g.zig; z.cranking=false; if(!z.on) return;
 if(z.state==='idle'){
  const crank=g.cams&&g.cam===3&&has('crank');
  z.cranking=crank;
  if(crank){z.meter=Math.min(100,z.meter+30*dt);g.crankT-=dt;if(g.crankT<=0){g.crankT=.14;tone(900,.04,'square',.05,.3);}}
  else z.meter-=z.drain*dt;
  if(z.meter<25&&!z.warned){z.warned=true;toast('O ZIG está ficando inquieto... (CAM 3)');}
  if(z.meter>40) z.warned=false;
  if(z.meter<=0){z.meter=0;z.state='run';startWalk(z,1);sfx.alarm();toast('O ZIG fugiu da cozinha!');if(g.cams&&g.cam===3)g.staticBurst=.6;play('stepsSide',{pan:.9,vol:1,rate:1.4,dur:4});}
 } else if(z.state==='run'||z.state==='back'){
  const last=z.path.length-1;
  z.prog+=(z.state==='run'?3.2:2.2)*dt;
  while(z.prog>=z.len){
   z.prog-=z.len; z.i=z.to;
   if(z.state==='run'){if(z.i===last){z.state='atk';z.time=4.5;z.hold=0;stopAt(z);break;}startWalk(z,1);}
   else {if(z.i===0){z.state='idle';z.meter=60;stopAt(z);break;}startWalk(z,-1);}
  }
 } else if(z.state==='atk'){
  if(g.doors.r){z.hold+=dt;if(z.hold>=.8){sfx.bang(.9);z.state='back';startWalk(z,-1);}}
  else {z.time-=dt;if(z.time<=0){jumpscare('zig');return;}}
 }
}
/* ---- chefe: 3 fases, ataques duplos na fase 2 e 3 ---- */
const BOSS_COMBOS=[['doorL','doorR'],['doorL','hall'],['doorR','vent'],['doorL','mask'],['doorR','mask'],['hall','doorR'],['vent','doorL'],['cam','doorL'],['cam','doorR']];
function bossPhase(b){const f=b.hp/BOSS_HP;return f>.66?1:(f>.33?2:3);}
function bossTime(t,ph,combo){const base=t==='cam'?[0,8,7,6.2][ph]:[0,4.6,3.9,3.3][ph];return base+(combo?1.6:0);}
function spawnBoss(types){
 const b=g.bossS, ph=b.phase, combo=types.length>1;
 types.forEach((t,i)=>{
  const time=bossTime(t,ph,combo);
  b.atks.push({type:t,time,max:time,hold:0,age:0,cam:t==='cam'?1+Math.floor(Math.random()*8):0});
  play('laugh',{pan:PAN[t],dur:1.8,vol:.9,rate:ph===3?1.25:(ph===2?1.1:1),offset:i*.4});
  if(t==='cam'){toast('Ele sumiu nas câmeras! Ache e dê o choque');if(g.cams)g.staticBurst=.5;}
  if(t==='mask') g.flick=1.5;
 });
 b.last=types[0]; g.shake=.3;
 if(combo) toast('Ele está em dois lugares!');
}
function newBossAtk(){
 const b=g.bossS, ph=b.phase;
 if(ph>=2&&Math.random()<(ph===2?.4:.65)){spawnBoss(BOSS_COMBOS[Math.floor(Math.random()*BOSS_COMBOS.length)]);return;}
 const types=['doorL','doorR','hall','vent','mask','cam'];
 let t; do{t=types[Math.floor(Math.random()*types.length)];}while(t===b.last&&Math.random()<.85);
 spawnBoss([t]);
}
function updateBoss(dt){
 const b=g.bossS, ph=bossPhase(b);
 if(ph!==b.phase){b.phase=ph;toast(ph===2?'FASE 2: ele começou a se dividir!':'FASE 3: FÚRIA TOTAL!');g.flick=1.6;g.shake=.8;play('laugh',{dur:2.5,vol:1,rate:.8});}
 b.hb-=dt; if(b.hb<=0){b.hb=[0,.95,.7,.48][ph];sfx.thud(0);if(ph===3)sfx.thud(0,.12);}
 if(!b.atks.length){b.cd-=dt;if(b.cd<=0)newBossAtk();$('#danger').style.opacity=0;return;}
 if(ph>=2&&b.atks.length===1&&b.atks[0].age>1.2&&Math.random()<dt*(ph===3?.3:.1)){
  const cur=b.atks[0].type, opts=BOSS_COMBOS.filter(c=>c.includes(cur)).map(c=>c[0]===cur?c[1]:c[0]);
  if(opts.length){const t=opts[Math.floor(Math.random()*opts.length)];const time=bossTime(t,ph,true);b.atks.push({type:t,time,max:time,hold:0,age:0,cam:t==='cam'?1+Math.floor(Math.random()*8):0});play('laugh',{pan:PAN[t],dur:1.6,vol:.9,rate:1.2});g.shake=.25;if(t==='cam')toast('Ele sumiu nas câmeras! Ache e dê o choque');}
 }
 let danger=0;
 for(const a of b.atks.slice()){
  a.age+=dt;
  if(a.type!=='cam'&&isDefended(a.type)){a.hold+=dt;if(a.hold>=(ph===3?.8:1)){bossHit(a,10);if(g.over)return;continue;}}
  else {a.time-=dt;if(a.time<=0){jumpscare('clown');return;}}
  danger=Math.max(danger,1-a.time/a.max);
 }
 $('#danger').style.opacity=Math.max(0,Math.min(.9,danger+(ph===3?Math.sin(g.t*8)*.08+.1:0))).toFixed(2);
}
function bossHit(a,dmg){
 const b=g.bossS; b.hp=Math.max(0,b.hp-dmg); sfx.hit(); g.shake=.2;
 b.atks=b.atks.filter(x=>x!==a);
 if(b.hp<=0){winBoss();return;}
 if(!b.atks.length){const ph=bossPhase(b);b.cd=[0,1.6,1,.5][ph]+Math.random()*[0,1.1,.8,.6][ph];$('#danger').style.opacity=0;}
}
function shock(){
 if(!g||!g.boss||!g.cams||g.over) return;
 sfx.zap(); g.staticBurst=.4; g.power=Math.max(0,g.power-1.5);
 const a=g.bossS.atks.find(x=>x.type==='cam');
 if(a){if(g.cam===a.cam)bossHit(a,15);else{a.time-=1.5;toast('Câmera errada!');}}
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
function toggleCamLight(){if(!g||!g.cams||g.powerOut)return;g.camLight=!g.camLight;tone(g.camLight?1400:900,.05,'square',.06);}
function closeCams(){if(g&&g.cams){g.cams=false;$('#camsUI').classList.add('hidden');}}
function setCam(n){if(!g||!g.cams)return;if(g.cam!==n){g.cam=n;sfx.cam();g.staticBurst=.3;}}
function powerOutStart(){
 g.powerOut=true;g.doors.l=g.doors.r=false;closeCams();g.flash=null;
 sfx.powerOut();sunloop('fan',.4);g.outTimer=8+Math.random()*8;g.mbT=2.5;toast('A energia acabou...');
}
let toastTO=null;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(toastTO);toastTO=setTimeout(()=>el.classList.remove('on'),2600);}
function clearToast(){clearTimeout(toastTO);$('#toast').classList.remove('on');}

let js=null, jsHandle=null;
function jumpscare(id){
 if(g.over) return; g.over=true; closeCams(); holds.clear();
 g.mask=false; g.flash=null; endNightAudio(); $('#itsme').classList.remove('on'); $('#danger').style.opacity=0;
 hideBots(); bots[id].visible=true; bots[id].userData.sit=false; bots[id].userData.walk=false; js={id,t:0};
 setMode('jumpscare','jsScreen');
 jsHandle=play('jumpscare',{vol:1});
 setTimeout(()=>{
  if(jsHandle){jsHandle.stop(.6);jsHandle=null;} js=null;
  $('#goWho').textContent=CHARS[id].name+' te pegou.'; $('#goTip').innerHTML='<h4>Como sobreviver</h4><ol>'+(STEPS[id]||[CHARS[id].tip]).map(x=>'<li>'+x+'</li>').join('')+'</ol>';
  setMode('over','gameover');
 },1900);
}
function winNight(){
 g.over=true; endNightAudio(); holds.clear(); $('#itsme').classList.remove('on');
 const n=g.night;
 if(n<5) save.night=Math.max(save.night,n+1);
 if(n===5){save.n6=true;save.night=Math.max(save.night,5);}
 const maxed=n===7&&ALL.every(id=>save.custom[id]>=20);
 if(maxed) save.max=true;
 persist();
 $('#winClock').textContent='5 AM'; $('#winMsg').textContent=''; $('#bNext').classList.add('hidden');
 setMode('win');
 setTimeout(()=>{
  $('#winClock').textContent='6 AM'; sixHandle=play('sixAM');
  $('#winMsg').textContent=n===5?'Você sobreviveu à semana! Mas... a Noite 6 foi desbloqueada.':(n===7?(maxed?'Todos no 20. Lenda da pizzaria.':'Noite personalizada concluída.'):'Você sobreviveu à Noite '+n+'.');
  if(n<=5){$('#bNext').textContent=n===5?'Encarar a Noite 6':'Noite '+(n+1);$('#bNext').classList.remove('hidden');}
 },1400);
}
function winBoss(){g.over=true;endNightAudio();holds.clear();save.won6=true;save.n6=true;persist();sixHandle=play('sixAM');setMode('bosswin');}

/* ================= LAYOUT / ANIMATION ================= */
const SPOT3={L:[-3.4,0,.3,1,0,.3],R:[3.4,0,.3,1,0,.3],H:[0,0,-6.2,1,0,1.25],V:[-1.8,1.52,-2.8,.55,-1.8,1.25],O:[1.4,0,-.85,1,0,1.25]};
const ATK2SPOT={doorL:'L',doorR:'R',hall:'H',vent:'V',mask:'O'};
function putSpot(id,k){const s=SPOT3[k];putBot(id,s[0],s[1],s[2],s[3],s[4],s[5]);}
const _p=new THREE.Vector3();
function lerpAng(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;}
function placeMover(id,c,dt){
 const b=bots[id], a=c.path[c.from], bb=c.path[c.to], k=c.len?Math.min(1,c.prog/c.len):0;
 _p.lerpVectors(a.p,bb.p,k); const s=a.s+(bb.s-a.s)*k;
 b.visible=true; b.position.copy(_p); b.scale.setScalar(s*b.userData.base);
 const moving=(c.state==='walk'||c.state==='back'||c.state==='run')&&c.len>0;
 let ty=c.yaw;
 if(c.state==='atk') ty=Math.atan2(0-_p.x,1.25-_p.z);
 else if(moving) ty=Math.atan2(bb.p.x-a.p.x,bb.p.z-a.p.z);
 c.yaw=lerpAng(c.yaw,ty,Math.min(1,dt*7)); b.rotation.set(0,c.yaw,0);
 b.userData.walk=moving; b.userData.wspd=c.state==='run'?2.6:(c.state==='back'?1.6:1);
 b.userData.sit=false; b.userData.pose=c.state==='atk'?'atk':'idle';
}
function layoutGame(dt){
 hideBots(); clownLight.intensity=0;
 if(g.powerOut){putSpot(g.boss?'clown':'toco','L');return;}
 WALKERS.forEach(id=>placeMover(id,g.chars[id],dt));
 const z=g.zig;
 if(z.state==='idle'){
  const b=bots.zig; b.visible=true; b.scale.setScalar(b.userData.base);
  b.position.set(12.9,.6-1.0*b.userData.base,-20.8); b.rotation.set(0,stoolTop.rotation.y,0);
  b.userData.sit=true; b.userData.walk=false; z.yaw=stoolTop.rotation.y;
 } else placeMover('zig',z,dt);
 if(g.boss){g.bossS.atks.forEach((a,i)=>{const id=i?'clown2':'clown';if(a.type==='cam'){const R=ROOMS[a.cam],p=R.slots[R.slots.length-1];putBot(id,p.x,p.y,p.z,R.scale,R.cam.position.x,R.cam.position.z);clownLight.position.set(p.x+(R.cam.position.x-p.x)*.15,p.y+2.5,p.z+(R.cam.position.z-p.z)*.15);clownLight.intensity=1.3+Math.random()*.5;}else putSpot(id,ATK2SPOT[a.type]);bots[id].userData.pose='atk';});}
 const r=g.rare;
 if(r&&r.active){
  if(r.type==='golden'){putBot('golden',0,-.5,-.6,1,0,1.25);const u=bots.golden.userData;u.head.rotation.z=.45;u.head.rotation.x=.3;}
  if(r.type==='shadow'){const R=ROOMS[r.cam],p=R.slots[1];putBot('shadow',p.x,p.y,p.z,R.scale,R.cam.position.x,R.cam.position.z);}
 }
}
function animRig(u,dt,t){
 const T=u.type;
 u.blinkT-=dt; if(u.blinkT<=0){u.blink=.12;u.blinkT=(T==='clown'?5:2.2)+Math.random()*5;if(Math.random()<.25)u.blinkT=.22;}
 let lid=u.lid0; if(u.blink>0){u.blink-=dt;lid=Math.PI/2;}
 if(u.pose==='atk') lid=Math.max(-.3,u.lid0-.4);
 u.lids.forEach(l=>l.rotation.x+=(lid-l.rotation.x)*Math.min(1,dt*30));
 if(u.glitch>0)u.glitch-=dt; else if(Math.random()<dt*(T==='zig'?.12:.05))u.glitch=.15+Math.random()*.3;
 const gl=u.glitch>0?(Math.random()-.5)*.25:0;
 const L=(o,ax,v,k)=>{o.rotation[ax]+=(v-o.rotation[ax])*Math.min(1,dt*(k||8));};
 const ph=u.ph, hp=u.hips, tr=u.torso;
 if(u.sit){
  L(u.legL,'x',-1.5);L(u.legR,'x',-1.5);L(u.kneeL,'x',1.45);L(u.kneeR,'x',1.45);
  u.armL.rotation.set(-2.5+Math.sin(t*4)*.35,0,.35);u.armR.rotation.set(-2.5-Math.sin(t*4)*.35,0,-.35);
  u.elbowL.rotation.x=-.5+Math.sin(t*4)*.3;u.elbowR.rotation.x=-.5-Math.sin(t*4)*.3;
  tr.rotation.set(-.12,0,Math.sin(t*2)*.06);hp.position.y=1.0;hp.rotation.set(0,0,0);
  u.head.rotation.set(-.15+Math.sin(t*3)*.08,Math.sin(t*1.7)*.35,Math.sin(t*2.3)*.14);
  u.jaw.rotation.x=u.jaw0+Math.abs(Math.sin(t*5))*.24;
 } else if(u.walk){
  const sp=u.wspd||1, run=sp>2;
  const st={sandega:[.75,.36],xinglau:[1.15,.5],bruna:[1.05,.5],toco:[1.1,.55],fernanda:[1.2,.45],zig:[1.25,.6],clown:[.8,.42]}[T]||[1,.5];
  u.wph+=dt*5.2*sp*st[0]; const A=run?.85:st[1], sn=Math.sin(u.wph), cs=Math.cos(u.wph);
  u.legL.rotation.x=sn*A; u.legR.rotation.x=-sn*A;
  u.kneeL.rotation.x=Math.max(0,-cs)*A*1.6+.06; u.kneeR.rotation.x=Math.max(0,cs)*A*1.6+.06;
  let armOut=T==='zig'?.35:(T==='fernanda'?.25:.1);
  u.armL.rotation.set(-sn*A*.85,0,armOut); u.armR.rotation.set(sn*A*.85,0,-armOut);
  u.elbowL.rotation.x=-.25-Math.max(0,sn)*.5; u.elbowR.rotation.x=-.25-Math.max(0,-sn)*.5;
  hp.position.y=1.0-.02+Math.abs(cs)*(T==='toco'?.07:(T==='sandega'?.02:.035));
  hp.rotation.set(0,sn*(T==='bruna'?.2:.08),T==='xinglau'?sn*.1:(T==='sandega'?sn*.06:0));
  tr.rotation.set(run?.35:(T==='zig'?.22:(T==='clown'?.12:.07)),-sn*.1,T==='xinglau'?-sn*.12:(T==='sandega'?-sn*.08:0));
  let hx=-.04+Math.abs(sn)*.05, hz=0;
  if(T==='fernanda') hx+=Math.sin(u.wph*2)*.16;
  if(T==='toco') hz=.14;
  if(T==='clown') hz=.32+Math.sin(t*.7)*.05;
  u.head.rotation.set(hx+gl,sn*.08+gl,hz+gl);
  u.jaw.rotation.x=u.jaw0+(u.glitch>0?.15:0)+(T==='zig'?Math.abs(Math.sin(t*6))*.12:0);
 } else if(u.pose==='atk'){
  L(u.legL,'x',-.22);L(u.legR,'x',.14);L(u.kneeL,'x',.4);L(u.kneeR,'x',.3);
  hp.position.y+=(.95-hp.position.y)*Math.min(1,dt*6); hp.rotation.set(0,0,0);
  const lunge=Math.max(0,Math.sin(t*1.7+ph))*.06;
  tr.rotation.set(.26+lunge+Math.sin(t*1.3)*.03,0,Math.sin(t*.9)*.05);
  if(T==='clown'){u.armL.rotation.set(-.8+Math.sin(t*1.5)*.1,0,.7);u.armR.rotation.set(-.8+Math.cos(t*1.4)*.1,0,-.7);L(u.elbowL,'x',-.9);L(u.elbowR,'x',-.9);}
  else {u.armL.rotation.set(-1.1+Math.sin(t*2+ph)*.08,0,.2); u.armR.rotation.set(-1.0+Math.cos(t*2.2)*.08,0,-.2);L(u.elbowL,'x',-.55);L(u.elbowR,'x',-.45);}
  u.head.rotation.set(.08+gl,Math.sin(t*.7)*.18+gl,(T==='clown'?.4:0)+Math.sin(t*.5)*.2);
  u.jaw.rotation.x=u.jaw0+.14+(Math.random()<.06?.2:0);
 } else if(u.pose==='perform'){
  const bt=t*2.4;
  L(u.legL,'x',0);L(u.legR,'x',0);L(u.kneeL,'x',Math.max(0,Math.sin(bt))*.14);L(u.kneeR,'x',Math.max(0,-Math.sin(bt))*.14);
  hp.position.y=1.0-Math.abs(Math.sin(bt))*.03; hp.rotation.set(0,Math.sin(bt*.5)*.18,0);
  tr.rotation.set(.04,0,Math.sin(bt*.5)*.06);
  if(T==='xinglau'){u.armL.rotation.set(-2.6+Math.sin(bt)*.2,0,.3);u.armR.rotation.set(-.3,0,-.2);u.elbowL.rotation.x=-.3;u.elbowR.rotation.x=-.8;}
  else if(T==='fernanda'){u.armL.rotation.set(-.3,0,.9+Math.sin(bt)*.4);u.armR.rotation.set(-.3,0,-.9-Math.sin(bt)*.4);u.elbowL.rotation.x=u.elbowR.rotation.x=-.2;}
  else {u.armL.rotation.set(-.35-Math.max(0,Math.sin(bt+ph))*1.3,0,.3); u.armR.rotation.set(-.35-Math.max(0,-Math.sin(bt+ph))*1.3,0,-.3);u.elbowL.rotation.x=-.7; u.elbowR.rotation.x=-.7;}
  if(u.tw>0){u.tw-=dt;}else if(Math.random()<dt*.12){u.tw=.6+Math.random()*1.2;u.twY=(Math.random()-.5)*.6;}
  u.head.rotation.set(Math.abs(Math.sin(bt))*.12+gl,(u.tw>0?u.twY:Math.sin(bt*.5)*.2)+gl,gl+(T==='toco'?Math.sin(bt*.5)*.15:0));
  u.jaw.rotation.x=u.jaw0+Math.max(0,Math.sin(t*6+ph))*.22;
 } else {
  L(u.legL,'x',0);L(u.legR,'x',0);L(u.kneeL,'x',.03);L(u.kneeR,'x',.03);
  hp.position.y+=(1.0-hp.position.y)*Math.min(1,dt*5); hp.rotation.y*=.9; hp.rotation.z*=.9;
  const br=T==='sandega'?.022:.012;
  tr.rotation.set(T==='zig'?.15:.03,0,T==='clown'?Math.sin(t*.6)*.05:0); tr.scale.set(1,1+Math.sin(t*(T==='sandega'?1:1.6)+ph)*br,1);
  if(T==='xinglau'){L(u.armL,'x',-.75);L(u.armL,'z',-.55);L(u.armR,'x',-.75);L(u.armR,'z',.55);L(u.elbowL,'x',-1.5);L(u.elbowR,'x',-1.5);}
  else if(T==='bruna'){u.armL.rotation.set(Math.sin(t*.6+ph)*.05,0,.1);L(u.armR,'x',-.2);L(u.armR,'z',-.75);L(u.elbowL,'x',-.15);L(u.elbowR,'x',-1.6);hp.rotation.z=.06;}
  else if(T==='zig'){u.armL.rotation.set(Math.sin(t*3)*.25,0,.25+Math.sin(t*2.2)*.1);u.armR.rotation.set(-Math.sin(t*3)*.25,0,-.25);u.elbowL.rotation.x=-.4+Math.sin(t*4)*.2;u.elbowR.rotation.x=-.4;hp.position.y=1+Math.abs(Math.sin(t*5))*.02;}
  else if(T==='clown'){u.armL.rotation.set(.05,0,.12+Math.sin(t*.5)*.03);u.armR.rotation.set(.05,0,-.12);L(u.elbowL,'x',-.1);L(u.elbowR,'x',-.1);}
  else {u.armL.rotation.set(Math.sin(t*.6+ph)*.05,0,.09); u.armR.rotation.set(-Math.sin(t*.6+ph)*.05,0,-.09);L(u.elbowL,'x',-.15);L(u.elbowR,'x',-.15);}
  const twRate=T==='fernanda'?.6:(T==='zig'?.5:(T==='sandega'?.1:.22)), twSpd=T==='fernanda'?30:(T==='sandega'?5:16);
  if(u.tw>0){u.tw-=dt;}else if(Math.random()<dt*twRate){u.tw=(T==='fernanda'?.15:.25)+Math.random()*.6;u.twY=(Math.random()-.5)*(T==='fernanda'?1.4:1.1);u.twX=(Math.random()-.5)*.4;}
  u.head.rotation.y+=((u.tw>0?u.twY:0)-u.head.rotation.y)*Math.min(1,dt*(u.tw>0?twSpd:3));
  u.head.rotation.x+=((u.tw>0?u.twX:0)-u.head.rotation.x)*Math.min(1,dt*6);
  u.head.rotation.z=(T==='toco'?Math.sin(t*.9)*.18:(T==='clown'?.35+Math.sin(t*.4)*.06:Math.sin(t*.8+ph)*.07))+gl;
  if(u.clack>0){u.clack-=dt;u.jaw.rotation.x=u.jaw0+(Math.sin(u.clack*40)>0?.2:0);}else{u.jaw.rotation.x=u.jaw0;if(Math.random()<dt*.08)u.clack=.4;}
 }
 if(u.tail){
  if(T==='bruna') u.tail.rotation.set(-.15+Math.sin(t*1.1)*.06,Math.sin(t*(u.walk?4:1.4)+ph)*.45,0);
  else if(T==='toco') u.tail.rotation.set(0,Math.sin(t*(u.pose==='atk'?3:12))*.6,0);
  else u.tail.rotation.set(Math.sin(t*1.1+ph)*.18,Math.sin(t*.8)*.28,0);
 }
 u.wings.forEach((w,i)=>{const big=u.pose==='atk'?Math.sin(t*9)*.45+.3:((u.walk||u.pose==='perform')?Math.sin(t*7)*.3:Math.sin(t*1.5)*.06);w.rotation.z=(i?-1:1)*big;});
}
function animBots(dt,t){
 Object.values(bots).forEach(b=>{
  if(!b.visible) return; const u=b.userData;
  if(u.rig===2){animRig(u,dt,t);return;}
  if(u.type==='golden'&&mode==='game') return;
  if(u.tw>0){u.tw-=dt;}else if(Math.random()<dt*.25){u.tw=.2+Math.random()*.4;u.twY=(Math.random()-.5)*.9;}
  u.head.rotation.y+=((u.tw>0?u.twY:0)-u.head.rotation.y)*Math.min(1,dt*(u.tw>0?18:3));
  u.head.rotation.z=Math.sin(t*.8+u.ph)*.06; u.head.rotation.x=0;
  u.armL.rotation.x=Math.sin(t*.6+u.ph)*.05; u.armR.rotation.x=-Math.sin(t*.6+u.ph)*.05;
  u.jaw.rotation.x=u.jaw0||0;
 });
}
const Y=new THREE.Vector3(0,1,0), _q=new THREE.Quaternion(), _fwd=new THREE.Vector3();
function animate(dt,t){
 if(mode==='game'&&g){
  // cadeira do Zig
  const z=g.zig, spin=(g.boss||!z.on)?0:(z.state==='idle'?(z.cranking?6:(z.meter>25?2.4:.9)):0);
  g.spin+=(spin-g.spin)*Math.min(1,dt*2); stoolTop.rotation.y+=g.spin*dt;
  layoutGame(dt); animBots(dt,t);
  let v=edgeV; if(keysLook.left)v+=1; if(keysLook.right)v-=1;
  yawT+=v*1.9*dt;
  let pT=-.04;
  if(g.flash==='hall'){yawT+=(0-yawT)*Math.min(1,dt*4);pT=0;}
  else if(g.flash==='vent'){yawT+=(.52-yawT)*Math.min(1,dt*4);pT=.28;}
  yawT=Math.max(-YAW_MAX,Math.min(YAW_MAX,yawT));
  yaw+=(yawT-yaw)*Math.min(1,dt*8); pitch+=(pT-pitch)*Math.min(1,dt*6);
  if(g.shake>0)g.shake-=dt; const sk=g.shake>0?g.shake*.06:0;
  playerCam.rotation.set(pitch+(Math.random()-.5)*sk,yaw+(Math.random()-.5)*sk,(Math.random()-.5)*sk*.5,'YXZ'); playerCam.position.set(0,1.3,1.25);
  lamp.color.setHex(g.boss&&g.bossS.phase===3?(Math.sin(t*6)>0?0xff4a3a:0xffc890):0xffc890);
  g.doorY.l+=((g.doors.l?1.15:3.5)-g.doorY.l)*Math.min(1,dt*14); g.doorY.r+=((g.doors.r?1.15:3.5)-g.doorY.r)*Math.min(1,dt*14);
  doorL.position.y=g.doorY.l; doorR.position.y=g.doorY.r;
  if(g.flick>0) g.flick-=dt;
  const officeThreat=(!g.boss&&g.chars.toco.state==='atk')||(g.boss&&g.bossS.atks.some(a=>a.type==='mask'));
  buildingLights(!g.powerOut,t);
  if(g.powerOut){lamp.intensity=0;amb.intensity=.08;redL.intensity=redR.intensity=0;monitorScreen.material.color.setHex(0x050805);
   const blink=Math.sin(t*9)>0; bots[g.boss?'clown':'toco'].userData.pupils.forEach(p=>p.visible=blink);}
  else {
   lamp.intensity=(officeThreat||g.flick>0)?(Math.random()<.5?.08:1.05):(Math.random()<.008?.25:1.1*(.94+Math.sin(t*7)*.03+Math.random()*.03));
   amb.intensity=.3; redL.intensity=redR.intensity=.9; monitorScreen.material.color.setHex(g.cams?0x4ac25a:0x2a7a32);
   Object.values(bots).forEach(b=>{if(b.userData.type!=='golden')b.userData.pupils.forEach(p=>p.visible=true);});
  }
  fanBlades.rotation.z+=g.powerOut?0:dt*22;
  spot.intensity=g.flash?3.2:0;
  if(g.flash==='hall') spot.target.position.set(0,1.4,-7); else if(g.flash==='vent') spot.target.position.set(-1.8,2.45,-2.9);
  if(g.cams&&ROOMS[g.cam]){const R=ROOMS[g.cam];_q.setFromAxisAngle(Y,Math.sin(t*.35)*.2);R.cam.quaternion.copy(_q).multiply(R.base);_fwd.set(0,0,-1).applyQuaternion(R.cam.quaternion);camLight.position.copy(R.cam.position).addScaledVector(_fwd,.6);camLight.intensity=g.powerOut?0:(g.camLight?2.4:.1);}
  else camLight.intensity=0;
 } else if(mode==='jumpscare'&&js){
  camLight.intensity=0;
  js.t+=dt; const b=bots[js.id], u=b.userData;
  _fwd.set(0,0,-1).applyQuaternion(playerCam.quaternion); _fwd.y=0; _fwd.normalize();
  const k=Math.min(1,js.t/.3), dist=1.7-1.15*(1-Math.pow(1-k,3));
  const s=u.base, headY=(u.legL?1.97:1.82)*s;
  b.visible=true; b.scale.setScalar(s);
  b.position.set(playerCam.position.x+_fwd.x*dist,1.3-headY+.05,playerCam.position.z+_fwd.z*dist);
  b.lookAt(playerCam.position.x,b.position.y,playerCam.position.z);
  u.jaw.rotation.x=.6+Math.sin(js.t*40)*.15; u.head.rotation.set(0,0,Math.sin(js.t*55)*.12);
  u.armL.rotation.set(-1.35,0,.25); u.armR.rotation.set(-1.35,0,-.25); if(u.legL){u.legL.rotation.x=0;u.legR.rotation.x=0;}
  if(u.rig===2){u.elbowL.rotation.x=-.35;u.elbowR.rotation.x=-.35;u.kneeL.rotation.x=u.kneeR.rotation.x=0;u.torso.rotation.set(.18,0,Math.sin(js.t*50)*.05);u.hips.position.y=1;u.lids.forEach(l=>l.rotation.x=-.3);u.jaw.rotation.x=.75+Math.sin(js.t*40)*.18;}
  u.pupils.forEach(p=>p.visible=true);
  lamp.intensity=1.6;
  playerCam.rotation.set(pitch+(Math.random()-.5)*.06,yaw+(Math.random()-.5)*.06,(Math.random()-.5)*.05,'YXZ');
 } else if(mode==='extras'){
  const gb=gBots[gSel]; if(gb){if(!gDrag)gRot+=dt*.5;gb.rotation.y=gRot;const u=gb.userData;if(u.rig===2){u.pose=Math.floor(t/6)%2?'perform':'idle';animRig(u,dt,t);}else{u.head.rotation.z=Math.sin(t*1.2)*.08;u.jaw.rotation.x=(u.jaw0||0)+Math.max(0,Math.sin(t*2))*.2;}}
 } else {
  stoolTop.rotation.y+=dt*2;
  animBots(dt,t);
  buildingLights(true,t); lamp.intensity=1.1; redL.intensity=redR.intensity=.9; amb.intensity=.3; LIGHTS.dining.intensity=Math.random()<.05?.2:1.15*(.88+Math.random()*.12);
  _q.setFromAxisAngle(Y,Math.sin(t*.25)*.08); menuCam.quaternion.copy(_q).multiply(menuBase);
 }
}

/* ================= HUD ================= */
const btnOf=a=>document.querySelector(`.ctl[data-act="${a}"]`);
function renderHUD(){
 const h=Math.min(5,Math.floor(g.t/HOUR_LEN));
 $('#hourLbl').textContent=g.boss?'??:??':(h===0?12:h)+' AM';
 $('#powerLbl').textContent=Math.ceil(g.power)+'%'; $('#powerFill').style.width=Math.max(0,g.power)+'%'; $('#powerFill').style.background=g.power<20?'#e0303f':(g.power<45?'#f2b33d':'#7ad36a');
 $('#camLightBtn').classList.toggle('on',g.camLight); $('#camHint').classList.toggle('hidden',g.camLight); $('#camTime').textContent='NOITE '+g.night+'  '+(g.boss?'??:??':((Math.floor(g.t/HOUR_LEN)||12)+':'+String(Math.floor((g.t%HOUR_LEN)/HOUR_LEN*60)).padStart(2,'0')+' AM'));
 const u=g.powerOut?0:usage();
 $('#usage').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<u?'u'+Math.min(5,u):''}"></i>`).join('');
 if(g.boss) $('#bossFill').style.width=(g.bossS.hp/BOSS_HP*100)+'%';
 ['l','r'].forEach(sd=>{const b=btnOf(sd==='l'?'doorL':'doorR');b.classList.toggle('on',g.doors[sd]);b.disabled=g.powerOut||g.jam[sd]>0;b.querySelector('.heat').style.width=g.boss?Math.min(100,g.heat[sd]/5*100)+'%':'0';});
 btnOf('hall').classList.toggle('held',g.flash==='hall'); btnOf('vent').classList.toggle('held',g.flash==='vent');
 btnOf('mask').classList.toggle('held',g.mask); btnOf('cams').classList.toggle('on',g.cams);
 btnOf('hall').disabled=btnOf('vent').disabled=btnOf('cams').disabled=g.powerOut;
 const z=g.zig;
 const threat=g.boss?g.bossS.atks.some(a=>a.type!=='cam'):(WALKERS.some(id=>g.chars[id].state==='atk')||z.state==='atk');
 const zigLow=z.on&&z.state==='idle'&&z.meter<25&&!(g.cams&&g.cam===3);
 btnOf('cams').classList.toggle('warn',(g.cams&&threat)||zigLow);
 $('#maskOv').classList.toggle('on',g.mask);
 if(g.cams){
  $('#camLbl').textContent='CAM '+g.cam+' · '+CAMS[g.cam];
  document.querySelectorAll('.mapb[data-cam]').forEach(b=>b.classList.toggle('on',+b.dataset.cam===g.cam));
  const showZ=g.cam===3&&z.on;
  $('#zigBox').classList.toggle('hidden',!showZ);
  if(showZ){$('#zigFill').style.width=Math.max(0,z.meter)+'%';$('#zigFill').style.background=z.meter<25?'#e0303f':(z.meter<50?'#f2b33d':'#5fcf5f');$('#crankBtn').classList.toggle('held',z.cranking);$('#crankBtn').disabled=z.state!=='idle';}
 }
 $('#lookHint').style.opacity=g.t<12?1:0;
}


/* ================= LOOP ================= */
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setSize(w,h,false);
 const rw=Math.max(2,Math.round(PS1_H*w/h)); rt.setSize(rw,PS1_H); postMat.uniforms.res.value.set(rw,PS1_H);
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
 const P=postMat.uniforms; P.time.value=t; P.cctv.value=0; P.grain.value=0; P.flash.value=0;
 if(mode==='game'&&g&&g.cams){P.cctv.value=1;P.grain.value=g.staticBurst>0?1.25:.14;renderTo(scene,ROOMS[g.cam].cam);}
 else if(mode==='game'||mode==='jumpscare'){renderTo(scene,playerCam);if(mode==='jumpscare')P.flash.value=Math.random()<.5?.3:0;}
 else if(mode==='extras') renderTo(gScene,gCam);
 else if(mode==='splash') renderTo(null);
 else {renderTo(scene,menuCam);P.grain.value=.07+(Math.random()<.02?.7:0);}
 presentPS1();
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
const KEYHOLD={' ':'mask','f':'hall','v':'vent','g':'crank'};
(function(){const b=$('#crankBtn');b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}holds.add('crank:p');});const up=()=>holds.delete('crank:p');b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);})();
document.addEventListener('keydown',e=>{
 if(mode!=='game'||!g||g.over) return;
 const k=e.key.toLowerCase();
 if((e.ctrlKey||e.metaKey)&&(k==='n'||e.code==='KeyN')){e.preventDefault();toast('Noite pulada');if(g.boss)winBoss();else winNight();return;}
 if(e.ctrlKey||e.metaKey) return;
 if(k==='l'&&!e.repeat){toggleCamLight();e.preventDefault();return;}
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
