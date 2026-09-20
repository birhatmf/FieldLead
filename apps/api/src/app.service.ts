import { Injectable } from '@nestjs/common';

export interface ServiceInfo {
  name: string;
  version: string;
  status: 'ok';
}

@Injectable()
export class AppService {
  getInfo(): ServiceInfo {
    return {
      name: 'FieldLead API',
      version: '0.1.0',
      status: 'ok',
    };
  }
}
