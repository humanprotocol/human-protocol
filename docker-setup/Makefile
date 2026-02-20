.PHONY: check-env-file \
	infra-up infra-stop \
	build-services services-up services-stop

export COMPOSE_BAKE=false
DOCKER_PARALLEL ?= 2

check-env-file:
	@if [ ! -f "./.env.compose.local" ]; then \
		cp ./.env.compose ./.env.compose.local ; \
	fi

infra-up: check-env-file
	@docker compose --env-file .env.compose.local up -d postgres redis minio minio-client

infra-stop:
	@docker compose --env-file .env.compose.local stop postgres redis minio minio-client

build-services: check-env-file
	@# TODO: Revisit compose-native parallel builds once Docker Compose v5 parallel limits are reliable again.
	@docker compose --env-file .env.compose.local config --services | \
		xargs -n $(DOCKER_PARALLEL) docker compose --env-file .env.compose.local build
	@docker compose --env-file .env.compose.local up --no-start

services-up: check-env-file
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	@# TODO: Revisit compose-native parallel builds once Docker Compose v5 parallel limits are reliable again.
	if [ -n "$$service_names" ]; then \
		printf '%s\n' $$service_names | xargs -n $(DOCKER_PARALLEL) docker compose --env-file .env.compose.local up -d; \
	else \
		docker compose --env-file .env.compose.local config --services | xargs -n $(DOCKER_PARALLEL) docker compose --env-file .env.compose.local up -d; \
	fi

services-stop:
	@service_names="$(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	docker compose --env-file .env.compose.local stop $$service_names

# catch-all and noop; to avoid warnings when using MAKECMDGOALS 
%:
	@:
