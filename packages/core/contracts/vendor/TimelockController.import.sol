// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// This file intentionally imports the non-upgradeable OZ Timelock so Hardhat compiles it
// and TypeChain generates typings + artifacts for tests.
import '@openzeppelin/contracts/governance/TimelockController.sol';
