.PHONY: check-env-file \
	infra-up infra-stop \
	build-services services-up services-stop

export COMPOSE_BAKE=false
DOCKER_PARALLEL ?= 4

check-env-file:
	@if [ ! -f "./.env.compose.local" ]; then \
		cp ./.env.compose ./.env.compose.local ; \
	fi

infra-up: check-env-file
	@docker compose --env-file .env.compose.local up -d postgres redis minio minio-client

infra-stop:
	@docker compose --env-file .env.compose.local stop postgres redis minio minio-client

build-services: check-env-file
	@docker compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up --no-start

services-up: check-env-file
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose --env-file .env.compose.local --parallel $(DOCKER_PARALLEL) up -d $$service_names

services-stop:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose --env-file .env.compose.local stop $$service_names

# catch-all and noop; to avoid warnings when using MAKECMDGOALS 
%:
	@:
