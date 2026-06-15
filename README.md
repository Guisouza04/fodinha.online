# Fodinha Online

Jogo de cartas multiplayer em tempo real baseado nas regras do **Truco Paulista** com manilha móvel. Jogue com amigos direto pelo navegador, sem instalação.

## Como jogar

**Fodinha** é um jogo de mãos onde cada jogador aposta quantas mãos vai fazer. Errou o palpite? Perde vidas. O último a sobrar vence.

### Fluxo de uma partida

1. **Lobby** — Crie uma sala ou entre com o código. Marque-se como pronto. O anfitrião inicia a partida.
2. **Distribuição** — O número de cartas por jogador sobe de 1 até N e depois desce de volta. N é configurado ao criar a sala.
3. **Palpites** — Cada jogador declara quantas mãos vai ganhar. O último a palpitar não pode fazer o total igual ao número de cartas distribuídas (para garantir que alguém sempre erre).
4. **Jogo** — Jogadores jogam cartas na sua vez. A carta mais alta ganha a mão; quem ganhou lidera a próxima.
5. **Fim de mão** — Avança automaticamente após 2,8 s.
6. **Fim de rodada** — Quem errou o palpite perde vidas. Jogadores com 0 vidas são eliminados. Avança automaticamente após 4,5 s.
7. **Fim de jogo** — O último jogador vivo vence. O anfitrião pode iniciar uma nova partida.

### Manilha

Uma carta é virada como **vira**. O naipe imediatamente acima dela se torna a **manilha** — bate qualquer outra carta. Quando duas manilhas se enfrentam, o naipe decide: ♣ > ♥ > ♠ > ♦.

### Desempate

Se todos os jogadores restantes forem eliminados na mesma rodada, em vez de encerrar o jogo todos são restaurados com 1 vida e a partida continua até restar apenas um. O desempate pode se encadear indefinidamente.

## Stack

| Camada | Tecnologia |
|---|---|
| Motor de regras | TypeScript puro (sem dependências) |
| Servidor | Node.js, Express, Socket.io |
| Cliente | React 19, Vite |
| Monorepo | npm workspaces |

## Estrutura do projeto

```
packages/
  shared/   — regras do jogo, tipos, comparação de cartas
  server/   — handlers Socket.io, estado das salas em memória
  client/   — SPA React, todo estado via GameContext
```

## Instalação e uso

**Pré-requisitos:** Node.js 18+, npm 9+

```bash
# Instalar dependências
npm install

# Rodar servidor + cliente em desenvolvimento
npm run dev
# → servidor em http://localhost:3001
# → cliente em http://localhost:5173

# Build completo (shared → server → client)
npm run build

# Testes (pacote shared)
npm test
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta do servidor |
| `VITE_SERVER_URL` | `localhost:3001` | URL do servidor Socket.io usada pelo cliente |

Para builds de produção, defina `VITE_SERVER_URL` com a URL do servidor deployado.

## Reconexão

Se um jogador fechar e reabrir o navegador durante uma partida, ele é reinserido automaticamente na sala — sem necessidade de nenhuma ação. A sessão é restaurada via `localStorage`.

## Jogar com amigos sem servidor pago

Uma forma gratuita de jogar com amigos remotamente usando o seu próprio PC como servidor:

1. **Instale o [Tailscale](https://tailscale.com)** no seu PC e peça para cada amigo instalar também.
2. **Crie uma conta compartilhada** (ex.: uma conta Google) e faça todos entrarem no Tailscale com ela — assim todos ficam na mesma rede privada.
3. **Inicie o projeto com a flag `--host`** para expor o servidor na rede:
   ```bash
   npm run dev -- --host
   ```
4. O Vite exibirá no terminal uma URL de rede com o IP do Tailscale, por exemplo:
   ```
   ➜  Network: http://100.x.x.x:5173/
   ```
5. **Compartilhe essa URL** com seus amigos. Enquanto estiverem conectados ao Tailscale, eles conseguem acessar o jogo diretamente no seu PC.

> O Tailscale cria uma VPN mesh entre os dispositivos — o tráfego é criptografado e vai direto de um dispositivo ao outro, sem passar por nenhum servidor intermediário.
