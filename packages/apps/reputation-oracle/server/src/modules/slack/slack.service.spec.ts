// import { Test } from '@nestjs/testing';
// import { SlackService } from './slack.service';
// import { HttpService } from '@nestjs/axios';
// import { SlackConfigService } from '../../config/slack-config.service';
// import { AbuseRepository } from '../abuse/abuse.repository';
// import { of } from 'rxjs';

// describe('SlackService', () => {
//   let slackService: SlackService;
//   let abuseRepository: AbuseRepository;

//   beforeAll(async () => {
//     const moduleRef = await Test.createTestingModule({
//       providers: [
//         SlackService,
//         {
//           provide: HttpService,
//           useValue: {
//             post: jest.fn().mockReturnValue(of({ data: { ok: true } })),
//           },
//         },
//         {
//           provide: SlackConfigService,
//           useValue: { webhookUrl: 'http://example.com', oauthToken: 'token' },
//         },
//         {
//           provide: AbuseRepository,
//           useValue: { findOneByChainIdAndEscrowAddress: jest.fn() },
//         },
//       ],
//     }).compile();

//     slackService = moduleRef.get<SlackService>(SlackService);
//     abuseRepository = moduleRef.get<AbuseRepository>(AbuseRepository);
//   });

// });
