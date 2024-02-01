const fs = require('fs');
const path = require('path');

const abisDirectory = path.join(__dirname, './abis');

const removeDirIfEmpty = (dir) => {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rm(dir, { recursive: true }, (err) => {
      if (err) {
        console.error(`Error removing directory: ${dir}`, err);
      }
    });
  }
};

const moveAndRenameABIFiles = () => {
  try {
    if (!fs.existsSync(abisDirectory)) {
      console.error('ABI directory does not exist.');
      return;
    }

    fs.readdirSync(abisDirectory).forEach(contractDir => {
      const contractPath = path.join(abisDirectory, contractDir);

      if (fs.lstatSync(contractPath).isDirectory()) {
        fs.readdirSync(contractPath).forEach(file => {
          if (path.extname(file) === '.json') {
            const newAbiFilePath = path.join(abisDirectory, file);
            const abiFilePath = path.join(contractPath, file);
            fs.renameSync(abiFilePath, newAbiFilePath);
          }
        });

        removeDirIfEmpty(contractPath);
      }
    });
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

moveAndRenameABIFiles();
