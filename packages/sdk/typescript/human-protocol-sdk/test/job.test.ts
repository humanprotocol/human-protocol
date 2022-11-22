import Job from '../src/job';

describe('Job', () => {
  it('Should create a new job', async () => {
    const job = new Job({
      network: 'localhost',
      privateKey: 'xx',
      hmTokenAddr: 'xx',
    });
  });
});
