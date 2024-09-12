# Environment Variables

### HOST
The hostname or IP address on which the server will run.
Default: 'localhost'

### PORT
The port number on which the server will listen for incoming connections.
Default: 5000

### REPUTATION_ORACLE_URL
The URL of the reputation oracle service.
Default: undefined

### REPUTATION_ORACLE_ADDRESS
The address of the reputation oracle service.
Default: undefined

### IS_AXIOS_REQUEST_LOGGING_ENABLED
Flag indicating if Axios request logging is enabled.
Default: false

### ALLOWED_HOST
The allowed host for the application.
Default: undefined

### REDIS_PORT
The port number for the Redis cache server.
Default: undefined

### REDIS_HOST
The hostname or IP address of the Redis cache server.
Default: undefined

### CACHE_TTL_ORACLE_STATS
The cache time-to-live (TTL) for oracle statistics.
Default: 12 hours

### CACHE_TTL_USER_STATS
The cache time-to-live (TTL) for user statistics.
Default: 15 minutes

### CACHE_TTL_DAILY_HMT_SPENT
The cache time-to-live (TTL) for daily HMT spent data.
Default: 24 hours

### CACHE_TTL_HCAPTCHA_USER_STATS
The cache time-to-live (TTL) for hCaptcha user statistics.
Default: 12 hours

### CACHE_TTL_ORACLE_DISCOVERY
The cache time-to-live (TTL) for oracle discovery.
Default: 24 hours

### RPC_URL
The RPC URL used for communication.
Default: undefined

### CORS_ENABLED
Flag indicating if CORS is enabled.
Default: false

### CORS_ALLOWED_ORIGIN
The allowed origin for CORS requests.
Default: 'http://localhost:5173'

### CORS_ALLOWED_HEADERS
The allowed headers for CORS requests.
Default: 'Content-Type,Authorization,X-Requested-With,Accept,Origin'

### CACHE_TTL_EXCHANGE_ORACLE_URL
The cache time-to-live (TTL) for exchange oracle URLs.
Default: 24 hours

### CACHE_TTL_EXCHANGE_ORACLE_REGISTRATION_NEEDED
The cache time-to-live (TTL) for exchange oracle registration needed.
Default: 24 hours

### HCAPTCHA_LABELING_STATS_API_URL
The API URL for hCaptcha labeling statistics.
Default: undefined

### HCAPTCHA_LABELING_VERIFY_API_URL
The API URL for hCaptcha labeling verification.
Default: undefined

### HCAPTCHA_LABELING_API_KEY
The API key for hCaptcha labeling.
Default: undefined

### CHAIN_IDS_ENABLED
The list of enabled chain IDs.
Default: undefined

### IS_CACHE_TO_RESTART
Flag indicating if the cache should be restarted.
Default: false

### HUMAN_APP_EMAIL
The email address for the human app.
Default: undefined

### HUMAN_APP_PASSWORD
The password for the human app.
Default: undefined

### MAX_REQUEST_RETRIES
The maximum number of retries for requests.
Default: 5

### E2E_TESTING_EMAIL_ADDRESS
The email address used for end-to-end (E2E) testing.
Default: empty string

### E2E_TESTING_PASSWORD
The password used for end-to-end (E2E) testing.
Default: empty string

### E2E_TESTING_EXCHANGE_ORACLE_URL
The URL of the exchange oracle service used for end-to-end (E2E) testing.
Default: empty string

### E2E_TESTING_ESCROW_ADDRESS
The escrow address used for end-to-end (E2E) testing.
Default: empty string

### E2E_TESTING_ESCROW_CHAIN_ID
The chain ID for the escrow service used for end-to-end (E2E) testing.
Default: empty string

