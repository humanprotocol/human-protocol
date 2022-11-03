import Web3 from 'web3';

let web3;


export default function getWeb3() {
    web3 = new Web3(window.ethereum);

    return web3;
}
