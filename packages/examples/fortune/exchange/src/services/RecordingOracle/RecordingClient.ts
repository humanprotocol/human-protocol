import axios from 'axios';

const sendFortune = async (
  escrow: string,
  fortune: string,
  recordingOracleUrl: string,
  workerAddress: string
) => {
  const body = {
    workerAddress,
    escrowAddress: escrow,
    fortune,
  };
  await axios.post(recordingOracleUrl, body);
  return;
};

export default sendFortune;
