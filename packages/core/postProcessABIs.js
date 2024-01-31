const fs = require('fs');
const path = require('path');

const abisDirectory = path.join(__dirname, './abis');

const removeDirIfEmpty = (dir) => {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`Removed directory: ${dir}`);
  }
};

const moveAndRenameABIFiles = () => {
  try {
    if (!fs.existsSync(abisDirectory)) {
      console.error('ABI directory does not exist.');
      return;
    }

    fs.readdirSync(abisDirectory).forEach(contractDir => {
      const contractName = contractDir.split('.')[0]; 
      const contractPath = path.join(abisDirectory, contractDir);
      const abiFilePath = path.join(contractPath, `${contractName}.json`);

      if (fs.lstatSync(contractPath).isDirectory() && fs.existsSync(abiFilePath)) {
        const newAbiFilePath = path.join(abisDirectory, `${contractName}.json`);
        console.log(`Moving ${abiFilePath} to ${newAbiFilePath}`);

        fs.renameSync(abiFilePath, newAbiFilePath);

        removeDirIfEmpty(contractPath);
      }
    });

    console.log('ABI file path changed');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

moveAndRenameABIFiles();
