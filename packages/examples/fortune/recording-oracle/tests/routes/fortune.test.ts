import { describe, test, expect } from 'vitest';
import getServer from '../../src/server.js';

describe('Escrow route tests', async () => {
  const server = await getServer();

  test('Should not allow to send fortune', async () => {
    const response = await server.inject({
      method: 'POST',
      path: '/send-fortunes',
      payload: {},
    });

    expect(response.statusCode).eq(400);
  });
});
