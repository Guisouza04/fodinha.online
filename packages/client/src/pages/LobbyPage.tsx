import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';

export default function LobbyPage() {
  const navigate = useNavigate();
  const {
    playerId,
    roomCode,
    roomInfo,
    gameState,
    error,
    toggleReady,
    startGame,
  } = useGame();

  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  useEffect(() => {
    if (
      gameState &&
      gameState.phase !== 'lobby' &&
      gameState.phase !== 'game_over'
    ) {
      navigate('/jogo');
    }
  }, [gameState, navigate]);

  if (!gameState || !roomInfo) {
    return (
      <Layout title="Sala de Espera">
        <p className="loading">Conectando à sala...</p>
      </Layout>
    );
  }

  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const allReady =
    gameState.players.length >= 2 &&
    gameState.players.every((p) => p.ready);

  return (
    <Layout title="Sala de Espera" subtitle={roomInfo.name}>
      <div className="lobby">
        <div className="room-code-box">
          <span className="label">Código da Sala</span>
          <span className="room-code">{roomCode}</span>
          <p className="hint">Compartilhe com seus amigos</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <ul className="player-list">
          {gameState.players.map((p) => (
            <li key={p.id} className="player-item">
              <span
                className="player-dot"
                style={{ backgroundColor: p.color }}
              />
              <span className="player-name">
                {p.name}
                {p.isHost && ' (anfitrião)'}
                {p.id === playerId && ' (você)'}
              </span>
              <span
                className={`ready-badge ${p.ready ? 'ready' : 'not-ready'}`}
              >
                {p.ready ? 'Pronto' : 'Aguardando'}
              </span>
            </li>
          ))}
        </ul>

        <p className="player-count">
          {gameState.players.length} / {roomInfo.config.maxPlayers} jogadores
        </p>

        <div className="lobby-actions">
          <button
            type="button"
            className={`btn ${me?.ready ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleReady}
          >
            {me?.ready ? 'Cancelar Pronto' : 'Pronto'}
          </button>

          {isHost && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startGame}
              disabled={!allReady}
            >
              Iniciar Partida
            </button>
          )}
        </div>

        {!allReady && isHost && gameState.players.length < 2 && (
          <p className="hint">Aguardando pelo menos 2 jogadores...</p>
        )}
      </div>
    </Layout>
  );
}
