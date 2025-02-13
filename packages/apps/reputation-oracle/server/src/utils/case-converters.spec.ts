import { faker } from '@faker-js/faker';
import * as CaseConverter from './case-converters';

describe('Case converting utilities', () => {
  describe('transformKeysFromSnakeToCamel', () => {
    it.each([
      'string',
      42,
      BigInt(0),
      new Date(),
      Symbol('test'),
      true,
      null,
      undefined,
    ])('should not transform basic value [%#]', (value: unknown) => {
      expect(CaseConverter.transformKeysFromSnakeToCamel(value)).toEqual(value);
    });

    it('should not transform simple array', () => {
      const input = faker.helpers.multiple(() => faker.string.sample());

      const output = CaseConverter.transformKeysFromSnakeToCamel(input);

      expect(output).toEqual(input);
    });

    it('should transform array of objects', () => {
      const input = faker.helpers.multiple(() => ({
        test_case: faker.string.sample(),
      }));
      const expectedOutput = input.map((v) => ({
        testCase: v.test_case,
      }));

      const output = CaseConverter.transformKeysFromSnakeToCamel(input);

      expect(output).toEqual(expectedOutput);
    });

    it('should transform plain object to camelCase', () => {
      const input = {
        random_string: faker.string.sample(),
        random_number: faker.number.float(),
        random_boolean: faker.datatype.boolean(),
        always_null: null,
      };

      const output = CaseConverter.transformKeysFromSnakeToCamel(input);

      expect(output).toEqual({
        randomString: input.random_string,
        randomNumber: input.random_number,
        randomBoolean: input.random_boolean,
        alwaysNull: null,
      });
    });

    it('should transform input with nested data', () => {
      const randomString = faker.string.sample();

      const input = {
        nested_object: {
          with_array: [
            {
              of_objects: {
                with_random_string: randomString,
              },
            },
          ],
        },
      };

      const output = CaseConverter.transformKeysFromSnakeToCamel(input);

      expect(output).toEqual({
        nestedObject: {
          withArray: [
            {
              ofObjects: {
                withRandomString: randomString,
              },
            },
          ],
        },
      });
    });
  });

  describe('transformKeysFromCamelToSnake', () => {
    it.each([
      'string',
      42,
      BigInt(0),
      new Date(),
      Symbol('test'),
      true,
      null,
      undefined,
    ])('should not transform primitive [%#]', (value: unknown) => {
      expect(CaseConverter.transformKeysFromCamelToSnake(value)).toEqual(value);
    });

    it('should not transform simple array', () => {
      const input = faker.helpers.multiple(() => faker.string.sample());

      const output = CaseConverter.transformKeysFromCamelToSnake(input);

      expect(output).toEqual(input);
    });

    it('should transform array of objects', () => {
      const input = faker.helpers.multiple(() => ({
        testCase: faker.string.sample(),
      }));
      const expectedOutput = input.map((v) => ({
        test_case: v.testCase,
      }));

      const output = CaseConverter.transformKeysFromCamelToSnake(input);

      expect(output).toEqual(expectedOutput);
    });

    it('should transform plain object to camelCase', () => {
      const input = {
        randomString: faker.string.sample(),
        randomNumber: faker.number.float(),
        randomBoolean: faker.datatype.boolean(),
        alwaysNull: null,
      };

      const output = CaseConverter.transformKeysFromCamelToSnake(input);

      expect(output).toEqual({
        random_string: input.randomString,
        random_number: input.randomNumber,
        random_boolean: input.randomBoolean,
        always_null: null,
      });
    });

    it('should transform input with nested data', () => {
      const randomString = faker.string.sample();

      const input = {
        nestedObject: {
          withArray: [
            {
              ofObjects: {
                withRandomString: randomString,
              },
            },
          ],
        },
      };

      const output = CaseConverter.transformKeysFromCamelToSnake(input);

      expect(output).toEqual({
        nested_object: {
          with_array: [
            {
              of_objects: {
                with_random_string: randomString,
              },
            },
          ],
        },
      });
    });
  });
});
