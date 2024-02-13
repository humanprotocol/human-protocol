export enum VoteOption {
  Against,
  For,
  Abstain,
}

export enum ExchangeInputErrors {
  EMPTY_INPUT = 'Please enter an amount',
  EXCEEDS_BALANCE = `You don't have enough funds`,
}
