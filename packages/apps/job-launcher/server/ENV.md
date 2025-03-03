# Environment Variables

### The private key used for signing JSON Web Tokens (JWT). Required
JWT_PRIVATE_KEY=

### The public key used for verifying JSON Web Tokens (JWT). Required
JWT_PUBLIC_KEY=

### The expiration time (in seconds) for access tokens. Default: 600
JWT_ACCESS_TOKEN_EXPIRES_IN="600"

### The expiration time (in seconds) for refresh tokens. Default: 3600
REFRESH_TOKEN_EXPIRES_IN="3600"

### The expiration time (in seconds) for email verification tokens. Default: 86400
VERIFY_EMAIL_TOKEN_EXPIRES_IN="86400"

### The expiration time (in seconds) for forgot password tokens. Default: 86400
FORGOT_PASSWORD_TOKEN_EXPIRES_IN="86400"

### The number of iterations used for generating API keys. Default: 1000
APIKEY_ITERATIONS="1000"

### The length of the API key in characters. Default: 64
APIKEY_KEY_LENGTH="64"

### The site key for hCaptcha, used for CAPTCHA protection. Required
HCAPTCHA_SITE_KEY=

### The secret key for hCaptcha, used for verifying CAPTCHA responses. Required
HCAPTCHA_SECRET=

### The URL for the hCaptcha protection service. Default: 'https://api.hcaptcha.com'
HCAPTCHA_PROTECTION_URL="https://api.hcaptcha.com"

### The size of the job in CVAT, typically representing the number of items or tasks. Default: 10
CVAT_JOB_SIZE="10"

### The maximum allowed time (in seconds) for a CVAT job to be completed. Default: 300
CVAT_MAX_TIME="300"

### The size of validation jobs in CVAT, usually representing the number of validation items. Default: 2
CVAT_VAL_SIZE="2"

### The multiplier for the size of skeleton jobs in CVAT, used to scale the job size for skeleton tasks. Default: 6
CVAT_SKELETONS_JOB_SIZE_MULTIPLIER="6"

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

### The name of the PostgreSQL database to connect to. Default: 'job-launcher'
POSTGRES_DATABASE="job-launcher"

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

### The name of the S3 bucket where files will be stored. Default: 'launcher'
S3_BUCKET="launcher"

### Indicates whether to use SSL (HTTPS) for connections to the S3 service. Default: false
S3_USE_SSL="false"

### The API key used for authenticating requests to the SendGrid API. Required
SENDGRID_API_KEY=

### The email address that will be used as the sender's address in emails sent via SendGrid. Default: 'job-launcher@hmt.ai'
SENDGRID_FROM_EMAIL="job-launcher@hmt.ai"

### The name that will be used as the sender's name in emails sent via SendGrid. Default: 'Human Protocol Job Launcher'
SENDGRID_FROM_NAME="Human Protocol Job Launcher"

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

### The minimum transaction fee in USD. Default: 0.01
MINIMUM_FEE_USD="0.01"

### The time (in seconds) for which rate information will be cached. Default: 30
RATE_CACHE_TIME="30"

### The API key for accessing CoinMarketCap data.
COINMARKETCAP_API_KEY=

### The API key for accessing CoinGecko data.
COINGECKO_API_KEY=

### The amount to charge abusive users.
ABUSE_AMOUNT=

### The secret key used for authenticating requests to the Stripe API. Required
STRIPE_SECRET_KEY=

### The version of the Stripe API to use for requests. Default: '2022-11-15'
STRIPE_API_VERSION="2022-11-15"

### The name of the application interacting with the Stripe API. Default: 'Fortune'
STRIPE_APP_NAME="Fortune"

### The version of the application interacting with the Stripe API. Default: '0.0.1'
STRIPE_APP_VERSION="0.0.1"

### The URL of the application's information page. Default: 'https://hmt.ai'
STRIPE_APP_INFO_URL="https://hmt.ai"

### The environment in which the Web3 application is running. Default: 'testnet'
WEB3_ENV="testnet"

### The private key used for signing transactions. Required
WEB3_PRIVATE_KEY=

### Multiplier for gas price adjustments. Default: 1
GAS_PRICE_MULTIPLIER="1"

### Address of the reputation oracle contract. Required
REPUTATION_ORACLE_ADDRESS=

### List of reputation oracle addresses, typically comma-separated. Required
REPUTATION_ORACLES=

### Address of the Fortune exchange oracle contract. Required
FORTUNE_EXCHANGE_ORACLE_ADDRESS=

### Address of the Fortune recording oracle contract. Required
FORTUNE_RECORDING_ORACLE_ADDRESS=

### Address of the CVAT exchange oracle contract. Required
CVAT_EXCHANGE_ORACLE_ADDRESS=

### Address of the CVAT recording oracle contract. Required
CVAT_RECORDING_ORACLE_ADDRESS=

### URI for the hCaptcha recording oracle service. Required
HCAPTCHA_RECORDING_ORACLE_URI=

### URI for the hCaptcha reputation oracle service. Required
HCAPTCHA_REPUTATION_ORACLE_URI=

### Address of the hCaptcha oracle contract. Required
HCAPTCHA_ORACLE_ADDRESS=

