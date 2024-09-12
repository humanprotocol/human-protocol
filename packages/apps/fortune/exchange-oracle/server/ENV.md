# Environment Variables

### POSTGRES_URL
The URL for connecting to the PostgreSQL database.
Default: undefined

### POSTGRES_HOST
The hostname or IP address of the PostgreSQL database server.
Default: undefined

### POSTGRES_PORT
The port number on which the PostgreSQL database server is listening.
Default: undefined

### POSTGRES_USER
The username for authenticating with the PostgreSQL database.
Default: undefined

### POSTGRES_PASSWORD
The password for authenticating with the PostgreSQL database.
Default: undefined

### POSTGRES_DATABASE
The name of the PostgreSQL database to connect to.
Default: 'exchange-oracle'

### POSTGRES_SSL
Indicates whether to use SSL for connections to the PostgreSQL database.
Default: false

### POSTGRES_LOGGING
The logging level for PostgreSQL operations (e.g., 'debug', 'info').
Default: ''

### RPC_URL_SEPOLIA
The RPC URL for the Sepolia network.
Default: undefined

### RPC_URL_POLYGON
The RPC URL for the Polygon network.
Default: undefined

### RPC_URL_POLYGON_AMOY
The RPC URL for the Polygon Amoy network.
Default: undefined

### RPC_URL_BSC_MAINNET
The RPC URL for the BSC Mainnet network.
Default: undefined

### RPC_URL_BSC_TESTNET
The RPC URL for the BSC Testnet network.
Default: undefined

### RPC_URL_MOONBEAM
The RPC URL for the Moonbeam network.
Default: undefined

### RPC_URL_XLAYER
The RPC URL for the XLayer network.
Default: undefined

### RPC_URL_LOCALHOST
The RPC URL for the Localhost network.
Default: undefined

### PGP_ENCRYPT
Indicates whether PGP encryption should be used.
Default: false

### PGP_PRIVATE_KEY
The private key used for PGP encryption or decryption.
Default: ''

### PGP_PASSPHRASE
The passphrase associated with the PGP private key.
Default: ''

### S3_ENDPOINT
The endpoint URL for connecting to the S3 service.
Default: '127.0.0.1'

### S3_PORT
The port number for connecting to the S3 service.
Default: 9000

### S3_ACCESS_KEY
The access key ID used to authenticate requests to the S3 service.
Default: ''

### S3_SECRET_KEY
The secret access key used to authenticate requests to the S3 service.
Default: ''

### S3_BUCKET
The name of the S3 bucket where files will be stored.
Default: 'exchange'

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

### FE_URL
The URL of the frontend application that the server will communicate with.
Default: 'http://localhost:3005'

### MAX_RETRY_COUNT
The maximum number of retry attempts for certain operations.
Default: 5

### WEB3_ENV
The environment in which the Web3 application is running.
Default: 'testnet'

### WEB3_PRIVATE_KEY
The private key used for signing transactions.
Default: ''

