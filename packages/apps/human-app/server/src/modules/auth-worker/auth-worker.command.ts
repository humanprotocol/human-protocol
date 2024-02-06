import { AutoMap } from '@automapper/classes';

enum WorkerType {
  WORKER = 'WORKER',
}

export class SignupWorkerCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  password: string;

  type: WorkerType;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.type = WorkerType.WORKER;
  }
}
