import { Injectable, Logger } from '@nestjs/common';
import { ChainId, EscrowClient, StorageClient } from '@human-protocol/sdk';
import { Manifest } from '../../common/interfaces/manifest';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class ManifestService {
  private readonly logger = new Logger(ManifestService.name);

  constructor(private readonly web3Service: Web3Service) {}

  public async getManifest(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<Manifest> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);

    if (!manifestUrl) {
      throw new Error('Manifest URL not found');
    }

    const manifest = await StorageClient.downloadFileFromUrl(manifestUrl);

    if (!manifest) {
      throw new Error('Manifest not found');
    }

    return manifest;
  }
}
