# Environment Variables

### POSTGRES_URL
The URL for connecting to the PostgreSQL database.
Required

### POSTGRES_HOST
The hostname or IP address of the PostgreSQL database server.
Required

### POSTGRES_PORT
The port number on which the PostgreSQL database server is listening.
Required

### POSTGRES_USER
The username for authenticating with the PostgreSQL database.
Required

### POSTGRES_PASSWORD
The password for authenticating with the PostgreSQL database.
Required

### POSTGRES_DATABASE
The name of the PostgreSQL database to connect to.
Default: 'exchange-oracle'

### POSTGRES_SSL
Indicates whether to use SSL for connections to the PostgreSQL database.
Default: false

### RPC_URL_SEPOLIA
The RPC URL for the Sepolia network.
Required

### RPC_URL_POLYGON
The RPC URL for the Polygon network.
Required

### RPC_URL_POLYGON_AMOY
The RPC URL for the Polygon Amoy network.
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

### RPC_URL_XLAYER
The RPC URL for the XLayer network.
Required

### RPC_URL_LOCALHOST
The RPC URL for the Localhost network.
Required

### PGP_ENCRYPT
Indicates whether PGP encryption should be used.
Default: false

### S3_ENDPOINT
The endpoint URL for connecting to the S3 service.
Default: '127.0.0.1'

### S3_PORT
The port number for connecting to the S3 service.
Default: 9000

### S3_BUCKET
The access key ID used to authenticate requests to the S3 service.
Required

### S3_USE_SSL
The secret access key used to authenticate requests to the S3 service.
Required

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

