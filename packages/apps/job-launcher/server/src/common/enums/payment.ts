import { EscrowFundToken } from './job';

export enum FiatCurrency {
  USD = 'usd',
}

// Allowed currencies for payments
export const PaymentCurrency = {
  ...FiatCurrency,
  ...EscrowFundToken,
};

export type PaymentCurrency =
  (typeof PaymentCurrency)[keyof typeof PaymentCurrency];

export enum PaymentSource {
  FIAT = 'fiat',
  CRYPTO = 'crypto',
  BALANCE = 'balance',
}

export enum PaymentFiatMethodType {
  CARD = 'card',
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  SLASH = 'slash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
}

export enum PaymentSortField {
  CREATED_AT = 'created_at',
  AMOUNT = 'amount',
}

export enum VatType {
  AD_NRT = 'ad_nrt',
  AE_TRN = 'ae_trn',
  AR_CUIT = 'ar_cuit',
  AU_ABN = 'au_abn',
  AU_ARN = 'au_arn',
  BG_UIC = 'bg_uic',
  BH_VAT = 'bh_vat',
  BO_TIN = 'bo_tin',
  BR_CNPJ = 'br_cnpj',
  BR_CPF = 'br_cpf',
  BY_TIN = 'by_tin',
  CA_BN = 'ca_bn',
  CA_GST_HST = 'ca_gst_hst',
  CA_PST_BC = 'ca_pst_bc',
  CA_PST_MB = 'ca_pst_mb',
  CA_PST_SK = 'ca_pst_sk',
  CA_QST = 'ca_qst',
  CH_UID = 'ch_uid',
  CH_VAT = 'ch_vat',
  CL_TIN = 'cl_tin',
  CN_TIN = 'cn_tin',
  CO_NIT = 'co_nit',
  CR_TIN = 'cr_tin',
  DE_STN = 'de_stn',
  DO_RCN = 'do_rcn',
  EC_RUC = 'ec_ruc',
  EG_TIN = 'eg_tin',
  ES_CIF = 'es_cif',
  EU_OSS_VAT = 'eu_oss_vat',
  EU_VAT = 'eu_vat',
  GB_VAT = 'gb_vat',
  GE_VAT = 'ge_vat',
  HK_BR = 'hk_br',
  HR_OIB = 'hr_oib',
  HU_TIN = 'hu_tin',
  ID_NPWP = 'id_npwp',
  IL_VAT = 'il_vat',
  IN_GST = 'in_gst',
  IS_VAT = 'is_vat',
  JP_CN = 'jp_cn',
  JP_RN = 'jp_rn',
  JP_TRN = 'jp_trn',
  KE_PIN = 'ke_pin',
  KR_BRN = 'kr_brn',
  KZ_BIN = 'kz_bin',
  LI_UID = 'li_uid',
  MA_VAT = 'ma_vat',
  MD_VAT = 'md_vat',
  MX_RFC = 'mx_rfc',
  MY_FRP = 'my_frp',
  MY_ITN = 'my_itn',
  MY_SST = 'my_sst',
  NG_TIN = 'ng_tin',
  NO_VAT = 'no_vat',
  NO_VOEC = 'no_voec',
  NZ_GST = 'nz_gst',
  OM_VAT = 'om_vat',
  PE_RUC = 'pe_ruc',
  PH_TIN = 'ph_tin',
  RO_TIN = 'ro_tin',
  RS_PIB = 'rs_pib',
  RU_INN = 'ru_inn',
  RU_KPP = 'ru_kpp',
  SA_VAT = 'sa_vat',
  SG_GST = 'sg_gst',
  SG_UEN = 'sg_uen',
  SI_TIN = 'si_tin',
  SV_NIT = 'sv_nit',
  TH_VAT = 'th_vat',
  TR_TIN = 'tr_tin',
  TW_VAT = 'tw_vat',
  TZ_VAT = 'tz_vat',
  UA_VAT = 'ua_vat',
  US_EIN = 'us_ein',
  UY_RUC = 'uy_ruc',
  UZ_TIN = 'uz_tin',
  UZ_VAT = 'uz_vat',
  VE_RIF = 've_rif',
  VN_TIN = 'vn_tin',
  ZA_VAT = 'za_vat',
}
