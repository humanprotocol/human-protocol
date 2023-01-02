import { Response } from "https://deno.land/std@0.167.0/http/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { type IBodyParserOptions } from "https://deno.land/x/body_parser@v0.0.1/mod.ts";
import {JsonBodyParser, BodyParser } from "https://deno.land/x/body_parser/mod.ts";
import { serveDir } from "https://deno.land/std@0.167.0/http/file_server.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import Web3 from 'https://deno.land/x/web3/mod.ts'
import * as EscrowABI from "./contracts/EscrowAbi.json" assert {type: 'json'};
import { convertUrl } from "./utils.ts";
import { statusesMap } from "./constants.ts";
import * as storage from "./storage.ts";





const privKey = Deno.env.get("ETH_PRIVATE_KEY") || "486a0621e595dd7fcbe5608cbbeec8f5a8b5cabe7637f11eccfc7acd408c3a0e";
const ethHttpServer = Deno.env.get("ETH_HTTP_SERVER") || "http://localhost:8547";
const port = Number(Deno.env.get("PORT")) || 3005;

const app = new Application();

const web3 = new Web3(ethHttpServer);
const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const router = new Router();

router.post(
  "/job/results",
  async (context: any) => {
    try {
      const { workerAddress, escrowAddress, fortune } = context.request.body;

      if (!web3.utils.isAddress(workerAddress)) {
        return context.response.status = 400,
          context.response.body = {
            field: "workerAddress",
            message: "Valid ethereum address required",
          };
      }

      if (!fortune) {
        return context.response.status = 400,
          context.response.body = {
            field: "fortune",
            message: "Non-empty fortune is required",
          };
      }

      if (!web3.utils.isAddress(escrowAddress)) {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAddress",
            message: "Valid ethereum address required",
          };
      }

      const Escrow = new web3.eth.Contract(EscrowABI, escrowAddress);
      const escrowRecOracleAddr = await Escrow.methods
        .recordingOracle()
        .call({ from: account.address });

      if (
        web3.utils.toChecksumAddress(escrowRecOracleAddr) !==
        web3.utils.toChecksumAddress(account.address)
      ) {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAddress",
            message:
              "The Escrow Recording Oracle address mismatches the current one",
          };
      }

      const escrowStatus = await Escrow.methods.status.call({ from: account.address });

      if (statusesMap[escrowStatus] !== "Pending") {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAdderss",
            message: "The Escrow is not in the Pending status",
          };
      }

      const manifestUrl = await Escrow.methods.manifestUrl().call({ from: account.address });
      const manifestResponse = await axios.get(convertUrl(manifestUrl));
      const {
        fortunes_requested: fortunesRequested,
        reputation_oracle_url: reputationOracleUrl,
      } = manifestResponse.data;

      if (!storage.getEscrow(escrowAddress)) {
        storage.newEscrow(escrowAddress);
      }

      const workerPreviousResult = storage.getWorkerResult(
        escrowAddress,
        workerAddress,
      );

      if (workerPreviousResult) {
        return context.response.status = 400,
          context.response.body = {
            message: `${workerAddress} already submitted a fortune`,
          };
      }

      storage.putFortune(escrowAddress, workerAddress, fortune);
      const fortunes = storage.getFortunes(escrowAddress);

      if (fortunes.length === fortunesRequested) {
        console.log("Doing bulk payouts");
        // a cron job might check how much annotations are in work
        // if this is full - then just push them to the reputation oracle

        await axios.post(convertUrl(reputationOracleUrl), {
          escrowAddress,
          fortunes,
        });
        storage.cleanFortunes(escrowAddress);
      }

      context.response.status = 201;
      context.response.body = "";
    } catch (err) {
      console.error(err);
      context.response.status = 500;
      context.response.body = {
        message: err.message,
      };
    }
  },
);

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
serveDir(new Request("http://localhost/static/./index.html"), {
   fsRoot: "src",
   urlRoot: "static",
  });
console.log(`Listening on port ${port}...`);
await app.listen({ port });

