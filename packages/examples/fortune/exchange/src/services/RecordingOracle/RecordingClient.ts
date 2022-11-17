import axios from 'axios';
import getWeb3 from '../../utils/web3';

const web3 = getWeb3();

const sendFortune = async ( escrow: string, fortune: string, recordingOracleUrl: string) => {
    const account = (await web3.eth.getAccounts())[0];
    const body = {
        workerAddress: account,
        escrowAddress: escrow,
        fortune
    };
    await axios.post(recordingOracleUrl, body);
    return;
}

export default sendFortune;