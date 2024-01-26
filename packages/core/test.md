1. Can we use viaIR with foundry?

Contracts are compuling with viaIR using Foundry. 
You specify via-ir=true in Foundry.toml

2. If we start using viaIR, can we still upgrade deployed proxies?

Contracts were upgraded using viaIR in fact using Foundry. 


3. If we use viaIR, how will it affect to the gas cost?

Using viaIR, gas cost decreased slightly. 
Use : forge snapshot --diff with and without via-ir=true in Foundry.toml


4. If we move to Foundry, can we still upgrade deployed proxies?

Yes, deployed proxies were upgraded using Foundry. 