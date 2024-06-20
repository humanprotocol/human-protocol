import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WorkerModule } from './modules/user-worker/worker.module';
import { ReputationOracleModule } from './integrations/reputation-oracle/reputation-oracle.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OperatorModule } from './modules/user-operator/operator.module';
import { OperatorController } from './modules/user-operator/operator.controller';
import { WorkerController } from './modules/user-worker/worker.controller';
import { CommonConfigModule } from './common/config/common-config.module';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { CacheModule } from '@nestjs/cache-manager';
import { OracleDiscoveryController } from './modules/oracle-discovery/oracle-discovery.controller';
import { OracleDiscoveryModule } from './modules/oracle-discovery/oracle-discovery.module';
import { JobsDiscoveryModule } from './modules/jobs-discovery/jobs-discovery.module';
import { JobsDiscoveryController } from './modules/jobs-discovery/jobs-discovery.controller';
import { JobAssignmentController } from './modules/job-assignment/job-assignment.controller';
import { JobAssignmentModule } from './modules/job-assignment/job-assignment.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { StatisticsController } from './modules/statistics/statistics.controller';
import { ExchangeOracleModule } from './integrations/exchange-oracle/exchange-oracle.module';
import { KvStoreModule } from './integrations/kv-store/kv-store.module';
import { EmailConfirmationModule } from './modules/email-confirmation/email-confirmation.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { DisableOperatorModule } from './modules/disable-operator/disable-operator.module';
import { KycProcedureModule } from './modules/kyc-procedure/kyc-procedure.module';
import { PrepareSignatureModule } from './modules/prepare-signature/prepare-signature.module';
import { HCaptchaModule } from './modules/h-captcha/h-captcha.module';
import { HCaptchaLabelingModule } from './integrations/h-captcha-labeling/h-captcha-labeling.module';
import { HCaptchaController } from './modules/h-captcha/h-captcha.controller';
import { EscrowUtilsModule } from './integrations/escrow/escrow-utils.module';
import Joi from 'joi';
import { ChainId } from '@human-protocol/sdk';
import { RegisterAddressController } from './modules/register-address/register-address.controller';
import { RegisterAddressModule } from './modules/register-address/register-address.module';
import { InterceptorModule } from './common/interceptors/interceptor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HOST: Joi.string().required(),
        PORT: Joi.number().required(),
        REPUTATION_ORACLE_URL: Joi.string().required(),
        REPUTATION_ORACLE_ADDRESS: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_HOST: Joi.string().required(),
        RPC_URL: Joi.string().required(),
        HCAPTCHA_LABELING_STATS_API_URL: Joi.string().required(),
        HCAPTCHA_LABELING_VERIFY_API_URL: Joi.string().required(),
        HCAPTCHA_LABELING_API_KEY: Joi.string().required(),
        CHAIN_IDS_ENABLED: Joi.string()
          .custom((value) => {
            const chainIds = value.split(',');
            for (const id of chainIds) {
              if (!Object.values(ChainId).includes(Number(id.trim()))) {
                throw new Error(
                  `Invalid chain ID: Chain ID ${id} is not included in the HUMAN SDK.`,
                );
              }
            }
            return value;
          })
          .required(),
      }),
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    CacheModule.registerAsync(CacheFactoryConfig),
    HttpModule,
    WorkerModule,
    OperatorModule,
    JobsDiscoveryModule,
    JobAssignmentModule,
    ReputationOracleModule,
    ExchangeOracleModule,
    CommonConfigModule,
    OracleDiscoveryModule,
    StatisticsModule,
    KvStoreModule,
    EmailConfirmationModule,
    PasswordResetModule,
    DisableOperatorModule,
    KycProcedureModule,
    PrepareSignatureModule,
    HCaptchaModule,
    HCaptchaLabelingModule,
    EscrowUtilsModule,
    RegisterAddressModule,
    InterceptorModule,
  ],
  controllers: [
    AppController,
    OperatorController,
    WorkerController,
    JobsDiscoveryController,
    OracleDiscoveryController,
    JobAssignmentController,
    StatisticsController,
    HCaptchaController,
    RegisterAddressController,
  ],
  exports: [HttpModule],
})
export class AppModule {}
