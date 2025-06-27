const isValidEVMAddress = (input: string, mask: string): boolean => {
  mask.split('').join('');
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmRegex.test(input);
};

export default isValidEVMAddress;
