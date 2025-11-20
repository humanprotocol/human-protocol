import logger from '../src';

void (async () => {
  try {
    await fetch('https://httpbin.org/delay/5', {
      signal: AbortSignal.timeout(0),
    });
  } catch (error) {
    logger.error('Failed to fetch', error);
  }
})();
