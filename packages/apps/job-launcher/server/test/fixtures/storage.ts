import { faker } from '@faker-js/faker';
import { AWSRegions, StorageProviders } from '../../src/common/enums/storage';

const PROVIDERS = Object.values(StorageProviders).filter(
  (provider) => provider !== StorageProviders.LOCAL,
);

const REGIONS = Object.values(AWSRegions);

export function getMockedProvider(): StorageProviders {
  return faker.helpers.arrayElement(PROVIDERS);
}

export function getMockedRegion(): AWSRegions {
  return faker.helpers.arrayElement(REGIONS);
}
