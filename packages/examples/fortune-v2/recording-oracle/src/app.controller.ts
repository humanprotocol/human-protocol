import { Controller, Get, Redirect } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "@/common/decorators";

@Controller("/")
@ApiTags("Main")
export class AppController {
  @Public()
  @Get("/")
  @Redirect("/swagger", 301)
  public redirect(): void {}
}
