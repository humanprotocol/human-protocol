// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

interface IEscrow {
    enum EscrowStatuses {
        Launched,
        Pending,
        Partial,
        Paid,
        Complete,
        Cancelled
    }

    function addTrustedHandlers(address[] memory _handlers) external;

    function setup(
        address _reputationOracle,
        address _recordingOracle,
        uint256 _reputationOracleStake,
        uint256 _recordingOracleStake,
        string memory _url,
        string memory _hash
    ) external;

    function abort() external;

    function cancel() external returns (bool);

    function complete() external;

    function storeResults(string memory _url, string memory _hash) external;

    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId
    ) external returns (bool);

    function getStatus() external view returns (EscrowStatuses);
}
