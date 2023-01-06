export const parseBigDecimal = (value: string): number => {
  return Number(parseFloat(value).toFixed(10));
};
