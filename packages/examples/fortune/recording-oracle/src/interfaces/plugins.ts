import { S3Client } from '../plugins/s3';
import { Storage } from '../plugins/storage';
import { Escrow } from '../plugins/escrow';
import { Uniqueness } from '../plugins/uniqueness';
import { Curses } from '../plugins/curses';
import Web3 from 'web3';

export interface IPlugin {
  web3: Web3[];
  s3: S3Client;
  storage: Storage;
  escrow: Escrow;
  curses: Curses;
  uniqueness: Uniqueness;
}
