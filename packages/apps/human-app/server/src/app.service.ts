import { Injectable, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService) {
  }

  async proxy(@Req() req: Request, @Res() res: Response) {
    try {
      const method = req.method.toLowerCase();
      const baseUrl = this.configService.get<string>('REPUTATION_ORACLE_URL');
      const url = `${baseUrl}${req.url}`;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      };

      const options = {
        method,
        url,
        headers,
        data: req.body,
      };

      const response = await lastValueFrom(this.httpService.request(options));
      res.status(response.status).send(response.data);
    } catch (error) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else {
        res.status(500).send({
          source: 'human-app',
          message: 'Error occurred while redirecting request.'
        });
      }
    }
  }
}
