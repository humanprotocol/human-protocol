<p align="center">
<a href="https://www.humanprotocol.org/"><img src="https://user-images.githubusercontent.com/104898604/201488028-2b0f29cb-c620-484f-991f-4a8b16efd7cc.png" /></a></p>

| | | | |
| --- | --- | --- | --- |
| [![Lint Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-lint.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-lint.yaml) | [![Protocol Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml) | [![Python SDK Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-python-sdk.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-python-sdk.yaml) | [![Node.js SDK Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-node-sdk.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-node-sdk.yaml) |
| [![Subgraph Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-subgraph.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-subgraph.yaml) | [![Dashboard UI Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-dashboard-ui.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-dashboard-ui.yaml) | [![Faucet Server Check](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-faucet-server.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-faucet-server.yaml) | [![Contract Deploy](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-deploy-contracts.yaml/badge.svg?event=workflow_dispatch)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-deploy-contracts.yaml) |
| [![Core NPM Publish](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-core.yaml/badge.svg?event=release)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-core.yaml) | [![Python SDK Publish](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-python-sdk.yaml/badge.svg?event=release)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-python-sdk.yaml) | [![Node.js SDK Publish](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-node-sdk.yaml/badge.svg?event=release)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-node-sdk.yaml) | [![Subgraph Deploy](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-subgraph.yaml/badge.svg?branch=main)](https://github.com/humanprotocol/human-protocol/actions/workflows/cd-subgraph.yaml) |


## All work on-chain

Tokenized, verified, rewarded.

Join us on [Discord](http://hmt.ai/discord)

**What is the HUMAN Network?**

HUMAN is a permissionless protocol to facilitate the exchange of HUMAN work, knowledge, and contribution.  Using HUMAN, individuals, organizations or businesses can either create or complete tasks.  These are tasks that cannot typically be automated or completed by a machine.  The types of work that are currently being completed using the HUMAN Protocol are:

* [Data labeling](https://app.humanprotocol.org/) - HUMAN is currently being used to label raw image data which can subsequently be used to train Machine Learning algorithms.  Last month over 20 Million images were labeled by HUMAN workers: [HUMAN Escrow Scanner](https://dashboard.humanprotocol.org/)
* [IMOO](https://www.humanprotocol.org/imoo) - An on-chain oracle for decentralized prediction markets
* [POH](https://www.humanprotocol.org/proof-of-humanity) - A system that brings bot-blocking applications on-chain
* …

### Documentation

For a more detailed description of the HUMAN Protocol architecture and vision see [here](https://tech-docs.humanprotocol.org/)

### Description

As part of our efforts to increase open source contributions we have consolidated all our codebase into a single monorepo.  This monorepo provides an easy and reliable way to  build applications that interact with the HUMAN Protocol.  It has been designed so that it can be extended to meet the requirements of a wide variety of blockchain application use-cases involving human work or contribution.  We have also included various example applications and reference implementations for the core infrastructure components that make up the HUMAN Protocol.

### Contributing to this repository

The contribution guidelines are as per the CONTRIBUTING.MD file.

### Project Structure

```raw
├── packages
│   ├── apps
│   │   ├── dashboard
│   │   │   ├── ui                           # A UI that queries The Graph for escrow data
│   │   │   ├── admin                        # Dashboard content admin app
│   │   ├── faucet-server                    # Faucet server
│   │   ├── fortune                          # Fortune application
│   │   ├── job-launcher                     # Job launcher server, and UI
│   │   ├── human-app                        # Human App server
│   │   ├── reputation-oracle                # Reputation Oracle server
│   ├── core                                 # EVM compatible smart contracts for HUMAN
│   ├── examples
│   │   ├── cvat                             # An open source annotation tool for labeling video and images
│   ├── sdk
│   │   ├── python
│   │   │   ├── human-protocol-sdk           # Python SDK to interact with Human Protocol
│   │   ├── typescript
│   │   │   ├── human-protocol-sdk           # Node.js SDK to interact with Human Protocol
│   │   │   ├── subgraph                     # Human Protocol Subgraph
```
### Smart contracts
To access comprehensive information about the smart contracts, please visit the following URL: https://tech-docs.humanprotocol.org/contracts. This resource provides detailed documentation that covers various aspects of the smart contracts used within the Human Protocol ecosystem.

### How To Use This Repo

If you would like to join the HUMAN network as an operator please see the [apps](https://github.com/humanprotocol/human-protocol/tree/main/packages/apps) folder.  Users may participate as any of the following roles:

* [Job Launcher Operator](https://github.com/humanprotocol/human-protocol/tree/main/packages/apps/job-launcher)
* [Exchange Oracle Operator](https://github.com/humanprotocol/human-protocol/tree/main/packages/apps/fortune/exchange-oracle)
* [Recording Oracle Operator](https://github.com/humanprotocol/human-protocol/tree/main/packages/apps/fortune/recording-oracle)

#### Building New Applications for HUMAN

If you are a developer and would like to build on top of HUMAN please see [examples](https://github.com/humanprotocol/human-protocol/tree/main/packages/examples) and [sdk](https://github.com/humanprotocol/human-protocol/tree/main/packages/sdk) folders.

#### Usage and Installation

Navigate to the folder that you would like to install and follow the instructions in the README file

## LEGAL NOTICE

The Protocol is an open-source, blockchain-based network that organizes, evaluates, and compensates human labor (the “Protocol”).  Your use of the Protocol is entirely at your own risk. The Protocol is available on an “as is” basis without warranties of any kind, either express or implied, including, but not limited to, warranties of merchantability, title, fitness for a particular purpose and non-infringement. You assume all risks associated with using the Protocol, and digital assets   and   decentralized   systems   generally,   including   but   not
limited to, that: (a) digital assets are highly volatile; (b) using digital assets is inherently risky due to both features of such assets and the potential unauthorized acts of third parties; (c) you may not have ready access to digital assets; and (d) you may lose some or all of your tokens or other digital assets. You agree that you will have no recourse against anyone else for any losses due to the use of the Protocol. For example, these losses may arise from or relate to: (i) incorrect   information;   (ii)   software   or   network   failures;  (iii) corrupted digital wallet files; (iv) unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi) third-party activities. The Protocol does not collect any personal data, and your interaction with the Protocol will solely be through your public digital wallet address. Any personal or other data that you may make available in connection with the Protocol may not be private or secure.