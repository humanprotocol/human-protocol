// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IEscrow {
    enum EscrowStatuses {
        Launched,
        Pending,
        Partial,
        Paid,
        Complete,
        Cancelled
    }

    function status() external view returns (EscrowStatuses);

    function setup(
        address _reputationOracle,
        address _recordingOracle,
        address _exchangeOracle,
        uint8 _reputationOracleFeePercentage,
        uint8 _recordingOracleFeePercentage,
        uint8 _exchangeOracleFeePercentage,
        string calldata _url,
        string calldata _hash
    ) external;

    function cancel() external returns (bool);

    function withdraw(address _token) external returns (bool);

    function complete() external;

    function storeResults(string calldata _url, string calldata _hash) external;

    function bulkPayOut(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _url,
        string calldata _hash,
        uint256 _txId,
        bool forceComplete
    ) external;

    function bulkPayOut(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _url,
        string calldata _hash,
        uint256 _txId
    ) external;
}
