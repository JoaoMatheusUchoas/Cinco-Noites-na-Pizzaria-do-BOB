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
 rare:'sounds/som_raro_que_pode_tocar.mp3',
 /* opcionais: se o arquivo não existir, o jogo usa um som sintetizado */
 alarm:'sounds/alarme.mp3',
 dayAmb:'sounds/dia_ambiente.mp3',
 kids:'sounds/risadas_criancas.mp3',
 arcade:'sounds/fliperama.mp3',
 wbScream:'sounds/withered_grito.mp3',
 zapFx:'sounds/choque.mp3',
 /* músicas */
 wbMusic:'sounds/musica_withered_bob.mp3',
 clownMusic:'sounds/musica_sr_gargalhada.mp3',
 outMusic:'sounds/musica_sem_energia.mp3'
/*@@END@@*/};

const OPTIONAL_SND=new Set(['alarm','dayAmb','kids','arcade','wbScream','wbMusic','clownMusic','outMusic','zapFx']);
const HOUR_LEN=72;      /* segundos por hora do jogo (6 horas = ~7 minutos) */
const MOVE_INT=8;       /* a cada quantos segundos cada um tenta se mexer */
const COOLDOWN=20;      /* descanso depois de ser expulso */
const BOSS_HP=220, YAW_MAX=1.2;
const WALKERS=['sandega','bruna','fernanda','xinglau','toco'];
const ALL=['sandega','bruna','fernanda','xinglau','toco','zig'];
const GROUP3=['bruna','fernanda','toco']; /* nunca os 3 atacando juntos */
/* Dificuldade por noite (0 = parado, 20 = máximo). zig = velocidade com que a cadeira dele para */
const LEVELS={
 1:{sandega:4,bruna:0,fernanda:0,xinglau:0,toco:0,zig:4},
 2:{sandega:6,bruna:5,fernanda:5,xinglau:0,toco:0,zig:6},
 3:{sandega:8,bruna:8,fernanda:7,xinglau:7,toco:0,zig:8},
 4:{sandega:11,bruna:10,fernanda:10,xinglau:10,toco:9,zig:10},
 5:{sandega:14,bruna:14,fernanda:13,xinglau:13,toco:13,zig:13}
};
/* Segundos para se defender depois que eles chegam */
const ATK={1:10,2:9,3:8.5,4:7.8,5:7,7:6.5};

/* Caminhos pelo restaurante: [x,y,z,{w:passagem, c:câmera, s:escala}] */
const RAW_PATHS={
 sandega:[[3,.6,-25.8,{c:1}],[.8,.6,-23.8,{w:1}],[.8,.3,-23.35,{w:1}],[.8,0,-22.7,{w:1}],[6.5,0,-22.6,{c:2}],[6.5,0,-14.8,{w:1}],[3.9,0,-14.6,{w:1}],[3.8,0,-11,{c:5}],[4.1,0,-5.5,{c:5}],[3.6,0,-1.6,{w:1}],[3.4,0,.3]],
 xinglau:[[-3,.6,-25.8,{c:1}],[-.8,.6,-23.8,{w:1}],[-.8,.3,-23.35,{w:1}],[-.8,0,-22.7,{w:1}],[-7.4,0,-22.6,{c:2}],[-9.3,0,-25,{w:1}],[-12.3,0,-24.8,{c:6}],[-9.3,0,-25,{w:1}],[-7.2,0,-22.4,{w:1}],[-6.6,0,-14.8,{w:1}],[-3.9,0,-14.6,{w:1}],[-3.8,0,-11,{c:4}],[-4.1,0,-5.5,{c:4}],[-3.6,0,-1.6,{w:1}],[-3.4,0,.3]],
 bruna:[[-1,.6,-26.3,{c:1}],[-.3,.6,-23.8,{w:1}],[-.3,.3,-23.35,{w:1}],[-.3,0,-21.3,{c:2}],[0,0,-15.6,{c:2}],[0,0,-12.3],[0,0,-6.2]],
 toco:[[1,.6,-26.3,{c:1}],[.4,.6,-23.8,{w:1}],[.4,.3,-23.35,{w:1}],[.9,0,-19,{c:2}],[.5,0,-15.2,{c:2}],[.45,0,-9.8],[.3,0,-3.1,{w:1}],[.45,0,-1.5,{w:1}],[1.4,0,-.85]],
 fernanda:[[-13.4,0,-16.5,{c:8}],[-11.4,0,-17.8,{w:1}],[-9.4,0,-18,{w:1}],[-7,0,-15.2,{c:2}],[-1.8,0,-14.75,{w:1}],[-1.8,1.4,-14.75,{w:1}],[-1.8,2.17,-13.6,{w:1,s:.55}],[-1.8,2.17,-10.5,{c:7,s:.55}],[-1.8,2.17,-6,{c:7,s:.55}],[-1.8,2.17,-3.25,{s:.55}]],
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
  tip:'Viu olhos no corredor do meio? É a BRUNA. Segure a LANTERNA do corredor (W).'},
 fernanda:{name:'FERNANDA',sp:'Águia',color:'#ff4f9a',spot:'V',def:'vent',need:2,speed:1.5,back:3,
  how:'Entra pelo duto que sai do salão. Segure a <b>lanterna no duto</b>.',
  bio:'Mascote do time de basquete infantil. Ninguém sabe como ela sobe nas paredes.',
  tip:'Barulho nos dutos é a FERNANDA. Segure a LANTERNA do duto (Q) quando ela aparecer na grade.'},
 xinglau:{name:'XINGLAU',sp:'Pato',color:'#ffd23f',spot:'L',def:'doorL',need:1.5,speed:1.3,back:6,
  how:'Passa pelo depósito e vem pelo corredor oeste. Feche a <b>porta esquerda</b>.',
  bio:'Capitão do time. Grita "QUÁ!" para comemorar. Ou para assustar.',
  tip:'Passos à esquerda são do XINGLAU. Feche a PORTA ESQUERDA (A).'},
 toco:{name:'TOCO',sp:'Cachorro',color:'#6aa8ff',spot:'O',def:'mask',need:2.5,speed:1.2,back:4,
  how:'Desce o corredor do meio e entra na sala. Segure a <b>máscara</b> até ele ir embora.',
  bio:'O mais simpático do palco. Abana o rabo até hoje, só que mais devagar.',
  tip:'Quando o TOCO entrar na sala e as luzes piscarem, segure a MÁSCARA (Espaço) até ele sair.'},
 zig:{name:'ZIG',sp:'Macaco',color:'#ff4060',spot:'R',def:'doorR',
  how:'Fica na cadeira giratória da cozinha. Abra a <b>CAM 3</b> e segure <b>Z</b> para rebobinar a cadeira. Se ela parar, ele vem direto em você.',
  bio:'Hiperativo. Só fica quieto girando. Se a cadeira para, ele vai atrás de quem parou.',
  tip:'Abra a CAM 3 e segure Z antes da barra do ZIG acabar. Se ele fugir, não tem defesa.'},
 clown:{name:'SR. GARGALHADA',sp:'Palhaço',color:'#ff3b6b',
  how:'Usa <b>tudo</b>: portas, lanterna, máscara e se esconde nas câmeras (dê o <b>choque</b>).',
  bio:'Encontrado no porão, queimado nas mangas. Na gola, um nome bordado à mão, quase ilegível: R I S A . . . O resto foi comido pelo fogo.',
  tip:'Veja de onde vem a risada e use a defesa certa. Na fase 2 e 3 ele aparece em dois lugares: resolva primeiro a porta e depois o resto. Se ele sumir, abra as câmeras, ache e dê CHOQUE (E). Não deixe as portas fechadas demais: elas superaquecem.'},
 wbob:{name:'WITHERED BOB',sp:'Cachorro · o primeiro mascote',color:'#d0303a',
  how:'Só aparece com todos no 20. É rapidíssimo e surge em qualquer entrada: porta, corredor, duto ou dentro da sala. Use a defesa daquele lugar em menos de 3 segundos.',
  bio:'O primeiro. Desligado em 26/10/1987. A etiqueta de manutenção nas costas diz, em caneta vermelha: NÃO RELIGAR. Os fios dele estão quentes.',
  tip:'Escute o grito: ele indica o lado. Porta = feche. Corredor = W. Duto = Q. Na sala = máscara.'},
 shocker:{name:'SHOCKER',sp:'??? · a coisa nos fios',color:'#9ad0ff',
  how:'Não ataca. Não aparece nas câmeras. Às vezes ele simplesmente está ali, por um instante, e some antes de você perceber.',
  bio:'Não existe nenhum registro dele. Nenhuma foto, nenhum documento. Só um nome que os operários da velha subestação diziam baixinho, e marcas de queimado em formato de mão.',tip:''},
 golden:{name:'BOB DOURADO',sp:'???',color:'#e0b83a',
  how:'Se ele aparecer sentado na sala, <b>não encare</b>. Abra as câmeras ou coloque a máscara.',
  bio:'O primeiro mascote da pizzaria, aposentado em 87. O traje ficou guardado nos fundos, com os olhos vazios.',
  tip:'Nunca encare o BOB Dourado. Abra as câmeras ou coloque a máscara assim que ele aparecer.'}
};
const CAMS={1:'Palco Principal',2:'Salão de Festas',3:'Cozinha',4:'Corredor Oeste',5:'Corredor Leste',6:'Depósito',7:'Duto de Ventilação',8:'Área de Brinquedos'};
const PAN={doorL:-.9,doorR:.9,hall:0,vent:-.45,mask:0,cam:0,L:-.9,R:.9,H:0,V:-.45,O:0};

const CALLS={
1:`<span class="who">📞 Valdir · vigia do prédio (1998–2016)</span><p>Alô? Ah, você atendeu. Sou o Valdir. Fui vigia deste prédio por dezoito anos, quando ele ainda estava fechado. Pediram que eu deixasse umas mensagens pra você.</p><p>Um pouco de história. Em 1983 o seu Roberto abriu aqui a <b>Bob's Pizzaria</b>, com o BOB, um cachorro vermelho, de mascote. Em 1987, depois de um... incidente, a Bob's fechou. Ficou trancada por quase trinta anos.</p><p>Em 2016 o neto do seu Roberto reabriu tudo como <b>Pizzaria do BOB</b>, com uma banda nova: a <b>Liga Mistério</b>. Seis bonecos de camisa de time. A criançada adora.</p><p>O problema é que, à noite, eles andam. O neto jura que é defeito de programação. Eu tenho minhas dúvidas.</p><p>Hoje deve ser tranquilo. A <b class="c-sandega">Sandega</b>, a tartaruga, costuma descer pelo corredor da direita, e só vai embora se der com a cara na porta. E de vez em quando dá uma olhada no <b class="c-zig">Zig</b>, na cozinha: ele só fica quieto enquanto a cadeira dele gira.</p>`,
2:`<span class="who">📞 Valdir</span><p>Você voltou. Bom sinal.</p><p>Os fios deste prédio são velhos. Às vezes as lâmpadas piscam sozinhas, uma atrás da outra, como se alguma coisa estivesse passando por dentro delas. Repara nisso.</p><p>A <b class="c-bruna">Bruna</b>, a raposa, fazia os truques de mágica no Show do Mistério. Um dia o holofote estourou bem no rosto dela. Desde então ela foge da luz. Quando ela vier pelo corredor do meio... você entendeu.</p><p>E a <b class="c-fernanda">Fernanda</b>, a águia, a gente sempre achava dentro dos dutos de manhã. Ninguém colocava ela lá. Ela também odeia ser vista no escuro.</p>`,
3:`<span class="who">📞 Valdir</span><p>Noite 3. Hoje o <b class="c-xinglau">Xinglau</b>, o pato, também acorda. Ele sempre passa no depósito antes de tudo e fica parado na frente da porta do porão. Depois vem pelo corredor da esquerda.</p><p>Sabia que, antes de ser pizzaria, este prédio era uma <b>subestação de energia</b>? Os operários antigos tinham umas histórias. Diziam que tinha alguma coisa morando nos fios. Até davam nome pra ela. Chamavam de... <i>*chiado*</i> ...ker.</p><p>Bobagem de peão, claro.</p><p>...Claro.</p>`,
4:`<span class="who">📞 Valdir</span><p>Nas festas, os funcionários usavam <b>máscaras da Liga</b>. O <b class="c-toco">Toco</b>, o cachorro azul, chegava perto, olhava bem no rosto e, se achava que era "da turma", ia embora abanando o rabo. Por isso tem uma máscara na sua mesa. O Toco entra na sala.</p><p>Outra coisa. Quando reabriu, o neto mandou cobrir uma coisa no depósito com uma <b>lona</b>. Disse que era "material antigo da Bob's". Dá uma olhada na CAM 6.</p><p>Eu sei o que tem embaixo. Eu não vou falar.</p>`,
5:`<span class="who">📞 Valdir</span><p>Última noite da semana.</p><p>Você deve ter visto o jornal pregado no escritório. Curto-circuito, eles disseram. Uma festa de aniversário, em 87. Todas as luzes estouraram de uma vez. Um funcionário não saiu.</p><p>Tem gente que trabalhou naquela festa e conta outra coisa. Fala que antes das luzes apagarem, o BOB... <i>*pausa*</i> ...esquece. Ninguém fala disso aqui dentro. Desculpa.</p><p>Cuidado com o <b class="c-zig">Zig</b> hoje. E se a lona da CAM 6 estiver mais perto da porta do que ontem, não fica olhando muito tempo. <i>*estática*</i></p>`,
6:`<span class="who">📞 Valdir (sinal fraco)</span><p>...tá me ouvindo? O sinal aqui embaixo é horrível.</p><p>Tinha mais uma coisa no porão. Uma fantasia de palhaço, velha, queimada nas mangas. O neto mandou restaurar e virou o <b class="c-clown">Sr. Gargalhada</b>, o vilão dos shows. Eu achei que tinha visto aquela gola antes. Numa foto. De 87.</p><p>Ele não se mexe igual aos outros. Os outros parecem... empurrados. Ele não. Ele parece que <b>quer</b>.</p><p>Ele aparece nas portas, no corredor, no duto e na sala. Quando some nas câmeras, ele para de atacar: ache o olho que brilha e dê o <b>choque</b>. Quanto mais ferido, mais ele se divide. As portas esquentam rápido hoje.</p><p>E se ele falar com você... não responde.</p>`,
wb:`<span class="who">📞 Número desconhecido</span><p><i>Chiado. Um zumbido elétrico subindo e descendo, como uma respiração.</i></p><p>...Você acordou todos ao mesmo tempo. Quando o prédio inteiro acorda, ele acorda também.</p><p>O <b class="c-bob">BOB</b>. O primeiro. Desde 1987 ele está embaixo daquela lona. Mas não é mais o BOB. É o <b>Shocker</b> vestindo ele, como sempre quis.</p><p>Ele é um só. Mas corre. Você vai ouvir antes de ver. E a cada hora mais um deles vai abrir os olhos.</p><p><i>A voz some. O zumbido continua, mais perto.</i></p>`,
7:`<span class="who">📞 Gerência</span><p>Esta é uma noite extra, fora da escala. Você escolheu quem está acordado e com qual intensidade.</p><p>A Pizzaria do BOB lembra que a empresa não se responsabiliza por ferimentos, desaparecimentos, quedas de energia ou risadas.</p>`
};
/* passo a passo mostrado quando você morre */
const STEPS={
 sandega:['Ela anda devagar: acompanhe pela CAM 2 (salão) e pela CAM 5 (corredor leste). A borda direita da tela pisca quando ela chega.','Quando ouvir passos pesados do lado DIREITO, olhe para a direita.','Feche a PORTA DIREITA (D) e espere a pancada. Depois pode abrir para economizar energia.'],
 bruna:['Ela desce pelo corredor do meio, bem na sua frente.','Quando os olhos brilharem no fundo do corredor, segure a LANTERNA DO CORREDOR (W).','Segure até ouvir o grito dela fugindo.'],
 fernanda:['Ela sobe pelo duto que sai do salão (CAM 7 mostra o duto).','Barulho metálico no alto = ela está vindo.','Quando ela aparecer deitada na grade do duto, segure a LANTERNA DO DUTO (Q).'],
 xinglau:['Ele passa pelo depósito (CAM 6) e desce o corredor oeste (CAM 4).','Passos e um "QUÁ" do lado ESQUERDO = ele chegou.','Feche a PORTA ESQUERDA (A) até ouvir as batidas.'],
 toco:['Ele desce o corredor do meio e entra direto na sala.','A lanterna mostra ele chegando, mas não espanta.','Quando as luzes piscarem e ele estiver na sala, segure a MÁSCARA (Espaço) até ele sair.'],
 zig:['Ele aparece desde a Noite 1. Abra a CAM 3 (cozinha) de vez em quando.','Segure Z para rebobinar a cadeira até a barra encher.','O alarme toca quando a barra fica baixa. Se ele fugir, não existe defesa: ele vem direto em você.'],
 wbob:['Ele é um só, mas muito rápido: você tem menos de 3 segundos.','O grito e a borda vermelha da tela mostram de onde ele vem.','Porta = A ou D. Corredor = W. Duto = Q. Na sala = Espaço (máscara).','A cada hora outro animatrônico acorda. Não esqueça do Zig (Z na CAM 3).'],
 clown:['Escute de onde vem a risada e veja onde ele aparece.','Porta = feche a porta. Corredor ou duto = lanterna. Dentro da sala = máscara.','Quando ele some nas câmeras, ele para de atacar o escritório: abra as câmeras (S), procure o olho brilhando e dê CHOQUE (E). A câmera dele treme no mapa. Use a luz (F).','Na fase 2 e 3 ele aparece em dois lugares no escritório: resolva a porta primeiro.'],
 golden:['Quando ele aparecer sentado na sua frente, não encare.','Abra as câmeras ou coloque a máscara imediatamente.']
};


/* ================= SAVE ================= */
const CUSTOM_DEF={sandega:5,bruna:5,fernanda:5,xinglau:5,toco:5,zig:5};
let save={night:1,n6:false,won6:false,max:false,seenGolden:false,custom:Object.assign({},CUSTOM_DEF)};
try{const r=localStorage.getItem('pizzariaBob3d_v2'); if(r){const o=JSON.parse(r); save=Object.assign(save,o); save.custom=Object.assign({},CUSTOM_DEF,o.custom||{});}}catch(e){}
function persist(){try{localStorage.setItem('pizzariaBob3d_v2',JSON.stringify(save));}catch(e){}}


/* ================= CONFIGURAÇÕES ================= */
const DEF_BINDS={doorL:'a',doorR:'d',hall:'w',vent:'q',cams:'s',light:'f',shock:'e',crank:'z',mask:' '};
const BIND_NAMES={doorL:'Porta esquerda',doorR:'Porta direita',hall:'Lanterna do corredor',vent:'Lanterna do duto',cams:'Câmeras (tablet)',light:'Luz da câmera',shock:'Choque',crank:'Rebobinar o Zig',mask:'Máscara'};
let SET={master:90,music:75,sfx:100,amb:60,res:240,shake:true,binds:Object.assign({},DEF_BINDS)};
try{const r=localStorage.getItem('pizzariaBob3d_set');if(r){const o=JSON.parse(r);SET=Object.assign(SET,o);SET.binds=Object.assign({},DEF_BINDS,o.binds||{});}}catch(e){}
function saveSet(){try{localStorage.setItem('pizzariaBob3d_set',JSON.stringify(SET));}catch(e){}}
const keyName=k=>k===' '?'ESPAÇO':k.toUpperCase();
const DEF_LETTER={A:'doorL',D:'doorR',W:'hall',Q:'vent',S:'cams',F:'light',E:'shock',Z:'crank'};
function fmtKeys(str){const K=a=>keyName(SET.binds[a]);return String(str)
 .replace(/\((A|D|W|Q|S|F|E|Z|Espaço)\)/g,(m,k)=>'('+K(k==='Espaço'?'mask':DEF_LETTER[k])+')')
 .replace(/<b>Z<\/b>/g,'<b>'+K('crank')+'</b>').replace(/segure Z\b/g,'segure '+K('crank')).replace(/\bZ para\b/g,K('crank')+' para')
 .replace(/= W\b/g,'= '+K('hall')).replace(/= Q\b/g,'= '+K('vent')).replace(/A ou D/g,K('doorL')+' ou '+K('doorR')).replace(/Espaço \(máscara\)/g,K('mask')+' (máscara)');}
/* ================= AUDIO ================= */
const A={ctx:null,master:null,buf:{},html:{},loading:false,loops:{},want:new Set(),vol:{}};
function audio(){
 if(!A.ctx){
  try{A.ctx=new (window.AudioContext||window.webkitAudioContext)();A.master=A.ctx.createGain();A.master.connect(A.ctx.destination);A.bus={};['music','sfx','amb'].forEach(b=>{A.bus[b]=A.ctx.createGain();A.bus[b].connect(A.master);});applyVolumes();}catch(e){A.ctx=null;}
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
 }catch(e){ if(!OPTIONAL_SND.has(k)){try{const el=new Audio(url);el.preload='auto';A.html[k]=el;}catch(_){}} }
 if(A.want.has(k)&&!A.loops[k]) A.loops[k]=play(k,{loop:true,vol:A.vol[k]});
 A.done=(A.done||0)+1; const tot=Object.keys(SOUND_FILES).length, el=$('#loadTag'); if(el){el.textContent=A.done>=tot?'sons prontos':'carregando sons '+A.done+'/'+tot; if(A.done>=tot) el.classList.add('done');}
}
function loadSounds(){if(A.loading)return;A.loading=true;Object.keys(SOUND_FILES).forEach(k=>loadOne(k,SOUND_FILES[k]));}
const MUSIC_KEYS=new Set(['menu','wbMusic','clownMusic','outMusic','sixAM']), AMB_KEYS=new Set(['fan','breath','dayAmb','arcade']);
function applyVolumes(){if(!A.ctx)return;A.master.gain.value=SET.master/100*.95;A.bus.music.gain.value=SET.music/100;A.bus.sfx.gain.value=SET.sfx/100;A.bus.amb.gain.value=SET.amb/100;}
function busFor(k){return MUSIC_KEYS.has(k)?A.bus.music:(AMB_KEYS.has(k)?A.bus.amb:A.bus.sfx);}
function outNode(node,pan,bus){
 const dst=bus||A.curBus||A.bus.sfx;
 if(A.ctx.createStereoPanner&&pan){const p=A.ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node.connect(p);p.connect(dst);}
 else node.connect(dst);
}
function play(k,o){
 o=o||{}; const vol=o.vol==null?1:o.vol;
 if(A.ctx&&A.buf[k]){
  const s=A.ctx.createBufferSource(); s.buffer=A.buf[k]; s.loop=!!o.loop; if(o.rate) s.playbackRate.value=o.rate;
  const gn=A.ctx.createGain(); gn.gain.value=vol; s.connect(gn); outNode(gn,o.pan,busFor(k));
  if(o.dur) s.start(0,o.offset||0,o.dur); else s.start(0,o.offset||0);
  return {stop(f){f=f==null?.25:f;try{const t=A.ctx.currentTime;gn.gain.cancelScheduledValues(t);gn.gain.setValueAtTime(gn.gain.value,t);gn.gain.linearRampToValueAtTime(0,t+f);s.stop(t+f+.03);}catch(e){}}};
 }
 if(A.html[k]){
  const el=A.html[k].cloneNode(); el.volume=Math.min(1,vol*SET.master/100*(MUSIC_KEYS.has(k)?SET.music:(AMB_KEYS.has(k)?SET.amb:SET.sfx))/100); el.loop=!!o.loop; if(o.rate) el.playbackRate=o.rate;
  el.play().catch(()=>{}); let to=o.dur?setTimeout(()=>el.pause(),o.dur*1000):null;
  return {stop(){el.pause();if(to)clearTimeout(to);}};
 }
 return {stop(){}};
}
function hasSnd(k){return !!(A.buf[k]||A.html[k]);}
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
 cam(){noise(.12,.05,3200,'highpass');},
 clatter(){for(let i=0;i<4;i++){tone(700+Math.random()*900,.12,'triangle',.08,.3,i*.11+Math.random()*.05);noise(.08,.15,3000,'bandpass',.3,i*.11);}},
 alarm(n){for(let i=0;i<(n||6);i++){tone(880,.18,'square',.12,0,i*.36);tone(660,.18,'square',.12,0,i*.36+.18);}},
 thud(pan,w){noise(.22,.6,120,'lowpass',pan,w||0);tone(60,.2,'sine',.25,pan,w||0,40);},
 quack(pan){[0,.24].forEach(w=>{tone(560,.17,'sawtooth',.22,pan,w+.1,300);tone(1120,.12,'square',.06,pan,w+.1,600);noise(.12,.12,1400,'bandpass',pan,w+.1);});},
 hiss(pan){noise(.8,.25,3500,'highpass',pan);},
 ring(){[0,.08,.16,.24,.4,.48,.56,.64].forEach(w=>tone(w<.35?1320:1180,.07,'square',.07,0,w));},
 blip(){tone(260+Math.random()*120,.035,'square',.03);},
 musicBox(){const n=[659,587,523,587,659,659,659,0,587,587,587,0,659,784,784,0];n.forEach((f,i)=>{if(f){tone(f*2,.55,'triangle',.07,-.8,i*.34);tone(f*4,.25,'sine',.025,-.8,i*.34);}});}
};

/* ---------- sons mais realistas (menos 8-bit) ---------- */
function metal(f,dur,vol,pan,when){[[1,1],[2.76,.5],[5.4,.25],[8.9,.12]].forEach(([m,a])=>tone(f*m,dur/m**.3,'sine',vol*a,pan,when));}
function servo(pan,v){tone(280+Math.random()*60,.35,'sawtooth',(v||.3)*.05,pan,0,420+Math.random()*80);noise(.3,(v||.3)*.05,900,'bandpass',pan);}
function crackle(dur,vol,pan){for(let i=0;i<Math.floor(dur*30);i++)noise(.008+Math.random()*.02,vol*(.4+Math.random()*.6),3000+Math.random()*4000,'highpass',pan,Math.random()*dur);}
function thump(pan,w,v){noise(.18,(v||.6),220,'lowpass',pan,w);tone(75,.22,'sine',(v||.6)*.5,pan,w,38);noise(.05,(v||.6)*.4,700,'bandpass',pan,w);}
Object.assign(sfx,{
 bang(pan){for(let i=0;i<3;i++){thump(pan,i*.26,.7);metal(140,.4,.05,pan,i*.26);}},
 screech(pan){noise(.55,.3,2600,'bandpass',pan);tone(900,.5,'triangle',.07,pan,0,240);servo(pan,.5);},
 retreat(){[0,.35,.7].forEach((w,i)=>thump(0,w,.35-i*.1));servo(0,.4);},
 hit(){metal(330,.9,.16);noise(.3,.4,1800,'bandpass');crackle(.5,.15);},
 zap(){if(hasSnd('zapFx')){play('zapFx',{vol:.8,dur:1.2});return;}crackle(.45,.3);tone(60,.4,'sawtooth',.08,0,0,58);tone(120,.4,'sawtooth',.04);},
 jam(){noise(.7,.35,420,'lowpass');tone(90,.7,'sawtooth',.12,0,0,50);metal(210,.5,.06);},
 powerOut(){const a=A.ctx;if(!a)return;noise(.05,.6,300,'lowpass');metal(90,.4,.08);tone(120,2.4,'sawtooth',.12,0,0,28);tone(60,2.4,'sine',.18,0,0,22);noise(2.2,.08,400,'lowpass',0,.05);crackle(.6,.12);},
 cam(){noise(.02,.05,5000,'highpass');tone(1900,.03,'sine',.02,0,.01);},
 alarm(n){for(let i=0;i<(n||6);i++){tone(620,.32,'sine',.11,0,i*.64,1150);tone(1150,.32,'sine',.11,0,i*.64+.32,620);}},
 thud(pan,w){thump(pan,w||0,.6);},
 ring(){const a=A.ctx;if(!a)return;const t=a.currentTime;[440,480].forEach(f=>{const o=a.createOscillator(),gn=a.createGain(),l=a.createOscillator(),lg=a.createGain();o.frequency.value=f;l.type='square';l.frequency.value=20;lg.gain.value=.04;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.05,t+.02);gn.gain.setValueAtTime(.05,t+.8);gn.gain.linearRampToValueAtTime(0,t+.85);l.connect(lg);lg.connect(gn.gain);o.connect(gn);outNode(gn,0);o.start(t);l.start(t);o.stop(t+.9);l.stop(t+.9);});},
 blip(){tone(300+Math.random()*80,.04,'triangle',.025);}
});
/* ---------- estática de verdade (tablet e telefone) ---------- */
function ensureNoise(){const a=A.ctx;if(a&&!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}}
let staticNode=null;
function staticStart(vol){
 const a=A.ctx; if(!a) return; ensureNoise();
 if(staticNode){staticSet(vol);return;}
 const src=a.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
 const hp=a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1400;
 const pk=a.createBiquadFilter(); pk.type='peaking'; pk.frequency.value=5200; pk.gain.value=7; pk.Q.value=.8;
 const gn=a.createGain(); gn.gain.value=vol;
 const lfo=a.createOscillator(), lg=a.createGain(); lfo.type='square'; lfo.frequency.value=13; lg.gain.value=vol*.35; lfo.connect(lg); lg.connect(gn.gain); lfo.start();
 src.connect(hp); hp.connect(pk); pk.connect(gn); gn.connect(A.bus.amb); src.start(0,Math.random());
 staticNode={src,gn,lfo,base:vol};
}
function staticSet(v){if(staticNode&&A.ctx){staticNode.gn.gain.setTargetAtTime(v,A.ctx.currentTime,.04);}}
function staticStop(){if(staticNode){try{staticNode.src.stop();staticNode.lfo.stop();}catch(e){}staticNode=null;}}
function staticBurst(dur,vol){if(!A.ctx)return;ensureNoise();noise(dur||.6,vol||.1,3500,'highpass');for(let i=0;i<4;i++)tone(2000+Math.random()*3000,.02,'square',.012,Math.random()*2-1,Math.random()*(dur||.6));}
/* ---------- ambiente da noite: zumbido da lâmpada e barulhos distantes ---------- */
let buzzNode=null;
function buzzStart(){const a=A.ctx;if(!a||buzzNode)return;const o=a.createOscillator(),f=a.createBiquadFilter(),gn=a.createGain();o.type='sawtooth';o.frequency.value=120;f.type='bandpass';f.frequency.value=240;f.Q.value=3;gn.gain.value=.012;o.connect(f);f.connect(gn);gn.connect(A.bus.amb);o.start();buzzNode={o,gn};}
function buzzSet(v){if(buzzNode&&A.ctx)buzzNode.gn.gain.setTargetAtTime(v,A.ctx.currentTime,.05);}
function buzzStop(){if(buzzNode){try{buzzNode.o.stop();}catch(e){}buzzNode=null;}}
function ambientEvent(){
 const r=Math.random(), far=.12;
 if(r<.2){for(let i=0;i<3;i++)tone(800+Math.random()*900,.12,'triangle',.04,.7,i*.13);noise(.25,far,2500,'bandpass',.7);}           // panelas na cozinha
 else if(r<.38){tone(90,1.2,'sawtooth',.05,-.4,0,60);noise(1,.06,300,'lowpass',-.4);}                                          // rangido de metal
 else if(r<.52){const p=Math.random()*1.6-.8;for(let i=0;i<4;i++)tone(420-i*30,.12,'triangle',.025,p,i*.15,380-i*30);}           // risada distante
 else if(r<.66){const n=[659,587,523,587,659];n.forEach((f,i)=>tone(f*2,.4,'triangle',.02,-.7,i*.32));}                       // caixinha de música longe
 else if(r<.8){noise(.3,.18,140,'lowpass',Math.random()*2-1);noise(.25,.12,140,'lowpass',Math.random()*2-1,.4);}               // pancadas
 else {noise(1.6,.05,900,'bandpass',0);}                                                                                    // vento no duto
}
/* ---------- música dos chefes (sequenciador simples) ---------- */
let MUS=null;
function musicStart(kind){musicStop();const a=A.ctx;if(!a)return;const file={clown:'clownMusic',wb:'wbMusic'}[kind];if(file&&hasSnd(file)){sloop(file,.42);MUS={kind,file};return;}MUS={kind,next:a.currentTime+.15,step:0,timer:setInterval(musicTick,40)};}
function musicStop(){if(MUS){if(MUS.timer)clearInterval(MUS.timer);if(MUS.file)sunloop(MUS.file,.7);MUS=null;}}
function musicTick(){
 const a=A.ctx; if(!a||!MUS) return;
 A.curBus=A.bus.music;
 while(MUS.next<a.currentTime+.25){
  const w=Math.max(0,MUS.next-a.currentTime), st=MUS.step;
  if(MUS.kind==='clown') clownStep(st,w); else if(MUS.kind==='wb') wbStep(st,w); else chipStep(st,w,MUS.kind);
  MUS.next+=musicStepDur(); MUS.step++;
 }
 A.curBus=null;
}
function musicStepDur(){
 if(!MUS) return .2;
 if(MUS.kind==='clown'){const ph=g&&g.bossS?g.bossS.phase:1;return 60/[0,140,158,182][ph]/2;}
 if(MUS.kind==='wb'){const h=g&&g.wb?g.wb.hour:0;return 60/(150+h*8)/2;}
 return 60/(MUS.kind==='mgCreepy'?96:132)/2;
}
const kick=(w,v)=>{tone(110,.14,'sine',v||.22,0,w,38);noise(.05,.06,1200,'bandpass',0,w);};
/* palhaço: valsa de circo desafinada (oom-pa-pa) com bumbo */
const CLOWN_MEL=[76,0,74,73,74,0,71,0,69,70,71,0,74,0,73,72,73,0,69,0,66,67,68,69,76,75,74,73,72,71,70,0];
const midi=m=>440*Math.pow(2,(m-69)/12);
function clownStep(st,w){
 const ph=g&&g.bossS?g.bossS.phase:1, b=st%6, bar=Math.floor(st/6)%4, root=[45,41,43,40][bar];
 if(b===0){kick(w,.2);tone(midi(root),.3,'triangle',.11,0,w);}
 if(b===2||b===4){[root+12,root+15,root+19].forEach(n=>tone(midi(n)*(1+(Math.random()-.5)*.01),.12,'square',.025,0,w));}
 const m=CLOWN_MEL[st%CLOWN_MEL.length];
 if(m){tone(midi(m)*(1+(Math.random()-.5)*.012),.2,'square',.035,.2,w);tone(midi(m)*2,.18,'triangle',.015,-.2,w);}
 if(ph>=2&&b===3) noise(.06,.08,6000,'highpass',0,w);
 if(ph===3&&st%3===0) kick(w,.12);
}
/* Withered BOB: tum tum tum tum pesado, drone grave e batidas metálicas */
function wbStep(st,w){
 const h=g&&g.wb?g.wb.hour:0;
 if(st%2===0) kick(w,.26);
 if(st%16===0){tone(41,1.8,'sawtooth',.06,0,w);tone(41.6,1.8,'sawtooth',.05,0,w);}
 if(st%4===2) noise(.08,.07+h*.01,4500,'highpass',(st%8===2)?-.5:.5,w);
 if(h>=2&&st%8===7) tone(midi(52+Math.floor(Math.random()*3)),.15,'square',.03,0,w,midi(40));
 if(h>=4&&st%2===1) kick(w,.1);
}
/* trilhas 8-bit dos minigames */
const CHIP_HAPPY=[72,76,79,76,74,77,81,77,72,76,79,84,83,79,76,74];
const CHIP_CREEPY=[64,0,63,0,64,0,59,0,62,0,61,0,62,0,57,0];
function chipStep(st,w,kind){
 const mel=kind==='mgCreepy'?CHIP_CREEPY:CHIP_HAPPY, m=mel[st%mel.length];
 if(m) tone(midi(m),.16,'square',.03,0,w);
 if(st%4===0) tone(midi((kind==='mgCreepy'?40:48)+((Math.floor(st/16)%2)?5:0)),.3,'triangle',.06,0,w);
 if(kind!=='mgCreepy'&&st%4===2) noise(.04,.05,6000,'highpass',0,w);
}

/* ================= THREE SETUP ================= */
(function checkGL(){
 let ok=false; try{const c=document.createElement('canvas');ok=!!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}catch(e){}
 if(!ok){document.body.insertAdjacentHTML('beforeend','<div id="noGL"><div style="font-size:48px">🍕</div><p>Seu navegador ou placa de vídeo não suporta WebGL, que o jogo precisa para desenhar a pizzaria em 3D.</p><p style="color:#8d8574">Tente o Chrome, Edge ou Firefox atualizados, ou ative a "aceleração de hardware" nas configurações do navegador.</p></div>');throw new Error('WebGL indisponível');}
})();
const renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(1); renderer.setClearColor(0x000000);
let PS1_H=SET.res||240; /* altura interna da imagem (estilo PS1 = 240) */
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
 // sombra e brilho (volume)
 x.save(); x.beginPath(); x.ellipse(0,0,s,s*(type==='sandega'?1.05:.96),0,0,7); x.clip();
 const sg=x.createLinearGradient(-s,-s,s*.8,s); sg.addColorStop(0,'rgba(255,255,255,.18)'); sg.addColorStop(.5,'rgba(0,0,0,0)'); sg.addColorStop(1,'rgba(0,0,0,.38)'); x.fillStyle=sg; x.fillRect(-s,-s,s*2,s*2); x.restore();
 x.lineWidth=Math.max(1.5,s*.07); x.strokeStyle='#120a08'; x.beginPath(); x.ellipse(0,0,s,s*(type==='sandega'?1.05:.96),0,0,7); x.stroke();
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
function shadeHex(h,f){const n=parseInt(h.slice(1),16);const c=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f))));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');}
function fitText(x,txt,cx,y,maxW,size,font){let sz=size;do{x.font=`${sz}px ${font||'VT323, monospace'}`;sz--;}while(x.measureText(txt).width>maxW&&sz>8);x.fillText(txt,cx,y);}
function sepiaCanvas(x,w,h){const d=x.getImageData(0,0,w,h),p=d.data;for(let i=0;i<p.length;i+=4){const r=p[i],g2=p[i+1],b=p[i+2];p[i]=Math.min(255,r*.39+g2*.77+b*.19);p[i+1]=Math.min(255,r*.35+g2*.69+b*.17);p[i+2]=Math.min(255,r*.27+g2*.53+b*.13);}x.putImageData(d,0,0);}
function starPath(x,cx,cy,r1,r2,n){x.beginPath();for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,r=i%2?r2:r1;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.closePath();}
/* pôster novo: raios de sol, meio-tom, retrato emoldurado, selo, fita e rodapé */
function posterDraw(spec){
 const w=160,h=200;
 return x=>{
  x.clearRect(0,0,w,h);
  if(spec.style==='warning') return warnDraw(x,spec,w,h);
  const bg=spec.bg||'#5c1a1f', bg2=spec.bg2||shadeHex(bg,1.6);
  x.fillStyle=spec.paper||'#e8dcc0'; x.fillRect(0,0,w,h);
  x.fillStyle=bg; x.fillRect(6,6,w-12,h-12);
  x.save(); x.beginPath(); x.rect(6,6,w-12,h-12); x.clip(); x.translate(80,100);
  for(let i=0;i<24;i++){x.fillStyle=i%2?bg2:bg;x.beginPath();x.moveTo(0,0);x.arc(0,0,200,i*Math.PI/12,(i+1)*Math.PI/12);x.fill();}
  x.restore();
  for(let yy=132;yy<178;yy+=5)for(let xx=9;xx<w-8;xx+=5){x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.arc(xx+((yy/5)%2)*2.5,yy,(yy-130)/22,0,7);x.fill();}
  x.fillStyle='#120a0a'; x.fillRect(6,6,w-12,38);
  x.textAlign='center';
  if(spec.kicker){x.fillStyle='#efe6cf';x.font='11px VT323, monospace';x.fillText(spec.kicker,80,16);}
  x.fillStyle=spec.titleC||'#ffd23f'; x.strokeStyle='#000'; x.lineWidth=3;
  fitText(x,spec.title,80,spec.kicker?38:34,w-18,spec.kicker?22:26);
  if(spec.faces){
   spec.faces.forEach((f,i)=>{const cx=28+(i%3)*52, cy=74+Math.floor(i/3)*48;x.fillStyle='#f4ecd8';x.beginPath();x.arc(cx,cy,21,0,7);x.fill();x.strokeStyle='#120a0a';x.lineWidth=2;x.stroke();drawFace(x,f,cx,cy+2,14,{glow:spec.glow,scratch:spec.scratchIdx===i});});
  } else {
   x.fillStyle=bg2; x.beginPath(); x.arc(80,100,52,0,7); x.fill();
   x.fillStyle='#f4ecd8'; x.beginPath(); x.arc(80,100,46,0,7); x.fill();
   x.strokeStyle='#120a0a'; x.lineWidth=3; x.beginPath(); x.arc(80,100,46,0,7); x.stroke();
   for(let i=0;i<16;i++){const a=i*Math.PI/8;x.fillStyle=i%2?'#ffd23f':'#fff3c0';x.beginPath();x.arc(80+Math.cos(a)*49,100+Math.sin(a)*49,2,0,7);x.fill();}
   drawFace(x,spec.face,80,100,36,{glow:spec.glow,scratch:spec.scratch});
  }
  if(spec.badge){x.fillStyle='#ffd23f';starPath(x,130,56,20,13,10);x.fill();x.strokeStyle='#7a1018';x.lineWidth=1.5;x.stroke();x.fillStyle='#b5121f';x.font='12px VT323, monospace';x.fillText(spec.badge,130,60);}
  const ry=spec.faces?166:158;
  x.fillStyle='#7a0c14'; x.beginPath(); x.moveTo(4,ry-2); x.lineTo(18,ry-2); x.lineTo(18,ry+18); x.lineTo(4,ry+18); x.lineTo(10,ry+8); x.fill();
  x.beginPath(); x.moveTo(w-4,ry-2); x.lineTo(w-18,ry-2); x.lineTo(w-18,ry+18); x.lineTo(w-4,ry+18); x.lineTo(w-10,ry+8); x.fill();
  x.fillStyle=spec.ribbon||'#b5121f'; x.fillRect(14,ry-6,w-28,20);
  x.fillStyle='#fff4dc'; fitText(x,spec.sub||'',80,ry+9,w-36,15);
  x.fillStyle='#120a0a'; x.fillRect(6,h-22,w-12,16);
  x.fillStyle='#d8cfb8'; fitText(x,spec.foot||'PIZZARIA DO BOB · FESTAS E SHOWS',80,h-10,w-16,11);
  if(spec.style==='vintage') sepiaCanvas(x,w,h);
  ageCanvas(x,w,h,{torn:spec.torn,tape:true});
  if(spec.scrawl) scrawl(x,spec.scrawl,80,(spec.scrawlY||118)*1.25,(spec.scrawlS||20)*1.1,spec.scrawlR||-.2);
 };
}
/* placa de perigo (pista do Shocker) */
function warnDraw(x,spec,w,h){
 x.fillStyle='#e8c420'; x.fillRect(0,0,w,h);
 x.save(); x.beginPath(); x.rect(0,0,w,h); x.rect(10,10,w-20,h-20); x.clip('evenodd');
 for(let i=-h;i<w+h;i+=14){x.fillStyle='#141414';x.beginPath();x.moveTo(i,0);x.lineTo(i+7,0);x.lineTo(i+7-h,h);x.lineTo(i-h,h);x.fill();}
 x.restore();
 x.fillStyle='#141414'; x.beginPath(); x.moveTo(80,22); x.lineTo(120,90); x.lineTo(40,90); x.closePath(); x.fill();
 x.fillStyle='#e8c420'; x.beginPath(); x.moveTo(86,36); x.lineTo(70,64); x.lineTo(80,64); x.lineTo(72,84); x.lineTo(92,56); x.lineTo(82,56); x.lineTo(90,36); x.fill();
 x.fillStyle='#141414'; x.textAlign='center'; fitText(x,spec.title,80,116,w-30,30);
 (spec.lines||[]).forEach((l,i)=>fitText(x,l,80,136+i*15,w-30,14));
 ageCanvas(x,w,h,{torn:spec.torn,tape:true});
 if(spec.scrawl) scrawl(x,spec.scrawl,80,(spec.scrawlY||150)*1.25,(spec.scrawlS||18)*1.1,spec.scrawlR||-.15);
}
function posterTex(spec){return ctex(160,200,posterDraw(spec),{text:true});}
/* papel datilografado / recorte de jornal */
function flyerTex(lines,title,o){
 o=o||{};
 return ctex(160,200,x=>{
  x.fillStyle=o.news?'#d6ccb0':'#e2dac4'; x.fillRect(0,0,160,200);
  if(!o.news) for(let y=34;y<196;y+=12){x.fillStyle='rgba(60,90,160,.18)';x.fillRect(8,y,144,1);}
  x.fillStyle='#1a1410'; x.textAlign='center';
  if(o.news){x.font='9px VT323, monospace';x.fillText('DIÁRIO DA CIDADE · 27 DE OUTUBRO DE 1987',80,12);x.fillRect(8,15,144,1);fitText(x,title,80,32,148,20);x.fillRect(8,37,144,2);
   x.fillStyle='#4a4234';x.fillRect(10,44,62,58);x.fillStyle='#2a241c';x.beginPath();x.arc(41,66,13,0,7);x.fill();x.fillRect(30,78,22,24);x.beginPath();x.ellipse(29,64,4,9,.3,0,7);x.ellipse(53,64,4,9,-.3,0,7);x.fill();x.fillStyle='#d6ccb0';x.font='8px VT323, monospace';x.fillText('O mascote BOB',41,108);
   x.textAlign='left';x.fillStyle='#2a2018';x.font='10px VT323, monospace';lines.forEach((l,i)=>x.fillText(l.replace(/^!/,''),i<6?78:10,i<6?52+i*10:122+(i-6)*10));}
  else {fitText(x,title,80,24,144,22);x.fillRect(10,29,140,2);x.textAlign='left';x.font='12px VT323, monospace';lines.forEach((l,i)=>{x.fillStyle=l.startsWith('!')?'#8a0a12':'#2a2018';x.fillText(l.replace(/^!/,''),12,46+i*12);});}
  if(o.stamp){x.save();x.translate(110,170);x.rotate(-.25);x.strokeStyle='rgba(170,20,30,.75)';x.lineWidth=2;x.strokeRect(-36,-12,72,22);x.fillStyle='rgba(170,20,30,.75)';x.font='14px VT323, monospace';x.textAlign='center';x.fillText(o.stamp,0,4);x.restore();}
  ageCanvas(x,160,200,{torn:o.torn,tape:true});
  if(o.scrawl) scrawl(x,o.scrawl,80,(o.y||146)*1.25,18,-.15);
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

const BOB_SPEC={kicker:'O MASCOTE ORIGINAL',title:'FESTA DO BOB!',face:'bob',bg:'#6a141c',sub:'TODO DIA É ANIVERSÁRIO',foot:'BOB\'S PIZZARIA · DESDE 1983',badge:'1983'};
const BOB_VAR={title:'SOU EU',face:'bob',bg:'#1a1206',glow:true,sub:'',foot:'',titleC:'#c9a227',scrawl:'SOU EU',scrawlY:132,scrawlS:24};
function drawPoster(x,variant){posterDraw(variant?BOB_VAR:BOB_SPEC)(x);}
function signDraw(text,bg,fg,size){return x=>{x.fillStyle=bg;x.fillRect(0,0,256,64);x.fillStyle=fg;x.font=(size||40)+'px VT323, monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);};}
function signTex(text,bg,fg,size){return ctex(256,64,signDraw(text,bg,fg,size),{text:true});}
const TEX={
 poster:ctex(160,200,x=>drawPoster(x,false),{text:true}),
 celebrate:posterTex({kicker:'A NOVA TURMA DA PIZZARIA',title:'LIGA MISTÉRIO',faces:['sandega','bruna','fernanda','xinglau','toco','zig'],bg:'#1a1030',sub:'SHOWS TODO SÁBADO',scratchIdx:3,scrawl:'ELES OLHAM',scrawlY:126,badge:'2016'}),
 kids:kidsTex(),
 pBruna:posterTex({kicker:'SÁBADO · 16H',title:'SHOW DE MÁGICA',face:'bruna',bg:'#4a1806',sub:'COM A BRUNA Nº 13',scratch:true,scrawl:'ELA VÊ VOCÊ',scrawlY:120,torn:true,badge:'MÁGICA'}),
 pSandega:posterTex({kicker:'A MAIS VELHA DA TURMA',title:'DEVAGAR E SEMPRE',face:'sandega',bg:'#0e3418',sub:'SANDEGA Nº 01',scrawl:'ELA CHEGA',scrawlY:128,scrawlR:.15}),
 pXinglau:posterTex({kicker:'QUÁ! QUÁ!',title:'CAPITÃO DO TIME',face:'xinglau',bg:'#4a3406',sub:'XINGLAU Nº 09',torn:true,badge:'CAPITÃO'}),
 pToco:posterTex({kicker:'O MAIS FOFINHO',title:'MELHOR AMIGO',face:'toco',bg:'#0c2048',sub:'ABRACE O TOCO Nº 07',scrawl:'NÃO ABRACE',scrawlY:124}),
 pFernanda:posterTex({kicker:'RADICAL!',title:'VOE ALTO!',face:'fernanda',bg:'#4a0a28',sub:'FERNANDA Nº 21',glow:true,badge:'NOVO!'}),
 pZig:posterTex({kicker:'NA COZINHA',title:'GIRA-GIRA DO ZIG',face:'zig',bg:'#3a0814',sub:'NÃO DEIXE PARAR',glow:true,scrawl:'NUNCA',scrawlY:118,scrawlS:26}),
 pBobOld:posterTex({kicker:'1983 - 1987',title:'BOB',face:'bob',bg:'#2a0a0c',sub:'O PRIMEIRO',foot:'',scratch:true,torn:true,scrawl:'ONDE ELE ESTÁ?',scrawlY:126,scrawlS:16,style:'vintage'}),
 pBobs83:posterTex({kicker:'GRANDE INAUGURAÇÃO',title:"BOB'S PIZZARIA",face:'bob',bg:'#7a1a10',sub:'VENHA CONHECER O BOB!',foot:'RUA DA SUBESTAÇÃO, 87 · 1983',style:'vintage',badge:'ABRIMOS!'}),
 pShock:posterTex({style:'warning',title:'PERIGO',lines:['ALTA TENSÃO','NÃO TOQUE NOS FIOS','ANTIGA SUBESTAÇÃO'],scrawl:'ELE MORA AQUI',scrawlY:150}),
 news:flyerTex(['Polícia aponta','curto-circuito','durante festa','infantil. Todas','as luzes do','salão estouraram.','Um funcionário de 34 anos, que animava as festas como','o palhaço Risadinha, não resistiu. A pizzaria não tem','previsão de reabrir. O dono, Roberto, não quis falar','com a reportagem.'],"BOB'S PIZZARIA FECHA",{news:true,torn:true}),
 job:flyerTex(['PROCURA-SE','VIGIA NOTURNO','','TURNO: 0H ÀS 6H','SALÁRIO: R$ 120/SEM','','A EMPRESA NÃO SE','RESPONSABILIZA','POR DANOS.','','!NÃO OLHE NOS OLHOS'],'CLASSIFICADOS',{scrawl:'FUJA',y:146}),
 smile:posterTex({kicker:'ATENÇÃO',title:'SORRIA!',face:'toco',bg:'#2a0a0a',sub:'VOCÊ ESTÁ SENDO FILMADO',foot:'SISTEMA DE SEGURANÇA 24H',glow:true}),
 rules:flyerTex(['1. NÃO CORRA','2. NÃO GRITE','3. NÃO TOQUE NOS','   ANIMATRÔNICOS','4. NÃO SAIA APÓS 0H','5. MANTENHA AS','   PORTAS ABERTAS','6. SORRIA SEMPRE','','!7. SE AS LUZES','!   PISCAREM EM FILA,','!   NÃO SE MEXA'],'REGRAS',{torn:true,stamp:'GERÊNCIA'}),
 stage:signTex('BOB & AMIGOS','#7d1222','#f2b33d',44),
 birthday:signTex('FELIZ ANIVERSÁRIO','#1a2a55','#f2b33d',34),
 play:signTex('DIVIRTA-SE!','#2a1440','#ffd23f',40),
 staff:signTex('SÓ FUNCIONÁRIOS','#1a1a1a','#e0303f',32),
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
 [[-10.2,-5],[-2.6,-2.3],[-1.3,-.8],[.8,2.6],[5,5.4],[6.8,10.2]].forEach(([a,b])=>W(a,b,-14.2,-14,0,4));
 W(5.4,6.8,-14.2,-14,2.6,4);
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

 /* ---- RECEPÇÃO (entrada e saída da pizzaria) ---- */
 A(5.2,12,-.1,0,-14,-8,'floor'); A(5,12.2,3.2,3.3,-14.2,-7.8,'ceil');
 W(10.2,12.2,-14.2,-14,0,3.3); W(5,12.2,-8,-7.8,0,3.3);
 W(12,12.2,-14.2,-11.6,0,3.3); W(12,12.2,-10.4,-7.8,0,3.3); W(12,12.2,-11.6,-10.4,2.5,3.3);
 A(7.4,10.6,0,1.05,-10.25,-9.6,'red'); A(7.35,10.65,1.05,1.1,-10.3,-9.55,'wood');
 A(5.3,5.8,0,.45,-13.5,-11,'chair'); A(5.3,5.4,.45,.95,-13.5,-11,'chair');
 A(8.2,9.8,3.15,3.2,-11.4,-10.8,'glow');
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
let PO_REC=null;
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
 PO(TEX.rules,.45,2.385,1.35,-1.35,-Math.PI/2); PO(TEX.news,.45,2.385,1.35,-.75,-Math.PI/2).rotation.z=-.05;
 PO(TEX.pBruna,.55,-.79,1.5,-4.4,Math.PI/2); PO(TEX.smile,.5,.79,1.55,-7,-Math.PI/2); PO(TEX.rules,.45,-.79,1.45,-9.8,Math.PI/2).rotation.z=-.08;
 // corredores laterais
 const kd2=plane(1.2,.6,TEX.kids,-4.99,1.6,-6,Math.PI/2,P); kd2.material.transparent=true;
 PO(TEX.pXinglau,.6,-4.99,1.55,-3.2,Math.PI/2); PO(TEX.pBobOld,.55,-2.61,1.6,-8.5,-Math.PI/2); PO(TEX.pShock,.5,-2.61,1.5,-12.4,-Math.PI/2);
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
 PO(TEX.pBobs83,.6,-15.99,1.7,-25.5,Math.PI/2); PO(TEX.news,.45,-10.21,1.6,-23.2,-Math.PI/2); PO(TEX.pShock,.5,-12.6,1.5,-27.99,0);
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
(function receptionProps(){
 const P=OFF;
 plane(2.6,.6,signTex('BEM-VINDO!','#7d1222','#f2b33d',44),8.9,2.6,-7.81,Math.PI,P,true);
 [[5.6,-8.4],[11.6,-8.4],[11.6,-13.6]].forEach(([x,z])=>{mesh(new THREE.CylinderGeometry(.22,.18,.45,8),0x5a3a24,x,.22,z,P);for(let i=0;i<6;i++){const l=mesh(new THREE.ConeGeometry(.12,.7,4),0x2a7a3a,x+Math.sin(i)*.1,.75,z+Math.cos(i)*.1,P);l.rotation.set(Math.cos(i)*.4,0,Math.sin(i)*.4);}});
 [-.62,.62].forEach(dz=>{box(.06,2.4,1.18,0x23303c,12.06,1.2,-11+dz*.98,P);box(.07,2.2,.9,0x8ab4d0,12.08,1.2,-11+dz*.98,P).material=ps1(new THREE.MeshBasicMaterial({color:0x9ac8e8}));});
 plane(1.2,.3,signTex('SAÍDA','#0f3a18','#8fe38f',44),11.98,2.75,-11,-Math.PI/2,P,true);
 box(1.4,.02,2.6,0x7d1222,10.6,.01,-11,P);
 PO_REC=plane(.7,.875,TEX.pToco,5.21,1.7,-9.6,Math.PI/2,P); PO_REC.material.transparent=true;
 const p2=plane(.7,.875,TEX.celebrate,6.6,1.8,-7.81,Math.PI,P); p2.material.transparent=true;
})();
/* lona do depósito: aparece nas noites 4 e 5; na 6 ela está jogada no chão */
const TX_TARP=ctex(64,64,x=>{x.fillStyle='#2c3a4a';x.fillRect(0,0,64,64);for(let i=0;i<64;i+=6){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(i,0,2,64);}grime(x,64,64,300,.45);x.fillStyle='rgba(90,60,30,.35)';x.beginPath();x.arc(20,40,9,0,7);x.fill();},{rep:true});
const TARP_UP=new THREE.Group(), TARP_DOWN=new THREE.Group(); scene.add(TARP_UP); scene.add(TARP_DOWN);
(function(){
 const tm=ps1(new THREE.MeshLambertMaterial({map:TX_TARP})), U=TARP_UP;
 const body=mesh(new THREE.SphereGeometry(.62,14,10),tm,-14.6,.85,-22.8,U); body.scale.set(.85,1.35,.8);
 mesh(new THREE.SphereGeometry(.22,12,9),tm,-14.6,1.98,-22.78,U);
 mesh(new THREE.SphereGeometry(.12,10,8),tm,-14.45,2.2,-22.8,U).scale.set(.6,1.4,.8);
 [-1,1].forEach(s=>mesh(new THREE.SphereGeometry(.2,10,8),tm,-14.6+s*.38,1.55,-22.8,U));
 const skirt=mesh(new THREE.ConeGeometry(.78,1.1,12,1,true),tm,-14.6,.5,-22.8,U); skirt.material=ps1(new THREE.MeshLambertMaterial({map:TX_TARP,side:THREE.DoubleSide}));
 for(let i=0;i<7;i++){const f=mesh(new THREE.ConeGeometry(.08,.9,4),tm,-14.6+Math.sin(i*.9)*.62,.45,-22.8+Math.cos(i*.9)*.6,U);f.scale.z=.4;f.rotation.y=i*.9;}
 const shoe=mesh(new THREE.SphereGeometry(.13,10,8),0x5a1418,-14.3,.06,-22.25,U); shoe.scale.set(1,.5,1.6);
 const D=TARP_DOWN;
 mesh(new THREE.SphereGeometry(.7,14,8),tm,-14.4,.02,-23.1,D).scale.set(1.3,.07,.9);
 mesh(new THREE.SphereGeometry(.45,12,8),tm,-13.7,.04,-22.5,D).scale.set(1,.12,.8);
 const fold=mesh(new THREE.CylinderGeometry(.08,.1,1.2,8),tm,-14.2,.07,-22.9,D); fold.rotation.set(Math.PI/2,0,.7);
 TARP_UP.visible=false; TARP_DOWN.visible=false;
})();
/* ---------- cenário extra: detalhes, decoração e pistas escondidas ---------- */
const TX_HAND=ctex(64,64,x=>{const gr=x.createRadialGradient(32,40,4,32,40,30);gr.addColorStop(0,'rgba(8,4,2,.9)');gr.addColorStop(.6,'rgba(20,10,4,.6)');gr.addColorStop(1,'rgba(20,10,4,0)');x.fillStyle=gr;x.beginPath();x.ellipse(32,42,13,15,0,0,7);x.fill();
 [[-11,-14,.5],[-5,-22,.15],[2,-24,0],[9,-21,-.15],[15,-8,-.7]].forEach(([dx,dy,r])=>{x.save();x.translate(32+dx*.7,36+dy*.4);x.rotate(r);x.beginPath();x.ellipse(0,-6,3.2,9,0,0,7);x.fill();x.restore();});
 x.strokeStyle='rgba(120,180,255,.25)';x.lineWidth=1;x.beginPath();x.moveTo(32,56);for(let i=0;i<5;i++)x.lineTo(32+(Math.random()-.5)*20,56+i*2);x.stroke();});
const TX_PHOTO=ctex(96,72,x=>{x.fillStyle='#e8e0d0';x.fillRect(0,0,96,72);x.fillStyle='#6a5a48';x.fillRect(4,4,88,56);x.fillStyle='#4a3e30';x.fillRect(4,40,88,20);
 drawFace(x,'bob',40,30,13,{});
 x.fillStyle='#f0ece4';x.beginPath();x.arc(70,30,10,0,7);x.fill();x.fillStyle='#2a4a8a';x.beginPath();x.moveTo(66,24);x.lineTo(68,32);x.lineTo(64,30);x.fill();x.beginPath();x.moveTo(74,24);x.lineTo(76,30);x.lineTo(72,32);x.fill();x.fillStyle='#a8141a';x.fillRect(66,35,8,2);x.fillStyle='#3a4a6a';x.beginPath();x.moveTo(66,21);x.lineTo(74,21);x.lineTo(70,10);x.fill();
 x.fillStyle='#e8e0d0';x.fillRect(62,40,16,16);for(let i=0;i<4;i++){x.fillStyle='#1a1a1a';x.fillRect(64+i*4,44,2,10);}
 for(let i=0;i<5;i++){x.fillStyle='#8a7a68';x.beginPath();x.arc(12+i*6,52,3,0,7);x.fill();}
 x.fillStyle='#2a2018';x.font='8px VT323, monospace';x.fillText('festa 26/10/87',6,68);sepiaCanvas(x,96,72);ageCanvas(x,96,72,{});
 x.strokeStyle='rgba(160,20,20,.8)';x.lineWidth=1.5;x.beginPath();x.arc(70,30,13,0,7);x.stroke();});
const FANS=[];
(function scenery(){
 const P=OFF, hand=(x,y,z,ry,s)=>{const p=plane(.32*(s||1),.32*(s||1),TX_HAND,x,y,z,ry,P);p.material.transparent=true;p.material.depthWrite=false;return p;};
 // marcas de mão queimadas: perto dos fios, do duto e da porta do porão
 hand(-2.605,1.25,-11.7,-Math.PI/2); hand(-15.98,1.1,-25.4,Math.PI/2,1.2); hand(-2.385,2.3,-1.0,Math.PI/2,.8); hand(10.21,1.6,-24.5,-Math.PI/2);
 // porta do porão no depósito, acorrentada
 box(.08,2.3,1.2,0x2a2c30,-15.95,1.15,-26.4,P); box(.1,.08,1.3,0x1a1a1c,-15.93,2.32,-26.4,P);
 for(let i=0;i<9;i++){const l=mesh(new THREE.TorusGeometry(.04,.012,4,8),0x6a6a70,-15.88,.6+i*.09,-26.4+Math.sin(i*1.3)*.25,P);l.rotation.set(0,Math.PI/2,i*.7);}
 box(.06,.18,.12,0x8a7a30,-15.86,1.1,-26.35,P);
 plane(.9,.22,signTex('PORÃO · NÃO ENTRE','#2a0a0a','#e8d8b0',30),-15.9,1.95,-26.4,Math.PI/2,P);
 // foto antiga emoldurada no escritório (o palhaço está nela)
 box(.36,.28,.03,0x3a2410,1.9,1.85,-1.885,P); plane(.3,.22,TX_PHOTO,1.9,1.85,-1.868,0,P);
 // corredores: extintores, bebedouro e luzes de emergência
 [[-4.85,-10],[4.85,-8]].forEach(([x,z])=>{mesh(new THREE.CylinderGeometry(.08,.08,.45,10),0xc0161e,x,.6,z,P);mesh(new THREE.CylinderGeometry(.03,.03,.12,6),0x111111,x,.88,z,P);box(.02,.25,.25,0xe8e0d0,x+(x<0?-.08:.08),1.25,z,P);});
 box(.3,.9,.35,0xb8bcc0,4.8,.45,-12.8,P); box(.32,.06,.37,0x8a8e92,4.8,.92,-12.8,P);
 [[-3.8,-13.9],[3.8,-13.9],[0,-13.9]].forEach(([x,z])=>{box(.3,.12,.08,0xe8e0d0,x,2.65,z+.05,P);const lg=box(.22,.05,.02,0xff3a2a,x,2.62,z+.1,P);lg.material=ps1(new THREE.MeshBasicMaterial({color:0x8a1a10}));});
 // salão: ventiladores de teto, letreiro neon, pratos com pizza
 [[-5,-18.5],[5,-18.5],[0,-21.5]].forEach(([x,z])=>{const f=new THREE.Group();f.position.set(x,3.55,z);P.add(f);mesh(new THREE.CylinderGeometry(.02,.02,.45,6),0x222222,0,.22,0,f);mesh(new THREE.CylinderGeometry(.12,.1,.12,10),0x3a2a1a,0,0,0,f);for(let i=0;i<4;i++){const bl=box(.9,.02,.16,0x5a3a20,0,-.02,0,f);bl.geometry.translate(.5,0,0);bl.rotation.y=i*Math.PI/2;}FANS.push(f);});
 const neon=ps1(new THREE.MeshBasicMaterial({color:0xff3a7a})), neon2=ps1(new THREE.MeshBasicMaterial({color:0x3ad0ff}));
 const tube=(x1,y1,x2,y2,m,zz,xx)=>{const L=Math.hypot(x2-x1,y2-y1);const t=new THREE.Mesh(new THREE.BoxGeometry(.04,L,.04),m);t.position.set(xx,(y1+y2)/2,zz+(x1+x2)/2);t.rotation.x=Math.atan2(x2-x1,y2-y1);P.add(t);};
 [[-.6,1.6,.6,1.6],[-.6,1.6,0,2.8],[.6,1.6,0,2.8]].forEach(([a,b,c,d])=>tube(a,b,c,d,neon,-19,9.97));
 [[-.3,2.0],[.15,2.25],[0,1.85]].forEach(([dz,y])=>{const d=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),neon2);d.position.set(9.96,y,-19+dz);P.add(d);});
 [[-4,-17.2],[4,-17.2],[-4,-20.6],[4,-20.6]].forEach(([x,z],i)=>{mesh(new THREE.CylinderGeometry(.16,.16,.02,12),0xf2f0ea,x-.5,.79,z,P);const sl=mesh(new THREE.ConeGeometry(.12,.02,3),0xe0a040,x-.5,.81,z,P);sl.rotation.y=i;mesh(new THREE.CylinderGeometry(.04,.035,.16,8),[0xe0303f,0x3b6fd6,0xf2b33d][i%3],x+.6,.86,z+.15,P);});
 // fotos de 1983 no salão
 [[-9.98,1.9,-16.2],[-9.98,1.9,-21.8]].forEach(([x,y,z])=>{box(.03,.42,.55,0x3a2410,x,y,z,P);const p=plane(.48,.36,TEX.pBobs83,x+.025,y,z,Math.PI/2,P);});
 // cozinha: brasa do forno
 const ember=new THREE.Mesh(new THREE.PlaneGeometry(.9,.3),ps1(new THREE.MeshBasicMaterial({color:0xff6a1a})));ember.position.set(14.6,2.36,-24.0);P.add(ember);
 // depósito: placa velha da Bob's caída
 const old=plane(1.4,.35,signTex("BOB'S PIZZARIA",'#3a1a0a','#c8a050',38),-13.2,.35,-27.6,0,P); old.rotation.set(-.9,0,.15);
})();
const monitorScreen=new THREE.Mesh(new THREE.PlaneGeometry(.4,.26),ps1(new THREE.MeshBasicMaterial({color:0x2a7a32})));
monitorScreen.position.set(-.5,1.0,.185); OFF.add(monitorScreen);
const fanBlades=new THREE.Group(); fanBlades.position.set(.75,1.08,.25); OFF.add(fanBlades);
mesh(new THREE.CylinderGeometry(.03,.08,.28,6),0x333333,.75,.94,.22,OFF);
for(let i=0;i<4;i++){const b=box(.05,.2,.01,0x777777,0,.1,0);const p=new THREE.Group();p.add(b);p.rotation.z=i*Math.PI/2;fanBlades.add(p);}
const noseMesh=mesh(new THREE.SphereGeometry(.035,8,6),0x111111,-1.65,1.465,-1.86,OFF);
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
const rtCam=new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat});
const camPostMat=postMat.clone(); camPostMat.uniforms.tDiffuse.value=rtCam.texture;
const camPostScene=new THREE.Scene(); const camQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),camPostMat); camQuad.frustumCulled=false; camPostScene.add(camQuad);
let camRectKey='';
/* desenha a câmera só dentro da tela do tablet, por cima do escritório */
function renderTablet(t){
 const r=$('#camScreen').getBoundingClientRect(); if(r.width<20||!ROOMS[g.cam]) return;
 const W=innerWidth,H=innerHeight, x=Math.round(r.left), y=Math.round(H-r.bottom), w=Math.round(r.width), h=Math.round(r.height);
 const key=w+'x'+h;
 if(key!==camRectKey){camRectKey=key;const rh=200,rw=Math.max(2,Math.round(rh*w/h));rtCam.setSize(rw,rh);camPostMat.uniforms.res.value.set(rw,rh);Object.values(ROOMS).forEach(R=>{R.cam.aspect=w/h;R.cam.updateProjectionMatrix();});}
 const shv=bots.shocker.visible; bots.shocker.visible=false;
 renderer.setRenderTarget(rtCam); renderer.render(scene,ROOMS[g.cam].cam); renderer.setRenderTarget(null);
 bots.shocker.visible=shv;
 const U=camPostMat.uniforms; U.time.value=t; U.cctv.value=1; U.grain.value=g.staticBurst>0?1.25:.14; U.flash.value=0;
 renderer.setViewport(x,y,w,h); renderer.setScissor(x,y,w,h); renderer.setScissorTest(true);
 renderer.render(camPostScene,postCam);
 renderer.setScissorTest(false); renderer.setViewport(0,0,W,H);
}
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
 zig:{fur:0xb08860,fur2:0xb08860,jersey:0xc8203a,stripe:0x1a0e10,feet:'paw',hair:0xc01a4a,eye:0xff3040,num:'66',lid:.3},
 bob:{fur:0x7a1a1e,fur2:0x9a6a5a,jersey:0x5a1418,stripe:0x140a0a,feet:'paw',hair:0x7a1a1e,eye:0xff2a1a,num:'00',lid:.15}
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
  const sh=new THREE.Group(); sh.rotation.order='YZX'; sh.position.set(s*.45*tw,.5,0); torso.add(sh);
  S(.088,J,0,0,0,sh);
  LA([[0,-.29],[.112*tw,-.29],[.118*tw,-.24],[.124*tw,-.12],[.13*tw,-.04],[.11*tw,0],[0,0]],JER,0,0,0,sh);
  [-.2,-.245].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.122*tw,.012,4,14),STR);r.rotation.x=Math.PI/2;r.position.y=y;sh.add(r);});
  const pt=add(new THREE.CylinderGeometry(.045,.045,.01,10),STR,s*.122*tw,-.1,0,sh); pt.rotation.z=Math.PI/2;
  const el=new THREE.Group(); el.position.y=-.33; sh.add(el);
  S(.066,J,0,0,0,el); C(.032,.032,.1,J,0,-.05,0,el,8);
  const al=type==='zig'?.38:.3;
  const withered=type==='bob'&&s<0;
  if(withered){C(.018,.018,al,J,-.03,-.03-al/2,0,el,6);C(.018,.018,al,J,.03,-.03-al/2,0,el,6);for(let i=0;i<3;i++)limb([-.03,-.08-i*.09,0],[.03,-.12-i*.09,0],.01,.01,J,el,4);}
  else LA(limbProf(al,.09*tw,.105*tw,.08*tw),type==='toco'?F2:F,0,-.03,0,el);
  if(type==='bruna'||type==='zig') fringe(el,-.03,.09,9,.18,type==='zig'?bm(D.hair):F2,true);
  if(type==='toco') fringe(el,-.03,.09,8,.14,F,true,.8);
  const wr=new THREE.Group(); wr.position.y=-.06-al; wr.scale.setScalar(1.15); el.add(wr);
  S(.05,J,0,0,0,wr);
  const HM=type==='toco'?F2:(withered?J:F);
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
 } else if(type==='bob'){
  S(.27,F,0,0,0,head,18,14);
  const mz=S(.14,F2,0,-.08,.2,head); mz.scale.set(1,.75,1.1);
  const ns=S(.045,bm(0x111111,true),0,-.02,.36,head,12,10); ns.scale.set(1.35,1,1);
  const e=S(.12,F,.26,-.03,-.02,head);e.scale.set(.42,1.45,.95);e.rotation.z=.5;
  const stub=C(.035,.03,.1,J,-.25,.14,-.02,head,6); stub.rotation.z=.9;
  for(let i=0;i<3;i++) limb([-.28,.17,-.02],[-.33-i*.03,.02-i*.05,.02+i*.02],.006,.006,bm(0x111111),head,4);
  eye(-.1,.06,.21,.066,D.eye,0x0c0e18,D.fur);
  const so=S(.09,bm(0x030202),.1,.06,.2,head); so.scale.set(1,.92,.45);
  S(.012,ps1(new THREE.MeshBasicMaterial({color:0x5a0a0a,fog:false})),.1,.06,.235,head,6,4);
  [[.13,.17,.21],[-.04,.22,.18],[.18,-.05,.17]].forEach(([x,y,z])=>{const r=S(.05,bm(0x241414),x,y,z,head);r.scale.set(1.3,.7,.35);});
  const mo=S(.08,DARK,0,-.16,.22,head); mo.scale.set(1.2,.65,1); teeth(8,.17,-.155,.33,true,head,true);
  jaw.position.set(0,-.17,.15); const lj=S(.09,F2,0,-.02,.08,jaw); lj.scale.set(1.12,.33,1.12); teeth(8,.15,.01,.16,false,jaw,true);
  [-1,1].forEach(s2=>limb([s2*.1,.05,-.02],[s2*.09,-.03,.08],.01,.01,J,jaw,4));
  [[.15,.32,.26],[-.18,.2,.25],[.05,.12,.27],[-.1,.42,.24]].forEach(([x,y,z])=>{const h=S(.07,bm(0x0a0606),x,y,z,torso);h.scale.set(1.2,1,.3);});
  for(let i=0;i<5;i++) limb([-.12+i*.06,.2,.25],[-.14+i*.07,-.12-i*.04,.29],.007,.007,bm(0x111111),torso,4);
  tail=new THREE.Group(); tail.position.set(0,.02,-.22); hips.add(tail);
  C(.03,.03,.14,J,0,.06,-.03,tail,6).rotation.x=-.6;
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
 const jaw0={xinglau:.32,fernanda:.4,bruna:.38,toco:.32,sandega:.28,zig:.34,bob:.62}[type];
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
  const sh=new THREE.Group(); sh.rotation.order='YZX'; sh.position.set(s*.44,.5,0); torso.add(sh);
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

/* alma do Shocker: silhueta preta cheia de faíscas, sem olhos de boneco */
function makeShocker(){
 const G=new THREE.Group(), blk=ps1(new THREE.MeshBasicMaterial({color:0x020204}));
 const add=(geo,x,y,z)=>{const m=new THREE.Mesh(geo,blk);m.position.set(x,y,z);G.add(m);return m;};
 add(new THREE.CylinderGeometry(.19,.12,.95,7),0,1.4,0).scale.z=.55;
 add(new THREE.SphereGeometry(.2,8,6),0,2.08,0).scale.set(.8,1.2,.8);
 [-1,1].forEach(s=>{limb([s*.22,1.82,0],[s*.33,1.0,.05],.04,.03,blk,G,5);limb([s*.33,1.0,.05],[s*.36,.45,.14],.03,.015,blk,G,5);limb([s*.09,.93,0],[s*.12,0,.02],.055,.035,blk,G,5);});
 const em=ps1(new THREE.MeshBasicMaterial({color:0xdff4ff,fog:false}));
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),em);e.position.set(s*.07,2.1,.15);G.add(e);});
 const arcs=[], lm=new THREE.LineBasicMaterial({color:0x9ad0ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,fog:false});
 for(let i=0;i<7;i++){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24),3));const l=new THREE.Line(geo,lm);l.frustumCulled=false;G.add(l);arcs.push(l);}
 G.userData={type:'shocker',shocker:true,arcs,base:1,pupils:[]};
 return G;
}
function shockerArcs(b){b.userData.arcs.forEach(l=>{const p=l.geometry.attributes.position;let x=(Math.random()-.5)*.6,y=.2+Math.random()*2,z=(Math.random()-.5)*.3;for(let k=0;k<8;k++){p.setXYZ(k,x,y,z);x+=(Math.random()-.5)*.2;y+=(Math.random()-.5)*.22;z+=(Math.random()-.5)*.12;}p.needsUpdate=true;l.visible=Math.random()<.65;});}
function makeAny(id){if(id==='shocker')return makeShocker();if(id==='clown'||id==='clown2')return makeClown();if(id==='wbob')return makeBot2('bob');return DESIGN[id]?makeBot2(id):makeBot(id);}
const bots={};
[...ALL,'clown','clown2','wbob','golden','shadow','shocker'].forEach(id=>{bots[id]=makeAny(id);bots[id].visible=false;scene.add(bots[id]);});
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
const MUSIC_MODES=['menu','extras','intro','custom','settings','credits'];
function setMode(m,screen){
 if(m!=='intro') stopIntro();
 if(m!=='game'){clearToast();clearAlarm();}
 mode=m; show(screen||m);
 if(MUSIC_MODES.includes(m)) sloop('menu',.55); else sunloop('menu',.6);
 if(!['game','jumpscare','extras','day','mini','cut','settings','credits'].includes(m)){amb.intensity=.3;layoutMenu();if(typeof TARP_UP!=='undefined'){TARP_UP.visible=false;TARP_DOWN.visible=false;}}
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
 $('#stars').textContent=(save.n6?'★':'')+(save.won6?'★':'')+(save.max?'★':'')+(save.wbWin?'★':'');
 $('#stars').title=['★ venceu a semana','★ derrotou o Sr. Gargalhada','★ Noite personalizada no máximo','★ sobreviveu ao Withered BOB'].filter((x,i)=>[save.n6,save.won6,save.max,save.wbWin][i]).join('\n');
 $('#stars').title=[save.n6&&'★ Sobreviveu à semana',save.won6&&'★ Venceu o Sr. Gargalhada',save.max&&'★ Todos no 20',save.wbWin&&'★ Sobreviveu ao Withered BOB'].filter(Boolean).join('\n');
}
function hideBots(){Object.values(bots).forEach(b=>b.visible=false);}
function putBot(id,x,y,z,s,lx,lz){const b=bots[id];b.rotation.order='YXZ';b.visible=true;b.position.set(x,y,z);b.scale.setScalar((s||1)*b.userData.base);b.lookAt(lx,y,lz);b.rotation.x=0;b.userData.walk=false;b.userData.sit=false;b.userData.pose='idle';}
function layoutMenu(){
 hideBots();
 const c=menuCam.position;
 [['xinglau',-3,-25.8],['bruna',-1,-26.3],['toco',1,-26.3],['sandega',3,-25.8],['fernanda',5,-25],['zig',-5,-25]].forEach(([id,x,z],i)=>{putBot(id,x,.6,z,1,c.x,c.z);bots[id].userData.pose='perform';bots[id].userData.ph=i*.7;});
 if(save.n6) putBot('clown',0,.6,-27.4,1,c.x,c.z);
 if(Math.random()<.1) putBot('golden',-6.8,0,-22.6,1,c.x,c.z);
}
let IT={ring:null,auto:null,type:null,clock:null,nodes:[],idx:0,answered:false,secs:0};
function stopIntro(){staticStop();clearInterval(IT.ring);clearTimeout(IT.auto);clearInterval(IT.type);clearInterval(IT.clock);IT.ring=IT.auto=IT.type=IT.clock=null;$('#phone').classList.remove('ringing','talking');}
function openIntro(n){
 curNight=n; audio(); stopIntro();
 const wbI=isWBNight(n);
 $('#introNight').textContent=wbI?'20/20':'NOITE '+n;
 $('#introSub').textContent=wbI?'Withered BOB':(n===6?'Batalha final':(n===7?'Personalizada':'12:00 AM'));
 const box=$('#introCall'); box.innerHTML=wbI?CALLS.wb:CALLS[n];
 const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT); IT.nodes=[]; let nd;
 while((nd=w.nextNode())){IT.nodes.push([nd,nd.textContent]);nd.textContent='';}
 IT.idx=0; IT.answered=false; IT.secs=0;
 $('#phName').textContent=wbI?'DESCONHECIDO':(n===7?'GERÊNCIA':'VALDIR');
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
 staticStart(.005); IT.lastIdx=-1;
 IT.clock=setInterval(()=>{IT.secs++;$('#phTime').textContent='00:'+String(IT.secs).padStart(2,'0');},1000);
 let n=0;
 IT.type=setInterval(()=>{
  for(let k=0;k<2;k++){
   while(IT.idx<IT.nodes.length&&IT.nodes[IT.idx][0].textContent.length>=IT.nodes[IT.idx][1].length) IT.idx++;
   if(IT.idx>=IT.nodes.length){finishCall();return;}
   const [node,full]=IT.nodes[IT.idx]; if(IT.idx!==IT.lastIdx){IT.lastIdx=IT.idx;if(/est[aá]tica|sinal|chiado/i.test(full)){staticBurst(.7,.09);staticSet(.025);setTimeout(()=>staticSet(.005),900);}} node.textContent=full.slice(0,node.textContent.length+1);
  }
  if((n++)%2===0) sfx.blip();
  const b=$('#introCall'); b.scrollTop=b.scrollHeight;
 },32);
}
function finishCall(){
 clearInterval(IT.type); IT.type=null; IT.nodes.forEach(([nd,f])=>nd.textContent=f); IT.idx=IT.nodes.length; setTimeout(()=>{if(mode==='intro'){tone(480,.15,'square',.05);staticStop();}},600);
 $('#bStart').classList.remove('hidden');
 setTimeout(()=>{if(mode==='intro'&&IT.answered){$('#phStatus').textContent='chamada encerrada';clearInterval(IT.clock);$('#phone').classList.remove('talking');}},600);
}
let gJS={t:-1,pose:0};
function lockedChar(id){return (id==='clown'&&!save.n6)||(id==='golden'&&!save.seenGolden)||(id==='wbob'&&!save.wbSeen)||(id==='shocker'&&!save.shockerSeen);}
function buildExtras(){
 const L=$('#exList'); L.innerHTML='';
 [...ALL,'clown','wbob','golden','shocker'].forEach(id=>{
  const locked=lockedChar(id);
  const b=document.createElement('button'); b.className='exb'+(id===gSel?' on':''); b.style.setProperty('--c',CHARS[id].color);
  b.textContent=locked?'???':CHARS[id].name; b.onclick=()=>{gSel=id;gJS.t=-1;buildExtras();};
  L.appendChild(b);
 });
 const locked=lockedChar(gSel), ch=CHARS[gSel];
 $('#exName').textContent=locked?'???':ch.name; $('#exName').style.color=ch.color;
 $('#exSp').textContent=locked?(gSel==='clown'?'Termine a Noite 5 para revelar':(gSel==='wbob'?'Coloque todos no 20 na Noite personalizada':(gSel==='shocker'?'Você precisa vê-lo. Ele quase nunca aparece.':'Um segredo raro. Continue jogando.'))):ch.sp;
 $('#exDef').innerHTML=locked?'':'<b>Defesa:</b> '+fmtKeys(ch.how);
 $('#exBio').textContent=locked?'':ch.bio;
 $('#bJs').disabled=locked||gSel==='shocker'; $('#bPose').disabled=locked||gSel==='shocker';
 Object.values(gBots).forEach(b=>b.visible=false);
 if(!gBots[gSel]){gBots[gSel]=makeAny(gSel);gBots[gSel].position.y=.12;gScene.add(gBots[gSel]);}
 const gb=gBots[gSel]; gb.visible=true; gb.position.set(0,.12,0);
 gb.traverse(o=>{if(o.isMesh&&o.material&&o.material!==SHADOW_MAT){if(locked){if(!o.userData.orig){o.userData.orig=o.material;}o.material=mat(0x000000);}else if(o.userData.orig){o.material=o.userData.orig;}}});
 if(mode!=='extras') setMode('extras');
}
const POSTERS=[['pBobs83',"Bob's Pizzaria (1983)"],['poster','Festa do BOB'],['news','Jornal de 1987'],['celebrate','Liga Mistério'],['pBruna','Show de Mágica'],['pSandega','Devagar e Sempre'],['pXinglau','Capitão do Time'],['pToco','Melhor Amigo'],['pFernanda','Voe Alto!'],['pZig','Gira-Gira!'],['pBobOld','BOB 1983-1987'],['smile','Sorria'],['job','Classificados'],['rules','Regras'],['kids','Desenhos das crianças'],['pShock','Perigo: alta tensão']];
function buildPosters(){
 const G=$('#posterGrid'); G.innerHTML='';
 const list=POSTERS.map(([k,c])=>({src:TEX[k].image.toDataURL(),cap:c}));
 const rare=ctex(160,200,x=>drawPoster(x,true));
 list.push(save.seenGolden?{src:rare.image.toDataURL(),cap:'SOU EU'}:{src:rare.image.toDataURL(),cap:'???',locked:true});
 list.forEach(p=>{const f=document.createElement('figure');if(p.locked)f.className='locked';f.innerHTML=`<img src="${p.src}" alt=""><figcaption>${p.cap}</figcaption>`;if(!p.locked)f.onclick=()=>{$('#posterView img').src=p.src;$('#posterView .cap').textContent=p.cap;$('#posterView').classList.remove('hidden');};G.appendChild(f);});
}
document.querySelectorAll('.exTabs button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.exTabs button').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.exTab').forEach(x=>x.classList.toggle('on',x.id==='tab-'+b.dataset.tab));
 $('#extras').classList.toggle('wide',b.dataset.tab!=='chars');
 if(b.dataset.tab==='posters') buildPosters();
 if(b.dataset.tab==='mini') buildMiniList();
 if(b.dataset.tab==='news') buildNews(0);
 if(b.dataset.tab==='ctrl') buildCtrlBox();
});
$('#posterView').onclick=()=>$('#posterView').classList.add('hidden');
$('#bJs').onclick=()=>{if(lockedChar(gSel))return;gJS.t=0;play('jumpscare',{vol:.9,dur:1.6});};
$('#bPose').onclick=()=>{gJS.pose=(gJS.pose+1)%4;};
$('#bDay').onclick=()=>startDay();
/* jornais: pistas sutis sobre o que aconteceu */
const NEWS=[
 {tab:'1983',date:'Sábado, 12 de março de 1983',head:'Antiga subestação vira pizzaria para crianças',deck:'Prédio abandonado há uma década ganha vida nova com mascote animatrônico',photo:'bob',cap:'BOB, o cachorro animatrônico, na inauguração.',
  body:['O prédio da antiga subestação de energia da Rua 87, fechado desde 1973, reabriu ontem como a <b>Bob\'s Pizzaria</b>. O dono, Roberto Albuquerque, investiu as economias da família na reforma.','A atração principal é o BOB, um cachorro vermelho de dois metros que canta e conversa com as crianças. "Ele parece vivo", disse uma mãe presente.','Durante a reforma, os operários relataram que a fiação antiga <span class="np-u">continuava estalando mesmo com a energia cortada</span>. A empresa de energia afirmou que o prédio está desligado da rede há anos.','Roberto riu da história. "Prédio velho faz barulho. O BOB vai espantar qualquer fantasma."'],
  side:'CLASSIFICADOS · Procura-se animador de festas. Palhaço, com experiência. Tratar na Bob\'s Pizzaria.'},
 {tab:'1987',date:'Terça-feira, 27 de outubro de 1987',head:"Bob's Pizzaria fecha após tragédia em festa",deck:'Curto-circuito durante aniversário deixa um morto; testemunhas divergem',photo:'none',cap:'',
  body:['Uma festa de aniversário terminou em tragédia na noite de anteontem na Bob\'s Pizzaria. Segundo a perícia, um curto-circuito fez estourar todas as lâmpadas do salão ao mesmo tempo.','Um funcionário de 34 anos, que animava as festas fantasiado de palhaço, morreu no local. A polícia não divulgou o nome nem a causa exata da morte.','Pais presentes contam versões diferentes. Uma testemunha afirmou que, segundos antes do apagão, o mascote BOB <span class="np-u">"virou a cabeça para o lado errado"</span>. Outra disse ter ouvido o boneco rir. A perícia descartou falha mecânica.','O dono, Roberto Albuquerque, fechou o estabelecimento e não quis falar com a reportagem. Vizinhos dizem que as luzes do prédio continuaram piscando durante toda a madrugada.'],
  side:'A família do funcionário pede que quem tiver fotos da festa entre em contato. Nenhuma foi encontrada até agora.'},
 {tab:'2016',date:'Domingo, 6 de novembro de 2016',head:'Pizzaria do BOB reabre com banda nova',deck:'Neto do fundador reforma o prédio e aposta na Liga Mistério',photo:'liga',cap:'A Liga Mistério: seis animatrônicos de camisa de time.',
  body:['Quase trinta anos depois de fechar, o prédio da antiga Bob\'s Pizzaria reabriu ontem como <b>Pizzaria do BOB</b>. O neto do fundador comandou a reforma e apresentou a nova atração: a Liga Mistério.','"Meu avô sonhava em reabrir. Eu só terminei o que ele começou", disse o empresário. O avô, Roberto, morreu em 2015.','Questionado sobre o porão, que segundo funcionários permanece trancado, o neto foi breve: "Lá embaixo só tem material velho da Bob\'s. Nada de mais."','A pizzaria contrata vigia noturno. Segundo o anúncio, o turno vai da meia-noite às seis.'],
  side:'Moradores do quarteirão reclamam de <span class="np-u">quedas de energia sempre às 3 da manhã</span> desde a reinauguração.'},
 {tab:'2019',date:'Quinta-feira, 17 de outubro de 2019',head:'Bairro sofre com apagões; causa é desconhecida',deck:'Companhia de energia não encontra defeito na rede',photo:'none',cap:'',
  body:['Pela terceira semana seguida, o quarteirão da Rua 87 ficou sem luz durante a madrugada. Técnicos da companhia de energia vistoriaram os postes e não encontraram nenhum defeito.','"É como se alguma coisa puxasse a energia de uma vez só", disse um técnico, que pediu para não ser identificado. Segundo ele, os medidores da Pizzaria do BOB registraram consumo durante os apagões, mesmo com o disjuntor geral desligado.','Um antigo operário da subestação, hoje com 81 anos, disse à reportagem que "isso sempre aconteceu ali". Perguntado sobre o que queria dizer, ele mudou de assunto.'],
  side:'OBITUÁRIO · Valdir Souza, 62 anos, ex-vigia. A família agradece as mensagens.'}
];
function buildCtrlBox(){const K=a=>'<kbd>'+keyName(SET.binds[a])+'</kbd>';$('#ctrlBox').innerHTML=`<h3>Controles</h3><p>${K('doorL')} / ${K('doorR')} portas esquerda e direita</p><p>Segure ${K('hall')} lanterna do corredor · segure ${K('vent')} lanterna do duto</p><p>${K('cams')} abre e fecha o tablet (dá para usar a lanterna junto) · <kbd>1</kbd>–<kbd>8</kbd> troca de câmera</p><p>${K('light')} luz da câmera · ${K('shock')} choque (Noite 6) · segure ${K('crank')} para rebobinar o Zig (CAM 3)</p><p>Segure ${K('mask')} máscara · <kbd>←</kbd> <kbd>→</kbd> ou arrastar para olhar · <kbd>Esc</kbd> pausa</p><p><kbd>Ctrl</kbd> + <kbd>N</kbd> pula a noite (Chrome: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd>)</p><p style="color:var(--dim)">Mude as teclas em Configurações.</p>`;}
function buildNews(i){
 i=i||0; const P=$('#newsPick'); P.innerHTML='';
 NEWS.forEach((n,k)=>{const b=document.createElement('button');b.textContent=n.tab;b.className=k===i?'on':'';b.onclick=()=>buildNews(k);P.appendChild(b);});
 const n=NEWS[i];
 $('#newsPaper').innerHTML=`<div class="np-mast"><h1>DIÁRIO DA CIDADE</h1><div><span>${n.date}</span><span>Edição local</span></div></div><div class="np-head">${n.head}</div><div class="np-deck">${n.deck}</div><div class="np-cols">${n.photo!=='none'?'<div class="np-photo"><canvas width="160" height="100" id="npCv"></canvas>'+n.cap+'</div>':''}${n.body.map(p=>'<p>'+p+'</p>').join('')}<div class="np-side">${n.side}</div></div>`;
 const cv=$('#npCv'); if(cv){const x=cv.getContext('2d');x.fillStyle='#8a7a68';x.fillRect(0,0,160,100);x.fillStyle='#5a4a3a';x.fillRect(0,64,160,36);
  if(n.photo==='bob') drawFace(x,'bob',80,46,30,{});
  else ['sandega','bruna','fernanda','xinglau','toco','zig'].forEach((f,k)=>drawFace(x,f,16+k*26,50,11,{}));}
}
function buildMiniList(){const L=$('#miniList');L.innerHTML='';MINIS.forEach((m,i)=>{const ok=miniUnlocked(i);if(m.secret&&!ok)return;const b=document.createElement('button');b.disabled=!ok;b.innerHTML=ok?`🕹 ${m.secret?'★':i+1}. ${m.title} ${m.sub}<small>${m.year} · jogando com ${m.hero==='bob'?'BOB':CHARS[m.hero].name}</small>`:`🔒 ${i+1}. ???<small>vença a Noite ${i+1} para liberar</small>`;if(ok)b.onclick=()=>startMini(i,()=>{buildExtras();document.querySelector('.exTabs button[data-tab="mini"]').click();});L.appendChild(b);});}
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
/* mapa de verdade da pizzaria, desenhado a partir da planta do nível */
const MAP_ROOMS=[[-10,10,-28,-14.2,'SALÃO'],[10.2,16,-26,-16,'COZINHA'],[-16,-10.2,-28,-22,'DEPÓSITO'],[-16,-10.2,-20,-14.4,'BRINQUEDOS'],[5.2,12,-14,-8,'RECEPÇÃO'],[-5,-2.6,-14.2,2,''],[2.6,5,-14.2,2,''],[-.8,.8,-14.2,-2.1,'']];
const mx=x=>(x+16.6)*9, mz=z=>(z+28.6)*9;
(function buildMap(){
 const NS='http://www.w3.org/2000/svg', svg=$('#mapSvg');
 const el=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));(parent||svg).appendChild(e);return e;};
 MAP_ROOMS.forEach(([x1,x2,z1,z2,n])=>{el('rect',{x:mx(x1),y:mz(z1),width:(x2-x1)*9,height:(z2-z1)*9,class:'room'});if(n){const t=el('text',{x:mx((x1+x2)/2),y:mz(z1)+11,'text-anchor':'middle',class:'rlbl'});t.textContent=n;}});
 el('rect',{x:mx(-6.4),y:mz(-28),width:12.8*9,height:4.4*9,class:'stage'});
 el('line',{x1:mx(-1.8),y1:mz(-14),x2:mx(-1.8),y2:mz(-2.1),class:'duct'});
 el('rect',{x:mx(-2.4),y:mz(-1.9),width:4.8*9,height:3.9*9,class:'office'});
 const you=el('text',{x:mx(0),y:mz(.6),'text-anchor':'middle',class:'you'}); you.textContent='VOCÊ';
 Object.keys(CAMDEF).forEach(k=>{
  const d=CAMDEF[k], gx=mx(d.pos[0]), gy=mz(d.pos[2]);
  const g=el('g',{class:'camMk','data-cam':k});
  el('line',{x1:gx,y1:gy,x2:gx+(d.look[0]-d.pos[0])*1.2,y2:gy+(d.look[2]-d.pos[2])*1.2,stroke:'#6ac05a','stroke-width':1,opacity:.5},g);
  el('rect',{x:Math.min(Math.max(gx-17,1),265),y:Math.min(Math.max(gy-8,1),266),width:34,height:15,rx:2},g);
  const t=el('text',{x:Math.min(Math.max(gx,18),282),y:Math.min(Math.max(gy+4,13),278),'text-anchor':'middle'},g); t.textContent='CAM '+k;
  g.addEventListener('click',()=>setCam(+k));
 });
})();

/* ================= GAME ================= */
let g=null;
const holds=new Set();
const has=a=>holds.has(a+':k')||holds.has(a+':p');
let yaw=0,yawT=0,pitch=-.04,edgeV=0;
const keysLook={left:false,right:false};
function newMover(path,level){return {path,i:0,from:0,to:0,prog:0,len:0,state:'idle',timer:MOVE_INT*(1+Math.random()),level,yaw:0,approach:false,time:0,hold:0};}
function isWBNight(n){return n===7&&ALL.every(id=>save.custom[id]>=20);}
function startNight(n){
 audio(); stopSix(); curNight=n;
 const wbMode=isWBNight(n);
 const lv=wbMode?{sandega:0,bruna:0,fernanda:0,xinglau:0,toco:0,zig:0}:(n===7?save.custom:(n===6?null:LEVELS[n]));
 g={night:n,boss:n===6,t:0,power:100,doors:{l:false,r:false},doorY:{l:3.5,r:3.5},heat:{l:0,r:0},jam:{l:0,r:0},cams:false,cam:1,flash:null,mask:false,powerOut:false,outTimer:0,mbT:0,over:false,chars:{},bossS:null,staticBurst:0,toastT:0,rare:null,flick:0,lastApproach:-99,crankT:0,spin:0,camLight:false,shake:0,lowP:0,wb:null};
 WALKERS.forEach(id=>{g.chars[id]=newMover(PATHS[id],lv?lv[id]:0);});
 const zl=lv?lv.zig:0;
 g.zig=Object.assign(newMover(PATHS.zig,zl),{on:zl>0,meter:100,drain:zl*.085,warned:0});
 if(g.boss) g.bossS={hp:BOSS_HP,atks:[],cd:4.5,last:null,phase:1,hb:0};
 if(wbMode){g.wb={state:'away',t:6,spot:null,time:0,hold:0,last:null,hour:0,count:0};save.wbSeen=true;persist();}
 if(!g.boss&&!wbMode&&Math.random()<.35){const types=['golden','shadow','poster'];g.rare={type:types[Math.floor(Math.random()*3)],at:60+Math.random()*360,active:false,done:false,t:0,look:0,cam:[1,2,4,5,6,8][Math.floor(Math.random()*6)],seen:false};}
 drawPoster(TEX.poster.userData.ctx,false); TEX.poster.needsUpdate=true;
 holds.clear(); yaw=yawT=0;
 doorL.position.y=doorR.position.y=3.5;
 lamp.intensity=1.1; amb.intensity=.3; redL.intensity=redR.intensity=.9; monitorScreen.material.color.setHex(0x2a7a32);
 $('#bossBar').classList.toggle('hidden',!g.boss);
 $('#shockBtn').classList.toggle('hidden',!g.boss);
 $('#camsUI').classList.add('hidden');
 $('#nightLbl').textContent=wbMode?'WITHERED BOB':'Noite '+n;
 TARP_UP.visible=(n===4||n===5); TARP_DOWN.visible=(n===6||n===7); TARP_UP.scale.set(1,1,1); TARP_UP.position.set(0,0,0);
 g.stats={rep:0,cranks:0};
 g.shock=(!g.boss&&Math.random()<.12)?{at:50+Math.random()*340,state:'wait',spot:null,t:0,seenT:0}:null; g.ambT=12+Math.random()*10;
 clownLight.color.setHex(0xff4a3a); clownLight.distance=5;
 buzzStart(); if(g.boss) musicStart('clown'); else if(wbMode) musicStart('wb');
 $('#danger').style.opacity=0; $('#itsme').classList.remove('on');
 setMode('game');
 sloop('fan',.32);
 if(g.boss) toast('Ele está acordando...');
 if(wbMode) setTimeout(()=>{if(g&&g.wb&&!g.over)alarm('ELE ESTÁ SOLTO','danger','sobreviva até as 6');},1500);
 if(n===1&&!save.tut){const K=a=>keyName(SET.binds[a]);const gg=g;[[2,'Olhe ao redor com o mouse nas bordas ou arrastando a tela'],[8,'Portas: '+K('doorL')+' e '+K('doorR')+'. Elas gastam energia!'],[14,'Abra o tablet de câmeras com '+K('cams')+'. Fique de olho na Sandega'],[20,'Na CAM 3, segure '+K('crank')+' para rebobinar a cadeira do Zig'],[26,'Esc pausa o jogo. Boa sorte.']].forEach(([t,m])=>setTimeout(()=>{if(g===gg&&!g.over)toast(m);},t*1000));save.tut=true;persist();}
}
let outMusH=null;
function endNightAudio(){sunloop('fan',.3);sunloop('breath',.2);staticStop();buzzStop();musicStop();if(outMusH){outMusH.stop(.8);outMusH=null;}}
function usage(){return 1+(g.doors.l?1:0)+(g.doors.r?1:0)+(g.cams?1:0)+(g.flash?1:0)+(g.zig.cranking?1:0)+(g.cams&&g.camLight?1:0);}

function update(dt){
 g.t+=dt;
 const maskWant=has('mask');
 if(maskWant&&g.cams) closeCams();
 if(maskWant!==g.mask){g.mask=maskWant; if(g.mask){play('maskOn');sloop('breath',.55);}else{sunloop('breath',.25);play('maskOn',{vol:.5,rate:1.2});}}
 let f=null;
 if(!g.mask&&!g.powerOut){if(has('hall'))f='hall';else if(has('vent'))f='vent';}
 if(f!==g.flash){if(!!f!==!!g.flash) play('flash',{vol:.8}); g.flash=f;}
 if(g.boss){
  ['l','r'].forEach(s=>{
   if(g.jam[s]>0){g.jam[s]-=dt;return;}
   if(g.doors[s]){g.heat[s]+=dt*(g.bossS&&g.bossS.phase===3?1.3:1);if(g.heat[s]>=5){g.doors[s]=false;g.jam[s]=3;g.heat[s]=0;sfx.jam();play('doorOpen',{dur:1,vol:.7});alarm('PORTA '+(s==='l'?'ESQUERDA':'DIREITA')+' SUPERAQUECEU','warn','ela volta a funcionar em 3 segundos');}}
   else g.heat[s]=Math.max(0,g.heat[s]-dt*1.5);
  });
 }
 if(!g.powerOut){
  g.power-=usage()*.065*(1+.05*(Math.min(g.night,5)-1))*(g.night===7?1.1:1)*(g.boss?.9:1)*dt;
  if(g.power<=0){g.power=0;powerOutStart();}
  else if(g.power<8&&g.lowP<2){g.lowP=2;alarm('ENERGIA CRÍTICA','danger','desligue tudo que puder');}
  else if(g.power<20&&g.lowP<1){g.lowP=1;alarm('ENERGIA BAIXA','warn','economize portas, câmeras e lanterna');}
 } else {
  g.outTimer-=dt; g.mbT-=dt;
  if(g.mbT<=0){sfx.musicBox();g.mbT=5.6;}
  if(g.outTimer<=0){jumpscare(g.boss?'clown':(g.wb?'wbob':'toco'));return;}
 }
 if(!g.boss&&g.t>=HOUR_LEN*6){winNight();return;}
 if(g.staticBurst>0) g.staticBurst-=dt;
 if(g.cams) staticSet(g.staticBurst>0?.04:.006);
 buzzSet(g.powerOut?0:(g.flick>0?.03*Math.random():.012));
 g.ambT-=dt; if(g.ambT<=0){g.ambT=14+Math.random()*18;if(!g.powerOut)ambientEvent();}
 if(TARP_UP.visible&&g.night===5){TARP_UP.position.z=Math.min(.6,g.t/HOUR_LEN*.1);if(Math.random()<dt*.25){TARP_UP.scale.y=1.03;setTimeout(()=>TARP_UP.scale.y=1,120);}}
 if(TARP_UP.visible&&g.cams&&g.cam===6&&Math.random()<dt*.15) noise(.5,.08,500,'bandpass',-.6);
 updateRare(dt);
 if(g.over) return;
 if(g.boss){updateBoss(dt);return;}
 updateWalkers(dt); if(g.over) return;
 stepSounds(dt);
 updateZig(dt); if(g.over) return;
 if(g.wb) updateWB(dt);
 updateShocker(dt);
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
 if(g.t-g.lastApproach<(g.night>=5?3:4)) return false;
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
      c.state='atk'; c.time=(ATK[g.night]||8)+(others>0?3:0); c.hold=0; c.approach=false; stopAt(c); arriveSfx(id); edgeFlash(D.spot); break;
     }
     if(P[c.i].w){if(id==='fernanda'&&P[c.i].s<1&&P[c.i-1].s>=1)play('vent',{pan:-.45,vol:.5,dur:2.5});startWalk(c,1);continue;}
     c.state='idle'; stopAt(c); break;
    } else {
     if(c.i<=D.back&&!P[c.i].w){c.state='idle';c.timer=COOLDOWN*(g.night===5||g.wb?.7:(g.night===4?.85:1))*(.8+Math.random()*.4);stopAt(c);break;}
     startWalk(c,-1);
    }
   }
  } else if(c.state==='atk'){
   if(isDefended(D.def)){c.hold+=dt;if(D.def==='doorL'||D.def==='doorR'){c.knock=(c.knock||0)-dt;if(c.knock<=0){c.knock=.38;noise(.12,.4,200,'lowpass',PAN[D.spot]);tone(70,.1,'sine',.15,PAN[D.spot]);}}
    if(c.hold>=D.need){retreatSfx(id);c.state='back';startWalk(c,-1);g.stats.rep++;}}
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
 const list=WALKERS.map(id=>[id,g.chars[id]]).concat([['zig',g.zig]]); if(g.wb&&g.wb.m) list.push(['wbob',g.wb.m]);
 list.forEach(([id,c])=>{
  if(!(c.state==='walk'||c.state==='back'||c.state==='run')||!c.len) return;
  c.stepT=(c.stepT||0)-dt; if(c.stepT>0) return;
  const sp=id==='wbob'?(c.state==='run'?5.2:4):(id==='zig'?(c.state==='run'?3.2:2.2):CHARS[id].speed*(c.state==='back'?1.6:1));
  c.stepT=.62/Math.max(.5,sp);
  const a=c.path[c.from].p,b=c.path[c.to].p; _sp.lerpVectors(a,b,Math.min(1,c.prog/c.len));
  const d=Math.hypot(_sp.x,_sp.z-.5); if(d>15) return;
  const v=.5*(1-d/15)*(1-d/15), pan=Math.max(-1,Math.min(1,_sp.x/4));
  if(c.path[c.from].s<1||c.path[c.to].s<1){tone(110+Math.random()*60,.06,'square',v*.5,pan);noise(.05,v*.6,900,'bandpass',pan);}
  else if(id==='wbob'){noise(.1,Math.min(.9,v*2),120,'lowpass',pan);tone(48,.1,'sine',v,pan);tone(1400+Math.random()*600,.03,'square',v*.15,pan);}
  else {noise(.09,v,id==='sandega'?110:170,'lowpass',pan);tone(id==='sandega'?55:75,.08,'sine',v*.6,pan);if(Math.random()<.22)servo(pan,v);}
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
  if(z.meter<30&&z.warned<1){z.warned=1;alarm('A CADEIRA DO ZIG ESTÁ PARANDO','warn','CAM 3 · segure Z para girar');}
  if(z.meter<12&&z.warned<2){z.warned=2;alarm('O ZIG VAI FUGIR!','danger','CAM 3 · segure Z AGORA');}
  if(z.meter>45) z.warned=0;
  if(z.meter<=0){z.meter=0;z.state='run';startWalk(z,1);alarm('O ZIG FUGIU DA COZINHA!','danger','ele está correndo até você');if(g.cams&&g.cam===3)g.staticBurst=.6;play('stepsSide',{pan:.9,vol:1,rate:1.4,dur:4});}
 } else if(z.state==='run'){
  const last=z.path.length-1;
  z.prog+=3.2*dt;
  while(z.prog>=z.len){
   z.prog-=z.len; z.i=z.to;
   if(z.i===last){jumpscare('zig');return;}
   startWalk(z,1);
  }
 }
}
/* ---- alma do Shocker: não ataca, não aparece nas câmeras, só surge um instante onde você não está olhando ---- */
const SHOCK_SPOTS=[{x:2.0,z:-1.5},{x:-2.05,z:-1.45},{x:0,z:-9.5},{x:-3.7,z:.4,door:'l'},{x:3.7,z:.4,door:'r'}];
const _sv=new THREE.Vector3(), _sf=new THREE.Vector3();
function inView(p){_sv.set(p.x,1.6,p.z).sub(playerCam.position).normalize();playerCam.getWorldDirection(_sf);return _sv.dot(_sf)>.8;}
function updateShocker(dt){
 const S=g.shock; if(!S||S.state==='done') return;
 if(S.state==='wait'){
  if(g.t>=S.at){const opts=SHOCK_SPOTS.filter(p=>!(p.door&&g.doors[p.door])&&!inView(p));if(opts.length){S.spot=opts[Math.floor(Math.random()*opts.length)];S.state='on';S.t=0;}else S.at=g.t+2;}
 } else {
  S.t+=dt;
  if(!S.seenT&&!g.cams&&inView(S.spot)) S.seenT=.35;
  if(S.seenT){S.seenT-=dt;if(S.seenT<=0){S.state='done';if(!save.shockerSeen){save.shockerSeen=true;persist();}tone(3200,.03,'square',.008);}}
  if(S.t>2.6) S.state='done';
 }
}
/* ---- Withered BOB (noite 20/20): rápido, sozinho, e os outros acordam a cada hora ---- */
const WB_WAKE=[[],['sandega'],['bruna','fernanda','zig'],['xinglau'],['toco'],[]];
const WB_DEF={L:'doorL',R:'doorR',H:'hall',V:'vent',O:'mask'};
function wbScream(pan){if(hasSnd('wbScream'))play('wbScream',{pan,vol:1,dur:2});else{noise(.7,.6,1800,'bandpass',pan);tone(180,.8,'sawtooth',.25,pan,0,70);tone(240,.6,'square',.12,pan,.05,90);}}
const WB_RAW={
 L:[[-13,0,-24.5,{c:6}],[-9.3,0,-25],[-7.2,0,-22.4],[-6.6,0,-14.8],[-3.9,0,-14.6],[-3.8,0,-6],[-3.6,0,-1.6],[-3.4,0,.3]],
 R:[[-13,0,-24.5,{c:6}],[-9.3,0,-25],[-7.2,0,-22.6],[6.5,0,-22.6],[6.5,0,-14.8],[3.9,0,-14.6],[3.9,0,-6],[3.6,0,-1.6],[3.4,0,.3]],
 H:[[-13,0,-24.5,{c:6}],[-9.3,0,-25],[-7.8,0,-22.4],[-7.8,0,-18.9],[0,0,-18.9],[0,0,-15.6],[0,0,-12.3],[0,0,-6.2]],
 O:[[-13,0,-24.5,{c:6}],[-9.3,0,-25],[-7.8,0,-22.4],[-7.8,0,-18.9],[0,0,-18.9],[0,0,-15.6],[.3,0,-3.1],[.45,0,-1.5],[1.4,0,-.85]],
 V:[[-13,0,-24.5,{c:6}],[-9.3,0,-25],[-7.8,0,-22.4],[-7.8,0,-17],[-7,0,-15.2],[-1.8,0,-14.75],[-1.8,1.4,-14.75],[-1.8,2.17,-13.6,{s:.55}],[-1.8,2.17,-3.25,{s:.55}]]
};
const WB_PATHS={}; Object.keys(WB_RAW).forEach(k=>{WB_PATHS[k]=WB_RAW[k].map(a=>{const o=a[3]||{};return {p:new THREE.Vector3(a[0],a[1],a[2]),w:true,cam:o.c||0,s:o.s||1};});});
/* anda pelo caminho; devolve true quando chega na ponta */
function advanceMover(m,speed,dt,dir){
 m.prog+=speed*dt;
 while(m.prog>=m.len){m.prog-=m.len;m.i=m.to;const end=dir>0?m.path.length-1:0;if(m.i===end){stopAt(m);return true;}startWalk(m,dir);}
 return false;
}
function updateWB(dt){
 const w=g.wb, h=Math.min(5,Math.floor(g.t/HOUR_LEN));
 if(!w.m){w.m=newMover(WB_PATHS.L,0);w.state='wait';}
 if(h>w.hour){
  w.hour=h; const wake=WB_WAKE[h]||[];
  wake.forEach(id=>{if(id==='zig'){g.zig.on=true;g.zig.drain=14*.085;}else g.chars[id].level=14;});
  if(h===5) WALKERS.forEach(id=>g.chars[id].level=18);
  if(wake.length||h===5) alarm(h===5?'TODOS ACORDARAM':'ACORDOU: '+wake.map(id=>CHARS[id].name).join(', '),'danger','e o Withered BOB continua caçando você');
 }
 const m=w.m;
 if(w.state==='wait'){
  m.state='idle'; w.t-=dt;
  if(w.t<=0){const opts=['L','R','H','V','O'].filter(x=>x!==w.last);w.spot=opts[Math.floor(Math.random()*opts.length)];w.last=w.spot;
   w.m=newMover(WB_PATHS[w.spot],0); w.m.state='run'; w.m.yaw=m.yaw; startWalk(w.m,1); w.state='run';
   wbScream(PAN[w.spot]*.5); if(g.cams&&g.cam===6) g.staticBurst=.5;}
 } else if(w.state==='run'){
  m.state='run';
  if(advanceMover(m,5.2+h*.25,dt,1)){w.state='atk';m.state='atk';w.time=Math.max(1.5,2.2-h*.1);w.hold=0;edgeFlash(w.spot);wbScream(PAN[w.spot]);if(w.spot==='O')g.flick=1.2;}
 } else if(w.state==='atk'){
  m.state='atk';
  if(isDefended(WB_DEF[w.spot])){w.hold+=dt;w.knock=(w.knock||0)-dt;if((w.spot==='L'||w.spot==='R')&&w.knock<=0){w.knock=.3;noise(.12,.5,190,'lowpass',PAN[w.spot]);}
   if(w.hold>=.5){w.state='back';m.state='back';startWalk(m,-1);w.count++;g.stats.rep++;sfx.bang(PAN[w.spot]);}}
  else {w.time-=dt;if(w.time<=0){jumpscare('wbob');return;}}
 } else if(w.state==='back'){
  m.state='back';
  if(advanceMover(m,4,dt,-1)){w.state='wait';m.state='idle';w.t=(3+Math.random()*3)*(1-h*.07);}
 }
}
/* ---- chefe: 3 fases, ataques duplos na fase 2 e 3 ---- */
const BOSS_COMBOS=[['doorL','doorR'],['doorL','hall'],['doorR','vent'],['doorL','mask'],['doorR','mask'],['hall','doorR'],['vent','doorL']];
function bossPhase(b){const f=b.hp/BOSS_HP;return f>.66?1:(f>.33?2:3);}
function bossTime(t,ph,combo){const base=t==='cam'?[0,12,11,10][ph]:[0,4.6,3.9,3.3][ph];return base+(combo?1.6:0);}
function spawnBoss(types){
 const b=g.bossS, ph=b.phase, combo=types.length>1;
 types.forEach((t,i)=>{
  const time=bossTime(t,ph,combo);
  b.atks.push({type:t,time,max:time,hold:0,age:0,cam:t==='cam'?1+Math.floor(Math.random()*8):0});
  if(t!=='cam') edgeFlash(ATK2SPOT[t]);
  play('laugh',{pan:PAN[t],dur:1.8,vol:.9,rate:ph===3?1.25:(ph===2?1.1:1),offset:i*.4});
  if(t==='cam'){alarm('ELE SUMIU NAS CÂMERAS','warn','procure o olho brilhando e dê CHOQUE (E)');if(g.cams)g.staticBurst=.5;}
  if(t==='mask') g.flick=1.5;
 });
 b.last=types[0]; g.shake=.3;
 if(combo) toast('Ele está em dois lugares!');
}
function newBossAtk(){
 const b=g.bossS, ph=b.phase;
 if(b.last!=='cam'&&Math.random()<.2){spawnBoss(['cam']);return;}
 if(ph>=2&&Math.random()<(ph===2?.5:.75)){spawnBoss(BOSS_COMBOS[Math.floor(Math.random()*BOSS_COMBOS.length)]);return;}
 const types=['doorL','doorR','hall','vent','mask'];
 let t; do{t=types[Math.floor(Math.random()*types.length)];}while(t===b.last&&Math.random()<.85);
 spawnBoss([t]);
}
function updateBoss(dt){
 const b=g.bossS, ph=bossPhase(b);
 if(ph!==b.phase){b.phase=ph;alarm(ph===2?'FASE 2':'FASE 3: FÚRIA TOTAL','danger',ph===2?'ele começou a se dividir':'tudo ao mesmo tempo');g.flick=1.6;g.shake=.8;play('laugh',{dur:2.5,vol:1,rate:.8});}
 b.hb-=dt; if(b.hb<=0){b.hb=[0,.95,.7,.48][ph];sfx.thud(0);if(ph===3)sfx.thud(0,.12);}
 if(!b.atks.length){b.cd-=dt;if(b.cd<=0)newBossAtk();$('#danger').style.opacity=0;return;}
 if(ph>=2&&b.atks.length===1&&b.atks[0].type!=='cam'&&b.atks[0].age>1.2&&Math.random()<dt*(ph===3?.35:.12)){
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
 const b=g.bossS; b.hp=Math.max(0,b.hp-dmg); sfx.hit(); g.shake=.2; g.stats.rep++;
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
 if(g.cams){staticStart(.006);tone(1200,.04,'square',.025);tone(1600,.04,'square',.02,0,.06);noise(.1,.05,900,'bandpass');} else {staticStop();tone(700,.06,'square',.04);noise(.1,.12,600,'bandpass');}
}
function toggleCamLight(){if(!g||!g.cams||g.powerOut)return;g.camLight=!g.camLight;tone(g.camLight?1400:900,.05,'square',.06);}
function closeCams(){if(g&&g.cams){g.cams=false;$('#camsUI').classList.add('hidden');staticStop();}}
function setCam(n){if(!g||!g.cams)return;if(g.cam!==n){g.cam=n;g.staticBurst=.3;staticBurst(.15,.04);tone(1800,.02,'square',.015);}}
function powerOutStart(){
 g.powerOut=true;g.doors.l=g.doors.r=false;closeCams();g.flash=null;
 sfx.powerOut();sunloop('fan',.4);musicStop();g.outTimer=8+Math.random()*8;g.mbT=2.5;if(hasSnd('outMusic')){outMusH=play('outMusic',{vol:.6});g.mbT=9999;g.outTimer=12+Math.random()*10;}toast('A energia acabou...');
}
let alarmTO=null;
/* aviso grande com sirene: aparece no topo da tela e não some escondido */
function alarm(msg,kind,sub){
 const el=$('#alarm'); $('#alarmTxt').textContent=msg; $('#alarmSub').textContent=sub||'';
 el.className=''; void el.offsetWidth; el.className='on '+(kind||'warn');
 clearTimeout(alarmTO); alarmTO=setTimeout(()=>{el.className='';},3400);
 if(hasSnd('alarm')) play('alarm',{dur:2.4,vol:kind==='danger'?.65:.4}); else sfx.alarm(kind==='danger'?5:2);
}
function clearAlarm(){clearTimeout(alarmTO);const el=$('#alarm');if(el)el.className='';}
/* pisca a borda da tela do lado de onde veio a ameaça */
function edgeFlash(side){const el=$('#edge');el.className='';void el.offsetWidth;el.className='on e'+side;const p=side==='L'?-.9:(side==='R'?.9:0);tone(side==='O'?420:760,.12,'sine',.07,p);tone(side==='O'?420:760,.12,'sine',.07,p,.18);}
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
  $('#goWho').textContent=CHARS[id].name+' te pegou.'; $('#goTip').innerHTML='<h4>Como sobreviver</h4><ol>'+(STEPS[id]||[CHARS[id].tip]).map(x=>'<li>'+fmtKeys(x)+'</li>').join('')+'</ol>';
  setMode('over','gameover');
 },1900);
}
let confettiOn=0;
function confettiRun(){
 const cv=$('#confetti'), x=cv.getContext('2d'); cv.width=innerWidth; cv.height=innerHeight;
 const P=Array.from({length:140},()=>({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*.5,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:Math.random()*6,c:['#e0303f','#3b6fd6','#f2b33d','#49c06a','#e97db4','#7a3cc0'][Math.floor(Math.random()*6)]}));
 const id=++confettiOn; const t0=performance.now();
 (function step(){if(id!==confettiOn)return;x.clearRect(0,0,cv.width,cv.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-4,-2,8,4);x.restore();});if(performance.now()-t0<5000)requestAnimationFrame(step);else x.clearRect(0,0,cv.width,cv.height);})();
}
function cheer(){if(hasSnd('kids'))play('kids',{vol:.5});else{[523,659,784,1046].forEach((f,i)=>tone(f,.6,'triangle',.07,0,i*.05));noise(1.2,.12,1800,'bandpass');for(let i=0;i<8;i++)tone(700+Math.random()*500,.12,'triangle',.03,Math.random()*2-1,.1+i*.12);}}
function winNight(){
 g.over=true; endNightAudio(); holds.clear(); $('#itsme').classList.remove('on');
 const n=g.night, st=g.stats||{rep:0}, pw=Math.ceil(g.power), wb=!!g.wb;
 if(wb) save.wbWin=true;
 if(n<5) save.night=Math.max(save.night,n+1);
 if(n===5){save.n6=true;save.night=Math.max(save.night,5);}
 if(n<=5) save.mg=Math.max(save.mg||0,n);
 const maxed=n===7&&ALL.every(id=>save.custom[id]>=20);
 if(maxed) save.max=true;
 persist();
 $('#winNightLbl').textContent=wb?'WITHERED BOB':(n===7?'NOITE PERSONALIZADA':'NOITE '+n);
 $('#wcH').textContent='5'; $('#wcM').textContent='57'; $('#winClock').classList.remove('done');
 $('#winMsg').textContent=''; $('#winStats').classList.remove('on'); $('#winStats').innerHTML='';
 $('#bNext').classList.add('hidden'); $('#bMini').classList.add('hidden');
 setMode('win');
 [['58',600],['59',1200]].forEach(([m,tm])=>setTimeout(()=>{if(mode==='win'){$('#wcM').textContent=m;tone(1000,.04,'square',.04);}},tm));
 setTimeout(()=>{
  if(mode!=='win') return;
  $('#wcH').textContent='6'; $('#wcM').textContent='00'; $('#winClock').classList.add('done');
  sixHandle=play('sixAM'); confettiRun(); cheer();
  $('#winMsg').textContent=wb?'Você sobreviveu ao WITHERED BOB. Ninguém tinha conseguido isso.':n===5?'Você sobreviveu à semana! Mas... a Noite 6 foi desbloqueada.':(n===7?(maxed?'Todos no 20. Lenda da pizzaria.':'Noite personalizada concluída.'):'Seu turno acabou. Os animatrônicos voltam para o palco.');
  $('#winStats').innerHTML=`<div><b>${st.rep}</b><span>ataques defendidos</span></div><div><b>${pw}%</b><span>energia sobrando</span></div><div><b>6:00</b><span>sobreviveu</span></div>`;
  $('#winStats').classList.add('on');
  if(n<=5){$('#bNext').textContent=n===5?'Encarar a Noite 6':'Noite '+(n+1);$('#bNext').classList.remove('hidden');$('#bMini').textContent='🕹 Fita '+n+': '+MINIS[n-1].title+' '+MINIS[n-1].sub;$('#bMini').classList.remove('hidden');$('#bMini').onclick=()=>{stopSix();startMini(n-1,()=>setMode('win'));};}
 },1800);
}
let CS=null;
const CUT_LINES=[['','...'],['SR. GARGALHADA','Você é bom nisso.'],['SR. GARGALHADA','Eu também era. Eu fazia as crianças rirem, aqui mesmo.'],['SR. GARGALHADA','Até a noite em que as luzes apagaram.'],['SR. GARGALHADA','Ele mora nos fios. Ele escuta tudo. Ele está escutando agora.'],['SR. GARGALHADA','Ele já escolheu o próximo.'],['SR. GARGALHADA','...É você.'],['SR. GARGALHADA','Não volte mais aqui.']];
function winBoss(){
 g.over=true; endNightAudio(); holds.clear(); closeCams(); save.won6=true; save.n6=true; persist();
 $('#danger').style.opacity=0; clearToast(); clearAlarm();
 CS={t:0,line:-1,ch:0,lt:0,back:0,done:false}; setMode('cut','cut'); $('#cutSub').innerHTML='';
}
function endCut(){if(!CS)return;CS=null;clownLight.intensity=0;bots.clown.visible=false;setMode('bosswin');$('#bSecret').classList.remove('hidden');sixHandle=play('sixAM');}
function updateCut(dt,t){
 const c=CS; if(!c) return; c.t+=dt;
 hideBots(); camLight.intensity=0;
 const k=Math.min(1,c.t/3);
 Object.values(LIGHTS).forEach(l=>l.intensity=l.userData.base*(1-k)); stageA.intensity=stageB.intensity=0;
 if(c.t<3){lamp.intensity=1.1*(1-k)*(Math.random()<.2?.3:1);amb.intensity=.3-.25*k;}
 else {lamp.intensity=0;amb.intensity=.04;monitorScreen.material.color.setHex(0x030503);redL.intensity=redR.intensity=0;}
 if(c.t>3&&!c.pd){c.pd=1;sfx.powerOut();}
 if(c.t>5.5){
  const b=bots.clown,u=b.userData; _fwd.set(0,0,-1).applyQuaternion(playerCam.quaternion);_fwd.y=0;_fwd.normalize();
  const dist=1.05+c.back*2.5;
  b.visible=true; b.scale.setScalar(u.base); b.position.set(playerCam.position.x+_fwd.x*dist,1.3-2.04*u.base+.05,playerCam.position.z+_fwd.z*dist);
  b.lookAt(playerCam.position.x,b.position.y,playerCam.position.z); u.pose='idle'; animRig(u,dt,t);
  u.head.rotation.set(.12,0,.28+Math.sin(t*.6)*.04); u.lids.forEach(l=>l.rotation.x=-.1);
  clownLight.color.setHex(0xffe0c0); clownLight.distance=1.4;
  clownLight.position.set(b.position.x-_fwd.x*.35,1.15,b.position.z-_fwd.z*.35);
  clownLight.intensity=(c.back>0?Math.max(0,1-c.back*2):1)*(1.1+Math.sin(t*9)*.05);
  if(c.line<0){c.line=0;c.ch=0;c.lt=0;}
  const L=CUT_LINES[c.line];
  if(L){const full=L[1];if(c.ch<full.length){const prev=Math.floor(c.ch);c.ch+=dt*24;if(Math.floor(c.ch)!==prev&&full[prev]!==' '){tone(160+Math.random()*30,.06,'sawtooth',.03,0,0,120);u.jaw.rotation.x=u.jaw0+.18;}else u.jaw.rotation.x=u.jaw0;}else{c.lt+=dt;u.jaw.rotation.x=u.jaw0;if(c.lt>2.2){c.line++;c.ch=0;c.lt=0;}}
   $('#cutSub').innerHTML=(L[0]?'<b>'+L[0]+'</b>':'')+full.slice(0,Math.floor(c.ch));}
  else {c.back+=dt*.35;$('#cutSub').innerHTML='';if(c.back>.9&&!c.done){c.done=true;b.visible=false;clownLight.intensity=0;setTimeout(endCut,1600);}}
 }
}
$('#cut').addEventListener('click',()=>{if(CS)endCut();});
addEventListener('keydown',e=>{if(mode==='cut'&&(e.key===' '||e.key==='Escape')){e.preventDefault();endCut();}});
$('#bSecret').onclick=()=>{stopSix();startMini(5,()=>setMode('bosswin'));};
$('#bBossCred').onclick=()=>{stopSix();$('#bCredits').click();};

/* ================= LAYOUT / ANIMATION ================= */
const SPOT3={L:[-3.4,0,.3,1,0,.3],R:[3.4,0,.3,1,0,.3],H:[0,0,-6.2,1,0,1.25],V:[-1.8,1.52,-2.8,.55,-1.8,1.25],O:[1.4,0,-.85,1,0,1.25]};
const ATK2SPOT={doorL:'L',doorR:'R',hall:'H',vent:'V',mask:'O'};
function putSpot(id,k){const s=SPOT3[k];putBot(id,s[0],s[1],s[2],s[3],s[4],s[5]);}
const _p=new THREE.Vector3();
function lerpAng(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;}
function placeMover(id,c,dt,spotOverride){
 const b=bots[id], a=c.path[c.from], bb=c.path[c.to], k=c.len?Math.min(1,c.prog/c.len):0;
 _p.lerpVectors(a.p,bb.p,k); const s=a.s+(bb.s-a.s)*k;
 b.visible=true; b.position.copy(_p); b.scale.setScalar(s*b.userData.base);
 const moving=(c.state==='walk'||c.state==='back'||c.state==='run')&&c.len>0;
 let ty=c.yaw;
 if(c.state==='atk') ty=Math.atan2(0-_p.x,1.25-_p.z);
 else if(moving) ty=Math.atan2(bb.p.x-a.p.x,bb.p.z-a.p.z);
 c.yaw=lerpAng(c.yaw,ty,Math.min(1,dt*7));
 const cf=(id==='fernanda'||id==='wbob')?Math.max(0,Math.min(1,(1-s)/.45)):0;
 const spot=spotOverride||(CHARS[id]&&CHARS[id].spot);
 b.rotation.order='YXZ'; b.rotation.set(cf*Math.PI/2,c.yaw,0);
 b.userData.walk=moving; b.userData.wspd=c.state==='run'?2.6:(c.state==='back'?1.6:1);
 b.userData.sit=false; b.userData.crawlAtk=c.state==='atk';
 const atDoor=c.state==='atk'&&(spot==='L'||spot==='R');
 b.userData.bang=atDoor&&(spot==='L'?g.doors.l:g.doors.r);
 b.userData.pose=cf>.5?'crawl':(atDoor?'door':(c.state==='atk'?'atk':'idle'));
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
 if(g.wb&&g.wb.m) placeMover('wbob',g.wb.m,dt,g.wb.state==='atk'?g.wb.spot:null);
 if(g.shock&&g.shock.state==='on'){const p=g.shock.spot;putBot('shocker',p.x,0,p.z,1,0,1.25);}
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
  u.armL.rotation.set(-2.5+Math.sin(t*4)*.35,0,-.35);u.armR.rotation.set(-2.5-Math.sin(t*4)*.35,0,.35);
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
  u.armL.rotation.set(-sn*A*.85,0,-armOut); u.armR.rotation.set(sn*A*.85,0,armOut);
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
 } else if(u.pose==='door'){
  const bang=u.bang;
  L(u.legL,'x',-.1);L(u.legR,'x',.1);L(u.kneeL,'x',.15);L(u.kneeR,'x',.15);
  hp.position.y+=(1-hp.position.y)*Math.min(1,dt*6); hp.rotation.set(0,0,0);
  tr.rotation.set(.18+(bang?Math.max(0,Math.sin(t*16))*.1:0),Math.sin(t*.6)*.1,Math.sin(t*.8)*.06);
  if(bang){u.armL.rotation.set(-1.7+Math.sin(t*16)*.55,0,-.15);u.armR.rotation.set(-1.7+Math.sin(t*16+Math.PI)*.55,0,.15);L(u.elbowL,'x',-1);L(u.elbowR,'x',-1);}
  else {u.armL.rotation.set(-2.5+Math.sin(t*1.3)*.08,0,-.4);u.armR.rotation.set(-.7+Math.sin(t*2)*.12,0,.25);L(u.elbowL,'x',-.35);L(u.elbowR,'x',-1.1);}
  u.head.rotation.set(.1,Math.sin(t*.9)*.25,(bang?0:.4)+Math.sin(t*.7)*.08);
  u.jaw.rotation.x=u.jaw0+(bang?.28:.08)+(Math.random()<.04?.15:0);
 } else if(u.pose==='crawl'){
  u.wph+=dt*(u.walk?6:1.5); const sn=Math.sin(u.wph);
  u.legL.rotation.x=.15+sn*.25; u.legR.rotation.x=.15-sn*.25; u.kneeL.rotation.x=.4+Math.max(0,sn)*.5; u.kneeR.rotation.x=.4+Math.max(0,-sn)*.5;
  u.armL.rotation.set(-2.7+sn*.45,0,-.25); u.armR.rotation.set(-2.7-sn*.45,0,.25);
  u.elbowL.rotation.x=-.4-Math.max(0,-sn)*.6; u.elbowR.rotation.x=-.4-Math.max(0,sn)*.6;
  hp.position.y=1; hp.rotation.set(0,0,sn*.08); tr.rotation.set(0,0,0); tr.scale.set(1,1,1);
  u.head.rotation.set(-1.2+(u.crawlAtk?Math.sin(t*1.3)*.12:0),Math.sin(t*.8)*.15+gl,0);
  u.jaw.rotation.x=u.jaw0+(u.crawlAtk?.15+(Math.random()<.05?.2:0):0);
 } else if(u.pose==='atk'){
  L(u.legL,'x',-.22);L(u.legR,'x',.14);L(u.kneeL,'x',.4);L(u.kneeR,'x',.3);
  hp.position.y+=(.95-hp.position.y)*Math.min(1,dt*6); hp.rotation.set(0,0,0);
  const lunge=Math.max(0,Math.sin(t*1.7+ph))*.06;
  tr.rotation.set(.26+lunge+Math.sin(t*1.3)*.03,0,Math.sin(t*.9)*.05);
  if(T==='clown'){u.armL.rotation.set(-.8+Math.sin(t*1.5)*.1,0,-.7);u.armR.rotation.set(-.8+Math.cos(t*1.4)*.1,0,.7);L(u.elbowL,'x',-.9);L(u.elbowR,'x',-.9);}
  else {u.armL.rotation.set(-1.1+Math.sin(t*2+ph)*.08,0,-.2); u.armR.rotation.set(-1.0+Math.cos(t*2.2)*.08,0,.2);L(u.elbowL,'x',-.55);L(u.elbowR,'x',-.45);}
  u.head.rotation.set(.08+gl,Math.sin(t*.7)*.18+gl,(T==='clown'?.4:0)+Math.sin(t*.5)*.2);
  u.jaw.rotation.x=u.jaw0+.14+(Math.random()<.06?.2:0);
 } else if(u.pose==='perform'){
  const bt=t*2.4;
  L(u.legL,'x',0);L(u.legR,'x',0);L(u.kneeL,'x',Math.max(0,Math.sin(bt))*.14);L(u.kneeR,'x',Math.max(0,-Math.sin(bt))*.14);
  hp.position.y=1.0-Math.abs(Math.sin(bt))*.03; hp.rotation.set(0,Math.sin(bt*.5)*.18,0);
  tr.rotation.set(.04,0,Math.sin(bt*.5)*.06);
  if(T==='xinglau'){u.armL.rotation.set(-2.6+Math.sin(bt)*.2,0,-.3);u.armR.rotation.set(-.3,0,.2);u.elbowL.rotation.x=-.3;u.elbowR.rotation.x=-.8;}
  else if(T==='fernanda'){u.armL.rotation.set(-.3,0,-.9-Math.sin(bt)*.4);u.armR.rotation.set(-.3,0,.9+Math.sin(bt)*.4);u.elbowL.rotation.x=u.elbowR.rotation.x=-.2;}
  else {u.armL.rotation.set(-.35-Math.max(0,Math.sin(bt+ph))*1.3,0,-.3); u.armR.rotation.set(-.35-Math.max(0,-Math.sin(bt+ph))*1.3,0,.3);u.elbowL.rotation.x=-.7; u.elbowR.rotation.x=-.7;}
  if(u.tw>0){u.tw-=dt;}else if(Math.random()<dt*.12){u.tw=.6+Math.random()*1.2;u.twY=(Math.random()-.5)*.6;}
  u.head.rotation.set(Math.abs(Math.sin(bt))*.12+gl,(u.tw>0?u.twY:Math.sin(bt*.5)*.2)+gl,gl+(T==='toco'?Math.sin(bt*.5)*.15:0));
  u.jaw.rotation.x=u.jaw0+Math.max(0,Math.sin(t*6+ph))*.22;
 } else {
  L(u.legL,'x',0);L(u.legR,'x',0);L(u.kneeL,'x',.03);L(u.kneeR,'x',.03);
  hp.position.y+=(1.0-hp.position.y)*Math.min(1,dt*5); hp.rotation.y*=.9; hp.rotation.z*=.9;
  const br=T==='sandega'?.022:.012;
  tr.rotation.set(T==='zig'?.15:.03,0,T==='clown'?Math.sin(t*.6)*.05:0); tr.scale.set(1,1+Math.sin(t*(T==='sandega'?1:1.6)+ph)*br,1);
  if(T==='xinglau'){L(u.armL,'x',-.35);L(u.armL,'y',1.2);L(u.armL,'z',0);L(u.armR,'x',-.35);L(u.armR,'y',-1.2);L(u.armR,'z',0);L(u.elbowL,'x',-1.45);L(u.elbowR,'x',-1.45);}
  else if(T==='bruna'){u.armL.rotation.set(Math.sin(t*.6+ph)*.05,0,-.1);L(u.armR,'x',.25);L(u.armR,'y',-.9);L(u.armR,'z',.65);L(u.elbowL,'x',-.15);L(u.elbowR,'x',-1.5);hp.rotation.z=.06;}
  else if(T==='zig'){u.armL.rotation.set(Math.sin(t*3)*.25,0,-.25-Math.sin(t*2.2)*.1);u.armR.rotation.set(-Math.sin(t*3)*.25,0,.25);u.elbowL.rotation.x=-.4+Math.sin(t*4)*.2;u.elbowR.rotation.x=-.4;hp.position.y=1+Math.abs(Math.sin(t*5))*.02;}
  else if(T==='clown'){u.armL.rotation.set(.05,0,-.12-Math.sin(t*.5)*.03);u.armR.rotation.set(.05,0,.12);L(u.elbowL,'x',-.1);L(u.elbowR,'x',-.1);}
  else {u.armL.rotation.set(Math.sin(t*.6+ph)*.05,0,-.09); u.armR.rotation.set(-Math.sin(t*.6+ph)*.05,0,.09);L(u.elbowL,'x',-.15);L(u.elbowR,'x',-.15);}
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
 u.wings.forEach((w,i)=>{const big=u.pose==='atk'?Math.sin(t*9)*.45+.3:((u.walk||u.pose==='perform')?Math.sin(t*7)*.3:Math.sin(t*1.5)*.06);w.rotation.z=(i?1:-1)*(u.pose==='crawl'?.05:big);});
}
function animBots(dt,t){
 Object.values(bots).forEach(b=>{
  if(!b.visible) return; const u=b.userData;
  if(u.shocker){shockerArcs(b);return;}
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
  if(g.shake>0)g.shake-=dt; const sk=g.shake>0&&SET.shake?g.shake*.06:0;
  playerCam.rotation.set(pitch+(Math.random()-.5)*sk,yaw+(Math.random()-.5)*sk,(Math.random()-.5)*sk*.5,'YXZ'); playerCam.position.set(0,1.3,1.25);
  lamp.color.setHex(g.boss&&g.bossS.phase===3?(Math.sin(t*6)>0?0xff4a3a:0xffc890):0xffc890);
  g.doorY.l+=((g.doors.l?1.15:3.5)-g.doorY.l)*Math.min(1,dt*14); g.doorY.r+=((g.doors.r?1.15:3.5)-g.doorY.r)*Math.min(1,dt*14);
  doorL.position.y=g.doorY.l; doorR.position.y=g.doorY.r;
  if(g.flick>0) g.flick-=dt;
  const officeThreat=(!g.boss&&g.chars.toco.state==='atk')||(g.wb&&g.wb.state==='atk'&&g.wb.spot==='O')||(g.boss&&g.bossS.atks.some(a=>a.type==='mask'));
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
  u.armL.rotation.set(-1.35,0,-.25); u.armR.rotation.set(-1.35,0,.25); if(u.legL){u.legL.rotation.x=0;u.legR.rotation.x=0;}
  if(u.rig===2){u.elbowL.rotation.x=-.35;u.elbowR.rotation.x=-.35;u.kneeL.rotation.x=u.kneeR.rotation.x=0;u.torso.rotation.set(.18,0,Math.sin(js.t*50)*.05);u.hips.position.y=1;u.lids.forEach(l=>l.rotation.x=-.3);u.jaw.rotation.x=.75+Math.sin(js.t*40)*.18;}
  u.pupils.forEach(p=>p.visible=true);
  lamp.intensity=1.6;
  playerCam.rotation.set(pitch+(Math.random()-.5)*.06,yaw+(Math.random()-.5)*.06,(Math.random()-.5)*.05,'YXZ');
 } else if(mode==='extras'){
  const gb=gBots[gSel]; if(gb){const u=gb.userData;
   if(gJS.t>=0){
    gJS.t+=dt; _fwd.set(0,0,-1).applyQuaternion(gCam.quaternion); _fwd.y=0; _fwd.normalize();
    const k=Math.min(1,gJS.t/.28), dist=4.4-3.6*(1-Math.pow(1-k,3)), headY=(u.legL?1.97:1.82)*u.base;
    gb.position.set(gCam.position.x+_fwd.x*dist,gCam.position.y-headY+.02,gCam.position.z+_fwd.z*dist);
    gb.lookAt(gCam.position.x,gb.position.y,gCam.position.z);
    if(u.rig===2){u.pose='atk';animRig(u,dt,t);u.jaw.rotation.x=.75+Math.sin(gJS.t*40)*.18;u.armL.rotation.set(-1.35,0,-.25);u.armR.rotation.set(-1.35,0,.25);u.lids.forEach(l=>l.rotation.x=-.3);u.head.rotation.z=Math.sin(gJS.t*55)*.12;}
    if(gJS.t>1.7){gJS.t=-1;gb.position.set(0,.12,0);}
   } else {
    if(!gDrag)gRot+=dt*.5; gb.rotation.set(0,gRot,0);
    if(u.shocker){shockerArcs(gb);} else
    if(u.rig===2){u.pose=['idle','perform','idle','atk'][gJS.pose];u.walk=gJS.pose===2;u.wspd=1;animRig(u,dt,t);}
    else{u.head.rotation.z=Math.sin(t*1.2)*.08;u.jaw.rotation.x=(u.jaw0||0)+Math.max(0,Math.sin(t*2))*.2;}
   }
  }
 } else if(mode==='day'||mode==='cut'){
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
 const threat=g.boss?g.bossS.atks.some(a=>a.type!=='cam'):(WALKERS.some(id=>g.chars[id].state==='atk')||z.state==='run'||(g.wb&&g.wb.state==='atk'));
 const zigLow=z.on&&z.state==='idle'&&z.meter<30&&!(g.cams&&g.cam===3);
 btnOf('cams').classList.toggle('warn',(g.cams&&threat)||zigLow);
 $('#maskOv').classList.toggle('on',g.mask);
 if(g.cams){
  $('#camLbl').textContent='CAM '+g.cam+' · '+CAMS[g.cam];
  const hc=g.boss&&g.bossS.atks.find(a=>a.type==='cam'); const blink=Math.sin(g.t*5)>.55;
  document.querySelectorAll('.camMk').forEach(b=>{const c=+b.dataset.cam;b.classList.toggle('on',c===g.cam);b.classList.toggle('haunt',!!hc&&hc.cam===c&&blink&&c!==g.cam);});
  const showZ=g.cam===3&&z.on;
  $('#zigBox').classList.toggle('hidden',!showZ);
  if(showZ){$('#zigFill').style.width=Math.max(0,z.meter)+'%';$('#zigFill').style.background=z.meter<25?'#e0303f':(z.meter<50?'#f2b33d':'#5fcf5f');$('#crankBtn').classList.toggle('held',z.cranking);$('#crankBtn').disabled=z.state!=='idle';}
 }
 $('#lookHint').style.opacity=g.t<12?1:0;
}


/* ================= MODO DIA ================= */
/* pessoas low poly: crianças e funcionários */
const SKIN=[0xf1c9a5,0xd9a47a,0xb07850,0x8a5a3a,0x6a4028], SHIRT=[0xe0303f,0x3b6fd6,0xf2b33d,0x49c06a,0xe97db4,0x7a3cc0,0xffffff,0x2ab3c0];
function makePerson(kid,i){
 const G=new THREE.Group(), dk=(c,f)=>new THREE.Color(c).multiplyScalar(f).getHex();
 const skinC=SKIN[i%SKIN.length], skin=bm(skinC), shirtC=kid?SHIRT[(i*3)%SHIRT.length]:0xb5121f, shirt=bm(shirtC);
 const pants=bm(kid?[0x2a3a6a,0x3a2a1a,0x1a1a1a,0x5a5a6a,0x6a2a4a][i%5]:0x1a1a22), hairC=[0x1a1008,0x3a2410,0x6a4a20,0xc8a050,0x0a0a0a,0x7a2a10][(i*7)%6], hair=bm(hairC);
 const shoe=bm(kid?[0xffffff,0xe0303f,0x3b6fd6,0xf2b33d][i%4]:0x111111,true);
 const add=(geo,m,x,y,z,p)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);(p||G).add(o);return o;};
 const legs=[],arms=[], shorts=kid&&i%2===1;
 [-1,1].forEach(s=>{const hp=new THREE.Group();hp.position.set(s*.1,.86,0);G.add(hp);
  add(new THREE.CylinderGeometry(.088,.072,.44,10),pants,0,-.22,0,hp);
  add(new THREE.CylinderGeometry(.066,.056,.4,10),shorts?skin:pants,0,-.62,0,hp);
  if(kid) add(new THREE.CylinderGeometry(.06,.06,.06,10),bm(0xf2f0ea),0,-.79,0,hp);
  const sh=add(new THREE.SphereGeometry(.078,10,7),shoe,0,-.83,.045,hp); sh.scale.set(1,.55,1.6);
  legs.push(hp);});
 const hip=add(new THREE.CylinderGeometry(.17,.16,.16,12),pants,0,.92,0); hip.scale.z=.75;
 add(new THREE.CylinderGeometry(.18,.18,.03,12),bm(0x2a1a10),0,1,0).scale.z=.76;
 const tor=add(new THREE.CylinderGeometry(.2,.17,.5,12),shirt,0,1.2,0); tor.scale.z=.7;
 add(new THREE.SphereGeometry(.2,12,8,0,Math.PI*2,0,Math.PI/2),shirt,0,1.44,0).scale.set(1,.42,.7);
 if(kid){const pr=add(new THREE.CylinderGeometry(.06,.06,.01,5),bm(dk(shirtC,1.5)),0,1.24,.125);pr.rotation.x=Math.PI/2;}
 else {add(new THREE.BoxGeometry(.3,.42,.02),bm(0xf2f0ea),0,1.12,.125);add(new THREE.BoxGeometry(.08,.03,.01),bm(0xffd23f),.1,1.36,.137);add(new THREE.CylinderGeometry(.07,.08,.04,10),shirt,0,1.47,0);}
 [-1,1].forEach(s=>{const sh=new THREE.Group();sh.position.set(s*.235,1.4,0);G.add(sh);
  add(new THREE.CylinderGeometry(.068,.062,.2,10),shirt,0,-.1,0,sh);
  add(new THREE.CylinderGeometry(.05,.044,.27,10),skin,0,-.33,0,sh);
  const hd=add(new THREE.SphereGeometry(.055,8,6),skin,0,-.49,.01,sh); hd.scale.set(.9,1.1,.8);
  if(kid&&s>0&&i%3===0){limb([0,-.5,.02],[.05,.45,.08],.004,.004,bm(0xdddddd),sh,3);add(new THREE.SphereGeometry(.11,10,8),bm(SHIRT[(i+4)%SHIRT.length]),.05,.52,.08,sh).scale.y=1.2;}
  arms.push(sh);});
 add(new THREE.CylinderGeometry(.05,.056,.09,8),skin,0,1.5,0);
 const head=new THREE.Group(); head.position.y=1.66; G.add(head);
 add(new THREE.SphereGeometry(.15,16,12),skin,0,0,0,head).scale.set(.92,1.05,.95);
 [-1,1].forEach(s=>add(new THREE.SphereGeometry(.035,8,6),skin,s*.138,0,0,head).scale.set(.5,1,.8));
 [-1,1].forEach(s=>{add(new THREE.SphereGeometry(.026,8,6),bm(0xf6f2ea,true),s*.055,.02,.125,head);add(new THREE.SphereGeometry(.015,6,5),bm([0x3a2410,0x2a5a8a,0x2a6a3a,0x1a1a1a][i%4],true),s*.055,.02,.146,head);
  const br=add(new THREE.BoxGeometry(.05,.012,.012),hair,s*.055,.066,.132,head);br.rotation.z=s*-.12;});
 add(new THREE.SphereGeometry(.022,8,6),bm(dk(skinC,.88)),0,-.02,.148,head);
 const mo=add(new THREE.TorusGeometry(.032,.007,4,12,Math.PI),bm(0x7a2a2a),0,-.055,.135,head); mo.rotation.z=Math.PI;
 if(kid)[-1,1].forEach(s=>{const c=add(new THREE.SphereGeometry(.022,6,4),bm(0xff9a9a),s*.08,-.035,.12,head);c.scale.z=.4;});
 const style=i%4;
 add(new THREE.SphereGeometry(.162,14,10,0,Math.PI*2,0,Math.PI*.55),hair,0,.018,-.012,head);
 add(new THREE.SphereGeometry(.15,12,8,0,Math.PI*2,Math.PI*.4,Math.PI*.35),hair,0,.0,-.03,head).scale.set(1.04,1,1.02);
 if(style===1) add(new THREE.SphereGeometry(.07,10,8),hair,0,-.02,-.17,head).scale.set(.8,1.6,.8);
 if(style===2) for(let k=0;k<7;k++) add(new THREE.SphereGeometry(.06,8,6),hair,Math.sin(k*.9)*.1,.11+(k%2)*.03,Math.cos(k*.9)*.08-.02,head);
 if(style===3&&kid) [-1,1].forEach(s=>add(new THREE.SphereGeometry(.055,8,6),hair,s*.12,.1,-.04,head));
 if(kid){const hc=SHIRT[(i+2)%SHIRT.length];const hat=add(new THREE.ConeGeometry(.1,.26,10),bm(hc),0,.24,0,head);add(new THREE.TorusGeometry(.085,.012,4,10),bm(dk(hc,1.6)),0,.17,0,head).rotation.x=Math.PI/2;add(new THREE.SphereGeometry(.03,6,4),bm(0xffffff),0,.38,0,head);}
 else {add(new THREE.CylinderGeometry(.16,.165,.08,14),shirt,0,.12,0,head);const vz=add(new THREE.BoxGeometry(.2,.02,.14),shirt,0,.09,.17,head);vz.rotation.x=.15;add(new THREE.CylinderGeometry(.03,.03,.01,8),bm(0xffd23f),0,.13,.16,head).rotation.x=Math.PI/2;}
 const shd=new THREE.Mesh(new THREE.CircleGeometry(.28,12),SHADOW_MAT); shd.rotation.x=-Math.PI/2; shd.position.y=.012; G.add(shd);
 mergeGroupMeshes(G);
 G.scale.setScalar(kid?.58+((i*13)%10)/100:1);
 G.userData={legs,arms,head,ph:Math.random()*6};
 return G;
}
/* caminhos por onde as pessoas andam */
const DN=[[-7.8,-15.3],[0,-15.3],[6.6,-15.3],[-7.8,-18.9],[0,-18.9],[6.6,-18.9],[-7.8,-22.6],[0,-22.6],[6.6,-22.6],
 [-9.4,-18.2],[-11.5,-17.5],[-12.5,-15.8],[-14.3,-18.6],[-13.5,-16.6],
 [6.1,-14.6],[6.1,-12.5],[9,-11.2],[10.8,-12.8],
 [9.4,-21],[11.5,-21],[13.8,-18.4],[11.2,-24]];
const DE=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8],[3,9],[9,10],[10,11],[10,12],[10,13],[11,13],[12,13],[2,14],[14,15],[15,16],[16,17],[5,18],[8,18],[18,19],[19,20],[19,21]];
const DADJ=DN.map((_,i)=>DE.filter(e=>e[0]===i||e[1]===i).map(e=>e[0]===i?e[1]:e[0]));
const KID_NODES=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]), STAFF_NODES=new Set([1,2,4,5,7,8,14,15,16,17,18,19,20,21]);
const people=[]; let dayBuilt=false;
function buildDay(){
 if(dayBuilt) return; dayBuilt=true;
 for(let i=0;i<11;i++){const p=makePerson(true,i);const n=[0,1,2,3,4,5,6,7,10,11,13][i];p.position.set(DN[n][0],0,DN[n][1]);p.userData.node=n;p.userData.target=n;p.userData.kid=true;p.userData.speed=1.4+Math.random()*.8;p.userData.wait=Math.random()*2;scene.add(p);people.push(p);}
 for(let i=0;i<3;i++){const p=makePerson(false,i+20);const n=[18,8,15][i];p.position.set(DN[n][0],0,DN[n][1]);p.userData.node=n;p.userData.target=n;p.userData.kid=false;p.userData.speed=1.05;p.userData.wait=1+Math.random()*3;scene.add(p);people.push(p);}
 [[8.9,-9.1,Math.PI],[8.4,-14.65,Math.PI],[14.4,-20.5,-Math.PI/2]].forEach(([x,z,ry],i)=>{const p=makePerson(false,i+40);p.position.set(x,0,z);p.rotation.y=ry;p.userData.fixed=true;scene.add(p);people.push(p);});
 [[-14.6,.18,-18.8],[-13.8,.18,-18.2]].forEach(([x,y,z],i)=>{const p=makePerson(true,i+60);p.position.set(x,y,z);p.userData.fixed=true;p.userData.bounce=true;scene.add(p);people.push(p);});
 people.forEach(p=>p.visible=false);
}
function updatePeople(dt,t){
 people.forEach(p=>{
  const u=p.userData;
  if(u.fixed){u.legs.forEach(l=>l.rotation.x=0);u.arms[0].rotation.x=Math.sin(t*1.5+u.ph)*.15;u.head.rotation.y=Math.sin(t*.5+u.ph)*.5;if(u.bounce)p.position.y=.18+Math.abs(Math.sin(t*4+u.ph))*.18;return;}
  if(u.wait>0){u.wait-=dt;u.legs.forEach(l=>l.rotation.x*=.8);u.arms.forEach(a=>a.rotation.x*=.8);u.head.rotation.y=Math.sin(t+u.ph)*.4;return;}
  const tg=DN[u.target], dx=tg[0]-p.position.x, dz=tg[1]-p.position.z, d=Math.hypot(dx,dz);
  if(d<.15){
   u.node=u.target; const allowed=u.kid?KID_NODES:STAFF_NODES;
   let opts=DADJ[u.node].filter(n=>allowed.has(n)); if(opts.length>1) opts=opts.filter(n=>n!==u.prev);
   u.prev=u.node; u.target=opts.length?opts[Math.floor(Math.random()*opts.length)]:u.node;
   u.wait=u.kid?(Math.random()<.3?Math.random()*1.5:0):1+Math.random()*3; return;
  }
  const sp=u.speed*dt; p.position.x+=dx/d*Math.min(sp,d); p.position.z+=dz/d*Math.min(sp,d);
  p.rotation.y=lerpAng(p.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*8));
  u.ph+=dt*u.speed*6; const sw=Math.sin(u.ph)*.6;
  u.legs[0].rotation.x=sw; u.legs[1].rotation.x=-sw; u.arms[0].rotation.x=-sw*.7; u.arms[1].rotation.x=sw*.7;
  u.head.rotation.y=0;
 });
}
/* colisão: caixas do mapa na altura do corpo */
let DAY_BOXES=null;
function dayBoxes(){
 if(DAY_BOXES) return DAY_BOXES;
 DAY_BOXES=levelData().filter(b=>!['floor','floor2','floorD','tile','carpet','ceil','glow','trim'].includes(b[6])&&b[2]<1.7&&b[3]>.15).map(b=>[b[0],b[1],b[4],b[5]]);
 return DAY_BOXES;
}
function hitsWall(x,z,r){const B=dayBoxes();for(let i=0;i<B.length;i++){const b=B[i];if(x+r>b[0]&&x-r<b[1]&&z+r>b[2]&&z-r<b[3])return true;}return false;}
/* estado do jogador no modo dia */
const dayCam=mkCam(70); dayCam.rotation.order='YXZ';
const D={x:10.6,z:-11,yaw:Math.PI/2,pitch:0,keys:{},move:null,look:null,laughT:4,jingleT:8,bob:0,leaving:false,crowd:null};
function startDay(){
 audio(); buildDay(); stopSix();
 D.x=10.6; D.z=-11; D.yaw=Math.PI/2; D.pitch=0; D.keys={}; D.leaving=false; D.bob=0;
 people.forEach(p=>p.visible=true);
 hideBots(); TARP_UP.visible=false; TARP_DOWN.visible=false;
 const c=new THREE.Vector3(0,1.6,-18);
 [['xinglau',-3,-25.8],['bruna',-1,-26.3],['toco',1,-26.3],['sandega',3,-25.8],['fernanda',5,-25]].forEach(([id,x,z],i)=>{putBot(id,x,.6,z,1,0,-14);bots[id].userData.pose='perform';bots[id].userData.ph=i*.7;});
 const zb=bots.zig; zb.visible=true; zb.scale.setScalar(zb.userData.base); zb.position.set(12.9,.6-1.0*zb.userData.base,-20.8); zb.userData.sit=true; zb.userData.pose='idle';
 doorL.position.y=doorR.position.y=3.5;
 scene.fog.color.setHex(0x2a2018); scene.fog.near=8; scene.fog.far=48;
 setMode('day');
 if(hasSnd('dayAmb')) sloop('dayAmb',.45); else D.crowd=startCrowd();
 if(hasSnd('arcade')) sloop('arcade',.12);
}
function endDay(){
 people.forEach(p=>p.visible=false);
 sunloop('dayAmb',.5); sunloop('arcade',.5); if(D.crowd){D.crowd.stop();D.crowd=null;}
 if(document.pointerLockElement) document.exitPointerLock();
 scene.fog.color.setHex(0x020103); scene.fog.near=2.5; scene.fog.far=19;
}
/* murmúrio de gente sintetizado (se não houver arquivo de som) */
function startCrowd(){
 const a=A.ctx; if(!a) return null;
 if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 const src=a.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
 const f=a.createBiquadFilter(); f.type='bandpass'; f.frequency.value=650; f.Q.value=.7;
 const gn=a.createGain(); gn.gain.value=.07;
 const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=.35; lg.gain.value=.03; lfo.connect(lg); lg.connect(gn.gain); lfo.start();
 src.connect(f); f.connect(gn); gn.connect(A.bus.amb); src.start();
 return {stop(){try{src.stop();lfo.stop();}catch(e){}}};
}
function kidLaugh(){if(hasSnd('kids')){play('kids',{vol:.35,pan:Math.random()*1.6-.8});return;}const p=Math.random()*1.6-.8,b=600+Math.random()*300;for(let i=0;i<5;i++)tone(b+(i%2)*120,.07,'triangle',.05,p,i*.09);}
function stageJingle(){const n=[523,659,784,659,880,784,659,523,587,659,523];n.forEach((f,i)=>{tone(f,.22,'square',.035,0,i*.18);tone(f/2,.22,'triangle',.03,0,i*.18);});}
const dayRay=new THREE.Raycaster(), _c0=new THREE.Vector2(0,0);
function updateDay(dt,t){
 if(D.leaving) return;
 const run=D.keys.shift?1.7:1;
 let fx=0,fz=0;
 if(D.keys.w||D.keys.arrowup) fz-=1; if(D.keys.s||D.keys.arrowdown) fz+=1;
 if(D.keys.a||D.keys.arrowleft) fx-=1; if(D.keys.d||D.keys.arrowright) fx+=1;
 if(D.move){fx+=D.move.x;fz+=D.move.y;}
 const len=Math.hypot(fx,fz);
 if(len>.05){
  fx/=Math.max(1,len); fz/=Math.max(1,len);
  const sp=2.6*run*dt, cs=Math.cos(D.yaw), sn=Math.sin(D.yaw);
  const mx2=(fx*cs+fz*sn)*sp, mz2=(-fx*sn+fz*cs)*sp;
  if(!hitsWall(D.x+mx2,D.z,.28)) D.x+=mx2;
  if(!hitsWall(D.x,D.z+mz2,.28)) D.z+=mz2;
  D.bob+=dt*9*run;
  if(Math.floor(D.bob/Math.PI)!==Math.floor((D.bob-dt*9*run)/Math.PI)) noise(.06,.12,180,'lowpass',0);
 }
 dayCam.position.set(D.x,1.6+Math.sin(D.bob)*.03,D.z);
 dayCam.rotation.set(D.pitch,D.yaw,0,'YXZ');
 updatePeople(dt,t);
 animBots(dt,t);
 stoolTop.rotation.y+=dt*2.4;
 D.laughT-=dt; if(D.laughT<=0){D.laughT=5+Math.random()*8;kidLaugh();}
 D.jingleT-=dt; if(D.jingleT<=0){D.jingleT=22+Math.random()*10;stageJingle();}
 // o que estou olhando
 dayRay.setFromCamera(_c0,dayCam); dayRay.far=5;
 let lbl='';
 const hits=dayRay.intersectObjects(['xinglau','bruna','toco','sandega','fernanda','zig'].map(id=>bots[id]),true);
 if(hits.length){let o=hits[0].object;while(o&&!o.userData.type)o=o.parent;if(o){const c=CHARS[o.userData.type];if(c)lbl=c.name+' · '+c.sp;}}
 const nearExit=D.x>10.6&&Math.abs(D.z+11)<1.1;
 if(nearExit) lbl='SAÍDA · aperte E (ou toque aqui) para ir embora';
 $('#dayLabel').textContent=lbl; $('#dayLabel').classList.toggle('exit',nearExit); $('#dayLabel').style.opacity=lbl?1:0;
 if(D.x>11.75&&Math.abs(D.z+11)<.6) leaveDay();
}
function leaveDay(){
 if(D.leaving) return; D.leaving=true;
 $('#dayFade').classList.add('on'); play('doorOpen',{dur:1.2,vol:.8});
 setTimeout(()=>{$('#dayFade').classList.remove('on');endDay();setMode('menu');},1300);
}
function dayLights(t){
 Object.values(LIGHTS).forEach(l=>l.intensity=l.userData.base*3.2);
 stageA.intensity=1.6+Math.sin(t*1.3)*.2; stageB.intensity=1.6+Math.cos(t*1.1)*.2;
 lamp.intensity=1.3; amb.intensity=.95; redL.intensity=redR.intensity=0; camLight.intensity=0; clownLight.intensity=0;
}
/* controles do modo dia */
(function dayInput(){
 const lookEl=$('#dayLook');
 lookEl.addEventListener('click',()=>{if(mode==='day'&&matchMedia('(pointer:fine)').matches&&!document.pointerLockElement){try{lookEl.requestPointerLock();}catch(e){}}});
 addEventListener('mousemove',e=>{if(mode==='day'&&document.pointerLockElement===lookEl){D.yaw-=e.movementX*.0025;D.pitch=Math.max(-1.2,Math.min(1.2,D.pitch-e.movementY*.0025));}});
 addEventListener('keydown',e=>{if(mode!=='day')return;const k=e.key.toLowerCase();D.keys[k]=true;if(k==='shift')D.keys.shift=true;if(k==='e'){const nearExit=D.x>10.6&&Math.abs(D.z+11)<1.1;if(nearExit)leaveDay();}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();});
 addEventListener('keyup',e=>{if(mode!=='day')return;const k=e.key.toLowerCase();D.keys[k]=false;if(k==='shift')D.keys.shift=false;});
 // toque: metade esquerda anda, metade direita olha
 lookEl.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;try{lookEl.setPointerCapture(e.pointerId);}catch(_){}if(e.clientX<innerWidth/2)D.move={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:0,y:0};else D.look={id:e.pointerId,x:e.clientX,y:e.clientY};});
 lookEl.addEventListener('pointermove',e=>{if(D.move&&D.move.id===e.pointerId){D.move.x=Math.max(-1,Math.min(1,(e.clientX-D.move.sx)/60));D.move.y=Math.max(-1,Math.min(1,(e.clientY-D.move.sy)/60));}else if(D.look&&D.look.id===e.pointerId){D.yaw-=(e.clientX-D.look.x)*.005;D.pitch=Math.max(-1.2,Math.min(1.2,D.pitch-(e.clientY-D.look.y)*.005));D.look.x=e.clientX;D.look.y=e.clientY;}});
 const end=e=>{if(D.move&&D.move.id===e.pointerId)D.move=null;if(D.look&&D.look.id===e.pointerId)D.look=null;};
 lookEl.addEventListener('pointerup',end); lookEl.addEventListener('pointercancel',end);
 $('#dayLabel').addEventListener('click',()=>{if(D.x>10.6&&Math.abs(D.z+11)<1.1)leaveDay();});
 $('#bDayQuit').onclick=()=>{endDay();setMode('menu');};
})();

/* ================= MINIGAMES (fitas no estilo Atari) ================= */
const MGW=256, MGH=192, TS=16;
const mgCv=$('#miniCv'), mgX=mgCv.getContext('2d'); mgX.imageSmoothingEnabled=false;
const MGK=new Set(); let MG=null;
const MAPS={
 cake:["################","#SSSSSSSSSSSSSS#","#SSSSSSSSSSSSSS#","#..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","C..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","B..............#","################"],
 stage:["################","#SSSSSSSSSSSSSS#","#SSSSSSSSSSSSSS#","#SSSSSSSSSSSSSS#","#..............E","#..............#","#..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","#..............#","################"],
 duct:["################","#=====#========#","####=##=######=#","#====#==#====#=#","#=####=##=##=#=#","#======#===#===#","######=#=#=#####","#======#=#=====#","#=######=#####=#","#========#===#=#","########===#===#","################"],
 party:["################","#SSSSSSSSSSSSSS#","#SSSSSSSSSSSSSS#","#..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","B..............#","################"],
 dark:["################","#KKKK#.........#","#KKKK#.TT..TT..#","#KKKK..TT..TT..#","#KKKK#.........#","######...SSSS..#","#BB..#...SSSS..#","#....#.........#","#....##.####.###","#..............#","#..............#","################"],
 show87:["################","#SSSSSSSSSSSSSS#","#SSSSSSSSSSSSSS#","#..............E","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","#.TT...TT...TT.#","#.TT...TT...TT.#","#..............#","#..............#","################"]
};
const WALK=new Set(['.','S','K','=','B','C']);
const PAL={
 xinglau:{h:'#e8b628',b:'#d9a624',s:'#ff7a1c',e:'#f6e8a8',t:'duck'}, bruna:{h:'#f06a1c',b:'#e0601c',s:'#fff0dc',e:'#f06a1c',t:'fox'},
 fernanda:{h:'#ffe4e4',b:'#e01868',s:'#ffa020',e:'#ff4a2a',t:'bird'}, toco:{h:'#3a88e8',b:'#3a78c8',s:'#f4ecdc',e:'#2a5aa8',t:'dog'},
 zig:{h:'#e41a52',b:'#d8203a',s:'#d8a874',e:'#d8a874',t:'monkey'}, bob:{h:'#d8252c',b:'#a8141c',s:'#f8a0a0',e:'#7a1015',t:'dog'},
 clown:{h:'#f4f0e8',b:'#dccca8',s:'#1c2848',e:'#2c3c5e',t:'clown'}
};
let P_=(x,y,w,h,c)=>{mgX.fillStyle=c;mgX.fillRect(x,y,w,h);};
/* desenha o personagem com o ponto (0,0) nos pés */
function drawSpr(k,fr,o){
 const b=fr%2, P=P_;
 if(k==='kid'){const c=o.color||'#3b6fd6',sad=o.sad;P(-3,-4+b,2,4,'#24243a');P(1,-4+(1-b),2,4,'#24243a');P(-4,-10,8,6,sad?'#6a6a6a':c);P(-4,-17,8,7,sad?'#9a9a9a':'#f6c8a4');P(-2,-14,1,1,'#111');P(1,-14,1,1,'#111');
  if(sad){P(-2,-13,1,2,'#7ac8ff');P(1,-13,1,2,'#7ac8ff');P(-1,-11,2,1,'#333');}else P(-1,-12,3,1,'#a83030');
  if(!sad){mgX.fillStyle=o.hat||'#ffd23f';mgX.beginPath();mgX.moveTo(-3,-17);mgX.lineTo(3,-17);mgX.lineTo(0,-23);mgX.fill();}return;}
 if(k==='staff'){P(-3,-5+b,2,5,'#1a1a28');P(1,-5+(1-b),2,5,'#1a1a28');P(-5,-13,10,8,'#c41a22');P(-5,-11,10,1,'#ffd23f');P(-5,-21,10,8,o.mask||'#f1c9a5');P(-3,-18,2,2,'#000');P(1,-18,2,2,'#000');P(-2,-15,4,1,'#000');P(-6,-23,12,2,'#c41a22');return;}
 if(k==='shocker'){mgX.globalAlpha=.92;P(-3,-10,2,10,'#000');P(1,-10,2,10,'#000');P(-5,-22,10,12,'#000');P(-7,-21,2,10,'#000');P(5,-21,2,10,'#000');P(-4,-30,8,8,'#000');mgX.globalAlpha=1;P(-3,-27,2,1,'#dff4ff');P(1,-27,2,1,'#dff4ff');
  mgX.strokeStyle=Math.random()<.5?'#9ad0ff':'#ffe066';mgX.lineWidth=1;mgX.beginPath();let x=(Math.random()-.5)*14,y=-Math.random()*30;mgX.moveTo(x,y);for(let i=0;i<4;i++){x+=(Math.random()-.5)*10;y+=(Math.random()-.5)*10;mgX.lineTo(x,y);}mgX.stroke();return;}
 if(k==='soul'){mgX.globalAlpha=o.alpha==null?.85:o.alpha;P(-4,-5,3,5,'#9a9aa8');P(1,-5,3,5,'#9a9aa8');P(-6,-15,12,10,'#c8c8d0');for(let i=0;i<4;i++)P(-5+i*3,-15,1,1,'#555');P(-5,-25,10,10,'#e8e8f0');P(-4,-22,3,3,'#3a5aa0');P(1,-22,3,3,'#3a5aa0');P(-1,-19,2,2,'#7a7a8a');P(-3,-17,6,1,'#555');
  P(-3,-19,1,3,'#7ac8ff');P(3,-19,1,3,'#7ac8ff');P(-1,-30,2,5,'#8a96a8');mgX.globalAlpha=1;return;}
 const S=PAL[k]||PAL.xinglau, t=S.t;
 P(-5,-5+b,4,5,'#1c1818'); P(1,-5+(1-b),4,5,'#1c1818');
 if(t==='duck'){P(-6,-1,5,1,S.s);P(1,-1,5,1,S.s);}
 P(-6,-14,12,9,S.b); P(-6,-12,12,1,'#111'); P(-6,-10,12,1,'#111');
 P(-3,-12,6,5,'#111'); P(-2,-11,4,3,S.h);
 const ay=b?0:1; P(-9,-14+ay,3,7,S.b); P(6,-14+(1-ay),3,7,S.b); P(-9,-7+ay,3,2,S.h); P(6,-7+(1-ay),3,2,S.h);
 if(k==='clown'){P(-6,-14,12,9,'#dccca8');P(-2,-14,2,9,'#1a1c26');P(2,-11,2,2,'#1a1c26');P(-1,-13,2,1,'#000');P(-1,-9,2,1,'#000');P(-7,-15,14,2,'#f4f0e8');}
 const hy=-25;
 if(t==='fox'){P(-6,hy-4,3,4,S.e);P(3,hy-4,3,4,S.e);P(-5,hy-3,1,2,'#ffb0c0');P(4,hy-3,1,2,'#ffb0c0');}
 if(t==='dog'){P(-8,hy+1,2,7,S.e);P(6,hy+1,2,7,S.e);}
 if(t==='monkey'){P(-8,hy+2,2,4,S.e);P(6,hy+2,2,4,S.e);for(let i=0;i<5;i++)P(-5+i*2,hy-2-(i%2),2,2,S.h);}
 if(t==='bird'){for(let i=0;i<4;i++)P(-3+i*2,hy-3-(i%2)*2,1,4,S.e);}
 if(t==='duck'){P(-2,hy-3,1,3,S.e);P(0,hy-4,1,4,S.e);P(2,hy-2,1,2,S.e);}
 if(t==='clown'){P(-1,hy-6,3,6,'#6c7c94');P(-9,hy+1,3,2,S.e);P(6,hy+1,3,2,S.e);P(-10,hy+3,2,4,S.e);P(8,hy+3,2,4,S.e);}
 P(-6,hy,12,11,S.h); P(-6,hy+9,12,2,'rgba(0,0,0,.25)');
 if(t==='monkey') P(-4,hy+2,8,8,S.s);
 const look=o.dir==='l'?-1:(o.dir==='r'?1:0), eyeC=o.red?'#ff2a1a':(o.glow?'#ffffff':'#111');
 if(t==='clown'){P(-4,hy+2,3,5,'#2a5cae');P(1,hy+2,3,5,'#2a5cae');P(-4,hy+3,3,2,'#050404');P(1,hy+3,3,2,'#050404');P(-3,hy+3,1,1,'#ff2a2a');P(-1,hy+6,2,2,S.s);P(-3,hy+8,6,1,'#c8141a');}
 else {P(-5,hy+2,4,4,'#0a0606');P(1,hy+2,4,4,'#0a0606');P(-4,hy+3,3,3,'#f6f2e8');P(2,hy+3,3,3,'#f6f2e8');P(-3+look,hy+4,1,1,eyeC);P(3+look,hy+4,1,1,eyeC);
  if(t==='duck'||t==='bird'){P(-4,hy+7,8,3,S.s);P(-3,hy+8,6,1,'#5a1a08');}
  else if(t!=='monkey'){P(-3,hy+6,6,4,S.s);P(-1,hy+6,2,1,'#111');P(-2,hy+9,4,1,'#5a1010');}
  else {P(-1,hy+5,2,1,'#5a3a20');P(-2,hy+8,4,1,'#5a1010');}
  if(o.red){mgX.fillStyle='rgba(255,40,30,.35)';mgX.fillRect(-6,hy+1,12,6);}}
}
function spr(k,x,y,fr,o){o=o||{};const sc=o.sc||1.5;mgX.save();mgX.translate(Math.round(x),Math.round(y));mgX.scale(sc,sc);if(o.flip)mgX.scale(-1,1);drawSpr(k,fr,o);mgX.restore();}
function mgTile(c,x,y,t,M){
 const X=x*TS,Y=y*TS,P=P_;
 if(c==='#'){P(X,Y,TS,TS,'#000');const m=M.map,edge=(dx,dy)=>WALK.has((m[y+dy]||'')[x+dx]);const col=M.wallC||'#6a3ad8';if(edge(0,1))P(X,Y+TS-2,TS,2,col);if(edge(0,-1))P(X,Y,TS,2,col);if(edge(1,0))P(X+TS-2,Y,2,TS,col);if(edge(-1,0))P(X,Y,2,TS,col);}
 else if(c==='.'||c==='C'||c==='B'){P(X,Y,TS,TS,'#06060c');P(X,Y,TS,1,'#121230');P(X,Y,1,TS,'#121230');
  if(c==='C'){P(X+1,Y+2,14,12,'#5a3a20');P(X+3,Y+4,10,4,'#ffe2e8');P(X+5,Y+2,6,3,'#e8486a');}
  if(c==='B'){P(X+2,Y,12,TS,'#3a2418');P(X+3,Y+2,10,12,'#24160e');P(X+11,Y+8,2,2,'#c9a227');}}
 else if(c==='S'){P(X,Y,TS,TS,'#2a0c2a');P(X,Y+15,TS,1,'#4a1a4a');if((x*7+y*3)%5===0){P(X+7,Y+6,2,2,'#ffd23f');}}
 else if(c==='T'){P(X,Y,TS,TS,'#06060c');P(X+1,Y+1,14,14,'#3a2a6a');P(X+1,Y+1,14,2,'#e8e2f0');}
 else if(c==='K'){P(X,Y,TS,TS,'#0c1a14');P(X,Y,TS,1,'#1c3a2a');P(X,Y,1,TS,'#1c3a2a');}
 else if(c==='='){P(X,Y,TS,TS,'#14161c');P(X,Y+4,TS,1,'#22262e');P(X,Y+12,TS,1,'#22262e');if((x+y)%3===0)P(X+7,Y+7,2,2,'#3a3e48');}
 else if(c==='E'){P(X,Y,TS,TS,'#000');P(X+2,Y+1,12,14,'#5a5e66');P(X+3,Y+2,10,12,'#3a3e46');mgX.fillStyle='#ffd23f';mgX.beginPath();mgX.moveTo(X+9,Y+3);mgX.lineTo(X+5,Y+9);mgX.lineTo(X+8,Y+9);mgX.lineTo(X+6,Y+13);mgX.lineTo(X+11,Y+7);mgX.lineTo(X+8,Y+7);mgX.fill();}
 else P(X,Y,TS,TS,'#000');
}
const tile=(tx,ty)=>({x:tx*TS+8,y:ty*TS+13});
function mgFree(px,py){const r=4;for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r]]){const c=(MG.map[Math.floor((py+dy)/TS)]||'')[Math.floor((px+dx)/TS)];if(!WALK.has(c))return false;}return true;}
function mgSay(lines,cb){MG.dialog={lines,i:0,ch:0,cb};}
function near(e,d){return Math.hypot(e.x-MG.p.x,e.y-MG.p.y)<(d||14);}
function blip(f,d,v){tone(f,d||.06,'square',v||.05);}
function zap(){noise(.25,.25,3000,'highpass');tone(1400,.2,'sawtooth',.06,0,0,200);}
function bolt(x1,y1,x2,y2,c){mgX.strokeStyle=c||'#9ad0ff';mgX.lineWidth=1;mgX.beginPath();mgX.moveTo(x1,y1);const n=6;for(let i=1;i<n;i++){mgX.lineTo(x1+(x2-x1)*i/n+(Math.random()-.5)*8,y1+(y2-y1)*i/n+(Math.random()-.5)*8);}mgX.lineTo(x2,y2);mgX.stroke();}
/* ---------------- as 6 fitas ---------------- */
const MINIS=[
 {title:'LEVE O BOLO',sub:'ÀS CRIANÇAS',year:'Estreia da Liga · 2016',hero:'xinglau',map:'cake',start:[7,9],music:'mgHappy',
  setup(M){M.kids=[[3,3],[8,3],[13,6],[3,9],[9,9],[13,9]].map(([x,y],i)=>Object.assign(tile(x,y),{color:['#e0303f','#49c06a','#7a3cc0','#2ab3c0','#f2b33d','#e97db4'][i],mood:60+Math.random()*40}));
   M.cakes=0;M.score=0;M.time=50;M.phase=0;M.goal='';mgSay(['XINGLAU: QUÁ! Estreia da Liga Mistério!','Pegue bolo no balcão (à esquerda) e leve para as crianças antes que elas fiquem tristes!']);},
  update(M,dt){
   if(M.phase===0){M.time-=dt;
    if(M.p.x<20&&M.p.y>6*TS&&M.p.y<7*TS+4&&M.cakes<3){M.cakes=3;blip(660);blip(990,.08,.04);}
    M.kids.forEach(k=>{k.mood=Math.max(0,k.mood-dt*(5+M.score*.35));if(M.cakes>0&&k.mood<80&&near(k,18)){M.cakes--;k.mood=100;M.score++;blip(880);blip(1320,.08,.04);M.pop={x:k.x,y:k.y-30,t:.6};}});
    M.goal='BOLOS '+M.cakes+'   ENTREGUES '+M.score+'   TEMPO '+Math.ceil(M.time);
    if(M.time<=0||M.score>=16){M.phase=1;M.goal='';musicStop();mgSay(['A festa acabou. As crianças foram embora.','...','23:58. Alguém ficou para trás.'],()=>{M.kids=[];M.dark=48;M.shock=Object.assign(tile(7,2),{});M.phase=2;M.slow=.45;tone(70,1.5,'sawtooth',.08,0,0,40);});}}
   else if(M.phase===2){const sh=M.shock;if(near(sh,40)){M.phase=3;M.tgt=tile(0,10);}}
   else if(M.phase===3){const sh=M.shock,d=Math.hypot(M.tgt.x-sh.x,M.tgt.y-sh.y);if(d>2){sh.x+=(M.tgt.x-sh.x)/d*30*dt;sh.y+=(M.tgt.y-sh.y)/d*30*dt;}else{M.phase=4;zap();M.flash=1;M.glitch=1;mgSay(['A sombra atravessou a porta do porão como se ela não existisse.','Faíscas correram pelas paredes atrás dela.'],()=>M.end=true);}}
  },
  draw(M){M.kids.forEach((k,i)=>{spr('kid',k.x,k.y,Math.floor(M.t*3+i),{sc:1.3,color:k.color,sad:k.mood<25,hat:k.mood>60?'#ffd23f':'#888'});const w=Math.round(k.mood/100*12);P_(k.x-6,k.y-36,12,2,'#222');P_(k.x-6,k.y-36,w,2,k.mood<25?'#e0303f':(k.mood<60?'#f2b33d':'#49c06a'));});
   if(M.shock&&M.phase>=2&&M.phase<4)spr('shocker',M.shock.x,M.shock.y,0,{sc:1.6});
   if(M.pop){M.pop.t-=1/60;if(M.pop.t>0){mgX.fillStyle='#ffd23f';mgX.font='12px VT323, monospace';mgX.textAlign='center';mgX.fillText('+1',M.pop.x,M.pop.y-(.6-M.pop.t)*20);mgX.textAlign='left';}}
   for(let i=0;i<M.cakes;i++){P_(M.p.x-8+i*6,M.p.y-44,5,4,'#ffe2e8');P_(M.p.x-8+i*6,M.p.y-45,5,1,'#e8486a');}},
  lore:['Desde a estreia, toda noite, o Xinglau vai até a porta do porão e fica parado ali.','Ele não está esperando ninguém.','Ele está vigiando o que desceu por ela.']},
 {title:'NÃO OLHE',sub:'PARA A LUZ',year:'Show de mágica · 2017',hero:'bruna',map:'stage',start:[7,10],music:'mgHappy',wallC:'#d8a020',
  setup(M){M.stars=[[2,4],[13,5],[7,6],[1,10],[14,10]].map(([x,y])=>Object.assign(tile(x,y),{got:false}));M.beams=[0,1,2].map(i=>({x:40+i*80,y:110,ph:i*2.1,sp:.8+i*.25}));M.got=0;M.stun=0;M.phase=0;
   mgSay(['BRUNA: Pegue as 5 estrelas do meu truque!','Mas cuidado: os holofotes estão ligados. Não deixe a luz te pegar.']);},
  update(M,dt){
   M.beams.forEach(b=>{b.x=128+Math.sin(M.t*b.sp+b.ph)*100;b.y=96+Math.cos(M.t*b.sp*.7+b.ph)*44;});
   if(M.phase===0){
    if(M.stun>0){M.stun-=dt;M.lock=true;}else M.lock=false;
    if(M.stun<=0&&M.beams.some(b=>((M.p.x-b.x)/22)**2+((M.p.y-b.y)/12)**2<1)){M.stun=1.2;M.flash=.8;tone(1200,.3,'sawtooth',.06,0,0,300);const s=tile(7,10);M.p.x=s.x;M.p.y=s.y;}
    M.stars.forEach(s=>{if(!s.got&&near(s,13)){s.got=true;M.got++;blip(1046);blip(1568,.08,.04);}});
    M.goal='ESTRELAS '+M.got+'/5';
    if(M.got===5){M.phase=1;M.goal='Vá para o centro do palco';M.tgt=tile(7,2);}}
   else if(M.phase===1&&near(M.tgt,14)){M.phase=2;M.goal='';musicStop();M.cable=0;mgSay(['BRUNA: E agora... o grande final!'],()=>{M.phase=3;});}
   else if(M.phase===3){M.cable+=dt*.45;if(M.cable>=1){M.phase=4;M.flash=1.5;M.dark=26;noise(.6,.6,2000,'bandpass');tone(220,.6,'sawtooth',.2,0,0,60);setTimeout(()=>{if(MG===M)mgSay(['O holofote estourou bem no rosto dela.','As crianças acharam que era parte do truque. Aplaudiram de pé.'],()=>M.end=true);},800);}}
  },
  draw(M){
   M.stars.forEach(s=>{if(!s.got){const by=Math.sin(M.t*4+s.x)*2;mgX.fillStyle='#ffd23f';starPath(mgX,s.x,s.y-12+by,6,3,5);mgX.fill();}});
   if(M.phase<2) M.beams.forEach(b=>{mgX.fillStyle='rgba(255,245,190,.18)';mgX.beginPath();mgX.moveTo(b.x-4,0);mgX.lineTo(b.x-22,b.y);mgX.lineTo(b.x+22,b.y);mgX.lineTo(b.x+4,0);mgX.fill();mgX.fillStyle='rgba(255,250,210,.35)';mgX.beginPath();mgX.ellipse(b.x,b.y,22,12,0,0,7);mgX.fill();});
   if(M.phase>=1&&M.phase<4){mgX.fillStyle='rgba(255,245,190,.25)';mgX.beginPath();mgX.moveTo(7*TS+4,0);mgX.lineTo(7*TS-12,2*TS+13);mgX.lineTo(7*TS+28,2*TS+13);mgX.lineTo(7*TS+12,0);mgX.fill();}
   if(M.phase===3){const ex=15*TS,ey=4*TS+8,tx=7*TS+8,k=Math.min(1,M.cable);P_(tx,0,1,4,'#555');mgX.strokeStyle='#333';mgX.beginPath();mgX.moveTo(ex,ey);mgX.lineTo(tx,4);mgX.stroke();const cx=ex+(tx-ex)*k,cy=ey+(4-ey)*k;bolt(cx-6,cy+4,cx+6,cy-4,'#ffe066');bolt(ex,ey,cx,cy,'#9ad0ff');}
  },
  lore:['Quando o técnico abriu o holofote queimado, os fios por dentro estavam derretidos.','Em formato de mão.','A Bruna nunca mais olhou para uma luz.']},
 {title:'DENTRO',sub:'DAS PAREDES',year:'Manutenção · 2018',hero:'fernanda',map:'duct',start:[1,1],music:'mgCreepy',dark:44,wallC:'#3a7ad8',
  setup(M){M.pieces=[[14,1],[1,7],[14,10]].map(([x,y])=>Object.assign(tile(x,y),{got:false}));M.sparks=[[4,3],[6,5],[10,5],[8,8],[12,7],[10,10]].map(([x,y],i)=>({x:x*TS+8,y:y*TS+8,ph:i*1.3}));M.check=tile(1,1);M.got=0;
   mgSay(['A Fernanda subiu nos dutos de novo. Lá dentro, os fios estalam.','Junte os 3 pedaços da fita VHS. Não encoste nas faíscas.']);},
  update(M,dt){
   M.sparks.forEach(s=>{s.on=Math.sin(M.t*2.2+s.ph)>.1;if(s.on&&Math.hypot(s.x-M.p.x,s.y-(M.p.y-6))<11&&!M.hurt){M.hurt=.8;zap();M.flash=.6;M.p.x=M.check.x;M.p.y=M.check.y;}});
   if(M.hurt>0)M.hurt-=dt;
   M.pieces.forEach(p=>{if(!p.got&&near(p,12)){p.got=true;M.got++;M.check={x:p.x,y:p.y};blip(660);blip(880,.08,.04);}});
   if(!M.vhs) M.goal='PEDAÇOS DA FITA '+M.got+'/3';
   if(M.got===3&&!M.vhs){M.vhs=7;musicStop();staticBurst(.8,.1);}
   if(M.vhs) M.goal='';
   if(M.vhs>0){M.vhs-=dt;if(M.vhs<=0){M.vhs=-1;mgSay(['A fita acaba aí.'],()=>M.end=true);}}
  },
  draw(M){M.pieces.forEach(p=>{if(!p.got){P_(p.x-5,p.y-9,10,6,'#111');P_(p.x-4,p.y-8,8,2,'#e8e2d0');}});
   M.sparks.forEach(s=>{if(s.on){bolt(s.x-8,s.y-4,s.x+8,s.y+4,'#ffe066');bolt(s.x-6,s.y+5,s.x+6,s.y-5,'#9ad0ff');}else P_(s.x-1,s.y-1,2,2,'#444');});},
  overlay(M){if(M.vhs>0){const k=7-M.vhs;mgX.fillStyle='#000';mgX.fillRect(0,0,MGW,MGH);
   P_(0,130,MGW,62,'#1a0c1a');P_(40,120,176,12,'#3a1a2a');
   spr('bob',128,124,Math.floor(k*3),{sc:2.2,red:k>4.2});
   if(k<4.4)spr('clown',184,170,Math.floor(k*4),{sc:1.6});
   for(let i=0;i<5;i++)spr('kid',40+i*28,184,Math.floor(k*2+i),{sc:1.1,color:['#e0303f','#49c06a','#7a3cc0','#2ab3c0','#f2b33d'][i]});
   if(k>3.6&&k<4.4){mgX.fillStyle='rgba(255,255,255,'+(Math.random()*.8)+')';mgX.fillRect(0,0,MGW,MGH);bolt(0,0,128,80,'#9ad0ff');bolt(256,0,128,80,'#ffe066');if(!M.cracked){M.cracked=1;zap();noise(.4,.4,800,'bandpass');}}
   if(k>4.4){mgX.fillStyle='rgba(0,0,0,'+Math.min(1,(k-4.4))+')';mgX.fillRect(0,0,MGW,MGH);}
   const d=mgX.getImageData(0,0,MGW,MGH);for(let i=0;i<d.data.length;i+=4*7){const v=Math.random()*90;d.data[i]+=v;d.data[i+1]+=v;d.data[i+2]+=v;}mgX.putImageData(d,0,0);
   mgX.fillStyle='#ff4a4a';mgX.font='12px VT323, monospace';mgX.fillText('▶ PLAY   26/10/1987   21:14',8,14);}},
  lore:['A Fernanda assistiu a fita de novo. E de novo. E de novo.','Em todas as vezes, o palhaço da festa olha para a câmera um segundo antes das luzes estourarem.','Como se soubesse.']},
 {title:'ABRACE',sub:'A TURMA',year:'Aniversário · 2019',hero:'toco',map:'party',start:[7,9],music:'mgHappy',wallC:'#3ab0e8',
  setup(M){M.staff=[[3,3],[12,3],[2,9],[13,9]].map(([x,y],i)=>Object.assign(tile(x,y),{mask:['#e8b628','#f06a1c','#e01868','#5fae4a'][i],hug:false,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*40}));M.phase=0;
   mgSay(['TOCO: Os funcionários estão de máscara da Liga! Eles são da turma!','Dê um abraço em cada um. Eles não ficam parados!']);},
  update(M,dt){
   if(M.phase===0){M.staff.forEach(s=>{if(s.hug)return;const dx=s.x-M.p.x,dy=s.y-M.p.y,d=Math.hypot(dx,dy);if(d<50){s.vx+=dx/d*90*dt;s.vy+=dy/d*90*dt;}s.vx*=.97;s.vy*=.97;const sp=Math.hypot(s.vx,s.vy);if(sp>42){s.vx*=42/sp;s.vy*=42/sp;}
     const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;const ok=(x,y)=>WALK.has((M.map[Math.floor((y-4)/TS)]||'')[Math.floor(x/TS)]);if(ok(nx,s.y))s.x=nx;else s.vx*=-1;if(ok(s.x,ny))s.y=ny;else s.vy*=-1;
     if(Math.random()<dt*.6){s.vx+=(Math.random()-.5)*60;s.vy+=(Math.random()-.5)*60;}
     if(near(s,15)){s.hug=true;blip(784);blip(988,.1,.04);M.heart={x:s.x,y:s.y-34,t:1};}});
    const n=M.staff.filter(s=>s.hug).length;M.goal='ABRAÇOS '+n+'/4';
    if(n===4){M.phase=1;M.goal='';musicStop();M.dark=60;M.soul=tile(14,10);mgSay(['As luzes da festa se apagaram.','Alguém está chorando no canto.'],()=>{M.phase=2;});}}
   else if(M.phase===2){M.sobT=(M.sobT||0)-dt;if(M.sobT<=0){M.sobT=1.6;[0,.2].forEach(w=>tone(420-w*200,.25,'triangle',.03,.6,w,300));}
    if(near(M.soul,18)){M.phase=3;mgSay(['PALHAÇO: Você... me vê?','PALHAÇO: Faz tanto tempo. Ninguém nunca veio me procurar.','O Toco abraça o palhaço. Ele é frio, como uma sala vazia.','PALHAÇO: Cuidado. Ele ainda está aqui. Nos fios. Debaixo da lona.'],()=>{M.fade=1;setTimeout(()=>{if(MG===M)M.end=true;},1500);});}}
  },
  draw(M){M.staff.forEach((s,i)=>{spr('staff',s.x,s.y,Math.floor(M.t*4+i),{sc:1.4,mask:s.mask});if(s.hug)P_(s.x-2,s.y-36,4,3,'#ff6a8a');});
   if(M.soul&&M.phase>=2)spr('soul',M.soul.x,M.soul.y,0,{sc:1.6,alpha:M.fade?Math.max(0,M.fade-=1/90):.85});
   if(M.heart){M.heart.t-=1/60;if(M.heart.t>0){mgX.fillStyle='#ff6a8a';mgX.font='14px VT323, monospace';mgX.textAlign='center';mgX.fillText('♥',M.heart.x,M.heart.y-(1-M.heart.t)*14);mgX.textAlign='left';}}},
  lore:['Na gola da fantasia dele tinha um nome bordado à mão. As letras estavam queimadas.','O Toco ficou a noite inteira sentado naquele canto.','De manhã, a fantasia estava no porão de novo. Ninguém a tinha levado.']},
 {title:'A CADEIRA',sub:'PAROU',year:'Queda de energia · 2019',hero:'zig',map:'dark',start:[2,3],music:'mgCreepy',wallC:'#d83a5a',
  setup(M){M.phase=0;M.spin=60;M.time=16;M.want='l';M.lock=true;
   mgSay(['ZIG: Gira! Gira! Não para de girar!','Aperte ← e → alternando para manter a cadeira girando.']);},
  update(M,dt){
   if(M.phase===0){M.lock=true;M.time-=dt;M.spin=Math.max(0,M.spin-dt*(14+(16-M.time)*1.2));M.goal='GIRO '+Math.round(M.spin)+'%   '+Math.ceil(M.time)+'s';M.ang=(M.ang||0)+dt*M.spin*.12;
    if(MGK.has(M.want)){MGK.delete(M.want);M.spin=Math.min(100,M.spin+9);M.want=M.want==='l'?'r':'l';blip(500+M.spin*4,.04,.04);}
    M.fl=M.time<8&&Math.random()<dt*3;
    if(M.time<=0){M.phase=1;M.goal='';musicStop();M.flash=0;M.dark=34;M.lock=false;tone(300,1,'sine',.15,0,0,40);mgSay(['A energia caiu. A cadeira parou.','ZIG: ...quem parou a minha cadeira?','Lá longe, alguém está rindo.'],()=>{M.phase=2;M.tgt=tile(1,6);});}}
   else if(M.phase===2){M.laughT=(M.laughT||0)-dt;if(M.laughT<=0){M.laughT=2.2;const p=Math.max(-1,Math.min(1,(M.tgt.x-M.p.x)/80));[0,.15,.3].forEach(w=>tone(300-w*100,.1,'square',.03,p,w,220));}
    if(near(M.tgt,14)){M.phase=3;M.scene=4;tone(70,2.5,'sawtooth',.12,0,0,40);}}
   else if(M.phase===3){M.scene-=dt;if(M.scene<=0){M.phase=4;mgSay(['Debaixo da lona, um olho vermelho se abriu.','Não era o BOB olhando. Era a coisa dentro dele.'],()=>M.end=true);}}
  },
  draw(M){if(M.phase===0){const cx=3*TS,cy=3*TS+8;P_(cx-10,cy+2,20,4,'#5a3a30');P_(cx-2,cy+6,4,10,'#888');spr('zig',cx,cy+4,Math.floor(M.ang*2),{sc:1.5,flip:Math.floor(M.ang)%2===1});
    mgX.fillStyle='#ffd23f';mgX.font='28px VT323, monospace';mgX.textAlign='center';mgX.fillText(M.want==='l'?'◀':'▶',128,120);mgX.textAlign='left';P_(80,130,96,6,'#222');P_(80,130,Math.round(M.spin*.96),6,M.spin<30?'#e0303f':'#49c06a');if(M.fl){mgX.fillStyle='rgba(0,0,0,.7)';mgX.fillRect(0,0,MGW,MGH);}}},
  overlay(M){if(M.phase>=3){mgX.fillStyle='#000';mgX.fillRect(0,0,MGW,MGH);const k=4-(M.scene>0?M.scene:0);mgX.fillStyle='#1c2430';mgX.beginPath();mgX.ellipse(128,128,46,70,0,0,7);mgX.fill();mgX.fillRect(82,128,92,64);
   for(let i=0;i<3;i++)if(Math.random()<.5)bolt(20+Math.random()*60,20,128+(Math.random()-.5)*40,110,'#9ad0ff');
   const o=Math.max(0,Math.min(1,(k-2)/1.2));P_(108,100,10,Math.max(1,Math.round(6*o)),'#ff2a1a');mgX.fillStyle='rgba(255,40,30,'+(.25*o)+')';mgX.beginPath();mgX.arc(113,103,14,0,7);mgX.fill();}},
  lore:['O Zig nunca mais saiu de perto da cadeira.','Enquanto ela gira, a coisa dentro do BOB dorme.','Quando ela para... ela acorda com fome.']},
 {title:'26 DE OUTUBRO',sub:'DE 1987',year:'A última festa da Bob\'s',hero:'bob',map:'show87',start:[7,9],music:'mgHappy',secret:true,wallC:'#c82a2a',
  setup(M){M.kids=[[2,3],[13,6],[3,9],[12,9]].map(([x,y],i)=>Object.assign(tile(x,y),{color:['#e0303f','#49c06a','#7a3cc0','#f2b33d'][i],got:false}));M.clown=tile(9,2);M.phase=0;M.balloons=0;
   mgSay(['Bob\'s Pizzaria, 1983. Você é o BOB.','Entregue um balão para cada criança. O Risadinha está fazendo malabarismo no palco.']);},
  update(M,dt){
   if(M.phase===0){M.kids.forEach(k=>{if(!k.got&&near(k,16)){k.got=true;M.balloons++;blip(880);blip(1175,.08,.04);}});M.goal='BALÕES '+M.balloons+'/4';
    if(M.balloons===4){M.phase=1;M.goal='';musicStop();M.shock=Object.assign({},{x:15*TS-4,y:3*TS+13});zap();M.flash=.6;mgSay(['A caixa de força estalou.','Alguma coisa saiu de dentro dela.','CORRA.'],()=>{M.phase=2;M.chase=0;});}}
   else if(M.phase===2){M.chase+=dt;const sh=M.shock,dx=M.p.x-sh.x,dy=M.p.y-sh.y,d=Math.hypot(dx,dy),sp=40+M.chase*9;sh.x+=dx/d*sp*dt;sh.y+=dy/d*sp*dt;M.goal='CORRA!';if(Math.random()<dt*4)zap();
    if(d<10){M.phase=3;M.goal='';M.flash=1.2;M.glitch=2;M.possessed=true;M.lock=true;noise(1,.4,1500,'bandpass');tone(60,2,'sawtooth',.15,0,0,30);
     setTimeout(()=>{if(MG===M){M.dark=30;mgSay(['As luzes do salão estouraram todas ao mesmo tempo.','O BOB se virou para o palco.','...'],()=>{M.red=1.4;noise(.5,.5,500,'lowpass');setTimeout(()=>{if(MG===M)M.end=true;},1600);});}},1300);}}
  },
  draw(M){if(M.phase<3)spr('clown',M.clown.x+Math.sin(M.t*2)*20,M.clown.y,Math.floor(M.t*4),{sc:1.5});
   if(M.phase<3)M.kids.forEach((k,i)=>{spr('kid',k.x,k.y,Math.floor(M.t*3+i),{sc:1.3,color:k.color});if(k.got){mgX.strokeStyle='#ccc';mgX.beginPath();mgX.moveTo(k.x+5,k.y-20);mgX.lineTo(k.x+7,k.y-34);mgX.stroke();P_(k.x+3,k.y-42,8,9,k.color);}});
   if(M.shock&&M.phase>=1&&M.phase<3)spr('shocker',M.shock.x,M.shock.y,0,{sc:1.6});
   if(M.possessed)M.heroRed=true;},
  overlay(M){if(M.red>0){M.red-=1/60;mgX.fillStyle='rgba(160,0,10,'+Math.min(1,M.red)+')';mgX.fillRect(0,0,MGW,MGH);}},
  lore:['A Bob\'s Pizzaria fechou no dia seguinte.','O Risadinha nunca voltou para casa.','E o Shocker nunca saiu do prédio.','Ele só precisava de alguém novo para vestir.']}
];
function miniUnlocked(i){return MINIS[i].secret?!!save.won6:(save.mg||0)>i;}
function startMini(i,onDone){
 audio(); const D0=MINIS[i];
 MG={def:D0,i,map:MAPS[D0.map],wallC:D0.wallC,p:Object.assign(tile(D0.start[0],D0.start[1]),{fr:0,dir:'d'}),t:0,dark:D0.dark||0,dialog:null,goal:'',end:false,lore:null,onDone,title:true,kids:[]};
 setMode('mini'); musicStart(D0.music);
}
function finishMini(){const cb=MG&&MG.onDone;musicStop();MG=null;if(cb)cb();else setMode('menu');}
function mgUpdate(dt){
 const M=MG; if(!M) return; M.t+=dt;
 if(M.title) return;
 if(M.lore){M.lore.ch+=dt*36;return;}
 if(M.end&&!M.dialog){M.lore={i:0,ch:0};musicStart('mgCreepy');return;}
 if(M.flash>0)M.flash-=dt*1.4; if(M.glitch>0)M.glitch-=dt;
 if(M.dialog){const d=M.dialog,len=d.lines[d.i].length;if(d.ch<len){const before=Math.floor(d.ch);d.ch=Math.min(len,d.ch+dt*44);if(Math.floor(d.ch)!==before&&Math.floor(d.ch)%3===0)tone(480+Math.random()*80,.025,'square',.022);}return;}
 if(!M.lock){
  let dx=0,dy=0; if(MGK.has('l'))dx-=1; if(MGK.has('r'))dx+=1; if(MGK.has('u'))dy-=1; if(MGK.has('d'))dy+=1;
  if(dx||dy){const l=Math.hypot(dx,dy),sp=68*(M.slow||1)*dt,nx=M.p.x+dx/l*sp,ny=M.p.y+dy/l*sp;
   if(mgFree(nx,M.p.y-4))M.p.x=nx; if(mgFree(M.p.x,ny-4))M.p.y=ny;
   M.p.fr+=dt*9*(M.slow||1); M.p.dir=dx<0?'l':(dx>0?'r':M.p.dir);
   M.stepT=(M.stepT||0)-dt; if(M.stepT<=0){M.stepT=.2/(M.slow||1);tone(130,.03,'square',.02);}}
 }
 M.def.update(M,dt);
}
function mgAction(){
 const M=MG; if(!M) return;
 if(M.title){M.title=false;blip(660,.08);M.def.setup(M);return;}
 if(M.lore){const L=M.def.lore,cur=L[M.lore.i];if(M.lore.ch<cur.length){M.lore.ch=cur.length;return;}M.lore.i++;M.lore.ch=0;if(M.lore.i>=L.length){if(!M.fin){M.fin=true;M.lore.i=L.length-1;M.lore.ch=999;return;}finishMini();}return;}
 if(M.dialog){const d=M.dialog;if(d.ch<d.lines[d.i].length){d.ch=d.lines[d.i].length;return;}d.i++;d.ch=0;if(d.i>=d.lines.length){M.dialog=null;if(d.cb)d.cb();}}
}
function mgWrap(txt,max){const w=txt.split(' '),out=[];let l='';w.forEach(x=>{if((l+' '+x).trim().length>max){out.push(l.trim());l=x;}else l+=' '+x;});if(l.trim())out.push(l.trim());return out;}
function crt(){const X=mgX;X.fillStyle='rgba(0,0,0,.22)';for(let y=0;y<MGH;y+=2)X.fillRect(0,y,MGW,1);const g2=X.createRadialGradient(128,96,60,128,96,170);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,.6)');X.fillStyle=g2;X.fillRect(0,0,MGW,MGH);}
function mgDraw(){
 const M=MG; if(!M) return; const X=mgX, D0=M.def;
 X.fillStyle='#000'; X.fillRect(0,0,MGW,MGH);
 if(M.title){
  const fl=Math.floor(M.t*3)%2; X.textAlign='center';
  X.fillStyle=fl?'#ffffff':'#ffd23f'; X.font='28px VT323, monospace'; X.fillText(D0.title,128,34);
  X.fillStyle=fl?'#ffd23f':'#ffffff'; X.fillText(D0.sub,128,58);
  X.fillStyle='#8d8574'; X.font='13px VT323, monospace'; X.fillText(D0.year,128,76);
  spr(D0.hero,128,164+Math.abs(Math.sin(M.t*3))*-4,Math.floor(M.t*4),{sc:2.4,dir:'d',red:D0.secret&&Math.sin(M.t*2)>.9});
  X.font='13px VT323, monospace';
  if(Math.sin(M.t*5)>0){X.fillStyle='#ffffff';X.fillText('PRESSIONE ESPAÇO',128,182);}
  X.textAlign='left'; crt(); return;
 }
 if(M.lore){
  const L=D0.lore; X.font='14px VT323, monospace'; let y=44;
  for(let i=0;i<=M.lore.i&&i<L.length;i++){X.fillStyle=i===L.length-1?'#ff5a5a':'#e6dcc4';const txt=i<M.lore.i?L[i]:L[i].slice(0,Math.floor(M.lore.ch));mgWrap(txt,38).forEach(l=>{X.fillText(l,18,y);y+=16;});y+=8;}
  if(M.fin){X.textAlign='center';X.fillStyle='#8d8574';X.fillText('— FIM DA FITA '+(M.i+1)+' —',128,166);X.textAlign='left';}
  X.fillStyle='#6a6458'; X.fillText('ESPAÇO',212,184);
  if(Math.random()<.04){const y2=Math.random()*MGH;X.drawImage(mgCv,0,y2,MGW,8,(Math.random()-.5)*12,y2,MGW,8);}
  crt(); return;
 }
 for(let y=0;y<12;y++)for(let x=0;x<16;x++) mgTile(M.map[y][x],x,y,M.t,M);
 if(M.tgt&&!M.lock){const pul=2+Math.sin(M.t*6)*1.5;X.strokeStyle='#ffd23f';X.lineWidth=1;X.strokeRect(M.tgt.x-8-pul,M.tgt.y-16-pul,16+pul*2,16+pul*2);}
 D0.draw(M);
 spr(D0.hero,M.p.x,M.p.y,Math.floor(M.p.fr),{dir:M.p.dir,glow:M.dark>0,red:M.heroRed,sc:1.5});
 if(M.dark){const g2=X.createRadialGradient(M.p.x,M.p.y-14,M.dark*.3,M.p.x,M.p.y-14,M.dark);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,.97)');X.fillStyle=g2;X.fillRect(0,0,MGW,MGH);}
 if(M.flash>0){X.fillStyle='rgba(255,250,230,'+Math.min(1,M.flash)+')';X.fillRect(0,0,MGW,MGH);}
 if(D0.overlay) D0.overlay(M);
 if(M.glitch>0){for(let i=0;i<6;i++){const y=Math.random()*MGH;X.drawImage(mgCv,0,y,MGW,6,(Math.random()-.5)*24,y,MGW,6);}}
 if(M.goal){X.fillStyle='rgba(0,0,0,.65)';X.fillRect(0,0,MGW,13);X.fillStyle='#ffd23f';X.font='12px VT323, monospace';X.fillText(M.goal,4,10);}
 if(M.dialog){const d=M.dialog,txt=d.lines[d.i].slice(0,Math.floor(d.ch));X.fillStyle='rgba(0,0,0,.94)';X.fillRect(6,MGH-52,MGW-12,46);X.strokeStyle='#ffffff';X.strokeRect(6.5,MGH-51.5,MGW-13,45);X.fillStyle='#ffffff';X.font='13px VT323, monospace';
  mgWrap(txt,42).slice(0,3).forEach((l,i)=>X.fillText(l,12,MGH-38+i*13));if(d.ch>=d.lines[d.i].length&&Math.sin(M.t*8)>0)X.fillText('▼',MGW-18,MGH-10);}
 crt();
}
(function miniInput(){
 const map={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',arrowdown:'d',s:'d'};
 addEventListener('keydown',e=>{if(mode!=='mini')return;const k=e.key.toLowerCase();if(map[k]){if(!e.repeat||!MG||!MG.def||MG.def.map!=='dark'||MG.phase!==0)MGK.add(map[k]);e.preventDefault();}if(k===' '||k==='enter'||k==='e'){e.preventDefault();if(!e.repeat)mgAction();}});
 addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(map[k])MGK.delete(map[k]);});
 document.querySelectorAll('#miniPad [data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();if(k==='a')mgAction();else MGK.add(k);});const up=()=>MGK.delete(k);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up);});
 mgCv.addEventListener('pointerdown',()=>mgAction());
 $('#bMiniSkip').onclick=()=>{if(MG){if(MG.title){MG.title=false;MG.def.setup(MG);}MG.end=true;MG.dialog=null;}};
})();

/* ================= LOOP ================= */
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setSize(w,h,false);
 const rw=Math.max(2,Math.round(PS1_H*w/h)); rt.setSize(rw,PS1_H); postMat.uniforms.res.value.set(rw,PS1_H);
 allCams.forEach(c=>{c.aspect=w/h;c.updateProjectionMatrix();}); camRectKey='';
 if(w>760) gCam.lookAt(-1.05,1.05,0); else gCam.lookAt(0,.25,0);
}
addEventListener('resize',resize); resize();
let last=performance.now();
function frame(ts){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(0,(ts-last)/1000)); last=ts; const t=ts/1000;
 if(mode==='mini'){mgUpdate(dt);mgDraw();return;}
 FANS.forEach((f,i)=>f.rotation.y+=dt*(mode==='day'?5:(g&&g.powerOut?0:1.6+i*.2)));
 if(mode==='game'&&g&&!g.over&&!g.paused){update(dt);}
 if(mode==='day'){updateDay(dt,t);dayLights(t);}
 if(mode==='cut'){updateCut(dt,t);}
 animate(dt,t);
 if(mode==='game'&&g&&!g.over) renderHUD();
 const P=postMat.uniforms; P.time.value=t; P.cctv.value=0; P.grain.value=0; P.flash.value=0;
 if(mode==='game'||mode==='jumpscare'||mode==='cut'){renderTo(scene,playerCam);if(mode==='jumpscare')P.flash.value=Math.random()<.5?.3:0;}
 else if(mode==='extras'){renderTo(gScene,gCam);if(gJS.t>=0)P.flash.value=Math.random()<.5?.3:0;}
 else if(mode==='day') renderTo(scene,dayCam);
 else if(mode==='splash') renderTo(null);
 else {renderTo(scene,menuCam);P.grain.value=.07+(Math.random()<.02?.7:0);}
 presentPS1();
 if(mode==='game'&&g&&g.cams&&!g.over) renderTablet(t);
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
const HOLD_ACTS=new Set(['mask','hall','vent','crank']);
function actFor(k){for(const a in SET.binds) if(SET.binds[a]===k) return a; return null;}
(function(){const b=$('#crankBtn');b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}holds.add('crank:p');});const up=()=>holds.delete('crank:p');b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);})();
document.addEventListener('keydown',e=>{
 if(mode!=='game'||!g||g.over) return;
 const k=e.key.toLowerCase();
 if(k==='escape'||k==='p'){e.preventDefault();if(!e.repeat){g.paused?resumeGame():pauseGame();}return;}
 if(g.paused) return;
 if((e.ctrlKey||e.metaKey)&&(k==='n'||e.code==='KeyN')){e.preventDefault();toast('Noite pulada');if(g.boss)winBoss();else winNight();return;}
 if(e.ctrlKey||e.metaKey) return;
 if(k==='arrowleft'){keysLook.left=true;e.preventDefault();return;}
 if(k==='arrowright'){keysLook.right=true;e.preventDefault();return;}
 const act=actFor(k);
 if(act&&HOLD_ACTS.has(act)){e.preventDefault();holds.add(act+':k');return;}
 if(e.repeat) return;
 if(act==='doorL'){toggleDoor('l');e.preventDefault();}
 else if(act==='doorR'){toggleDoor('r');e.preventDefault();}
 else if(act==='cams'){toggleCams();e.preventDefault();}
 else if(act==='shock'){shock();e.preventDefault();}
 else if(act==='light'){toggleCamLight();e.preventDefault();}
 else if(/^[1-8]$/.test(k)) setCam(+k);
});
document.addEventListener('keyup',e=>{
 const k=e.key.toLowerCase(), act=actFor(k);
 if(act&&HOLD_ACTS.has(act)){e.preventDefault();holds.delete(act+':k');}
 if(k==='arrowleft')keysLook.left=false; if(k==='arrowright')keysLook.right=false;
});
function pauseGame(){
 if(mode!=='game'||!g||g.over||g.paused) return;
 g.paused=true; holds.clear(); keysLook.left=keysLook.right=false;
 document.querySelectorAll('[data-pv]').forEach(el=>el.value=SET[el.dataset.pv]);
 $('#pauseOv').classList.remove('hidden'); if(A.ctx) A.ctx.suspend();
}
function resumeGame(){if(!g||!g.paused)return;g.paused=false;$('#pauseOv').classList.add('hidden');if(A.ctx)A.ctx.resume();}
$('#pauseBtn').onclick=()=>{g&&g.paused?resumeGame():pauseGame();};
$('#bResume').onclick=resumeGame;
$('#bRestart').onclick=()=>{const n=g.night;resumeGame();g.over=true;endNightAudio();startNight(n);};
$('#bQuit').onclick=()=>{resumeGame();g.over=true;endNightAudio();setMode('menu');};
document.querySelectorAll('[data-pv]').forEach(el=>el.addEventListener('input',()=>{SET[el.dataset.pv]=+el.value;applyVolumes();saveSet();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
addEventListener('blur',()=>{if(mode==='game'&&g&&!g.over)pauseGame();});
/* créditos */
function showCredits(){const r=$('#credRoll');r.style.animation='none';void r.offsetWidth;r.style.animation='';setMode('credits');}
$('#bCredits').onclick=showCredits;
$('#bBossCredits').onclick=()=>{stopSix();showCredits();};
$('#bCredBack').onclick=()=>setMode('menu');
/* apagar progresso (com confirmação) */
$('#bWipe').onclick=()=>{const b=$('#bWipe');if(!b.dataset.ok){b.dataset.ok=1;b.textContent='Clique de novo para APAGAR TUDO';setTimeout(()=>{b.dataset.ok='';b.textContent='🗑 Apagar progresso';},3500);return;}try{localStorage.removeItem('pizzariaBob3d_v2');}catch(e){}location.reload();};
function updateBindLabels(){
 const map={doorL:'doorL',doorR:'doorR',hall:'hall',vent:'vent',mask:'mask',cams:'cams'};
 Object.keys(map).forEach(a=>{const el=document.querySelector(`.ctl[data-act="${map[a]}"] kbd`);if(el)el.textContent=keyName(SET.binds[a]);});
 $('#camLightBtn').textContent='💡 Luz ('+keyName(SET.binds.light)+')'; $('#shockBtn').textContent='⚡ Choque ('+keyName(SET.binds.shock)+')'; $('#crankBtn').textContent='🔄 Rebobinar (segure '+keyName(SET.binds.crank)+')';
}
/* tela de configurações */
let waitBind=null;
function buildSettings(){
 document.querySelectorAll('[data-set]').forEach(el=>{const k=el.dataset.set;if(el.type==='checkbox')el.checked=!!SET[k];else el.value=SET[k];const sp=el.parentElement.querySelector('span');if(sp)sp.textContent=SET[k];});
 const L=$('#bindList'); L.innerHTML='';
 Object.keys(DEF_BINDS).forEach(a=>{const b=document.createElement('button');b.innerHTML=`<span>${BIND_NAMES[a]}</span><kbd>${keyName(SET.binds[a])}</kbd>`;b.onclick=()=>{document.querySelectorAll('#bindList button').forEach(x=>x.classList.remove('wait'));waitBind=a;b.classList.add('wait');b.querySelector('kbd').textContent='...';};L.appendChild(b);});
}
document.querySelectorAll('[data-set]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.set;SET[k]=el.type==='checkbox'?el.checked:(k==='res'?+el.value:+el.value);const sp=el.parentElement.querySelector('span');if(sp)sp.textContent=SET[k];applyVolumes();if(k==='res'){PS1_H=SET.res;resize();}saveSet();if(['sfx','master'].includes(k))tone(660,.08,'sine',.08);}));
addEventListener('keydown',e=>{if(mode!=='settings'||!waitBind)return;e.preventDefault();const k=e.key.toLowerCase();if(k==='escape'){waitBind=null;buildSettings();return;}if(/^[1-8]$/.test(k)||k.startsWith('arrow'))return;const other=actFor(k);if(other&&other!==waitBind)SET.binds[other]=SET.binds[waitBind];SET.binds[waitBind]=k;waitBind=null;saveSet();updateBindLabels();buildSettings();});
$('#bSettings').onclick=()=>{buildSettings();$('#bWipe').classList.remove('confirm');$('#bWipe').textContent='🗑 Apagar progresso';setMode('settings');};
$('#bWipe').onclick=()=>{const b=$('#bWipe');if(!b.classList.contains('confirm')){b.classList.add('confirm');b.textContent='Tem certeza? Clique de novo';setTimeout(()=>{b.classList.remove('confirm');b.textContent='🗑 Apagar progresso';},4000);return;}
 try{localStorage.removeItem('pizzariaBob3d_v2');}catch(e){} Object.keys(save).forEach(k=>delete save[k]); Object.assign(save,{night:1,custom:{sandega:0,bruna:0,fernanda:0,xinglau:0,toco:0,zig:0}}); persist();
 b.classList.remove('confirm'); b.textContent='Progresso apagado'; tone(220,.4,'sine',.1,0,0,110);};
$('#bSetBack').onclick=()=>{waitBind=null;setMode('menu');};
$('#bSetReset').onclick=()=>{SET=Object.assign(SET,{master:90,music:75,sfx:100,amb:60,res:240,shake:true,binds:Object.assign({},DEF_BINDS)});PS1_H=240;resize();applyVolumes();saveSet();updateBindLabels();buildSettings();};
updateBindLabels();
addEventListener('blur',()=>{holds.clear();keysLook.left=keysLook.right=false;});
})();
