export const shortenEscrowAddress = (address: string) => {
  if (address.length < 8) {
    return address;
  }
  return `${address.substring(0, 2)}...${address.substring(address.length - 4)}`;
};
