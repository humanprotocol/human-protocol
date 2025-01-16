import {
  type RegisterAddressCallbacks,
  useRegisterAddressMutation,
} from './use-register-address-mutation';
import { useRegisterAddressValidation } from './use-register-address-validation';

export function useRegisterAddress(callbacks?: RegisterAddressCallbacks) {
  const validation = useRegisterAddressValidation();
  const mutation = useRegisterAddressMutation(callbacks);

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isValid: validation.isValid,
    validationErrors: validation.errors,
  };
}
