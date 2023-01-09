// deno-lint-ignore-file no-deprecated-deno-api

import Web3 from "https://deno.land/x/web3@v0.11.1/mod.ts";
import { serve } from "https://deno.land/std@0.106.0/http/server.ts";
import { addFortune } from './services/fortune.ts';




const privKey = Deno.env.get("ETH_PRIVATE_KEY") || "486a0621e595dd7fcbe5608cbbeec8f5a8b5cabe7637f11eccfc7acd408c3a0e";
const ethHttpServer = Deno.env.get("ETH_HTTP_SERVER") || "http://localhost:8547";
const port = Number(Deno.env.get("PORT")) || 3005;
const web3 = new Web3(ethHttpServer);
const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;


const server = serve({ port });

for await (const req of server) {
  if (req.method === "POST" && req.url === "/job/results") {
    try {
      const body = await Deno.readAll(req.body);
      const data = JSON.parse(new TextDecoder().decode(body));
      const { workerAddress, escrowAddress, fortune } = data;
      console.log(`workerAddress: ${workerAddress}`);
      console.log(`escrowAddress: ${escrowAddress}`);
      console.log(`fortune: ${fortune}`);
      const err = await addFortune(web3, workerAddress, escrowAddress, fortune);
      if (err) {
        console.log(err.message);
        req.respond({ status: 400, body: err.message });
      } else {
        req.respond({ status: 201 });
      }
    } catch (err) {
      console.error(err);
      req.respond({ status: 500, body: err.message });
    }
  }
}

console.log(`Recording Database server listening on port ${port}`);