export const shortenEscrowAddress = (
  address: string,
  startPad = 7,
  endPad = 5
) => {
  if (address.length < 13) {
    return address;
  }
  return `${address.substring(0, startPad)}...${address.substring(address.length - endPad)}`;
};
