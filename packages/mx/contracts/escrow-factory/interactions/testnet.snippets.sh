WALLET_PEM="~/erd-wallets/TestShard1.pem"
PROXY="https://testnet-gateway.elrond.com"
CHAIN_ID="T"

# UPDATE THIS AFTER EACH DEPLOY
CONTRACT_ADDRESS="erd1qqqqqqqqqqqqqpgqcwpdzh0v8ard0c2rrn9k6sg33fuymfr2l8ksxkteux"

deploy() {
    mxpy --verbose contract deploy --recall-nonce \
        --metadata-payable \
        --pem=${WALLET_PEM} \
        --gas-limit=100000000 \
        --proxy=${PROXY} --chain=${CHAIN_ID} \
        --bytecode="output/escrow-factory.wasm" \
        --outfile="deploy.interaction.json" --send || return
}

upgrade() {
    mxpy --verbose contract upgrade ${CONTRACT_ADDRESS} --recall-nonce \
        --metadata-payable \
        --pem=${WALLET_PEM} \
        --gas-limit=100000000 \
        --proxy=${PROXY} --chain=${CHAIN_ID} \
        --bytecode="output/escrow-factory.wasm" \
        --outfile="deploy.interaction.json" --send || return
}

setTemplateAddress() {
    template_contract_address=$1
    mxpy --verbose contract call ${CONTRACT_ADDRESS} --recall-nonce \
        --pem=${WALLET_PEM} \
        --gas-limit=10000000 \
        --proxy=${PROXY} --chain=${CHAIN_ID} \
        --function=setTemplateAddress \
        --arguments $template_contract_address \
        --send || return
}

setToken() {
    token_id=str:$1
    mxpy --verbose contract call ${CONTRACT_ADDRESS} --recall-nonce \
        --pem=${WALLET_PEM} \
        --gas-limit=10000000 \
        --proxy=${PROXY} --chain=${CHAIN_ID} \
        --function=setToken \
        --arguments $token_id \
        --send || return
}