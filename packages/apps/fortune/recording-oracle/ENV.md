# Environment Variables

### RPC_URL_POLYGON
The RPC URL for the Polygon network.
Required

### RPC_URL_POLYGON_AMOY
The RPC URL for the Polygon Amoy network.
Required

### RPC_URL_SEPOLIA
The RPC URL for the Sepolia network.
Required

### RPC_URL_BSC_MAINNET
The RPC URL for the BSC Mainnet network.
Required

### RPC_URL_BSC_TESTNET
The RPC URL for the BSC Testnet network.
Required

### RPC_URL_MOONBEAM
The RPC URL for the Moonbeam network.
Required

### RPC_URL_LOCALHOST
The RPC URL for the Localhost network.
Required

### PGP_ENCRYPT
Indicates whether PGP encryption should be used.
Default: false

### PGP_PRIVATE_KEY
The private key used for PGP encryption or decryption.
Required

### PGP_PASSPHRASE
The passphrase associated with the PGP private key.
Required

### S3_ENDPOINT
The endpoint URL for connecting to the S3 service.
Default: '127.0.0.1'

### S3_PORT
The port number for connecting to the S3 service.
Default: 9000

### S3_ACCESS_KEY
The access key ID used to authenticate requests to the S3 service.
Required

### S3_SECRET_KEY
The secret access key used to authenticate requests to the S3 service.
Required

### S3_BUCKET
The name of the S3 bucket where files will be stored.
Default: 'recording'

### S3_USE_SSL
Indicates whether to use SSL (HTTPS) for connections to the S3 service.
Default: false

### NODE_ENV
The environment in which the server is running (e.g., 'development', 'production').
Default: 'development'

### HOST
The hostname or IP address on which the server will run.
Default: 'localhost'

### PORT
The port number on which the server will listen for incoming connections.
Default: 5000

### SESSION_SECRET
The secret key used for session encryption and validation.
Default: 'session_key'

### WEB3_PRIVATE_KEY
The private key used for signing transactions.
Required

