import { Injectable } from '@nestjs/common';
import * as DappLib from '@decentology/dappstarter-dapplib';


@Injectable()
export class DappService {

  async sample(greeting: string): Promise<any> {
    return `API dapp ${greeting}!`;
  }


async isContractRunStateActive() : Promise<any> {
   return await DappLib.isContractRunStateActive();
 }


}
