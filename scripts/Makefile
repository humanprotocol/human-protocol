.PHONY: check-file fortune

check-legacy-abis:
	@if [ ! -d "../packages/core/abis/legacy" ]; then \
		yarn workspace @human-protocol/core build; \
	fi

hardhat-node:
	yarn workspace @human-protocol/core local

subgraph:
	sleep 5
	$(MAKE) check-legacy-abis
	docker compose -f ./fortune/docker-compose.yml up -d graph-node
	NETWORK=localhost yarn workspace @human-protocol/subgraph generate
	sleep 5
	yarn workspace @human-protocol/subgraph create-local
	yarn workspace @human-protocol/subgraph deploy-local

minio:
	docker compose -f ./fortune/docker-compose.yml up -d minio-mc

database:
	docker compose -f ./fortune/docker-compose.yml up -d postgres

job-launcher-server: minio
	yarn workspace @human-protocol/job-launcher-server setup:local
	NODE_ENV=development yarn workspace @human-protocol/job-launcher-server migration:run
	NODE_ENV=development yarn workspace @human-protocol/job-launcher-server start

job-launcher-client:
	NODE_ENV=development yarn workspace @human-protocol/job-launcher-client start

fortune-exchange-oracle:
	yarn workspace @human-protocol/fortune-exchange-oracle-server setup:local

fortune-recording-oracle:
	yarn workspace @human-protocol/fortune-recording-oracle setup:local

reputation-oracle:
	yarn workspace @human-protocol/reputation-oracle setup:local
	
fortune:
	@echo "RUNNING FORTUNE..."
	@trap 'echo "STOPPING FORTUNE.."; kill -9 $$PID_HARDHAT $$PID_JL_CLIENT $$PID_JL_SERVER $$PID_EXO $$PID_RECO; docker compose -f ./fortune/docker-compose.yml down; exit 0' SIGINT ERR; \
	$(MAKE) hardhat-node & PID_HARDHAT=$$!; \
	$(MAKE) subgraph & \
	$(MAKE) job-launcher-client & PID_JL_CLIENT=$$!; \
	$(MAKE) job-launcher-server & PID_JL_SERVER=$$!; \
	$(MAKE) fortune-exchange-oracle & PID_EXO=$$!; \
	$(MAKE) fortune-recording-oracle & PID_RECO=$$!; \
	wait