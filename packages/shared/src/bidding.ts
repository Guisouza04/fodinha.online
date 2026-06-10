export function isValidBid(
  bid: number,
  cardsInRound: number,
  existingBids: number[],
  isLastBidder: boolean,
  enforceLastBidderRule = true
): boolean {
  if (!Number.isInteger(bid) || bid < 0 || bid > cardsInRound) {
    return false;
  }

  if (!isLastBidder || !enforceLastBidderRule) return true;

  const sum = existingBids.reduce((a, b) => a + b, 0) + bid;
  return sum !== cardsInRound;
}

export function getForbiddenBid(
  cardsInRound: number,
  existingBids: number[]
): number | null {
  const remaining = cardsInRound - existingBids.reduce((a, b) => a + b, 0);
  if (remaining >= 0 && remaining <= cardsInRound) {
    return remaining;
  }
  return null;
}

export function calculateLivesLost(bid: number, tricksWon: number): number {
  return Math.abs(bid - tricksWon);
}
