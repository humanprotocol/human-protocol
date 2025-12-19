const stakeFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 18,
  notation: 'standard',
  useGrouping: false,
});
export const formatStake = (value: number) => stakeFormatter.format(value);
