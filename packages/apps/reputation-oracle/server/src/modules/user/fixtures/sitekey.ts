import { faker } from '@faker-js/faker';

import { SiteKeyEntity, SiteKeyType } from '../site-key.entity';

export function generateSiteKeyEntity(
  userId: number,
  type: SiteKeyType,
): SiteKeyEntity {
  return {
    id: faker.number.int(),
    userId,
    type,
    siteKey: faker.string.uuid(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
