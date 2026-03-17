/**
 * Type representing the data type of a message.
 * It can be either a string or a Uint8Array.
 *
 * @public
 */
export type MessageDataType = string | Uint8Array;

export function makeMessageDataBinary(message: MessageDataType): Uint8Array {
  if (typeof message === 'string') {
    return Buffer.from(message);
  }

  return message;
}
