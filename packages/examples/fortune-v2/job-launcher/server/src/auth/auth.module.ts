import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserModule } from "../user/user.module";
import { TokenModule } from "../token/token.module";
import { JwtHttpStrategy } from "./strategy";
import { AuthService } from "./auth.service";
import { AuthJwtController } from "./auth.jwt.controller";
import { AuthEntity } from "./auth.entity";

@Module({
  imports: [
    UserModule,
    ConfigModule,
    TokenModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET", "secretkey"),
      }),
    }),
    TypeOrmModule.forFeature([AuthEntity]),
  ],
  providers: [JwtHttpStrategy, AuthService],
  controllers: [AuthJwtController],
  exports: [AuthService],
})
export class AuthModule {}
