import axios from 'axios';

const sendFortune = async (
    account: string,
    escrow: string,
    fortune: string,
    recordingOracleUrl: string
) => {
    const body = {
        workerAddress: account,
        escrowAddress: escrow,
        fortune
    };
    await axios.post(recordingOracleUrl, body);
    return;
}

export default sendFortune;