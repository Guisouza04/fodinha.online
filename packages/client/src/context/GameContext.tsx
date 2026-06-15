import { GameState, RoomConfig } from '@fodinha/shared';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { generatePlayerId, getSocket } from '../socket';

interface RoomInfo {
  code: string;
  name: string;
  hostId: string;
  config: RoomConfig;
  playerCount: number;
  phase: string;
}

interface GameContextValue {
  playerId: string;
  roomCode: string | null;
  roomInfo: RoomInfo | null;
  gameState: GameState | null;
  bidHint: number | null;
  error: string | null;
  setError: (msg: string | null) => void;
  createRoom: (
    playerName: string,
    playerColor: string,
    config: RoomConfig
  ) => Promise<string>;
  joinRoom: (
    code: string,
    playerName: string,
    playerColor: string
  ) => Promise<void>;
  toggleReady: () => void;
  startGame: () => void;
  placeBid: (bid: number) => void;
  playCard: (card: { rank: string; suit: string }) => void;
  newGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerId] = useState(generatePlayerId);
  const [roomCode, setRoomCode] = useState<string | null>(
    () => localStorage.getItem('fodinha_room_code')
  );
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [bidHint, setBidHint] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      const storedCode = localStorage.getItem('fodinha_room_code');
      const storedName = localStorage.getItem('fodinha_player_name');
      if (!storedCode || !storedName) return;

      socket.emit(
        'room:join',
        { code: storedCode, playerId, playerName: storedName, playerColor: '' },
        (res: { ok: boolean; error?: string }) => {
          if (!res.ok) {
            localStorage.removeItem('fodinha_room_code');
            setRoomCode(null);
            setRoomInfo(null);
            setGameState(null);
          }
        }
      );
    };

    socket.on('connect', handleConnect);

    socket.on('room:info', (info: RoomInfo) => {
      setRoomInfo(info);
      setRoomCode(info.code);
      localStorage.setItem('fodinha_room_code', info.code);
    });

    socket.on(
      'game:state',
      (data: { state: GameState; bidHint: number | null }) => {
        setGameState(data.state);
        setBidHint(data.bidHint);
      }
    );

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room:info');
      socket.off('game:state');
      socket.off('error');
    };
  }, [playerId]);

  const createRoom = useCallback(
    (playerName: string, playerColor: string, config: RoomConfig) =>
      new Promise<string>((resolve, reject) => {
        getSocket().emit(
          'room:create',
          { playerId, playerName, playerColor, config },
          (res: { ok: boolean; room?: { code: string }; error?: string }) => {
            if (res.ok && res.room) {
              setRoomCode(res.room.code);
              resolve(res.room.code);
            } else {
              reject(new Error(res.error ?? 'Erro ao criar sala'));
            }
          }
        );
      }),
    [playerId]
  );

  const joinRoom = useCallback(
    (code: string, playerName: string, playerColor: string) =>
      new Promise<void>((resolve, reject) => {
        getSocket().emit(
          'room:join',
          { code, playerId, playerName, playerColor },
          (res: { ok: boolean; error?: string }) => {
            if (res.ok) {
              setRoomCode(code.toUpperCase());
              resolve();
            } else {
              reject(new Error(res.error ?? 'Erro ao entrar na sala'));
            }
          }
        );
      }),
    [playerId]
  );

  const toggleReady = useCallback(() => {
    getSocket().emit('room:ready');
  }, []);

  const startGame = useCallback(() => {
    getSocket().emit('game:start');
  }, []);

  const placeBid = useCallback((bid: number) => {
    getSocket().emit('game:bid', { bid });
  }, []);

  const playCard = useCallback((card: { rank: string; suit: string }) => {
    getSocket().emit('game:play', { card });
  }, []);

  const newGame = useCallback(() => {
    getSocket().emit('game:new');
  }, []);

  return (
    <GameContext.Provider
      value={{
        playerId,
        roomCode,
        roomInfo,
        gameState,
        bidHint,
        error,
        setError,
        createRoom,
        joinRoom,
        toggleReady,
        startGame,
        placeBid,
        playCard,
        newGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de GameProvider');
  return ctx;
}
