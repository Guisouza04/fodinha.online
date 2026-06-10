import {
  advanceAfterRoundEnd,
  GameState,
  resolveTrickEnd,
} from '@fodinha/shared';
import { Room } from './rooms';

const TRICK_END_MS = 2800;
const ROUND_END_MS = 4500;

const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function clearRoomTimer(roomCode: string) {
  const timer = roomTimers.get(roomCode);
  if (timer) clearTimeout(timer);
  roomTimers.delete(roomCode);
}

export function schedulePhaseAdvance(
  room: Room,
  onAdvance: (room: Room) => void
) {
  clearRoomTimer(room.code);

  const phase = room.gameState.phase;
  if (phase !== 'trick_end' && phase !== 'round_end') return;

  const delay = phase === 'trick_end' ? TRICK_END_MS : ROUND_END_MS;

  roomTimers.set(
    room.code,
    setTimeout(() => {
      roomTimers.delete(room.code);
      try {
        room.gameState = advancePhase(room.gameState);
        onAdvance(room);

        if (
          room.gameState.phase === 'trick_end' ||
          room.gameState.phase === 'round_end'
        ) {
          schedulePhaseAdvance(room, onAdvance);
        }
      } catch (error) {
        console.error(`Erro ao avançar fase da sala ${room.code}:`, error);
      }
    }, delay)
  );
}

function advancePhase(state: GameState): GameState {
  if (state.phase === 'trick_end') {
    return resolveTrickEnd(state);
  }
  if (state.phase === 'round_end') {
    return advanceAfterRoundEnd(state);
  }
  return state;
}
