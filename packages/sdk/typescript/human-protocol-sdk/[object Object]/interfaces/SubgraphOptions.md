Configuration options for subgraph requests with retry logic.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="maxretries"></a> `maxRetries?` | `number` | Maximum number of retry attempts |
| <a id="basedelay"></a> `baseDelay?` | `number` | Base delay between retries in milliseconds |
| <a id="indexerid"></a> `indexerId?` | `string` | Optional indexer identifier. When provided, requests target `{gateway}/deployments/id/<DEPLOYMENT_ID>/indexers/id/<INDEXER_ID>`. |
