.PHONY: copy-env-files

copy-env-files:
# Copying .env file for compose itself 
	@cp ./env-files/.env.compose .env.compose.local
# Copying .env files for backend services
	@cp ./env-files/.env.reputation-oracle ./.env.reputation-oracle.local
	@cp ./env-files/.env.human-app-server .env.human-app-server.local
	@cp ./env-files/.env.job-launcher ./.env.job-launcher.local
	@cp ./env-files/.env.exchange-oracle ./.env.exchange-oracle.local
	@cp ./env-files/.env.recording-oracle ./.env.recording-oracle.local
# Copying .env files for client apps.
# It should be placed in corresponding app folder
# because used during Docker image build process
	@cp ./env-files/.env.human-app-client ../../packages/apps/human-app/frontend/.env.local
	@cp ./env-files/.env.job-launcher-client ../../packages/apps/job-launcher/client/.env.local
# Restore original files
	@git checkout . > /dev/null 2>&1