export function isValidEthAddress(address: string): boolean {
  if (address.length != 42) {
    return false;
  }

  if (address.slice(0, 2) != '0x' && address.slice(0, 2) != '0X') {
    return false;
  }

  for (let i = 2; i < address.length; i++) {
    const charCode = address.charCodeAt(i);
    if (
      !(charCode >= 48 && charCode <= 57) &&
      !(charCode >= 97 && charCode <= 102) &&
      !(charCode >= 65 && charCode <= 70)
    ) {
      return false;
    }
  }

  return true;
}
