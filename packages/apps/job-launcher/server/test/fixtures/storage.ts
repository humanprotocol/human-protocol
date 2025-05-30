import { faker } from '@faker-js/faker';
import { AWSRegions, StorageProviders } from '../../src/common/enums/storage';

export function getMockedProvider(): StorageProviders {
  return faker.helpers.arrayElement(
    Object.values(StorageProviders).filter(
      (provider) => provider !== StorageProviders.LOCAL,
    ),
  );
}

export function getMockedRegion(): AWSRegions {
  return faker.helpers.arrayElement(Object.values(AWSRegions));
}
