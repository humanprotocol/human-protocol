import { OperatorController } from '../operator.controller';
import { OperatorService } from '../operator.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OperatorProfile } from '../operator.mapper.profile';
import {
  SignupOperatorCommand,
  SignupOperatorDto,
} from '../model/operator-registration.model';
import { UserType } from '../../../common/enums/user';
import { operatorServiceMock } from './operator.service.mock';
import { SigninOperatorCommand } from '../model/operator-signin.model';

describe('OperatorController', () => {
  let controller: OperatorController;
  let workerService: OperatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperatorController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [OperatorService, OperatorProfile],
    })
      .overrideProvider(OperatorService)
      .useValue(operatorServiceMock)
      .compile();

    controller = module.get<OperatorController>(OperatorController);
    workerService = module.get<OperatorService>(OperatorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should worker service signup method with proper fields set', async () => {
      const dto: SignupOperatorDto = {
        address: '0x35d5511213a21f478e3e3f6f7e9d5f0f0e75e7b3',
        signature: '0x49506f2b430af3e3e3f6f7e9d5f0f0e75e7b3',
      };
      await controller.signupOperator(dto);
      const expectedCommand = {
        address: dto.address,
        signature: dto.signature,
        type: UserType.OPERATOR,
      } as SignupOperatorCommand;
      expect(workerService.signupOperator).toHaveBeenCalledWith(
        expectedCommand,
      );
    });
  });
  describe('signin', () => {
    it('should worker service signin method with proper fields set', async () => {
      const dto: SignupOperatorDto = {
        address: '0x35d5511213a21f478e3e3f6f7e9d5f0f0e75e7b3',
        signature: '0x49506f2b430af3e3e3f6f7e9d5f0f0e75e7b3',
      };
      await controller.signinOperator(dto);
      const expectedCommand = {
        address: dto.address,
        signature: dto.signature,
      } as SigninOperatorCommand;
      expect(workerService.signinOperator).toHaveBeenCalledWith(
        expectedCommand,
      );
    });
  });
});
