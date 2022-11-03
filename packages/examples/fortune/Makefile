local: compile-contracts
	make copy-contracts
	cp .env-example .env
	docker-compose up -d --build
	make deploy-contracts
network: compile-contracts
	make copy-contracts
	docker-compose up -d --build
	docker rm -f ganache
deploy-contracts:
	cd ../.. && yarn && yarn deploy
compile-contracts:
	cd ../.. && yarn && yarn compile
copy-contracts:
	cp -r ../../build ./launcher/src
	cp -r ../../build ./exchange/src
	cp -r ../../build ./recording-oracle/src
	cp -r ../../build ./reputation-oracle/src
test: compile-contracts
	make copy-contracts
	docker-compose -f docker-compose.test.yml up -d --build
	cd ../.. && yarn && yarn deploy
	cp -r ../../build ./tests/e2e-backend
	cd tests && yarn && yarn test:e2e-backend
