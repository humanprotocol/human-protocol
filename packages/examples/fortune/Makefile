local-docker: 
	cp .env.docker .env
	docker-compose up -d --build
	make deploy-contracts
network-docker: 
	docker-compose up -d --build
	docker rm -f ganache
deploy-contracts:
	cd ../../core && yarn && yarn deploy:local
test-docker: 
	docker-compose -f docker-compose.test.yml down
	docker-compose -f docker-compose.test.yml up -d --build
	make deploy-contracts
	yarn && yarn test:e2e:docker
	docker-compose -f docker-compose.test.yml down
