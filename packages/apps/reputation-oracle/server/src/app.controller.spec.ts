import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('Health Check', () => {
    it('should return OK', async () => {
      expect(await appController.health()).toBe('OK');
    });
  });
});
