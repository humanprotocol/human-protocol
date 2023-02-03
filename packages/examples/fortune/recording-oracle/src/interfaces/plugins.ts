import { S3Client } from "../plugins/s3";
import { IWeb3MultiNetwork } from "./networks";
import { Storage } from "../plugins/storage";
import { Escrow } from "../plugins/escrow";
import { Uniqueness } from "../plugins/uniqueness";
import { Curses } from "../plugins/curses";

export interface IPlugin {
    web3: IWeb3MultiNetwork,
    s3: S3Client,
    storage: Storage
    escrow: Escrow
    curses: Curses,
    uniqueness: Uniqueness
}