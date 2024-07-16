"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowStatus = void 0;
/**
 * Enum for escrow statuses.
 * @readonly
 * @enum {number}
 */
var EscrowStatus;
(function (EscrowStatus) {
    /**
     * Escrow is launched.
     */
    EscrowStatus[EscrowStatus["Launched"] = 0] = "Launched";
    /**
     * Escrow is funded, and waiting for the results to be submitted.
     */
    EscrowStatus[EscrowStatus["Pending"] = 1] = "Pending";
    /**
     * Escrow is partially paid out.
     */
    EscrowStatus[EscrowStatus["Partial"] = 2] = "Partial";
    /**
     * Escrow is fully paid.
     */
    EscrowStatus[EscrowStatus["Paid"] = 3] = "Paid";
    /**
     * Escrow is finished..
     */
    EscrowStatus[EscrowStatus["Complete"] = 4] = "Complete";
    /**
     * Escrow is cancelled.
     */
    EscrowStatus[EscrowStatus["Cancelled"] = 5] = "Cancelled";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
