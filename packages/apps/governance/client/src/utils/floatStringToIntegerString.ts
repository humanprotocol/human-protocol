export const floatStringToIntegerString = (floatStr: string): string => {
  const [integerPart, decimalPart] = floatStr.split('.')
  return integerPart + (decimalPart || '')
}
