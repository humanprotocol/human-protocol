import { formatEther } from 'ethers';

export const formatHMTDecimals = (value: string) => {
  const formattedValue = Number(formatEther(value));

  if (Number.isInteger(formattedValue)) {
    return formattedValue.toString();
  }

  if (Math.abs(formattedValue) < 1) {
    if (Math.abs(formattedValue) < 0.00000001) {
      return '0.00000001';
    }

    return formattedValue.toFixed(
      Math.min(8, formattedValue.toString().split('.')[1]?.length || 8)
    );
  }

  const decimalPlaces = formattedValue.toString().split('.')[1]?.length || 0;
  return decimalPlaces > 4
    ? formattedValue.toFixed(4)
    : formattedValue.toString();
};
