# Cinco Noites na Pizzaria do BOB 3D

Jogo de terror de sobrevivência em 3D low poly, feito em HTML + JavaScript com [Three.js](https://threejs.org/) (r128). Você é o vigia noturno da Pizzaria do BOB e precisa sobreviver das 12h às 6h.

## Como jogar no GitHub Pages

1. Suba esta pasta inteira para um repositório (o `index.html` e a pasta `sounds/` precisam ficar juntos).
2. No GitHub, vá em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Em um ou dois minutos o jogo fica disponível em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Para testar no computador, rode um servidor local na pasta (abrir o arquivo direto com duplo clique funciona, mas sem o som posicional esquerda/direita):

```
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Animatrônicos

| Nome | Animal | Estreia | Por onde vem | Defesa |
|---|---|---|---|---|
| SANDEGA | Tartaruga | Noite 1 | Corredor leste → porta direita | Fechar a porta direita |
| BRUNA | Raposa | Noite 2 | Corredor do meio | Lanterna no corredor |
| FERNANDA | Águia | Noite 2 | Sobe no duto pelo salão | Lanterna no duto |
| XINGLAU | Pato | Noite 3 | Depósito → corredor oeste → porta esquerda | Fechar a porta esquerda |
| TOCO | Cachorro | Noite 4 | Desce o corredor do meio e entra na sala | Segurar a máscara |
| ZIG | Macaco | Noite 5 | Fica na cadeira giratória da cozinha | Segurar "Girar" na CAM 3; se fugir, fechar a porta direita |
| SR. GARGALHADA | Palhaço (chefe da Noite 6) | Noite 6 | Todos os lugares e as câmeras; na fase 2 e 3 aparece em dois lugares ao mesmo tempo | Todas as defesas + choque |

Os animatrônicos andam de verdade pelo prédio, seguindo caminhos definidos em `RAW_PATHS`. Regras de justiça: no máximo 2 ataques ao mesmo tempo, nunca Bruna + Fernanda + Toco juntos, pelo menos 4 segundos entre uma chegada e outra, e tempo extra quando dois atacam juntos.

## História

Em 1983 o seu Roberto abriu a Pizzaria do BOB, com o cachorro vermelho BOB de mascote. Em 2016 o neto dele, fã de uma turma da internet que explora lugares abandonados, aposentou o BOB e criou a banda de animatrônicos **Liga Mistério**: seis mascotes com camisa de time. À noite, eles continuam ensaiando. O vigia antigo, Valdir, conta o resto nas ligações antes de cada noite. Quando você morre, a tela mostra o passo a passo para sobreviver àquele animatrônico.

## Controles

- **Olhar:** mouse nas bordas da tela, setas ← → ou arrastar a tela
- **A / D:** porta esquerda / direita
- **W (segurar):** lanterna do corredor
- **Q (segurar):** lanterna do duto
- **S:** abre e fecha o tablet de câmeras (ele fica na mão, ao lado, e dá para usar a lanterna junto) · **1–8:** trocar câmera
- **F:** luz da câmera
- **E:** choque (Noite 6)
- **Z (segurar, na CAM 3):** rebobinar a cadeira do Zig
- **Espaço (segurar):** máscara do BOB
- **Ctrl + N:** pula a noite (no Chrome/Edge: **Ctrl + Alt + N**)

**Modo Dia** (Extras → Modo Dia): WASD ou setas para andar, mouse para olhar (clique para travar o mouse), Shift para correr. No celular, a metade esquerda da tela anda e a direita olha. Para sair, vá até a porta da recepção.

## Conteúdo

- 5 noites + Noite 6 com batalha contra o chefe + Noite 7 personalizada (níveis 0 a 20)
- 8 câmeras com salas 3D (a da cozinha está quebrada: só áudio)
- Galeria 3D dos animatrônicos em **Extras**
- Progresso salvo no navegador
- Segredos: aperte o nariz do pôster, e fique atento a eventos raros...

## Novidades da versão final

- **Lore sutil:** as ligações, os jornais (Extras → Jornais), a foto antiga no escritório, as marcas de mão queimadas pelas paredes e a porta acorrentada do porão contam a história aos pedaços. Monte você mesmo.
- **Cutscene final:** depois de vencer o Sr. Gargalhada, a energia acaba e ele aparece para um último aviso.
- **Alma do Shocker:** um evento raríssimo e silencioso. Ele não ataca e não aparece nas câmeras.
- **Configurações:** volume geral, de música, de efeitos e de ambiente, teclas configuráveis, resolução PS1 e opção de tremer a tela.
- **Músicas próprias:** tema do Withered BOB, tema do Sr. Gargalhada e música da falta de energia.

## Acabamentos (v1.1)

- As dicas da tela de morte, da galeria e dos controles mostram as **suas** teclas configuradas.
- Tutorial curtinho na primeira Noite 1.
- Botão para **apagar o progresso** (nas Configurações, com confirmação).
- Botão de créditos depois da batalha final e indicador de carregamento dos sons.
- Passe o mouse nas estrelas do menu para ver o que cada uma significa.

## Modos especiais

- **Noite 20/20 (Withered BOB):** na Noite personalizada, coloque todos no 20. O BOB original, meio desmontado, sai do depósito e corre de verdade pelo prédio até uma das entradas (dá para ver ele correndo nas câmeras e ouvir os passos). A cada hora outro animatrônico acorda.
- **Modo Dia:** explore a pizzaria cheia de crianças e funcionários, com a Liga fazendo o show no palco. Saia pela recepção.
- **Fitas (minigames estilo Atari):** cada noite vencida libera uma fita com mecânica própria: entregar bolos, desviar dos holofotes, labirinto com faíscas, pega-pega de abraços e girar a cadeira no ritmo. Vencer a Noite 6 libera a fita secreta de 1987. Ficam também em Extras → Fitas.
- **Extras:** galeria dos personagens em 3D (com prévia do jumpscare e troca de pose), galeria de todos os pôsteres e os controles.

## Sons opcionais (pesquisados)

O jogo já funciona com os sons atuais. Se você colocar estes arquivos na pasta `sounds/`, eles substituem os sons sintetizados. Todos são CC0 (domínio público) no BigSoundBank:

| Arquivo esperado | Uso no jogo | Sugestão |
|---|---|---|
| `alarme.mp3` | Avisos de perigo (Zig fugindo, energia baixa, fases do chefe) | "Evacuation Alarm #1" — https://bigsoundbank.com/evacuation-alarm-1-s3411.html |
| `dia_ambiente.mp3` | Fundo do Modo Dia | "Children in the garden of plants" — https://bigsoundbank.com/enfants-aux-jardin-des-plantes-s1003.html |
| `risadas_criancas.mp3` | Risadas no Modo Dia | "Laughter of children" — https://bigsoundbank.com/rires-d-enfants-s1660.html |
| `fliperama.mp3` | Fliperamas no Modo Dia | "Games room #2" — https://bigsoundbank.com/games-room-2-s2675.html |
| `choque.mp3` | Faíscas e choque | "Electric strike #3" — https://bigsoundbank.com/electric-strike-3-s3444.html |
| `withered_grito.mp3` | Grito do Withered BOB | Qualquer grito metálico/distorcido curto (ou "Robot 6" — https://bigsoundbank.com/robot-6-s1978.html) |

Converta para `.mp3` se baixar em outro formato e mantenha exatamente esses nomes.

## Estrutura e onde mexer

```
index.html       página do jogo (telas e botões)
css/style.css    visual
js/game.js       toda a lógica do jogo e o 3D
js/three.min.js  (opcional) Three.js local
sounds/          efeitos sonoros e músicas
```

O jogo carrega o Three.js da internet. Se quiser que funcione offline, baixe o arquivo
https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js e salve como `js/three.min.js`.

Dentro do `js/game.js`, procure por:

- `SOUND_FILES`: liga cada som a um arquivo. Para trocar um som, substitua o arquivo em `sounds/` ou mude o caminho.
- `LEVELS`: dificuldade de cada animatrônico por noite (0 = parado, 20 = máximo).
- `RAW_PATHS`: caminho que cada animatrônico faz pelo restaurante.
- `CHARS`: nome, velocidade, defesa e textos de cada um.
- `makeBot2` e `DESIGN`: modelos 3D e cores dos animatrônicos.
- `animRig`: animações (caminhada, ataque, piscadas, show no palco).
- `posterTex`, `drawFace` e `kidsTex`: pôsteres e desenhos das paredes.
- `CALLS`: lore contada nas ligações do Valdir (aparece digitada ao lado do celular).
- `STEPS`: passo a passo mostrado quando você morre.
- `updateWB` e `WB_WAKE`: a noite do Withered BOB e quem acorda em cada hora.
- `startDay`, `makePerson`, `DN`/`DE`: o Modo Dia, as pessoas e os caminhos delas.
- `MAP_ROOMS` e `buildMap`: o mapa do tablet de câmeras.
- `MINIS` e `MAPS`: os minigames 8-bit (mapas, falas e lore).
- `WB_RAW`: os caminhos que o Withered BOB corre.
- `clownStep` e `wbStep`: as músicas dos dois chefes. `ambientEvent`: barulhos aleatórios da noite.
- `TARP_UP` / `TARP_DOWN`: a lona do depósito (noites 4-5 / noite 6).
- `mergeGroupMeshes`: junta as peças dos modelos para o jogo rodar mais leve.
- `ATK`: quantos segundos o jogador tem para se defender em cada noite.
- `HOUR_LEN`: duração de cada hora do jogo em segundos (padrão 72).
- `MOVE_INT` e `COOLDOWN`: frequência de movimento e descanso depois de expulsos.
- `BOSS_HP`: vida do Sr. Gargalhada (fase 2 abaixo de 66%, fase 3 abaixo de 33%).
- `makeClown`: modelo 3D do Sr. Gargalhada. `BOSS_COMBOS`: pares de ataques duplos.
- `ROOMDEF`: salas que aparecem nas câmeras.

## Sons

| Arquivo | Uso |
|---|---|
| `menu_soum.ogg` | Música do menu |
| `ventilador.mp3` | Ventilador do escritório (loop) |
| `porta_fechando.mp3` / `porta_abrindo.mp3` | Portas |
| `LANTERNA_ON_OFF.mp3` | Lanterna |
| `colocando_a_mascara.mp3` / `respiracao_da_mascara.mp3` | Máscara |
| `andando_no_corregor.mp3` | Passos nas portas laterais (DEWY e TITI) |
| `corredor_do_meio.mp3` | BIBI chegando no corredor |
| `andando_nos_dutos.mp3` | Boba nos dutos |
| `risada_do_palhaco.mp3` | Ataques do Sr. Gargalhada |
| `jumpscare.mp3` | Jumpscare |
| `6_da_manha.mp3` | Vitória às 6h |
| `som_do_poster.mp3` | Nariz do pôster |
| `som_raro_que_pode_tocar.mp3` | Eventos raros |

Jogo de fã inspirado no gênero de terror em pizzarias. Todos os personagens são originais.
