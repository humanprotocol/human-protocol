export function buildNetworksFromEnv() {
    const networks = {};

    for (const key in process.env) {
        if (key.startsWith('NETWORK_')) {
            const [networkName, ...keyParts] = key.replace('NETWORK_', '').split('_');
            const keyType = keyParts.join('_');

            if (!networks[networkName]) {
                networks[networkName] = {};
            }

            const formattedKey = keyType.toLowerCase();
            networks[networkName][formattedKey] =  process.env[key];
        }
    }

    return networks;
}
