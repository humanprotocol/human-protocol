// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

interface IEscrow {
    enum EscrowStatuses {
        Launched,
        Exchanged,
        Recorded,
        Completed,
        Cancelled
    }

    struct OracleWithFee {
        address oracle;
        uint256 feePercentage;
    }

    function status() external view returns (EscrowStatuses);

    function exchange(string memory _url, string memory _hash) external;

    function record(string memory _url, string memory _hash) external;

    function bulkPayOut(
        uint256 _txId,
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external;

    function cancel() external;
}
