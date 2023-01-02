import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import * as storage from "../src/storage.ts";

Deno.test("getEscrow returns null if the escrow address is not found in the bucket", () => {
  const result = storage.getEscrow("0xabcd1234");
  assertEquals(result, null);
});

Deno.test("newEscrow creates a new file in the bucket for the escrow address with an empty fortunes and workers array", async () => {
  await storage.newEscrow("0xabcd1234");
  const result = storage.getEscrow("0xabcd1234");
  assertEquals(result, { fortunes: [], workers: [] });
});

Deno.test("getWorkerResult returns null if the worker address is not found in the bucket for the given escrow address", () => {
  const result = storage.getWorkerResult("0xabcd1234", "0x1234abcd");
  assertEquals(result, null);
});

Deno.test("putFortune adds the worker address and the fortune to the bucket for the given escrow address", async () => {
  await storage.putFortune("0xabcd1234", "0x1234abcd", "The fortune is good");
  const result = storage.getWorkerResult("0xabcd1234", "0x1234abcd");
  assertEquals(result, "The fortune is good");
});

Deno.test("getFortunes returns an array of all fortunes in the bucket for the given escrow address", async () => {
  await storage.putFortune("0xabcd1234", "0x1234abcd", "The fortune is good");
  await storage.putFortune("0xabcd1234", "0xabcd1234", "The fortune is bad");
  const result = storage.getFortunes("0xabcd1234");
  assertEquals(result, ["The fortune is good", "The fortune is bad"]);
});

Deno.test("cleanFortunes clears the fortunes and workers arrays in the bucket for the given escrow address", async () => {
  await storage.putFortune("0xabcd1234", "0x1234abcd", "The fortune is good");
  await storage.putFortune("0xabcd1234", "0xabcd1234", "The fortune is bad");
  await storage.cleanFortunes("0xabcd1234");
  const result = storage.getEscrow("0xabcd1234");
  assertEquals(result, { fortunes: [], workers: [] });
});
