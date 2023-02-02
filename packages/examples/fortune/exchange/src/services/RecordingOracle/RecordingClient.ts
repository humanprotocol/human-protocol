import axios from 'axios';

const sendFortune = async (
  escrow: string,
  fortune: string,
  recordingOracleUrl: string,
  workerAddress: string,
  chainId: number
) => {
  const body = {
    workerAddress,
    escrowAddress: escrow,
    fortune,
    chainId,
  };
  await axios.post(recordingOracleUrl, body);
  return;
};

export default sendFortune;
