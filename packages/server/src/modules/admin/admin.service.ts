import { Injectable } from '@nestjs/common';
import * as DappLib from '@decentology/dappstarter-dapplib';


@Injectable()
export class AdminService {

  async sample(greeting: string): Promise<any> {
    return `API admin ${greeting}!`;
  }



}
