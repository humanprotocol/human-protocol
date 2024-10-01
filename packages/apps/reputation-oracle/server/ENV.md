# Environment Variables

### The private key used for signing JSON Web Tokens (JWT). Required
JWT_PRIVATE_KEY=

### The public key used for verifying JSON Web Tokens (JWT). Required
JWT_PUBLIC_KEY=

### The expiration time (in seconds) for access tokens. Default: 600
JWT_ACCESS_TOKEN_EXPIRES_IN="600"

### The expiration time (in seconds) for refresh tokens. Default: 3600
JWT_REFRESH_TOKEN_EXPIRES_IN="3600"

### The expiration time (in seconds) for email verification tokens. Default: 86400
VERIFY_EMAIL_TOKEN_EXPIRES_IN="86400"

### The expiration time (in seconds) for forgot password tokens. Default: 86400
FORGOT_PASSWORD_TOKEN_EXPIRES_IN="86400"

### The URL for connecting to the PostgreSQL database. Required
POSTGRES_URL=

### The hostname or IP address of the PostgreSQL database server. Default: '127.0.0.1'
POSTGRES_HOST="127.0.0.1"

### The port number on which the PostgreSQL database server is listening. Default: 5432
POSTGRES_PORT="5432"

### The username for authenticating with the PostgreSQL database. Default: 'operator'
POSTGRES_USER="operator"

### The password for authenticating with the PostgreSQL database. Default: 'qwerty'
POSTGRES_PASSWORD="qwerty"

### The name of the PostgreSQL database to connect to. Default: 'reputation-oracle'
POSTGRES_DATABASE="reputation-oracle"

### Indicates whether to use SSL for connections to the PostgreSQL database. Default: false
POSTGRES_SSL="false"

### The logging level for PostgreSQL operations (e.g., 'debug', 'info'). Required
POSTGRES_LOGGING=

### The site key for the hCaptcha service, used for client-side verification. Required
HCAPTCHA_SITE_KEY=

### The API key for the hCaptcha service, used for server-side verification and operations. Required
HCAPTCHA_API_KEY=

### The secret key for the hCaptcha service, used for server-side authentication. Required
HCAPTCHA_SECRET=

### The URL for hCaptcha API endpoints used for protection and verification. Default: 'https://api.hcaptcha.com'
HCAPTCHA_PROTECTION_URL="https://api.hcaptcha.com"

### The URL for hCaptcha labeling service, used for managing and accessing labeler accounts. Default: 'https://foundation-accounts.hmt.ai'
HCAPTCHA_LABELING_URL="https://foundation-accounts.hmt.ai"

### The default language code for the hCaptcha labeler interface. Default: 'en'
HCAPTCHA_DEFAULT_LABELER_LANG="en"

### The API key for the KYC service, used for authentication with the KYC provider's API. Default: KYC_API_KEY_DISABLED (a constant indicating that the API key is disabled)
KYC_API_KEY="KYC_API_KEY_DISABLED (a constant indicating that the API key is disabled)"

### The private key associated with the KYC API, used for secure server-to-server communication. Required
KYC_API_PRIVATE_KEY=

### The base URL for the KYC provider's API, which is used to send verification requests and retrieve results. Default: 'https://stationapi.veriff.com/v1'
KYC_BASE_URL="https://stationapi.veriff.com/v1"

### The RPC URL for the Sepolia network. Required
RPC_URL_SEPOLIA=

### The RPC URL for the Polygon network. Required
RPC_URL_POLYGON=

### The RPC URL for the Polygon Amoy network. Required
RPC_URL_POLYGON_AMOY=

### The RPC URL for the BSC Mainnet network. Required
RPC_URL_BSC_MAINNET=

### The RPC URL for the BSC Testnet network. Required
RPC_URL_BSC_TESTNET=

### The RPC URL for the Moonbeam network. Required
RPC_URL_MOONBEAM=

### The RPC URL for the XLayer Testnet network. Required
RPC_URL_XLAYER_TESTNET=

### The RPC URL for the XLayer network. Required
RPC_URL_XLAYER=

### The RPC URL for the Localhost network. Required
RPC_URL_LOCALHOST=

### 
WEB3_ENV=

### Indicates whether PGP encryption should be used. Default: false
PGP_ENCRYPT="false"

### The private key used for PGP encryption or decryption. Required
PGP_PRIVATE_KEY=

### The passphrase associated with the PGP private key. Required
PGP_PASSPHRASE=

### The threshold value that defines the lower boundary of reputation level. Users with a reputation below this value are considered to have a low reputation. Default: 300
REPUTATION_LEVEL_LOW="300"

### The threshold value that defines the upper boundary of reputation level. Users with a reputation above this value are considered to have a high reputation. Default: 700
REPUTATION_LEVEL_HIGH="700"

### The endpoint URL for connecting to the S3 service. Default: '127.0.0.1'
S3_ENDPOINT="127.0.0.1"

### The port number for connecting to the S3 service. Default: 9000
S3_PORT="9000"

### The access key ID used to authenticate requests to the S3 service. Required
S3_ACCESS_KEY=

### The secret access key used to authenticate requests to the S3 service. Required
S3_SECRET_KEY=

### The name of the S3 bucket where files will be stored. Default: 'reputation'
S3_BUCKET="reputation"

### Indicates whether to use SSL (HTTPS) for connections to the S3 service. Default: false
S3_USE_SSL="false"

### The API key used for authenticating requests to the SendGrid API. Default: 'sendgrid-disabled'
SENDGRID_API_KEY="sendgrid-disabled"

### The email address that will be used as the sender's address in emails sent via SendGrid. Default: 'app@humanprotocol.org'
SENDGRID_FROM_EMAIL="app@humanprotocol.org"

### The name that will be used as the sender's name in emails sent via SendGrid. Default: 'Human Protocol'
SENDGRID_FROM_NAME="Human Protocol"

### The environment in which the server is running (e.g., 'development', 'production'). Default: 'development'
NODE_ENV="development"

### The hostname or IP address on which the server will run. Default: 'localhost'
HOST="localhost"

### The port number on which the server will listen for incoming connections. Default: 5003
PORT="5003"

### The URL of the frontend application that the server will communicate with. Default: 'http://localhost:3001'
FE_URL="http://localhost:3001"

### The secret key used for session encryption and validation. Default: 'session_key'
SESSION_SECRET="session_key"

### The maximum number of retry attempts for certain operations. Default: 5
MAX_RETRY_COUNT="5"

### The minimum validity period (in days) for a qualification. Default: 1 day
QUALIFICATION_MIN_VALIDITY="1 day"

### The environment in which the Web3 application is running. Default: 'testnet'
WEB3_ENV="testnet"

### The private key used for signing transactions. Required
WEB3_PRIVATE_KEY=

### Multiplier for gas price adjustments. Default: 1
GAS_PRICE_MULTIPLIER="1"

