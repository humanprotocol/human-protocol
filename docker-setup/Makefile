.PHONY: check-env-file \
	infra-up infra-stop \
	build-services services-up services-stop \
	web3-start web3-stop

DOCKER_PARALLEL ?= 4

check-env-file:
	@if [ ! -f "./.env.compose.local" ]; then \
		cp ./.env.compose ./.env.compose.local ; \
	fi

infra-up:
	docker compose --env-file .env.compose.local up -d postgres redis minio minio-client

infra-stop:
	docker compose --env-file .env.compose.local stop postgres redis minio minio-client

build-services:
	docker compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up --no-start

services-up:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up -d $$service_names

services-stop:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose --env-file .env.compose.local stop $$service_names

web3-up:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose -f docker-compose.web3.yml --parallel $(DOCKER_PARALLEL) up -d $$service_names

web3-stop:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose -f docker-compose.web3.yml stop $$service_names

# also remove volumes to get the clean start after
web3-down:
	docker compose -f docker-compose.web3.yml down -v

# catch-all and noop; to avoid warnings when using MAKECMDGOALS 
%:
	@:
