# Environment Variables

### The hostname or IP address on which the server will run. Default: 'localhost'
HOST="localhost"

### The port number on which the server will listen for incoming connections. Default: 5000
PORT="5000"

### The URL of the reputation oracle service. Required
REPUTATION_ORACLE_URL=

### The address of the reputation oracle service. Required
REPUTATION_ORACLE_ADDRESS=

### Flag indicating if Axios request logging is enabled. Default: false
IS_AXIOS_REQUEST_LOGGING_ENABLED="false"

### The allowed host for the application. Required
ALLOWED_HOST=

### The port number for the Redis cache server. Required
REDIS_PORT=

### The hostname or IP address of the Redis cache server. Required
REDIS_HOST=

### The cache time-to-live (TTL) for oracle statistics. Default: 12 hours
CACHE_TTL_ORACLE_STATS="12 hours"

### The cache time-to-live (TTL) for user statistics. Default: 15 minutes
CACHE_TTL_USER_STATS="15 minutes"

### The cache time-to-live (TTL) for daily HMT spent data. Default: 24 hours
CACHE_TTL_DAILY_HMT_SPENT="24 hours"

### The cache time-to-live (TTL) for hCaptcha user statistics. Default: 12 hours
CACHE_TTL_HCAPTCHA_USER_STATS="12 hours"

### The cache time-to-live (TTL) for oracle discovery. Default: 24 hours
CACHE_TTL_ORACLE_DISCOVERY="24 hours"

### The RPC URL used for communication. Required
RPC_URL=

### Flag indicating if CORS is enabled. Default: false
CORS_ENABLED="false"

### The allowed origin for CORS requests. Default: 'http://localhost:5173'
CORS_ALLOWED_ORIGIN="http://localhost:5173"

### The allowed headers for CORS requests. Default: 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Requested-With,Accept,Origin"

### The cache time-to-live (TTL) for exchange oracle URLs. Default: 24 hours
CACHE_TTL_EXCHANGE_ORACLE_URL="24 hours"

### The cache time-to-live (TTL) for exchange oracle registration needed. Default: 24 hours
CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED="24 hours"

### The API URL for hCaptcha labeling statistics. Required
HCAPTCHA_LABELING_STATS_API_URL=

### The API URL for hCaptcha labeling verification. Required
HCAPTCHA_LABELING_VERIFY_API_URL=

### The API key for hCaptcha labeling. Required
HCAPTCHA_LABELING_API_KEY=

### The list of enabled chain IDs. Required
CHAIN_IDS_ENABLED=

### Flag indicating if the cache should be restarted. Default: false
IS_CACHE_TO_RESTART="false"

### The email address for the human app. Required
HUMAN_APP_EMAIL=

### The password for the human app. Required
HUMAN_APP_PASSWORD=

### The maximum number of retries for requests. Default: 5
MAX_REQUEST_RETRIES="5"

### The email address used for end-to-end (E2E) testing. Default: empty string
E2E_TESTING_EMAIL_ADDRESS="empty string"

### The password used for end-to-end (E2E) testing. Default: empty string
E2E_TESTING_PASSWORD="empty string"

### The URL of the exchange oracle service used for end-to-end (E2E) testing. Default: empty string
E2E_TESTING_EXCHANGE_ORACLE_URL="empty string"

### The escrow address used for end-to-end (E2E) testing. Default: empty string
E2E_TESTING_ESCROW_ADDRESS="empty string"

### The chain ID for the escrow service used for end-to-end (E2E) testing. Default: empty string
E2E_TESTING_ESCROW_CHAIN_ID="empty string"

