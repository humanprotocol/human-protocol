export const shortenEscrowAddress = (address: string) => {
  if (address.length < 13) {
    return address;
  }
  return `${address.substring(0, 7)}...${address.substring(address.length - 5)}`;
};
