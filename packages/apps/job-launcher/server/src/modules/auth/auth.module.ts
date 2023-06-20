import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { JwtHttpStrategy } from './strategy';
import { AuthService } from './auth.service';
import { AuthJwtController } from './auth.jwt.controller';
import { AuthEntity } from './auth.entity';
import { TokenEntity } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secretkey'),
      }),
    }),
    TypeOrmModule.forFeature([AuthEntity, TokenEntity]),
  ],
  providers: [JwtHttpStrategy, AuthService, AuthRepository, TokenRepository],
  controllers: [AuthJwtController],
  exports: [AuthService],
})
export class AuthModule {}
