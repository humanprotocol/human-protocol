import { Validator } from 'class-validator';
import { IsValidEthereumAddress } from './ethers';

const validator = new Validator();

describe('IsValidEthereumAddress', () => {
  class MyClass {
    @IsValidEthereumAddress()
    someString: string;
  }

  it('should be valid', () => {
    const obj = new MyClass();
    obj.someString = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc';
    return validator.validate(obj).then((errors) => {
      expect(errors.length).toBe(0);
    });
  });

  it('should be invalid', () => {
    const obj = new MyClass();
    obj.someString = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dd';
    return validator.validate(obj).then((errors) => {
      expect(errors.length).toBe(1);
    });
  });
});
