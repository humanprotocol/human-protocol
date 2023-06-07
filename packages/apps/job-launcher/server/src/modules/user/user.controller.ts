import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards';

import { UserService } from './user.service';
import { UserUpdateTokenAddressDto } from './user.dto';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(RolesGuard)
  @Post('/')
  public async updateTokenAddress(
    @Request() req: any,
    @Body() data: UserUpdateTokenAddressDto,
  ): Promise<any> {
    return this.userService.update(req.user?.id, data);
  }
}
