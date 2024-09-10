# Environment Variables

### JWT_PRIVATE_KEY
The private key used for signing JSON Web Tokens (JWT).
Default: ''

### JWT_PUBLIC_KEY
The public key used for verifying JSON Web Tokens (JWT).
Default: ''

### HCAPTCHA_SITE_KEY
The expiration time (in seconds) for access tokens.
Default: 600

### HCAPTCHA_SECRET
The expiration time (in seconds) for refresh tokens.
Default: 3600

### POSTGRES_HOST
The URL for connecting to the PostgreSQL database.
Default: undefined

### POSTGRES_USER
The hostname or IP address of the PostgreSQL database server.
Default: '127.0.0.1'

### POSTGRES_PASSWORD
The port number on which the PostgreSQL database server is listening.
Default: 5432

### POSTGRES_DATABASE
The username for authenticating with the PostgreSQL database.
Default: 'operator'

### POSTGRES_SSL
The password for authenticating with the PostgreSQL database.
Default: 'qwerty'

### POSTGRES_LOGGING
The name of the PostgreSQL database to connect to.
Default: 'job-launcher'

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

### S3_ACCESS_KEY
The port number for connecting to the S3 service.
Default: 9000

### S3_SECRET_KEY
The access key ID used to authenticate requests to the S3 service.
Default: ''

### S3_BUCKET
The secret access key used to authenticate requests to the S3 service.
Default: ''

### S3_USE_SSL
The name of the S3 bucket where files will be stored.
Default: 'launcher'

### SENDGRID_API_KEY
The API key used for authenticating requests to the SendGrid API.
Default: ''

### NODE_ENV
The environment in which the server is running (e.g., 'development', 'production').
Default: 'development'

### HOST
The hostname or IP address on which the server will run.
Default: 'localhost'

### FE_URL
The port number on which the server will listen for incoming connections.
Default: 5000

### COINMARKETCAP_API_KEY
The URL of the frontend application that the server will communicate with.
Default: 'http://localhost:3005'

### COINGECKO_API_KEY
The maximum number of retry attempts for certain operations.
Default: 5

### STRIPE_SECRET_KEY
The secret key used for authenticating requests to the Stripe API.
Default: ''

### STRIPE_API_VERSION
The version of the Stripe API to use for requests.
Default: '2022-11-15'

### STRIPE_APP_NAME
The name of the application interacting with the Stripe API.
Default: 'Fortune'

### STRIPE_APP_VERSION
The version of the application interacting with the Stripe API.
Default: '0.0.1'

### STRIPE_APP_INFO_URL
The URL of the application's information page.
Default: 'https://hmt.ai'

### WEB3_ENV
The environment in which the Web3 application is running.
Default: 'testnet'

### WEB3_PRIVATE_KEY
The private key used for signing transactions.
Default: ''

### REPUTATION_ORACLE_ADDRESS
Multiplier for gas price adjustments.
Default: 1

### REPUTATION_ORACLES
Address of the reputation oracle contract.
Default: ''

### CVAT_EXCHANGE_ORACLE_ADDRESS
List of reputation oracle addresses, typically comma-separated.
Default: ''

### CVAT_RECORDING_ORACLE_ADDRESS
Address of the Fortune exchange oracle contract.
Default: ''

### HCAPTCHA_RECORDING_ORACLE_URI
Address of the Fortune recording oracle contract.
Default: ''

### HCAPTCHA_REPUTATION_ORACLE_URI
Address of the CVAT exchange oracle contract.
Default: ''

### HCAPTCHA_ORACLE_ADDRESS
Address of the CVAT recording oracle contract.
Default: ''

