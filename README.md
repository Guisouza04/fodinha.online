# Fodinha Online

Jogo de cartas multiplayer online baseado no baralho e na hierarquia do Truco Paulista com manilha móvel.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + Socket.io
- **Shared:** Motor de regras em TypeScript (testável)

## Requisitos

- Node.js 18+

## Instalação

```bash
npm install
npm run build -w @fodinha/shared
```

## Desenvolvimento

```bash
npm run dev
```

Isso inicia:
- Servidor em `http://localhost:3001`
- Cliente em `http://localhost:5173`

## Testes

```bash
npm test
```

## Estrutura

```
packages/
├── shared/   # Regras do jogo (cartas, manilha, palpites, mãos)
├── server/   # Salas, WebSocket, orquestração
└── client/   # Interface React
```

## Como jogar

1. Abra `http://localhost:5173`
2. Crie uma sala ou entre com o código
3. Marque "Pronto" e aguarde o anfitrião iniciar
4. Palpite quantas mãos fará e jogue suas cartas

## Próximos passos

- PostgreSQL para persistência
- Chat em tempo real
- Ranking e histórico de partidas
- Apps mobile (React Native / Capacitor)
