import * as bcrypt from 'bcrypt';

export function hashPassword(password: string): string {
  const SALT_GENERATION_ROUNDS = 12;

  return bcrypt.hashSync(password, SALT_GENERATION_ROUNDS);
}

export function comparePasswordWithHash(
  password: string,
  passwordHash: string,
): boolean {
  return bcrypt.compareSync(password, passwordHash);
}
