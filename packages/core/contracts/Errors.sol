pragma solidity ^0.8.9;

contract Errors {

     /// CUSTOM ERRORS ///
    error AlreadyProcessed();

    error RelayerOnly();

    error OnlySpokeMessages();

    error CrossChainProposeOnly();

    error InitDone();

    error AlreadyInitialized();

    error OnlyRelayerAllowed();

    error OnlySpokeAllowed();

    error CollectionStarted();

    error PeriodNotOver();

    error CollectionUnfinished();

}