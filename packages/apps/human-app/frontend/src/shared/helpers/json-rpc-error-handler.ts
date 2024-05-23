import { t } from 'i18next';

export function jsonRpcErrorHandler(_: unknown) {
  // TODO handle JSON RPC errors
  return t('errors.unknown');
}
