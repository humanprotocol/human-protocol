export const formatNumber = (number: number) => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed()} M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed()} K`;
  }

  return `${number.toString()}`;
};
