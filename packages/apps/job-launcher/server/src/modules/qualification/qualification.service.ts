import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { QualificationDto } from './qualification.dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorQualification } from '../../common/constants/errors';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    private httpService: HttpService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  public async getQualifications(): Promise<QualificationDto[]> {
    try {
      const { data } = (await firstValueFrom(
        this.httpService.get(
          `${this.web3ConfigService.reputationOracleUri}/qualification`,
        ),
      )) as any;

      return data;
    } catch (error) {
      throw new ControlledError(
        ErrorQualification.FailedToFetchQualifications,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
