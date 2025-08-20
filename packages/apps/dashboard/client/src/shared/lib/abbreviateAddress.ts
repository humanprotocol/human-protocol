const abbreviateAddress = (address: string | null) => {
  if (address) {
    const first3Letters = address.slice(0, 5);
    const last5Letters = address.slice(-5);

    return `${first3Letters}...${last5Letters}`;
  }

  return null;
};

export default abbreviateAddress;
