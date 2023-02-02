import { S3Client } from "../plugins/s3.js";
import { IWeb3MultiNetwork } from "./networks.js";
import { Storage } from "../plugins/storage.js";
import { Escrow } from "../plugins/escrow.js";
import BadWordsFilter from "bad-words";
import { Uniqueness } from "plugins/uniqueness.js";
import { Curses } from "plugins/curses.js";

export interface IPlugin {
    web3: IWeb3MultiNetwork,
    s3: S3Client,
    storage: Storage
    escrow: Escrow
    curses: Curses,
    uniqueness: Uniqueness
}