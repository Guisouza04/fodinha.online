import {
  Card,
  getCurrentBidderId,
  getCurrentPlayerId,
  isBlindFirstRound,
} from '@fodinha/shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardView from '../components/CardView';
import OpponentCards from '../components/OpponentCards';
import Layout from '../components/Layout';
import RoundResultOverlay from '../components/RoundResultOverlay';
import TrickResultOverlay from '../components/TrickResultOverlay';
import { useGame } from '../context/GameContext';
export default function GamePage() {
  const navigate = useNavigate();
  const {
    playerId,
    roomCode,
    gameState,
    bidHint,
    error,
    placeBid,
    playCard,
    newGame,
  } = useGame();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  useEffect(() => {
    if (gameState?.phase === 'lobby') {
      navigate('/sala');
    }
  }, [gameState?.phase, navigate]);

  if (!gameState || !gameState.round) {
    return (
      <Layout title="Partida">
        <p className="loading">Carregando partida...</p>
      </Layout>
    );
  }

  const round = gameState.round;
  const me = gameState.players.find((p) => p.id === playerId);
  const currentBidderId = getCurrentBidderId(gameState);
  const currentPlayerId = getCurrentPlayerId(gameState);
  const isMyBidTurn = currentBidderId === playerId;
  const isMyPlayTurn = currentPlayerId === playerId;
  const manilhaRank = round.manilhaRank!;
  const blindFirstRound =
    gameState.phase === 'bidding' && isBlindFirstRound(gameState);
  const opponents = blindFirstRound
    ? gameState.players.filter((p) => p.id !== playerId && !p.eliminated)
    : [];

  const winner = gameState.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;

  function handlePlayCard(card: Card) {
    if (!isMyPlayTurn) return;
    playCard(card);
    setSelectedCard(null);
  }

  if (gameState.phase === 'game_over' && winner) {
    return (
      <Layout title="Fim de Jogo">
        <div className="game-over">
          <div className="winner-card">
            <span className="trophy">🏆</span>
            <h2>{winner.name} venceu!</h2>
            <p>
              Vidas restantes: <strong>{winner.lives}</strong>
            </p>
          </div>
          {me?.isHost ? (
            <button type="button" className="btn btn-primary" onClick={newGame}>
              Nova Partida
            </button>
          ) : (
            <p className="hint">Aguardando o anfitrião iniciar nova partida...</p>
          )}
        </div>
      </Layout>
    );
  }

  const showTrickResult =
    gameState.phase === 'trick_end' &&
    round.lastTrickWinnerId &&
    round.lastTrickCards;

  const showRoundResult =
    gameState.phase === 'round_end' && round.roundResults;

  const tableCards =
    gameState.phase === 'trick_end' && round.lastTrickCards
      ? round.lastTrickCards
      : round.currentTrick?.cards ?? [];

  return (
    <Layout>
      <div
        className={`game-board ${showTrickResult || showRoundResult ? 'paused' : ''}`}
      >
        <header className="game-header">
          <div className="round-info">
            <span>Rodada {round.number}</span>
            <span>{round.cardsPerPlayer} carta(s)</span>
          </div>
          {round.vira && (
            <div className="vira-info">
              <span className="label">Vira</span>
              <CardView card={round.vira} small />
              <span className="label">Manilha: {manilhaRank}</span>
            </div>
          )}
        </header>

        {gameState.tiebreaker && (
          <div className="tiebreaker-banner">
            Rodada de desempate — todos jogam com 1 vida!
          </div>
        )}

        {blindFirstRound && (
          <div className="blind-round-banner">
            Rodada especial: você vê as cartas dos oponentes, mas não a sua.
            Palpite com base nelas — sua carta só aparece na hora de jogar.
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <aside className="players-sidebar">
          {gameState.players.map((p) => (
            <div
              key={p.id}
              className={`player-panel ${p.eliminated ? 'eliminated' : ''} ${p.id === playerId ? 'me' : ''}`}
            >
              <div className="player-panel-header">
                <span
                  className="player-dot"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.name}</span>
              </div>
              <div className="player-stats">
                <span>❤️ {Math.max(0, p.lives)}</span>
                <span>
                  Palpite:{' '}
                  {p.bid !== null
                    ? p.bid
                    : gameState.phase === 'bidding' && !p.eliminated
                      ? 'aguardando'
                      : '—'}
                </span>
                <span>Mãos ganhas: {p.tricksWon}</span>
              </div>
              {p.eliminated && <span className="eliminated-tag">Eliminado</span>}
            </div>
          ))}
        </aside>

        <section className="table-area">
          {gameState.phase === 'bidding' ? (
            <div className="bidding-table">
              {blindFirstRound && <OpponentCards opponents={opponents} />}
              <div className="bids-on-table">
              {round.bidOrder.map((bidderId) => {
                const player = gameState.players.find((p) => p.id === bidderId);
                if (!player || player.eliminated) return null;

                const hasBid = player.bid !== null;
                const isCurrent = bidderId === currentBidderId;

                return (
                  <div
                    key={bidderId}
                    className={`table-bid ${isCurrent ? 'current' : ''} ${hasBid ? 'revealed' : ''}`}
                  >
                    <span
                      className="table-bid-name"
                      style={{ color: player.color }}
                    >
                      {player.name}
                      {bidderId === playerId && ' (você)'}
                    </span>
                    {hasBid ? (
                      <span className="bid-value">{player.bid}</span>
                    ) : isCurrent ? (
                      <span className="bid-pending">palpitando...</span>
                    ) : (
                      <span className="bid-waiting">aguardando</span>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="trick-area">
              {tableCards.map((pc) => {
                const player = gameState.players.find((p) => p.id === pc.playerId);
                const isTrickWinner =
                  gameState.phase === 'trick_end' &&
                  pc.playerId === round.lastTrickWinnerId;

                return (
                  <div
                    key={pc.playerId}
                    className={`trick-card-wrapper ${isTrickWinner ? 'trick-winner' : ''}`}
                  >
                    <span className="trick-player" style={{ color: player?.color }}>
                      {player?.name}
                    </span>
                    <CardView card={pc.card} />
                  </div>
                );
              })}
              {!tableCards.length && (
                <p className="table-hint">Mesa vazia</p>
              )}
            </div>
          )}
        </section>

        <footer className="hand-area">
          {blindFirstRound && me && !me.eliminated && (
            <div className="hand-section">
              <p className="hand-label">Sua carta (oculta)</p>
              <div className="hand-cards">
                <CardView
                  card={{ rank: '4', suit: 'ouros' }}
                  hidden
                />
              </div>
            </div>
          )}

          {!blindFirstRound &&
            (gameState.phase === 'bidding' || gameState.phase === 'playing') &&
            me &&
            !me.eliminated &&
            me.hand.length > 0 && (
              <div className="hand-section">
                <p className="hand-label">
                  {gameState.phase === 'bidding'
                    ? 'Suas cartas — analise antes de palpitar'
                    : 'Sua mão'}
                </p>
                <div className="hand-cards">
                  {me.hand.map((card, i) => (
                    <CardView
                      key={`${card.rank}-${card.suit}-${i}`}
                      card={card}
                      selected={
                        gameState.phase === 'playing' &&
                        selectedCard?.rank === card.rank &&
                        selectedCard?.suit === card.suit
                      }
                      onClick={
                        gameState.phase === 'playing' && isMyPlayTurn
                          ? () => {
                              setSelectedCard(card);
                              handlePlayCard(card);
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}

          {gameState.phase === 'bidding' && isMyBidTurn && (
            <div className="bid-panel">
              <p>
                {blindFirstRound
                  ? 'Com base na carta do oponente, você faz essa mão?'
                  : 'Quantas mãos você fará?'}
              </p>
              {!blindFirstRound && bidHint !== null && (
                <p className="bid-hint">
                  Palpite {bidHint} bloqueado (soma não pode igualar{' '}
                  {round.cardsPerPlayer})
                </p>
              )}
              <div className="bid-buttons">
                {Array.from({ length: round.cardsPerPlayer + 1 }, (_, i) => i).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      className="btn btn-bid"
                      disabled={bidHint === n}
                      onClick={() => placeBid(n)}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {gameState.phase === 'bidding' && !isMyBidTurn && (
            <p className="waiting-msg">
              Aguardando palpite de{' '}
              {gameState.players.find((p) => p.id === currentBidderId)?.name}...
            </p>
          )}

          {gameState.phase === 'playing' && !isMyPlayTurn && (
            <p className="waiting-msg">
              Vez de{' '}
              {gameState.players.find((p) => p.id === currentPlayerId)?.name}
              ...
            </p>
          )}

          {gameState.phase === 'trick_end' && (
            <p className="waiting-msg">Aguardando próxima jogada...</p>
          )}

          {gameState.phase === 'round_end' && (
            <p className="waiting-msg">Preparando próxima rodada...</p>
          )}

          {me?.eliminated && gameState.phase !== 'round_end' && (
            <p className="spectator-msg">Você foi eliminado. Assistindo...</p>
          )}
        </footer>

        {showTrickResult && (
          <TrickResultOverlay
            gameState={gameState}
            trickCards={round.lastTrickCards!}
            winnerId={round.lastTrickWinnerId!}
          />
        )}

        {showRoundResult && (
          <RoundResultOverlay
            gameState={gameState}
            results={round.roundResults!}
          />
        )}
      </div>
    </Layout>
  );
}
