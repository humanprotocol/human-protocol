import { UserType } from '../../src/common/enums/user';
import { ethers } from 'ethers';
import { SignupOperatorData } from '../../src/modules/user-operator/model/operator.model';
export async function generateOperatorSignupRequestBody() {
  const wallet = ethers.Wallet.createRandom();
  const flatSig = await wallet.signMessage('signup');
  return {
    address: wallet.address,
    signature: flatSig,
    type: UserType.OPERATOR.toString(),
  } as SignupOperatorData;
}
