import { GameState, PlayedCard } from '@fodinha/shared';
import CardView from './CardView';

export default function TrickResultOverlay({
  gameState,
  trickCards,
  winnerId,
}: {
  gameState: GameState;
  trickCards: PlayedCard[];
  winnerId: string;
}) {
  const winner = gameState.players.find((p) => p.id === winnerId);

  return (
    <div className="result-overlay trick-result">
      <div className="result-card trick-result-card">
        <p className="result-eyebrow">Vaza encerrada</p>
        <h2 className="result-title" style={{ color: winner?.color }}>
          {winner?.name} levou!
        </h2>

        <div className="trick-result-cards">
          {trickCards.map((played) => {
            const player = gameState.players.find((p) => p.id === played.playerId);
            const isWinner = played.playerId === winnerId;

            return (
              <div
                key={played.playerId}
                className={`trick-result-item ${isWinner ? 'winner' : ''}`}
              >
                <span className="trick-player" style={{ color: player?.color }}>
                  {player?.name}
                </span>
                <CardView card={played.card} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
