.PHONY: check-file fortune

check-core-folders:
	@if [ ! -d "../packages/core/abis/legacy" ] || [ ! -d "../packages/core/typechain-types" ]; then \
		yarn workspace @human-protocol/sdk build; \
	fi

create-env-files:
	@if [ ! -f "../packages/apps/job-launcher/server/.env.local" ]; then \
		cp ./fortune/.env.jl-server ../packages/apps/job-launcher/server/.env.local ; \
	fi
	
	@if [ ! -f "../packages/apps/job-launcher/client/.env.local" ]; then \
		cp ./fortune/.env.jl-client ../packages/apps/job-launcher/client/.env.local ; \
	fi

	@if [ ! -f "../packages/apps/fortune/exchange-oracle/server/.env.local" ]; then \
		cp ./fortune/.env.exco-server ../packages/apps/fortune/exchange-oracle/server/.env.local ; \
	fi

	@if [ ! -f "../packages/apps/fortune/recording-oracle/.env.local" ]; then \
		cp ./fortune/.env.rec-oracle ../packages/apps/fortune/recording-oracle/.env.local ; \
	fi

	@if [ ! -f "../packages/apps/reputation-oracle/server/.env.local" ]; then \
		cp ./fortune/.env.rep-oracle ../packages/apps/reputation-oracle/server/.env.local ; \
	fi

hardhat-node:
	yarn workspace @human-protocol/core local

subgraph:
	docker compose -f ./fortune/docker-compose.yml up -d graph-node
	NETWORK=localhost yarn workspace @human-protocol/subgraph generate
	@while [ $$(docker inspect --format='{{.State.Health.Status}}' graph-node) != "healthy" ]; do \
		sleep 2; \
	done; \
	echo "Container is healthy."
	yarn workspace @human-protocol/subgraph create-local
	yarn workspace @human-protocol/subgraph deploy-local

minio:
	docker compose -f ./fortune/docker-compose.yml up -d minio-mc

database:
	docker compose -f ./fortune/docker-compose.yml up -d postgres

job-launcher-server: rpc-health-check
	yarn workspace @human-protocol/job-launcher-server setup:local
	NODE_ENV=local yarn workspace @human-protocol/job-launcher-server migration:run
	NODE_ENV=local yarn workspace @human-protocol/job-launcher-server start:dev

job-launcher-client:
	NODE_ENV=local yarn workspace @human-protocol/job-launcher-client start

fortune-exchange-oracle: rpc-health-check
	yarn workspace @human-protocol/fortune-exchange-oracle-server setup:local
	NODE_ENV=local yarn workspace @human-protocol/fortune-exchange-oracle-server migration:run
	NODE_ENV=local yarn workspace @human-protocol/fortune-exchange-oracle-server start:dev

fortune-recording-oracle: rpc-health-check
	yarn workspace @human-protocol/fortune-recording-oracle setup:local
	NODE_ENV=local yarn workspace @human-protocol/fortune-recording-oracle start:dev

reputation-oracle: rpc-health-check
	yarn workspace @human-protocol/reputation-oracle setup:local
	NODE_ENV=local yarn workspace @human-protocol/reputation-oracle migration:run
	NODE_ENV=local yarn workspace @human-protocol/reputation-oracle start:dev

rpc-health-check:
	@until curl -s -X POST "http://localhost:8545" -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' | grep -q "result"; do \
		sleep 2; \
	done
	
fortune: check-core-folders minio
	@echo "RUNNING FORTUNE..."
	@trap 'echo "STOPPING FORTUNE.."; kill -9 $$PID_HARDHAT $$PID_JL_CLIENT $$PID_JL_SERVER $$PID_EXO $$PID_RECO $$PID_REPO; docker compose -f ./fortune/docker-compose.yml down; exit 0' SIGINT ERR; \
	$(MAKE) hardhat-node & PID_HARDHAT=$$!; \
	$(MAKE) job-launcher-client & PID_JL_CLIENT=$$!; \
	$(MAKE) job-launcher-server & PID_JL_SERVER=$$!; \
	$(MAKE) fortune-exchange-oracle & PID_EXO=$$!; \
	$(MAKE) fortune-recording-oracle & PID_RECO=$$!; \
	$(MAKE) reputation-oracle & PID_REPO=$$!; \
	$(MAKE) subgraph & \
	wait

web3-subgraph:
	docker compose -f ./web3/docker-compose.yml up -d graph-node
	NETWORK=localhost yarn workspace @human-protocol/subgraph generate
	@while [ $$(docker inspect --format='{{.State.Health.Status}}' graph-node) != "healthy" ]; do \
		sleep 2; \
	done; \
	echo "Container is healthy."
	yarn workspace @human-protocol/subgraph create-local
	yarn workspace @human-protocol/subgraph deploy-local

web3: check-core-folders
	@echo "RUNNING WEB3..."
	@trap 'echo "STOPPING WEB3.."; kill -9 $$PID_HARDHAT; docker compose -f ./web3/docker-compose.yml down; exit 0' SIGINT ERR; \
	$(MAKE) hardhat-node & PID_HARDHAT=$$!; \
	$(MAKE) web3-subgraph & \
	wait
