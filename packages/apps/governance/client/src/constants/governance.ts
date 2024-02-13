// in PoS, ethereum block time is 12s, see https://ethereum.org/en/developers/docs/blocks/#block-time
export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 12

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  1: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
