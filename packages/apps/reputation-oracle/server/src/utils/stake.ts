export const formatStake = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 18,
    notation: 'standard',
    useGrouping: false,
  }).format(value);
