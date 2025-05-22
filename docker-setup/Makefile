.PHONY: infra-up infra-stop \
	build-services services-up services-stop

DOCKER_PARALLEL ?= 4

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
