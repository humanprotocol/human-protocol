import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { IUserBalance } from '../../common/interfaces';
import { JwtAuthGuard } from 'src/common/guards';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/balance')
  public async getBalance(@Request() req: any): Promise<IUserBalance> {
    try {
      return this.userService.getBalance(req.user?.id);
    } catch (e) {
      throw new Error(e);
    }
  }
}
