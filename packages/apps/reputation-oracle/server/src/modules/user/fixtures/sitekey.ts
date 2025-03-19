import { faker } from '@faker-js/faker';

import { generateEthWallet } from '../../../../test/fixtures/web3';

import { SiteKeyEntity, SiteKeyType } from '../site-key.entity';

export function generateSiteKeyEntity(
  userId: number,
  type: SiteKeyType,
): SiteKeyEntity {
  let siteKey: string;
  switch (type) {
    case SiteKeyType.HCAPTCHA:
      siteKey = faker.string.uuid();
      break;
    case SiteKeyType.REGISTRATION:
      siteKey = generateEthWallet().address;
      break;
  }

  return {
    id: faker.number.int(),
    userId,
    type,
    siteKey,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
