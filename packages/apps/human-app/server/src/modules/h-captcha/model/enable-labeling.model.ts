import { AutoMap } from '@automapper/classes';

export class EnableLabelingCommand {
  @AutoMap()
  token: string;
}
export class EnableLabelingResponse {
  message: string;
}
