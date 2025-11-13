import { ChainId, KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorQualification, ErrorWeb3 } from '../../common/constants/errors';
import { ServerError } from '../../common/errors';
import { formatAxiosError } from '../../common/utils/http';
import logger from '../../logger';
import { Web3Service } from '../web3/web3.service';
import { QualificationDto } from './qualification.dto';

@Injectable()
export class QualificationService {
  private readonly logger = logger.child({
    context: QualificationService.name,
  });

  constructor(
    private httpService: HttpService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  public async getQualifications(
    chainId: ChainId,
  ): Promise<QualificationDto[]> {
    let reputationOracleUrl = '';
    this.web3Service.validateChainId(chainId);

    try {
      reputationOracleUrl = await KVStoreUtils.get(
        chainId,
        this.web3ConfigService.reputationOracleAddress,
        KVStoreKeys.url,
      );
    } catch {}

    if (!reputationOracleUrl || reputationOracleUrl === '') {
      throw new ServerError(ErrorWeb3.ReputationOracleUrlNotSet);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<QualificationDto[]>(
          `${reputationOracleUrl}/qualifications`,
        ),
      );

      return data;
    } catch (error) {
      const formattedError = formatAxiosError(error);
      this.logger.error(
        'Error fetching qualifications from reputation oracle',
        formattedError,
      );
      throw new ServerError(ErrorQualification.FailedToFetchQualifications);
    }
  }
}
