import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

vi.mock('zustand');
//Extends expect function with testing-library matchers
expect.extend(matchers);

//Mock for the i18 translation https://vitest.dev/api/vi#vi-importactual
vi.mock('react-i18next', async () => {
  const mod = await vi.importActual('react-i18next');
  return {
    ...mod,
    useTranslation: () => {
      return {
        t: (str: string) => str,
        i18n: vi.fn(),
      };
    },
  };
});
