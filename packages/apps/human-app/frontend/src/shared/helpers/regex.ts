export const password8Chars =
  /^[A-Za-z0-9$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+-]{8,}$/;
export const passwordUppercase = /(?=.*[A-Z])/;
export const passwordLowercase = /(?=.*[a-z])/;
export const passwordNumeric = /(?=.*[0-9])/;
export const passwordSpecialCharacter = /[!@#$%^&+=*]/; // allowed characters: @#$%^&+=!*]

// this is sum of all above regular expressions that matches with reputation oracle 'auth.dto.ts'
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&+=*])(?=.{8,})/;
