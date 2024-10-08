import { validate, ValidationError } from 'class-validator';
import { IsEnumInsensitive } from './enum-insensitive';

enum JobRequestType {
  TYPE_A = 'TYPE_A',
  TYPE_B = 'TYPE_B',
}

class TestDto {
  @IsEnumInsensitive(JobRequestType)
  requestType: string;
}

describe('IsEnumInsensitive', () => {
  const validUpperCaseEnum = JobRequestType.TYPE_A; // 'TYPE_A'
  const validLowerCaseEnum = 'type_a';
  const invalidEnum = 'INVALID_TYPE';

  it('should validate when the value matches enum in uppercase', async () => {
    const dto = new TestDto();
    dto.requestType = validUpperCaseEnum;

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate when the value matches enum in lowercase', async () => {
    const dto = new TestDto();
    dto.requestType = validLowerCaseEnum;

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should return error for invalid enum value', async () => {
    const dto = new TestDto();
    dto.requestType = invalidEnum;

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isEnumInsensitive).toBe(
      `requestType must be one of the following values: TYPE_A, TYPE_B`,
    );
  });

  it('should return error for non-string values', async () => {
    const dto = new TestDto();
    dto.requestType = 123 as any; // Non-string value

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isEnumInsensitive).toBe(
      `requestType must be one of the following values: TYPE_A, TYPE_B`,
    );
  });

  it('should return error when value is missing', async () => {
    const dto = new TestDto();
    dto.requestType = undefined as any; // Undefined value

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isEnumInsensitive).toBe(
      `requestType must be one of the following values: TYPE_A, TYPE_B`,
    );
  });
});
