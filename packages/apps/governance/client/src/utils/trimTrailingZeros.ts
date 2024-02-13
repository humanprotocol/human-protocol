export const trimTrailingZeros = (numberStr = ''): string => {
  return numberStr.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}
