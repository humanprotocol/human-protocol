import { faker } from '@faker-js/faker';
import { HCaptchaConfigService } from '../../../config';

export const mockHCaptchaConfigService: Omit<
  HCaptchaConfigService,
  'configService'
> = {
  siteKey: faker.string.uuid(),
  apiKey: faker.string.uuid(),
  secret: `E0_${faker.string.alphanumeric()}`,
  protectionURL: faker.internet.url(),
  labelingURL: faker.internet.url(),
  defaultLabelerLang: faker.location.language().alpha2,
};
