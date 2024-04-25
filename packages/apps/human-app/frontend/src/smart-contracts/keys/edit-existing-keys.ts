// TODO replace by smart contract instance created with ethers.js

import omit from 'lodash/omit';
import type { EditExistingKeysCallArguments } from '@/api/servieces/operator/edit-existing-keys';
import { FakeSmartContract } from '@/smart-contracts/keys/fake-keys-smart-contract';

export function editExistingKeys(
  data: EditExistingKeysCallArguments & { address: string }
) {
  // TODO add smart contract integration
  return FakeSmartContract.getInstance().editExistingKeys(
    omit(data, 'address')
  );
}
