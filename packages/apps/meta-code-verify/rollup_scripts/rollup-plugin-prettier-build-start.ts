import { exec } from 'child_process';
class ExecError extends Error {
  public stdout: string;
  public stderr: string;

  constructor(message: string, stdout: string, stderr: string) {
    super(message);
    this.stdout = stdout;
    this.stderr = stderr;
  }
}
function genExec(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      const customError = new ExecError(error?.message, stdout, stderr);
      if (error) {
        customError.stdout = stdout;
        customError.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

const filesToFormat = new Set();

export default function rollupPrettierBuildStartPlugin(files) {
  filesToFormat.add(files);
  return {
    name: 'rollup-plugin-prettier-src-formatter',

    async buildStart(_options) {
      if (filesToFormat.size === 0) {
        return;
      }
      console.log('Running prettier for', Array.from(filesToFormat).join(' '));
      await genExec(
        `yarn run prettier ${Array.from(filesToFormat).join(' ')} --write`
      );
      filesToFormat.clear();
    },

    watchChange(_id, _change) {
      filesToFormat.add(files);
    },
  };
}
