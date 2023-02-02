import {
  RestrictedAudience,
  RestrictedAudienceScore,
} from './generated/manifest';
import { validateUUIDString } from './validators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateScoreObject = (scoreObj: any) => {
  if (Object.keys(scoreObj).length !== 1 || !scoreObj.score) {
    throw new Error('Score object must have exactly one key, score');
  }

  const score: RestrictedAudienceScore = scoreObj;
  if (score.score < 0 || score.score > 1) {
    throw new Error('Score must be between 0 and 1');
  }
};

export const validateScoreFields = (restrictedAudience: RestrictedAudience) => {
  for (const [key, value] of Object.entries(restrictedAudience)) {
    if (!value) {
      return;
    }

    if (
      [
        'lang',
        'country',
        'browser',
        'sitekey',
        'serverdomain',
        'confidence',
      ].includes(key)
    ) {
      if (!Array.isArray(value)) {
        throw new Error(`${key} must be an array`);
      }

      if (value.length !== 1) {
        throw new Error(`${key} must have exactly one element`);
      }

      for (const [scoreKey, scoreObj] of Object.entries(value[0])) {
        validateScoreObject(scoreObj);

        if (['lang', 'country', 'sitekey'].includes(key)) {
          if (scoreKey !== scoreKey.toLowerCase()) {
            throw new Error(`${key} key must use lowercase keys`);
          }
        }
      }
    }
  }
};

export const validateSiteKey = (restrictedAudience: RestrictedAudience) => {
  if (restrictedAudience.sitekey) {
    for (const restriction of restrictedAudience.sitekey) {
      for (const key of Object.keys(restriction)) {
        validateUUIDString(key);
      }
    }
  }
};
