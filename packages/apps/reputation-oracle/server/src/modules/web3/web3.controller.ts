import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Web3Service } from './web3.service';
import { PrepareSignatureDto, SignatureBodyDto } from './web3.dto';

@ApiTags('Web3')
@Controller('/web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  @Public()
  @Post('/prepare-signature')
  @ApiOperation({
    summary: 'Web3 signature body',
    description:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms.',
  })
  @ApiBody({ type: PrepareSignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Typed structured data object generated successfully',
    type: SignatureBodyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async prepareSignature(
    @Body() data: PrepareSignatureDto,
  ): Promise<SignatureBodyDto> {
    return this.web3Service.prepareSignatureBody(data.type, data.address);
  }
}
