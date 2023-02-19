WALLET_PEM="~/erd-wallets/TestShard1.pem"
PROXY="https://testnet-gateway.elrond.com"
CHAIN_ID="T"

# UPDATE THIS AFTER EACH DEPLOY
CONTRACT_ADDRESS="erd1qqqqqqqqqqqqqpgq0dfepua9xjgwtgck6ukrpzvuy75y9ddk6u7s4gn4dv"

RECORDING_ORALCE="erd1w73dll00g2q96rqvj7gms00uey5s94z9fqjjj9ecgx2tpeyh8hxqpzgryr"
REPUTATION_ORACLE="erd17rw0ugxew767mwluxwu75gqg3m500qu7ktxfufn8tsf5dxxh6dds3nyt8w"

deploy() {
    token_id=str:HMT-bd533a
    canceler=$(mxpy wallet pem-address ${WALLET_PEM})
    duration=2629743
    mxpy --verbose contract deploy --recall-nonce \
        --metadata-payable \
        --pem=${WALLET_PEM} \
        --gas-limit=100000000 \
        --proxy=${PROXY} --chain=${CHAIN_ID} \
        --bytecode="output/escrow.wasm" \
        --arguments $token_id $canceler $duration $RECORDING_ORALCE $REPUTATION_ORACLE \
        --outfile="deploy.interaction.json" --send || return
}
