import { CURSE_WORDS } from '../constants';

export const checkCurseWords = (text: string): boolean => {
  const words = text.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
  const res = CURSE_WORDS.some((w) => words.includes(w));
  return res;
};
