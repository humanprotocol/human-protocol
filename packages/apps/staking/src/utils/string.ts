export const parseErrorMessage = (error: any) => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.response) {
    return error.response?.data?.message ?? "Something went wrong.";
  }

  if (error?.message) {
    const match = error.message.match(/Contract execution error: (.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    return error.message;
  }

  return "Something went wrong.";
};

export const formatAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
};

export const formatHmtAmount = (amount: string | number): string | number => {
  const _amount = Number(amount);
  if (_amount >= 1000) {
    return Math.round(_amount);
  } else {
    return parseFloat(_amount.toFixed(3));
  }
};
