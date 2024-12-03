import { AutoMap } from '@automapper/classes';

export class DailyHmtSpentCommand {
  @AutoMap()
  siteKey: string;
}
export class DailyHmtSpentResponse {
  spend: number;
}
