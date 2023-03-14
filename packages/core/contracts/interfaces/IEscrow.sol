// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

interface IEscrow {
    enum EscrowStatuses {
        Launched,
        Exchanged,
        Recorded,
        Paid,
        Completed,
        Cancelled
    }

    function status() external view returns (EscrowStatuses);

    function exchange() external;

    function storeResults(
        address _worker,
        string memory _url,
        string memory _hash
    ) external;

    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        uint256 _txId
    ) external;

    function complete() external;

    function abort() external;

    function cancel() external;
}
