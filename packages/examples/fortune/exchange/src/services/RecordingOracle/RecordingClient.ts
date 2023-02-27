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
    try {
        await axios.post(recordingOracleUrl, body)
    } catch (err: any) {
        if (err.response) {
            console.log(err.response.data.message);
            alert(err.response.data.message);
            return;
        }
    }

    alert('Fortune added successfully');
    return
}

export default sendFortune;