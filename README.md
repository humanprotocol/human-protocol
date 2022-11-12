[![CI](https://github.com/humanprotocol/human-protocol/actions/workflows/ci.yaml/badge.svg)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci.yaml) [![CD](https://github.com/humanprotocol/human-protocol/actions/workflows/cd.yaml/badge.svg)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd.yaml)

<h2>**All work on-chain.**</h2>


Tokenized, verified, rewarded.

Join us on [Discord](https://discord.gg/TEspMGKF)

**What is the HUMAN Network?**

HUMAN is a permissionless protocol to facilitate the exchange of HUMAN work, knowledge, and contribution.  Using HUMAN, individuals, organizations or businesses can either create or complete tasks.  These are tasks that cannot typically be automated or completed by a machine.  The types of work that are currently being completed using the HUMAN Protocol are:



* [Data labeling](https://app.humanprotocol.org/) - HUMAN is currently being used to label raw image data which can subsequently be used to train Machine Learning algorithms.  Last month over 20 Million images were labeled by HUMAN workers: [HUMAN Escrow Scanner](https://dashboard.humanprotocol.org/)
* [IMOO](https://www.humanprotocol.org/imoo) - An on-chain oracle for decentralized prediction markets 
* [POH](https://www.humanprotocol.org/proof-of-humanity) - A system that brings bot-blocking applications on-chain (Not strictly work)
* …

**Documentation**

For a more detailed description of the HUMAN Protocol architecture and vision see [here](https://github.com/humanprotocol/.github/wiki)

**Description**

As part of our efforts to increase open source contributions we are proud to release the HUMAN SDK.  This SDK provides an easy and reliable software development kit for building applications that interact with the HUMAN Protocol.  It has been designed so that it can be extended to meet the requirements of a wide variety of blockchain application use-cases involving human work or contribution.  We have also included various example applications and reference implementations for the core infrastructure components that make up the HUMAN Protocol. \


**Contributing to this repository**

The contribution guidelines are as per the CONTRIBUTING.MD file.

**Project Structure**

```
~~ Main ~~
├── packages
│   ├── apps
	    ├── escrow-dashboard: A UI that queries The Graph for escrow data 
│   ├── core: EVM compatible smart contracts for HUMAN
│   ├── examples
	    ├── cvat: A UI that queries The Graph for escrow data
	    ├── fortune:  An example application that combines all the core 
                      components of HUMAN
	    ├── launcher: A reference implementation of a Job Launcher 
	    ├── oracles:  Reference implementations for Recording and Reputation
                      Oracles
│   ├── sdk: Python and Typescript libraries for building applications on
             HUMAN
```


**How To Use This Repo**

If you would like to join the HUMAN network as an operator please see the [examples](https://github.com/humanprotocol/human-protocol/tree/main/packages/examples) folder.  Users may participate as any of the following roles:  

[Job Launcher Operator](https://github.com/humanprotocol/human-protocol/tree/main/packages/examples/launcher) \
[Recording Oracle Operator](https://github.com/humanprotocol/human-protocol/tree/main/packages/examples/oracles/recording)

Exchange Oracle Operator

**Building New Applications for HUMAN**

If you are a developer and would like to build on top of HUMAN please see [examples](https://github.com/humanprotocol/human-protocol/tree/main/packages/examples) and [sdk](https://github.com/humanprotocol/human-protocol/tree/main/packages/sdk) folders.

**Usage and Installation**

Navigate to the folder that you would like to install and follow the instructions in the README.MD file
