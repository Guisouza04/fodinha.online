import { Card, PlayerState } from '@fodinha/shared';
import CardView from './CardView';

export default function OpponentCards({
  opponents,
}: {
  opponents: PlayerState[];
}) {
  if (opponents.length === 0) return null;

  return (
    <div className="opponent-cards-area">
      <p className="opponent-cards-title">Cartas dos oponentes</p>
      <div className="opponent-cards-grid">
        {opponents.map((opponent) => (
          <div key={opponent.id} className="opponent-cards-player">
            <span
              className="opponent-cards-name"
              style={{ color: opponent.color }}
            >
              {opponent.name}
            </span>
            <div className="opponent-cards-hand">
              {opponent.hand.map((card: Card, i) => (
                <CardView
                  key={`${card.rank}-${card.suit}-${i}`}
                  card={card}
                  small
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
