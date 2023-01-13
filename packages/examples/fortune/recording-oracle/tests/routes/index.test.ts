import server from '../../src/server';
import { describe, test, expect } from 'vitest';

describe('POST /', () => {
  test('Should return true', async () => {
    const response = await server.inject({
      method: 'POST',
      path: '/send-fortunes',
      payload: [{
        fortune: "tale",
        workerAddress: "0x0000000000000000000000000000000000000000",
        escrowAddress: "0x0000000000000000000000000000000000000000"
    }]
    });
    expect(response.statusCode).eq(200);
    expect(response.json()).deep.eq({ response: true });
  });
});
