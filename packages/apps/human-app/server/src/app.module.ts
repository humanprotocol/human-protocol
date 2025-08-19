import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { ChainId } from '@human-protocol/sdk';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Joi from 'joi';
import { AppController } from './app.controller';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { CommonConfigModule } from './common/config/common-config.module';
import { EnvironmentConfigService } from './common/config/environment-config.service';
import { ExceptionFilter } from './common/filter/exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt.auth';
import { JwtHttpStrategy } from './common/guards/strategy';
import { InterceptorModule } from './common/interceptors/interceptor.module';
import { ForbidUnauthorizedHostMiddleware } from './common/middleware/host-check.middleware';
import Environment from './common/utils/environment';
import { EscrowUtilsModule } from './integrations/escrow/escrow-utils.module';
import { ExchangeOracleModule } from './integrations/exchange-oracle/exchange-oracle.module';
import { HCaptchaLabelingModule } from './integrations/h-captcha-labeling/h-captcha-labeling.module';
import { KvStoreModule } from './integrations/kv-store/kv-store.module';
import { ReputationOracleModule } from './integrations/reputation-oracle/reputation-oracle.module';
import { AbuseController } from './modules/abuse/abuse.controller';
import { AbuseModule } from './modules/abuse/abuse.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { EmailConfirmationModule } from './modules/email-confirmation/email-confirmation.module';
import { HCaptchaController } from './modules/h-captcha/h-captcha.controller';
import { HCaptchaModule } from './modules/h-captcha/h-captcha.module';
import { HealthModule } from './modules/health/health.module';
import { JobAssignmentController } from './modules/job-assignment/job-assignment.controller';
import { JobAssignmentModule } from './modules/job-assignment/job-assignment.module';
import { JobsDiscoveryController } from './modules/jobs-discovery/jobs-discovery.controller';
import { JobsDiscoveryModule } from './modules/jobs-discovery/jobs-discovery.module';
import { KycProcedureModule } from './modules/kyc-procedure/kyc-procedure.module';
import { NDAController } from './modules/nda/nda.controller';
import { NDAModule } from './modules/nda/nda.module';
import { OracleDiscoveryController } from './modules/oracle-discovery/oracle-discovery.controller';
import { GovernanceModule } from './modules/governance/governance.module';
import { GovernanceController } from './modules/governance/governance.controller';
import { OracleDiscoveryModule } from './modules/oracle-discovery/oracle-discovery.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { PrepareSignatureModule } from './modules/prepare-signature/prepare-signature.module';
import { RegisterAddressController } from './modules/register-address/register-address.controller';
import { RegisterAddressModule } from './modules/register-address/register-address.module';
import { StatisticsController } from './modules/statistics/statistics.controller';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { TokenRefreshController } from './modules/token-refresh/token-refresh.controller';
import { TokenRefreshModule } from './modules/token-refresh/token-refresh.module';
import { UiConfigurationModule } from './modules/ui-configuration/ui-configuration.module';
import { OperatorController } from './modules/user-operator/operator.controller';
import { OperatorModule } from './modules/user-operator/operator.module';
import { WorkerController } from './modules/user-worker/worker.controller';
import { WorkerModule } from './modules/user-worker/worker.module';

const JOI_BOOLEAN_STRING_SCHEMA = Joi.string().valid('true', 'false');

@Module({
  imports: [
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      isGlobal: true,
      validationSchema: Joi.object({
        HOST: Joi.string().required(),
        PORT: Joi.number().required(),
        REPUTATION_ORACLE_URL: Joi.string().required(),
        REPUTATION_ORACLE_ADDRESS: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_DB: Joi.number(),
        RPC_URL: Joi.string().required(),
        GOVERNANCE_RPC_URL: Joi.string(),
        GOVERNOR_ADDRESS: Joi.string().required(),
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
        HUMAN_APP_SECRET_KEY: Joi.string().required(),
        IS_AXIOS_REQUEST_LOGGING_ENABLED: JOI_BOOLEAN_STRING_SCHEMA,
        CORS_ENABLED: JOI_BOOLEAN_STRING_SCHEMA,
        CORS_ALLOWED_ORIGIN: Joi.string(),
        CORS_ALLOWED_HEADERS: Joi.string(),
        IS_CACHE_TO_RESTART: JOI_BOOLEAN_STRING_SCHEMA,
        CACHE_TTL_ORACLE_STATS: Joi.number(),
        CACHE_TTL_USER_STATS: Joi.number(),
        CACHE_TTL_DAILY_HMT_SPENT: Joi.number(),
        CACHE_TTL_HCAPTCHA_USER_STATS: Joi.number(),
        CACHE_TTL_ORACLE_DISCOVERY: Joi.number(),
        CACHE_TTL_ORACLE_AVAILABLE_JOBS: Joi.number(),
        JOB_ASSIGNMENTS_DATA_RETENTION_DAYS: Joi.number(),
        CACHE_TTL_EXCHANGE_ORACLE_URL: Joi.number(),
        CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED: Joi.number(),
        MAX_EXECUTIONS_TO_SKIP: Joi.number(),
        FEATURE_FLAG_JOBS_DISCOVERY: JOI_BOOLEAN_STRING_SCHEMA,
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
    KycProcedureModule,
    PrepareSignatureModule,
    HCaptchaModule,
    HCaptchaLabelingModule,
    EscrowUtilsModule,
    RegisterAddressModule,
    InterceptorModule,
    TokenRefreshModule,
    CronJobModule,
    HealthModule,
    UiConfigurationModule,
    NDAModule,
    AbuseModule,
    GovernanceModule,
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
    TokenRefreshController,
    NDAController,
    AbuseController,
    GovernanceController,
  ],
  exports: [HttpModule],
  providers: [
    EnvironmentConfigService,
    JwtHttpStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ForbidUnauthorizedHostMiddleware).forRoutes('*');
  }
}
