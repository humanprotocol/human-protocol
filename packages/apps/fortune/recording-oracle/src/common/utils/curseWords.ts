export const checkCurseWords = async (text: string): Promise<boolean> => {
  const TransformersApi = Function('return import("@xenova/transformers")')();
  const { pipeline } = await TransformersApi;
  const pipe = pipeline('text-classification', 'Rishi-19/Profanity_Test2');
  const result = await (await pipe)(text);
  const profanity = result[0].find(
    (res: { label: string }) => res.label === 'Profanity_detected',
  );
  return profanity && profanity.score > 0.5;
};
