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

| Nome | Animal | Por onde vem | Defesa |
|---|---|---|---|
| BOB | Cachorro vermelho | Entra no escritório | Segurar a máscara |
| BIBI | Elefante azul | Corredor do meio | Lanterna no corredor |
| Boba | Galinha laranja | Duto de ventilação | Lanterna no duto |
| DEWY | Gato roxo | Porta esquerda | Fechar a porta esquerda |
| TITI | Vaca rosa | Porta direita | Fechar a porta direita |
| SR. GARGALHADA | Palhaço (chefe da Noite 6) | Todos os lugares e as câmeras | Todas as defesas + choque |

## Controles

- **Olhar:** mouse nas bordas da tela, setas ← → ou arrastar a tela
- **A / D:** porta esquerda / direita
- **S:** câmeras, **1–8:** trocar câmera
- **F (segurar):** lanterna no corredor
- **V (segurar):** lanterna no duto
- **Espaço (segurar):** máscara
- **E:** choque (Noite 6, com as câmeras abertas)

No celular, use os botões na parte de baixo e arraste a tela para olhar.

## Conteúdo

- 5 noites + Noite 6 com batalha contra o chefe + Noite 7 personalizada (níveis 0 a 20)
- 8 câmeras com salas 3D (a da cozinha está quebrada: só áudio)
- Galeria 3D dos animatrônicos em **Extras**
- Progresso salvo no navegador
- Segredos: aperte o nariz do pôster, e fique atento a eventos raros...

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
- `ATK`: quantos segundos o jogador tem para se defender em cada noite.
- `HOUR_LEN`: duração de cada hora do jogo em segundos (padrão 45).
- `BOSS_HP`: vida do Sr. Gargalhada.
- `makeBot`: modelos 3D low poly dos animatrônicos.
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
