.PHONY: copy-env-files \
	infra-up infra-stop build-services \
	services-up services-stop

DOCKER_PARALLEL ?= 4

copy-env-files:
# Copying .env file for compose itself 
	@cp ./env-files/.env.compose .env.compose.local
# Copying .env files for backend services
	@cp ./env-files/.env.reputation-oracle ./.env.reputation-oracle.local
	@cp ./env-files/.env.human-app-server .env.human-app-server.local
	@cp ./env-files/.env.job-launcher ./.env.job-launcher.local
# Copying .env files for cvat services
	@cp ./env-files/.env.exchange-oracle-cvat ./.env.exchange-oracle-cvat.local
	@cp ./env-files/.env.recording-oracle-cvat ./.env.recording-oracle-cvat.local
# Copying .env files for fortune services
	@cp ./env-files/.env.exchange-oracle-fortune ./.env.exchange-oracle-fortune.local
	@cp ./env-files/.env.recording-oracle-fortune ./.env.recording-oracle-fortune.local
# Copying .env files for client apps.
# It should be placed in corresponding app folder
# because used during Docker image build process
	@cp ./env-files/.env.human-app-client ../packages/apps/human-app/frontend/.env.local
	@cp ./env-files/.env.job-launcher-client ../packages/apps/job-launcher/client/.env.local
	@cp ./env-files/.env.fortune-client ../packages/apps/fortune/exchange-oracle/client/.env.local
# Restore original files
	@git checkout . > /dev/null 2>&1

infra-up:
	docker-compose --env-file .env.compose.local up -d postgres redis minio minio-client

infra-stop:
	docker-compose --env-file .env.compose.local stop postgres redis minio minio-client

build-services:
	docker-compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up --no-start

services-up:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker-compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up -d $$service_names

services-stop:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker-compose --env-file .env.compose.local stop $$service_names

# catch-all and noop; to avoid warnings when using MAKECMDGOALS 
%:
	@:
