import { GameState, RoundResult } from '@fodinha/shared';

export default function RoundResultOverlay({
  gameState,
  results,
}: {
  gameState: GameState;
  results: RoundResult[];
}) {
  const roundNumber = gameState.round?.number ?? 0;

  const isTiebreaker = gameState.tiebreaker;

  return (
    <div className="result-overlay round-result">
      <div className="result-card round-result-card">
        <p className="result-eyebrow">Fim da rodada {roundNumber}</p>
        <h2 className="result-title">Resultado dos palpites</h2>
        {isTiebreaker && (
          <p className="tiebreaker-notice">
            Empate! Todos voltam com 1 vida para o desempate.
          </p>
        )}

        <ul className="round-result-list">
          {results.map((result) => {
            const player = gameState.players.find((p) => p.id === result.playerId);
            if (!player) return null;

            const perfect = result.livesLost === 0;

            return (
              <li
                key={result.playerId}
                className={`round-result-item ${perfect ? 'perfect' : 'lost'} ${result.eliminated ? 'eliminated' : ''}`}
              >
                <div className="round-result-player">
                  <span
                    className="player-dot"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="round-result-name">{player.name}</span>
                </div>

                <div className="round-result-details">
                  <span>
                    Palpite: <strong>{result.bid}</strong>
                  </span>
                  <span>
                    Fez: <strong>{result.tricksWon}</strong>
                  </span>
                </div>

                <div className="round-result-outcome">
                  {perfect ? (
                    <span className="outcome-perfect">Acertou!</span>
                  ) : (
                    <span className="outcome-lost">
                      −{result.livesLost} vida{result.livesLost > 1 ? 's' : ''}
                    </span>
                  )}
                  {result.eliminated && (
                    <span className="outcome-eliminated">Eliminado</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
