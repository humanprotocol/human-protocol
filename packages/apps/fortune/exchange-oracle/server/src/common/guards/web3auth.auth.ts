import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Web3Service } from '../../modules/web3/web3.service';
import { verifySignature } from '../utils/signature';
import { HEADER_WEB3_SIGNATURE_KEY } from '../constant';

@Injectable()
export class Web3SignatureGuard implements CanActivate {
  constructor(private readonly web3Service: Web3Service) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_WEB3_SIGNATURE_KEY];
    const chainId = parseInt(request.headers['chain-id'], 10);

    try {
      this.web3Service.validateChainId(chainId);
      const signer = this.web3Service.getSigner(chainId);
      const isVerified = verifySignature(data, signature, [signer.address]); // Assuming signer.address is the expected signer address

      if (isVerified) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
