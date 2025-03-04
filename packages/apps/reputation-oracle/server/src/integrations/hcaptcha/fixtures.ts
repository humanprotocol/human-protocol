import { faker } from '@faker-js/faker';
import { HCaptchaConfigService } from '../../config/hcaptcha-config.service';

export const mockHCaptchaConfigService: Partial<HCaptchaConfigService> = {
  siteKey: faker.string.uuid(),
  apiKey: faker.string.uuid(),
  secret: `E0_${faker.string.alphanumeric()}`,
  protectionURL: faker.internet.url(),
  labelingURL: faker.internet.url(),
  defaultLabelerLang: faker.location.language().alpha2,
};
