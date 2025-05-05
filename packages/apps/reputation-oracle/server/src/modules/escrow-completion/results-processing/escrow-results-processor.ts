import { ChainId, EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

import { ContentType } from '../../../common/enums';
import { JobManifest } from '../../../common/types';

import { PgpEncryptionService } from '../../encryption';
import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';

type EscrowFinalResultsDetails = {
  url: string;
  hash: string;
};

export interface EscrowResultsProcessor {
  storeResults(
    chainId: ChainId,
    escrowAddress: string,
    manifest: JobManifest,
  ): Promise<EscrowFinalResultsDetails>;
}

@Injectable()
export abstract class BaseEscrowResultsProcessor<TManifest extends JobManifest>
  implements EscrowResultsProcessor
{
  constructor(
    private readonly storageService: StorageService,
    private readonly pgpEncryptionService: PgpEncryptionService,
    private readonly web3Service: Web3Service,
  ) {}

  async storeResults(
    chainId: ChainId,
    escrowAddress: string,
    manifest: TManifest,
  ): Promise<EscrowFinalResultsDetails> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    /**
     * For some job types it's direct url,
     * but for some it's url to bucket with files
     */
    const baseUrl = await escrowClient.getIntermediateResultsUrl(escrowAddress);
    const intermediateResultsUrl =
      this.constructIntermediateResultsUrl(baseUrl);

    const fileContent = await this.storageService.downloadFile(
      intermediateResultsUrl,
    );

    await this.assertResultsComplete(fileContent, manifest);

    const escrowData = await EscrowUtils.getEscrow(chainId, escrowAddress);

    const encryptedResults = await this.pgpEncryptionService.encrypt(
      fileContent,
      chainId,
      [escrowData.launcher as string],
    );

    const hash = crypto
      .createHash('sha256')
      .update(encryptedResults)
      .digest('hex');

    const fileName = this.getFinalResultsFileName(hash);

    const url = await this.storageService.uploadData(
      encryptedResults,
      fileName,
      ContentType.PLAIN_TEXT,
    );

    return { url, hash };
  }

  protected abstract constructIntermediateResultsUrl(baseUrl: string): string;

  protected abstract assertResultsComplete(
    resultsFileContent: Buffer,
    manifest: TManifest,
  ): Promise<void>;

  protected abstract getFinalResultsFileName(hash: string): string;
}
