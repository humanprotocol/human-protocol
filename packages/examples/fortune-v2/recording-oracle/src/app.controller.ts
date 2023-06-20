import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "@/common/decorators";

@Controller("/")
export class AppController {
  @Public()
  @Get("/")
  @ApiTags("Health Check")
  public health(): string {
    return "OK";
  }
}
