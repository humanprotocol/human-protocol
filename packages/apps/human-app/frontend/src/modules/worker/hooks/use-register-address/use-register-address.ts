import { useRegisterAddressMutation } from './use-register-address-mutation';
import { useRegisterAddressValidation } from './use-register-address-validation';
import type { RegisterAddressCallbacks } from './types';

export function useRegisterAddress(callbacks?: RegisterAddressCallbacks) {
  const validation = useRegisterAddressValidation();
  const mutation = useRegisterAddressMutation(callbacks);

  return {
    register: mutation.mutate,
    isRegistering: mutation.isPending,
    error: mutation.error,
    isValid: validation.isValid,
    validationErrors: validation.errors,
  };
}
