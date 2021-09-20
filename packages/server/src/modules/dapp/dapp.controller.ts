import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DappService } from './dapp.service';


@ApiTags('Dapp')
@Controller('api')
export class DappController {

  constructor(private readonly dappService: DappService) { }


 @Get('isContractRunStateActive')
 @ApiOperation({ summary: 'Get contract run-state' })
 async isContractRunStateActive(): Promise<string> {
   return this.dappService.isContractRunStateActive();
 }


 @Get('sample')
 @ApiOperation({ summary: 'Sample API end-point' })
 async sample(@Query('greeting') greeting: string): Promise<string> {
   return await this.dappService.sample(greeting);
 }
  
}
