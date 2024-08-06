export const password8Chars =
  /^[A-Za-z0-9$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+-]{8,}$/;
export const passwordUppercase = /(?=.*[A-Z])/;
export const passwordLowercase = /(?=.*[a-z])/;
export const passwordNumeric = /(?=.*[0-9])/;
export const passwordSpecialCharacter =
  /(?=.*[$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+-])/;

// this is sum of all above regular expressions
export const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+-])[A-Za-z0-9$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+-]{8,}$/;
