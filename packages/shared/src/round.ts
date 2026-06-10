export function getCardsPerPlayer(
  roundNumber: number,
  playerCount: number
): number {
  const maxCards = Math.floor(40 / playerCount);
  if (maxCards < 1) return 1;

  let current = 1;
  let direction = 1;

  for (let round = 2; round <= roundNumber; round++) {
    if (direction === 1) {
      if (current >= maxCards) {
        direction = -1;
        current = maxCards - 1;
      } else {
        current++;
      }
    } else if (current <= 1) {
      direction = 1;
      current = 2;
    } else {
      current--;
    }
  }

  return current;
}

export function getMaxCardsPerRound(playerCount: number): number {
  return Math.floor(40 / playerCount);
}
