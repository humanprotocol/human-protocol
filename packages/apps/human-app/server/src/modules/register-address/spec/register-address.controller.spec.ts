import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { HttpService } from '@nestjs/axios';
import { RegisterAddressController } from '../register-address.controller';
import { RegisterAddressService } from '../register-address.service';
import { registerAddressServiceMock } from './register-address.service.mock';
import {
  REGISTER_ADDRESS_TOKEN,
  registerAddressCommandFixture,
  registerAddressDtoFixture,
  registerAddressResponseFixture,
} from './register-address.fixtures';
import { RegisterAddressProfile } from '../register-address.mapper.profile';

describe('RegisterAddressController', () => {
  let controller: RegisterAddressController;
  let service: RegisterAddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterAddressController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        RegisterAddressService,
        RegisterAddressProfile,
        {
          provide: HttpService,
          useValue: {
            request: jest
              .fn()
              .mockImplementation(() =>
                Promise.resolve({ data: registerAddressResponseFixture }),
              ),
          },
        },
      ],
    })
      .overrideProvider(RegisterAddressService)
      .useValue(registerAddressServiceMock)
      .compile();

    controller = module.get<RegisterAddressController>(
      RegisterAddressController,
    );
    service = module.get<RegisterAddressService>(RegisterAddressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerAddress', () => {
    it('should call service registerBlockchainAddress method with proper fields set', async () => {
      const dto = registerAddressDtoFixture;
      const command = registerAddressCommandFixture;
      await controller.registerAddress(dto, REGISTER_ADDRESS_TOKEN);
      expect(service.registerBlockchainAddress).toHaveBeenCalledWith(command);
    });
  });
});
