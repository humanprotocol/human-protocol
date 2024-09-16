# Environment Variables

### JWT_ACCESS_TOKEN_EXPIRES_IN
The private key used for signing JSON Web Tokens (JWT).
Required

### REFRESH_TOKEN_EXPIRES_IN
The public key used for verifying JSON Web Tokens (JWT).
Required

### VERIFY_EMAIL_TOKEN_EXPIRES_IN
The expiration time (in seconds) for access tokens.
Default: 600

### FORGOT_PASSWORD_TOKEN_EXPIRES_IN
The expiration time (in seconds) for refresh tokens.
Default: 3600

### APIKEY_ITERATIONS
The expiration time (in seconds) for email verification tokens.
Default: 86400

### APIKEY_KEY_LENGTH
The expiration time (in seconds) for forgot password tokens.
Default: 86400

### HCAPTCHA_PROTECTION_URL
The number of iterations used for generating API keys.
Default: 1000

### CVAT_JOB_SIZE
The size of the job in CVAT, typically representing the number of items or tasks.
Default: 10

### CVAT_MAX_TIME
The maximum allowed time (in seconds) for a CVAT job to be completed.
Default: 300

### CVAT_VAL_SIZE
The size of validation jobs in CVAT, usually representing the number of validation items.
Default: 2

### CVAT_SKELETONS_JOB_SIZE_MULTIPLIER
The multiplier for the size of skeleton jobs in CVAT, used to scale the job size for skeleton tasks.
Default: 6

### POSTGRES_URL
The URL for connecting to the PostgreSQL database.
Required

### POSTGRES_HOST
The hostname or IP address of the PostgreSQL database server.
Default: '127.0.0.1'

### POSTGRES_PORT
The port number on which the PostgreSQL database server is listening.
Default: 5432

### POSTGRES_USER
The username for authenticating with the PostgreSQL database.
Default: 'operator'

### POSTGRES_PASSWORD
The password for authenticating with the PostgreSQL database.
Default: 'qwerty'

### POSTGRES_DATABASE
The name of the PostgreSQL database to connect to.
Default: 'job-launcher'

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

### RPC_URL_XLAYER_TESTNET
The RPC URL for the XLayer Testnet network.
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

### SENDGRID_FROM_EMAIL
The API key used for authenticating requests to the SendGrid API.
Required

### SENDGRID_FROM_NAME
The email address that will be used as the sender's address in emails sent via SendGrid.
Default: 'job-launcher@hmt.ai'

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

### MINIMUM_FEE_USD
The minimum transaction fee in USD.
Default: 0.01

### RATE_CACHE_TIME
The time (in seconds) for which rate information will be cached.
Default: 30

### STRIPE_API_VERSION
The secret key used for authenticating requests to the Stripe API.
Required

### STRIPE_APP_NAME
The version of the Stripe API to use for requests.
Default: '2022-11-15'

### STRIPE_APP_VERSION
The name of the application interacting with the Stripe API.
Default: 'Fortune'

### STRIPE_APP_INFO_URL
The version of the application interacting with the Stripe API.
Default: '0.0.1'

### WEB3_ENV
The environment in which the Web3 application is running.
Default: 'testnet'

### GAS_PRICE_MULTIPLIER
The private key used for signing transactions.
Required

