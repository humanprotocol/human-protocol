import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "@/common/decorators";

@Controller("/")
@ApiTags("Main")
export class AppController {
  @Public()
  @Get("/")
  public health(): string {
    return "OK";
  }
}
