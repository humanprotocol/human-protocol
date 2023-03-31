import { Preprocess } from '../src/preprocess';

it('Preprocess Test', () => {
  const config = {};

  const p: Preprocess = {
    pipeline: 'FaceBlurPipeline',
    config,
  };

  expect(p.pipeline).toBe('FaceBlurPipeline');
  expect(p.config).toBe(config);
});
