const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
    sort(tests) {
      const copyTests = Array.from(tests);
      return [...tests].sort((a, b) => (a.path > b.path ? 1 : -1));
    }
  }

  module.exports = CustomSequencer;