[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [interfaces](../README.md) / SubgraphOptions

# Interface: SubgraphOptions

Defined in: [interfaces.ts:319](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L319)

Configuration options for subgraph requests with retry logic.

## Properties

### baseDelay?

> `optional` **baseDelay**: `number`

Defined in: [interfaces.ts:323](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L323)

Base delay between retries in milliseconds

***

### indexerId?

> `optional` **indexerId**: `string`

Defined in: [interfaces.ts:328](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L328)

Optional indexer identifier. When provided, requests target
`{gateway}/deployments/id/<DEPLOYMENT_ID>/indexers/id/<INDEXER_ID>`.

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [interfaces.ts:321](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L321)

Maximum number of retry attempts
