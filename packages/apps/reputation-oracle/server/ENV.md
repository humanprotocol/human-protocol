# Environment Variables

### JWT_ACCESS_TOKEN_EXPIRES_IN
The private key used for signing JSON Web Tokens (JWT).
Required

### JWT_REFRESH_TOKEN_EXPIRES_IN
The public key used for verifying JSON Web Tokens (JWT).
Required

### VERIFY_EMAIL_TOKEN_EXPIRES_IN
The expiration time (in seconds) for access tokens.
Default: 600

### FORGOT_PASSWORD_TOKEN_EXPIRES_IN
The expiration time (in seconds) for refresh tokens.
Default: 3600

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
Default: 'reputation-oracle'

### POSTGRES_SSL
Indicates whether to use SSL for connections to the PostgreSQL database.
Default: false

### HCAPTCHA_SITE_KEY
The site key for the hCaptcha service, used for client-side verification.
Default: an empty string

### HCAPTCHA_API_KEY
The API key for the hCaptcha service, used for server-side verification and operations.
Default: an empty string

### HCAPTCHA_SECRET
The secret key for the hCaptcha service, used for server-side authentication.
Default: an empty string

### HCAPTCHA_PROTECTION_URL
The URL for hCaptcha API endpoints used for protection and verification.
Default: 'https://api.hcaptcha.com'

### HCAPTCHA_LABELING_URL
The URL for hCaptcha labeling service, used for managing and accessing labeler accounts.
Default: 'https://foundation-accounts.hmt.ai'

### HCAPTCHA_DEFAULT_LABELER_LANG
The default language code for the hCaptcha labeler interface.
Default: 'en'

### KYC_API_KEY
The API key for the KYC service, used for authentication with the KYC provider's API.
Default: KYC_API_KEY_DISABLED (a constant indicating that the API key is disabled)

### KYC_API_PRIVATE_KEY
The private key associated with the KYC API, used for secure server-to-server communication.
Default: an empty string

### KYC_BASE_URL
The base URL for the KYC provider's API, which is used to send verification requests and retrieve results.
Default: 'https://stationapi.veriff.com/v1'

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

### REPUTATION_LEVEL_LOW
The threshold value that defines the lower boundary of reputation level.
Users with a reputation below this value are considered to have a low reputation.
Default: 300

### REPUTATION_LEVEL_HIGH
The threshold value that defines the upper boundary of reputation level.
Users with a reputation above this value are considered to have a high reputation.
Default: 700

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

### SENDGRID_API_KEY
The API key used for authenticating requests to the SendGrid API.
Default: 'sendgrid-disabled'

### SENDGRID_FROM_EMAIL
The email address that will be used as the sender's address in emails sent via SendGrid.
Default: 'app@humanprotocol.org'

### SENDGRID_FROM_NAME
The name that will be used as the sender's name in emails sent via SendGrid.
Default: 'Human Protocol'

### NODE_ENV
The environment in which the server is running (e.g., 'development', 'production').
Default: 'development'

### HOST
The hostname or IP address on which the server will run.
Default: 'localhost'

### PORT
The port number on which the server will listen for incoming connections.
Default: 5003

### FE_URL
The URL of the frontend application that the server will communicate with.
Default: 'http://localhost:3001'

### SESSION_SECRET
The secret key used for session encryption and validation.
Default: 'session_key'

### MAX_RETRY_COUNT
The maximum number of retry attempts for certain operations.
Default: 5

### QUALIFICATION_MIN_VALIDITY
The minimum validity period (in days) for a qualification.
Default: 1 day

### WEB3_ENV
The environment in which the Web3 application is running.
Default: 'testnet'

### GAS_PRICE_MULTIPLIER
The private key used for signing transactions.
Required

