import { CURSE_WORDS } from '../constants/curseWords';

export const checkCurseWords = (text: string): boolean => {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ');
  const res = CURSE_WORDS.some((w) => words.includes(w));
  return res;
};