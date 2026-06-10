import { Card } from '@fodinha/shared';
import { formatCard, getSuitColor, isRedSuit } from '../utils/cards';

export default function CardView({
  card,
  hidden,
  onClick,
  selected,
  small,
}: {
  card: Card;
  hidden?: boolean;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}) {
  if (hidden) {
    return (
      <div className={`playing-card hidden ${small ? 'small' : ''}`}>
        <span className="card-back">🂠</span>
      </div>
    );
  }

  const red = isRedSuit(card.suit);

  return (
    <button
      type="button"
      className={`playing-card ${selected ? 'selected' : ''} ${small ? 'small' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      style={{ borderColor: getSuitColor(card.suit) }}
    >
      <span className={`card-rank ${red ? 'red' : 'black'}`}>{card.rank}</span>
      <span className={`card-suit ${red ? 'red' : 'black'}`}>
        {formatCard(card).slice(card.rank.length)}
      </span>
    </button>
  );
}
