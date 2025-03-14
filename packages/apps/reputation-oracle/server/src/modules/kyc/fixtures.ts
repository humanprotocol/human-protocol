import { faker } from '@faker-js/faker';

import { KycConfigService } from '../../config/kyc-config.service';
import { KycEntity } from './kyc.entity';
import { KycStatus } from './constants';

export const mockKycConfigService: Omit<KycConfigService, 'configService'> = {
  apiPrivateKey: faker.string.alphanumeric(),
  apiKey: faker.string.alphanumeric(),
  baseUrl: faker.internet.url(),
};

export function generateKycEntity(
  userId: number,
  status: KycStatus,
): KycEntity {
  const kyc: KycEntity = {
    id: faker.number.int(),
    userId,
    sessionId: faker.string.uuid(),
    status,
    country: null,
    message: null,
    url: faker.internet.url(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  if (kyc.status === KycStatus.APPROVED) {
    kyc.country = faker.location.countryCode();
  }

  return kyc;
}
