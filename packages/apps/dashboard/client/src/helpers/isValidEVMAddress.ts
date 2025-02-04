export const isValidEVMAddress = (input: string): boolean => {
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmRegex.test(input);
};
