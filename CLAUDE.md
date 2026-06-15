# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Fodinha Online is a multiplayer card game (based on Truco Paulista rules with mobile joker/manilha) built as an npm monorepo with three packages: `shared` (rules engine), `server` (Node.js + Socket.io), and `client` (React + Vite).

## Commands

```bash
# Root — run everything for development
npm run dev          # starts server (port 3001) + client (port 5173) concurrently

# Build all packages in dependency order: shared → server → client
npm run build

# Tests (shared package only — vitest)
npm run test
npm run test -- --watch           # watch mode (run from root or packages/shared)

# Per-package
cd packages/shared && npm run build
cd packages/server && npm run dev  # tsx watch mode
cd packages/client && npm run dev  # Vite HMR
```

## Architecture

### Monorepo structure

- `packages/shared` — pure TypeScript rules engine, consumed by both server and client. Zero runtime deps. Exports game types, card comparison logic, manilha resolution, bidding validation, deck creation, and the main state-machine (`game.ts`).
- `packages/server` — Express + Socket.io backend. Holds all game state in memory (a `Map` of rooms). Drives phase transitions via timed callbacks in `phaseAdvance.ts`.
- `packages/client` — React 19 SPA. All game state lives in `GameContext.tsx`; components read from context and call its action methods.

### Data flow

```
Client action (playCard, placeBid, etc.)
  → socket emit
    → server event handler (index.ts)
      → rooms.ts mutates state using shared/ logic
        → phaseAdvance.ts schedules delayed transitions
          → server broadcasts sanitized GameState to each player
            → GameContext receives state, re-renders UI
```

State sent to each player is sanitized: opponent hand cards are hidden (only count exposed).

### Key files

| File | Role |
|---|---|
| `packages/shared/src/game.ts` | Main game orchestration, phase transitions |
| `packages/shared/src/types.ts` | All core types (GameState, PlayerState, GamePhase, …) |
| `packages/shared/src/cards.ts` | Card comparison with manilha support |
| `packages/server/src/index.ts` | Socket.io event handlers, HTTP routes |
| `packages/server/src/rooms.ts` | In-memory room management, game mutations |
| `packages/server/src/phaseAdvance.ts` | Delayed auto-advance (2.8 s trick end, 4.5 s round end) |
| `packages/client/src/context/GameContext.tsx` | Socket lifecycle, all client-side actions |

### Module system

All three packages use ESM (`"type": "module"`). Imports inside `server/` and `shared/` must include `.js` extensions even for TypeScript source files (Node ESM requirement).

### Reconnection

When a player closes and reopens the browser, `GameContext.tsx` listens to the socket's `connect` event and automatically re-emits `room:join` using `fodinha_room_code` and `fodinha_player_name` from `localStorage`. The server's `joinRoom` recognizes the existing `playerId` and skips all validation, just updating the socket mapping and broadcasting current state. If the room no longer exists, localStorage is cleared.

### Environment

- `PORT` env var controls server port (default 3001). Must be cast to `Number` when passed to `httpServer.listen` with a hostname argument.
- `VITE_SERVER_URL` env var controls the Socket.io server URL on the client (falls back to `localhost:3001` in dev; set to Railway deploy URL in production).
- Client dev server proxies `/socket.io` → `http://localhost:3001` via `vite.config.ts`. Proxy errors (e.g. ECONNRESET on disconnect) are suppressed via the `configure` option.
- Socket.io client uses `transports: ['websocket']` only — skips HTTP polling to avoid Vite proxy upgrade issues.

## Game flow summary

1. **Lobby** — players join by room code, mark ready; host starts game.
2. **Dealing** — card count ramps up 1→N then back down over rounds; N = `maxRoundCards` (configured at room creation).
3. **Bidding** — sequential; each player predicts tricks. The last bidder cannot make total equal the number of cards dealt.
4. **Playing** — players play cards in turn; manilha (card after the turned card) beats all others by suit ranking (♣ > ♥ > ♠ > ♦).
5. **Trick end** (auto, 2.8 s delay) — trick winner leads next.
6. **Round end** (auto, 4.5 s delay) — lives lost for wrong bids; players at 0 lives eliminated.
7. **Game over** — last player standing wins; host can start a new game.

### Tiebreaker

When all remaining active players are eliminated in the same round simultaneously, a tiebreaker is triggered instead of a `game_over`. The eliminated players are restored to 1 life and play additional rounds until only one survives. `GameState.tiebreaker` is `true` during these rounds, used by the UI to show a banner and a notice in the round-result overlay. The tiebreaker can chain: if all tiebreaker players tie again, they reset to 1 life and repeat.
