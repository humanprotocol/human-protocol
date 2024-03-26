# LOCAL ENVIRONMENT SETUP SCRIPTS

## Fortune

### Command: `make fortune`

Previous steps:
- Run `make create-env-files`
- Edit `../packages/apps/job-launcher/server/.env.local`:
    - Set a working key for `SENDGRID_API_KEY`.
    - Set a working key for `STRIPE_SECRET_KEY` in case Stripe is needed.
- Edit `../packages/apps/job-launcher/client/.env.local`:
    - Set a working key for `VITE_APP_STRIPE_PUBLISHABLE_KEY` in case Stripe is needed.


This command runs the following services:
- Hardhat node: port 8545
- Subgraph node: http://localhost:8000/subgraphs/name/humanprotocol/localhost
- Postgres database: port 5432
- IPFS: port 5010
- Minio bucket: http://localhost:9001 (user: access-key, password: secret-key)
- Job Launcher Client: http://localhost:3005
- Job Launcher Server: http://localhost:5000/swagger


