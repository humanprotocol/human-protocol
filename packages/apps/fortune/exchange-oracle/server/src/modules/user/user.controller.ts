import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';

@ApiTags('User')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  @Post('registration')
  @ApiOperation({
    summary: 'Register a user in Exchange Oracle',
    description: 'Endpoint to register a user in Exchange Oracle.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment stats retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  async userRegistration(): Promise<void> {
    return;
  }
}
