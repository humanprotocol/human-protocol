import { faker } from '@faker-js/faker';

import { NDAConfigService } from '../../../config';

export const mockNdaConfigService: Omit<NDAConfigService, 'configService'> = {
  latestNdaUrl: faker.internet.url(),
};
