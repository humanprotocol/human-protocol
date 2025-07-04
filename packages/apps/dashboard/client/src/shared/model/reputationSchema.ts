import { z } from 'zod';

export const reputationSchema = z.unknown().transform((value) => {
  try {
    const knownReputation = z
      .union([z.literal('low'), z.literal('medium'), z.literal('high')])
      .parse(value);

    return knownReputation;
  } catch (error) {
    console.error(error);
    return 'unknown';
  }
});

export type Reputation = z.infer<typeof reputationSchema>;
