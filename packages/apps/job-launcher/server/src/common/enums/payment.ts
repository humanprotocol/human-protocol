export enum Currency {
  USD = 'usd',
  AED = 'aed',
  ARS = 'ars',
  AUD = 'aud',
  BDT = 'bdt',
  BMD = 'bmd',
  BRL = 'brl',
  CAD = 'cad',
  CHF = 'chf',
  CLP = 'clp',
  CNY = 'cny',
  CZK = 'czk',
  DKK = 'dkk',
  EUR = 'eur',
  GBP = 'gbp',
  HKD = 'hkd',
  HUF = 'huf',
  IDR = 'idr',
  ILS = 'ils',
  INR = 'inr',
  JPY = 'jpy',
  KRW = 'krw',
  LKR = 'lkr',
  MMK = 'mmk',
  MXN = 'mxn',
  MYR = 'myr',
  NGN = 'ngn',
  NOK = 'nok',
  NZD = 'nzd',
  PHP = 'php',
  PKR = 'pkr',
  PLN = 'pln',
  RUB = 'rub',
  SAR = 'sar',
  SEK = 'sek',
  SGD = 'sgd',
  THB = 'thb',
  TRY = 'try',
  TWD = 'twd',
  UAH = 'uah',
  VND = 'vnd',
  ZAR = 'zar',
}

export enum TokenId {
  HMT = 'hmt',
  USDT = 'usdt',
}

export enum PaymentSource {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
  BALANCE = 'BALANCE',
}

export enum PaymentFiatMethodType {
  CARD = 'CARD',
}

export enum PaymentType {
  DEPOSIT = 'DEPOSIT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCEEDED = 'SUCCEEDED',
}

export enum StripePaymentStatus {
  CANCELED = 'canceled',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  SUCCEEDED = 'succeeded',
}
