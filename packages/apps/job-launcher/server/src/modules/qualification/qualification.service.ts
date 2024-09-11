import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { QualificationDto } from './qualification.dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorQualification, ErrorWeb3 } from '../../common/constants/errors';
import { KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    private httpService: HttpService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

  public async getQualifications(): Promise<QualificationDto[]> {
    try {
      let reputationOracleUrl = '';

      try {
        reputationOracleUrl = await KVStoreUtils.get(
          this.networkConfigService.networks[0].chainId,
          this.web3ConfigService.reputationOracleAddress,
          KVStoreKeys.url,
        );
      } catch {}

      if (!reputationOracleUrl || reputationOracleUrl === '') {
        throw new ControlledError(
          ErrorWeb3.ReputationOracleUrlNotSet,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { data } = await firstValueFrom(
        this.httpService.get<QualificationDto[]>(
          `${reputationOracleUrl}/qualification`,
        ),
      );

      return data;
    } catch (error) {
      if (error instanceof ControlledError) {
        throw error;
      } else {
        throw new ControlledError(
          ErrorQualification.FailedToFetchQualifications,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
