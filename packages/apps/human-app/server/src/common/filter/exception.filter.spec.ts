import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionFilter } from './exceptions.filter';
import { Test, TestingModule } from '@nestjs/testing';

describe('ExceptionFilter', () => {
  let filter: ExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;
  let mockArgumentsHost: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionFilter],
    }).compile();
    filter = module.get<ExceptionFilter>(ExceptionFilter);
    mockJson = jest.fn();
    mockStatus = jest.fn().mockImplementation(() => ({
      json: mockJson,
    }));
    mockGetResponse = jest.fn().mockImplementation(() => ({
      status: mockStatus,
      removeHeader: jest.fn(),
    }));
    mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
      getResponse: mockGetResponse,
      getRequest: jest.fn(),
    }));

    mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });
  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    filter.catch(
      new HttpException('Http exception', HttpStatus.BAD_REQUEST),
      mockArgumentsHost,
    );
    expect(mockHttpArgumentsHost).toHaveBeenCalledTimes(1);
    expect(mockHttpArgumentsHost).toHaveBeenCalledWith();
    expect(mockGetResponse).toHaveBeenCalledTimes(1);
    expect(mockGetResponse).toHaveBeenCalledWith();
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(mockJson).toHaveBeenCalledWith('Http exception');
  });
});
