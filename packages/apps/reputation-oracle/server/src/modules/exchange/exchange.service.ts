export type ExchangeCredentials = { apiKey: string; secret: string };

export abstract class ExchangeService {
  abstract checkRequiredCredentials(creds: ExchangeCredentials): boolean;

  abstract checkRequiredAccess(creds: ExchangeCredentials): Promise<boolean>;

  abstract getAccountBalance(userId: number, asset?: string): Promise<number>;
}
