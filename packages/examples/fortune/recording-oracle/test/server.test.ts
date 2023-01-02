// Integration test
async function startServer() {
  const app = new Application();

  const router = new Router();
  router.post("/job/results", jobResults);
  app.use(cors());
  app.use(router.routes());
  app.use(router.allowedMethods());

  console.log("Listening on port 3005...");
  return app.listen({ port: 3005 });
}

//This test will send a POST request with a valid worker address, a valid escrow address, and a fortune. 
// It expects the server to return a 201 Created response.

Deno.test("POST /job/results with a valid worker address, a valid escrow address, and a fortune returns a 201 response", async () => {
  // arrange
  const body = {
    workerAddress: "0x1234abcd",
    escrowAddress: "0xabcd1234",
    fortune: "The fortune is good",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });

  // assert
  assertEquals(response.status, 201);

  // cleanup
  server.close();
});


// The second test will send a POST request with an invalid worker address, a valid escrow address, and a fortune. 
// It expects the server to return a 400 Bad Request response with an error message

Deno.test("POST /job/results with an invalid worker address, a valid escrow address, and a fortune returns a 400 response", async () => {
  // arrange
  const body = {
    workerAddress: "invalid",
    escrowAddress: "0xabcd1234",
    fortune: "The fortune is good",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });
  const result = await response.json();

  // assert
  assertEquals(response.status, 400);
  assertEquals(result.field, "workerAddress");
  assertEquals(result.message, "Valid ethereum address required");

  server.close();
});


// The third test will send a POST request with a valid worker address, an invalid escrow address, and a fortune. 
// It expects the server to return a 400 Bad Request response with an error message.

Deno.test("POST /job/results with a valid worker address, an invalid escrow address, and a fortune returns a 400 response", async () => {
  // arrange
  const body = {
    workerAddress: "0x1234abcd",
    escrowAddress: "invalid",
    fortune: "The fortune is good",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });
  const result = await response.json();

  // assert
  assertEquals(response.status, 400);
  assertEquals(result.field, "escrowAddress");
  assertEquals(result.message, "Valid ethereum address required");

  server.close();
});


// The fourth test will send a POST request with a valid worker address, a valid escrow address, and an empty fortune. 
// It expects the server to return a 400 Bad Request response with an error message.

Deno.test("POST /job/results with a valid worker address, a valid escrow address, and an empty fortune returns a 400 response", async () => {
  // arrange
  const body = {
    workerAddress: "0x1234abcd",
    escrowAddress: "0xabcd1234",
    fortune: "",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });
  const result = await response.json();

  // assert
  assertEquals(response.status, 400);
  assertEquals(result.field, "fortune");
  assertEquals(result.message, "Non-empty fortune is required");

  server.close();
});


// The fifth test will send a POST request with a valid worker address, a valid escrow address, and a fortune. 
// The Escrow contract for this escrow address is not in the Pending status. It expects the server to return a 400 Bad Request response with an error message.

Deno.test("POST /job/results with a valid worker address, a valid escrow address, and a fortune when the escrow is not in the Pending status returns a 400 response", async () => {
  // arrange
  const body = {
    workerAddress: "0x1234abcd",
    escrowAddress: "0xabcd1234",
    fortune: "The fortune is good",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });
  const result = await response.json();

  // assert
  assertEquals(response.status, 400);
  assertEquals(result.field, "escrowAddress");
  assertEquals(result.message, "The Escrow is not in the Pending status");

  server.close();
});


// The sixth test will send a POST request with a valid worker address, a valid escrow address, and a fortune. 
// The Escrow contract for this escrow address has already received the maximum number of fortunes. It expects the server to return a 201 Created response and make a POST request to the reputationOracleUrl with the escrowAddress and the fortunes.

Deno.test("POST /job/results with a valid worker address, a valid escrow address, and a fortune when the escrow has received the maximum number of fortunes returns a 201 response and makes a POST request to the reputation oracle", async () => {
  // arrange
  const body = {
    workerAddress: "0x1234abcd",
    escrowAddress: "0xabcd1234",
    fortune: "The fortune is good",
  };
  const bodyString = encode(body);

  // act
  const server = await startServer();
  const response = await fetch("http://localhost:3005/job/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
  });

  // assert
  assertEquals(response.status, 201);

  server.close();
});
