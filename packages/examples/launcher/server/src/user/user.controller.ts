import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../common/guards";
import { UserUpdateTokenAddressDto } from "./dto";

import { UserService } from "./user.service";

@ApiBearerAuth()
@ApiTags("User")
@Controller("/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(RolesGuard)
  @Post("/")
  public async updateTokenAddress(@Request() req: any, @Body() data: UserUpdateTokenAddressDto): Promise<any> {
    return this.userService.updateTokenAddress({ id: req.user?.id }, data);
  }
}
