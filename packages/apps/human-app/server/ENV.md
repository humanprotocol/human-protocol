# Environment Variables

### The hostname or IP address on which the server will run. Default: 'localhost'
HOST="localhost"

### The port number on which the server will listen for incoming connections. Default: 5000
PORT="5000"

### The URL of the reputation oracle service. Required
GIT_HASH=

### The address of the reputation oracle service. Required
REPUTATION_ORACLE_URL=

### Flag indicating if Axios request logging is enabled. Default: false
REPUTATION_ORACLE_ADDRESS="false"

### The allowed host for the application. Required
IS_AXIOS_REQUEST_LOGGING_ENABLED=

### The port number for the Redis cache server. Required
ALLOWED_HOST=

### The hostname or IP address of the Redis cache server. Required
REDIS_PORT=

### The DB number of the Redis cache server
REDIS_HOST=

### The cache time-to-live (TTL) for oracle statistics. Default: 12 hours
REDIS_DB="12 hours"

### The cache time-to-live (TTL) for user statistics. Default: 15 minutes
CACHE_TTL_ORACLE_STATS="15 minutes"

### The cache time-to-live (TTL) for daily HMT spent data. Default: 24 hours
CACHE_TTL_USER_STATS="24 hours"

### The cache time-to-live (TTL) for hCaptcha user statistics. Default: 12 hours
CACHE_TTL_DAILY_HMT_SPENT="12 hours"

### The cache time-to-live (TTL) for oracle discovery. Default: 24 hours
CACHE_TTL_HCAPTCHA_USER_STATS="24 hours"

### Number of days without updates assignments data is retained. Default: 45 days
CACHE_TTL_ORACLE_DISCOVERY="45 days"

### The RPC URL used for communication. Required
JOB_ASSIGNMENTS_DATA_RETENTION_DAYS=

### Flag indicating if CORS is enabled. Default: false
RPC_URL="false"

### The allowed origin for CORS requests. Default: 'http://localhost:5173'
CORS_ENABLED="http://localhost:5173"

### The allowed headers for CORS requests. Default: 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
CORS_ALLOWED_ORIGIN="Content-Type,Authorization,X-Requested-With,Accept,Origin"

### The cache time-to-live (TTL) for exchange oracle URLs. Default: 24 hours
CORS_ALLOWED_HEADERS="24 hours"

### The cache time-to-live (TTL) for job types. Default: 24 hours
CACHE_TTL_EXCHANGE_ORACLE_URL="24 hours"

### The cache time-to-live (TTL) for exchange oracle registration needed. Default: 24 hours
CACHE_TTL_JOB_TYPES="24 hours"

### The API URL for hCaptcha labeling statistics. Required
CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED=

### The API URL for hCaptcha labeling verification. Required
HCAPTCHA_LABELING_STATS_API_URL=

### The API key for hCaptcha labeling. Required
HCAPTCHA_LABELING_VERIFY_API_URL=

### The list of enabled chain IDs. Required
HCAPTCHA_LABELING_API_KEY=

### Flag indicating if the cache should be restarted. Default: false
CHAIN_IDS_ENABLED="false"

### The email address for the human app. Required
IS_CACHE_TO_RESTART=

### The password for the human app. Required
HUMAN_APP_EMAIL=

### The maximum number of iteration to skip. Default: 5
HUMAN_APP_PASSWORD="5"

### Feature flag for job discovery
MAX_EXECUTIONS_TO_SKIP=

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

