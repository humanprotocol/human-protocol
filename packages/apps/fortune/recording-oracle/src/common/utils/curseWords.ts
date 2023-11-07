import { CURSE_WORDS } from '../constants/curseWords';
import { pipeline } from '@xenova/transformers';

export const checkCurseWords = async (text: string): Promise<boolean> => {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ');

  const checkWordList = CURSE_WORDS.some((w) => words.includes(w));

  if (checkWordList) {
    return true;
  }

  const pipe = await pipeline(
    'text-classification',
    'Rishi-19/Profanity_Test2',
  );
  const result = await pipe(text);
  const profanity = result[0].find(
    (res: { label: string }) => res.label === 'Profanity_detected',
  );
  return profanity ? profanity.score > 0.5 : false;
};
