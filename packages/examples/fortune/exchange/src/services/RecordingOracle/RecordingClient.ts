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
  const url = recordingOracleUrl.replace(/\/+$/, '');
  await axios.post(`${url}/send-fortunes`, body);
  return;
};

export default sendFortune;
