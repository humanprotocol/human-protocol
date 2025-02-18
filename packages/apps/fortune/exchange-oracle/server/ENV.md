# Environment Variables

### The URL for connecting to the PostgreSQL database.
POSTGRES_URL=

### The hostname or IP address of the PostgreSQL database server. Default: '127.0.0.1'
POSTGRES_HOST="127.0.0.1"

### The port number on which the PostgreSQL database server is listening. Default: 5432
POSTGRES_PORT="5432"

### The username for authenticating with the PostgreSQL database. Default: 'operator'
POSTGRES_USER="operator"

### The password for authenticating with the PostgreSQL database. Default: 'qwerty'
POSTGRES_PASSWORD="qwerty"

### The name of the PostgreSQL database to connect to. Default: 'exchange-oracle'
POSTGRES_DATABASE="exchange-oracle"

### Indicates whether to use SSL for connections to the PostgreSQL database. Default: false
POSTGRES_SSL="false"

### The logging level for PostgreSQL operations (e.g., 'debug', 'info'). Default: 'log,info,warn,error'
POSTGRES_LOGGING="log,info,warn,error"

### The RPC URL for the Sepolia network.
RPC_URL_SEPOLIA=

### The RPC URL for the Polygon network.
RPC_URL_POLYGON=

### The RPC URL for the Polygon Amoy network.
RPC_URL_POLYGON_AMOY=

### The RPC URL for the BSC Mainnet network.
RPC_URL_BSC_MAINNET=

### The RPC URL for the BSC Testnet network.
RPC_URL_BSC_TESTNET=

### The RPC URL for the Localhost network.
RPC_URL_LOCALHOST=

### Indicates whether PGP encryption should be used. Default: false
PGP_ENCRYPT="false"

### The private key used for PGP encryption or decryption.
PGP_PRIVATE_KEY=

### The passphrase associated with the PGP private key.
PGP_PASSPHRASE=

### The endpoint URL for connecting to the S3 service. Default: '127.0.0.1'
S3_ENDPOINT="127.0.0.1"

### The port number for connecting to the S3 service. Default: 9000
S3_PORT="9000"

### The access key ID used to authenticate requests to the S3 service. Required
S3_ACCESS_KEY=

### The secret access key used to authenticate requests to the S3 service. Required
S3_SECRET_KEY=

### The name of the S3 bucket where files will be stored. Default: 'exchange'
S3_BUCKET="exchange"

### Indicates whether to use SSL (HTTPS) for connections to the S3 service. Default: false
S3_USE_SSL="false"

### The environment in which the server is running (e.g., 'development', 'production'). Default: 'development'
NODE_ENV="development"

### The hostname or IP address on which the server will run. Default: 'localhost'
HOST="localhost"

### The port number on which the server will listen for incoming connections. Default: 5000
PORT="5000"

### The URL of the frontend application that the server will communicate with. Default: 'http://localhost:3005'
FE_URL="http://localhost:3005"

### The maximum number of retry attempts for certain operations. Default: 5
MAX_RETRY_COUNT="5"

### The environment in which the Web3 application is running. Default: 'testnet'
WEB3_ENV="testnet"

### The private key used for signing transactions. Required
WEB3_PRIVATE_KEY=

