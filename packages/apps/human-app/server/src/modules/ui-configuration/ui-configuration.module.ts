import { Module } from '@nestjs/common';
import { UiConfigurationController } from './ui-configuration.controller';

@Module({
  controllers: [UiConfigurationController],
})
export class UiConfigurationModule {}
